import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'users';

// ---------------------------------------------------------------------------
// In-memory leaderboard cache
// ---------------------------------------------------------------------------
// Opening the leaderboard modal previously fired 2× Firestore `limit(100)` reads
// every single time. In a classroom of 30 kids opening the panel 10× a period,
// that's 600 doc reads that all return the same data.
// We cache by `${gameMode}:${maxResults}` for 3 minutes and expose
// `invalidateLeaderboardCache()` so screens can force-refresh right after the
// player's own stats just changed.
const CACHE_TTL_MS = 3 * 60 * 1000;
const leaderboardCache = new Map();

const cacheKey = (gameMode, maxResults) => `${gameMode}:${maxResults}`;

const readCache = (key) => {
    const entry = leaderboardCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        leaderboardCache.delete(key);
        return null;
    }
    return entry.data;
};

const writeCache = (key, data) => {
    leaderboardCache.set(key, { data, timestamp: Date.now() });
};

/**
 * Drop cached leaderboards so the next read hits Firestore again.
 * Pass a gameMode to drop only that tab, or omit to flush everything.
 */
export const invalidateLeaderboardCache = (gameMode = null) => {
    if (!gameMode) {
        leaderboardCache.clear();
        return;
    }
    for (const key of leaderboardCache.keys()) {
        if (key.startsWith(`${gameMode}:`)) leaderboardCache.delete(key);
    }
};

// Map game mode → firestore field keys
const FIELD_MAP = {
    BEGINNER: { time: 'stats.beginnerTime', completed: 'stats.beginnerCompleted', combo: 'stats.beginnerCombo' },
    ADVANCED: { time: 'stats.advancedTime', completed: 'stats.advancedCompleted', combo: 'stats.advancedCombo' },
    NORMAL: { time: 'stats.normalTime', completed: 'stats.normalCompleted', combo: 'stats.normalCombo' },
    WORD: { time: 'stats.wordTime', completed: 'stats.wordCompleted', combo: 'stats.wordCombo' },
    ENDLESS: { time: 'stats.endlessTime', completed: 'stats.endlessCompleted', combo: 'stats.endlessCombo' }
};

// Normalise raw firestore doc → leaderboard row
const rowFromDoc = (doc) => {
    const data = doc.data();
    return {
        id: doc.id,
        playerName: data.displayName || '特工',
        photoURL: data.photoURL || null,
        endlessTime: data.stats?.endlessTime,
        normalTime: data.stats?.normalTime,
        wordTime: data.stats?.wordTime,
        beginnerTime: data.stats?.beginnerTime,
        advancedTime: data.stats?.advancedTime,
        endlessCombo: data.stats?.endlessCombo,
        normalCombo: data.stats?.normalCombo,
        wordCombo: data.stats?.wordCombo,
        beginnerCombo: data.stats?.beginnerCombo,
        advancedCombo: data.stats?.advancedCombo,
        endlessCompleted: data.stats?.endlessCompleted,
        normalCompleted: data.stats?.normalCompleted,
        wordCompleted: data.stats?.wordCompleted,
        beginnerCompleted: data.stats?.beginnerCompleted,
        advancedCompleted: data.stats?.advancedCompleted,
        appearance: data.appearance || { avatar: 'default', border: 'none', title: '探員' }
    };
};

// Sort helper for time-based modes (BEGINNER / NORMAL / WORD)
// Cleared runs (time < 999) rank first, tie-broken by time ASC.
// Unfinished runs rank below, sorted by completed DESC then combo DESC.
const sortTimeMode = (rows, timeKey, completedKey, comboKey) => {
    return rows.sort((a, b) => {
        const aCleared = a[timeKey] !== undefined && a[timeKey] > 0 && a[timeKey] < 999;
        const bCleared = b[timeKey] !== undefined && b[timeKey] > 0 && b[timeKey] < 999;

        if (aCleared && !bCleared) return -1;
        if (!aCleared && bCleared) return 1;
        if (aCleared && bCleared) {
            if (a[timeKey] !== b[timeKey]) return a[timeKey] - b[timeKey];
            return (b[comboKey] || 0) - (a[comboKey] || 0);
        }

        const aC = a[completedKey] || 0;
        const bC = b[completedKey] || 0;
        if (bC !== aC) return bC - aC;
        return (b[comboKey] || 0) - (a[comboKey] || 0);
    });
};

