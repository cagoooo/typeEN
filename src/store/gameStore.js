import { create } from 'zustand';
import { encryptData, decryptData } from '../utils/crypto';
import { APPEARANCE_ITEMS } from '../utils/constants';

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
        campaignUnlocked: state.campaignUnlocked,
        streak: state.streak,
        dailyQuests: state.dailyQuests,
        consumables: state.consumables,
        appearance: state.appearance,
        unlockedAvatars: state.unlockedAvatars,
        unlockedBorders: state.unlockedBorders,
        unlockedTitles: state.unlockedTitles,
        coins: state.coins,
        unlockedItems: state.unlockedItems,
        advancedClearCount: state.advancedClearCount,
        advancedSubsetUnlocked: state.advancedSubsetUnlocked,
        missedLettersMap: state.missedLettersMap
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

    campaignUnlocked: savedGuestData?.campaignUnlocked || ['1-1'],
    currentCampaignLevel: null,

    // ADVANCED progression counters (for achievements & unlocks)
    advancedClearCount: savedGuestData?.advancedClearCount || 0,
    // 'all' is always available so confident students aren't gated; rows are the
    // learning ladder ('home' is the entry → 'top' → 'bottom' → 'index').
    advancedSubsetUnlocked: savedGuestData?.advancedSubsetUnlocked || ['all', 'home'],
    lastAdvancedRunSummary: { perfect: false, isFullKeyboard: false, subsetId: null }, // transient, populated by GameArea on game end

    // Coin Economy & Phase 6 State
    streak: savedGuestData?.streak || { count: 0, lastDate: null },
    dailyQuests: savedGuestData?.dailyQuests || { date: null, tasks: [] },
    consumables: savedGuestData?.consumables || { shield: 0, timeFreeze: 0, booster: 0 },
    appearance: savedGuestData?.appearance || { avatar: 'default', border: 'none', title: '新手打字員' },
    unlockedAvatars: savedGuestData?.unlockedAvatars || ['default'],
    unlockedBorders: savedGuestData?.unlockedBorders || ['none'],
    unlockedTitles: savedGuestData?.unlockedTitles || ['新手打字員'],
    showDailyBonus: false,
    lastDailyBonusAmount: 0,
    activeBoosters: { coinMultiplier: 1, endTime: 0 },
    isShieldActive: false,
    isTimeFrozen: false,

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
    unlockedItems: savedGuestData?.unlockedItems || ['theme_cyber_yellow', 'effect_lightning'],
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

    // ADVANCED mode practice subset (null = full alphabet)
    practiceSubset: null,
    practiceSubsetId: null, // tracks which preset id is active (for unlock logic)
    setPracticeSubset: (subset, id = null) => set({ practiceSubset: subset, practiceSubsetId: id }),

    // 0.3 cumulative miss tracking — letter -> total missed count across runs
    missedLettersMap: savedGuestData?.missedLettersMap || {},

    // 0.2 unlock a new subset id when the player clears the previous step
    unlockAdvancedSubset: (id) => {
        set((state) => {
            if (state.advancedSubsetUnlocked.includes(id)) return state;
            const next = [...state.advancedSubsetUnlocked, id];
            saveGuestData({ ...state, advancedSubsetUnlocked: next });
            return { advancedSubsetUnlocked: next };
        });
    },

    // Called by GameArea on a successful ADVANCED run; populates summary then bumps counter.
    recordAdvancedClear: ({ perfect, isFullKeyboard, subsetId }) => {
        set((state) => {
            const summary = { perfect: !!perfect, isFullKeyboard: !!isFullKeyboard, subsetId: subsetId || null };
            const next = isFullKeyboard ? state.advancedClearCount + 1 : state.advancedClearCount;
            const updated = { ...state, lastAdvancedRunSummary: summary, advancedClearCount: next };
            saveGuestData(updated);
            return { lastAdvancedRunSummary: summary, advancedClearCount: next };
        });
    },

    // 0.3 merge per-run miss counts into cumulative map (cap at 999 per letter to avoid runaway)
    mergeMissedLetters: (perRunMap) => {
        if (!perRunMap || typeof perRunMap !== 'object') return;
        set((state) => {
            const merged = { ...state.missedLettersMap };
            for (const [k, v] of Object.entries(perRunMap)) {
                merged[k] = Math.min((merged[k] || 0) + (v || 0), 999);
            }
            saveGuestData({ ...state, missedLettersMap: merged });
            return { missedLettersMap: merged };
        });
    },

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

    // Coin Economy Actions
    checkDailyLogin: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];
        const lastDate = state.streak.lastDate;

        if (lastDate === today) return; // Already logged in today

        let newCount = 1;
        if (lastDate) {
            const lastDateObj = new Date(lastDate);
            const todayObj = new Date(today);
            const diffTime = Math.abs(todayObj - lastDateObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                newCount = state.streak.count + 1;
            } else if (diffDays > 1) {
                newCount = 1; // Streak broken
            }
        }

        // Calculate reward
        const baseReward = 10;
        const streakBonus = Math.min((newCount - 1) * 5, 50); // Cap bonus at +50
        const totalReward = baseReward + streakBonus;

        set({
            streak: { count: newCount, lastDate: today },
            showDailyBonus: true,
            lastDailyBonusAmount: totalReward
        });

        state.setCoins(state.coins + totalReward);
        state.generateDailyQuests();
        saveGuestData(get());
    },

    setShowDailyBonus: (show) => set({ showDailyBonus: show }),

    generateDailyQuests: () => {
        const state = get();
        const today = new Date().toISOString().split('T')[0];

        if (state.dailyQuests.date === today && state.dailyQuests.tasks.length > 0) return;

        const tasks = [
            { id: 'daily_beginner', type: 'COMPLETED_GAME', mode: 'BEGINNER', target: 3, current: 0, reward: 30, title: '初學練習', desc: '在初學者模式完成 3 局', claimed: false },
            { id: 'daily_accuracy', type: 'ACCURACY', target: 95, current: 0, reward: 50, title: '精準射擊', desc: '單局準確率達到 95% 以上', claimed: false },
            { id: 'daily_combo', type: 'MAX_COMBO', target: 50, current: 0, reward: 40, title: '連擊高手', desc: '單局達成 50 連擊', claimed: false }
        ];

        set({ dailyQuests: { date: today, tasks } });
        saveGuestData(get());
    },

    updateQuestProgress: (type, value, extra = {}) => {
        set((state) => {
            const newTasks = state.dailyQuests.tasks.map(task => {
                if (task.claimed) return task;
                if (task.type !== type) return task;

                if (type === 'COMPLETED_GAME') {
                    if (extra.mode === task.mode) {
                        return { ...task, current: Math.min(task.target, task.current + 1) };
                    }
                } else if (type === 'ACCURACY' || type === 'MAX_COMBO') {
                    return { ...task, current: Math.max(task.current, value) };
                }
                return task;
            });
            return { dailyQuests: { ...state.dailyQuests, tasks: newTasks } };
        });
        saveGuestData(get());
    },

    claimQuestReward: (questId) => {
        const state = get();
        const quest = state.dailyQuests.tasks.find(t => t.id === questId);

        if (quest && !quest.claimed && quest.current >= quest.target) {
            set((state) => {
                const newTasks = state.dailyQuests.tasks.map(t =>
                    t.id === questId ? { ...t, claimed: true } : t
                );
                return {
                    dailyQuests: { ...state.dailyQuests, tasks: newTasks },
                    coins: state.coins + quest.reward,
                    totalCoinsEarned: state.totalCoinsEarned + quest.reward
                };
            });
            saveGuestData(get());
            return true;
        }
        return false;
    },

    setDailyQuests: (dailyQuests) => {
        set({ dailyQuests });
        saveGuestData(get());
    },

    setStreak: (streak) => {
        set({ streak });
        saveGuestData(get());
    },

    // Phase 6 Actions: Consumables & Appearance
    buyConsumable: (type, cost) => {
        const state = get();
        if (state.coins < cost) return false;

        set(s => ({
            coins: s.coins - cost,
            consumables: {
                ...s.consumables,
                [type]: (s.consumables[type] || 0) + 1
            }
        }));
        saveGuestData(get());
        return true;
    },

    useConsumable: (type) => {
        const state = get();
        if (state.consumables[type] <= 0) return false;

        if (type === 'shield') {
            set(s => ({ isShieldActive: true, consumables: { ...s.consumables, shield: s.consumables.shield - 1 } }));
        } else if (type === 'timeFreeze') {
            set(s => ({ isTimeFrozen: true, consumables: { ...s.consumables, timeFreeze: s.consumables.timeFreeze - 1 } }));
            setTimeout(() => set({ isTimeFrozen: false }), 3000);
        } else if (type === 'booster') {
            set(s => ({
                activeBoosters: { coinMultiplier: 2, endTime: Date.now() + 3600000 },
                consumables: { ...s.consumables, booster: s.consumables.booster - 1 }
            }));
        }

        saveGuestData(get());
        return true;
    },

    setAppearance: (category, id) => {
        set(s => ({
            appearance: {
                ...s.appearance,
                [category]: id
            }
        }));
        saveGuestData(get());
    },

    unlockAppearance: (category, id) => {
        const key = category === 'avatar' ? 'unlockedAvatars' : category === 'border' ? 'unlockedBorders' : 'unlockedTitles';
        set(s => ({
            [key]: [...new Set([...s[key], id])]
        }));
        saveGuestData(get());
    },

    openGacha: (cost) => {
        const state = get();
        if (state.coins < cost) return null;

        const rand = Math.random();
        let reward = null;

        if (rand < 0.45) {
            // Consumables: 45%
            const types = ['shield', 'timeFreeze', 'booster'];
            const type = types[Math.floor(Math.random() * types.length)];
            set(s => ({
                consumables: { ...s.consumables, [type]: s.consumables[type] + 1 }
            }));
            reward = { type: 'consumable', id: type, name: type === 'shield' ? '護盾 x1' : type === 'timeFreeze' ? '時停 x1' : '加倍券 x1' };
        } else if (rand < 0.8) {
            // Titles: 35%
            const titles = APPEARANCE_ITEMS.titles.filter(t => t.price > 0);
            const title = titles[Math.floor(Math.random() * titles.length)];
            get().unlockAppearance('title', title.id);
            reward = { type: 'appearance', id: title.id, name: `榮譽稱號：${title.name}` };
        } else if (rand < 0.95) {
            // Borders: 15%
            const borders = APPEARANCE_ITEMS.borders.filter(b => b.id !== 'none');
            const border = borders[Math.floor(Math.random() * borders.length)];
            get().unlockAppearance('border', border.id);
            reward = { type: 'appearance', id: border.id, name: `頭像邊框：${border.name}` };
        } else {
            // Avatars: 5% (Rare!)
            const avatars = APPEARANCE_ITEMS.avatars.filter(a => a.id !== 'default');
            const avatar = avatars[Math.floor(Math.random() * avatars.length)];
            get().unlockAppearance('avatar', avatar.id);
            reward = { type: 'appearance', id: avatar.id, name: `稀有頭像：${avatar.name} ${avatar.icon}` };
        }

        set(s => ({ coins: s.coins - cost }));
        saveGuestData(get());
        return reward;
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
        // ADVANCED achievements — gated on the most recent ADVANCED run summary so we
        // don't accidentally award them when checking from a different mode.
        const adv = state.lastAdvancedRunSummary || {};
        checkAndUnlock(state.mode === 'ADVANCED' && adv.isFullKeyboard, 'advanced_clear');
        checkAndUnlock(state.mode === 'ADVANCED' && adv.isFullKeyboard && adv.perfect, 'advanced_perfect');
        checkAndUnlock(state.advancedClearCount >= 10, 'advanced_master');
        checkAndUnlock(state.totalCompleted >= 1000, 'typewriter');
        checkAndUnlock(state.totalCoinsEarned >= 2000, 'millionaire');
        checkAndUnlock(state.totalItemsBought >= 5, 'shopaholic');

        return unlocked;
    }
}));
