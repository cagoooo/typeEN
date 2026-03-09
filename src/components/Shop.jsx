import React from 'react';
import { ShoppingCart, X, Check, Lock, Star } from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { SHOP_ITEMS } from '../utils/constants';
import { syncShopToCloud } from '../utils/userService';

const Shop = ({ onClose }) => {
    const {
        coins,
        unlockedItems,
        equippedBackground,
        equippedEffect,
        purchaseItem,
        equipItem,
        userProfile
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

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {SHOP_ITEMS.map((item) => {
                            const isUnlocked = unlockedItems.includes(item.id);
                            const isEquipped = (item.type === 'background' && equippedBackground === item.id) ||
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
                                    {/* Type Badge */}
                                    <div className="absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded bg-gray-800 text-gray-400 border border-gray-700">
                                        {item.type === 'background' ? '背景' : '特效'}
                                    </div>

                                    <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                                    <p className="text-sm text-gray-400 mb-6 flex-1">{item.description}</p>

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
                </div>
            </div>
        </div>
    );
};

export default Shop;
