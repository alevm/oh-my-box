// Oh My Box - Synthesizer (Oscillators + Noise)

class Synth {
    constructor() {
        this.oscillator = null;
        this.noiseNode = null;
        this.noiseGain = null;
        this.filter = null;
        this.oscGain = null;

        this.playing = false;

        // Parameters
        this.params = {
            waveform: 'sine',
            frequency: 220,
            detune: 0,
            noiseType: 'white',
            noiseLevel: 0,
            filterCutoff: 2000,
            filterRes: 1
        };

        // ADSR envelope (in milliseconds, sustain is 0-100%)
        this.adsr = {
            attack: 10,
            decay: 100,
            sustain: 70,
            release: 200
        };

        this.noiseBuffer = null;
    }

    async init() {
        const ctx = window.audioEngine.getContext();
        if (!ctx) return false;

        // Pre-generate noise buffer
        this.generateNoiseBuffer(ctx);

        console.log('Synth initialized');
        return true;
    }

    generateNoiseBuffer(ctx) {
        // Create 2 seconds of noise
        const bufferSize = ctx.sampleRate * 2;
        this.noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
    }

    start() {
        if (this.playing) return;

        const ctx = window.audioEngine.getContext();
        if (!ctx) return;

        // Create filter
        this.filter = ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = this.params.filterCutoff;
        this.filter.Q.value = this.params.filterRes;

        // Create oscillator
        this.oscillator = ctx.createOscillator();
        this.oscillator.type = this.params.waveform;
        this.oscillator.frequency.value = this.params.frequency;
        this.oscillator.detune.value = this.params.detune;

        this.oscGain = ctx.createGain();
        this.oscGain.gain.value = 0.7;

        // Create noise source
        this.noiseNode = ctx.createBufferSource();
        this.noiseNode.buffer = this.noiseBuffer;
        this.noiseNode.loop = true;

        this.noiseGain = ctx.createGain();
        this.noiseGain.gain.value = this.params.noiseLevel / 100;

        // Connect oscillator path
        this.oscillator.connect(this.oscGain);
        this.oscGain.connect(this.filter);

        // Connect noise path
        this.noiseNode.connect(this.noiseGain);
        this.noiseGain.connect(this.filter);

        // Connect to synth channel
        window.audioEngine.connectToChannel(this.filter, 'synth');

        // Start
        this.oscillator.start();
        this.noiseNode.start();
        this.playing = true;
    }

    stop() {
        if (!this.playing) return;

        try {
            if (this.oscillator) {
                this.oscillator.stop();
                this.oscillator.disconnect();
                this.oscillator = null;
            }
            if (this.noiseNode) {
                this.noiseNode.stop();
                this.noiseNode.disconnect();
                this.noiseNode = null;
            }
            if (this.filter) {
                this.filter.disconnect();
                this.filter = null;
            }
            if (this.oscGain) {
                this.oscGain.disconnect();
                this.oscGain = null;
            }
            if (this.noiseGain) {
                this.noiseGain.disconnect();
                this.noiseGain = null;
            }
        } catch (e) {}

        this.playing = false;
    }

    toggle() {
        if (this.playing) {
            this.stop();
        } else {
            this.start();
        }
        return this.playing;
    }

    isPlaying() {
        return this.playing;
    }

    setWaveform(type) {
        this.params.waveform = type;
        if (this.oscillator) {
            this.oscillator.type = type;
        }
    }

    setFrequency(freq) {
        this.params.frequency = freq;
        if (this.oscillator) {
            const ctx = window.audioEngine.getContext();
            this.oscillator.frequency.setTargetAtTime(freq, ctx.currentTime, 0.02);
        }
    }

    setDetune(cents) {
        this.params.detune = cents;
        if (this.oscillator) {
            const ctx = window.audioEngine.getContext();
            this.oscillator.detune.setTargetAtTime(cents, ctx.currentTime, 0.02);
        }
    }

    setNoiseType(type) {
        this.params.noiseType = type;
        // Would need to regenerate buffer for different noise colors
        // For now, just store the parameter
    }

    setNoiseLevel(level) {
        this.params.noiseLevel = level;
        if (this.noiseGain) {
            const ctx = window.audioEngine.getContext();
            this.noiseGain.gain.setTargetAtTime(level / 100, ctx.currentTime, 0.02);
        }
    }

    setFilterCutoff(freq) {
        this.params.filterCutoff = freq;
        if (this.filter) {
            const ctx = window.audioEngine.getContext();
            this.filter.frequency.setTargetAtTime(freq, ctx.currentTime, 0.02);
        }
    }

    setFilterResonance(q) {
        this.params.filterRes = q;
        if (this.filter) {
            const ctx = window.audioEngine.getContext();
            this.filter.Q.setTargetAtTime(q, ctx.currentTime, 0.02);
        }
    }

    // Trigger a short note (for sequencer) with ADSR
    triggerNote(frequency, duration = null) {
        const ctx = window.audioEngine.getContext();
        if (!ctx) return;

        const now = ctx.currentTime;
        const { attack, decay, sustain, release } = this.adsr;

        // Convert ms to seconds
        const attackTime = attack / 1000;
        const decayTime = decay / 1000;
        const releaseTime = release / 1000;
        const sustainLevel = sustain / 100 * 0.6;

        // Calculate total duration if not provided
        const noteDuration = duration || (attackTime + decayTime + 0.1);

        const osc = ctx.createOscillator();
        osc.type = this.params.waveform;
        osc.frequency.value = frequency;

        // Apply filter
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = this.params.filterCutoff;
        filter.Q.value = this.params.filterRes;

        const gain = ctx.createGain();

        // ADSR envelope
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.6, now + attackTime); // Attack
        gain.gain.exponentialRampToValueAtTime(Math.max(0.001, sustainLevel), now + attackTime + decayTime); // Decay to Sustain
        gain.gain.setValueAtTime(Math.max(0.001, sustainLevel), now + noteDuration); // Hold sustain
        gain.gain.exponentialRampToValueAtTime(0.001, now + noteDuration + releaseTime); // Release

        osc.connect(filter);
        filter.connect(gain);
        window.audioEngine.connectToChannel(gain, 'synth');

        osc.start(now);
        osc.stop(now + noteDuration + releaseTime + 0.05);
    }

    // ADSR setters
    setAttack(ms) {
        this.adsr.attack = ms;
    }

    setDecay(ms) {
        this.adsr.decay = ms;
    }

    setSustain(percent) {
        this.adsr.sustain = percent;
    }

    setRelease(ms) {
        this.adsr.release = ms;
    }

    getADSR() {
        return { ...this.adsr };
    }
}

// Global instance
window.synth = new Synth();
