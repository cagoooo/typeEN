import React, { useEffect, useCallback, useRef, useState } from 'react';
import { ALPHABET, COLORS, VOCABULARY, SHOP_ITEMS } from '../utils/constants';
import { playSound } from '../utils/audio';
import { audioEngine } from '../utils/audioEngine';
import { useGameStore } from '../store/gameStore';
import { CAMPAIGN_LEVELS } from '../utils/levels';
import HandsHint from './HandsHint';

const INITIAL_LETTER_Y_POS = -80;
const LETTER_MIN_SPEED = 1.2;
const LETTER_MAX_SPEED = 2.8;
const SPAWN_MIN_DELAY = 600;
const SPAWN_MAX_DELAY = 1200;

function drawRoundedRect(ctx, x, y, w, h, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

const GameArea = ({ onGameEnd }) => {
    const canvasRef = useRef(null);
    const mode = useGameStore(state => state.mode);
    const health = useGameStore(state => state.health);
    const combo = useGameStore(state => state.combo);
    const gameTime = useGameStore(state => state.gameTime);
    const completedCount = useGameStore(state => state.completedCount);
    const incrementTime = useGameStore(state => state.incrementTime);
    const incrementCompleted = useGameStore(state => state.incrementCompleted);
    const deductHealth = useGameStore(state => state.deductHealth);
    const heal = useGameStore(state => state.heal);
    const incrementCombo = useGameStore(state => state.incrementCombo);
    const resetCombo = useGameStore(state => state.resetCombo);
    const equippedBackground = useGameStore(state => state.equippedBackground);
    const currentCampaignLevel = useGameStore(state => state.currentCampaignLevel);

    const levelConfigRef = useRef(null);
    // Use useMemo to compute levelConfig without side effects in render
    const levelConfig = React.useMemo(
        () => mode === 'CAMPAIGN' ? CAMPAIGN_LEVELS.find(l => l.id === currentCampaignLevel) || null : null,
        [mode, currentCampaignLevel]
    );
    // Keep ref in sync (safe to mutate ref during render when value is derived)
    // This avoids putting it in useCallback deps while still having fresh value in closures.
    levelConfigRef.current = levelConfig;

    const [shake, setShake] = useState(false);

    // Canvas State
    const engineState = useRef({
        letters: [],
        particles: [],
        floatingTexts: [],
        isOver: false,
        shakeTime: 0,
        missedLetters: {}
    });

    // Internal Refs
    const timeRef = useRef(0);
    const lettersToDropRef = useRef([]);

    const triggerShake = () => {
        setShake(true);
        engineState.current.shakeTime = 200;
        setTimeout(() => setShake(false), 200);
    };

    const endGame = useCallback((isWin) => {
        if (engineState.current.isOver) return;
        engineState.current.isOver = true;
        onGameEnd(isWin, { missedLetters: engineState.current.missedLetters });
    }, [onGameEnd]);

    const spawnLetter = useCallback(() => {
        if (lettersToDropRef.current.length === 0) return;
        const char = lettersToDropRef.current.pop();
        const stateCompleted = useGameStore.getState().completedCount;
        const currentMode = useGameStore.getState().mode;

        let type = 'NORMAL';
        let speed = 0;

        if (currentMode === 'BEGINNER') {
            // Extremely slow and constant speed for beginners
            speed = Math.random() * (1.2 - 0.6) + 0.6;
        } else if (currentMode === 'CAMPAIGN' && levelConfigRef.current) {
            speed = levelConfigRef.current.config.speed + (Math.random() * 0.6);
            if (levelConfigRef.current.objective.type === 'PERFECT_WORDS') {
                type = 'NORMAL';
            }
        } else {
            // NORMAL / ENDLESS / WORD modes
            if (stateCompleted > 5) {
                const r = Math.random();
                if (r < 0.08) type = 'BOMB';
                else if (r < 0.15) type = 'HEAL';
            }
            const speedUpFactor = currentMode === 'ENDLESS'
                ? Math.min(stateCompleted * 0.04, 3.0)
                : Math.min(stateCompleted * 0.06, 1.8);
            speed = 1.0 + (Math.random() * 0.4) + speedUpFactor;
        }

        const isWordMode = currentMode === 'WORD';
        const newLetter = {
            id: char + Date.now() + Math.random(),
            char,
            activeIndex: 0,
            type: isWordMode ? 'WORD' : type,
            xPercent: Math.random() * 80 + 10,
            yPos: INITIAL_LETTER_Y_POS,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            speed: speed
        };
        engineState.current.letters.push(newLetter);
    }, []);

    const processHit = useCallback((targetIdx) => {
        const hitLetter = engineState.current.letters[targetIdx];

        const canvasWidth = canvasRef.current ? canvasRef.current.width : window.innerWidth;
        const realX = (hitLetter.xPercent / 100) * canvasWidth;
        const realY = hitLetter.yPos;

        if (hitLetter.type === 'WORD') {
            hitLetter.activeIndex += 1;
            if (hitLetter.activeIndex < hitLetter.char.length) {
                playSound('hit');
                for (let i = 0; i < 5; i++) {
                    engineState.current.particles.push({
                        x: realX, y: realY,
                        vx: (Math.random() - 0.5) * 5,
                        vy: (Math.random() - 0.5) * 5,
                        radius: Math.random() * 2 + 1,
                        color: hitLetter.color,
                        life: 1.0,
                        type: 'NORMAL'
                    });
                }
                return;
            }
        }

        if (hitLetter.type === 'BOSS') {
            hitLetter.activeIndex += 1;
            hitLetter.hp -= 1;
            playSound('hit');
            triggerShake();
            incrementCombo();

            for (let i = 0; i < 8; i++) {
                engineState.current.particles.push({
                    x: realX, y: realY,
                    vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                    radius: Math.random() * 3 + 2, color: hitLetter.color, life: 1.0, type: 'NORMAL'
                });
            }

            if (hitLetter.activeIndex >= hitLetter.char.length || hitLetter.hp <= 0) {
                engineState.current.letters.splice(targetIdx, 1);
                playSound('hit');
                for (let i = 0; i < 50; i++) {
                    engineState.current.particles.push({
                        x: realX, y: realY,
                        vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20,
                        radius: Math.random() * 6 + 4, color: '#facc15', life: 1.0, type: 'BOMB', isShockwave: i === 0
                    });
                }
                engineState.current.floatingTexts.push({ x: realX, y: realY - 30, text: 'BOSS DEFEATED!', colorHex: '#facc15', life: 1.5 });
                incrementCompleted();

                // Return BGM to normal after defeating boss
                audioEngine.playBGM(useGameStore.getState().equippedBgm);
            }
            return;
        }

        engineState.current.letters.splice(targetIdx, 1);

        if (hitLetter.type === 'BOMB') {
            playSound('miss');
            resetCombo();
            triggerShake();
            const newHealth = deductHealth(2);

            // Spawn Particles
            for (let i = 0; i < 30; i++) {
                engineState.current.particles.push({
                    x: realX, y: realY,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15,
                    radius: Math.random() * 3 + 2,
                    color: '#ef4444',
                    life: 1.0,
                    type: 'BOMB',
                    isShockwave: i === 0
                });
            }
            engineState.current.floatingTexts.push({ x: realX, y: realY, text: '-2 HP', colorHex: '#ef4444', life: 1.0 });

            if (newHealth <= 0) endGame(false);
            return;
        }

        if (hitLetter.type === 'HEAL') {
            heal(1);
            engineState.current.floatingTexts.push({ x: realX, y: realY - 40, text: '+1 HP', colorHex: '#4ade80', life: 1.0 });
        }

        const yRatio = hitLetter.yPos / window.innerHeight;
        let hitTextStr = hitLetter.type === 'HEAL' ? '治癒！' : '不錯';
        let hitColorHex = hitLetter.type === 'HEAL' ? '#4ade80' : '#4ade80';
        let pType = hitLetter.type === 'HEAL' ? 'HEAL' : 'NORMAL';

        if (hitLetter.type !== 'HEAL') {
            if (yRatio > 0.8) {
                hitTextStr = '完美！';
                hitColorHex = '#fde047';
                pType = 'PERFECT';
            } else if (yRatio > 0.6) {
                hitTextStr = '太棒了！';
                hitColorHex = '#67e8f9';
            }
        }

        engineState.current.floatingTexts.push({ x: realX, y: realY, text: hitTextStr, colorHex: hitColorHex, life: 1.0 });

        const pCount = pType === 'PERFECT' ? 48 : pType === 'HEAL' ? 30 : 25;
        const pSpeed = pType === 'PERFECT' ? 14 : pType === 'HEAL' ? 6 : 9;
        for (let i = 0; i < pCount; i++) {
            engineState.current.particles.push({
                x: realX, y: realY,
                vx: (Math.random() - 0.5) * pSpeed,
                vy: (Math.random() - 0.5) * pSpeed,
                radius: Math.random() * 4 + 1,
                color: hitLetter.type === 'HEAL' ? '#fbbf24' : hitLetter.color,
                life: 1.0 + Math.random() * 0.5,
                type: 'NORMAL'
            });
        }

        const newCompleted = incrementCompleted();
        incrementCombo();

        const currentMode = useGameStore.getState().mode;
        const maxCompleted = currentMode === 'WORD' ? 10 : ALPHABET.length;

        if ((currentMode === 'NORMAL' || currentMode === 'BEGINNER' || currentMode === 'WORD') && newCompleted >= maxCompleted) {
            playSound('end');
            endGame(true);
        } else if (currentMode === 'CAMPAIGN' && levelConfigRef.current) {
            const lc = levelConfigRef.current;
            if ((lc.objective.type === 'WORDS' || lc.objective.type === 'PERFECT_WORDS' || lc.objective.type === 'BOSS') && newCompleted >= lc.objective.target) {
                playSound('end');
                endGame(true);
            } else {
                playSound('hit');
            }
        } else {
            playSound('hit');
        }
    }, [endGame, deductHealth, incrementCompleted, incrementCombo, heal, resetCombo]);

    // Keyboard & Interaction
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (engineState.current.isOver || e.repeat) return;
            const key = e.key.toUpperCase();
            if (!ALPHABET.includes(key)) return;

            let targetIdx = -1;
            let lowestY = -Infinity;

            engineState.current.letters.forEach((l, idx) => {
                const targetChar = (l.type === 'WORD' || l.type === 'BOSS') ? l.char[l.activeIndex] : l.char;
                if (targetChar === key && l.yPos > lowestY) {
                    lowestY = l.yPos;
                    targetIdx = idx;
                }
            });

            if (targetIdx !== -1) {
                processHit(targetIdx);
            } else {
                playSound('miss');
                resetCombo();
                triggerShake();

                // Anti-spam penalty
                const newHealth = useGameStore.getState().deductHealth(1);
                const canvasWidth = canvasRef.current ? canvasRef.current.width : window.innerWidth;
                const canvasHeight = canvasRef.current ? canvasRef.current.height : window.innerHeight;
                engineState.current.floatingTexts.push({
                    x: canvasWidth / 2 + (Math.random() * 100 - 50),
                    y: canvasHeight / 2 + (Math.random() * 100 - 50),
                    text: '失誤 -1 HP',
                    colorHex: '#ef4444',
                    life: 0.8
                });

                if (newHealth <= 0) {
                    endGame(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [processHit]);

    const handleCanvasPointerDown = (e) => {
        if (engineState.current.isOver || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Search from top (highest z-index effectively since we draw sequentially, but actually we want the lowest Y or closest box)
        let clickedIdx = -1;
        const size = 80; // approximate hit box

        engineState.current.letters.forEach((l, idx) => {
            const lx = (l.xPercent / 100) * rect.width;
            const ly = l.yPos;
            const wSize = l.type === 'WORD' ? Math.max(80, l.char.length * 20 + 40) : size;
            if (x >= lx - wSize / 2 && x <= lx + wSize / 2 && y >= ly - size / 2 && y <= ly + size / 2) {
                clickedIdx = idx;
            }
        });

        if (clickedIdx !== -1) {
            processHit(clickedIdx);
        }
    };

    // Main Engine Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });

        // Resize handler
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resize);
        resize();

        if (useGameStore.getState().mode === 'WORD') {
            const shuffled = [...VOCABULARY].sort(() => Math.random() - 0.5);
            lettersToDropRef.current = shuffled.slice(0, 10);
        } else {
            lettersToDropRef.current = [...ALPHABET].sort(() => Math.random() - 0.5);
        }

        engineState.current.isOver = false;
        engineState.current.letters = [];
        engineState.current.particles = [];
        engineState.current.floatingTexts = [];
        engineState.current.missedLetters = {};
        timeRef.current = 0;

        audioEngine.playBGM(useGameStore.getState().equippedBgm);

        const timer = setInterval(() => {
            if (!engineState.current.isOver) {
                timeRef.current += 1;
                incrementTime();

                // Spawn BOSS every 45 seconds in ENDLESS mode
                if (useGameStore.getState().mode === 'ENDLESS' && timeRef.current > 0 && timeRef.current % 45 === 0) {
                    const bossWords = ["TERMINATOR", "OBLITERATION", "CYBERSPACE", "SYNCHRONIZE", "OVERCLOCKING"];
                    const bossWord = bossWords[Math.floor(Math.random() * bossWords.length)];
                    engineState.current.letters.push({
                        id: 'BOSS_' + Date.now(),
                        char: bossWord,
                        activeIndex: 0,
                        type: 'BOSS',
                        hp: bossWord.length,
                        maxHp: bossWord.length,
                        xPercent: 50,
                        yPos: -150,
                        color: '#facc15',
                        speed: 0.8
                    });

                    audioEngine.playBossBGM();


                    const canvasWidth = canvasRef.current ? canvasRef.current.width : window.innerWidth;
                    const canvasHeight = canvasRef.current ? canvasRef.current.height : window.innerHeight;
                    engineState.current.floatingTexts.push({
                        x: canvasWidth / 2, y: canvasHeight / 3,
                        text: '⚠ BOSS INCOMING ⚠', colorHex: '#ef4444', life: 2.0
                    });
                }

                // Campaign SURVIVE objective check
                const campaignMode = useGameStore.getState().mode;
                const lc = levelConfigRef.current;
                if (campaignMode === 'CAMPAIGN' && lc && lc.objective.type === 'SURVIVE') {
                    if (timeRef.current >= lc.objective.target) {
                        playSound('end');
                        endGame(true);
                    }
                }

                // Campaign BOSS spawning
                if (campaignMode === 'CAMPAIGN' && lc && lc.objective.type === 'BOSS' && timeRef.current === 2) {
                    const bossWord = lc.config.bossWord || "NEUROMANCER";
                    engineState.current.letters.push({
                        id: 'BOSS_CAMPAIGN_' + Date.now(),
                        char: bossWord,
                        activeIndex: 0,
                        type: 'BOSS',
                        hp: bossWord.length,
                        maxHp: bossWord.length,
                        xPercent: 50,
                        yPos: -150,
                        color: '#facc15',
                        speed: lc.config.speed * 0.6
                    });

                    audioEngine.playBossBGM();
                    const canvasWidth = canvasRef.current ? canvasRef.current.width : window.innerWidth;
                    engineState.current.floatingTexts.push({
                        x: canvasWidth / 2, y: 200,
                        text: '⚠ CORE GUARDIAN ⚠', colorHex: '#ef4444', life: 3.0
                    });
                }
            }
        }, 1000);

        // Use a generation token (incrementing counter) to prevent duplicate spawn chains.
        // When triggerSpawn is called, it cancels the old chain by bumping the token.
        let spawnGeneration = 0;

        const spawnSequence = (generation) => {
            // If a newer generation has started, this chain is obsolete - stop.
            if (generation !== spawnGeneration) return;
            if (engineState.current.isOver) return;

            const state = useGameStore.getState();
            const gm = state.mode;
            const currentCompleted = state.completedCount;
            const target = (gm === 'WORD') ? 10 : ALPHABET.length; // ENDLESS/CAMPAIGN refill infinitely

            // Refill if needed
            if (lettersToDropRef.current.length === 0) {
                if (gm === 'ENDLESS' || gm === 'CAMPAIGN') {
                    lettersToDropRef.current = [...ALPHABET].sort(() => Math.random() - 0.5);
                } else if (currentCompleted < target) {
                    // Refill for NORMAL/BEGINNER/WORD if letters ran out before target
                    lettersToDropRef.current = [...ALPHABET].sort(() => Math.random() - 0.5);
                }
            }

            if (lettersToDropRef.current.length > 0) {
                spawnLetter();
                const currentMode = useGameStore.getState().mode;

                let delay = 0;
                if (currentMode === 'BEGINNER') {
                    delay = Math.random() * (2000 - 1200) + 1200;
                } else if (currentMode === 'CAMPAIGN' && levelConfigRef.current) {
                    delay = levelConfigRef.current.config.spawnInterval * (Math.random() * 0.4 + 0.8);
                } else {
                    const progressFactor = currentMode === 'ENDLESS'
                        ? Math.min(currentCompleted * 0.05, 0.8)
                        : Math.min(currentCompleted * 0.05, 0.5);
                    const currentMinDelay = Math.max(SPAWN_MIN_DELAY * (1.5 - progressFactor), 300);
                    const currentMaxDelay = Math.max(SPAWN_MAX_DELAY * (1.5 - progressFactor), 600);
                    delay = Math.random() * (currentMaxDelay - currentMinDelay) + currentMinDelay;
                }

                setTimeout(() => spawnSequence(generation), delay);
            }
            // If lettersToDropRef is empty and target is reached, we intentionally stop. Game will end via completedCount check.
        };

        // triggerSpawn: cancel old chain, start fresh one immediately.
        engineState.current.triggerSpawn = () => {
            if (engineState.current.isOver) return;
            spawnGeneration++; // Cancel old chain
            spawnSequence(spawnGeneration);
        };

        // Start initial spawn chain
        spawnSequence(spawnGeneration);

        let animationFrame;
        let lastTime = performance.now();

        const render = (currentTime) => {
            if (engineState.current.isOver) return;
            let deltaTime = (currentTime - lastTime) / 16.66;
            // Defensive capping: cap frame gap at ~5 frames, handle negative/NaN
            if (deltaTime < 0 || isNaN(deltaTime)) deltaTime = 1;
            if (deltaTime > 5) deltaTime = 5;

            lastTime = currentTime;

            const width = canvas.width;
            const height = canvas.height;

            // Clear
            ctx.clearRect(0, 0, width, height);

            // Screen Shake Transform
            let isShaking = false;
            if (engineState.current.shakeTime > 0) {
                isShaking = true;
                ctx.save();
                const dx = (Math.random() - 0.5) * 10;
                const dy = (Math.random() - 0.5) * 10;
                ctx.translate(dx, dy);
                engineState.current.shakeTime -= 16.66;
            }

            // Update & Draw Letters
            let newLetters = [];
            let hpDeducted = 0;

            // Find Highlight (Lowest yPos)
            let lowestY = -Infinity;
            let highlightId = null;
            engineState.current.letters.forEach(l => {
                if (l.type !== 'BOMB' && l.yPos > lowestY) {
                    lowestY = l.yPos;
                    highlightId = l.id;
                }
            });

            engineState.current.letters.forEach(l => {
                l.yPos += l.speed * deltaTime;
                if (l.yPos > height) {
                    if (l.type === 'BOSS') {
                        hpDeducted += 5; // Boss escape hurts a lot
                        useGameStore.getState().resetCombo();
                        triggerShake();
                        const canvasWidth = canvasRef.current ? canvasRef.current.width : window.innerWidth;
                        engineState.current.floatingTexts.push({ x: canvasWidth / 2, y: height / 2, text: 'BOSS ESCAPED! -5 HP', colorHex: '#ef4444', life: 1.5 });
                    } else if (l.type !== 'BOMB') {
                        const curMode = useGameStore.getState().mode;
                        if (curMode !== 'BEGINNER') {
                            hpDeducted += 1;
                        }
                        // PERFECT_WORDS: any miss = instant fail
                        if (curMode === 'CAMPAIGN' && levelConfigRef.current && levelConfigRef.current.objective.type === 'PERFECT_WORDS') {
                            engineState.current.floatingTexts.push({ x: width / 2, y: height / 2 - 60, text: '任務失敗！精準度不足', colorHex: '#ef4444', life: 2.0 });
                            endGame(false);
                            return;
                        }
                        engineState.current.missedLetters[l.char] = (engineState.current.missedLetters[l.char] || 0) + 1;
                        useGameStore.getState().resetCombo();
                        triggerShake();

                        // Push back to the start of the array to be spawned next
                        lettersToDropRef.current.unshift(l.char);

                        // Always trigger a new spawn chain (generation token prevents duplicates)
                        engineState.current.triggerSpawn();
                    }
                } else {
                    newLetters.push(l);

                    if (l.type !== 'BOSS') {
                        const x = (l.xPercent / 100) * width;
                        const y = l.yPos;
                        const isWord = l.type === 'WORD';
                        const boxHeight = 64;
                        const isHighlight = l.id === highlightId;

                        ctx.save();
                        ctx.font = "bold 32px 'Orbitron', sans-serif";
                        const textWidth = ctx.measureText(l.char).width;
                        const size = isWord ? Math.max(64, textWidth + 40) : 64;

                        ctx.translate(x, y);

                        let currentScale = 1;
                        if (isHighlight) {
                            currentScale = 1.25 + Math.sin(currentTime / 150) * 0.05;
                            ctx.scale(currentScale, currentScale);
                        }

                        ctx.fillStyle = isHighlight ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)';
                        ctx.strokeStyle = isHighlight ? '#ffffff' : l.color;
                        ctx.lineWidth = isHighlight ? 4 : 2;
                        ctx.shadowColor = isHighlight ? '#ffffff' : l.color;
                        ctx.shadowBlur = isHighlight ? 25 + Math.sin(currentTime / 150) * 10 : 10;

                        drawRoundedRect(ctx, -size / 2, -boxHeight / 2, size, boxHeight, 12);
                        ctx.fill();
                        ctx.stroke();

                        ctx.shadowBlur = isHighlight ? 25 : 5;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';

                        if (isWord) {
                            const completedPart = l.char.substring(0, l.activeIndex);
                            const currentPart = l.char.substring(l.activeIndex, l.activeIndex + 1);
                            const remainingPart = l.char.substring(l.activeIndex + 1);

                            ctx.textAlign = 'left';
                            let currentX = -textWidth / 2;

                            ctx.fillStyle = '#6b7280';
                            ctx.fillText(completedPart, currentX, 0);
                            currentX += ctx.measureText(completedPart).width;

                            ctx.fillStyle = '#4ade80';
                            ctx.fillText(currentPart, currentX, 0);
                            currentX += ctx.measureText(currentPart).width;

                            ctx.fillStyle = '#fff';
                            ctx.fillText(remainingPart, currentX, 0);
                        } else {
                            ctx.fillStyle = l.type === 'BOMB' ? '#ef4444' : l.type === 'HEAL' ? '#fbbf24' : '#fff';
                            ctx.fillText(l.char, 0, 0);
                        }

                        if (l.type === 'BOMB') {
                            ctx.font = "16px sans-serif";
                            ctx.fillText("💣", size / 2 - 5, -boxHeight / 2 + 5);
                        } else if (l.type === 'HEAL') {
                            ctx.font = "16px sans-serif";
                            ctx.fillText("❤️", size / 2 - 5, -boxHeight / 2 + 5);
                        }
                        ctx.restore();
                    } else if (l.type === 'BOSS') {
                        const x = (l.xPercent / 100) * width;
                        const y = l.yPos;
                        const isHighlight = l.id === highlightId;

                        ctx.save();
                        ctx.font = "bold 48px 'Orbitron', sans-serif";
                        const textWidth = ctx.measureText(l.char).width;
                        const bossWidth = Math.max(200, textWidth + 60);
                        const bossHeight = 80;

                        ctx.translate(x, y);
                        if (isHighlight) {
                            const currentScale = 1.1 + Math.sin(currentTime / 150) * 0.02;
                            ctx.scale(currentScale, currentScale);
                        }

                        ctx.shadowColor = isHighlight ? '#ffffff' : l.color;
                        ctx.shadowBlur = isHighlight ? 50 + Math.sin(currentTime / 150) * 15 : 20;
                        ctx.fillStyle = 'rgba(20, 0, 0, 0.8)';
                        ctx.strokeStyle = isHighlight ? '#ffffff' : '#ef4444';
                        ctx.lineWidth = isHighlight ? 6 : 4;

                        drawRoundedRect(ctx, -bossWidth / 2, -bossHeight / 2, bossWidth, bossHeight, 15);
                        ctx.fill();
                        ctx.stroke();

                        const hpPercent = Math.max(0, l.hp / l.maxHp);
                        ctx.fillStyle = '#ef4444';
                        ctx.shadowBlur = 0;
                        ctx.fillRect(- bossWidth / 2 + 10, -bossHeight / 2 - 15, (bossWidth - 20) * hpPercent, 6);
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(- bossWidth / 2 + 10, -bossHeight / 2 - 15, bossWidth - 20, 6);

                        ctx.shadowBlur = 15;
                        ctx.textBaseline = 'middle';

                        // Draw multi-colored word
                        const completedPart = l.char.substring(0, l.activeIndex);
                        const currentPart = l.char.substring(l.activeIndex, l.activeIndex + 1);
                        const remainingPart = l.char.substring(l.activeIndex + 1);

                        ctx.textAlign = 'left';
                        let currentX = -textWidth / 2;

                        ctx.fillStyle = '#6b7280';
                        ctx.fillText(completedPart, currentX, 0);
                        currentX += ctx.measureText(completedPart).width;

                        if (currentPart) {
                            ctx.fillStyle = '#ef4444';
                            ctx.fillText(currentPart, currentX, 0);
                            currentX += ctx.measureText(currentPart).width;
                        }

                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(remainingPart, currentX, 0);

                        ctx.restore();
                    }
                }
            });
            engineState.current.letters = newLetters;

            // Damage handling
            if (hpDeducted > 0) {
                const currentHealth = useGameStore.getState().deductHealth(hpDeducted);
                if (currentHealth <= 0) {
                    endGame(false);
                }
            }

            // Update & Draw Particles
            engineState.current.particles.forEach(p => {
                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;
                p.life -= 0.02 * deltaTime;
                if (p.type !== 'BOMB') p.radius *= 0.95;
                else p.radius += 2 * deltaTime;

                if (p.life > 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.life;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 10;
                    ctx.fill();

                    if (p.isShockwave) {
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, Math.max(1, p.radius * 3 - 5), 0, Math.PI * 2);
                        ctx.strokeStyle = p.color;
                        ctx.lineWidth = 4 * p.life;
                        ctx.stroke();
                    }
                    ctx.restore();
                }
            });
            engineState.current.particles = engineState.current.particles.filter(p => p.life > 0);

            // Update & Draw Floating Texts
            engineState.current.floatingTexts.forEach(t => {
                t.y -= 1.5 * deltaTime;
                t.life -= 0.015 * deltaTime;
                if (t.life > 0) {
                    ctx.save();
                    ctx.font = "bold 24px 'Orbitron', sans-serif";
                    ctx.fillStyle = t.colorHex;
                    ctx.globalAlpha = t.life;
                    ctx.shadowColor = t.colorHex;
                    ctx.shadowBlur = 10;
                    ctx.textAlign = 'center';
                    ctx.fillText(t.text, t.x, t.y);
                    ctx.restore();
                }
            });
            engineState.current.floatingTexts = engineState.current.floatingTexts.filter(t => t.life > 0);

            if (isShaking) {
                ctx.restore();
            }

            animationFrame = requestAnimationFrame(render);
        };

        animationFrame = requestAnimationFrame(render);

        return () => {
            clearInterval(timer);
            clearTimeout(engineState.current.spawnTimeout);
            cancelAnimationFrame(animationFrame);
            window.removeEventListener('resize', resize);
            engineState.current.isOver = true;
            audioEngine.stopBGM();
        };
    }, [spawnLetter, incrementTime, endGame]);

    useEffect(() => {
        audioEngine.updateDynamics(combo, health);
        if (combo >= 10 && (combo === 10 || combo === 20 || combo === 50 || combo === 100)) {
            // Only trigger voice if we specifically hit these milestones EXACTLY.
            // Since this useEffect triggers on combo change, whencombo === 10, it plays.
            audioEngine.playComboVoice(combo);
        }
    }, [combo, health]);

    let gridClass = 'bg-grid-neon opacity-50';
    if (combo >= 50) gridClass = 'bg-grid-neon-fever opacity-70';
    else if (combo >= 20) gridClass = 'bg-grid-neon-heat opacity-60';

    const activeTheme = SHOP_ITEMS.find(item => item.id === equippedBackground);
    const gridStyle = activeTheme ? { '--grid-color': activeTheme.value } : {};

    // We can extract activeLetters for the HandsHint, which doesn't need to be drawn on Canvas necessarily,
    // or we can mock it. HandsHint only relies on `activeLetters.length` to show/hide and activeLetters items for coloring fingers.
    // However, since activeLetters is now entirely inside Canvas ref state, HandsHint won't rerender!
    // Solution: Just pass a basic placeholder or force a small state update for HandsHint? 
    // Wait, the user requirement for HandsHint is good, but Hands is just a DOM element at the bottom.
    // For now, I will omit `HandsHint` or pass empty array since it's just visually decorative and not strictly required for logic, 
    // or I can manually trigger a minor React state update to sync `activeLetters`.
    // Let's use an interval to sync active letters to a react state every 100ms for the HandHint to avoid 60-FPS DOM overhead.

    const [syncLetters, setSyncLetters] = useState([]);
    useEffect(() => {
        const interval = setInterval(() => {
            if (!engineState.current.isOver) {
                // shallow copy to avoid heavy clones, just needed for HandsHint logic over char mapping
                setSyncLetters(engineState.current.letters.map(l => ({
                    char: (l.type === 'WORD' || l.type === 'BOSS') ? l.char[l.activeIndex] : l.char,
                    yPos: l.yPos
                })));
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            className={`relative w-full h-full overflow-hidden ${shake ? 'animate-shake' : ''} `}
            style={{
                transform: `scale(${1 + Math.min(combo * 0.005, 0.15)})`,
                transition: 'transform 0.3s ease-out'
            }}
        >
            <div className="absolute inset-0 z-0 opacity-30 perspective-1000 transition-colors duration-700">
                <div
                    className={`absolute inset-0 ${gridClass} transform rotate-x-60 scale-150 origin-bottom transition-all duration-700`}
                    style={gridStyle}
                ></div>
            </div>

            {health <= 3 && <div className="health-warning transition-opacity duration-300"></div>}

            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-30 font-['Orbitron']">
                <div className="flex gap-4">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] font-sans font-bold">
                        {mode === 'NORMAL' ? `進度: ${completedCount} /${ALPHABET.length}` : mode === 'WORD' ? `進度: ${completedCount}/10` : `擊破: ${completedCount} `}
                    </div>
                    <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 px-4 py-2 rounded-xl text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)] font-sans font-bold">
                        生命: {health}
                    </div>
                </div>

                <div className="flex gap-4">
                    {combo > 1 && (
                        <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] font-sans">
                            {combo} 連擊！
                        </div>
                    )}
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl text-white shadow-[0_0_15px_rgba(255,255,255,0.1)] font-sans font-bold">
                        時間: {gameTime}s
                    </div>
                </div>
            </div>

            <canvas
                ref={canvasRef}
                className="absolute inset-0 z-20 w-full h-full touch-none"
            />

            <HandsHint activeLetters={syncLetters} />
        </div>
    );
};

export default GameArea;
