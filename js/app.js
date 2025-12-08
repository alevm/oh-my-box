// Oh My Box v0.7.1 - Main Application Controller

class App {
    constructor() {
        this.initialized = false;
        this.meterInterval = null;
        this.timeInterval = null;
        this.selectedTrack = 0;
        this.xfadeSceneA = 0;
        this.xfadeSceneB = 1;
        this.settings = this.loadSettings();

        // P-Lock editor state
        this.plockEditing = false;
        this.plockTrack = 0;
        this.plockStep = 0;

        // Shift key state for P-Lock access
        this.shiftHeld = false;
    }

    loadSettings() {
        const defaults = {
            theme: 'mariani',
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
        this.setupPLockEditor();
        this.setupDubMode();
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
        this.setupKeyboardShortcuts();

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
        console.log('App v0.7.3 initialized');
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

        // Always remove filter first, then apply per theme
        mapBg.style.filter = '';

        if (theme === 'mariani') {
            mapBg.style.backgroundImage = "url('https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Mariani_wine_Laurens.jpg/800px-Mariani_wine_Laurens.jpg')";
            mapBg.style.filter = 'brightness(0.7) sepia(0.2)';
            mapBg.classList.remove('has-location');
        } else if (theme === 'map') {
            // Will be updated by GPS
            const pos = window.gpsTracker?.getPosition();
            if (pos) {
                const mapUrl = window.gpsTracker.getMapImageUrl(16);
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

                // Click to toggle step, SHIFT+click to edit P-Locks
                step.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (this.shiftHeld || e.shiftKey) {
                        // Open P-Lock editor for this step
                        this.openPLockEditor(t, s);
                    } else {
                        const active = window.sequencer.toggleStep(t, s);
                        step.classList.toggle('active', active);
                    }
                });

                // Long press for P-Lock editor (mobile)
                let longPressTimer;
                step.addEventListener('touchstart', (e) => {
                    longPressTimer = setTimeout(() => {
                        this.openPLockEditor(t, s);
                    }, 500);
                });
                step.addEventListener('touchend', () => clearTimeout(longPressTimer));
                step.addEventListener('touchmove', () => clearTimeout(longPressTimer));

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
            const step = pattern[t]?.[s];

            el.classList.toggle('active', step?.active || false);

            // Show P-Lock indicator
            const hasPLocks = window.sequencer.hasPLocks(t, s);
            el.classList.toggle('has-plock', hasPLocks);

            // Show trig condition indicator
            const cond = step?.trigCondition;
            el.classList.toggle('has-condition', cond && cond.type !== 'always');
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

                // Record in dub mode if sequencer is playing
                if (window.sequencer.getDubMode() !== 'off' && window.sequencer.isPlaying()) {
                    window.sequencer.recordDubTrigger(index);
                    this.updateOctSteps();
                }
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

    // P-Lock Editor
    setupPLockEditor() {
        const editor = document.getElementById('plockEditor');
        const closeBtn = document.getElementById('plockClose');

        // Close button
        closeBtn.addEventListener('click', () => this.closePLockEditor());

        // P-Lock parameter sliders
        const params = ['Pitch', 'Slice', 'Filter', 'Decay'];
        params.forEach(param => {
            const slider = document.getElementById(`plock${param}`);
            const display = document.getElementById(`plock${param}Val`);

            if (slider) {
                slider.addEventListener('input', () => {
                    display.textContent = slider.value;
                    if (this.plockEditing) {
                        window.sequencer.setPLock(
                            this.plockTrack,
                            this.plockStep,
                            param.toLowerCase(),
                            parseInt(slider.value)
                        );
                        this.updateOctSteps();
                    }
                });
            }
        });

        // Trig condition controls
        const trigType = document.getElementById('trigCondType');
        const trigValue = document.getElementById('trigCondValue');

        trigType.addEventListener('change', () => {
            if (this.plockEditing) {
                window.sequencer.setTrigCondition(
                    this.plockTrack,
                    this.plockStep,
                    trigType.value,
                    parseInt(trigValue.value)
                );
                this.updateOctSteps();
            }
        });

        trigValue.addEventListener('change', () => {
            if (this.plockEditing) {
                window.sequencer.setTrigCondition(
                    this.plockTrack,
                    this.plockStep,
                    trigType.value,
                    parseInt(trigValue.value)
                );
            }
        });
    }

    openPLockEditor(trackIndex, stepIndex) {
        const editor = document.getElementById('plockEditor');
        this.plockEditing = true;
        this.plockTrack = trackIndex;
        this.plockStep = stepIndex;

        // Update step number display
        document.getElementById('plockStepNum').textContent = `${trackIndex + 1}.${stepIndex + 1}`;

        // Load current P-Lock values
        const pLocks = ['pitch', 'slice', 'filter', 'decay'];
        pLocks.forEach(param => {
            const value = window.sequencer.getPLock(trackIndex, stepIndex, param);
            const slider = document.getElementById(`plock${param.charAt(0).toUpperCase() + param.slice(1)}`);
            const display = document.getElementById(`plock${param.charAt(0).toUpperCase() + param.slice(1)}Val`);

            if (slider) {
                // Use default values if no P-Lock set
                const defaultVal = param === 'pitch' ? 0 : (param === 'slice' ? 0 : 50);
                slider.value = value !== null ? value : defaultVal;
                display.textContent = slider.value;
            }
        });

        // Load trig condition
        const cond = window.sequencer.getTrigCondition(trackIndex, stepIndex);
        document.getElementById('trigCondType').value = cond.type;
        document.getElementById('trigCondValue').value = cond.value;

        // Show editor
        editor.classList.remove('hidden');
    }

    closePLockEditor() {
        const editor = document.getElementById('plockEditor');
        this.plockEditing = false;
        editor.classList.add('hidden');
    }

    // Dub Mode
    setupDubMode() {
        const dubToggle = document.getElementById('dubToggle');
        const fillBtn = document.getElementById('fillBtn');

        // Dub toggle: cycles through off -> dub -> overdub -> off
        dubToggle.addEventListener('click', () => {
            const currentMode = window.sequencer.getDubMode();
            let newMode;

            if (currentMode === 'off') {
                newMode = 'dub';
                dubToggle.classList.add('dub-active');
                dubToggle.classList.remove('overdub-active');
                dubToggle.textContent = 'DUB';
            } else if (currentMode === 'dub') {
                newMode = 'overdub';
                dubToggle.classList.remove('dub-active');
                dubToggle.classList.add('overdub-active');
                dubToggle.textContent = 'OVR';
            } else {
                newMode = 'off';
                dubToggle.classList.remove('dub-active', 'overdub-active');
                dubToggle.textContent = 'DUB';
            }

            window.sequencer.setDubMode(newMode);
        });

        // Fill button: hold to activate fill mode
        fillBtn.addEventListener('mousedown', () => {
            window.sequencer.setFillMode(true);
            fillBtn.classList.add('active');
        });

        fillBtn.addEventListener('mouseup', () => {
            window.sequencer.setFillMode(false);
            fillBtn.classList.remove('active');
        });

        fillBtn.addEventListener('mouseleave', () => {
            window.sequencer.setFillMode(false);
            fillBtn.classList.remove('active');
        });

        // Touch support for Fill
        fillBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            window.sequencer.setFillMode(true);
            fillBtn.classList.add('active');
        });

        fillBtn.addEventListener('touchend', () => {
            window.sequencer.setFillMode(false);
            fillBtn.classList.remove('active');
        });
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Shift') {
                this.shiftHeld = true;
            }

