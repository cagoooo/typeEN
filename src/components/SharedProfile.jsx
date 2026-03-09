import React, { useEffect, useState } from 'react';
import { getUserProfile } from '../utils/userService';
import { ACHIEVEMENTS, SHOP_ITEMS } from '../utils/constants';
import { User, Trophy, Award, Star, Loader2, ArrowLeft, Share2 } from 'lucide-react';

const SharedProfile = ({ uid, onBack }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;
        const loadProfile = async () => {
            try {
                setLoading(true);
                const data = await getUserProfile(uid);
                if (isMounted) {
                    if (data) {
                        setProfile(data);
                    } else {
                        setError('找不到此特工的資料');
                    }
                }
            } catch (err) {
                console.error("Error loading profile:", err);
                if (isMounted) setError('讀取資料失敗');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadProfile();
        return () => { isMounted = false; };
    }, [uid]);

    if (loading) {
        return (
            <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-gray-950 text-white font-['Orbitron']">
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
                <h2 className="text-2xl animate-pulse">正在存取特工檔案...</h2>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-gray-950 top-0 left-0 w-full h-full text-white">
                <div className="bg-gray-900 border border-red-500/30 p-8 rounded-2xl flex flex-col items-center">
                    <User className="w-16 h-16 text-red-400 mb-4" />
                    <h2 className="text-2xl font-bold text-red-400 mb-2 font-['Orbitron']">錯誤</h2>
                    <p className="text-gray-400 mb-6">{error || '無法載入特工檔案'}</p>
                    <button
                        onClick={onBack}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold transition-colors"
                    >
                        返回首頁
                    </button>
                </div>
            </div>
        );
    }

    const stats = profile.stats || {};
    const achievements = profile.achievements || [];

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('個人網址已複製到剪貼簿！');
        });
    };

    let bgStyle = {};
    if (profile.equippedBackground) {
        const activeTheme = SHOP_ITEMS.find(item => item.id === profile.equippedBackground);
        if (activeTheme) {
            bgStyle = { '--grid-color': activeTheme.value };
        }
    }

    return (
        <div className="absolute inset-0 z-[100] bg-gray-950 font-sans overflow-x-hidden overflow-y-auto w-full h-full min-h-screen custom-scrollbar">
            <div className="fixed inset-0 crt-vignette z-0 pointer-events-none"></div>
            <div className="fixed inset-0 crt-overlay z-[5] pointer-events-none"></div>
            <div className="fixed inset-0 perspective-1000 z-0 opacity-20 transition-colors duration-700 pointer-events-none">
                <div className="absolute inset-0 bg-grid-neon transform rotate-x-60 scale-150 origin-bottom" style={bgStyle}></div>
            </div>

            <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-12 flex flex-col items-center">
                <div className="w-full flex justify-between items-center mb-8">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600 text-gray-300 rounded-full transition-colors backdrop-blur-sm"
                    >
                        <ArrowLeft className="w-5 h-5" /> 返回首頁挑戰
                    </button>
                    <button
                        onClick={handleShare}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600/80 hover:bg-indigo-500/80 border border-indigo-400 text-white rounded-full transition-colors backdrop-blur-sm shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                    >
                        <Share2 className="w-5 h-5" /> 分享此頁面
                    </button>
                </div>

                <div className="w-full bg-gray-900/80 backdrop-blur-md border border-indigo-500/30 rounded-3xl p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-[0_0_50px_rgba(99,102,241,0.1)]">
                    {profile.photoURL ? (
                        <img src={profile.photoURL} alt="Avatar" className="w-32 h-32 rounded-full border-4 border-indigo-500 object-cover shadow-[0_0_20px_rgba(99,102,241,0.5)]" />
                    ) : (
                        <div className="w-32 h-32 rounded-full border-4 border-indigo-500 bg-indigo-900 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                            <User className="w-16 h-16 text-indigo-300" />
                        </div>
                    )}
                    <div className="flex-1 text-center md:text-left flex flex-col justify-center">
                        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-300 mb-2 font-['Orbitron'] tracking-wider">
                            {profile.displayName || '傳奇特工'}
                        </h1>
                        <p className="text-gray-400 text-lg mb-4">霓虹打字員 - 官方成績單</p>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 font-bold font-['Orbitron']">
                                <span>🪙</span> {profile.coins || 0} 金幣
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-full text-fuchsia-400 font-bold font-['Orbitron']">
                                <Award className="w-4 h-4" /> {achievements.length} 個成就
                            </div>
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-6 font-['Orbitron'] self-start flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-400" /> 戰績總覽
                </h2>
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                    <div className="bg-gray-800/80 backdrop-blur-sm border border-emerald-500/30 p-6 rounded-2xl flex flex-col items-center">
                        <h3 className="text-emerald-400 font-bold mb-4">[初學者]</h3>
                        <div className="text-center w-full space-y-2 text-sm">
                            <p className="flex justify-between text-gray-300">
                                <span>最佳時間</span>
                                <span className="font-bold text-emerald-300">{(!stats.beginnerTime || stats.beginnerTime === 999) ? '--' : `${stats.beginnerTime}s`}</span>
                            </p>
                            <p className="flex justify-between text-gray-300">
                                <span>最高連擊</span>
                                <span className="font-bold text-orange-400">{stats.beginnerCombo || 0}</span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-800/80 backdrop-blur-sm border border-indigo-500/30 p-6 rounded-2xl flex flex-col items-center">
                        <h3 className="text-indigo-400 font-bold mb-4">[一般模式]</h3>
                        <div className="text-center w-full space-y-2 text-sm">
                            <p className="flex justify-between text-gray-300">
                                <span>最佳時間</span>
                                <span className="font-bold text-indigo-300">{(!stats.normalTime || stats.normalTime === 999) ? '--' : `${stats.normalTime}s`}</span>
                            </p>
                            <p className="flex justify-between text-gray-300">
                                <span>最高連擊</span>
                                <span className="font-bold text-orange-400">{stats.normalCombo || 0}</span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-800/80 backdrop-blur-sm border border-purple-500/30 p-6 rounded-2xl flex flex-col items-center">
                        <h3 className="text-purple-400 font-bold mb-4">[無盡生存]</h3>
                        <div className="text-center w-full space-y-2 text-sm">
                            <p className="flex justify-between text-gray-300">
                                <span>最長存活</span>
                                <span className="font-bold text-purple-300">{stats.endlessTime || 0}s</span>
                            </p>
                            <p className="flex justify-between text-gray-300">
                                <span>最高連擊</span>
                                <span className="font-bold text-orange-400">{stats.endlessCombo || 0}</span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-gray-800/80 backdrop-blur-sm border border-yellow-500/30 p-6 rounded-2xl flex flex-col items-center">
                        <h3 className="text-yellow-400 font-bold mb-4">[單字挑戰]</h3>
                        <div className="text-center w-full space-y-2 text-sm">
                            <p className="flex justify-between text-gray-300">
                                <span>最佳時間</span>
                                <span className="font-bold text-yellow-300">{(!stats.wordTime || stats.wordTime === 999) ? '--' : `${stats.wordTime}s`}</span>
                            </p>
                            <p className="flex justify-between text-gray-300">
                                <span>最高連擊</span>
                                <span className="font-bold text-orange-400">{stats.wordCombo || 0}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-white mb-6 font-['Orbitron'] self-start flex items-center gap-3">
                    <Star className="w-8 h-8 text-fuchsia-400" /> 勳章牆
                </h2>
                <div className="w-full bg-gray-900/60 backdrop-blur-sm border border-gray-800 rounded-3xl p-8 shadow-inner min-h-[200px]">
                    {achievements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-gray-500 py-12">
                            <Award className="w-16 h-16 mb-4 opacity-20" />
                            <p>尚未獲得任何成就</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {achievements.map((id) => {
                                const achievement = ACHIEVEMENTS.find(a => a.id === id);
                                if (!achievement) return null;
                                return (
                                    <div key={id} className="bg-gray-800/80 border border-fuchsia-500/30 rounded-xl p-4 flex flex-col items-center text-center hover:scale-105 transition-transform cursor-default">
                                        <div className="w-16 h-16 rounded-full bg-fuchsia-900/50 flex items-center justify-center text-3xl mb-3 border-2 border-fuchsia-500/50 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                                            {achievement.icon}
                                        </div>
                                        <h4 className="text-fuchsia-300 font-bold text-sm mb-1">{achievement.title}</h4>
                                        <p className="text-gray-400 text-xs">{achievement.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SharedProfile;
