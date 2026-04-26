import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getLeaderboard } from '../utils/leaderboardService';
import { APPEARANCE_ITEMS } from '../utils/constants';
import { useGameStore } from '../store/gameStore';
import { Trophy, Clock, Target, Flame, X, Loader, MapPin, Play } from 'lucide-react';

const Leaderboard = ({ onClose, onStartMode }) => {
    const [currentMode, setCurrentMode] = useState('BEGINNER');
    const [loading, setLoading] = useState(true);
    const [scores, setScores] = useState([]);
    const [isMeVisible, setIsMeVisible] = useState(true);

    const userProfile = useGameStore(state => state.userProfile);
    const currentUid = userProfile?.uid;

    const listContainerRef = useRef(null);
    const selfRowRef = useRef(null);

    const MODES = [
        { id: 'BEGINNER', label: '初學者', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/50', cta: 'bg-emerald-600 hover:bg-emerald-500' },
        { id: 'ADVANCED', label: '進階模式', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/50', cta: 'bg-teal-600 hover:bg-teal-500' },
        { id: 'NORMAL', label: '一般模式', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/50', cta: 'bg-indigo-600 hover:bg-indigo-500' },
        { id: 'ENDLESS', label: '無盡生存', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/50', cta: 'bg-purple-600 hover:bg-purple-500' },
        { id: 'WORD', label: '單字挑戰', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', cta: 'bg-yellow-600 hover:bg-yellow-500' }
    ];

    const currentModeConfig = MODES.find(m => m.id === currentMode) || MODES[0];

    // Locate self in the leaderboard
    const selfIndex = currentUid ? scores.findIndex(s => s.id === currentUid) : -1;
    const hasSelf = selfIndex !== -1;

    // Scroll-to-me helper
    const scrollToSelf = useCallback((smooth = true) => {
        if (selfRowRef.current) {
            selfRowRef.current.scrollIntoView({
                behavior: smooth ? 'smooth' : 'auto',
                block: 'center'
            });
        }
    }, []);

    useEffect(() => {
        const fetchScores = async () => {
            setLoading(true);
            try {
                // The service already filters + sorts per mode:
                //   - Cleared runs first (time ASC), then in-progress runs (completed DESC).
                //   - Endless mode is sorted by survival time DESC.
                const data = await getLeaderboard(currentMode, 100);
                setScores(data);
            } catch (error) {
                console.error("Fetch errors:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, [currentMode]);

    // Auto scroll-to-me once after scores are rendered (slight delay to ensure layout settled)
    useEffect(() => {
        if (!loading && hasSelf && selfRowRef.current) {
            const t = setTimeout(() => scrollToSelf(true), 300);
            return () => clearTimeout(t);
        }
    }, [loading, hasSelf, currentMode, scrollToSelf]);

    // Track whether "me" row is currently visible inside the list viewport
    useEffect(() => {
        if (!hasSelf || !selfRowRef.current || !listContainerRef.current) {
            setIsMeVisible(true);
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry) setIsMeVisible(entry.isIntersecting);
            },
            {
                root: listContainerRef.current,
                threshold: 0.5
            }
        );
        observer.observe(selfRowRef.current);
        return () => observer.disconnect();
    }, [hasSelf, scores, currentMode]);

    const handleStartMode = () => {
        if (onStartMode) {
            onStartMode(currentMode);
        } else {
            onClose();
        }
    };

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
                <div ref={listContainerRef} className="flex-1 overflow-y-auto p-2 sm:p-6 custom-scrollbar relative">
                    {loading ? (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-indigo-400">
                            <Loader className="w-12 h-12 animate-spin" />
                            <p className="font-['Orbitron'] tracking-widest animate-pulse">連線最高殿堂中...</p>
                        </div>
                    ) : scores.length === 0 ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 space-y-5 px-6 text-center">
                            <Trophy className="w-20 h-20 text-gray-700" />
                            <div className="space-y-2">
                                <p className="text-2xl font-bold text-white">
                                    還沒有人征服「{currentModeConfig.label}」！
                                </p>
                                <p className="text-gray-500 max-w-md">
                                    全校還沒有特工在這個模式留下紀錄，成為第一個霸榜的學生吧 ⚡
                                </p>
                            </div>
                            <button
                                onClick={handleStartMode}
                                className={`group flex items-center gap-3 px-8 py-4 ${currentModeConfig.cta} text-white font-bold rounded-full text-xl transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(99,102,241,0.4)] active:scale-95`}
                            >
                                <Play className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                                立即挑戰「{currentModeConfig.label}」
                            </button>
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
                                const timeValue = currentMode === 'ENDLESS' ? score.endlessTime : currentMode === 'NORMAL' ? score.normalTime : currentMode === 'WORD' ? score.wordTime : currentMode === 'ADVANCED' ? score.advancedTime : score.beginnerTime;
                                const comboValue = currentMode === 'ENDLESS' ? score.endlessCombo : currentMode === 'NORMAL' ? score.normalCombo : currentMode === 'WORD' ? score.wordCombo : currentMode === 'ADVANCED' ? score.advancedCombo : score.beginnerCombo;
                                const completedValue = currentMode === 'ENDLESS' ? score.endlessCompleted : currentMode === 'NORMAL' ? score.normalCompleted : currentMode === 'WORD' ? score.wordCompleted : currentMode === 'ADVANCED' ? score.advancedCompleted : score.beginnerCompleted;
                                // Time-mode players who haven't fully cleared yet (time === 999 / undefined) are in-progress rows
                                const isCleared = currentMode === 'ENDLESS'
                                    ? (timeValue !== undefined && timeValue > 0)
                                    : (timeValue !== undefined && timeValue > 0 && timeValue < 999);
                                const isMe = currentUid && score.id === currentUid;

                                return (
                                    <div
                                        key={score.id || index}
                                        ref={isMe ? selfRowRef : null}
                                        className={`group grid grid-cols-12 gap-4 items-center px-6 py-4 rounded-xl transition-all duration-300 hover:scale-[1.01] hover:bg-white/5 border border-transparent hover:border-white/10 ${isMe ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-gray-900 animate-pulse-slow bg-indigo-500/15 border-indigo-400/50' :
                                            !isCleared ? 'bg-gray-800/20 opacity-80' :
                                                index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30' :
                                                    index === 1 ? 'bg-gradient-to-r from-gray-300/10 to-transparent border-gray-300/20' :
                                                        index === 2 ? 'bg-gradient-to-r from-orange-700/20 to-transparent border-orange-700/30' :
                                                            'bg-gray-800/40'
                                            }`}
                                    >
                                        <div className={`col-span-2 sm:col-span-1 text-center font-['Press_Start_2P'] text-xl ${isMe ? 'text-indigo-300 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]' :
                                            !isCleared ? 'text-gray-500' :
                                                index === 0 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' :
                                                    index === 1 ? 'text-gray-300' :
                                                        index === 2 ? 'text-orange-400' :
                                                            'text-gray-600'
                                            }`}>
                                            #{index + 1}
                                        </div>
                                        <div className="col-span-5 sm:col-span-5 flex items-center gap-3 font-bold group-hover:text-indigo-300 transition-colors truncate">
                                            {/* Avatar with Border */}
                                            <div className={`relative flex-shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center ${score.appearance?.border && score.appearance.border !== 'none' ? `border-${score.appearance.border}` : 'border border-gray-700 bg-gray-900/50'}`}>
                                                {score.photoURL ? (
                                                    <img src={score.photoURL} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xl">
                                                        {score.appearance?.avatar ? (
                                                            APPEARANCE_ITEMS.avatars.find(a => a.id === score.appearance.avatar)?.icon || '👤'
                                                        ) : '👤'}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex flex-col truncate">
                                                {score.appearance?.title && (
                                                    <span className="text-[10px] text-fuchsia-400 font-bold tracking-tighter opacity-70">
                                                        《{score.appearance.title}》
                                                    </span>
                                                )}
                                                <span className={`text-lg md:text-xl truncate group-hover:text-indigo-300 ${isMe ? 'text-indigo-200' : 'text-white'}`}>
                                                    {score.playerName}
                                                    {isMe && <span className="ml-2 text-xs text-indigo-300 font-['Press_Start_2P'] tracking-wider">YOU</span>}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col-span-5 sm:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-2 text-right md:text-center font-['Orbitron']">
                                            <div className={`col-span-1 font-bold ${isCleared ? modeColor : 'text-gray-500'}`} title={!isCleared ? '尚未通關' : ''}>
                                                {isCleared ? `${timeValue}s` : '未通關'}
                                            </div>
                                            <div className="col-span-1 text-orange-400">
                                                {comboValue !== undefined ? comboValue : '--'}
                                            </div>
                                            <div className="hidden md:block col-span-1 text-emerald-400/70">
                                                {completedValue !== undefined ? completedValue : '--'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Floating "Scroll to Me" Button — only when self exists but is off-screen */}
                    {!loading && hasSelf && !isMeVisible && (
                        <button
                            onClick={() => scrollToSelf(true)}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-full shadow-[0_0_20px_rgba(99,102,241,0.6)] transition-all hover:scale-105 active:scale-95 z-20 animate-bounce-slow"
                        >
                            <MapPin className="w-5 h-5" />
                            <span>你在第 {selfIndex + 1} 名</span>
                        </button>
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
                @keyframes pulse-slow {
                    0%, 100% { box-shadow: 0 0 0 2px rgba(129, 140, 248, 0.6); }
                    50% { box-shadow: 0 0 18px 4px rgba(129, 140, 248, 0.9); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 2.2s ease-in-out infinite;
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translate(-50%, 0); }
                    50% { transform: translate(-50%, -6px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 1.6s ease-in-out infinite;
                }
            `}} />
        </div>
    );
};

export default Leaderboard;
