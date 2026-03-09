import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
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
                beginnerTime: data.stats?.beginnerTime
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
