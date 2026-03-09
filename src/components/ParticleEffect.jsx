import React, { useEffect, useState } from 'react';

const ParticleEffect = ({ x, y, color, type = 'NORMAL', onComplete }) => {
    const [particles, setParticles] = useState([]);

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
            const velocity = (50 + Math.random() * 50) * speedMult;

            // Allow some scattered colors for special types
            let pColor = color;
            if (type === 'BOMB') {
                pColor = Math.random() > 0.5 ? '#ef4444' : '#f97316';
            } else if (type === 'PERFECT') {
                pColor = Math.random() > 0.4 ? color : '#ffffff';
            } else if (type === 'HEAL') {
                pColor = Math.random() > 0.5 ? '#4ade80' : '#2dd4bf';
            }

            return {
                id: i,
                x: Math.cos(angle) * velocity,
                y: Math.sin(angle) * velocity,
                size: 4 + Math.random() * (type === 'BOMB' ? 10 : 6),
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
