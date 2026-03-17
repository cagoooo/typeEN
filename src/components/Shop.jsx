import React, { useState } from 'react';
import { ShoppingCart, X, Check, Lock, Star, Package, UserCircle, Gift } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { SHOP_ITEMS, CONSUMABLES, APPEARANCE_ITEMS } from '../utils/constants';
import { syncShopToCloud, syncEconomyToCloud } from '../utils/userService';

const Shop = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState('THEMES');
    const {
        coins,
        unlockedItems,
        equippedBackground,
        equippedEffect,
        purchaseItem,
        equipItem,
        userProfile,
        consumables,
        buyConsumable,
        appearance,
        unlockedAvatars,
        unlockedBorders,
        unlockedTitles,
        setAppearance,
        openGacha
    } = useGameStore();

    const handlePurchase = async (item) => {
        if (coins >= item.price && !unlockedItems.includes(item.id)) {
            const success = purchaseItem(item.id, item.price);
            if (success && userProfile && userProfile.uid) {
                const stateNow = useGameStore.getState();
                await syncShopToCloud(userProfile.uid, {
                    unlockedItems: stateNow.unlockedItems,
                    equippedBackground: stateNow.equippedBackground,
                    equippedEffect: stateNow.equippedEffect,
                    coins: stateNow.coins
                });
            }
        }
    };

    const handleBuyConsumable = async (item) => {
        if (coins >= item.price) {
            const success = buyConsumable(item.id, item.price);
            if (success && userProfile && userProfile.uid) {
                const stateNow = useGameStore.getState();
                await syncEconomyToCloud(userProfile.uid, {
                    coins: stateNow.coins,
                    consumables: stateNow.consumables
                });
            }
        }
    };

    const handleEquip = async (item) => {
        if (unlockedItems.includes(item.id)) {
            equipItem(item.id, item.type);
            if (userProfile && userProfile.uid) {
                const stateNow = useGameStore.getState();
                await syncShopToCloud(userProfile.uid, {
                    unlockedItems: stateNow.unlockedItems,
                    equippedBackground: stateNow.equippedBackground,
                    equippedEffect: stateNow.equippedEffect
                });
            }
        }
    };

    const handleSetAppearance = async (category, id) => {
        setAppearance(category, id);
        if (userProfile && userProfile.uid) {
            const stateNow = useGameStore.getState();
            await syncEconomyToCloud(userProfile.uid, {
                appearance: stateNow.appearance
            });
        }
    };

    const handleOpenGacha = async () => {
        const cost = 100;
        if (coins >= cost) {
            const reward = openGacha(cost);
            if (reward && userProfile && userProfile.uid) {
                const stateNow = useGameStore.getState();
                await syncEconomyToCloud(userProfile.uid, {
                    coins: stateNow.coins,
                    consumables: stateNow.consumables,
                    unlockedAvatars: stateNow.unlockedAvatars,
                    unlockedBorders: stateNow.unlockedBorders,
                    unlockedTitles: stateNow.unlockedTitles
                });
                alert(`恭喜獲得：${reward.name}`);
            }
        }
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-gray-950/90 backdrop-blur-md p-4 animate-[fadeIn_0.3s_ease-out]">
            <div className="relative w-full max-w-5xl max-h-[90vh] bg-gray-900 border-2 border-fuchsia-500/30 rounded-3xl shadow-[0_0_50px_rgba(217,70,239,0.2)] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900/80 sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <ShoppingCart className="w-8 h-8 text-fuchsia-400" />
                        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-300 font-['Orbitron'] tracking-wider">
                            霓虹商城 NEON SHOP
                        </h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.1)]">
                            <span className="text-xl">🪙</span>
                            <span className="text-yellow-400 font-bold font-['Orbitron'] text-xl">{coins}</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-8 pt-4 flex gap-4 border-b border-gray-800 bg-gray-900/50">
                    {[
                        { id: 'THEMES', label: '主題特效', icon: Star },
                        { id: 'CONSUMABLES', label: '實用道具', icon: Package },
                        { id: 'APPEARANCE', label: '個人風格', icon: UserCircle },
                        { id: 'GACHA', label: '時空盲盒', icon: Gift },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 font-bold transition-all border-b-2 ${activeTab === tab.id
                                ? 'text-fuchsia-400 border-fuchsia-500 bg-fuchsia-500/10'
                                : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-gray-800'
                                }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    {/* Themes Tab */}
                    {activeTab === 'THEMES' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {SHOP_ITEMS.map((item) => {
                                const isUnlocked = unlockedItems.includes(item.id);
                                const isEquipped = (item.type === 'theme' && equippedBackground === item.id) ||
                                    (item.type === 'effect' && equippedEffect === item.id);
                                const canAfford = coins >= item.price;

                                return (
                                    <div
                                        key={item.id}
                                        className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 ${isEquipped
                                            ? 'bg-fuchsia-900/20 border-fuchsia-400 shadow-[0_0_20px_rgba(217,70,239,0.3)]'
                                            : isUnlocked
                                                ? 'bg-gray-800 border-gray-600 hover:border-gray-400'
                                                : 'bg-gray-900 border-gray-800'
                                            }`}
                                    >
                                        <div className="absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded bg-gray-800 text-gray-400 border border-gray-700">
                                            {item.type === 'theme' ? '背景' : '特效'}
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                                        <div className="flex-1 space-y-2 mb-6">
                                            <p className="text-sm text-fuchsia-300 font-medium">{item.description}</p>
                                            <p className="text-xs text-gray-400 leading-relaxed italic border-l-2 border-gray-700 pl-3">
                                                {item.longDescription || '暫無詳細描述'}
                                            </p>
                                        </div>
                                        <div className="mt-auto pt-4 border-t border-gray-800 flex items-center justify-between">
                                            {isEquipped ? (
                                                <div className="w-full py-2 flex items-center justify-center gap-2 text-fuchsia-400 font-bold">
                                                    <Check className="w-5 h-5" /> 已裝備
                                                </div>
                                            ) : isUnlocked ? (
                                                <button
                                                    onClick={() => handleEquip(item)}
                                                    className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                                                >
                                                    裝備
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handlePurchase(item)}
                                                    disabled={!canAfford}
                                                    className={`w-full py-2 flex items-center justify-center gap-2 font-bold rounded-lg transition-all ${canAfford
                                                        ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/50'
                                                        : 'bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700'
                                                        }`}
                                                >
                                                    {canAfford ? <Star className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                                    <span>🪙 {item.price}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Consumables Tab */}
                    {activeTab === 'CONSUMABLES' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {CONSUMABLES.map((item) => {
                                const count = consumables[item.id] || 0;
                                const canAfford = coins >= item.price;
                                return (
                                    <div key={item.id} className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col hover:border-blue-500/50 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-4xl">{item.icon}</span>
                                            <div className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-bold rounded-full border border-blue-500/30">
                                                持有: {count}
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                                        <p className="text-sm text-gray-400 mb-6 flex-1">{item.longDescription}</p>
                                        <button
                                            onClick={() => handleBuyConsumable(item)}
                                            disabled={!canAfford}
                                            className={`w-full py-3 flex items-center justify-center gap-2 font-bold rounded-xl transition-all ${canAfford
                                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                                }`}
                                        >
                                            <Star className="w-4 h-4" /> 🪙 {item.price} 購買
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Appearance Tab */}
                    {activeTab === 'APPEARANCE' && (
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-lg font-bold text-gray-400 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-fuchsia-500 rounded-full" /> 頭像設定
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                    {APPEARANCE_ITEMS.avatars.map(avatar => {
                                        const isUnlocked = unlockedAvatars.includes(avatar.id);
                                        const isEquipped = appearance.avatar === avatar.id;
                                        return (
                                            <button
                                                key={avatar.id}
                                                disabled={!isUnlocked}
                                                onClick={() => handleSetAppearance('avatar', avatar.id)}
                                                className={`relative p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${isEquipped
                                                    ? 'bg-fuchsia-500/20 border-fuchsia-500'
                                                    : isUnlocked ? 'bg-gray-800 border-gray-700 hover:border-gray-500' : 'bg-gray-900 border-gray-800 opacity-50'
                                                    }`}
                                            >
                                                <span className="text-3xl">{avatar.icon}</span>
                                                <span className="text-xs font-bold text-white whitespace-nowrap">{avatar.name}</span>
                                                {!isUnlocked && <Lock className="absolute top-2 right-2 w-3 h-3 text-gray-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-400 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-blue-500 rounded-full" /> 頭像邊框
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {APPEARANCE_ITEMS.borders.map(border => {
                                        const isUnlocked = unlockedBorders.includes(border.id);
                                        const isEquipped = appearance.border === border.id;
                                        return (
                                            <button
                                                key={border.id}
                                                disabled={!isUnlocked}
                                                onClick={() => handleSetAppearance('border', border.id)}
                                                className={`relative p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${isEquipped
                                                    ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                                                    : isUnlocked ? 'bg-gray-800 border-gray-700 hover:border-gray-500' : 'bg-gray-900 border-gray-800 opacity-50'
                                                    }`}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${border.id !== 'none' ? `border-${border.id}` : 'border border-gray-600'}`}>
                                                    <span className="text-xs text-gray-500">Aa</span>
                                                </div>
                                                <span className="text-xs font-bold text-white whitespace-nowrap">{border.name}</span>
                                                {!isUnlocked && <Lock className="absolute top-2 right-2 w-3 h-3 text-gray-500" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-lg font-bold text-gray-400 mb-4 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-yellow-500 rounded-full" /> 榮譽稱號
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {APPEARANCE_ITEMS.titles.map(title => {
                                        const isUnlocked = unlockedTitles.includes(title.id);
                                        const isEquipped = appearance.title === title.id;
                                        return (
                                            <button
                                                key={title.id}
                                                disabled={!isUnlocked}
                                                onClick={() => handleSetAppearance('title', title.id)}
                                                className={`px-4 py-2 rounded-lg border text-sm font-bold transition-all ${isEquipped
                                                    ? 'bg-yellow-500 text-gray-900 border-yellow-400'
                                                    : isUnlocked ? 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500' : 'bg-gray-900 border-gray-800 text-gray-600 opacity-50'
                                                    }`}
                                            >
                                                {title.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Gacha Tab */}
                    {activeTab === 'GACHA' && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="relative mb-8 group">
                                <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 to-blue-600 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                                <div className="relative bg-gray-800 w-48 h-48 rounded-full flex items-center justify-center border-4 border-fuchsia-500 shadow-[0_0_30px_rgba(217,70,239,0.3)]">
                                    <Gift className="w-24 h-24 text-fuchsia-400 animate-bounce" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2 font-['Orbitron']">時空盲盒 NEON GACHA</h3>
                            <p className="text-gray-400 mb-8 max-w-md">消耗 100 代幣，隨機獲得稀有道具、傳說稱號！<br />(60% 道具 / 40% 稱號)</p>
                            <button
                                onClick={handleOpenGacha}
                                disabled={coins < 100}
                                className={`px-12 py-4 rounded-2xl font-black text-xl tracking-widest transition-all ${coins >= 100
                                    ? 'bg-gradient-to-r from-fuchsia-600 to-blue-600 hover:from-fuchsia-500 hover:to-blue-500 text-white shadow-[0_0_20px_rgba(217,70,239,0.4)] hover:scale-105 active:scale-95'
                                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                    }`}
                            >
                                🪙 100 啟動傳送器
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Shop;
