// Oh My Box v0.7.0 - Main Application Controller

class App {
    constructor() {
        this.initialized = false;
        this.meterInterval = null;
        this.timeInterval = null;
        this.selectedTrack = 0;
        this.xfadeSceneA = 0;
        this.xfadeSceneB = 1;
        this.settings = this.loadSettings();
    }

    loadSettings() {
        const defaults = {
            theme: 'map',
            recFormat: 'webm',
            recAutoSave: 'off',
            recGpsEmbed: true,
            seqTracks: 8,
            seqSteps: 16,
            selectedKit: 'kit1',
            synthPreset: 'default'
        };
        try {
            const saved = localStorage.getItem('ohmybox_settings');
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch (e) {
            return defaults;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('ohmybox_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.warn('Could not save settings:', e);
        }
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
        this.setupOctaTrackSequencer();
        this.setupPads();
        this.setupKnobs();
        this.setupSynth();
        this.setupSynthMatrix();
        this.setupScenes();
        this.setupFX();
        this.setupAI();
        this.setupRadio();
        this.setupRecordings();
        this.setupAdminModal();

        // GPS display and map background
        window.gpsTracker.addListener(() => this.updateGPS());
        this.updateGPS();

        // Recording handler
        window.sessionRecorder.onRecordingComplete = (recording) => {
            console.log('Recording saved');
            this.updateRecordingsList();
            this.updateRecCount();
        };

        // Apply saved settings
        this.applySettings();

        this.initialized = true;
        console.log('App v0.7.0 initialized');
    }

    applySettings() {
        // Apply theme
        this.setTheme(this.settings.theme);

        // Apply kit
        if (window.sampler) {
            window.sampler.setBank(this.settings.selectedKit);
        }
    }

    setTheme(theme) {
        const mapBg = document.getElementById('mapBackground');
        this.settings.theme = theme;

        if (theme === 'mariani') {
            mapBg.style.backgroundImage = "url('https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Mariani_wine_Laurens.jpg/800px-Mariani_wine_Laurens.jpg')";
            mapBg.classList.remove('has-location');
        } else if (theme === 'map') {
            // Will be updated by GPS
            const pos = window.gpsTracker?.getPosition();
            if (pos) {
                const mapUrl = window.gpsTracker.getMapImageUrl(16); // Higher zoom for background
                if (mapUrl) {
                    mapBg.style.backgroundImage = `url("${mapUrl}")`;
                    mapBg.classList.add('has-location');
                }
            }
        } else if (theme === 'dark') {
            mapBg.style.backgroundImage = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';
            mapBg.classList.remove('has-location');
        }

        this.saveSettings();
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

    // Octatrack-style sequencer
    setupOctaTrackSequencer() {
        const octTracks = document.getElementById('octTracks');
        const sourceSelect = document.getElementById('seqSource');
        const numTracks = this.settings.seqTracks;
        const numSteps = this.settings.seqSteps;

        // Generate track strips
        octTracks.innerHTML = '';
        for (let t = 0; t < numTracks; t++) {
            const track = document.createElement('div');
            track.className = 'oct-track' + (t === 0 ? ' selected' : '');
            track.dataset.track = t;

            const num = document.createElement('div');
            num.className = 'oct-track-num';
            num.textContent = t + 1;
            track.appendChild(num);

            const src = document.createElement('div');
            src.className = 'oct-track-src';
            src.textContent = this.getSourceAbbrev(window.sequencer.getTrackSource(t));
            track.appendChild(src);

            const steps = document.createElement('div');
            steps.className = 'oct-steps';
            for (let s = 0; s < numSteps; s++) {
                const step = document.createElement('div');
                step.className = 'oct-step' + (s % 4 === 0 ? ' beat' : '');
                step.dataset.track = t;
                step.dataset.step = s;

                // Click to toggle step
                step.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const active = window.sequencer.toggleStep(t, s);
                    step.classList.toggle('active', active);
                });

                steps.appendChild(step);
            }
            track.appendChild(steps);

            // Click track to select
            track.addEventListener('click', () => {
                this.selectTrack(t);
            });

            octTracks.appendChild(track);
        }

        // Source select
        sourceSelect.addEventListener('change', () => {
            window.sequencer.setTrackSource(this.selectedTrack, sourceSelect.value);
            this.updateTrackSourceDisplay();
        });

        // Random button
        document.getElementById('seqRandom').addEventListener('click', () => {
            window.sequencer.randomizeTrack(this.selectedTrack, 0.3);
            this.updateOctSteps();
        });

        // Clear button
        document.getElementById('seqClear').addEventListener('click', () => {
            window.sequencer.clearTrack(this.selectedTrack);
            this.updateOctSteps();
        });

        // Euclidean button - quick apply
        document.getElementById('eucGen').addEventListener('click', () => {
            // Quick euclidean: 4 hits in 16 steps
            const hits = Math.floor(Math.random() * 6) + 2; // 2-7 hits
            window.sequencer.applyEuclidean(this.selectedTrack, hits, numSteps, 0);
            this.updateOctSteps();
        });

        // Step callback for playback visualization
        window.sequencer.onStep((step) => {
            document.querySelectorAll('.oct-step').forEach(el => {
                el.classList.toggle('current', parseInt(el.dataset.step) === step);
            });
        });

        // Initial update
        this.updateOctSteps();
    }

    getSourceAbbrev(source) {
        const abbrevs = { sampler: 'SMP', synth: 'SYN', radio: 'RAD', mic: 'MIC' };
        return abbrevs[source] || 'SMP';
    }

    selectTrack(trackIndex) {
        this.selectedTrack = trackIndex;
        window.sequencer.setSelectedTrack(trackIndex);

        // Update UI
        document.querySelectorAll('.oct-track').forEach((el, i) => {
            el.classList.toggle('selected', i === trackIndex);
        });

        // Update source dropdown
        const sourceSelect = document.getElementById('seqSource');
        sourceSelect.value = window.sequencer.getTrackSource(trackIndex);
    }

    updateOctSteps() {
        const pattern = window.sequencer.getPattern();
        document.querySelectorAll('.oct-step').forEach(el => {
            const t = parseInt(el.dataset.track);
            const s = parseInt(el.dataset.step);
            el.classList.toggle('active', pattern[t]?.[s]?.active || false);
        });
    }

    updateTrackSourceDisplay() {
        document.querySelectorAll('.oct-track').forEach((track, idx) => {
            const srcEl = track.querySelector('.oct-track-src');
            if (srcEl) {
                srcEl.textContent = this.getSourceAbbrev(window.sequencer.getTrackSource(idx));
            }
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
            this.settings.selectedKit = e.target.value;
            this.saveSettings();
        });
    }

    // Knobs
    setupKnobs() {
        const knobs = document.querySelectorAll('.knob');

        knobs.forEach(knob => {
            const param = knob.dataset.param;
            const min = parseFloat(knob.dataset.min);
            const max = parseFloat(knob.dataset.max);
            let value = parseFloat(knob.dataset.value);

            // Set initial rotation
            this.updateKnobRotation(knob, value, min, max);

            let isDragging = false;
            let startY = 0;
            let startValue = 0;

            const onStart = (e) => {
                isDragging = true;
                startY = e.clientY || e.touches?.[0]?.clientY || 0;
                startValue = value;
                e.preventDefault();
            };

            const onMove = (e) => {
                if (!isDragging) return;
                const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
                const delta = (startY - clientY) * 0.5;
                value = Math.max(min, Math.min(max, startValue + delta * (max - min) / 100));

                this.updateKnobRotation(knob, value, min, max);
                this.applyKnobValue(param, value);
                knob.dataset.value = value;
            };

            const onEnd = () => {
                isDragging = false;
            };

            knob.addEventListener('mousedown', onStart);
            knob.addEventListener('touchstart', onStart);
            document.addEventListener('mousemove', onMove);
            document.addEventListener('touchmove', onMove);
            document.addEventListener('mouseup', onEnd);
            document.addEventListener('touchend', onEnd);
        });
    }

    updateKnobRotation(knob, value, min, max) {
        const percent = (value - min) / (max - min);
        const rotation = -135 + percent * 270; // -135 to +135 degrees
        knob.style.setProperty('--rotation', `${rotation}deg`);
    }

    applyKnobValue(param, value) {
        switch (param) {
            case 'freq':
                window.synth?.setFrequency(value);
                break;
            case 'filter':
                window.synth?.setFilterCutoff(value);
                break;
            case 'delay':
                window.mangleEngine?.setDelayMix(value);
                document.getElementById('fxDelay').value = value;
                break;
            case 'grain':
                window.mangleEngine?.setGrain(value, 50, 0);
                document.getElementById('fxGrain').value = value;
                break;
        }
    }

    // Synth
    setupSynth() {
        const toggle = document.getElementById('synthToggle');

        toggle.addEventListener('click', () => {
            const playing = window.synth.toggle();
            toggle.classList.toggle('active', playing);
            toggle.textContent = playing ? 'ON' : 'OFF';
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

    // Synth Matrix routing
    setupSynthMatrix() {
        document.querySelectorAll('.matrix-cell').forEach(cell => {
            cell.addEventListener('click', () => {
                cell.classList.toggle('active');
                // TODO: Implement actual routing changes in synth engine
                console.log(`Matrix: ${cell.dataset.src} -> ${cell.dataset.dst}: ${cell.classList.contains('active')}`);
            });
        });
    }

    // Scenes with crossfader
    setupScenes() {
        const sceneBtns = document.querySelectorAll('.scenes-xfade-panel .scene-btn');
        const saveBtn = document.getElementById('saveScene');
        const crossfader = document.getElementById('sceneCrossfader');
        const scopeSelect = document.getElementById('sceneScope');
        const xfadeLeft = document.getElementById('xfadeLeft');
        const xfadeRight = document.getElementById('xfadeRight');

        // Scene selection
        sceneBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.scene);

                // If shift-clicking or already active, assign to crossfader
                if (btn.classList.contains('active')) {
                    // Assign to right side of crossfader
                    this.xfadeSceneB = idx;
                    xfadeRight.textContent = ['A', 'B', 'C', 'D'][idx];
                } else {
                    // Normal click: recall scene
                    if (window.sceneManager.hasScene(idx)) {
                        window.sceneManager.recallScene(idx);
                        this.updateOctSteps();
                    }

                    // Update active state
                    sceneBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    // Assign to left side of crossfader
                    this.xfadeSceneA = idx;
                    xfadeLeft.textContent = ['A', 'B', 'C', 'D'][idx];
                }
            });
        });

