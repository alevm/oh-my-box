// Oh My Box - Boot Manager
// Handles startup mode selection: Landmark Snapshot, Interactive, Hybrid

class BootManager {
    constructor() {
        this.mode = null; // 'landmark', 'interactive', 'hybrid'
        this.gpsReady = false;
        this.gpsData = null;
        this.onModeSelected = null;
        this.hasLastSession = false;
    }

    init() {
        this.checkLastSession();
        this.createBootScreen();
        this.startGPSAcquisition();
        return new Promise((resolve) => {
            this.onModeSelected = resolve;
        });
    }

    checkLastSession() {
        try {
            const lastSession = localStorage.getItem('ohmybox_last_session');
            this.hasLastSession = !!lastSession;
        } catch (e) {
            this.hasLastSession = false;
        }
    }

    createBootScreen() {
        const bootScreen = document.createElement('div');
        bootScreen.id = 'bootScreen';
        bootScreen.className = 'boot-screen';
        bootScreen.innerHTML = `
            <div class="boot-container">
                <div class="boot-header">
                    <div class="boot-logo">OH MY BOX</div>
                    <div class="boot-subtitle">Portable Sonic Capture Device</div>
                </div>

                <div class="boot-gps" id="bootGps">
                    <div class="gps-status">
                        <span class="gps-icon">&#128225;</span>
                        <span class="gps-text" id="bootGpsText">Acquiring GPS...</span>
                    </div>
                    <div class="gps-coords" id="bootGpsCoords">--</div>
                </div>

                <div class="boot-modes">
                    <div class="mode-card" data-mode="landmark" id="modeLandmark">
                        <div class="mode-icon">&#128247;</div>
                        <div class="mode-title">LANDMARK SNAPSHOT</div>
                        <div class="mode-desc">
                            AI captures this moment.<br>
                            Patterns, tempo, radio &mdash; all from GPS.<br>
                            <em>Just press record.</em>
                        </div>
                    </div>

                    <div class="mode-card" data-mode="interactive" id="modeInteractive">
                        <div class="mode-icon">&#127929;</div>
                        <div class="mode-title">INTERACTIVE</div>
                        <div class="mode-desc">
                            Start with silence.<br>
                            Build everything yourself.<br>
                            <em>Full creative control.</em>
                        </div>
                    </div>

                    <div class="mode-card" data-mode="hybrid" id="modeHybrid">
                        <div class="mode-icon">&#127899;</div>
                        <div class="mode-title">HYBRID</div>
                        <div class="mode-desc">
                            AI seeds the session.<br>
                            You take over live.<br>
                            <em>Remix the moment.</em>
                        </div>
                    </div>
                </div>

                <div class="boot-resume ${this.hasLastSession ? '' : 'hidden'}" id="bootResume">
                    <button class="resume-btn" id="resumeBtn">
                        &#128194; RESUME LAST SESSION
                    </button>
                </div>

                <div class="boot-footer">
                    <span class="boot-version">v2.0.0</span>
                    <span class="boot-time" id="bootTime"></span>
                </div>
            </div>
        `;

        document.body.insertBefore(bootScreen, document.body.firstChild);

        // Update time
        this.updateBootTime();
        setInterval(() => this.updateBootTime(), 1000);

        // Attach event listeners
        this.attachModeListeners();
    }

