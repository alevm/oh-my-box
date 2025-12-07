// Oh My Box - Step Sequencer with Euclidean Rhythms

class Sequencer {
    constructor() {
        this.tracks = 8;
        this.steps = 16;
        this.tempo = 120;
        this.playing = false;
        this.currentStep = 0;
        this.intervalId = null;

        // Pattern data: 8 tracks x 16 steps
        // Each step: { active: bool, probability: number 0-100, velocity: number 0-100 }
        this.pattern = [];
        for (let t = 0; t < this.tracks; t++) {
            this.pattern[t] = [];
            for (let s = 0; s < this.steps; s++) {
                this.pattern[t][s] = { active: false, probability: 100, velocity: 100 };
            }
        }

        // Source routing per track: sampler, radio, mic, synth
        this.trackSources = ['sampler', 'sampler', 'sampler', 'sampler',
                             'sampler', 'sampler', 'sampler', 'sampler'];

        this.selectedTrack = 0;
        this.stepCallback = null;
    }

    init() {
        console.log('Sequencer initialized');
        return true;
    }

    // Euclidean rhythm generator
    generateEuclidean(hits, steps, rotation = 0) {
        if (hits > steps) hits = steps;
        if (hits <= 0) return new Array(steps).fill(false);

        const pattern = [];
        let bucket = 0;

        for (let i = 0; i < steps; i++) {
            bucket += hits;
            if (bucket >= steps) {
                bucket -= steps;
                pattern.push(true);
            } else {
                pattern.push(false);
            }
        }

        // Apply rotation
        const rotated = [];
        for (let i = 0; i < steps; i++) {
            rotated.push(pattern[(i + rotation) % steps]);
        }

        return rotated;
    }

    applyEuclidean(trackIndex, hits, steps, rotation = 0) {
        const rhythm = this.generateEuclidean(hits, steps, rotation);

        // Pad or trim to 16 steps
        for (let s = 0; s < this.steps; s++) {
            this.pattern[trackIndex][s].active = s < rhythm.length ? rhythm[s] : false;
        }

        console.log(`Applied Euclidean ${hits}/${steps} (rot ${rotation}) to track ${trackIndex}`);
    }

    setStep(trackIndex, stepIndex, active) {
        if (trackIndex >= 0 && trackIndex < this.tracks &&
            stepIndex >= 0 && stepIndex < this.steps) {
            this.pattern[trackIndex][stepIndex].active = active;
        }
    }

    toggleStep(trackIndex, stepIndex) {
        if (trackIndex >= 0 && trackIndex < this.tracks &&
            stepIndex >= 0 && stepIndex < this.steps) {
            this.pattern[trackIndex][stepIndex].active = !this.pattern[trackIndex][stepIndex].active;
            return this.pattern[trackIndex][stepIndex].active;
        }
        return false;
    }

    setStepProbability(trackIndex, stepIndex, probability) {
        if (trackIndex >= 0 && trackIndex < this.tracks &&
            stepIndex >= 0 && stepIndex < this.steps) {
            this.pattern[trackIndex][stepIndex].probability = probability;
        }
    }

    setTrackProbability(trackIndex, probability) {
        for (let s = 0; s < this.steps; s++) {
            this.pattern[trackIndex][s].probability = probability;
        }
    }

    clearTrack(trackIndex) {
        for (let s = 0; s < this.steps; s++) {
            this.pattern[trackIndex][s].active = false;
        }
    }

    randomizeTrack(trackIndex, density = 0.3) {
        for (let s = 0; s < this.steps; s++) {
            this.pattern[trackIndex][s].active = Math.random() < density;
        }
    }

    setTempo(bpm) {
        this.tempo = Math.max(30, Math.min(300, bpm));
        if (this.playing) {
            this.stop();
            this.play();
        }
    }

    getTempo() {
        return this.tempo;
    }

    play() {
        if (this.playing) return;

        this.playing = true;
        this.currentStep = 0;

        const stepDuration = (60 / this.tempo) * 1000 / 4; // 16th notes

        this.intervalId = setInterval(() => {
            this.tick();
        }, stepDuration);

        console.log('Sequencer started at', this.tempo, 'BPM');
    }

    stop() {
        this.playing = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.currentStep = 0;

        if (this.stepCallback) {
            this.stepCallback(-1); // Signal stop
        }

        console.log('Sequencer stopped');
    }

    tick() {
        // Trigger sounds for active steps (with probability)
        for (let t = 0; t < this.tracks; t++) {
            const step = this.pattern[t][this.currentStep];
            if (step.active) {
                // Check probability
                if (Math.random() * 100 < step.probability) {
                    // Trigger based on source routing
                    const source = this.trackSources[t];
                    this.triggerSource(source, t);
                }
            }
        }

        // Notify UI
        if (this.stepCallback) {
            this.stepCallback(this.currentStep);
        }

        // Advance
        this.currentStep = (this.currentStep + 1) % this.steps;
    }