            // Escape closes P-Lock editor
            if (e.key === 'Escape' && this.plockEditing) {
                this.closePLockEditor();
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.shiftHeld = false;
            }
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

        // Crossfader - real-time scene morphing
        if (crossfader) {
            crossfader.addEventListener('input', () => {
                const value = parseInt(crossfader.value);
                this.morphScenes(value / 100);
            });
        }
    }

    // Real-time scene morphing based on crossfader position
    morphScenes(t) {
        // t = 0: fully scene A, t = 1: fully scene B
        if (!window.sceneManager.hasScene(this.xfadeSceneA) ||
            !window.sceneManager.hasScene(this.xfadeSceneB)) {
            return;
        }

        const sceneA = window.sceneManager.getScene(this.xfadeSceneA);
        const sceneB = window.sceneManager.getScene(this.xfadeSceneB);

        // Get current scope
        const scope = document.getElementById('sceneScope')?.value || 'all';

        // Interpolate based on scope
        const lerp = (a, b, t) => a + (b - a) * t;

        if (scope === 'all' || scope === 'mixer') {
            // Morph mixer levels
            if (sceneA.mixer && sceneB.mixer) {
                const channels = ['mic', 'samples', 'synth', 'radio'];
                channels.forEach(ch => {
                    const levelA = sceneA.mixer[ch]?.level ?? 0.8;
                    const levelB = sceneB.mixer[ch]?.level ?? 0.8;
                    const level = lerp(levelA, levelB, t);

                    const fader = document.getElementById(`fader${ch.charAt(0).toUpperCase() + ch.slice(1)}`);
                    if (fader) fader.value = level * 100;
                    window.audioEngine?.setChannelLevel(ch, level);
                });

                // Master
                const masterA = sceneA.mixer.master ?? 0.9;
                const masterB = sceneB.mixer.master ?? 0.9;
                const master = lerp(masterA, masterB, t);
                const masterFader = document.getElementById('faderMaster');
                if (masterFader) masterFader.value = master * 100;
                window.audioEngine?.setMasterLevel(master);
            }
        }

        if (scope === 'all' || scope === 'fx') {
            // Morph FX parameters
            if (sceneA.fx && sceneB.fx && window.mangleEngine) {
                // Delay mix
                const delayA = sceneA.fx.delay?.mix ?? 0;
                const delayB = sceneB.fx.delay?.mix ?? 0;
                const delayMix = lerp(delayA, delayB, t);
                window.mangleEngine.setDelayMix(delayMix);

                const delaySlider = document.getElementById('fxDelay');
                if (delaySlider) delaySlider.value = delayMix;
            }
        }

        if (scope === 'all') {
            // Morph tempo
            const tempoA = sceneA.tempo ?? 120;
            const tempoB = sceneB.tempo ?? 120;
            const tempo = Math.round(lerp(tempoA, tempoB, t));
            window.sequencer?.setTempo(tempo);

            const tempoSlider = document.getElementById('tempoSlider');
            const tempoVal = document.getElementById('tempoVal');
            if (tempoSlider) tempoSlider.value = tempo;
            if (tempoVal) tempoVal.textContent = tempo;
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

        // Punch-in FX buttons
        this.setupPunchFX();
    }

    // Punch-in FX (hold for temporary effect)
    setupPunchFX() {
        // Store original values to restore after punch-out
        this.punchFXStates = {};

        document.querySelectorAll('.punch-btn').forEach(btn => {
            const fxType = btn.dataset.fx;

            const punchIn = () => {
                btn.classList.add('active');
                this.applyPunchFX(fxType, true);
            };

            const punchOut = () => {
                btn.classList.remove('active');
                this.applyPunchFX(fxType, false);
            };

            // Mouse events
            btn.addEventListener('mousedown', punchIn);
            btn.addEventListener('mouseup', punchOut);
            btn.addEventListener('mouseleave', punchOut);

            // Touch events
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                punchIn();
            });
            btn.addEventListener('touchend', punchOut);
        });
    }

    applyPunchFX(fxType, active) {
        if (!window.mangleEngine) return;

        if (active) {
            // Store current state before applying punch effect
            switch (fxType) {
                case 'stutter':
                    // Apply heavy glitch/stutter effect
                    this.punchFXStates.glitch = document.getElementById('fxGlitch')?.value || 0;
                    window.mangleEngine.setGlitch(100, 50, 'stutter');
                    break;

                case 'reverse':
                    // Apply reverse effect
                    this.punchFXStates.reverse = false;
                    window.mangleEngine.setReverse?.(true);
                    break;

                case 'filter':
                    // Apply filter sweep (low pass filter down)
                    this.punchFXStates.filter = window.synth?.getFilterCutoff?.() || 8000;
                    window.synth?.setFilterCutoff(200);
                    window.mangleEngine.setFilterSweep?.(true, 200, 8000);
                    break;

                case 'tape':
                    // Apply tape stop effect (slow down)
                    this.punchFXStates.tape = false;
                    window.mangleEngine.setTapeStop?.(true);
                    break;
            }
            console.log(`Punch-in: ${fxType}`);
        } else {
            // Restore original state
            switch (fxType) {
                case 'stutter':
                    window.mangleEngine.setGlitch(this.punchFXStates.glitch || 0, 100, 'stutter');
                    break;

                case 'reverse':
                    window.mangleEngine.setReverse?.(false);
                    break;

                case 'filter':
                    window.synth?.setFilterCutoff(this.punchFXStates.filter || 8000);
                    window.mangleEngine.setFilterSweep?.(false);
                    break;

                case 'tape':
                    window.mangleEngine.setTapeStop?.(false);
                    break;
            }
            console.log(`Punch-out: ${fxType}`);
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
                this.generateFullComposition(vibe);
            });
        }
    }

    // Generate full composition based on vibe (patterns + FX + mixer + tempo)
    generateFullComposition(vibe) {
        console.log(`Generating full composition: ${vibe}`);

        // Generate rhythm pattern
        window.aiComposer?.generateRhythm(vibe, 70, 50);

        // Generate vibe-appropriate settings
        const vibeSettings = {
            calm: {
                tempo: 85 + Math.floor(Math.random() * 20),  // 85-105
                delay: 30 + Math.floor(Math.random() * 30),   // 30-60
                grain: 0,
                glitch: 0,
                crush: 16,
                mixer: { mic: 50, samples: 70, synth: 60, radio: 20, master: 85 }
            },
            urban: {
                tempo: 110 + Math.floor(Math.random() * 30), // 110-140
                delay: 20 + Math.floor(Math.random() * 40),
                grain: Math.floor(Math.random() * 30),
                glitch: Math.floor(Math.random() * 20),
                crush: 12 + Math.floor(Math.random() * 4),
                mixer: { mic: 30, samples: 90, synth: 70, radio: 40, master: 90 }
            },
            nature: {
                tempo: 70 + Math.floor(Math.random() * 30),  // 70-100
                delay: 40 + Math.floor(Math.random() * 30),
                grain: 20 + Math.floor(Math.random() * 40),
                glitch: 0,
                crush: 16,
                mixer: { mic: 70, samples: 60, synth: 40, radio: 50, master: 80 }
            },
            chaos: {
                tempo: 130 + Math.floor(Math.random() * 40), // 130-170
                delay: Math.floor(Math.random() * 80),
                grain: 30 + Math.floor(Math.random() * 50),
                glitch: 30 + Math.floor(Math.random() * 50),
                crush: 4 + Math.floor(Math.random() * 8),
                mixer: { mic: Math.random() * 100, samples: Math.random() * 100, synth: Math.random() * 100, radio: Math.random() * 100, master: 95 }
            }
        };

        const settings = vibeSettings[vibe] || vibeSettings.calm;

        // Apply tempo
        window.sequencer?.setTempo(settings.tempo);
        const tempoSlider = document.getElementById('tempoSlider');
        const tempoVal = document.getElementById('tempoVal');
        if (tempoSlider) tempoSlider.value = settings.tempo;
        if (tempoVal) tempoVal.textContent = settings.tempo;

        // Apply FX
        window.mangleEngine?.setDelayMix(settings.delay);
        window.mangleEngine?.setGrain(settings.grain, 50, 0);
        window.mangleEngine?.setGlitch(settings.glitch, 100, 'stutter');
        window.mangleEngine?.setBitDepth(settings.crush);

        // Update FX sliders
        const fxDelay = document.getElementById('fxDelay');
        const fxGrain = document.getElementById('fxGrain');
        const fxGlitch = document.getElementById('fxGlitch');
        const fxCrush = document.getElementById('fxCrush');
        if (fxDelay) fxDelay.value = settings.delay;
        if (fxGrain) fxGrain.value = settings.grain;
        if (fxGlitch) fxGlitch.value = settings.glitch;
        if (fxCrush) fxCrush.value = settings.crush;

        // Apply mixer levels
        const mixerChannels = ['Mic', 'Samples', 'Synth', 'Radio'];
        mixerChannels.forEach(ch => {
            const key = ch.toLowerCase();
            const level = settings.mixer[key];
            const fader = document.getElementById(`fader${ch}`);
            if (fader) fader.value = level;
            window.audioEngine?.setChannelLevel(key, level / 100);
        });

        const masterFader = document.getElementById('faderMaster');
        if (masterFader) masterFader.value = settings.mixer.master;
        window.audioEngine?.setMasterLevel(settings.mixer.master / 100);

        // Update knobs to match
        const knobDelay = document.getElementById('knobDelay');
        const knobGrain = document.getElementById('knobGrain');
        if (knobDelay) {
            knobDelay.dataset.value = settings.delay;
            this.updateKnobRotation(knobDelay, settings.delay, 0, 100);
        }
        if (knobGrain) {
            knobGrain.dataset.value = settings.grain;
            this.updateKnobRotation(knobGrain, settings.grain, 0, 100);
        }

        // Update sequencer display
        this.updateOctSteps();

        console.log(`Generated ${vibe} composition: tempo=${settings.tempo}, delay=${settings.delay}, grain=${settings.grain}`);
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
        const miniMapImg = document.getElementById('miniMapImg');
        const miniMapCoords = document.getElementById('miniMapCoords');

        const pos = window.gpsTracker.getPosition();

        if (pos) {
            if (text) {
                text.textContent = pos.formatted;
            }

            // Update mini map (always, regardless of theme)
            if (miniMapImg) {
                const mapUrl = window.gpsTracker.getMapImageUrl(14);
                if (mapUrl) {
                    miniMapImg.style.backgroundImage = `url("${mapUrl}")`;
                }
            }
            if (miniMapCoords) {
                miniMapCoords.textContent = `${pos.latitude.toFixed(3)}, ${pos.longitude.toFixed(3)}`;
            }

            // ONLY update background if theme is explicitly 'map'
            // Don't override other themes!
            if (this.settings.theme === 'map') {
                const mapBg = document.getElementById('mapBackground');
                if (mapBg) {
                    const mapUrl = window.gpsTracker.getMapImageUrl(15);
                    if (mapUrl) {
                        mapBg.style.backgroundImage = `url("${mapUrl}")`;
                        mapBg.classList.add('has-location');
                    }
                }
            }
        } else {
            if (text) {
                const err = window.gpsTracker.getError();
                text.textContent = err || '--';
            }
            if (miniMapCoords) {
                miniMapCoords.textContent = '--';
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
