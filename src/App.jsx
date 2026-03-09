import React, { useState, useEffect, useRef } from 'react';
import GameArea from './components/GameArea';
import Leaderboard from './components/Leaderboard';
import { useGameStore } from './store/gameStore';
import { Trophy, LogIn, LogOut, User as UserIcon, Award, ShoppingCart, Share2, Users, Fingerprint } from 'lucide-react';
import { subscribeToAuth, loginWithGoogle, logout, getUserProfile, syncStatsToCloud, syncAchievementsToCloud, upgradeToTeacher, joinClassUser, ensureUserDocument } from './utils/userService';
import AchievementToast from './components/AchievementToast';
import AchievementDashboard from './components/AchievementDashboard';
import Shop from './components/Shop';
import TeacherDashboard from './components/TeacherDashboard';
import JoinClassModal from './components/JoinClassModal';
import SharedProfile from './components/SharedProfile';
import SharePreview from './components/SharePreview';
import CampaignMap from './components/CampaignMap';
import StoryCutscene from './components/StoryCutscene';
import { CAMPAIGN_LEVELS } from './utils/levels';
import { encryptData, decryptData } from './utils/crypto';

function App() {
    // Use individual selectors to prevent re-rendering every time the gameTime ticks
    const gameState = useGameStore(state => state.gameState);
    const setGameState = useGameStore(state => state.setGameState);
    const setMode = useGameStore(state => state.setMode);
    const resetGame = useGameStore(state => state.resetGame);

    const [gameResult, setGameResult] = useState(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [showAchievements, setShowAchievements] = useState(false);
    const [showShop, setShowShop] = useState(false);
    const [showTeacherDashboard, setShowTeacherDashboard] = useState(false);
    const [showJoinClassModal, setShowJoinClassModal] = useState(false);
    const [sharedUid, setSharedUid] = useState(null);
    const [showSharePreview, setShowSharePreview] = useState(false);
    const [toastMsg, setToastMsg] = useState(null);

    const showToast = (msg) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

    const handleLogin = async () => {
        try {
            await loginWithGoogle();
            showToast('登入成功！');
        } catch (error) {
            console.error("Login Error:", error);
            showToast('登入失敗或已取消');
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            showToast('已成功登出');
        } catch (error) {
            console.error("Logout Error:", error);
            showToast('登出失敗');
        }
    };
    // --- Teacher Long Press Logic ---
    const pressTimerRef = useRef(null);
    const [isTeacherPressing, setIsTeacherPressing] = useState(false);

    // Custom Modal States
    const [showTeacherPrompt, setShowTeacherPrompt] = useState(false);
    const [teacherCodeInput, setTeacherCodeInput] = useState('');

    const startTeacherPress = () => {
        if (!userProfile || userProfile.role === 'teacher') return;

        console.log("[Teacher LongPress] Started");
        setIsTeacherPressing(true);

        // Trigger after exactly 3000ms
        pressTimerRef.current = setTimeout(() => {
            console.log("[Teacher LongPress] Triggered!");
            setIsTeacherPressing(false);
            triggerTeacherUpgrade();
        }, 3000);
    };

    const clearTeacherPress = () => {
        if (pressTimerRef.current) {
            console.log("[Teacher LongPress] Cleared / Interrupted");
        }
        setIsTeacherPressing(false);
        if (pressTimerRef.current) {
            clearTimeout(pressTimerRef.current);
            pressTimerRef.current = null;
        }
    };

    const triggerTeacherUpgrade = () => {
        setTeacherCodeInput('');
        setShowTeacherPrompt(true);
    };

    const submitTeacherUpgrade = async () => {
        if (!teacherCodeInput.trim()) return;

        const success = await upgradeToTeacher(userProfile.uid, teacherCodeInput);
        if (success) {
            showToast('✅ 密碼正確！已為您開通導師專屬權限！');
            const updatedProfile = await getUserProfile(userProfile.uid);
            setUserProfile(updatedProfile);
            setShowTeacherPrompt(false);
        } else {
            showToast('❌ 驗證失敗，權限代碼錯誤。');
            setTeacherCodeInput('');
        }
    };

    const [bestStats, setBestStats] = useState({
        beginnerTime: 999, beginnerCombo: 0,
        normalTime: 999, normalCombo: 0,
        endlessTime: 0, endlessCombo: 0,
        wordTime: 999, wordCombo: 0
    });

    const userProfile = useGameStore(state => state.userProfile);
    const setUserProfile = useGameStore(state => state.setUserProfile);

    // Initial auth listener
    useEffect(() => {
        const unsubscribe = subscribeToAuth(async (user) => {
            if (user) {
                // Ensure document exists to avoid race condition on first login
                await ensureUserDocument(user);

                // User is signed in
                const profile = await getUserProfile(user.uid);
                setUserProfile(profile);

                // Check if there's a pending class code
                const pendingClassCode = sessionStorage.getItem('pendingClassCode');
                if (pendingClassCode) {
                    const result = await joinClassUser(user.uid, pendingClassCode);
                    if (result.success) {
                        showToast(result.message);
                        // Refresh profile after joining class
                        const updatedProfile = await getUserProfile(user.uid);
                        setUserProfile(updatedProfile);
                    } else {
                        showToast(result.message);
                    }
                    sessionStorage.removeItem('pendingClassCode');
                }

                // Sync local stats to cloud
                const savedLocal = localStorage.getItem('typeEN_stats');
                if (savedLocal) {
                    const localStats = decryptData(savedLocal);
                    if (localStats) {
                        const mergedStats = await syncStatsToCloud(user.uid, localStats);
                        if (mergedStats) {
                            setBestStats(mergedStats);
                            localStorage.setItem('typeEN_stats', encryptData(mergedStats));
                        }
                    }
                } else if (profile?.stats) {
                    // Load stats from cloud if no local
                    setBestStats(profile.stats);
                    localStorage.setItem('typeEN_stats', encryptData(profile.stats));
                }

                // Load achievements
                if (profile?.achievements) {
                    useGameStore.getState().setUnlockedAchievements(profile.achievements);
                }

                // Load shop database
                if (profile?.unlockedItems !== undefined || profile?.coins !== undefined) {
                    useGameStore.setState(state => ({
                        unlockedItems: profile.unlockedItems || state.unlockedItems,
                        equippedBackground: profile.equippedBackground || state.equippedBackground,
                        equippedEffect: profile.equippedEffect || state.equippedEffect,
                        coins: profile.coins !== undefined ? profile.coins : state.coins
                    }));
                }

            } else {
                // User signed out
                setUserProfile(null);
                useGameStore.getState().setUnlockedAchievements([]);

                // If NOT signed in but has pending code, prompt user
                const pendingClassCode = sessionStorage.getItem('pendingClassCode');
                if (pendingClassCode) {
                    showToast(`🔍偵測到班級代碼 ${pendingClassCode}，請點擊螢幕右上角登入以自動加入班級。`);
                }
            }
        });

        return () => unsubscribe();
    }, [setUserProfile]);

    useEffect(() => {
        // Check URL for shared profile
        const urlParams = new URLSearchParams(window.location.search);
        const uidParam = urlParams.get('uid');
        if (uidParam) {
            setSharedUid(uidParam);
            useGameStore.getState().setGameState('SHARED_PROFILE');
        }

        // Check URL for class code
        const classCodeParam = urlParams.get('classCode');
        if (classCodeParam) {
            sessionStorage.setItem('pendingClassCode', classCodeParam);
            // Clean URL gracefully
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }

        // Load high scores from local storage
        const saved = localStorage.getItem('typeEN_stats');
        if (saved) {
            const parsed = decryptData(saved);
            if (parsed) setBestStats(parsed);
        }
    }, []);

    const startGame = (mode) => {
        setMode(mode);
        resetGame();
        setGameState('PLAYING');
        setGameResult(null);
    };


    const handleGameEnd = React.useCallback((isWin, extraData = {}) => {
        const state = useGameStore.getState();
        const result = {
            isWin,
            time: state.gameTime,
            completed: state.completedCount,
            maxCombo: state.maxCombo,
            missedLetters: extraData.missedLetters || {}
        };

        setGameResult(result);
        setGameState('END');

        // Trigger achievements check
        const unlocked = state.checkAchievements();

        // Calculate and award coins
        let earnedCoins = 0;
        if (isWin || state.mode === 'ENDLESS') {
            earnedCoins = Math.floor(state.maxCombo / 2) + Math.floor(state.completedCount / 5);
            if (state.mode === 'ENDLESS') earnedCoins += Math.floor(state.gameTime / 10);

            if (earnedCoins > 0) {
                const currentCoins = state.coins || 0;
                state.setCoins(currentCoins + earnedCoins);
            }
        }

        // Save achievements to user profile if user is logged in
        if (unlocked.length > 0) {
            const currentUser = useGameStore.getState().userProfile;
            if (currentUser && currentUser.uid) {
                syncAchievementsToCloud(currentUser.uid, state.unlockedAchievements);
            }
        }

        if (state.mode === 'BEGINNER' && result.isWin) {
            let newStats = { ...bestStats };
            let improved = false;
            // Beginner logic: we want lowest time and highest combo, just like normal
            if (result.time < (bestStats.beginnerTime || 999)) {
                newStats.beginnerTime = result.time;
                improved = true;
            }
            if (result.maxCombo > (bestStats.beginnerCombo || 0)) {
                newStats.beginnerCombo = result.maxCombo;
                improved = true;
            }
            if (improved) {
                setBestStats(newStats);
                localStorage.setItem('typeEN_stats', encryptData(newStats));
            }
        } else if (state.mode === 'NORMAL' && result.isWin) {
            let newStats = { ...bestStats };
            let improved = false;
            if (result.time < bestStats.normalTime) {
                newStats.normalTime = result.time;
                improved = true;
            }
            if (result.maxCombo > bestStats.normalCombo) {
                newStats.normalCombo = result.maxCombo;
                improved = true;
            }
            if (improved) {
                setBestStats(newStats);
                localStorage.setItem('typeEN_stats', encryptData(newStats));
            }
        } else if (state.mode === 'ENDLESS') {
            let newStats = { ...bestStats };
            let improved = false;
            // Endless tracks MAX time survived
            if (result.time > bestStats.endlessTime) {
                newStats.endlessTime = result.time;
                improved = true;
            }
            if (result.maxCombo > bestStats.endlessCombo) {
                newStats.endlessCombo = result.maxCombo;
                improved = true;
            }
            if (improved) {
                setBestStats(newStats);
                localStorage.setItem('typeEN_stats', encryptData(newStats));
            }
        } else if (state.mode === 'WORD' && result.isWin) {
            let newStats = { ...bestStats };
            let improved = false;
            if (result.time < (bestStats.wordTime || 999)) {
                newStats.wordTime = result.time;
                improved = true;
            }
            if (result.maxCombo > (bestStats.wordCombo || 0)) {
                newStats.wordCombo = result.maxCombo;
                improved = true;
            }
            if (improved) {
                setBestStats(newStats);
                localStorage.setItem('typeEN_stats', encryptData(newStats));
            }
        } else if (state.mode === 'CAMPAIGN' && result.isWin) {
            const currentIdx = CAMPAIGN_LEVELS.findIndex(l => l.id === state.currentCampaignLevel);
            if (currentIdx !== -1 && currentIdx < CAMPAIGN_LEVELS.length - 1) {
                const nextLevelId = CAMPAIGN_LEVELS[currentIdx + 1].id;
                if (!state.campaignUnlocked.includes(nextLevelId)) {
                    state.setCampaignProgress([...state.campaignUnlocked, nextLevelId]);
                }
            }
        }

        // Sync to cloud if logged in (for updated stats or new coins)
        const currentUser = useGameStore.getState().userProfile;
        if (currentUser && currentUser.uid) {
            // Push updated stats
            const stateNow = useGameStore.getState();
            syncStatsToCloud(currentUser.uid, stateNow.bestStats || bestStats);

            // Update coins directly 
            if (earnedCoins > 0) {
                import('firebase/firestore').then(({ doc, updateDoc }) => {
                    import('./utils/firebase').then(({ db }) => {
                        const userRef = doc(db, 'users', currentUser.uid);
                        updateDoc(userRef, { coins: stateNow.coins }).catch(e => console.error("Error updating coins", e));
                    });
                });
            }
        }
    }, [bestStats, setGameState]);

    return (
        <div className="w-full h-screen bg-gray-950 flex flex-col items-center justify-center font-sans overflow-hidden">
            {/* CRT Overlay Effects */}
            <div className="crt-vignette"></div>
            <div className="crt-overlay"></div>
            <AchievementToast />

            {/* Campaign Map */}
            {gameState === 'CAMPAIGN_MAP' && <CampaignMap />}

            {/* Story Cutscene */}
            {gameState === 'STORY' && <StoryCutscene />}

            {/* Start Screen */}
            {gameState === 'START' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm">
                    <div className="relative text-center p-10 rounded-3xl border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)] bg-gray-950/80 z-10 w-11/12 max-w-4xl">
                        <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 mb-6 font-['Press_Start_2P'] drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] leading-tight">
                            NEON<br />TYPER
                        </h1>
                        <p className="text-xl text-gray-300 mb-6 max-w-md mx-auto">
                            在霓虹字母落到底部前，使用正確的手指按下對應的英文字母鍵！
                        </p>

                        {/* User Profile Bar (Centered) */}
                        <div className="flex justify-center mb-8 z-20">
                            {userProfile ? (
                                <div className="flex items-center gap-4 bg-gray-950/80 p-3 rounded-full border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)] backdrop-blur-md relative overflow-hidden group/profile">
                                    {/* Long Press Progress Bar (CSS Animated) */}
                                    <div
                                        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 pointer-events-none transition-all ease-linear ${isTeacherPressing ? 'w-full duration-[3000ms]' : 'w-0 duration-[100ms]'
                                            }`}
                                    />
                                    <div
                                        className="flex items-center gap-3 pl-2 cursor-pointer select-none touch-none hover:bg-white/5 rounded-full transition-colors pr-2 py-1 -ml-2 -my-1"
                                        onMouseDown={startTeacherPress}
                                        onMouseUp={clearTeacherPress}
                                        onMouseLeave={clearTeacherPress}
                                        onTouchStart={startTeacherPress}
                                        onTouchEnd={clearTeacherPress}
                                        onTouchCancel={clearTeacherPress}
                                        onContextMenu={(e) => {
                                            if (isTeacherPressing) e.preventDefault();
                                        }}
                                        title={userProfile.role === 'teacher' ? '導師權限已開通' : '長按 3 秒解鎖隱藏功能'}
                                    >
                                        {userProfile.photoURL ? (
                                            <img src={userProfile.photoURL} alt="User avatar" draggable="false" className="w-10 h-10 rounded-full border border-indigo-400 select-none" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-indigo-900 flex items-center justify-center border border-indigo-400">
                                                <UserIcon className="w-6 h-6 text-indigo-300" />
                                            </div>
                                        )}
                                        <div className="flex flex-col pr-2 hidden sm:flex text-left relative group">
                                            <span className="text-white font-bold text-sm transition-colors flex items-center gap-1 group-hover:text-indigo-300">
                                                {userProfile.displayName || '特工'}
                                                {userProfile.role === 'teacher' && <span className="text-[10px] text-emerald-400 border border-emerald-500/50 bg-emerald-500/20 px-1 rounded">導師</span>}
                                            </span>
                                            <div className="flex items-center gap-1 text-xs font-['Orbitron'] text-yellow-400">
                                                <span>🪙 {userProfile.coins || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {userProfile.role === 'teacher' && (
                                            <button
                                                onClick={() => setShowTeacherDashboard(true)}
                                                className="p-2 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 rounded-full transition-colors"
                                                title="開啟導師專區"
                                            >
                                                <Users className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowJoinClassModal(true)}
                                            className="p-2 bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-500 rounded-full transition-colors"
                                            title="加入班級"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setShowSharePreview(true)}
                                            className="p-2 bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-400 rounded-full transition-colors"
                                            title="分享我的成績"
                                        >
                                            <Share2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-full transition-colors"
                                            title="登出"
                                        >
                                            <LogOut className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleLogin}
                                    className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-full shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all hover:scale-105"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        <path fill="none" d="M1 1h22v22H1z" />
                                    </svg>
                                    登入同步紀錄
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-4 justify-center items-center max-w-2xl mx-auto">
                            <button
                                onClick={() => setGameState('CAMPAIGN_MAP')}
                                className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full text-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-95 tracking-wider w-full md:w-auto"
                            >
                                劇情戰役
                            </button>
                            <button
                                onClick={() => startGame('BEGINNER')}
                                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full text-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] active:scale-95 tracking-wider w-full md:w-auto"
                            >
                                初學者模式
                            </button>
                            <button
                                onClick={() => startGame('NORMAL')}
                                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full text-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] active:scale-95 tracking-wider w-full md:w-auto"
                            >
                                一般模式
                            </button>
                            <button
                                onClick={() => startGame('ENDLESS')}
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full text-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] active:scale-95 tracking-wider w-full md:w-auto"
                            >
                                無盡生存
                            </button>
                            <button
                                onClick={() => startGame('WORD')}
                                className="px-8 py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-full text-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] active:scale-95 tracking-wider w-full md:w-auto"
                            >
                                單字挑戰
                            </button>
                        </div>

                        <div className="mt-8 flex justify-center gap-4 flex-wrap">
                            <button
                                onClick={() => setShowLeaderboard(true)}
                                className="flex items-center gap-2 px-6 py-2 border-2 border-yellow-500/50 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-bold rounded-full text-lg transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(250,204,21,0.2)] hover:shadow-[0_0_25px_rgba(250,204,21,0.5)] cursor-pointer"
                            >
                                <Trophy className="w-5 h-5" /> 全球英雄榜 (Leaderboard)
                            </button>
                            <button
                                onClick={() => setShowAchievements(true)}
                                className="flex items-center gap-2 px-6 py-2 border-2 border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold rounded-full text-lg transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] cursor-pointer"
                            >
                                <Award className="w-5 h-5" /> 成就大廳 (Achievements)
                            </button>
                            <button
                                onClick={() => setShowShop(true)}
                                className="flex items-center gap-2 px-6 py-2 border-2 border-fuchsia-500/50 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 font-bold rounded-full text-lg transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(217,70,239,0.2)] hover:shadow-[0_0_25px_rgba(217,70,239,0.5)] cursor-pointer"
                            >
                                <ShoppingCart className="w-5 h-5" /> 霓虹商城 (Shop)
                            </button>
                        </div>
                        <div className="mt-8 pt-6 border-t border-gray-800 text-gray-400 grid grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-center">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-emerald-400 font-bold">[初學者]</span>
                                <div className="space-x-3">
                                    <span>🏆 <span className="text-emerald-300 font-bold">{(!bestStats.beginnerTime || bestStats.beginnerTime === 999) ? '--' : `${bestStats.beginnerTime}s`}</span></span>
                                    <span>🔥 <span className="text-orange-400 font-bold">{bestStats.beginnerCombo || 0}</span></span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-indigo-400 font-bold">[一般模式]</span>
                                <div className="space-x-3">
                                    <span>🏆 <span className="text-indigo-300 font-bold">{bestStats.normalTime === 999 ? '--' : `${bestStats.normalTime}s`}</span></span>
                                    <span>🔥 <span className="text-orange-400 font-bold">{bestStats.normalCombo}</span></span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-purple-400 font-bold">[無盡生存]</span>
                                <div className="space-x-3">
                                    <span>🏆 存活 <span className="text-purple-300 font-bold">{bestStats.endlessTime}s</span></span>
                                    <span>🔥 <span className="text-orange-400 font-bold">{bestStats.endlessCombo}</span></span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-yellow-400 font-bold">[單字挑戰]</span>
                                <div className="space-x-3">
                                    <span>🏆 <span className="text-yellow-300 font-bold">{(!bestStats.wordTime || bestStats.wordTime === 999) ? '--' : `${bestStats.wordTime}s`}</span></span>
                                    <span>🔥 <span className="text-orange-400 font-bold">{bestStats.wordCombo || 0}</span></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Engine */}
            {gameState === 'PLAYING' && (
                <GameArea onGameEnd={handleGameEnd} />
            )}

            {/* End Screen */}
            {gameState === 'END' && gameResult && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm">
                    <div className="relative text-center p-10 rounded-3xl border border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)] bg-gray-950/80 z-10">
                        {gameResult.isWin ? (
                            <h2 className="text-4xl md:text-5xl font-bold text-green-400 mb-8 drop-shadow-[0_0_15px_rgba(74,222,128,0.5)] leading-relaxed tracking-wider">
                                闖關成功！
                            </h2>
                        ) : (
                            <h2 className="text-4xl md:text-5xl font-bold text-red-500 mb-8 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] leading-relaxed tracking-wider">
                                遊戲結束
                            </h2>
                        )}

                        <div className="text-xl text-gray-300 mb-8 space-y-3 font-['Orbitron']">
                            <p>完成進度: <span className="text-white font-bold">{gameResult.completed} {useGameStore.getState().mode === 'ENDLESS' ? '' : '/ 26'}</span></p>
                            {gameResult.isWin && (
                                <p>通關時間: <span className="text-white font-bold">{gameResult.time} 秒</span></p>
                            )}
                            <p>最高連擊: <span className="text-orange-400 font-bold">{gameResult.maxCombo}</span></p>
                        </div>

                        {useGameStore.getState().mode === 'BEGINNER' && gameResult.isWin && (
                            <div className="mt-6 mb-8 text-left bg-slate-800/80 p-6 rounded-xl border border-slate-600 shadow-inner">
                                <h3 className="text-emerald-400 font-bold text-xl mb-4 font-sans border-b border-slate-600 pb-2">🎯 專屬初學者建議</h3>
                                {Object.keys(gameResult.missedLetters || {}).length > 0 ? (
                                    <div className="space-y-3 font-sans text-gray-300 text-sm md:text-base leading-relaxed">
                                        <p><span className="text-emerald-300 font-bold">1. 找尋按鍵：</span> 某些字母似乎花了比較多時間找，下次可以先在鍵盤上確認好它的位置再按喔！</p>
                                        <p><span className="text-emerald-300 font-bold">2. 指法建議：</span> 盡量使用正確的指法，不要只用一根手指頭按（一指神功），可以參考遊戲下方的虛擬鍵盤提示！</p>
                                        <p className="pt-2"><span className="text-emerald-300 font-bold">3. 錯過的字母：</span> 這次漏掉比較多次的字母有：<br />
                                            <span className="text-red-400 font-bold text-lg inline-block mt-1 tracking-wide">
                                                {Object.entries(gameResult.missedLetters)
                                                    .sort((a, b) => b[1] - a[1])
                                                    .map(([char, count]) => `${char} (${count}次)`)
                                                    .join(', ')}
                                            </span>
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 font-sans text-gray-300 text-sm md:text-base leading-relaxed">
                                        <p className="text-lg"><span className="text-yellow-400 font-bold">🌟 完美通關！</span> 你一個字母都沒有漏掉，找按鍵的速度非常快！</p>
                                        <p>繼續保持這個手感，挑戰把速度變快的「一般模式」吧！</p>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-4 justify-center mt-6">
                            {useGameStore.getState().mode === 'CAMPAIGN' ? (
                                <button
                                    onClick={() => setGameState('CAMPAIGN_MAP')}
                                    className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full text-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] active:scale-95 tracking-wider"
                                >
                                    戰役中心 (Map)
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => startGame(useGameStore.getState().mode)}
                                        className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full text-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] active:scale-95 tracking-wider"
                                    >
                                        再玩一次
                                    </button>
                                    <button
                                        onClick={() => setGameState('START')}
                                        className="px-8 py-4 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-full text-xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(156,163,175,0.6)] active:scale-95 tracking-wider"
                                    >
                                        回主選單
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Leaderboard Modal */}
            {showLeaderboard && (
                <Leaderboard onClose={() => setShowLeaderboard(false)} />
            )}

            {/* Achievements Modal */}
            {showAchievements && (
                <AchievementDashboard onClose={() => setShowAchievements(false)} />
            )}

            {/* Shop Modal */}
            {showShop && (
                <Shop onClose={() => setShowShop(false)} />
            )}

            {/* Teacher Dashboard */}
            {showTeacherDashboard && userProfile && (
                <TeacherDashboard
                    userProfile={userProfile}
                    onClose={() => setShowTeacherDashboard(false)}
                />
            )}

            {/* Join Class Modal */}
            {showJoinClassModal && userProfile && (
                <JoinClassModal
                    userProfile={userProfile}
                    onClose={() => setShowJoinClassModal(false)}
                    onJoinSuccess={async (msg) => {
                        showToast(msg);
                        const updated = await getUserProfile(userProfile.uid);
                        setUserProfile(updated);
                    }}
                />
            )}

            {/* Share Preview Modal */}
            {showSharePreview && userProfile && (
                <SharePreview
                    profile={userProfile}
                    onClose={() => setShowSharePreview(false)}
                    onShare={() => {
                        const shareUrl = `${window.location.origin}${window.location.pathname}?uid=${userProfile.uid}`;
                        navigator.clipboard.writeText(shareUrl).then(() => {
                            setShowSharePreview(false);
                            showToast('個人成績網址已複製到剪貼簿！📋');
                        });
                    }}
                />
            )}

            {/* Shared Profile View */}
            {gameState === 'SHARED_PROFILE' && sharedUid && (
                <SharedProfile
                    uid={sharedUid}
                    onBack={() => {
                        window.history.pushState({}, '', window.location.pathname);
                        setSharedUid(null);
                        setGameState('START');
                    }}
                />
            )}

            {/* Toast Notification */}
            {toastMsg && (
                <div className="fixed top-20 left-0 w-full flex justify-center z-[100] pointer-events-none">
                    <div className="animate-bounce">
                        <div className="bg-indigo-600/90 text-white px-6 py-3 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)] backdrop-blur-md border border-indigo-400 font-sans font-bold whitespace-nowrap flex items-center gap-2">
                            ✨ {toastMsg}
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Teacher Upgrade Prompt Modal */}
            {showTeacherPrompt && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
                    <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl shadow-[0_0_40px_rgba(16,185,129,0.2)] p-6 max-w-sm w-full animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-emerald-500/20 rounded-full border border-emerald-500/50">
                                <Fingerprint className="w-8 h-8 text-emerald-400" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 text-center mb-2">
                            發現隱藏入口！
                        </h3>
                        <p className="text-gray-400 text-sm text-center mb-6">
                            請輸入導師認證密碼開啟權限。<br />(非教練或導師請按取消)
                        </p>

                        <input
                            type="password"
                            autoFocus
                            value={teacherCodeInput}
                            onChange={(e) => setTeacherCodeInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') submitTeacherUpgrade();
                                if (e.key === 'Escape') setShowTeacherPrompt(false);
                            }}
                            placeholder="請輸入密碼..."
                            className="w-full bg-gray-950 border border-emerald-500/30 rounded-lg px-4 py-3 text-emerald-300 font-mono text-center focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/50 mb-6 transition-all"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowTeacherPrompt(false)}
                                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 font-bold hover:bg-gray-700 transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={submitTeacherUpgrade}
                                className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all active:scale-95"
                            >
                                驗證
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
