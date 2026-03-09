import React from 'react';
import { fingerMap } from '../utils/constants';

const HandsHint = ({ activeLetters = [] }) => {
    // 找出目前位置最低的字母來提示
    let lowestLetter = null;
    activeLetters.forEach((letterObj) => {
        if (!lowestLetter || letterObj.yPos > lowestLetter.yPos) {
            lowestLetter = letterObj;
        }
    });

    const targetFingerId = lowestLetter ? fingerMap[lowestLetter.char.toUpperCase()] : null;

    const isHighlighted = (fingerId) => fingerId === targetFingerId ? 'highlight' : '';

    return (
        <div className="fixed bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 pointer-events-none w-[90%] max-w-[420px] aspect-[420/180] z-10 transition-transform duration-300">
            <svg viewBox="0 0 420 180" className="w-full h-full drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                <defs>
                    <linearGradient id="hand-base-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'rgba(79, 70, 229, 0.6)' }} /> {/* Indigo-600 */}
                        <stop offset="100%" style={{ stopColor: 'rgba(30, 27, 75, 0.4)' }} /> {/* Indigo-950 */}
                    </linearGradient>
                    <linearGradient id="finger-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: 'rgba(99, 102, 241, 0.7)' }} /> {/* Indigo-500 */}
                        <stop offset="100%" style={{ stopColor: 'rgba(49, 46, 129, 0.5)' }} /> {/* Indigo-900 */}
                    </linearGradient>
                    <linearGradient id="finger-highlight-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#a3e635' }} /> {/* lime-400 : Cyberpunk Green */}
                        <stop offset="100%" style={{ stopColor: '#16a34a' }} /> {/* green-600 */}
                    </linearGradient>

                    <style>{`
            .finger {
              fill: url(#finger-gradient);
              stroke: rgba(167, 139, 250, 0.4);
              stroke-width: 1.5;
              transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
            }
            .finger.highlight {
              fill: url(#finger-highlight-gradient);
              stroke: #bef264;
              stroke-width: 2;
              transform-box: fill-box;
              transform-origin: center bottom;
              transform: scale(1.08) translateY(-8px);
              filter: drop-shadow(0px 0px 20px #84cc16);
            }
            .hand-base {
              fill: url(#hand-base-gradient);
              stroke: rgba(139, 92, 246, 0.5);
              stroke-width: 2;
            }
            .thumb {
              fill: url(#finger-gradient);
              stroke: rgba(167, 139, 250, 0.4);
              stroke-width: 1.5;
            }
          `}</style>
                </defs>

                {/* Left Hand */}
                <path className="hand-base" d="M165 170 C 190 120, 150 50, 100 60 C 50 70, 15 120, 30 170 Z"></path>
                <path className="thumb" d="M158 135 C 170 110, 165 90, 150 95 C 135 100, 130 125, 140 145 Z"></path>
                <path className={`finger ${isHighlighted('left-pinky')}`} d="M55 115 C 45 80, 55 55, 65 60 C 75 65, 75 90, 65 120 Z"></path>
                <path className={`finger ${isHighlighted('left-ring')}`} d="M80 125 C 70 80, 80 35, 90 40 C 100 45, 105 90, 90 130 Z"></path>
                <path className={`finger ${isHighlighted('left-middle')}`} d="M105 135 C 95 80, 105 20, 115 25 C 125 30, 135 90, 120 140 Z"></path>
                <path className={`finger ${isHighlighted('left-index')}`} d="M130 130 C 125 80, 135 30, 145 35 C 155 40, 160 90, 145 135 Z"></path>

                {/* Right Hand */}
                <path className="hand-base" d="M255 170 C 230 120, 270 50, 320 60 C 370 70, 405 120, 390 170 Z"></path>
                <path className={`finger ${isHighlighted('right-pinky')}`} d="M365 115 C 375 80, 365 55, 355 60 C 345 65, 345 90, 355 120 Z"></path>
                <path className={`finger ${isHighlighted('right-ring')}`} d="M340 125 C 350 80, 340 35, 330 40 C 320 45, 315 90, 330 130 Z"></path>
                <path className={`finger ${isHighlighted('right-middle')}`} d="M315 135 C 325 80, 315 20, 305 25 C 295 30, 285 90, 300 140 Z"></path>
                <path className={`finger ${isHighlighted('right-index')}`} d="M290 130 C 295 80, 285 30, 275 35 C 265 40, 260 90, 275 135 Z"></path>
                <path className="thumb" d="M262 135 C 250 110, 255 90, 270 95 C 285 100, 290 125, 280 145 Z"></path>
            </svg>
        </div>
    );
};

export default HandsHint;
