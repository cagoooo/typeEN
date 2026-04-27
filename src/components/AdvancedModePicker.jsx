import React, { useMemo } from 'react';
import { Lock, Target } from 'lucide-react';
import { PRACTICE_SUBSETS, fingerMap } from '../utils/constants';
import { useGameStore } from '../store/gameStore';

/**
 * Build a personalised practice subset from the cumulative miss map.
 * Strategy:
 *   1. Pick the TOP 3 most-missed letters.
 *   2. For each, add 1–2 same-finger neighbours (from fingerMap) so the player
 *      drills weak fingers, not just isolated keys.
 *   3. Cap the result at 8 letters and dedupe.
 * Returns null if there isn't enough data yet (need ≥3 distinct missed letters).
 */
const buildPersonalSubset = (missMap) => {
    if (!missMap || typeof missMap !== 'object') return null;
    const entries = Object.entries(missMap)
        .filter(([k, v]) => /^[A-Z]$/.test(k) && v > 0)
        .sort((a, b) => b[1] - a[1]);
    if (entries.length < 3) return null;

    const top = entries.slice(0, 3).map(([k]) => k);
    // Group all alphabet letters by their finger so we can find neighbours.
    const byFinger = {};
    for (const [letter, finger] of Object.entries(fingerMap)) {
        if (!byFinger[finger]) byFinger[finger] = [];
        byFinger[finger].push(letter);
    }

    const out = new Set(top);
    for (const letter of top) {
        const finger = fingerMap[letter];
        const neighbours = (byFinger[finger] || []).filter(l => !out.has(l));
        // Add up to 2 neighbours per top letter, prefer those NOT already in top.
        for (let i = 0; i < 2 && i < neighbours.length && out.size < 8; i++) {
            out.add(neighbours[i]);
        }
        if (out.size >= 8) break;
    }
    return Array.from(out).sort();
};

// QWERTY layout used by the mini-keyboard preview
const KB_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

/**
 * A 16x mini-keyboard that highlights letters in `activeLetters` (uppercase array).
 * Pure visual, no state.
 */
const MiniKeyboard = ({ activeLetters }) => {
    const active = new Set((activeLetters || []).map(c => c.toUpperCase()));
    return (
        <div className="flex flex-col items-center gap-[2px] mt-2 select-none">
            {KB_ROWS.map((row, ri) => (
                <div key={ri} className={`flex gap-[2px] ${ri === 1 ? 'pl-[6px]' : ri === 2 ? 'pl-[14px]' : ''}`}>
                    {row.map(ch => (
                        <div
                            key={ch}
                            className={`w-[14px] h-[14px] flex items-center justify-center rounded-[3px] text-[8px] font-bold transition-colors ${
                                active.has(ch)
                                    ? 'bg-teal-400 text-gray-900 shadow-[0_0_4px_rgba(20,184,166,0.6)]'
                                    : 'bg-gray-700/60 text-gray-500'
                            }`}
                        >
                            {ch}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

/**
 * Subset picker modal. Shows each preset as a card with:
 * - Label, hint
 * - "Leaderboard" badge for the full-keyboard option
 * - Lock icon when not yet unlocked (still shows hint)
 * - Mini-keyboard preview highlighting the playable letters
 *
 * Locked options call `onLockedHint` instead of starting a run.
 */
const AdvancedModePicker = ({ onPick, onClose, onLockedHint }) => {
    const unlocked = useGameStore(state => state.advancedSubsetUnlocked);
    const missMap = useGameStore(state => state.missedLettersMap);
    const unlockedSet = new Set(unlocked);
    const personalLetters = useMemo(() => buildPersonalSubset(missMap), [missMap]);

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md">
            <div className="bg-gray-900 border border-teal-500/30 rounded-2xl shadow-[0_0_40px_rgba(20,184,166,0.25)] p-6 max-w-md w-full animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold text-teal-300 mb-2 text-center tracking-wider">進階模式</h3>
                <p className="text-sm text-gray-400 text-center mb-5 font-sans">
                    速度比一般模式慢、首次漏接免扣血。從中排開始循序解鎖區段，全鍵盤才會進排行榜。
                </p>

                {/* 0.3 — Personalized recommendation card (only shows after enough miss data) */}
                {personalLetters && (
                    <button
                        onClick={() => onPick({ id: 'personalized', letters: personalLetters, label: '為你推薦' })}
                        className="w-full text-left px-4 py-3 mb-3 rounded-xl border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 hover:border-amber-300 transition-all font-sans group"
                    >
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-amber-300" />
                            <span className="text-amber-200 font-bold text-base group-hover:text-white">🎯 為你推薦：弱點補強</span>
                        </div>
                        <div className="text-xs text-amber-200/80 mt-1">
                            根據你最近常漏的字母自動組成 {personalLetters.length} 字練習集
                        </div>
                        <MiniKeyboard activeLetters={personalLetters} />
                    </button>
                )}

                <div className="flex flex-col gap-3">
                    {PRACTICE_SUBSETS.map(s => {
                        const isUnlocked = unlockedSet.has(s.id);
                        // For visual preview the 'all' option highlights every letter.
                        const previewLetters = s.letters || [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];
                        return (
                            <button
                                key={s.id}
                                onClick={() => {
                                    if (!isUnlocked) {
                                        onLockedHint && onLockedHint(s);
                                        return;
                                    }
                                    onPick(s);
                                }}
                                className={`text-left px-4 py-3 rounded-xl border transition-all font-sans group ${
                                    isUnlocked
                                        ? 'border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/15 hover:border-teal-400'
                                        : 'border-gray-700 bg-gray-800/40 opacity-70 cursor-not-allowed'
                                }`}
                                aria-disabled={!isUnlocked}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {!isUnlocked && <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />}
                                        <span className={`font-bold text-base truncate ${isUnlocked ? 'text-teal-200 group-hover:text-white' : 'text-gray-400'}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    {s.id === 'all' && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 flex-shrink-0">排行榜</span>
                                    )}
                                </div>
                                <div className={`text-xs mt-1 ${isUnlocked ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {isUnlocked ? s.hint : '🔒 完成上一階段才會解鎖'}
                                </div>
                                <MiniKeyboard activeLetters={previewLetters} />
                            </button>
                        );
                    })}
                </div>
                <button
                    onClick={onClose}
                    className="mt-5 w-full py-2 rounded-full bg-gray-700 hover:bg-gray-600 text-white text-sm font-sans"
                >
                    取消
                </button>
            </div>
        </div>
    );
};

export default AdvancedModePicker;
