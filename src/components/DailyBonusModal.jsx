import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Trophy, Coins, Calendar, X, CheckCircle2 } from 'lucide-react';

const DailyBonusModal = () => {
    const { showDailyBonus, setShowDailyBonus, lastDailyBonusAmount, streak } = useGameStore();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (showDailyBonus) {
            setIsVisible(true);
        }
    }, [showDailyBonus]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => setShowDailyBonus(false), 300);
    };

    if (!showDailyBonus && !isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={handleClose}
            />

            {/* Modal Content */}
            <div className={`relative w-full max-w-sm bg-gray-900 border border-yellow-500/30 rounded-3xl p-8 flex flex-col items-center shadow-[0_0_50px_rgba(234,179,8,0.2)] transform transition-all duration-500 ${isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'}`}>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Header Icon */}
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(234,179,8,0.3)] animate-bounce">
                    <Trophy className="text-yellow-400 w-10 h-10" />
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">每日登入獎勵！</h2>
                <p className="text-gray-400 text-center mb-6">
                    歡迎回來，Agent。你已經連續登入 <span className="text-yellow-400 font-bold">{streak.count}</span> 天。
                </p>

                {/* Reward Display */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-6 py-4 flex items-center gap-4 mb-8">
                    <div className="bg-yellow-500 rounded-full p-2">
                        <Coins className="text-gray-900 w-6 h-6" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-yellow-500/70 font-bold uppercase tracking-wider">獲得金幣</span>
                        <span className="text-3xl font-black text-white">+{lastDailyBonusAmount}</span>
                    </div>
                </div>

                {/* Footer Info */}
                <div className="w-full flex justify-between gap-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                        <div key={day} className="flex flex-col items-center gap-1 flex-1">
                            <div className={`w-full aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold border ${day <= streak.count ? 'bg-yellow-500 border-yellow-400 text-gray-900' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                                {day <= streak.count ? <CheckCircle2 size={12} /> : day}
                            </div>
                            <span className="text-[8px] text-gray-500">Day {day}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleClose}
                    className="mt-8 w-full py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-gray-900 font-black rounded-2xl transition-all active:scale-95 shadow-[0_4px_15px_rgba(234,179,8,0.3)]"
                >
                    領取並開始練習
                </button>
            </div>
        </div>
    );
};

export default DailyBonusModal;
