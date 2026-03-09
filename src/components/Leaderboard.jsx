import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../utils/leaderboardService';
import { Trophy, Clock, Target, Flame, X, Loader } from 'lucide-react';

const Leaderboard = ({ onClose }) => {
    const [currentMode, setCurrentMode] = useState('NORMAL');
    const [loading, setLoading] = useState(true);
    const [scores, setScores] = useState([]);

    const MODES = [
        { id: 'BEGINNER', label: '初學者', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50' },
        { id: 'NORMAL', label: '一般模式', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/50' },
        { id: 'ENDLESS', label: '無盡生存', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/50' },
        { id: 'WORD', label: '單字挑戰', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50' }
    ];

    useEffect(() => {
        const fetchScores = async () => {
            setLoading(true);
            try {
                // The service sorts appropriately based on mode
                // For ENDLESS: sorted by endlessTime DESC
                // For others: sorted by {mode}Time ASC
                const data = await getLeaderboard(currentMode, 20);

                // Filter the documents to only include those that actually belong to this mode
                // e.g., A player might have submitted endlessTime, but their normalTime document isn't here
                const filteredData = data.filter(s => {
                    if (currentMode === 'ENDLESS') return s.endlessTime !== undefined;
                    if (currentMode === 'NORMAL') return s.normalTime !== undefined;
                    if (currentMode === 'WORD') return s.wordTime !== undefined;
                    if (currentMode === 'BEGINNER') return s.beginnerTime !== undefined;
                    return false;
                });

                // Sort client-side again just to be safe if firestore returns mixed or missing indices
                if (currentMode === 'ENDLESS') {
                    filteredData.sort((a, b) => b.endlessTime - a.endlessTime);
                } else {
                    const field = currentMode === 'BEGINNER' ? 'beginnerTime' : currentMode === 'NORMAL' ? 'normalTime' : 'wordTime';
                    filteredData.sort((a, b) => a[field] - b[field]);
                }

                setScores(filteredData);
            } catch (error) {
                console.error("Fetch errors:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, [currentMode]);

    return (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-gray-950/95 backdrop-blur-md p-4 md:p-10">
            <div className="relative w-full max-w-4xl h-full max-h-[85vh] flex flex-col bg-gray-900 rounded-3xl border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.15)] overflow-hidden">

                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-orange-500 font-['Press_Start_2P'] tracking-wider">
                            全球英雄榜
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X className="w-8 h-8" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex-shrink-0 flex gap-2 p-4 overflow-x-auto no-scrollbar border-b border-gray-800 bg-gray-950/50">
                    {MODES.map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => setCurrentMode(mode.id)}
                            className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-all duration-300 border ${currentMode === mode.id
                                ? `${mode.bg} ${mode.color} ${mode.border} shadow-[0_0_15px_rgba(255,255,255,0.1)] scale-105`
                                : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'
                                }`}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto p-2 sm:p-6 custom-scrollbar">
                    {loading ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-indigo-400">
                            <Loader className="w-12 h-12 animate-spin" />
                            <p className="font-['Orbitron'] tracking-widest animate-pulse">連線最高殿堂中...</p>
                        </div>
                    ) : scores.length === 0 ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                            <Trophy className="w-16 h-16 opacity-20" />
                            <p className="text-xl">目前尚無紀錄，快來成為榜首吧！</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-2 text-sm font-bold text-gray-500 sticky top-0 bg-gray-900/95 backdrop-blur-sm z-10 border-b border-gray-800">
                                <div className="col-span-2 sm:col-span-1 text-center">排名</div>
                                <div className="col-span-5 sm:col-span-5">特工代號</div>
                                <div className="col-span-5 sm:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-2 text-right md:text-center">
                                    <div className="col-span-1"><Clock className="w-4 h-4 inline mr-1" />{currentMode === 'ENDLESS' ? '存活時間' : '通關時間'}</div>
                                    <div className="col-span-1"><Flame className="w-4 h-4 inline mr-1" />最大連擊</div>
                                    <div className="hidden md:block col-span-1"><Target className="w-4 h-4 inline mr-1" />準確率估計</div>
                                </div>
                            </div>

                            {/* List Rows */}
                            {scores.map((score, index) => {
                                const modeColor = MODES.find(m => m.id === currentMode)?.color || 'text-white';
                                const timeValue = currentMode === 'ENDLESS' ? score.endlessTime : currentMode === 'NORMAL' ? score.normalTime : currentMode === 'WORD' ? score.wordTime : score.beginnerTime;
                                const comboValue = currentMode === 'ENDLESS' ? score.endlessCombo : currentMode === 'NORMAL' ? score.normalCombo : currentMode === 'WORD' ? score.wordCombo : score.beginnerCombo;

                                return (
                                    <div
                                        key={score.id || index}
                                        className={`group grid grid-cols-12 gap-4 items-center px-6 py-4 rounded-xl transition-all duration-300 hover:scale-[1.01] hover:bg-white/5 border border-transparent hover:border-white/10 ${index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30' :
                                            index === 1 ? 'bg-gradient-to-r from-gray-300/10 to-transparent border-gray-300/20' :
                                                index === 2 ? 'bg-gradient-to-r from-orange-700/20 to-transparent border-orange-700/30' :
                                                    'bg-gray-800/40'
                                            }`}
                                    >
                                        <div className={`col-span-2 sm:col-span-1 text-center font-['Press_Start_2P'] text-xl ${index === 0 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' :
                                            index === 1 ? 'text-gray-300' :
                                                index === 2 ? 'text-orange-400' :
                                                    'text-gray-600'
                                            }`}>
                                            #{index + 1}
                                        </div>
                                        <div className="col-span-5 sm:col-span-5 font-bold text-lg md:text-xl text-white truncate group-hover:text-indigo-300 transition-colors">
                                            {score.playerName}
                                        </div>
                                        <div className="col-span-5 sm:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-2 text-right md:text-center font-['Orbitron']">
                                            <div className={`col-span-1 font-bold ${modeColor}`}>
                                                {timeValue}s
                                            </div>
                                            <div className="col-span-1 text-orange-400">
                                                {comboValue}
                                            </div>
                                            <div className="hidden md:block col-span-1 text-emerald-400/70">
                                                {score.completed || '--'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(17, 24, 39, 0.5); 
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(99, 102, 241, 0.3); 
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(99, 102, 241, 0.6); 
                }
            `}} />
        </div>
    );
};

export default Leaderboard;