    triggerSource(source, trackIndex) {
        switch (source) {
            case 'sampler':
                if (window.sampler) {
                    window.sampler.trigger(trackIndex);
                }
                break;
            case 'radio':
                // Trigger radio with gate effect (brief burst of audio)
                if (window.radioPlayer && window.radioPlayer.isPlaying) {
                    // Radio is continuous, just ensure it's audible
                    // Could add gate/chop effect here
                }
                break;
            case 'mic':
                // Mic is continuous input, could add gate here
                break;
            case 'synth':
                // Trigger synth note based on track (different frequencies)
                if (window.synth) {
                    const notes = [110, 147, 165, 196, 220, 262, 330, 392]; // A2 to G4
                    window.synth.triggerNote(notes[trackIndex], 0.1);
                }
                break;
        }
    }

    isPlaying() {
        return this.playing;
    }

    getCurrentStep() {
        return this.currentStep;
    }

    getPattern() {
        return this.pattern;
    }

    getTrackPattern(trackIndex) {
        return this.pattern[trackIndex];
    }

    setSelectedTrack(trackIndex) {
        this.selectedTrack = trackIndex;
    }

    getSelectedTrack() {
        return this.selectedTrack;
    }

    onStep(callback) {
        this.stepCallback = callback;
    }

    // Source routing
    setTrackSource(trackIndex, source) {
        if (trackIndex >= 0 && trackIndex < this.tracks) {
            this.trackSources[trackIndex] = source;
            console.log(`Track ${trackIndex + 1} source: ${source}`);
        }
    }

    getTrackSource(trackIndex) {
        return this.trackSources[trackIndex] || 'sampler';
    }

    getTrackSources() {
        return [...this.trackSources];
    }

    // Generate pattern based on vibe
    generateVibePattern(vibe, density = 0.5, complexity = 0.5) {
        const patterns = {
            calm: () => {
                // Sparse, steady rhythms
                this.applyEuclidean(0, 4, 16, 0);  // Kick: 4 on floor
                this.clearTrack(1);                // No snare
                this.applyEuclidean(2, 2, 16, 0);  // HiHat sparse
                this.clearTrack(3);                // No clap
                this.clearTrack(4);
                this.clearTrack(5);
                this.applyEuclidean(6, 3, 16, 2);  // Shaker subtle
                this.clearTrack(7);
            },
            urban: () => {
                // Busy, syncopated
                this.applyEuclidean(0, 4, 16, 0);    // Kick steady
                this.applyEuclidean(1, 4, 16, 4);    // Snare backbeat
                this.applyEuclidean(2, 8, 16, 0);    // HiHat busy
                this.applyEuclidean(3, 3, 16, 2);    // Clap syncopated
                this.applyEuclidean(4, 2, 16, 6);    // Tom accents
                this.clearTrack(5);
                this.applyEuclidean(6, 5, 16, 1);    // Shaker groove
                this.applyEuclidean(7, 2, 16, 8);    // Cowbell accents
            },
            nature: () => {
                // Organic, irregular
                this.applyEuclidean(0, 3, 16, 0);    // Kick subtle
                this.clearTrack(1);
                this.applyEuclidean(2, 5, 16, 3);    // HiHat organic
                this.clearTrack(3);
                this.applyEuclidean(4, 2, 16, 5);    // Tom sporadic
                this.applyEuclidean(5, 3, 16, 7);    // Rim scattered
                this.applyEuclidean(6, 7, 16, 0);    // Shaker flowing
                this.clearTrack(7);
            },
            chaos: () => {
                // Maximum complexity
                this.applyEuclidean(0, 7, 16, Math.floor(Math.random() * 16));
                this.applyEuclidean(1, 5, 16, Math.floor(Math.random() * 16));
                this.applyEuclidean(2, 11, 16, Math.floor(Math.random() * 16));
                this.applyEuclidean(3, 7, 16, Math.floor(Math.random() * 16));
                this.applyEuclidean(4, 5, 16, Math.floor(Math.random() * 16));
                this.applyEuclidean(5, 9, 16, Math.floor(Math.random() * 16));
                this.applyEuclidean(6, 13, 16, Math.floor(Math.random() * 16));
                this.applyEuclidean(7, 3, 16, Math.floor(Math.random() * 16));
            }
        };

        if (patterns[vibe]) {
            patterns[vibe]();
        }

        // Apply density modifier
        const densityFactor = density / 100;
        for (let t = 0; t < this.tracks; t++) {
            for (let s = 0; s < this.steps; s++) {
                if (this.pattern[t][s].active && Math.random() > densityFactor) {
                    this.pattern[t][s].active = false;
                }
            }
        }

        // Apply complexity (probability variation)
        if (complexity > 50) {
            for (let t = 0; t < this.tracks; t++) {
                for (let s = 0; s < this.steps; s++) {
                    if (this.pattern[t][s].active) {
                        this.pattern[t][s].probability = 50 + Math.random() * 50;
                    }
                }
            }
        }

        console.log(`Generated ${vibe} pattern (density: ${density}%, complexity: ${complexity}%)`);
    }

    // Surprise pattern - completely random but musical
    generateSurprise() {
        const vibes = ['calm', 'urban', 'nature', 'chaos'];
        const vibe = vibes[Math.floor(Math.random() * vibes.length)];
        const density = 30 + Math.random() * 60;
        const complexity = 20 + Math.random() * 60;

        this.generateVibePattern(vibe, density, complexity);

        // Random tempo
        this.setTempo(80 + Math.floor(Math.random() * 80));

        return { vibe, density, complexity, tempo: this.tempo };
    }
}

// Global instance
window.sequencer = new Sequencer();
