import React from 'react';
import { useGameStore } from '../store/gameStore';
import { CAMPAIGN_LEVELS } from '../utils/levels';
import { ArrowLeft, Lock, Unlock, Play } from 'lucide-react';

const CampaignMap = () => {
    const setGameState = useGameStore((state) => state.setGameState);
    const campaignUnlocked = useGameStore((state) => state.campaignUnlocked);
    const setCurrentCampaignLevel = useGameStore((state) => state.setCurrentCampaignLevel);
    const setMode = useGameStore((state) => state.setMode);

    const handleLevelSelect = (levelId) => {
        if (campaignUnlocked.includes(levelId)) {
            setCurrentCampaignLevel(levelId);
            setMode('CAMPAIGN');
            setGameState('STORY');
        }
    };

    return (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-gray-950 p-6 overflow-hidden">
            {/* Background Map Grid */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0)_0px,transparent_1px)] bg-[size:100%_40px] perspective-[1000px] transform-style-3d rotateX-[60deg] shadow-[0_-50px_100px_rgba(6,182,212,0.2)_inset]"></div>

            <div className="relative z-10 w-full max-w-4xl h-full flex flex-col">
                <div className="flex justify-between items-center mb-10 w-full mt-4">
                    <button
                        onClick={() => setGameState('START')}
                        className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full flex items-center gap-2 transition-colors border border-gray-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        返回總部
                    </button>
                    <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-['Press_Start_2P'] drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                        HACKER NODES
                    </h2>
                    <div className="w-32"></div> {/* Spacer to center title */}
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex flex-col gap-6 items-center">
                        {CAMPAIGN_LEVELS.map((level, index) => {
                            const isUnlocked = campaignUnlocked.includes(level.id);
                            const isBoss = level.config.boss;

                            return (
                                <div
                                    key={level.id}
                                    onClick={() => handleLevelSelect(level.id)}
                                    className={`relative w-full max-w-lg p-6 rounded-xl border-2 transition-all duration-300 ${isUnlocked
                                            ? isBoss
                                                ? 'bg-red-900/40 border-red-500 hover:bg-red-900/60 hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] cursor-pointer'
                                                : 'bg-cyan-900/40 border-cyan-500 hover:bg-cyan-900/60 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] cursor-pointer'
                                            : 'bg-gray-900/50 border-gray-700 opacity-50 cursor-not-allowed'
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className={`text-sm font-mono mb-1 ${isUnlocked ? (isBoss ? 'text-red-400' : 'text-cyan-400') : 'text-gray-500'}`}>
                                                NODE {level.id}
                                            </span>
                                            <h3 className={`text-2xl font-bold ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                                                {level.name}
                                            </h3>
                                            <p className="text-gray-400 mt-2 text-sm">
                                                {isUnlocked ? level.story[level.story.length - 1] : 'SYSTEM LOCKED'}
                                            </p>
                                        </div>
                                        <div>
                                            {isUnlocked ? (
                                                <button className={`p-4 rounded-full ${isBoss ? 'bg-red-500/20 text-red-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                                                    <Play className="w-8 h-8 ml-1" />
                                                </button>
                                            ) : (
                                                <div className="p-4 rounded-full bg-gray-800 text-gray-500">
                                                    <Lock className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Connecting Line to next node (except last) */}
                                    {index < CAMPAIGN_LEVELS.length - 1 && (
                                        <div className={`absolute left-1/2 -bottom-6 w-1 h-6 -translate-x-1/2 ${campaignUnlocked.includes(CAMPAIGN_LEVELS[index + 1].id)
                                                ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]'
                                                : 'bg-gray-700'
                                            }`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="h-20"></div> {/* Bottom spacer */}
                </div>
            </div>
        </div>
    );
};

export default CampaignMap;
