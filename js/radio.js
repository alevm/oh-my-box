// Oh My Box - Internet Radio Player

class RadioPlayer {
    constructor() {
        this.audio = null;
        this.sourceNode = null;
        this.currentStation = null;
        this.playing = false;

        // RadioBrowser API base URL (free, no auth required)
        this.apiBase = 'https://de1.api.radio-browser.info/json';
    }

    async init() {
        // Create audio element for streaming
        this.audio = new Audio();
        this.audio.crossOrigin = 'anonymous';
        this.audio.preload = 'none';

        console.log('Radio initialized');
        return true;
    }

    async searchStations(query = '', country = '', tag = '') {
        try {
            const params = new URLSearchParams();
            if (query) params.append('name', query);
            if (country) params.append('countrycode', country);
            if (tag) params.append('tag', tag);
            params.append('limit', '20');
            params.append('order', 'clickcount');
            params.append('reverse', 'true');
            params.append('hidebroken', 'true');

            const response = await fetch(`${this.apiBase}/stations/search?${params}`);
            const stations = await response.json();

            return stations.map(s => ({
                id: s.stationuuid,
                name: s.name,
                url: s.url_resolved || s.url,
                genre: s.tags?.split(',')[0] || 'Unknown',
                country: s.country,
                codec: s.codec,
                bitrate: s.bitrate
            }));

        } catch (err) {
            console.error('Radio search failed:', err);
            return [];
        }
    }

    async play(station) {
        const ctx = window.audioEngine.getContext();
        if (!ctx) return false;

        // Stop current but don't clear source node
        if (this.audio) {
            this.audio.pause();
        }

        try {
            this.currentStation = station;
            this.audio.src = station.url;

            // Create source from audio element (only once)
            if (!this.sourceNode) {
                this.sourceNode = ctx.createMediaElementSource(this.audio);

                // Add gain boost for radio
                this.radioGain = ctx.createGain();
                this.radioGain.gain.value = 1.5;

                this.sourceNode.connect(this.radioGain);
                window.audioEngine.connectToChannel(this.radioGain, 'radio');
                console.log('Radio connected to audio engine');
            }

            await this.audio.play();
            this.playing = true;

            console.log('Now playing:', station.name, 'URL:', station.url);
            return true;

        } catch (err) {
            console.error('Radio play failed:', err);
            console.error('Station URL:', station.url);
            this.currentStation = null;
            return false;
        }
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            // Don't clear src - just pause
        }
        this.playing = false;
        this.currentStation = null;
    }

    // Check if radio is actually outputting audio
    isConnected() {
        return this.sourceNode !== null;
    }

    isPlaying() {
        return this.playing;
    }

    getCurrentStation() {
        return this.currentStation;
    }

    setVolume(level) {
        if (this.audio) {
            this.audio.volume = level;
        }
    }
}

// Global instance
window.radioPlayer = new RadioPlayer();
