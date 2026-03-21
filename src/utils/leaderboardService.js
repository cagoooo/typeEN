import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'users';

export const getLeaderboard = async (gameMode, maxResults = 100) => {
    try {
        let q;
        // Depending on gameMode, we want to sort differently
        // - Endless: sort by stats.endlessTime DESC
        // - Normal/Word/Beginner: sort by stats.[mode]Time ASC

        if (gameMode === 'ENDLESS') {
            q = query(
                collection(db, COLLECTION_NAME),
                orderBy('stats.endlessTime', 'desc'),
                limit(maxResults)
            );
        } else {
            const timeField = gameMode === 'NORMAL' ? 'stats.normalTime' : gameMode === 'WORD' ? 'stats.wordTime' : 'stats.beginnerTime';
            q = query(
                collection(db, COLLECTION_NAME),
                orderBy(timeField, 'asc'),
                limit(maxResults)
            );
        }

        const querySnapshot = await getDocs(q);
        const results = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            results.push({
                id: doc.id,
                playerName: data.displayName || '特工',
                endlessTime: data.stats?.endlessTime,
                normalTime: data.stats?.normalTime,
                wordTime: data.stats?.wordTime,
                beginnerTime: data.stats?.beginnerTime,
                endlessCombo: data.stats?.endlessCombo,
                normalCombo: data.stats?.normalCombo,
                wordCombo: data.stats?.wordCombo,
                beginnerCombo: data.stats?.beginnerCombo,
                endlessCompleted: data.stats?.endlessCompleted,
                normalCompleted: data.stats?.normalCompleted,
                wordCompleted: data.stats?.wordCompleted,
                beginnerCompleted: data.stats?.beginnerCompleted,
                appearance: data.appearance || { avatar: 'default', border: 'none', title: '探員' }
            });
        });

        // Filter out entries that don't actually have a valid score for this mode
        const validResults = results.filter(r => {
            if (gameMode === 'ENDLESS') return r.endlessTime !== undefined && r.endlessTime > 0;
            if (gameMode === 'NORMAL') return r.normalTime !== undefined && r.normalTime < 999;
            if (gameMode === 'WORD') return r.wordTime !== undefined && r.wordTime < 999;
            if (gameMode === 'BEGINNER') return r.beginnerTime !== undefined && r.beginnerTime < 999;
            return false;
        });

        return validResults;

    } catch (e) {
        console.error("Error fetching leaderboard: ", e);
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
            const timeField = gameMode === 'NORMAL' ? 'stats.normalTime' :
                gameMode === 'WORD' ? 'stats.wordTime' : 'stats.beginnerTime';
            q = query(
                collection(db, COLLECTION_NAME),
                where(timeField, '<', userValue)
            );
        }

        const snapshot = await getDocs(q);
        // 排名 = 比自己強的人數 + 1
        return snapshot.size + 1;
    } catch (e) {
        console.error("Error getting user rank: ", e);
        return null;
    }
};
