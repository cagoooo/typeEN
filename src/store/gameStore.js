import { create } from 'zustand';
import { encryptData, decryptData } from '../utils/crypto';

// Try to load initial guest data
const guestDataString = localStorage.getItem('typeEN_guestData');
const savedGuestData = guestDataString ? decryptData(guestDataString) : {};

// Try to load cached user profile to prevent flash of "not logged in"
const cachedProfileString = localStorage.getItem('typeEN_userProfile');
const cachedProfile = cachedProfileString ? decryptData(cachedProfileString) : null;

const saveGuestData = (state) => {
    // Only save core guest progressions, not game session states
    const dataToSave = {
        unlockedAchievements: state.unlockedAchievements,
        coins: state.coins,
        totalCompleted: state.totalCompleted,
        totalCoinsEarned: state.totalCoinsEarned,
        totalItemsBought: state.totalItemsBought,
        unlockedItems: state.unlockedItems,
        equippedBackground: state.equippedBackground,
        equippedEffect: state.equippedEffect,
        equippedBgm: state.equippedBgm,
        campaignUnlocked: state.campaignUnlocked
    };
    localStorage.setItem('typeEN_guestData', encryptData(dataToSave));
};

export const useGameStore = create((set, get) => ({
    mode: 'NORMAL',
    gameState: 'START', // START, PLAYING, END
    health: 10,
    combo: 0,
    maxCombo: 0,
    gameTime: 0,
    completedCount: 0,
    authInitialized: false, // Track if Firebase Auth has initialized

    // Campaign State
    campaignUnlocked: savedGuestData?.campaignUnlocked || ['1-1'],
    currentCampaignLevel: null,

    setCampaignProgress: (unlockedArray) => {
        set({ campaignUnlocked: unlockedArray });
        saveGuestData(get());
    },
    setCurrentCampaignLevel: (levelId) => set({ currentCampaignLevel: levelId }),

    // Achievements State
    unlockedAchievements: savedGuestData?.unlockedAchievements || [],
    newUnlocked: [],

    setUnlockedAchievements: (achievements) => {
        set({ unlockedAchievements: achievements });
        saveGuestData(get());
    },

    // User Profile Data
    userProfile: cachedProfile,
    coins: savedGuestData?.coins || 0,
    totalCompleted: savedGuestData?.totalCompleted || 0,
    totalCoinsEarned: savedGuestData?.totalCoinsEarned || 0,
    totalItemsBought: savedGuestData?.totalItemsBought || 0,

    // Shop & Settings state
    unlockedItems: savedGuestData?.unlockedItems || ['theme_cyber_yellow', 'effect_lightning'], // Give default items to prevent errors
    equippedBackground: savedGuestData?.equippedBackground || 'theme_cyber_yellow',
    equippedEffect: savedGuestData?.equippedEffect || 'effect_lightning',
    equippedBgm: savedGuestData?.equippedBgm || 'bgm_auto',

    setAuthInitialized: (initialized) => set({ authInitialized: initialized }),
    setUserProfile: (profile) => {
        set({ userProfile: profile });
        if (profile) {
            localStorage.setItem('typeEN_userProfile', encryptData(profile));
        } else {
            localStorage.removeItem('typeEN_userProfile');
        }
    },
    setCoins: (amount) => {
        set((state) => {
            const difference = amount - state.coins;
            return {
                userProfile: state.userProfile ? { ...state.userProfile, coins: amount } : null,
                coins: amount,
                totalCoinsEarned: difference > 0 ? state.totalCoinsEarned + difference : state.totalCoinsEarned
            };
        });
        saveGuestData(get());
    },

    setEquippedBgm: (bgmId) => {
        set({ equippedBgm: bgmId });
        saveGuestData(get());
    },

    setMode: (mode) => set({ mode }),
    setGameState: (state) => set({ gameState: state }),
    setHealth: (health) => set({ health }),

    deductHealth: (amount) => {
        set((state) => {
            const newHealth = Math.max(0, state.health - amount);
            return { health: newHealth };
        });
        return get().health;
    },

    heal: (amount) => set((state) => ({ health: Math.min(10, state.health + amount) })),

    resetCombo: () => set({ combo: 0 }),

    incrementCombo: () => {
        set((state) => {
            const next = state.combo + 1;
            return { combo: next, maxCombo: Math.max(state.maxCombo, next) };
        });
    },

    incrementTime: () => set((state) => ({ gameTime: state.gameTime + 1 })),

    incrementCompleted: () => {
        set((state) => ({
            completedCount: state.completedCount + 1,
            totalCompleted: state.totalCompleted + 1
        }));
        return get().completedCount;
    },

    resetGame: () => set({
        health: 10,
        combo: 0,
        gameTime: 0,
        completedCount: 0,
    }),

    unlockAchievement: (achievementId) => {
        const state = get();
        if (!state.unlockedAchievements.includes(achievementId)) {
            const newAchievements = [...state.unlockedAchievements, achievementId];
            set({
                unlockedAchievements: newAchievements,
                newUnlocked: [...state.newUnlocked, achievementId]
            });
            saveGuestData(get());
            return newAchievements; // Return to sync with Firestore later
        }
        return null;
    },

    clearNewUnlocked: () => set({ newUnlocked: [] }),

    purchaseItem: (itemId, price) => {
        const state = get();
        if (state.coins >= price && !state.unlockedItems.includes(itemId)) {
            set({
                coins: state.coins - price,
                unlockedItems: [...state.unlockedItems, itemId],
                totalItemsBought: state.totalItemsBought + 1
            });
            saveGuestData(get());
            return true;
        }
        return false;
    },

    equipItem: (itemId, type) => {
        const state = get();
        if (state.unlockedItems.includes(itemId)) {
            if (type === 'theme') {
                set({ equippedBackground: itemId });
            } else if (type === 'effect') {
                set({ equippedEffect: itemId });
            }
            saveGuestData(get());
        }
    },

    checkAchievements: () => {
        const state = get();
        const unlocked = [];
        const checkAndUnlock = (condition, id) => {
            if (condition && !state.unlockedAchievements.includes(id)) {
                unlocked.push(id);
                state.unlockAchievement(id);
            }
        };

        checkAndUnlock(state.completedCount >= 1, 'first_blood');
        checkAndUnlock(state.maxCombo >= 10, 'combo_10');
        checkAndUnlock(state.maxCombo >= 50, 'combo_50');
        checkAndUnlock(state.maxCombo >= 100, 'combo_100');
        checkAndUnlock(state.maxCombo >= 200, 'combo_200');
        checkAndUnlock(state.mode === 'ENDLESS' && state.gameTime >= 60, 'survive_60s');
        checkAndUnlock(state.mode === 'BEGINNER' && state.maxCombo >= 100, 'beginner_pro');
        checkAndUnlock(state.totalCompleted >= 1000, 'typewriter');
        checkAndUnlock(state.totalCoinsEarned >= 2000, 'millionaire');
        checkAndUnlock(state.totalItemsBought >= 5, 'shopaholic');

        return unlocked;
    }
}));