    updateBootTime() {
        const timeEl = document.getElementById('bootTime');
        if (timeEl) {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    }

    startGPSAcquisition() {
        const gpsTextEl = document.getElementById('bootGpsText');
        const gpsCoordsEl = document.getElementById('bootGpsCoords');
        const gpsEl = document.getElementById('bootGps');

        if (!navigator.geolocation) {
            gpsTextEl.textContent = 'GPS not available';
            gpsEl.classList.add('gps-error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                this.gpsReady = true;
                this.gpsData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                };

                gpsTextEl.textContent = 'Location acquired';
                gpsEl.classList.add('gps-ready');

                const lat = position.coords.latitude.toFixed(4);
                const lon = position.coords.longitude.toFixed(4);
                const latDir = position.coords.latitude >= 0 ? 'N' : 'S';
                const lonDir = position.coords.longitude >= 0 ? 'E' : 'W';
                gpsCoordsEl.textContent = `${Math.abs(lat)}°${latDir}, ${Math.abs(lon)}°${lonDir}`;

                // Enable landmark and hybrid modes
                document.getElementById('modeLandmark').classList.add('gps-enabled');
                document.getElementById('modeHybrid').classList.add('gps-enabled');

                // Try reverse geocoding for location name
                this.reverseGeocode(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.warn('GPS error:', error);
                gpsTextEl.textContent = 'GPS unavailable';
                gpsEl.classList.add('gps-error');

                // Landmark still works without GPS (uses defaults)
                document.getElementById('modeLandmark').classList.add('no-gps');
                document.getElementById('modeHybrid').classList.add('no-gps');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }

    async reverseGeocode(lat, lon) {
        try {
            // Using Nominatim (OpenStreetMap) for reverse geocoding
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14`,
                { headers: { 'User-Agent': 'OhMyBox/2.0' } }
            );
            const data = await response.json();

            if (data.address) {
                const place = data.address.city || data.address.town ||
                              data.address.village || data.address.municipality || '';
                const country = data.address.country || '';

                const gpsTextEl = document.getElementById('bootGpsText');
                if (place) {
                    gpsTextEl.textContent = `${place}, ${country}`;
                }
            }
        } catch (e) {
            console.warn('Reverse geocoding failed:', e);
        }
    }

    attachModeListeners() {
        const modeCards = document.querySelectorAll('.mode-card');
        modeCards.forEach(card => {
            card.addEventListener('click', () => {
                const mode = card.dataset.mode;
                this.selectMode(mode);
            });
        });

        const resumeBtn = document.getElementById('resumeBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => {
                this.selectMode('resume');
            });
        }
    }

    selectMode(mode) {
        this.mode = mode;

        // Visual feedback
        const bootScreen = document.getElementById('bootScreen');
        bootScreen.classList.add('boot-exit');

        // Store selected mode
        try {
            localStorage.setItem('ohmybox_boot_mode', mode);
        } catch (e) {}

        // Fade out and resolve
        setTimeout(() => {
            bootScreen.remove();
            if (this.onModeSelected) {
                this.onModeSelected({
                    mode: mode,
                    gps: this.gpsData,
                    gpsReady: this.gpsReady
                });
            }
        }, 400);
    }

    // Execute the selected mode after app initialization
    async executeMode(modeData) {
        const { mode, gps, gpsReady } = modeData;

        switch (mode) {
            case 'landmark':
                await this.executeLandmarkMode(gps);
                break;
            case 'interactive':
                await this.executeInteractiveMode();
                break;
            case 'hybrid':
                await this.executeHybridMode(gps);
                break;
            case 'resume':
                await this.executeResumeMode();
                break;
        }
    }

    async executeLandmarkMode(gps) {
        console.log('Executing Landmark Snapshot mode');

        // Full AI takeover - generate everything based on location
        if (window.aiComposer) {
            // Update context with GPS
            if (gps) {
                window.aiComposer.context.gps = gps;
                window.aiComposer.context.location = `${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`;
            }
            window.aiComposer.updateContext();

            // Generate a full arrangement
            window.aiComposer.generateArrangement(4, 4);

            // Auto-scan for local radio
            if (window.radioPlayer && gps) {
                try {
                    await window.radioPlayer.scanLocalStations(gps.latitude, gps.longitude);
                    // Auto-play first result
                    const stations = window.radioPlayer.getStations();
                    if (stations && stations.length > 0) {
                        window.radioPlayer.play(stations[0]);
                        // Set radio to low mix (ambient)
                        const radioFader = document.getElementById('faderRadio');
                        if (radioFader) radioFader.value = 30;
                    }
                } catch (e) {
                    console.warn('Could not scan local radio:', e);
                }
            }

            // Set FX based on vibe
            this.applyVibeFX(window.aiComposer.context.vibe);

            // Start playback automatically
            setTimeout(() => {
                if (window.sequencer) {
                    window.sequencer.play();
                    document.getElementById('btnPlay')?.classList.add('active');
                }
            }, 500);
        }

        // Show landmark indicator in UI
        this.showModeIndicator('LANDMARK', 'AI-generated from your location');
    }

    async executeInteractiveMode() {
        console.log('Executing Interactive mode');

        // Clear everything - start fresh
        if (window.sequencer) {
            window.sequencer.clearAll();
        }
        if (window.sceneManager) {
            window.sceneManager.clearAll();
        }

        // Reset mixer to defaults
        const faders = ['faderMic', 'faderSamples', 'faderSynth', 'faderRadio', 'faderMaster'];
        faders.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = id === 'faderMaster' ? 90 : 80;
        });

        // Reset FX
        ['fxDelay', 'fxGrain', 'fxGlitch'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = 0;
        });
        const crushEl = document.getElementById('fxCrush');
        if (crushEl) crushEl.value = 16;

        // Show interactive indicator
        this.showModeIndicator('INTERACTIVE', 'Blank canvas - create from scratch');
    }

    async executeHybridMode(gps) {
        console.log('Executing Hybrid mode');

        // First, do landmark generation
        await this.executeLandmarkMode(gps);

        // Then enable DUB mode so user can immediately override
        if (window.sequencer) {
            window.sequencer.setDubMode('dub');
            const dubBtn = document.getElementById('dubToggle');
            if (dubBtn) {
                dubBtn.classList.add('active');
                dubBtn.textContent = 'DUB';
            }
        }

        // Show hybrid indicator
        this.showModeIndicator('HYBRID', 'AI started - you take over (DUB mode ON)');
    }

    async executeResumeMode() {
        console.log('Executing Resume mode');

        // Load last session from localStorage
        try {
            const lastSession = localStorage.getItem('ohmybox_last_session');
            if (lastSession) {
                const session = JSON.parse(lastSession);

                // Restore sequencer patterns
                if (session.patterns && window.sequencer) {
                    window.sequencer.loadPatterns(session.patterns);
                }

                // Restore scenes
                if (session.scenes && window.sceneManager) {
                    window.sceneManager.loadScenes(session.scenes);
                }

                // Restore tempo
                if (session.tempo && window.sequencer) {
                    window.sequencer.setTempo(session.tempo);
                }

                this.showModeIndicator('RESUMED', 'Last session restored');
            }
        } catch (e) {
            console.warn('Could not restore last session:', e);
            // Fall back to interactive mode
            await this.executeInteractiveMode();
        }
    }

    applyVibeFX(vibe) {
        const fxSettings = {
            calm: { delay: 20, grain: 10, glitch: 0, crush: 16 },
            urban: { delay: 15, grain: 0, glitch: 10, crush: 12 },
            nature: { delay: 30, grain: 25, glitch: 0, crush: 16 },
            chaos: { delay: 40, grain: 30, glitch: 25, crush: 8 }
        };

        const fx = fxSettings[vibe] || fxSettings.calm;

        const delayEl = document.getElementById('fxDelay');
        const grainEl = document.getElementById('fxGrain');
        const glitchEl = document.getElementById('fxGlitch');
        const crushEl = document.getElementById('fxCrush');

        if (delayEl) delayEl.value = fx.delay;
        if (grainEl) grainEl.value = fx.grain;
        if (glitchEl) glitchEl.value = fx.glitch;
        if (crushEl) crushEl.value = fx.crush;

        // Trigger change events
        [delayEl, grainEl, glitchEl, crushEl].forEach(el => {
            if (el) el.dispatchEvent(new Event('input'));
        });
    }

    showModeIndicator(mode, description) {
        // Create a temporary mode indicator
        const indicator = document.createElement('div');
        indicator.className = 'mode-indicator';
        indicator.innerHTML = `
            <span class="mode-indicator-title">${mode}</span>
            <span class="mode-indicator-desc">${description}</span>
        `;
        document.body.appendChild(indicator);

        // Auto-hide after 4 seconds
        setTimeout(() => {
            indicator.classList.add('fade-out');
            setTimeout(() => indicator.remove(), 500);
        }, 4000);
    }

    // Save current session (called periodically or on exit)
    saveSession() {
        try {
            const session = {
                timestamp: Date.now(),
                patterns: window.sequencer?.getPatterns() || [],
                scenes: window.sceneManager?.getScenes() || [],
                tempo: window.sequencer?.getTempo() || 120,
                mode: this.mode
            };
            localStorage.setItem('ohmybox_last_session', JSON.stringify(session));
        } catch (e) {
            console.warn('Could not save session:', e);
        }
    }
}

// Global instance
window.bootManager = new BootManager();
