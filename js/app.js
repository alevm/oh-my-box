// Oh My Box v0.5.0 - Main Application Controller

class App {
    constructor() {
        this.initialized = false;
        this.meterInterval = null;
        this.timeInterval = null;
    }

    async init() {
        // Initialize audio engine first
        const audioOk = await window.audioEngine.init();
        if (!audioOk) {
            alert('Failed to initialize audio. Please check permissions.');
            return;
        }

        // Initialize all modules
        await Promise.all([
            window.gpsTracker.init(),
            window.micInput.init(),
            window.sampler.init(),
            window.synth.init(),
            window.radioPlayer.init(),
            window.sessionRecorder.init(),
            window.sequencer.init(),
            window.mangleEngine.init(),
            window.sceneManager.init(),
            window.arrangement.init(),
            window.aiComposer.init()
        ]);

        // Setup UI
        this.setupTransport();
        this.setupTempo();
        this.setupMixer();
        this.setupScenes();
        this.setupSequencer();
        this.setupPads();
        this.setupSynth();
        this.setupFX();
        this.setupAI();
        this.setupRadio();
        this.setupRecordings();

        // GPS display
        window.gpsTracker.addListener(() => this.updateGPS());
        this.updateGPS();

        // Recording handler
        window.sessionRecorder.onRecordingComplete = (recording) => {
            console.log('Recording saved');
            this.updateRecordingsList();
        };

        this.initialized = true;
        console.log('App initialized - audio ready!');
    }

    // Transport
    setupTransport() {
        const btnPlay = document.getElementById('btnPlay');
        const btnStop = document.getElementById('btnStop');
        const btnRecord = document.getElementById('btnRecord');

        btnPlay.addEventListener('click', () => {
            if (window.sequencer.isPlaying()) {
                window.sequencer.stop();
                btnPlay.classList.remove('active');
            } else {
                window.sequencer.play();
                btnPlay.classList.add('active');
            }
        });

        btnStop.addEventListener('click', () => {
            window.sequencer.stop();
            btnPlay.classList.remove('active');

            if (window.sessionRecorder.isRecording()) {
                window.sessionRecorder.stop();
                btnRecord.classList.remove('active');
                this.stopTimeDisplay();
            }

            window.synth.stop();
            window.radioPlayer.stop();
            window.sampler.stopAll();

            document.getElementById('synthToggle').classList.remove('active');
            document.getElementById('synthToggle').textContent = 'OFF';
        });

        btnRecord.addEventListener('click', () => {
            if (window.sessionRecorder.isRecording()) {
                window.sessionRecorder.stop();
                btnRecord.classList.remove('active');
                this.stopTimeDisplay();
            } else {
                window.sessionRecorder.start();
                btnRecord.classList.add('active');
                this.startTimeDisplay();
            }
        });
    }

    startTimeDisplay() {
        const display = document.getElementById('timeDisplay');
        this.timeInterval = setInterval(() => {
            display.textContent = window.sessionRecorder.getFormattedTime();
        }, 100);
    }

