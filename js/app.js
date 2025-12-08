// Oh My Box - Main Application Controller

class App {
    constructor() {
        this.initialized = false;
        this.meterInterval = null;
        this.timeInterval = null;
        this.mode = 'orchestrate'; // orchestrate or perform
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
        this.setupTabs();
        this.setupModeToggle();
        this.setupTransport();
        this.setupMixer();
        this.setupScenes();
        this.setupArrangement();
        this.setupSequencer();
        this.setupPads();
        this.setupSynth();
        this.setupFX();
        this.setupAI();
        this.setupRadio();
        this.setupRecordingsList();

        // Setup GPS display and location image
        window.gpsTracker.addListener(() => {
            this.updateGPSDisplay();
            window.gpsTracker.updateLocationImage();
        });
        this.updateGPSDisplay();
        window.gpsTracker.updateLocationImage();

        // Start meter updates
        this.startMeters();

        // Recording complete handler
        window.sessionRecorder.onRecordingComplete = () => {
            this.updateRecordingsList();
        };

        // Hide init overlay
        document.getElementById('initOverlay').classList.add('hidden');

        this.initialized = true;
        console.log('App initialized');
    }

    // Tab Navigation (deprecated - now single scrollable page)
    setupTabs() {
        // No longer using tabs - ORCH is a single scrollable page
        // This method kept for compatibility but does nothing
    }

