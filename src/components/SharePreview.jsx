import React from 'react';
import { User, Trophy, Award, Star, Share2, X, CheckCircle2 } from 'lucide-react';
import { ACHIEVEMENTS, SHOP_ITEMS } from '../utils/constants';

const SharePreview = ({ profile, onClose, onShare }) => {
    if (!profile) return null;

    const stats = profile.stats || {};
    const achievements = profile.achievements || [];

    // Get the highest achievements to show off (max 3)
    const topAchievements = achievements
        .map(id => ACHIEVEMENTS.find(a => a.id === id))
        .filter(Boolean)
        .slice(0, 3);

    let bgStyle = {};
    if (profile.equippedBackground) {
        const activeTheme = SHOP_ITEMS.find(item => item.id === profile.equippedBackground);
        if (activeTheme) {
            bgStyle = { '--grid-color': activeTheme.value };
        }
    }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center font-sans">
            {/* Backdrop Blur overlay */}
            <div
                className="absolute inset-0 bg-gray-950/80 backdrop-blur-md"
                onClick={onClose}
            ></div>

            {/* Modal Container */}
            <div className="relative z-10 w-11/12 max-w-lg bg-gray-900 border border-indigo-500/50 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.3)] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gray-800/80 border-b border-gray-700 p-4 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-indigo-400" /> 分享預覽
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Card Content - The actual preview area */}
                <div className="relative p-6 bg-gray-950 overflow-hidden flex flex-col items-center">
                    {/* Fake Background for Preview */}
                    <div className="absolute inset-0 perspective-1000 z-0 opacity-30 pointer-events-none">
                        <div className="absolute inset-0 bg-grid-neon transform rotate-x-60 scale-150 origin-bottom" style={bgStyle}></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center w-full">
                        {/* Avatar & Name */}
                        <div className="flex flex-col items-center mb-6">
                            {profile.photoURL ? (
                                <img src={profile.photoURL} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-indigo-500 object-cover shadow-[0_0_20px_rgba(99,102,241,0.5)] mb-3" />
                            ) : (
                                <div className="w-24 h-24 rounded-full border-4 border-indigo-500 bg-indigo-900 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)] mb-3">
                                    <User className="w-12 h-12 text-indigo-300" />
                                </div>
                            )}
                            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-300 font-['Orbitron'] tracking-wider">
                                {profile.displayName || '傳奇特工'}
                            </h2>
                            <p className="text-indigo-400/80 text-sm mt-1">霓虹打字員 - 官方成績單</p>
                        </div>

                        {/* Quick Stats Banner */}
                        <div className="w-full flex justify-center gap-4 mb-6">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 font-bold text-sm font-['Orbitron']">
                                <span>🪙</span> {profile.coins || 0}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-full text-fuchsia-400 font-bold text-sm font-['Orbitron']">
                                <Award className="w-4 h-4" /> {achievements.length} 成就
                            </div>
                        </div>

                        {/* Best Stats Highlights */}
                        <div className="w-full grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-gray-800/80 border border-indigo-500/30 rounded-xl p-3 flex flex-col items-center">
                                <span className="text-gray-400 text-xs mb-1">一般模式連擊</span>
                                <span className="text-orange-400 font-bold text-xl">{stats.normalCombo || 0}</span>
                            </div>
                            <div className="bg-gray-800/80 border border-purple-500/30 rounded-xl p-3 flex flex-col items-center">
                                <span className="text-gray-400 text-xs mb-1">無盡存活時間</span>
                                <span className="text-purple-300 font-bold text-xl">{stats.endlessTime || 0}s</span>
                            </div>
                        </div>

                        {/* Top Achievements Preview */}
                        {topAchievements.length > 0 && (
                            <div className="w-full flex justify-center gap-3">
                                {topAchievements.map(a => (
                                    <div key={a.id} className="w-12 h-12 rounded-full bg-fuchsia-900/50 flex items-center justify-center text-xl border border-fuchsia-500/50 shadow-[0_0_10px_rgba(217,70,239,0.2)]" title={a.title}>
                                        {a.icon}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="bg-gray-800/90 border-t border-gray-700 p-5 flex flex-col gap-3">
                    <p className="text-gray-400 text-sm text-center">讓朋友看看你的霓虹打字員戰績！</p>
                    <button
                        onClick={onShare}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.4)] flex justify-center items-center gap-2 text-lg active:scale-95"
                    >
                        <Share2 className="w-5 h-5" /> 複製連結並分享
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SharePreview;
