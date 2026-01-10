// Oh My Box - Landmark Feature
// Captures a "sonic snapshot" of the current location
// Version 2.0 - with extensive logging

class Landmark {
    constructor() {
        this.gpsData = null;
        this.isCapturing = false;
        this.locationName = null;
        this.log('Landmark module constructed');
    }

    // Extensive logging helper
    log(message, data = null) {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
        const prefix = `[LANDMARK ${timestamp}]`;
        if (data) {
            console.log(prefix, message, data);
        } else {
            console.log(prefix, message);
        }
    }

    error(message, err = null) {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, 12);
        const prefix = `[LANDMARK ERROR ${timestamp}]`;
        if (err) {
            console.error(prefix, message, err);
        } else {
            console.error(prefix, message);
        }
    }

    init() {
        this.log('Initializing landmark feature...');

        // Set up landmark button handler
        const btn = document.getElementById('landmarkBtn');
        if (btn) {
            btn.addEventListener('click', () => this.capture());
            this.log('Landmark button found and handler attached');
        } else {
            this.error('Landmark button not found in DOM');
        }

        // Pre-fetch GPS in background
        this.log('Starting background GPS acquisition');
        this.acquireGPS();

        this.log('Landmark feature initialized');
    }

    acquireGPS() {
        this.log('Attempting GPS acquisition...');

        if (!navigator.geolocation) {
            this.error('GPS not available - navigator.geolocation is undefined');
            return Promise.resolve(null);
        }

        return new Promise((resolve) => {
            this.log('Calling getCurrentPosition with high accuracy...');

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    this.gpsData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: Date.now()
                    };
                    this.log('GPS acquired successfully', this.gpsData);

                    // Try to get location name
                    await this.reverseGeocode();
                    resolve(this.gpsData);
                },
                (error) => {
                    this.error('GPS acquisition failed', {
                        code: error.code,
                        message: error.message
                    });
                    resolve(null);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        });
    }

    async reverseGeocode() {
        if (!this.gpsData) {
            this.log('Skipping reverse geocoding - no GPS data');
            return;
        }

        this.log('Starting reverse geocoding...');

        try {
            const { latitude, longitude } = this.gpsData;
            const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=14`;
            this.log('Fetching location name from Nominatim', { url });

            const response = await fetch(url, { headers: { 'User-Agent': 'OhMyBox/2.0' } });
            const data = await response.json();

            this.log('Reverse geocoding response', data);

            if (data.address) {
                const place = data.address.city || data.address.town ||
                              data.address.village || data.address.municipality ||
                              data.address.suburb || '';
                const country = data.address.country || '';
                this.locationName = place ? `${place}, ${country}` : country;
                this.log('Location resolved', { locationName: this.locationName });
            } else {
                this.log('No address in reverse geocoding response');
            }
        } catch (e) {
            this.error('Reverse geocoding failed', e);
        }
    }

    async capture() {
        this.log('=== LANDMARK CAPTURE STARTED ===');

        if (this.isCapturing) {
            this.log('Already capturing, ignoring duplicate request');
            return;
        }

        this.isCapturing = true;
        const btn = document.getElementById('landmarkBtn');
        const recBtn = document.getElementById('btnRec');

        // Visual feedback - button pulses
        if (btn) {
            btn.classList.add('active');
            this.log('Button visual feedback activated');
        }

        // Ensure we have GPS
        if (!this.gpsData) {
            this.log('No GPS data, attempting acquisition...');
            await this.acquireGPS();
        } else {
            this.log('Using cached GPS data', this.gpsData);
        }

        // Generate a FULL landmark pattern
        this.log('Generating landmark pattern...');
        this.generateLandmarkPattern();

        // Set tempo based on time of day
        this.log('Setting time-based tempo...');
        this.setTimeBasedTempo();

        // Set FX based on time of day
        this.log('Applying time-based FX...');
        this.applyTimeBasedFX();

        // Try to tune to local radio (low in mix)
        this.log('Attempting to tune local radio...');
        await this.tuneLocalRadio();

        // Start playback
        this.log('Starting playback...');
        if (window.sequencer) {
            this.log('Sequencer state before play', {
                isPlaying: window.sequencer.isPlaying,
                tempo: window.sequencer.tempo,
                patternSteps: this.countActiveSteps()
            });

            if (!window.sequencer.isPlaying) {
                window.sequencer.play();
                const playBtn = document.getElementById('btnPlay');
                if (playBtn) playBtn.classList.add('active');
                this.log('Playback started');
            } else {
                this.log('Sequencer was already playing');
            }
        } else {
            this.error('Sequencer not available!');
        }

        // Make record button blink - ready to capture
        if (recBtn) {
            recBtn.classList.add('ready');
            this.log('Record button set to ready state (blinking)');
        }

        // Start recording automatically
        this.log('Initiating recording...');
        this.startRecording();

        // Show landmark indicator
        this.log('Showing landmark indicator...');
        this.showIndicator();

        // Stop button pulse after a moment
        setTimeout(() => {
            if (btn) btn.classList.remove('active');
            this.isCapturing = false;
            this.log('Capture sequence completed');
        }, 2000);

        this.log('=== LANDMARK CAPTURE INITIATED ===');
    }

    // Count active steps for logging
    countActiveSteps() {
        if (!window.sequencer || !window.sequencer.pattern) return 0;
        let count = 0;
        for (let t = 0; t < 8; t++) {
            for (let s = 0; s < 16; s++) {
                if (window.sequencer.pattern[t][s]?.active) count++;
            }
        }
        return count;
    }

    // Generate a full, interesting pattern based on location/time
    generateLandmarkPattern() {
        this.log('generateLandmarkPattern called');

        if (!window.sequencer) {
            this.error('Sequencer not available for pattern generation');
            return;
        }

        const hour = new Date().getHours();
        const seq = window.sequencer;

        this.log('Current hour', { hour });

        // Clear existing pattern
        this.log('Clearing existing pattern...');
        seq.clearAll();

        // Determine character based on time
        let character;
        if (hour >= 6 && hour < 10) {
            character = 'morning';  // Bright, energetic
        } else if (hour >= 10 && hour < 14) {
            character = 'midday';   // Full, driving
        } else if (hour >= 14 && hour < 18) {
            character = 'afternoon'; // Warm, groovy
        } else if (hour >= 18 && hour < 22) {
            character = 'evening';  // Atmospheric, deep
        } else {
            character = 'night';    // Minimal, spacey
        }

        this.log('Determined character', { character, hour });

        // Generate patterns based on character
        switch (character) {
            case 'morning':
                // Upbeat, bright pattern
                seq.applyEuclidean(0, 4, 16, 0);   // Kick: 4 on floor
                seq.applyEuclidean(1, 4, 16, 4);   // Snare: backbeat
                seq.applyEuclidean(2, 8, 16, 0);   // HiHat: 8ths
                seq.applyEuclidean(3, 2, 16, 2);   // Clap: accents
                seq.applyEuclidean(4, 3, 16, 6);   // Tom: fills
                seq.applyEuclidean(5, 4, 16, 1);   // Rim: offbeats
                seq.applyEuclidean(6, 6, 16, 0);   // Shaker: groove
                seq.applyEuclidean(7, 2, 16, 8);   // Cowbell: accents
                break;

            case 'midday':
                // Full, driving pattern
                seq.applyEuclidean(0, 4, 16, 0);   // Kick: solid
                seq.applyEuclidean(1, 4, 16, 4);   // Snare: backbeat
                seq.applyEuclidean(2, 12, 16, 0);  // HiHat: busy 16ths
                seq.applyEuclidean(3, 4, 16, 2);   // Clap: syncopated
                seq.applyEuclidean(4, 3, 16, 5);   // Tom: rhythmic
                seq.applyEuclidean(5, 5, 16, 3);   // Rim: ghost notes
                seq.applyEuclidean(6, 8, 16, 1);   // Shaker: 8ths
                seq.applyEuclidean(7, 3, 16, 7);   // Cowbell: Latin feel
                break;

            case 'afternoon':
                // Warm, groovy pattern
                seq.applyEuclidean(0, 5, 16, 0);   // Kick: syncopated
                seq.applyEuclidean(1, 3, 16, 4);   // Snare: sparse backbeat
                seq.applyEuclidean(2, 7, 16, 0);   // HiHat: swing feel
                seq.applyEuclidean(3, 2, 16, 6);   // Clap: accents
                seq.applyEuclidean(4, 4, 16, 3);   // Tom: groovy
                seq.applyEuclidean(5, 3, 16, 1);   // Rim: subtle
                seq.applyEuclidean(6, 9, 16, 2);   // Shaker: flowing
                seq.applyEuclidean(7, 2, 16, 12);  // Cowbell: sparse
                break;

            case 'evening':
                // Atmospheric, deep pattern
                seq.applyEuclidean(0, 3, 16, 0);   // Kick: deep, sparse
                seq.applyEuclidean(1, 2, 16, 4);   // Snare: minimal
                seq.applyEuclidean(2, 5, 16, 2);   // HiHat: scattered
                seq.applyEuclidean(3, 3, 16, 8);   // Clap: atmospheric
                seq.applyEuclidean(4, 2, 16, 6);   // Tom: deep hits
                seq.applyEuclidean(5, 4, 16, 1);   // Rim: texture
                seq.applyEuclidean(6, 7, 16, 0);   // Shaker: ambient
                seq.clearTrack(7);                 // No cowbell
                break;

            case 'night':
                // Minimal, spacey pattern
                seq.applyEuclidean(0, 2, 16, 0);   // Kick: minimal
                seq.applyEuclidean(1, 1, 16, 8);   // Snare: single hit
                seq.applyEuclidean(2, 4, 16, 4);   // HiHat: sparse
                seq.applyEuclidean(3, 2, 16, 12);  // Clap: distant
                seq.clearTrack(4);                 // No tom
                seq.applyEuclidean(5, 3, 16, 2);   // Rim: texture
                seq.applyEuclidean(6, 5, 16, 1);   // Shaker: ambient
                seq.clearTrack(7);                 // No cowbell
                break;
        }

        // Add some randomization for uniqueness
        this.log('Adding human feel randomization...');
        this.addHumanFeel(seq);

        // Update the UI grid
        this.log('Updating UI grid...');
        if (window.app && window.app.updateSeqGrid) {
            window.app.updateSeqGrid();
            this.log('UI grid updated');
        } else {
            this.log('window.app.updateSeqGrid not available');
        }

        const totalSteps = this.countActiveSteps();
        this.log('Pattern generation complete', {
            character,
            totalActiveSteps: totalSteps,
            tracksUsed: this.countActiveTracks()
        });
    }

    // Count active tracks
    countActiveTracks() {
        if (!window.sequencer || !window.sequencer.pattern) return 0;
        let count = 0;
        for (let t = 0; t < 8; t++) {
            for (let s = 0; s < 16; s++) {
                if (window.sequencer.pattern[t][s]?.active) {
                    count++;
                    break;
                }
            }
        }
        return count;
    }

    // Add slight randomization for human feel
    addHumanFeel(seq) {
        for (let t = 0; t < 8; t++) {
            for (let s = 0; s < 16; s++) {
                if (seq.pattern[t][s].active) {
                    // Add probability variation (85-100%)
                    seq.pattern[t][s].probability = 85 + Math.random() * 15;

                    // Slight velocity variation
                    seq.pattern[t][s].velocity = 80 + Math.random() * 20;
                }
            }
        }

        // Randomly add a few extra hits for texture
        for (let i = 0; i < 4; i++) {
            const t = Math.floor(Math.random() * 8);
            const s = Math.floor(Math.random() * 16);
            if (!seq.pattern[t][s].active && Math.random() > 0.5) {
                seq.pattern[t][s].active = true;
                seq.pattern[t][s].probability = 60 + Math.random() * 20;
                seq.pattern[t][s].velocity = 60 + Math.random() * 20;
            }
        }
    }

    setTimeBasedTempo() {
        this.log('setTimeBasedTempo called');
        const hour = new Date().getHours();
        let tempo;
        let period;

        if (hour >= 6 && hour < 10) {
            tempo = 110 + Math.floor(Math.random() * 20);  // Morning: 110-130
            period = 'morning';
        } else if (hour >= 10 && hour < 14) {
            tempo = 120 + Math.floor(Math.random() * 20);  // Midday: 120-140
            period = 'midday';
        } else if (hour >= 14 && hour < 18) {
            tempo = 100 + Math.floor(Math.random() * 20);  // Afternoon: 100-120
            period = 'afternoon';
        } else if (hour >= 18 && hour < 22) {
            tempo = 90 + Math.floor(Math.random() * 20);   // Evening: 90-110
            period = 'evening';
        } else {
            tempo = 80 + Math.floor(Math.random() * 20);   // Night: 80-100
            period = 'night';
        }

        this.log('Calculated tempo', { hour, period, tempo });

        if (window.sequencer) {
            window.sequencer.setTempo(tempo);
            this.log('Tempo applied to sequencer');
        } else {
            this.error('Sequencer not available for tempo set');
        }

        // Update UI
        const tempoSlider = document.getElementById('seqTempo');
        const tempoDisplay = document.getElementById('seqTempoDisplay');
        const tempoValue = document.getElementById('tempoValue');

        if (tempoSlider) tempoSlider.value = tempo;
        if (tempoDisplay) tempoDisplay.textContent = tempo;
        if (tempoValue) tempoValue.textContent = tempo;

        this.log('Tempo UI updated', { tempo });
    }

    applyTimeBasedFX() {
        this.log('applyTimeBasedFX called');
        const hour = new Date().getHours();
        let fxSettings;
        let period;

        if (hour >= 6 && hour < 12) {
            // Morning - bright, clear
            fxSettings = { delay: 15, grain: 5, glitch: 0, crush: 16 };
            period = 'morning';
        } else if (hour >= 12 && hour < 18) {
            // Afternoon - warm, full
            fxSettings = { delay: 25, grain: 15, glitch: 5, crush: 14 };
            period = 'afternoon';
        } else if (hour >= 18 && hour < 22) {
            // Evening - atmospheric
            fxSettings = { delay: 35, grain: 25, glitch: 10, crush: 12 };
            period = 'evening';
        } else {
            // Night - deep, spacey
            fxSettings = { delay: 45, grain: 35, glitch: 15, crush: 10 };
            period = 'night';
        }

        this.log('FX settings determined', { hour, period, fxSettings });

        // Apply to FX sliders
        const delayEl = document.getElementById('fxDelay');
        const grainEl = document.getElementById('fxGrain');
        const glitchEl = document.getElementById('fxGlitch');
        const crushEl = document.getElementById('fxCrush');

        const applied = [];
        if (delayEl) { delayEl.value = fxSettings.delay; delayEl.dispatchEvent(new Event('input')); applied.push('delay'); }
        if (grainEl) { grainEl.value = fxSettings.grain; grainEl.dispatchEvent(new Event('input')); applied.push('grain'); }
        if (glitchEl) { glitchEl.value = fxSettings.glitch; glitchEl.dispatchEvent(new Event('input')); applied.push('glitch'); }
        if (crushEl) { crushEl.value = fxSettings.crush; crushEl.dispatchEvent(new Event('input')); applied.push('crush'); }

        this.log('FX applied', { applied, fxSettings });
    }

    async tuneLocalRadio() {
        this.log('tuneLocalRadio called');

        if (!window.radioPlayer) {
            this.log('Radio player not available, skipping');
            return;
        }

        if (!this.gpsData) {
            this.log('No GPS data for radio tuning, skipping');
            return;
        }

        try {
            this.log('Scanning for local stations...', {
                lat: this.gpsData.latitude,
                lon: this.gpsData.longitude
            });

            // Try to get local stations
            if (window.radioPlayer.scanLocalStations) {
                await window.radioPlayer.scanLocalStations(
                    this.gpsData.latitude,
                    this.gpsData.longitude
                );
            }

            const stations = window.radioPlayer.getStations?.() || [];
            this.log('Stations found', { count: stations.length });

            if (stations.length > 0) {
                // Play first local station at low volume (ambient layer)
                this.log('Playing station', { station: stations[0] });
                window.radioPlayer.play(stations[0]);

                // Set radio to low mix (background texture)
                const radioFader = document.getElementById('faderRadio');
                if (radioFader) {
                    radioFader.value = 20;
                    radioFader.dispatchEvent(new Event('input'));
                    this.log('Radio fader set to 20%');
                }
            } else {
                this.log('No local stations found');
            }
        } catch (e) {
            this.error('Could not tune local radio', e);
        }
    }

    startRecording() {
        this.log('startRecording called');

        // Check for available recorder (sessionRecorder is the correct global)
        const recorder = window.sessionRecorder || window.recorder;

        if (!recorder) {
            this.error('No recorder available! Checked: window.sessionRecorder, window.recorder');
            this.log('Available window objects with "record":', Object.keys(window).filter(k => k.toLowerCase().includes('record')));
            return false;
        }

        this.log('Recorder found', { type: recorder.constructor?.name || 'unknown' });

        // Generate filename with location and timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const location = this.locationName?.replace(/[^a-zA-Z0-9]/g, '-') || 'unknown';
        const filename = `landmark-${location}-${timestamp}`;

        this.log('Generated filename', { filename });

        // Start recording
        try {
            if (recorder.setFilename) {
                recorder.setFilename(filename);
                this.log('Filename set on recorder');
            }

            const result = recorder.start();
            this.log('Recording started', { result, filename });
            return true;
        } catch (e) {
            this.error('Failed to start recording', e);
            return false;
        }
    }

    showIndicator() {
        // Remove any existing indicator
        const existing = document.querySelector('.landmark-indicator');
        if (existing) existing.remove();

        // Create indicator
        const indicator = document.createElement('div');
        indicator.className = 'landmark-indicator';
        indicator.innerHTML = `
            <div class="landmark-icon">📍</div>
            <div class="landmark-text">
                <div class="landmark-title">LANDMARK CAPTURED</div>
                <div class="landmark-location">${this.locationName || 'Location acquired'}</div>
            </div>
        `;

        document.body.appendChild(indicator);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            indicator.style.opacity = '0';
            indicator.style.transition = 'opacity 0.5s';
            setTimeout(() => indicator.remove(), 500);
        }, 4000);
    }

    // Get current landmark data for export/save
    getData() {
        return {
            gps: this.gpsData,
            locationName: this.locationName,
            timestamp: Date.now(),
            patterns: window.sequencer?.getPatterns?.() || [],
            tempo: window.sequencer?.getTempo?.() || 120
        };
    }
}

// Global instance
window.landmark = new Landmark();

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.landmark.init());
} else {
    window.landmark.init();
}
