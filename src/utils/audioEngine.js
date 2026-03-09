import { Howl } from 'howler';
import { BGM_CHOICES } from './constants';

const synth = window.speechSynthesis;

class AudioEngine {
    constructor() {
        this.bgms = {};
        this.autoKeys = [];
        this.initialized = false;
        this.currentBgm = null;
        this.currentRate = 1.0;
    }

    init() {
        if (this.initialized) return;

        BGM_CHOICES.forEach(choice => {
            if (choice.url !== 'auto') {
                this.bgms[choice.id] = new Howl({
                    src: [choice.url],
                    loop: true,
                    volume: 0.5,
                    preload: true,
                    html5: true,
                });
                this.autoKeys.push(choice.id);
            }
        });

        this.bossBgm = new Howl({
            src: ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'], // Intense Boss music
            loop: true,
            volume: 0.6,
            preload: true,
            html5: true,
        });

        this.initialized = true;
    }

    playBGM(bgmId = 'bgm_auto') {
        this.init(); // Initialize on first play (after user gesture)
        if (this.autoKeys.length === 0) return; // No BGM tracks available

        if (this.currentBgm && this.currentBgm.playing()) {
            this.currentBgm.stop();
        }

        let trackIdToPlay = bgmId;
        if (bgmId === 'bgm_auto' || !this.bgms[bgmId]) {
            const randomIndex = Math.floor(Math.random() * this.autoKeys.length);
            trackIdToPlay = this.autoKeys[randomIndex];
        }

        this.currentBgm = this.bgms[trackIdToPlay];

        // Reset rate and volume to default
        if (this.currentBgm) {
            this.currentBgm.rate(1.0);
            this.currentBgm.volume(0.5);
            this.currentRate = 1.0;
            this.currentBgm.play();
        }
    }

    stopBGM() {
        if (this.currentBgm) {
            this.currentBgm.stop();
            this.currentBgm = null;
        }
        if (this.bossBgm && this.bossBgm.playing()) {
            this.bossBgm.stop();
        }
    }

    playBossBGM() {
        this.init();
        if (this.currentBgm && this.currentBgm.playing()) {
            this.currentBgm.stop();
        }
        if (!this.bossBgm.playing()) {
            this.bossBgm.rate(1.0);
            this.bossBgm.volume(0.6);
            this.bossBgm.play();
            // keep currentBgm ref as bossBgm so updateDynamics works on it
            this.currentBgm = this.bossBgm;
        }
    }

    setVolume(vol) {
        if (this.currentBgm) {
            this.currentBgm.volume(vol);
        }
    }

    updateDynamics(combo, health) {
        if (!this.currentBgm || !this.currentBgm.playing()) return;

        let targetRate = 1.0;
        let targetVolume = 0.5;

        // Fever mode
        if (combo >= 50) {
            targetRate = 1.15;
            targetVolume = 0.7;
        }
        // Heat mode
        else if (combo >= 20) {
            targetRate = 1.05;
            targetVolume = 0.6;
        }

        // Danger mode overrides combo pacing
        if (health <= 3) {
            targetRate = 1.25; // Frantic
            targetVolume = 0.8;
        }

        if (this.currentRate !== targetRate) {
            this.currentBgm.rate(targetRate);
            this.currentRate = targetRate;
        }

        this.currentBgm.volume(targetVolume);
    }

    playComboVoice(combo) {
        if (!synth) return;

        let text = "";
        if (combo === 10) text = "Good!";
        else if (combo === 20) text = "Great!";
        else if (combo === 50) text = "Unstoppable!";
        else if (combo === 100) text = "Godlike!";

        if (text) {
            // Cancel any ongoing speech to prioritize the combo announcer
            synth.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = 0.6; // Slightly deeper, robotic tone for cyborg/neon feel
            utterance.rate = 1.3;  // Fast pacing
            utterance.volume = 0.9;
            utterance.lang = 'en-US';
            synth.speak(utterance);
        }
    }
}

export const audioEngine = new AudioEngine();
