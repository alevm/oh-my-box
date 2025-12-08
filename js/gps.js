// Oh My Box - GPS Location Tracking

class GPSTracker {
    constructor() {
        this.currentPosition = null;
        this.watchId = null;
        this.listeners = [];
        this.error = null;
    }

    async init() {
        if (!navigator.geolocation) {
            this.error = 'Geolocation not supported';
            console.warn('GPS: Geolocation not supported');
            return false;
        }

        try {
            // Request initial position
            const position = await this.getCurrentPosition();
            this.currentPosition = this.formatPosition(position);
            this.notifyListeners();

            // Start watching
            this.startWatching();

            console.log('GPS initialized:', this.currentPosition);
            return true;

        } catch (err) {
            this.error = this.getErrorMessage(err);
            console.warn('GPS init error:', this.error);
            return false;
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            });
        });
    }

    startWatching() {
        if (this.watchId) return;

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.currentPosition = this.formatPosition(position);
                this.error = null;
                this.notifyListeners();
            },
            (err) => {
                this.error = this.getErrorMessage(err);
                this.notifyListeners();
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 30000
            }
        );
    }

    stopWatching() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }

    formatPosition(position) {
        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            timestamp: position.timestamp,
            formatted: this.formatCoords(position.coords.latitude, position.coords.longitude)
        };
    }

    formatCoords(lat, lon) {
        const latDir = lat >= 0 ? 'N' : 'S';
        const lonDir = lon >= 0 ? 'E' : 'W';
        return `${Math.abs(lat).toFixed(5)}°${latDir}, ${Math.abs(lon).toFixed(5)}°${lonDir}`;
    }

    getErrorMessage(err) {
        switch (err.code) {
            case 1: return 'Permission denied';
            case 2: return 'Position unavailable';
            case 3: return 'Timeout';
            default: return 'Unknown error';
        }
    }

    getPosition() {
        return this.currentPosition;
    }

    getError() {
        return this.error;
    }

    getDisplayString() {
        if (this.error) {
            return `GPS: ${this.error}`;
        }
        if (this.currentPosition) {
            return `GPS: ${this.currentPosition.formatted}`;
        }
        return 'GPS: waiting...';
    }

    // Get metadata for embedding in recordings
    getMetadata() {
        if (!this.currentPosition) return null;

        return {
            latitude: this.currentPosition.latitude,
            longitude: this.currentPosition.longitude,
            accuracy: this.currentPosition.accuracy,
            altitude: this.currentPosition.altitude,
            timestamp: new Date().toISOString(),
            formatted: this.currentPosition.formatted
        };
    }

    // Listener pattern
    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        this.listeners = this.listeners.filter(l => l !== callback);
    }

    notifyListeners() {
        for (const listener of this.listeners) {
            listener(this.currentPosition, this.error);
        }
    }

    // Get static map image URL
    getMapImageUrl(width = 400, height = 100) {
        if (!this.currentPosition) return null;

        const lat = this.currentPosition.latitude;
        const lon = this.currentPosition.longitude;
        const zoom = 14;

        // Using OpenStreetMap static map service
        return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik&markers=${lat},${lon},red`;
    }

    // Update location image element
    updateLocationImage() {
        const imageEl = document.getElementById('locationImage');
        const coordsEl = document.getElementById('locationCoords');

        if (!imageEl) return;

        if (this.currentPosition) {
            // Update coordinates text
            if (coordsEl) {
                coordsEl.textContent = this.currentPosition.formatted;
            }

            // Try to load map image
            const imageUrl = this.getMapImageUrl();
            if (imageUrl) {
                // Create image to test loading
                const testImg = new Image();
                testImg.onload = () => {
                    imageEl.style.backgroundImage = `url('${imageUrl}')`;
                    imageEl.classList.add('has-image');
                    // Hide placeholder
                    const placeholder = imageEl.querySelector('.location-placeholder');
                    if (placeholder) placeholder.style.display = 'none';
                };
                testImg.onerror = () => {
                    // Map failed to load - show coordinates instead
                    const placeholder = imageEl.querySelector('.location-placeholder');
                    if (placeholder) {
                        const text = placeholder.querySelector('.location-text');
                        if (text) text.textContent = this.currentPosition.formatted;
                    }
                };
                testImg.src = imageUrl;
            }
        } else if (this.error) {
            const placeholder = imageEl.querySelector('.location-text');
            if (placeholder) {
                placeholder.textContent = this.error;
            }
            if (coordsEl) {
                coordsEl.textContent = this.error;
            }
        }
    }
}

// Global instance
window.gpsTracker = new GPSTracker();
