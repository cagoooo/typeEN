import React, { useEffect, useState } from 'react';

const FloatingText = ({ id, x, y, text, color, onComplete }) => {
    const [opacity, setOpacity] = useState(1);
    const [translateY, setTranslateY] = useState(0);

    useEffect(() => {
        let frame;
        const startTime = performance.now();
        const duration = 800; // ms

        const animate = (time) => {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth moving up and fading out
            setTranslateY(-progress * 50); // move up 50px
            setOpacity(1 - progress);

            if (progress < 1) {
                frame = requestAnimationFrame(animate);
            } else {
                onComplete();
            }
        };

        frame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(frame);
    }, [onComplete]);

    return (
        <div
            className={`absolute pointer-events-none font-['Orbitron'] font-bold text-2xl z-40 ${color} tracking-widest`}
            style={{
                left: `${x}%`,
                top: `${y}px`,
                transform: `translate(-50%, ${translateY}px)`,
                opacity: opacity
            }}
        >
            {text}
        </div>
    );
};

export default FloatingText;