    stopTimeDisplay() {
        if (this.timeInterval) {
            clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
        document.getElementById('timeDisplay').textContent = '00:00';
    }

    // Tempo
    setupTempo() {
        const slider = document.getElementById('tempoSlider');
        const display = document.getElementById('tempoVal');

        slider.addEventListener('input', () => {
            const tempo = parseInt(slider.value);
            window.sequencer.setTempo(tempo);
            display.textContent = tempo;
        });
    }

    // Mixer
    setupMixer() {
        const channels = ['Mic', 'Samples', 'Synth', 'Radio'];

        channels.forEach(name => {
            const fader = document.getElementById(`fader${name}`);
            const muteBtn = document.getElementById(`mute${name}`);
            const channelKey = name.toLowerCase();

            if (fader) {
                fader.addEventListener('input', () => {
                    window.audioEngine.setChannelLevel(channelKey, fader.value / 100);
                });
            }

            if (muteBtn) {
                muteBtn.addEventListener('click', () => {
                    const muted = window.audioEngine.toggleMute(channelKey);
                    muteBtn.classList.toggle('active', muted);
                });
            }
        });

        // Master fader
        const masterFader = document.getElementById('faderMaster');
        if (masterFader) {
            masterFader.addEventListener('input', () => {
                window.audioEngine.setMasterLevel(masterFader.value / 100);
            });
        }
    }

    // Scenes
    setupScenes() {
        const sceneBtns = document.querySelectorAll('.scene-btn');
        const saveBtn = document.getElementById('saveScene');

        sceneBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.scene);
                if (window.sceneManager.hasScene(idx)) {
                    window.sceneManager.recallScene(idx);
                    this.updateStepGrid();
                    this.updateTrackOverview();
                }
                sceneBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const activeBtn = document.querySelector('.scene-btn.active');
                if (activeBtn) {
                    const idx = parseInt(activeBtn.dataset.scene);
                    window.sceneManager.saveScene(idx);
                    activeBtn.classList.add('has-data');
                    console.log('Saved scene', ['A', 'B', 'C', 'D'][idx]);
                }
            });
        }
    }

    // Sequencer
    setupSequencer() {
        const stepGrid = document.getElementById('stepGrid');
        const trackOverview = document.getElementById('trackOverview');
        const trackSelect = document.getElementById('seqTrack');
        const sourceSelect = document.getElementById('seqSource');

        // Generate 16 step buttons
        for (let s = 0; s < 16; s++) {
            const step = document.createElement('div');
            step.className = 'step' + (s % 4 === 0 ? ' beat' : '');
            step.dataset.step = s;
            step.addEventListener('click', () => {
                const track = window.sequencer.getSelectedTrack();
                const active = window.sequencer.toggleStep(track, s);
                step.classList.toggle('active', active);
                this.updateTrackOverview();
            });
            stepGrid.appendChild(step);
        }

        // Generate 8-track overview
        for (let t = 0; t < 8; t++) {
            const row = document.createElement('div');
            row.className = 'track-row';

            const label = document.createElement('div');
            label.className = 'track-label' + (t === 0 ? ' selected' : '');
            label.textContent = t + 1;
            label.dataset.track = t;
            label.addEventListener('click', () => {
                window.sequencer.setSelectedTrack(t);
                trackSelect.value = t;
                this.updateStepGrid();
                document.querySelectorAll('.track-label').forEach(l => l.classList.remove('selected'));
                label.classList.add('selected');
            });
            row.appendChild(label);

            const steps = document.createElement('div');
            steps.className = 'track-steps';
            for (let s = 0; s < 16; s++) {
                const mini = document.createElement('div');
                mini.className = 'mini-step';
                mini.dataset.track = t;
                mini.dataset.step = s;
                steps.appendChild(mini);
            }
            row.appendChild(steps);
            trackOverview.appendChild(row);
        }

        // Track select dropdown
        trackSelect.addEventListener('change', () => {
            const t = parseInt(trackSelect.value);
            window.sequencer.setSelectedTrack(t);
            this.updateStepGrid();
            document.querySelectorAll('.track-label').forEach(l => {
                l.classList.toggle('selected', parseInt(l.dataset.track) === t);
            });
            sourceSelect.value = window.sequencer.getTrackSource(t);
        });

        // Source select
        sourceSelect.addEventListener('change', () => {
            const track = window.sequencer.getSelectedTrack();
            window.sequencer.setTrackSource(track, sourceSelect.value);
        });

        // Random
        document.getElementById('seqRandom').addEventListener('click', () => {
            const track = window.sequencer.getSelectedTrack();
            window.sequencer.randomizeTrack(track, 0.3);
            this.updateStepGrid();
            this.updateTrackOverview();
        });

        // Clear
        document.getElementById('seqClear').addEventListener('click', () => {
            const track = window.sequencer.getSelectedTrack();
            window.sequencer.clearTrack(track);
            this.updateStepGrid();
            this.updateTrackOverview();
        });

        // Euclidean
        document.getElementById('eucGen').addEventListener('click', () => {
            const hits = parseInt(document.getElementById('eucHits').value);
            const steps = parseInt(document.getElementById('eucSteps').value);
            const rotate = parseInt(document.getElementById('eucRotate').value);
            const track = window.sequencer.getSelectedTrack();

            window.sequencer.applyEuclidean(track, hits, steps, rotate);
            this.updateStepGrid();
            this.updateTrackOverview();
        });

        // Step callback for playback visualization
        window.sequencer.onStep((step) => {
            // Main grid
            document.querySelectorAll('.step').forEach((el, i) => {
                el.classList.toggle('current', i === step);
            });

            // Overview
            document.querySelectorAll('.mini-step').forEach(el => {
                el.classList.toggle('current', parseInt(el.dataset.step) === step);
            });
        });
    }

    updateStepGrid() {
        const track = window.sequencer.getSelectedTrack();
        const pattern = window.sequencer.getTrackPattern(track);

        document.querySelectorAll('.step').forEach((el, i) => {
            el.classList.toggle('active', pattern[i]?.active || false);
        });
    }

    updateTrackOverview() {
        const fullPattern = window.sequencer.getPattern();

        document.querySelectorAll('.mini-step').forEach(el => {
            const t = parseInt(el.dataset.track);
            const s = parseInt(el.dataset.step);
            el.classList.toggle('active', fullPattern[t][s]?.active || false);
        });
    }

    // Pads
    setupPads() {
        document.querySelectorAll('.pad').forEach(pad => {
            const index = parseInt(pad.dataset.pad);

            const trigger = () => {
                pad.classList.add('active');
                window.sampler.trigger(index);
            };

            const release = () => {
                pad.classList.remove('active');
            };

            pad.addEventListener('mousedown', trigger);
            pad.addEventListener('mouseup', release);
            pad.addEventListener('mouseleave', release);
            pad.addEventListener('touchstart', (e) => { e.preventDefault(); trigger(); });
            pad.addEventListener('touchend', release);
        });

        document.getElementById('sampleBank').addEventListener('change', (e) => {
            window.sampler.setBank(e.target.value);
        });
    }

    // Synth
    setupSynth() {
        const toggle = document.getElementById('synthToggle');
        const freq = document.getElementById('synthFreq');
        const filter = document.getElementById('synthFilter');
        const res = document.getElementById('synthRes');

        toggle.addEventListener('click', () => {
            const playing = window.synth.toggle();
            toggle.classList.toggle('active', playing);
            toggle.textContent = playing ? 'ON' : 'OFF';
        });

        freq.addEventListener('input', () => {
            window.synth.setFrequency(parseFloat(freq.value));
        });

        filter.addEventListener('input', () => {
            window.synth.setFilterCutoff(parseInt(filter.value));
        });

        res.addEventListener('input', () => {
            window.synth.setFilterResonance(parseInt(res.value));
        });

        // Waveform buttons
        document.querySelectorAll('.wave-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.synth.setWaveform(btn.dataset.wave);
                document.querySelectorAll('.wave-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    // FX
    setupFX() {
        const delay = document.getElementById('fxDelay');
        const crush = document.getElementById('fxCrush');
        const glitch = document.getElementById('fxGlitch');
        const grain = document.getElementById('fxGrain');

        delay.addEventListener('input', () => {
            window.mangleEngine.setDelayMix(parseInt(delay.value));
        });

        crush.addEventListener('input', () => {
            window.mangleEngine.setBitDepth(parseInt(crush.value));
        });

        glitch.addEventListener('input', () => {
            window.mangleEngine.setGlitch(parseInt(glitch.value), 100, 'stutter');
        });

        grain.addEventListener('input', () => {
            window.mangleEngine.setGrain(parseInt(grain.value), 50, 0);
        });
    }

    // AI
    setupAI() {
        const vibeBtns = document.querySelectorAll('.vibe-btn');
        const generateBtn = document.getElementById('aiGenerate');
        const surpriseBtn = document.getElementById('aiSurprise');

        vibeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                vibeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        generateBtn.addEventListener('click', () => {
            const vibe = document.querySelector('.vibe-btn.active')?.dataset.vibe || 'calm';
            window.aiComposer.generateRhythm(vibe, 70, 50);
            this.updateStepGrid();
            this.updateTrackOverview();
            console.log('AI Generated:', vibe);
        });

        surpriseBtn.addEventListener('click', () => {
            const result = window.aiComposer.surprise();
            this.updateStepGrid();
            this.updateTrackOverview();

            // Update tempo display
            document.getElementById('tempoSlider').value = result.tempo;
            document.getElementById('tempoVal').textContent = result.tempo;

            // Update vibe buttons
            document.querySelectorAll('.vibe-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.vibe === result.vibe);
            });

            console.log('AI Surprise:', result);
        });
    }

    // Radio
    setupRadio() {
        const searchInput = document.getElementById('radioSearch');
        const goBtn = document.getElementById('radioGo');
        const stopBtn = document.getElementById('radioStop');
        const stationList = document.getElementById('stationList');

        const doSearch = async () => {
            const query = searchInput.value.trim();
            if (!query) return;

            stationList.innerHTML = '<div style="color:#888">Searching...</div>';

            const stations = await window.radioPlayer.searchStations(query, '', '');

            if (stations.length === 0) {
                stationList.innerHTML = '<div style="color:#888">No stations found</div>';
                return;
            }

            stationList.innerHTML = stations.slice(0, 5).map(s => `
                <div class="station-item" data-url="${s.url}" data-name="${s.name}">
                    ${s.name}
                </div>
            `).join('');

            stationList.querySelectorAll('.station-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const success = await window.radioPlayer.play({
                        name: item.dataset.name,
                        url: item.dataset.url
                    });
                    if (success) {
                        stationList.querySelectorAll('.station-item').forEach(i => i.classList.remove('playing'));
                        item.classList.add('playing');
                        stopBtn.disabled = false;
                    }
                });
            });
        };

        goBtn.addEventListener('click', doSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });

        stopBtn.addEventListener('click', () => {
            window.radioPlayer.stop();
            stopBtn.disabled = true;
            stationList.querySelectorAll('.station-item').forEach(i => i.classList.remove('playing'));
        });
    }

    // Recordings
    setupRecordings() {
        const listBtn = document.getElementById('recListBtn');
        const recList = document.getElementById('recList');

        if (listBtn) {
            listBtn.addEventListener('click', () => {
                this.updateRecordingsList();
            });
        }
    }

    updateRecordingsList() {
        const recList = document.getElementById('recList');
        if (!recList) return;

        const recordings = window.sessionRecorder.getRecordings();

        if (!recordings || recordings.length === 0) {
            recList.innerHTML = '<div style="color:#888;font-size:9px;padding:4px;">No recordings yet</div>';
            return;
        }

        recList.innerHTML = recordings.map((rec) => `
            <div class="rec-item" data-id="${rec.id}">
                <span class="rec-item-name">${rec.name || 'Recording'}</span>
                ${rec.url ? `<button class="rec-item-play" data-id="${rec.id}">▶</button>` : ''}
                ${rec.blob ? `<button class="rec-item-dl" data-id="${rec.id}">DL</button>` : '<span style="color:#999;font-size:8px;">expired</span>'}
            </div>
        `).join('');

        // Play buttons
        recList.querySelectorAll('.rec-item-play').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                const rec = recordings.find(r => r.id === id);
                if (rec && rec.url) {
                    const audio = new Audio(rec.url);
                    audio.play();
                }
            });
        });

        // Download buttons
        recList.querySelectorAll('.rec-item-dl').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                window.sessionRecorder.downloadRecording(id);
            });
        });
    }

    // GPS
    updateGPS() {
        const text = document.getElementById('gpsText');
        const seqPanel = document.querySelector('.seq-panel');

        const pos = window.gpsTracker.getPosition();

        if (pos) {
            if (text) {
                text.textContent = pos.formatted;
            }

            // Set map background on sequencer panel
            if (seqPanel && !seqPanel.classList.contains('has-map')) {
                const mapUrl = window.gpsTracker.getMapImageUrl();
                if (mapUrl) {
                    console.log('Setting map background:', mapUrl);
                    seqPanel.style.backgroundImage = `url("${mapUrl}")`;
                    seqPanel.classList.add('has-map');
                }
            }
        } else {
            if (text) {
                const err = window.gpsTracker.getError();
                text.textContent = err || '--';
            }
        }
    }
}

// Initialize on first interaction
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();

    const autoInit = () => {
        window.app.init();
        document.removeEventListener('click', autoInit);
        document.removeEventListener('touchstart', autoInit);
    };

    document.addEventListener('click', autoInit);
    document.addEventListener('touchstart', autoInit);
});
