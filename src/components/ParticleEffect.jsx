import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

const ParticleEffect = ({ x, y, color, type = 'NORMAL', onComplete }) => {
    const [particles, setParticles] = useState([]);
    const equippedEffect = useGameStore(state => state.equippedEffect);

    useEffect(() => {
        let count = 12;
        let speedMult = 1;

        if (type === 'PERFECT') {
            count = 24;
            speedMult = 1.5;
        } else if (type === 'BOMB') {
            count = 30;
            speedMult = 2.5;
        } else if (type === 'HEAL') {
            count = 15;
            speedMult = 1.2;
        }

        const newParticles = Array.from({ length: count }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / count;

            // Apply effect variations
            let pColor = color;
            let currentSpeedMult = speedMult;
            let currentSize = 4;

            if (type === 'NORMAL') {
                if (equippedEffect === 'effect_lightning') {
                    pColor = Math.random() > 0.5 ? '#fef08a' : '#ffffff'; // yellow-200 or white
                    currentSpeedMult = 2; // faster, sharper
                    currentSize = 2 + Math.random() * 4;
                } else if (equippedEffect === 'effect_cherry') {
                    pColor = Math.random() > 0.4 ? '#fbcfe8' : '#ffffff'; // pink-200 or white
                    currentSpeedMult = 0.8; // soft, slower
                    currentSize = 4 + Math.random() * 6; // slightly larger
                } else if (equippedEffect === 'effect_rainbow') {
                    const hues = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
                    pColor = hues[Math.floor(Math.random() * hues.length)];
                    currentSize = 4 + Math.random() * 5;
                } else {
                    currentSize = 4 + Math.random() * 6;
                }
            } else if (type === 'BOMB') {
                pColor = Math.random() > 0.5 ? '#ef4444' : '#f97316';
                currentSize = 4 + Math.random() * 10;
            } else if (type === 'PERFECT') {
                pColor = Math.random() > 0.4 ? color : '#ffffff';
                currentSize = 4 + Math.random() * 6;
            } else if (type === 'HEAL') {
                pColor = Math.random() > 0.5 ? '#4ade80' : '#2dd4bf';
                currentSize = 4 + Math.random() * 6;
            }

            const velocity = (50 + Math.random() * 50) * currentSpeedMult;

            return {
                id: i,
                x: Math.cos(angle) * velocity,
                y: Math.sin(angle) * velocity,
                size: currentSize,
                color: pColor
            };
        });
        setParticles(newParticles);

        const timer = setTimeout(() => {
            if (onComplete) onComplete();
        }, type === 'BOMB' ? 800 : 600); // Effect duration

        return () => clearTimeout(timer);
    }, [onComplete, type, color]);

    return (
        <div
            className="absolute pointer-events-none z-50 flex items-center justify-center pt-8"
            style={{ left: `${x}%`, top: `${y}px` }}
        >
            {type === 'BOMB' && (
                <div
                    className="absolute rounded-full border-red-500 shadow-[0_0_30px_#ef4444] animate-[shockwave_0.5s_ease-out_forwards]"
                    style={{ width: '40px', height: '40px', left: '-20px', top: '-20px' }}
                />
            )}

            {particles.map((p) => (
                <div
                    key={p.id}
                    className="absolute rounded-full transition-all duration-500 ease-out animate-ping"
                    style={{
                        transform: `translate(${p.x}px, ${p.y}px)`,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        backgroundColor: p.color,
                        boxShadow: `0 0 10px ${p.color}, 0 0 20px ${p.color}`,
                        opacity: 0,
                        left: `-${p.size / 2}px`,
                        top: `-${p.size / 2}px`
                    }}
                />
            ))}
        </div>
    );
};

export default ParticleEffect;
