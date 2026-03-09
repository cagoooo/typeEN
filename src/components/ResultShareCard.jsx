import React, { useRef, useState } from 'react';
import { Share2, X, Download, Trophy, Flame } from 'lucide-react';
import html2canvas from 'html2canvas';

const ResultShareCard = ({ result, profile, mode, onClose }) => {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: null,
                scale: 2, // High resolution
                logging: false,
                useCORS: true
            });

            const image = canvas.toDataURL("image/png", 1.0);
            const link = document.createElement('a');
            link.download = `typeen-result-${Date.now()}.png`;
            link.href = image;
            link.click();
        } catch (error) {
            console.error("生成圖片失敗:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const modeLabels = {
        'BEGINNER': '初學者模式',
        'NORMAL': '一般模式',
        'ENDLESS': '無盡生存',
        'WORD': '單字挑戰',
        'CAMPAIGN': '劇情戰役'
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center font-sans p-4">
            <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 p-2 text-gray-400 hover:text-white bg-gray-800/80 rounded-full transition-colors z-20"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Card Container (Target for html2canvas) */}
                <div
                    ref={cardRef}
                    className="w-full bg-gray-900 border-2 border-fuchsia-500/50 rounded-3xl shadow-[0_0_50px_rgba(217,70,239,0.3)] overflow-hidden flex flex-col relative"
                >
                    {/* Background Effect */}
                    <div className="absolute inset-0 bg-grid-neon opacity-20 pointer-events-none" style={{ '--grid-color': 'rgba(217, 70, 239, 0.4)' }}></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/20 blur-[100px] rounded-full pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none transform -translate-x-1/2 translate-y-1/2"></div>

                    <div className="px-6 py-8 flex flex-col items-center relative z-10">
                        {/* Title & User */}
                        <h2 className="text-3xl font-bold font-['Orbitron'] text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-300 mb-2">
                            TypeEN Neon
                        </h2>
                        <div className="text-gray-300 font-bold mb-6 flex items-center gap-2">
                            <span>特工：</span>
                            <span className="text-fuchsia-400">{profile?.displayName || '匿名玩家'}</span>
                        </div>

                        {/* Status Label */}
                        <div className="px-4 py-1.5 bg-gray-800/80 border border-gray-700 rounded-full text-gray-300 font-bold text-sm mb-6 flex items-center gap-2">
                            <span>模式 | </span>
                            <span className="text-cyan-400">{modeLabels[mode] || mode}</span>
                        </div>

                        {/* Result Content */}
                        {result.isWin ? (
                            <div className="text-4xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] mb-8 tracking-wider">
                                任務完成
                            </div>
                        ) : (
                            <div className="text-4xl font-black text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.5)] mb-8 tracking-wider">
                                任務失敗
                            </div>
                        )}

                        <div className="w-full grid grid-cols-2 gap-4">
                            <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 flex flex-col items-center">
                                <span className="text-gray-400 text-xs font-bold mb-1 flex items-center gap-1">
                                    <Trophy className="w-3 h-3" /> 進度
                                </span>
                                <span className="text-white font-['Orbitron'] text-xl font-bold">
                                    {result.completed}
                                </span>
                            </div>
                            <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 flex flex-col items-center">
                                <span className="text-gray-400 text-xs font-bold mb-1 flex items-center gap-1">
                                    <Flame className="w-3 h-3 text-orange-400" /> 最大連擊
                                </span>
                                <span className="text-orange-400 font-['Orbitron'] text-xl font-bold">
                                    {result.maxCombo}
                                </span>
                            </div>
                            {result.time > 0 && (
                                <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 flex flex-col items-center col-span-2">
                                    <span className="text-gray-400 text-xs font-bold mb-1">
                                        生存/通關時間
                                    </span>
                                    <span className="text-cyan-300 font-['Orbitron'] text-2xl font-bold">
                                        {result.time} <span className="text-sm">s</span>
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 text-xs text-gray-500 font-['Orbitron'] opacity-80">
                            Play at typeen.sm.edu.tw
                        </div>
                    </div>
                </div>

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    disabled={isGenerating}
                    className="mt-6 w-full py-4 bg-fuchsia-600 hover:bg-fuchsia-500 disabled:bg-gray-700 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(217,70,239,0.4)] disabled:shadow-none flex justify-center items-center gap-2 text-lg active:scale-95"
                >
                    {isGenerating ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <Download className="w-6 h-6" /> 下載專屬戰報圖
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ResultShareCard;
