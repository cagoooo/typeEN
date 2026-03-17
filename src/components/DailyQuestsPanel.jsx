import React from 'react';
import { useGameStore } from '../store/gameStore';
import { CheckCircle2, Circle, Coins, Zap, Target, MousePointer2 } from 'lucide-react';

const DailyQuestsPanel = () => {
    const { dailyQuests, claimQuestReward } = useGameStore();

    if (!dailyQuests.tasks || dailyQuests.tasks.length === 0) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'COMPLETED_GAME': return <Zap size={16} className="text-blue-400" />;
            case 'ACCURACY': return <Target size={16} className="text-green-400" />;
            case 'MAX_COMBO': return <MousePointer2 size={16} className="text-purple-400" />;
            default: return <CheckCircle2 size={16} />;
        }
    };

    return (
        <div className="w-full bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-3xl p-5 shadow-inner">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 每日特工任務
                </h3>
                <span className="text-[10px] text-gray-500 font-mono">RESET: 00:00</span>
            </div>

            <div className="space-y-3">
                {dailyQuests.tasks.map((task) => {
                    const isComplete = task.current >= task.target;
                    const progress = Math.min(100, (task.current / task.target) * 100);

                    return (
                        <div key={task.id} className={`group relative bg-gray-800/40 border rounded-2xl p-3 transition-all ${isComplete && !task.claimed ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-gray-700/50'}`}>

                            <div className="flex items-start gap-3 mb-2">
                                <div className={`mt-1 p-1.5 rounded-lg ${isComplete ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50 text-gray-400'}`}>
                                    {isComplete ? <CheckCircle2 size={16} /> : getIcon(task.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={`text-xs font-bold ${isComplete ? 'text-white' : 'text-gray-300'}`}>
                                            {task.title}
                                        </span>
                                        <div className="flex items-center gap-1 bg-yellow-500/10 px-1.5 py-0.5 rounded-md border border-yellow-500/20">
                                            <Coins size={10} className="text-yellow-400" />
                                            <span className="text-[10px] font-black text-yellow-400">+{task.reward}</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 leading-tight">
                                        {task.desc}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {!task.claimed && (
                                <div className="w-full flex items-center gap-3">
                                    <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${isComplete ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-blue-500'}`}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-400 min-w-[2.5rem] text-right">
                                        {task.current}/{task.target}{task.type === 'ACCURACY' ? '%' : ''}
                                    </span>
                                </div>
                            )}

                            {/* Claim Button Overlay for un-claimed completed tasks */}
                            {isComplete && !task.claimed && (
                                <button
                                    onClick={() => claimQuestReward(task.id)}
                                    className="absolute inset-0 w-full h-full bg-yellow-500/10 hover:bg-yellow-500/20 backdrop-blur-[1px] rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-yellow-500/50 cursor-pointer"
                                >
                                    <span className="bg-yellow-500 text-gray-900 text-[10px] font-black px-3 py-1 rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                                        領取獎勵
                                    </span>
                                </button>
                            )}

                            {/* Claimed Indicator */}
                            {task.claimed && (
                                <div className="absolute top-2 right-2">
                                    <div className="bg-green-500/20 text-green-400 rounded-full p-0.5">
                                        <CheckCircle2 size={12} />
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DailyQuestsPanel;
