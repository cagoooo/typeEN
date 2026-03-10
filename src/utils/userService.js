import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc, query, where, getDocs, orderBy, arrayUnion, increment } from 'firebase/firestore';

const USERS_COLLECTION = 'users';
const CLASSES_COLLECTION = 'classes';

// Monitor auth state
export const subscribeToAuth = (callback) => {
    return onAuthStateChanged(auth, (user) => {
        callback(user);
    });
};

// Login with Google
export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        // Ensure user document exists in Firestore
        await ensureUserDocument(user);

        return user;
    } catch (error) {
        console.error("Error during Google Sign In:", error);
        throw error;
    }
};

// Logout
export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error during sign out:", error);
        throw error;
    }
};

// Create or update user document upon login
export const ensureUserDocument = async (user) => {
    const userRef = doc(db, USERS_COLLECTION, user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        // Create initial user profile
        await setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            coins: 0,
            achievements: [],
            joinedClasses: [],
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            stats: {
                beginnerTime: 999,
                normalTime: 999,
                endlessTime: 0,
                wordTime: 999
            }
        });
    } else {
        // Update last login
        await updateDoc(userRef, {
            lastLogin: serverTimestamp(),
            displayName: user.displayName, // Update in case they changed it
            photoURL: user.photoURL
        });
    }
};

// Fetch user profile data
export const getUserProfile = async (uid) => {
    if (!uid) return null;
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return userSnap.data();
    }
    return null;
};

// Sync local stats to Firestore (merging best scores)
export const syncStatsToCloud = async (uid, localStats) => {
    if (!uid) return;
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const cloudStats = userSnap.data().stats || {};

        // Merge logic: keep the best records
        const mergedStats = {
            ...cloudStats, // keep properties like playCount and totalPlayTime unaffected by this blind merge
            beginnerTime: Math.min(localStats.beginnerTime || 999, cloudStats.beginnerTime || 999),
            normalTime: Math.min(localStats.normalTime || 999, cloudStats.normalTime || 999),
            wordTime: Math.min(localStats.wordTime || 999, cloudStats.wordTime || 999),
            endlessTime: Math.max(localStats.endlessTime || 0, cloudStats.endlessTime || 0),

            beginnerCombo: Math.max(localStats.beginnerCombo || 0, cloudStats.beginnerCombo || 0),
            normalCombo: Math.max(localStats.normalCombo || 0, cloudStats.normalCombo || 0),
            wordCombo: Math.max(localStats.wordCombo || 0, cloudStats.wordCombo || 0),
            endlessCombo: Math.max(localStats.endlessCombo || 0, cloudStats.endlessCombo || 0),

            beginnerCompleted: Math.max(localStats.beginnerCompleted || 0, cloudStats.beginnerCompleted || 0),
            normalCompleted: Math.max(localStats.normalCompleted || 0, cloudStats.normalCompleted || 0),
            wordCompleted: Math.max(localStats.wordCompleted || 0, cloudStats.wordCompleted || 0),
            endlessCompleted: Math.max(localStats.endlessCompleted || 0, cloudStats.endlessCompleted || 0),
        };

        await updateDoc(userRef, {
            stats: mergedStats,
            lastSyncedAt: serverTimestamp()
        });

        return mergedStats;
    }
};

// Increment user effort (play count and total playtime)
export const incrementUserEffort = async (uid, playTimeSeconds) => {
    if (!uid) return;
    try {
        const userRef = doc(db, USERS_COLLECTION, uid);
        await updateDoc(userRef, {
            "stats.playCount": increment(1),
            "stats.totalPlayTime": increment(playTimeSeconds || 0)
        });
    } catch (e) {
        console.error("Failed to increment user effort", e);
    }
};

// Update specific stats (e.g. adding coins)
export const updateUserCoins = async (uid, amountToAdd) => {
    if (!uid) return;
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const currentCoins = userSnap.data().coins || 0;
        await updateDoc(userRef, {
            coins: currentCoins + amountToAdd
        });
        return currentCoins + amountToAdd;
    }
    return 0;
};

// Sync unlocked achievements to Firestore
export const syncAchievementsToCloud = async (uid, newAchievementsList) => {
    if (!uid) return;
    const userRef = doc(db, USERS_COLLECTION, uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const currentCloud = userSnap.data().achievements || [];
        // Merge arrays uniquely
        const merged = Array.from(new Set([...currentCloud, ...newAchievementsList]));

        await updateDoc(userRef, {
            achievements: merged,
            lastSyncedAt: serverTimestamp()
        });

        return merged;
    }
    return newAchievementsList;
};

// Sync shop items to Firestore
export const syncShopToCloud = async (uid, shopData) => {
    if (!uid) return;
    const userRef = doc(db, USERS_COLLECTION, uid);

    // shopData = { unlockedItems, equippedBackground, equippedEffect, coins (optional to update here) }
    await updateDoc(userRef, {
        ...shopData,
        lastSyncedAt: serverTimestamp()
    });
};

// Upgrade user to teacher role
export const upgradeToTeacher = async (uid, secretInput) => {
    if (!uid) return false;
    const correctSecret = import.meta.env.VITE_TEACHER_SECRET;

    if (secretInput && correctSecret && secretInput.trim() === correctSecret.trim()) {
        const userRef = doc(db, USERS_COLLECTION, uid);
        await updateDoc(userRef, {
            role: 'teacher'
        });
        return true;
    }
    return false;
};

// ================= CLASSS & TEACHER APIS =================

// Create a new class
export const createClass = async (teacherUid, className) => {
    if (!teacherUid || !className.trim()) return null;
    try {
        // Generate 6-char random code
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newClassRef = await addDoc(collection(db, CLASSES_COLLECTION), {
            name: className.trim(),
            code,
            teacherUid,
            createdAt: serverTimestamp()
        });
        return { id: newClassRef.id, name: className.trim(), code };
    } catch (e) {
        console.error("Error creating class:", e);
        return null;
    }
};

// Get classes created by teacher
export const getTeacherClasses = async (teacherUid) => {
    if (!teacherUid) return [];
    try {
        const q = query(
            collection(db, CLASSES_COLLECTION),
            where("teacherUid", "==", teacherUid),
            orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error("Error fetching classes:", e);
        return [];
    }
};

// Get students in a class
export const getClassStudents = async (classId) => {
    if (!classId) return [];
    try {
        const q = query(
            collection(db, USERS_COLLECTION),
            where("joinedClasses", "array-contains", classId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data());
    } catch (e) {
        console.error("Error fetching students:", e);
        return [];
    }
};

// Join a class by code (Student action)
export const joinClassUser = async (uid, code) => {
    if (!uid || !code.trim()) return { success: false, message: "無效代碼" };
    try {
        const q = query(
            collection(db, CLASSES_COLLECTION),
            where("code", "==", code.trim().toUpperCase())
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            return { success: false, message: "找不到該班級代碼" };
        }

        const classDoc = snapshot.docs[0];
        const classId = classDoc.id;
        const classData = classDoc.data();

        const userRef = doc(db, USERS_COLLECTION, uid);
        await updateDoc(userRef, {
            joinedClasses: arrayUnion(classId)
        });

        return { success: true, message: `成功加入 ${classData.name}！`, className: classData.name };
    } catch (e) {
        console.error("Error joining class:", e);
        return { success: false, message: "加入失敗，發生錯誤" };
    }
};
