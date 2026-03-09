import React from 'react';
import { fingerMap } from '../utils/constants';

const LetterCard = ({ char, xPercent, yPos, color, isHighlight, type = 'NORMAL', onPointerDown }) => {
    return (
        <div
            onPointerDown={onPointerDown}
            className={`absolute transition-all duration-100 select-none flex items-center justify-center cursor-pointer pointer-events-auto
        ${isHighlight ? 'scale-110 z-20' : 'z-10'}
      `}
            style={{
                left: `${xPercent}%`,
                top: `${yPos}px`,
                transform: `translate(-50%, -50%) ${isHighlight ? 'scale(1.15)' : 'scale(1)'}`,
            }}
        >
            <div
                className={`
          flex items-center justify-center rounded-xl font-bold text-4xl md:text-5xl font-['Orbitron']
          w-16 h-16 md:w-20 md:h-20
          bg-white/10 backdrop-blur-md border border-white/20
          shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
          transition-all duration-200
        `}
                style={{
                    color: type === 'BOMB' ? '#ef4444' : type === 'HEAL' ? '#fbbf24' : color,
                    textShadow: isHighlight
                        ? `0 0 15px ${color}, 0 0 30px ${color}, 0 0 45px #fff`
                        : `0 0 10px ${color}, 0 0 20px ${color}`,
                    borderColor: isHighlight ? color : 'rgba(255,255,255,0.2)',
                    boxShadow: isHighlight
                        ? `0 0 20px ${color}40, inset 0 0 15px ${color}40, 0 -30px 40px -10px ${color}60`
                        : `0 8px 32px 0 rgba(0,0,0,0.3), 0 -20px 30px -10px ${color}50`,
                }}
            >
                {type === 'BOMB' && <span className="absolute -top-2 -right-3 text-xl drop-shadow-md z-30">💣</span>}
                {type === 'HEAL' && <span className="absolute -top-2 -right-3 text-xl drop-shadow-md z-30">❤️</span>}
                {char}
            </div>
        </div>
    );
};

export default LetterCard;