        // Save button
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const activeBtn = document.querySelector('.scenes-xfade-panel .scene-btn.active');
                if (activeBtn) {
                    const idx = parseInt(activeBtn.dataset.scene);
                    window.sceneManager.saveScene(idx);
                    activeBtn.classList.add('has-data');
                    console.log('Saved scene', ['A', 'B', 'C', 'D'][idx]);
                }
            });
        }

        // Crossfader
        if (crossfader) {
            crossfader.addEventListener('input', () => {
                const value = parseInt(crossfader.value);
                // Morph between scenes A and B based on crossfader position
                if (window.sceneManager.hasScene(this.xfadeSceneA) &&
                    window.sceneManager.hasScene(this.xfadeSceneB)) {
                    // TODO: Implement live morphing
                    console.log(`Crossfade: ${value}% between ${this.xfadeSceneA} and ${this.xfadeSceneB}`);
                }
            });
        }
    }

    // FX
    setupFX() {
        const delay = document.getElementById('fxDelay');
        const crush = document.getElementById('fxCrush');
        const glitch = document.getElementById('fxGlitch');
        const grain = document.getElementById('fxGrain');
        const presetSelect = document.getElementById('fxPreset');
        const saveFxBtn = document.getElementById('saveFx');

        delay.addEventListener('input', () => {
            window.mangleEngine.setDelayMix(parseInt(delay.value));
            // Sync knob
            const knob = document.getElementById('knobDelay');
            if (knob) {
                knob.dataset.value = delay.value;
                this.updateKnobRotation(knob, parseInt(delay.value), 0, 100);
            }
        });

        crush.addEventListener('input', () => {
            window.mangleEngine.setBitDepth(parseInt(crush.value));
        });

        glitch.addEventListener('input', () => {
            window.mangleEngine.setGlitch(parseInt(glitch.value), 100, 'stutter');
        });

        grain.addEventListener('input', () => {
            window.mangleEngine.setGrain(parseInt(grain.value), 50, 0);
            // Sync knob
            const knob = document.getElementById('knobGrain');
            if (knob) {
                knob.dataset.value = grain.value;
                this.updateKnobRotation(knob, parseInt(grain.value), 0, 100);
            }
        });

        // FX presets
        if (presetSelect) {
            presetSelect.addEventListener('change', () => {
                // TODO: Load FX preset
                console.log('Load FX preset:', presetSelect.value);
            });
        }

        if (saveFxBtn) {
            saveFxBtn.addEventListener('click', () => {
                // TODO: Save current FX as preset
                console.log('Save FX preset');
            });
        }
    }

    // AI
    setupAI() {
        const vibeBtns = document.querySelectorAll('.vibe-btn');
        const generateBtn = document.getElementById('aiGenerate');

        vibeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                vibeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                const vibe = document.querySelector('.vibe-btn.active')?.dataset.vibe || 'calm';
                window.aiComposer.generateRhythm(vibe, 70, 50);
                this.updateOctSteps();
                console.log('AI Generated:', vibe);
            });
        }
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

            stationList.innerHTML = '<div style="color:#888;font-size:9px;">Searching...</div>';

            const stations = await window.radioPlayer.searchStations(query, '', '');

            if (stations.length === 0) {
                stationList.innerHTML = '<div style="color:#888;font-size:9px;">No stations</div>';
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

        if (listBtn) {
            listBtn.addEventListener('click', () => {
                this.updateRecordingsList();
            });
        }

        this.updateRecCount();
    }

    updateRecCount() {
        const countEl = document.getElementById('recCount');
        if (countEl) {
            const recordings = window.sessionRecorder?.getRecordings() || [];
            countEl.textContent = recordings.length;
        }
    }

    updateRecordingsList() {
        const recList = document.getElementById('recList');
        if (!recList) return;

        const recordings = window.sessionRecorder.getRecordings();

        if (!recordings || recordings.length === 0) {
            recList.innerHTML = '<div style="color:#888;font-size:8px;padding:2px;">No recordings</div>';
            return;
        }

        recList.innerHTML = recordings.map((rec) => `
            <div class="rec-item" data-id="${rec.id}">
                <span class="rec-item-name">${rec.name || 'Rec'}</span>
                ${rec.url ? `<button class="rec-item-play" data-id="${rec.id}">▶</button>` : ''}
                ${rec.blob ? `<button class="rec-item-dl" data-id="${rec.id}">↓</button>` : ''}
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

    // Admin Modal
    setupAdminModal() {
        const adminBtn = document.getElementById('btnAdmin');
        const modal = document.getElementById('adminModal');
        const closeBtn = document.getElementById('closeAdmin');

        adminBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            this.populateAdminModal();
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });

        // Kit selection
        document.getElementById('kitList').addEventListener('click', (e) => {
            const item = e.target.closest('.kit-item');
            if (item) {
                document.querySelectorAll('.kit-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const kit = item.dataset.kit;
                window.sampler.setBank(kit);
                this.settings.selectedKit = kit;
                this.saveSettings();
            }
        });

        // Synth presets
        document.getElementById('synthPresets').addEventListener('click', (e) => {
            const item = e.target.closest('.preset-item');
            if (item) {
                document.querySelectorAll('.preset-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                this.settings.synthPreset = item.dataset.preset;
                this.saveSettings();
                // TODO: Apply synth preset
            }
        });

        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.setTheme(btn.dataset.theme);
            });
        });

        // Settings selects
        document.getElementById('recFormat')?.addEventListener('change', (e) => {
            this.settings.recFormat = e.target.value;
            this.saveSettings();
        });

        document.getElementById('recAutoSave')?.addEventListener('change', (e) => {
            this.settings.recAutoSave = e.target.value;
            this.saveSettings();
        });

        document.getElementById('recGpsEmbed')?.addEventListener('change', (e) => {
            this.settings.recGpsEmbed = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('seqTracks')?.addEventListener('change', (e) => {
            this.settings.seqTracks = parseInt(e.target.value);
            this.saveSettings();
            // Would need to rebuild sequencer UI
        });

        document.getElementById('seqSteps')?.addEventListener('change', (e) => {
            this.settings.seqSteps = parseInt(e.target.value);
            this.saveSettings();
            // Would need to rebuild sequencer UI
        });

        // Upload kit button
        const uploadKitBtn = document.getElementById('uploadKitBtn');
        const uploadKit = document.getElementById('uploadKit');

        uploadKitBtn?.addEventListener('click', () => {
            uploadKit.click();
        });

        uploadKit?.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                console.log('Upload kit files:', files);
                // TODO: Process uploaded audio files
            }
        });
    }

    populateAdminModal() {
        // Sync UI with current settings
        document.querySelectorAll('.kit-item').forEach(item => {
            item.classList.toggle('active', item.dataset.kit === this.settings.selectedKit);
        });

        document.querySelectorAll('.preset-item').forEach(item => {
            item.classList.toggle('active', item.dataset.preset === this.settings.synthPreset);
        });

        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.settings.theme);
        });

        const recFormat = document.getElementById('recFormat');
        const recAutoSave = document.getElementById('recAutoSave');
        const recGpsEmbed = document.getElementById('recGpsEmbed');
        const seqTracks = document.getElementById('seqTracks');
        const seqSteps = document.getElementById('seqSteps');

        if (recFormat) recFormat.value = this.settings.recFormat;
        if (recAutoSave) recAutoSave.value = this.settings.recAutoSave;
        if (recGpsEmbed) recGpsEmbed.checked = this.settings.recGpsEmbed;
        if (seqTracks) seqTracks.value = this.settings.seqTracks;
        if (seqSteps) seqSteps.value = this.settings.seqSteps;
    }

    // GPS
    updateGPS() {
        const text = document.getElementById('gpsText');
        const mapBg = document.getElementById('mapBackground');

        const pos = window.gpsTracker.getPosition();

        if (pos) {
            if (text) {
                text.textContent = pos.formatted;
            }

            // Update map background if theme is 'map'
            if (this.settings.theme === 'map' && mapBg) {
                const mapUrl = window.gpsTracker.getMapImageUrl(15);
                if (mapUrl) {
                    mapBg.style.backgroundImage = `url("${mapUrl}")`;
                    mapBg.classList.add('has-location');
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