    // Mode Toggle (Orchestrate/Perform)
    setupModeToggle() {
        const modeBtns = document.querySelectorAll('.mode-btn');
        const orchView = document.getElementById('orchView');
        const perfView = document.getElementById('performView');

        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.mode = btn.dataset.mode;

                // Toggle views
                if (this.mode === 'perform') {
                    orchView.classList.add('hidden');
                    perfView.classList.remove('hidden');
                    document.body.classList.add('perf-mode');
                    this.syncPerfView();
                } else {
                    orchView.classList.remove('hidden');
                    perfView.classList.add('hidden');
                    document.body.classList.remove('perf-mode');
                }

                console.log('Mode:', this.mode);
            });
        });

        // Setup PERF mode controls
        this.setupPerfMode();
    }

    // PERF Mode Controls
    setupPerfMode() {
        // Generate step ring dots
        const stepRing = document.getElementById('perfStepRing');
        if (stepRing) {
            for (let i = 0; i < 16; i++) {
                const dot = document.createElement('div');
                dot.className = 'ring-dot';
                dot.dataset.step = i;
                // Position dots in a circle
                const angle = (i / 16) * 2 * Math.PI - Math.PI / 2;
                const radius = 90;
                const x = 100 + radius * Math.cos(angle);
                const y = 100 + radius * Math.sin(angle);
                dot.style.left = `${x}px`;
                dot.style.top = `${y}px`;
                stepRing.appendChild(dot);
            }
        }

        // Scene buttons (recall only)
        document.querySelectorAll('.perf-scene-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.scene);
                if (window.sceneManager.hasScene(idx)) {
                    window.sceneManager.recallScene(idx);
                }
                document.querySelectorAll('.perf-scene-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update big scene letter
                const letter = document.getElementById('perfSceneLetter');
                if (letter) letter.textContent = ['A', 'B', 'C', 'D'][idx];
            });
        });

        // Live controls - Filter
        const perfFilter = document.getElementById('perfFilter');
        if (perfFilter) {
            perfFilter.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                window.synth.setFilterCutoff(val);
                // Also update ORCH filter if present
                const orchFilter = document.getElementById('orchFilterCutoff');
                if (orchFilter) orchFilter.value = val;
            });
        }

        // Live controls - FX Mix
        const perfFxMix = document.getElementById('perfFxMix');
        if (perfFxMix) {
            perfFxMix.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                window.mangleEngine.setDelayMix(val);
            });
        }

        // Mic reactive toggle
        const micReactiveToggle = document.getElementById('micReactiveToggle');
        if (micReactiveToggle) {
            micReactiveToggle.addEventListener('click', () => {
                const active = !micReactiveToggle.classList.contains('active');
                micReactiveToggle.classList.toggle('active', active);
                micReactiveToggle.textContent = active ? 'ON' : 'OFF';
                this.micReactive = active;
                if (active) {
                    this.startMicReactivity();
                } else {
                    this.stopMicReactivity();
                }
            });
        }

        // Start mic meter updates
        this.startPerfMicMeter();
    }

    // Mic level meter for PERF mode
    startPerfMicMeter() {
        setInterval(() => {
            if (this.mode === 'perform') {
                const level = window.audioEngine.getMeterLevel('mic');
                const fill = document.getElementById('perfMicFill');
                if (fill) fill.style.width = `${level}%`;

                // Mic reactivity - modulate synth based on mic level
                if (this.micReactive && level > 10) {
                    const filterVal = 500 + (level * 50); // 500-5500 Hz based on mic
                    window.synth.setFilterCutoff(filterVal);
                }
            }
        }, 50);
    }

    startMicReactivity() {
        console.log('Mic reactivity enabled');
    }

    stopMicReactivity() {
        console.log('Mic reactivity disabled');
    }

    // Sync PERF view with current state
    syncPerfView() {
        // Sync scene buttons
        document.querySelectorAll('.perf-scene-btn').forEach(btn => {
            const idx = parseInt(btn.dataset.scene);
            btn.classList.toggle('has-data', window.sceneManager.hasScene(idx));
        });

        // Sync current scene
        const currentScene = window.sceneManager.getCurrentScene();
        document.querySelectorAll('.perf-scene-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.scene) === currentScene);
        });

        const letter = document.getElementById('perfSceneLetter');
        if (letter) letter.textContent = ['A', 'B', 'C', 'D'][currentScene];

        // Sync tempo and status
        const perfBpm = document.getElementById('perfBpm');
        if (perfBpm) perfBpm.textContent = `${window.sequencer.getTempo()} BPM`;

        const perfStatus = document.getElementById('perfStatus');
        if (perfStatus) {
            perfStatus.textContent = window.sequencer.isPlaying() ? 'PLAYING' : 'READY';
        }
    }

    // Transport Controls
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

        btnStop.addEventListener('click', () => {
            // Stop sequencer
            window.sequencer.stop();
            btnPlay.classList.remove('active');

            // Stop recording
            if (window.sessionRecorder.isRecording()) {
                window.sessionRecorder.stop();
                btnRecord.classList.remove('active');
                this.stopTimeDisplay();
            }

            // Stop synth
            window.synth.stop();

            // Stop radio
            window.radioPlayer.stop();

            // Stop all samples
            window.sampler.stopAll();

            // Update ORCH synth UI
            const orchSynthToggle = document.getElementById('synthToggle');
            if (orchSynthToggle) {
                orchSynthToggle.classList.remove('active');
                orchSynthToggle.textContent = 'OFF';
            }

            // Update radio UI
            document.getElementById('radioStop').disabled = true;
            document.getElementById('currentStation').textContent = 'None';
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

    // Mixer
    setupMixer() {
        const channels = ['Mic', 'Samples', 'Synth', 'Radio'];

        channels.forEach(name => {
            const fader = document.getElementById(`fader${name}`);
            const muteBtn = document.getElementById(`mute${name}`);
            const channelKey = name.toLowerCase();

            fader.addEventListener('input', () => {
                const level = fader.value / 100;
                window.audioEngine.setChannelLevel(channelKey, level);
            });

            muteBtn.addEventListener('click', () => {
                const muted = window.audioEngine.toggleMute(channelKey);
                muteBtn.classList.toggle('active', muted);
            });
        });

        // Master fader
        document.getElementById('faderMaster').addEventListener('input', (e) => {
            window.audioEngine.setMasterLevel(e.target.value / 100);
        });
    }

    // Scenes
    setupScenes() {
        const sceneBtns = document.querySelectorAll('.orch-scene-bar .scene-btn');
        const saveBtn = document.getElementById('saveScene');

        // Recall buttons
        sceneBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sceneIndex = parseInt(btn.dataset.scene);

                // Recall if has data
                if (window.sceneManager.hasScene(sceneIndex)) {
                    window.sceneManager.recallScene(sceneIndex);
                }

                sceneBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Single save button - saves to currently selected scene
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const activeBtn = document.querySelector('.orch-scene-bar .scene-btn.active');
                if (activeBtn) {
                    const sceneIndex = parseInt(activeBtn.dataset.scene);
                    window.sceneManager.saveScene(sceneIndex);

                    // Visual feedback
                    saveBtn.classList.add('saved');
                    activeBtn.classList.add('has-data');
                    setTimeout(() => saveBtn.classList.remove('saved'), 500);

                    console.log('Saved scene', ['A', 'B', 'C', 'D'][sceneIndex]);
                }
            });
        }
    }

    // Arrangement (simplified - uses scenes directly)
    setupArrangement() {
        // Arrangement is now handled through scene switching
        // The play button starts the sequencer, scenes can be switched live
    }

    // Sequencer
    setupSequencer() {
        const grid = document.getElementById('seqGrid');
        const overview = document.getElementById('seqOverview');
        const trackSelect = document.getElementById('seqTrack');
        const sourceSelect = document.getElementById('seqSource');
        const tempoSlider = document.getElementById('seqTempo');
        const tempoDisplay = document.getElementById('seqTempoDisplay');
        const probSlider = document.getElementById('seqProb');
        const probDisplay = document.getElementById('seqProbDisplay');

        // Generate step grid
        for (let s = 0; s < 16; s++) {
            const step = document.createElement('div');
            step.className = 'seq-step' + (s % 4 === 0 ? ' beat' : '');
            step.dataset.step = s;
            step.addEventListener('click', () => {
                const track = window.sequencer.getSelectedTrack();
                const active = window.sequencer.toggleStep(track, s);
                step.classList.toggle('active', active);
                this.updateSeqOverview();
            });
            grid.appendChild(step);
        }

        // Generate overview
        for (let t = 0; t < 8; t++) {
            const row = document.createElement('div');
            row.className = 'seq-track-row';

            const label = document.createElement('div');
            label.className = 'seq-track-label';
            label.textContent = t + 1;
            row.appendChild(label);

            const steps = document.createElement('div');
            steps.className = 'seq-track-steps';
            for (let s = 0; s < 16; s++) {
                const miniStep = document.createElement('div');
                miniStep.className = 'seq-mini-step';
                miniStep.dataset.track = t;
                miniStep.dataset.step = s;
                steps.appendChild(miniStep);
            }
            row.appendChild(steps);
            overview.appendChild(row);
        }

        // Track select
        trackSelect.addEventListener('change', () => {
            const trackIndex = parseInt(trackSelect.value);
            window.sequencer.setSelectedTrack(trackIndex);
            this.updateSeqGrid();

            // Update source dropdown to show current track's source
            sourceSelect.value = window.sequencer.getTrackSource(trackIndex);
        });

        // Source select - set source for current track
        sourceSelect.addEventListener('change', () => {
            const trackIndex = window.sequencer.getSelectedTrack();
            const source = sourceSelect.value;
            window.sequencer.setTrackSource(trackIndex, source);
            this.updateSourceRouting();
        });

        // Tempo
        tempoSlider.addEventListener('input', () => {
            window.sequencer.setTempo(parseInt(tempoSlider.value));
            tempoDisplay.textContent = tempoSlider.value;
            document.getElementById('tempoValue').textContent = tempoSlider.value;
        });

        // Probability
        probSlider.addEventListener('input', () => {
            const track = window.sequencer.getSelectedTrack();
            window.sequencer.setTrackProbability(track, parseInt(probSlider.value));
            probDisplay.textContent = probSlider.value + '%';
        });

        // Euclidean generator
        document.getElementById('eucGenerate').addEventListener('click', () => {
            const hits = parseInt(document.getElementById('eucHits').value);
            const steps = parseInt(document.getElementById('eucSteps').value);
            const rotate = parseInt(document.getElementById('eucRotate').value);
            const track = window.sequencer.getSelectedTrack();

            window.sequencer.applyEuclidean(track, hits, steps, rotate);
            this.updateSeqGrid();
            this.updateSeqOverview();
        });

        // Clear track
        document.getElementById('seqClear').addEventListener('click', () => {
            const track = window.sequencer.getSelectedTrack();
            window.sequencer.clearTrack(track);
            this.updateSeqGrid();
            this.updateSeqOverview();
        });

        // Random
        document.getElementById('seqRandom').addEventListener('click', () => {
            const track = window.sequencer.getSelectedTrack();
            window.sequencer.randomizeTrack(track, 0.3);
            this.updateSeqGrid();
            this.updateSeqOverview();
        });

        // Routing source click - cycle through sources
        const availableSources = ['sampler', 'radio', 'mic', 'synth'];
        document.querySelectorAll('.routing-source').forEach(el => {
            el.addEventListener('click', () => {
                const trackIndex = parseInt(el.dataset.track);
                const currentSource = window.sequencer.getTrackSource(trackIndex);
                const currentIdx = availableSources.indexOf(currentSource);
                const nextSource = availableSources[(currentIdx + 1) % availableSources.length];

                window.sequencer.setTrackSource(trackIndex, nextSource);
                this.updateSourceRouting();

                // Also update source dropdown if this track is selected
                if (trackIndex === window.sequencer.getSelectedTrack()) {
                    document.getElementById('seqSource').value = nextSource;
                }
            });
        });

        // Step callback for visual feedback
        window.sequencer.onStep((step) => {
            // Update grid
            document.querySelectorAll('.seq-step').forEach((el, i) => {
                el.classList.toggle('current', i === step);
            });

            // Update overview
            document.querySelectorAll('.seq-mini-step').forEach(el => {
                el.classList.toggle('current', parseInt(el.dataset.step) === step);
            });

            // Update position bar
            const posValue = document.getElementById('seqPosValue');
            const posFill = document.getElementById('seqPosFill');
            if (step >= 0) {
                posValue.textContent = `${step + 1}/16`;
                posFill.style.width = `${((step + 1) / 16) * 100}%`;
            } else {
                posValue.textContent = '--';
                posFill.style.width = '0%';
            }

            // Update PERF step display
            document.getElementById('perfStep').textContent = step >= 0 ? `${step + 1}/16` : '--';
            document.getElementById('perfTempo').textContent = `${window.sequencer.getTempo()} BPM`;

            // Update PERF step dots
            document.querySelectorAll('.perf-step-dot').forEach(dot => {
                const s = parseInt(dot.dataset.step);
                dot.classList.toggle('current', s === step);
            });
        });
    }

    updateSeqGrid() {
        const track = window.sequencer.getSelectedTrack();
        const pattern = window.sequencer.getTrackPattern(track);

        document.querySelectorAll('.seq-step').forEach((el, i) => {
            el.classList.toggle('active', pattern[i]?.active || false);
        });
    }

    updateSeqOverview() {
        const fullPattern = window.sequencer.getPattern();

        document.querySelectorAll('.seq-mini-step').forEach(el => {
            const t = parseInt(el.dataset.track);
            const s = parseInt(el.dataset.step);
            el.classList.toggle('active', fullPattern[t][s]?.active || false);
        });
    }

    updateSourceRouting() {
        const sources = window.sequencer.getTrackSources();
        const sourceLabels = {
            'sampler': 'Sampler',
            'radio': 'Radio',
            'mic': 'Mic',
            'synth': 'Synth'
        };

        document.querySelectorAll('.routing-source').forEach(el => {
            const trackIndex = parseInt(el.dataset.track);
            const source = sources[trackIndex];
            el.textContent = sourceLabels[source] || 'Sampler';

            // Color-code by source type
            el.classList.remove('src-sampler', 'src-radio', 'src-mic', 'src-synth');
            el.classList.add(`src-${source}`);
        });
    }

    startMeters() {
        const channels = ['mic', 'samples', 'synth', 'radio', 'master'];

        this.meterInterval = setInterval(() => {
            channels.forEach(name => {
                const meter = document.getElementById(`meter${name.charAt(0).toUpperCase() + name.slice(1)}`);
                if (meter) {
                    const fill = meter.querySelector('.meter-fill');
                    const level = window.audioEngine.getMeterLevel(name);
                    fill.style.height = `${level}%`;
                }
            });
        }, 50);
    }

    // Pads
    setupPads() {
        const pads = document.querySelectorAll('.pad');

        pads.forEach(pad => {
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
            pad.addEventListener('touchstart', (e) => {
                e.preventDefault();
                trigger();
            });
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

        // Power toggle
        if (toggle) {
            toggle.addEventListener('click', () => {
                const playing = window.synth.toggle();
                toggle.classList.toggle('active', playing);
                toggle.textContent = playing ? 'ON' : 'OFF';
            });
        }

        // Waveform selector buttons
        document.querySelectorAll('.wave-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const wave = btn.dataset.wave;
                window.synth.setWaveform(wave);
                document.querySelectorAll('.wave-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Frequency
        if (freq) {
            freq.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                window.synth.setFrequency(value);
                document.getElementById('freqDisplay').textContent = Math.round(value);
            });
        }

        // Filter cutoff
        const filterCutoff = document.getElementById('orchFilterCutoff');
        if (filterCutoff) {
            filterCutoff.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                window.synth.setFilterCutoff(value);
                const display = value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value;
                document.getElementById('orchFilterDisplay').textContent = display;
            });
        }

        // Filter resonance
        const filterRes = document.getElementById('orchFilterRes');
        if (filterRes) {
            filterRes.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                window.synth.setFilterResonance(value);
                document.getElementById('orchResDisplay').textContent = value;
            });
        }

        // Keyboard - mini version
        this.currentOctave = 4;
        document.querySelectorAll('.mini-keyboard .key').forEach(key => {
            const noteIndex = parseInt(key.dataset.note);

            const playNote = () => {
                // Calculate frequency: A4 = 440Hz
                const midiNote = 12 * this.currentOctave + noteIndex;
                const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
                window.synth.triggerNote(frequency, 0.3);
                key.classList.add('pressed');
            };

            const releaseNote = () => {
                key.classList.remove('pressed');
            };

            key.addEventListener('mousedown', playNote);
            key.addEventListener('mouseup', releaseNote);
            key.addEventListener('mouseleave', releaseNote);
            key.addEventListener('touchstart', (e) => {
                e.preventDefault();
                playNote();
            });
            key.addEventListener('touchend', releaseNote);
        });
    }

    // FX
    setupFX() {
        // FX Routing
        this.fxRoute = 'master'; // default
        const routingBtns = document.querySelectorAll('.route-btn');

        routingBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const route = btn.dataset.route;
                this.fxRoute = route;
                routingBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (window.mangleEngine && window.mangleEngine.setRoute) {
                    window.mangleEngine.setRoute(route);
                }
                console.log('FX routing:', route);
            });
        });

        // Delay
        const delayMix = document.getElementById('delayMix');
        if (delayMix) {
            delayMix.addEventListener('input', () => {
                document.getElementById('delayMixDisplay').textContent = delayMix.value;
                window.mangleEngine.setDelayMix(parseInt(delayMix.value));
            });
        }

        // Crusher
        const crushBits = document.getElementById('crushBits');
        if (crushBits) {
            crushBits.addEventListener('input', () => {
                document.getElementById('crushBitsDisplay').textContent = crushBits.value;
                window.mangleEngine.setBitDepth(parseInt(crushBits.value));
            });
        }

        // Glitch
        const glitchProb = document.getElementById('glitchProb');
        if (glitchProb) {
            glitchProb.addEventListener('input', () => {
                document.getElementById('glitchProbDisplay').textContent = glitchProb.value;
                window.mangleEngine.setGlitch(parseInt(glitchProb.value), 100, 'stutter');
            });
        }

        // Grain
        const grainDensity = document.getElementById('grainDensity');
        if (grainDensity) {
            grainDensity.addEventListener('input', () => {
                document.getElementById('grainDensityDisplay').textContent = grainDensity.value;
                window.mangleEngine.setGrain(parseInt(grainDensity.value), 50, 0);
            });
        }
    }

    // AI
    setupAI() {
        const vibeBtns = document.querySelectorAll('.vibe-btn');
        const densitySlider = document.getElementById('aiDensity');
        const complexitySlider = document.getElementById('aiComplexity');
        const generateBtn = document.getElementById('aiGenerate');
        const surpriseBtn = document.getElementById('aiSurprise');

        vibeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                vibeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                const vibe = document.querySelector('.vibe-btn.active')?.dataset.vibe || 'calm';
                const density = densitySlider ? parseInt(densitySlider.value) : 50;
                const complexity = complexitySlider ? parseInt(complexitySlider.value) : 50;

                window.aiComposer.generateRhythm(vibe, density, complexity);
                this.updateSeqGrid();
                this.updateSeqOverview();
                console.log('AI Generated:', vibe, density, complexity);
            });
        }

        if (surpriseBtn) {
            surpriseBtn.addEventListener('click', () => {
                window.aiComposer.surprise();
                this.updateSeqGrid();
                this.updateSeqOverview();
                console.log('AI Surprise!');
            });
        }
    }

    // Radio
    setupRadio() {
        const searchBtn = document.getElementById('radioSearchBtn');
        const searchInput = document.getElementById('radioSearch');
        const stationList = document.getElementById('stationList');
        const stopBtn = document.getElementById('radioStop');

        if (!searchBtn || !searchInput) return;

        const doSearch = async () => {
            const query = searchInput.value;
            if (!query) return;

            stationList.innerHTML = '<span class="placeholder">Searching...</span>';

            const stations = await window.radioPlayer.searchStations(query, '', '');

            if (stations.length === 0) {
                stationList.innerHTML = '<span class="placeholder">No stations found</span>';
                return;
            }

            stationList.innerHTML = stations.slice(0, 5).map(s => `
                <div class="station-item" data-url="${s.url}" data-name="${s.name}">
                    ${s.name}
                </div>
            `).join('');

            stationList.querySelectorAll('.station-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const station = {
                        name: item.dataset.name,
                        url: item.dataset.url
                    };

                    stationList.querySelectorAll('.station-item').forEach(i => i.classList.remove('playing'));
                    item.classList.add('playing');

                    const success = await window.radioPlayer.play(station);
                    if (success) {
                        document.getElementById('currentStation').textContent = station.name;
                        if (stopBtn) stopBtn.disabled = false;
                    }
                });
            });
        };

        searchBtn.addEventListener('click', doSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                window.radioPlayer.stop();
                document.getElementById('currentStation').textContent = '--';
                stopBtn.disabled = true;
                stationList.querySelectorAll('.station-item').forEach(i => i.classList.remove('playing'));
            });
        }
    }

    // Recordings List
    setupRecordingsList() {
        this.updateRecordingsList();
    }

    updateRecordingsList() {
        const list = document.getElementById('recordingsList');
        const recordings = window.sessionRecorder.getRecordings();

        if (recordings.length === 0) {
            list.innerHTML = '<p class="placeholder">No recordings yet. Hit REC to start!</p>';
            return;
        }

        list.innerHTML = recordings.map(r => {
            const duration = Math.floor(r.duration / 1000);
            const mins = Math.floor(duration / 60);
            const secs = duration % 60;
            const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
            const gpsStr = r.gps ? r.gps.formatted : 'No GPS';
            const expired = r.expired ? ' (metadata only)' : '';

            return `
                <div class="recording-item" data-id="${r.id}">
                    <div class="recording-info">
                        <div class="recording-name">${r.name}${expired}</div>
                        <div class="recording-meta">${durationStr} • ${gpsStr}</div>
                    </div>
                    <div class="recording-actions">
                        ${!r.expired ? `
                            <button class="play-btn" data-id="${r.id}">Play</button>
                            <button class="download-btn" data-id="${r.id}">Save</button>
                        ` : ''}
                        <button class="delete-btn" data-id="${r.id}">Del</button>
                    </div>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const recording = recordings.find(r => r.id === btn.dataset.id);
                if (recording && recording.url) {
                    const audio = new Audio(recording.url);
                    audio.play();
                }
            });
        });

        list.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.sessionRecorder.downloadRecording(btn.dataset.id);
            });
        });

        list.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.sessionRecorder.deleteRecording(btn.dataset.id);
                this.updateRecordingsList();
            });
        });
    }

    // GPS Display
    updateGPSDisplay() {
        document.getElementById('gpsCoords').textContent = window.gpsTracker.getDisplayString();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();

    document.getElementById('btnInit').addEventListener('click', () => {
        window.app.init();
    });
});
