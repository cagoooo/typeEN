import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ACHIEVEMENTS } from '../utils/constants';
import { playSound } from '../utils/audio';

const AchievementToast = () => {
    const newUnlocked = useGameStore(state => state.newUnlocked);
    const clearNewUnlocked = useGameStore(state => state.clearNewUnlocked);
    const [displayQueue, setDisplayQueue] = useState([]);
    const [currentDisplay, setCurrentDisplay] = useState(null);

    // Watch for new achievements and add to queue
    useEffect(() => {
        if (newUnlocked.length > 0) {
            setDisplayQueue(prev => [...prev, ...newUnlocked]);
            clearNewUnlocked();
        }
    }, [newUnlocked, clearNewUnlocked]);

    // Process queue
    useEffect(() => {
        if (displayQueue.length > 0 && !currentDisplay) {
            const nextId = displayQueue[0];
            const achievementData = ACHIEVEMENTS.find(a => a.id === nextId);

            if (achievementData) {
                setCurrentDisplay(achievementData);

                // Play sound
                try {
                    playSound('end');
                } catch (e) { }

                // Remove after delay
                setTimeout(() => {
                    setCurrentDisplay(null);
                    setDisplayQueue(prev => prev.slice(1));
                }, 3000); // Display for 3 seconds
            } else {
                // Invalid ID, skip
                setDisplayQueue(prev => prev.slice(1));
            }
        }
    }, [displayQueue, currentDisplay]);

    if (!currentDisplay) return null;

    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none animate-[slideUpFade_0.5s_ease-out]">
            <div className="bg-gray-900 border border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.3)] rounded-2xl p-4 flex items-center gap-4 min-w-[300px] backdrop-blur-md">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-3xl shrink-0 shadow-[0_0_15px_rgba(234,179,8,0.5)] border border-yellow-400">
                    {currentDisplay.icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-yellow-400 text-xs font-bold font-['Orbitron'] tracking-widest uppercase mb-1 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]">
                        Achievement Unlocked!
                    </span>
                    <span className="text-white font-bold text-lg leading-tight">
                        {currentDisplay.title}
                    </span>
                    <span className="text-gray-400 text-sm">
                        {currentDisplay.description}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AchievementToast;
