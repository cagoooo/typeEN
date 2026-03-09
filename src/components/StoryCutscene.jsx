import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { CAMPAIGN_LEVELS } from '../utils/levels';

const StoryCutscene = () => {
    const currentCampaignLevel = useGameStore((state) => state.currentCampaignLevel);
    const setGameState = useGameStore((state) => state.setGameState);

    const resetGame = useGameStore((state) => state.resetGame);

    const [storyLines, setStoryLines] = useState([]);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        const level = CAMPAIGN_LEVELS.find(l => l.id === currentCampaignLevel);
        if (level && level.story) {
            setStoryLines(level.story);
            setCurrentLineIndex(0);
            setDisplayedText('');
            setIsTyping(true);
        } else {
            // Failsafe: start game immediately if no story
            resetGame();
            setGameState('PLAYING');
        }
    }, [currentCampaignLevel, setGameState, resetGame]);

    useEffect(() => {
        if (!isTyping || storyLines.length === 0 || currentLineIndex >= storyLines.length) return;

        const fullText = storyLines[currentLineIndex];
        let charIndex = 0;

        setDisplayedText(''); // Reset display text for new line

        const typeInterval = setInterval(() => {
            if (charIndex < fullText.length) {
                setDisplayedText(prev => prev + fullText.charAt(charIndex));
                charIndex++;
            } else {
                clearInterval(typeInterval);
                setIsTyping(false);
            }
        }, 50); // Typing speed

        return () => clearInterval(typeInterval);
    }, [currentLineIndex, isTyping, storyLines]);

    const handleNext = () => {
        if (isTyping) {
            // Instantly finish typing current line
            setDisplayedText(storyLines[currentLineIndex]);
            setIsTyping(false);
        } else {
            // Move to next line or start game
            if (currentLineIndex < storyLines.length - 1) {
                setCurrentLineIndex(prev => prev + 1);
                setIsTyping(true);
            } else {
                resetGame();
                setGameState('PLAYING');
            }
        }
    };

    const handleSkip = () => {
        resetGame();
        setGameState('PLAYING');
    };

    if (storyLines.length === 0) return null;

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden font-mono" onClick={handleNext}>
            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10"></div>

            <div className="relative z-20 w-full max-w-3xl p-8 border border-green-500/30 bg-black/80 rounded shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                <div className="text-green-500 mb-4 flex justify-between items-center border-b border-green-500/30 pb-2">
                    <span>TERMINAL - SYSTEM CONNECTION: ESTABLISHED</span>
                    <button
                        onClick={(e) => { e.stopPropagation(); handleSkip(); }}
                        className="text-gray-500 hover:text-green-400 text-sm transition-colors"
                    >
                        [SKIP]
                    </button>
                </div>

                <div className="min-h-[200px] text-green-400 text-lg leading-relaxed whitespace-pre-wrap">
                    {/* Previous lines (dimmed) */}
                    {storyLines.slice(0, currentLineIndex).map((line, i) => (
                        <div key={i} className="mb-4 text-green-700">{line}</div>
                    ))}

                    {/* Current typing line */}
                    {currentLineIndex < storyLines.length && (
                        <div className="mb-4">
                            {displayedText}
                            <span className="inline-block w-2 h-5 ml-1 bg-green-500 animate-pulse"></span>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center text-green-600/50 text-sm animate-pulse">
                    &gt; Click anywhere to continue_
                </div>
            </div>
        </div>
    );
};

export default StoryCutscene;
