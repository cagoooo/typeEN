import { Howl } from 'howler';

// Store your MP3 files in the public folder and reference them here, e.g., '/audio/bgm1.mp3'
const BGM_TRACKS = [];

class AudioEngine {
    constructor() {
        this.bgms = BGM_TRACKS.map(url => new Howl({
            src: [url],
            loop: true,
            volume: 0.5,
            preload: true,
            html5: true, // Best practice for streaming long BGM without blocking memory
        }));
        this.currentBgm = null;
        this.currentRate = 1.0;
    }

    playBGM() {
        if (this.bgms.length === 0) return; // No BGM tracks available

        if (this.currentBgm && this.currentBgm.playing()) {
            return;
        }

        // Randomly select a track
        const randomIndex = Math.floor(Math.random() * this.bgms.length);
        this.currentBgm = this.bgms[randomIndex];

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
}

export const audioEngine = new AudioEngine();
