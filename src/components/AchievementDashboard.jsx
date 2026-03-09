import React from 'react';
import { Trophy, X } from 'lucide-react';
import { ACHIEVEMENTS } from '../utils/constants';
import { useGameStore } from '../store/gameStore';

const AchievementDashboard = ({ onClose }) => {
    const unlockedAchievements = useGameStore(state => state.unlockedAchievements);

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-gray-950/90 backdrop-blur-md p-4 animate-[fadeIn_0.3s_ease-out]">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900 border-2 border-yellow-500/30 rounded-3xl shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-500" />
                        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 font-['Orbitron'] tracking-wider">
                            成就大廳
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    <div className="flex items-center justify-between mb-8 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                        <span className="text-gray-300 font-bold text-lg">解鎖進度</span>
                        <div className="flex items-center gap-4 text-xl font-['Orbitron'] text-yellow-400">
                            {unlockedAchievements.length} / {ACHIEVEMENTS.length}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ACHIEVEMENTS.map(achievement => {
                            const isUnlocked = unlockedAchievements.includes(achievement.id);

                            return (
                                <div
                                    key={achievement.id}
                                    className={`relative p-5 rounded-2xl border transition-all duration-300 ${isUnlocked
                                            ? 'bg-gray-800 border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.15)] hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] hover:-translate-y-1'
                                            : 'bg-gray-900 border-gray-800 opacity-50 grayscale hover:grayscale-0 hover:opacity-80'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl shrink-0 ${isUnlocked
                                                ? 'bg-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.3)] border border-yellow-500/50'
                                                : 'bg-gray-800 border border-gray-700'
                                            }`}>
                                            {achievement.icon}
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <h3 className={`font-bold text-lg mb-1 ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                                                {achievement.title}
                                            </h3>
                                            <p className="text-sm text-gray-400 leading-relaxed">
                                                {achievement.description}
                                            </p>
                                        </div>
                                    </div>

                                    {isUnlocked && (
                                        <div className="absolute top-3 right-3 flex justify-end">
                                            <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AchievementDashboard;
