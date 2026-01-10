// Oh My Box - Landmark Feature
// Captures a "sonic snapshot" of the current location

class Landmark {
    constructor() {
        this.gpsData = null;
        this.isCapturing = false;
        this.locationName = null;
    }

    init() {
        // Set up landmark button handler
        const btn = document.getElementById('landmarkBtn');
        if (btn) {
            btn.addEventListener('click', () => this.capture());
        }

        // Pre-fetch GPS in background
        this.acquireGPS();
    }

    acquireGPS() {
        if (!navigator.geolocation) {
            console.warn('GPS not available');
            return Promise.resolve(null);
        }

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    this.gpsData = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: Date.now()
                    };
                    console.log('GPS acquired:', this.gpsData);

                    // Try to get location name
                    await this.reverseGeocode();
                    resolve(this.gpsData);
                },
                (error) => {
                    console.warn('GPS error:', error.message);
                    resolve(null);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        });
    }

    async reverseGeocode() {
        if (!this.gpsData) return;

        try {
            const { latitude, longitude } = this.gpsData;
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=14`,
                { headers: { 'User-Agent': 'OhMyBox/2.0' } }
            );
            const data = await response.json();

            if (data.address) {
                const place = data.address.city || data.address.town ||
                              data.address.village || data.address.municipality ||
                              data.address.suburb || '';
                const country = data.address.country || '';
                this.locationName = place ? `${place}, ${country}` : country;
                console.log('Location:', this.locationName);
            }
        } catch (e) {
            console.warn('Reverse geocoding failed:', e);
        }
    }

    async capture() {
        if (this.isCapturing) return;

        this.isCapturing = true;
        const btn = document.getElementById('landmarkBtn');
        const recBtn = document.getElementById('btnRec');

        // Visual feedback - button pulses
        if (btn) btn.classList.add('active');

        // Ensure we have GPS
        if (!this.gpsData) {
            await this.acquireGPS();
        }

        // Update AI composer context with GPS
        if (window.aiComposer) {
            if (this.gpsData) {
                window.aiComposer.context.gps = this.gpsData;
                window.aiComposer.context.location = this.locationName ||
                    `${this.gpsData.latitude.toFixed(4)}, ${this.gpsData.longitude.toFixed(4)}`;
            }
            window.aiComposer.updateContext();

            // Generate full arrangement based on location
            window.aiComposer.generateArrangement(4, 4);
        }

        // Set FX based on time of day
        this.applyTimeBasedFX();

        // Try to tune to local radio
        await this.tuneLocalRadio();

        // Start playback
        if (window.sequencer && !window.sequencer.isPlaying) {
            window.sequencer.play();
            const playBtn = document.getElementById('btnPlay');
            if (playBtn) playBtn.classList.add('active');
        }

        // Make record button blink - ready to capture
        if (recBtn) {
            recBtn.classList.add('ready');
        }

        // Show landmark indicator
        this.showIndicator();

        // Stop button pulse after a moment
        setTimeout(() => {
            if (btn) btn.classList.remove('active');
            this.isCapturing = false;
        }, 2000);
    }

    applyTimeBasedFX() {
        const hour = new Date().getHours();
        let fxSettings;

        if (hour >= 6 && hour < 12) {
            // Morning - bright, clear
            fxSettings = { delay: 15, grain: 5, glitch: 0 };
        } else if (hour >= 12 && hour < 18) {
            // Afternoon - warm, full
            fxSettings = { delay: 20, grain: 10, glitch: 5 };
        } else if (hour >= 18 && hour < 22) {
            // Evening - atmospheric
            fxSettings = { delay: 30, grain: 20, glitch: 10 };
        } else {
            // Night - deep, spacey
            fxSettings = { delay: 40, grain: 30, glitch: 15 };
        }

        // Apply to FX sliders
        const delayEl = document.getElementById('fxDelay');
        const grainEl = document.getElementById('fxGrain');
        const glitchEl = document.getElementById('fxGlitch');

        if (delayEl) { delayEl.value = fxSettings.delay; delayEl.dispatchEvent(new Event('input')); }
        if (grainEl) { grainEl.value = fxSettings.grain; grainEl.dispatchEvent(new Event('input')); }
        if (glitchEl) { glitchEl.value = fxSettings.glitch; glitchEl.dispatchEvent(new Event('input')); }
    }

    async tuneLocalRadio() {
        if (!window.radioPlayer || !this.gpsData) return;

        try {
            // Radio browser API search by location
            await window.radioPlayer.scanLocalStations(
                this.gpsData.latitude,
                this.gpsData.longitude
            );

            const stations = window.radioPlayer.getStations?.() || [];
            if (stations.length > 0) {
                // Play first local station at low volume (ambient)
                window.radioPlayer.play(stations[0]);

                // Set radio to low mix
                const radioFader = document.getElementById('faderRadio');
                if (radioFader) {
                    radioFader.value = 25;
                    radioFader.dispatchEvent(new Event('input'));
                }
            }
        } catch (e) {
            console.warn('Could not tune local radio:', e);
        }
    }

    showIndicator() {
        // Create temporary indicator
        const indicator = document.createElement('div');
        indicator.className = 'landmark-indicator';
        indicator.innerHTML = `
            <div class="landmark-icon">📍</div>
            <div class="landmark-text">
                <div class="landmark-title">LANDMARK CAPTURED</div>
                <div class="landmark-location">${this.locationName || 'Location acquired'}</div>
            </div>
        `;

        // Style it
        Object.assign(indicator.style, {
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(233, 69, 96, 0.95)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: '1000',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            animation: 'slideDown 0.3s ease-out'
        });

        document.body.appendChild(indicator);

        // Add animation keyframes if not already present
        if (!document.getElementById('landmark-keyframes')) {
            const style = document.createElement('style');
            style.id = 'landmark-keyframes';
            style.textContent = `
                @keyframes slideDown {
                    from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }

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