export const getLeaderboard = async (gameMode, maxResults = 100, { forceRefresh = false } = {}) => {
    const key = cacheKey(gameMode, maxResults);
    if (!forceRefresh) {
        const cached = readCache(key);
        if (cached) return cached;
    }

    try {
        if (gameMode === 'ENDLESS') {
            // Endless: longer survival ranks higher
            const q = query(
                collection(db, COLLECTION_NAME),
                orderBy('stats.endlessTime', 'desc'),
                limit(maxResults)
            );
            const snap = await getDocs(q);
            const rows = [];
            snap.forEach(d => rows.push(rowFromDoc(d)));
            const result = rows.filter(r => r.endlessTime !== undefined && r.endlessTime > 0);
            writeCache(key, result);
            return result;
        }

        const fields = FIELD_MAP[gameMode];
        if (!fields) return [];
        const timeKey = fields.time.replace('stats.', '');
        const completedKey = fields.completed.replace('stats.', '');
        const comboKey = fields.combo.replace('stats.', '');

        // Query A: cleared players (sorted by time ASC)
        //   Firestore orderBy excludes docs missing that field, so users who never
        //   touched this mode won't appear here — which is what we want.
        const qCleared = query(
            collection(db, COLLECTION_NAME),
            orderBy(fields.time, 'asc'),
            limit(maxResults)
        );

        // Query B: players with in-progress stats (have completed > 0)
        //   Covers learners who haven't fully cleared but deserve a spot for effort.
        const qProgress = query(
            collection(db, COLLECTION_NAME),
            where(fields.completed, '>', 0),
            orderBy(fields.completed, 'desc'),
            limit(maxResults)
        );

        const [snapCleared, snapProgress] = await Promise.all([
            getDocs(qCleared),
            getDocs(qProgress).catch(err => {
                // If the secondary index is still building in Firestore, fall back
                // gracefully rather than breaking the whole leaderboard view.
                console.warn('Progress query fallback:', err?.message || err);
                return { forEach: () => { } };
            })
        ]);

        const userMap = new Map();
        snapCleared.forEach(d => userMap.set(d.id, rowFromDoc(d)));
        snapProgress.forEach(d => {
            if (!userMap.has(d.id)) userMap.set(d.id, rowFromDoc(d));
        });

        let merged = Array.from(userMap.values());

        // Filter: keep players with any meaningful record for this mode
        merged = merged.filter(r => {
            const cleared = r[timeKey] !== undefined && r[timeKey] > 0 && r[timeKey] < 999;
            const hasProgress = (r[completedKey] || 0) > 0 || (r[comboKey] || 0) > 0;
            return cleared || hasProgress;
        });

        const sorted = sortTimeMode(merged, timeKey, completedKey, comboKey).slice(0, maxResults);
        writeCache(key, sorted);
        return sorted;
    } catch (e) {
        console.error('Error fetching leaderboard: ', e);
        return [];
    }
};

/**
 * 獲取特定使用者的當前排名
 */
export const getUserRank = async (gameMode, userValue) => {
    try {
        if (!userValue || userValue === 0 || userValue === 999) return null;

        let q;
        if (gameMode === 'ENDLESS') {
            // 無盡模式：時間越長越前面 (desc)
            q = query(
                collection(db, COLLECTION_NAME),
                where('stats.endlessTime', '>', userValue)
            );
        } else {
            // 一般/單字/初學者模式：時間越短越前面 (asc)
            const fields = FIELD_MAP[gameMode];
            if (!fields) return null;
            q = query(
                collection(db, COLLECTION_NAME),
                where(fields.time, '<', userValue),
                where(fields.time, '>', 0)
            );
        }

        const snapshot = await getDocs(q);
        // 排名 = 比自己強的人數 + 1
        return snapshot.size + 1;
    } catch (e) {
        console.error('Error getting user rank: ', e);
        return null;
    }
};
