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

        // Setup GPS display
        window.gpsTracker.addListener(() => this.updateGPSDisplay());
        this.updateGPSDisplay();

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

    // Tab Navigation
    setupTabs() {
        const tabs = document.querySelectorAll('.tab');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.tab;

                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                tab.classList.add('active');
                document.getElementById(`tab-${target}`).classList.add('active');
            });
        });
    }

    // Mode Toggle (Orchestrate/Perform)
    setupModeToggle() {
        const modeBtns = document.querySelectorAll('.mode-btn');
        const perfView = document.getElementById('performView');

        modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.mode = btn.dataset.mode;

                // Toggle PERF view
                if (this.mode === 'perform') {
                    perfView.classList.remove('hidden');
                    document.body.classList.add('perf-mode');
                    this.syncPerfView();
                } else {
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
        // Scene buttons (recall only)
        document.querySelectorAll('.perf-scene-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.scene);
                if (window.sceneManager.hasScene(idx)) {
                    window.sceneManager.recallScene(idx);
                    document.querySelectorAll('.perf-scene-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    document.getElementById('perfScene').textContent = ['A', 'B', 'C', 'D'][idx];
                }
            });
        });

        // Mixer faders
        ['Mic', 'Samples', 'Synth', 'Radio'].forEach(ch => {
            const fader = document.getElementById(`perfFader${ch}`);
            if (fader) {
                fader.addEventListener('input', () => {
                    const level = fader.value / 100;
                    window.audioEngine.setChannelLevel(ch.toLowerCase(), level);
                    // Sync with main fader
                    document.getElementById(`fader${ch}`).value = fader.value;
                });
            }
        });

        // Pads
        document.querySelectorAll('.perf-pad').forEach(pad => {
            pad.addEventListener('click', () => {
                const idx = parseInt(pad.dataset.pad);
                if (window.sampler) {
                    window.sampler.trigger(idx);
                }
            });
        });

        // FX controls
        document.getElementById('perfDelayMix').addEventListener('input', (e) => {
            window.mangleEngine.setDelayMix(parseInt(e.target.value));
        });

        document.getElementById('perfGlitch').addEventListener('input', (e) => {
            window.mangleEngine.setGlitch(parseInt(e.target.value), 100, 'stutter');
        });

        document.getElementById('perfCrush').addEventListener('input', (e) => {
            window.mangleEngine.setBitDepth(parseInt(e.target.value));
        });

        // Synth toggle
        const synthToggle = document.getElementById('perfSynthToggle');
        synthToggle.addEventListener('click', () => {
            const playing = window.synth.toggle();
            synthToggle.classList.toggle('active', playing);
        });

        document.getElementById('perfSynthFreq').addEventListener('input', (e) => {
            window.synth.setFrequency(parseInt(e.target.value));
        });
    }

    // Sync PERF view with current state
    syncPerfView() {
        // Sync faders
        ['Mic', 'Samples', 'Synth', 'Radio'].forEach(ch => {
            const mainFader = document.getElementById(`fader${ch}`);
            const perfFader = document.getElementById(`perfFader${ch}`);
            if (mainFader && perfFader) {
                perfFader.value = mainFader.value;
            }
        });

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
        document.getElementById('perfScene').textContent = ['A', 'B', 'C', 'D'][currentScene];

        // Sync tempo
        document.getElementById('perfTempo').textContent = `${window.sequencer.getTempo()} BPM`;
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

            // Stop synth and radio
            window.synth.stop();
            window.radioPlayer.stop();
            window.sampler.stopAll();

            // Update UI
            document.getElementById('synthToggle').classList.remove('active');
            document.getElementById('synthToggle').textContent = 'START SYNTH';
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
        const sceneBtns = document.querySelectorAll('.scene-btn');
        const saveBtns = document.querySelectorAll('.scene-save-slot');

        // Recall buttons
        sceneBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sceneIndex = parseInt(btn.dataset.scene);

                // If shift/long-press: morph, else: instant recall
                if (window.sceneManager.hasScene(sceneIndex)) {
                    window.sceneManager.recallScene(sceneIndex);
                }

                sceneBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Independent save slots (A, B, C, D)
        saveBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent any parent handlers
                const sceneIndex = parseInt(btn.dataset.scene);
                console.log('Save button clicked, index:', sceneIndex);
                window.sceneManager.saveScene(sceneIndex);

                // Visual feedback
                btn.classList.add('saved');
                setTimeout(() => btn.classList.remove('saved'), 500);

                // Mark scene buttons that have data
                document.querySelectorAll('.scene-btn').forEach(sceneBtn => {
                    const idx = parseInt(sceneBtn.dataset.scene);
                    sceneBtn.classList.toggle('has-data', window.sceneManager.hasScene(idx));
                });
            });
        });
    }

    // Arrangement
    setupArrangement() {
        const playBtn = document.getElementById('arrPlay');
        const stopBtn = document.getElementById('arrStop');
        const clearBtn = document.getElementById('arrClear');
        const barsInput = document.getElementById('arrBars');
        const addBtns = document.querySelectorAll('.arr-add-btn');

        playBtn.addEventListener('click', () => {
            if (window.arrangement.playing) {
                window.arrangement.stop();
                playBtn.classList.remove('active');
                playBtn.textContent = 'Play';
            } else {
                window.arrangement.play();
                playBtn.classList.add('active');
                playBtn.textContent = 'Playing';
            }
        });

        stopBtn.addEventListener('click', () => {
            window.arrangement.stop();
            window.sequencer.stop();
            playBtn.classList.remove('active');
            playBtn.textContent = 'Play';
            document.getElementById('btnPlay').classList.remove('active');
        });

        clearBtn.addEventListener('click', () => {
            window.arrangement.clear();
        });

        addBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sceneIndex = parseInt(btn.dataset.scene);
                const bars = parseInt(barsInput.value) || 4;

                // Check if scene has data
                if (!window.sceneManager.hasScene(sceneIndex)) {
                    console.log(`Scene ${['A', 'B', 'C', 'D'][sceneIndex]} is empty - save it first`);
                    return;
                }

                window.arrangement.addBlock(sceneIndex, bars);
            });
        });

        // Initial UI update
        window.arrangement.updateUI();
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
        const waveform = document.getElementById('synthWaveform');
        const freq = document.getElementById('synthFreq');

        toggle.addEventListener('click', () => {
            const playing = window.synth.toggle();
            toggle.classList.toggle('active', playing);
            toggle.textContent = playing ? 'STOP SYNTH' : 'START SYNTH';
        });

        waveform.addEventListener('change', (e) => {
            window.synth.setWaveform(e.target.value);
        });

        freq.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            window.synth.setFrequency(value);
            document.getElementById('freqDisplay').textContent = Math.round(value);
        });
    }

    // FX
    setupFX() {
        // Bit Crusher
        const crushBits = document.getElementById('crushBits');
        const crushRate = document.getElementById('crushRate');
        const crushToggle = document.getElementById('crushToggle');

        crushBits.addEventListener('input', () => {
            document.getElementById('crushBitsDisplay').textContent = crushBits.value;
            window.mangleEngine.setCrusher(parseInt(crushBits.value), parseInt(crushRate.value));
        });

        crushRate.addEventListener('input', () => {
            document.getElementById('crushRateDisplay').textContent = crushRate.value;
            window.mangleEngine.setCrusher(parseInt(crushBits.value), parseInt(crushRate.value));
        });

        crushToggle.addEventListener('click', () => {
            const enabled = !crushToggle.classList.contains('active');
            crushToggle.classList.toggle('active', enabled);
            crushToggle.textContent = enabled ? 'ON' : 'OFF';
            window.mangleEngine.toggleCrusher(enabled);
        });

        // Glitch
        const glitchProb = document.getElementById('glitchProb');
        const glitchSize = document.getElementById('glitchSize');
        const glitchModes = document.querySelectorAll('.glitch-mode');

        glitchProb.addEventListener('input', () => {
            document.getElementById('glitchProbDisplay').textContent = glitchProb.value;
            window.mangleEngine.setGlitch(
                parseInt(glitchProb.value),
                parseInt(glitchSize.value),
                document.querySelector('.glitch-mode.active')?.dataset.mode || 'stutter'
            );
        });

        glitchSize.addEventListener('input', () => {
            document.getElementById('glitchSizeDisplay').textContent = glitchSize.value;
        });

        glitchModes.forEach(btn => {
            btn.addEventListener('click', () => {
                glitchModes.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                window.mangleEngine.setGlitch(
                    parseInt(glitchProb.value),
                    parseInt(glitchSize.value),
                    btn.dataset.mode
                );
            });
        });

        // Grain
        const grainDensity = document.getElementById('grainDensity');
        const grainSize = document.getElementById('grainSize');
        const grainPitch = document.getElementById('grainPitch');
        const grainFreeze = document.getElementById('grainFreeze');

        grainDensity.addEventListener('input', () => {
            document.getElementById('grainDensityDisplay').textContent = grainDensity.value;
            window.mangleEngine.setGrain(
                parseInt(grainDensity.value),
                parseInt(grainSize.value),
                parseInt(grainPitch.value)
            );
        });

        grainSize.addEventListener('input', () => {
            document.getElementById('grainSizeDisplay').textContent = grainSize.value;
        });

        grainPitch.addEventListener('input', () => {
            document.getElementById('grainPitchDisplay').textContent = grainPitch.value;
        });

        grainFreeze.addEventListener('click', () => {
            const frozen = !grainFreeze.classList.contains('active');
            grainFreeze.classList.toggle('active', frozen);
            grainFreeze.textContent = frozen ? 'UNFREEZE' : 'FREEZE';
            window.mangleEngine.toggleGrainFreeze(frozen);
        });

        // Delay
        const delayTime = document.getElementById('delayTime');
        const delayFeedback = document.getElementById('delayFeedback');
        const delayMix = document.getElementById('delayMix');

        delayTime.addEventListener('input', () => {
            document.getElementById('delayTimeDisplay').textContent = delayTime.value;
            window.mangleEngine.setDelayTime(parseInt(delayTime.value));
        });

        delayFeedback.addEventListener('input', () => {
            document.getElementById('delayFeedbackDisplay').textContent = delayFeedback.value;
            window.mangleEngine.setDelayFeedback(parseInt(delayFeedback.value));
        });

        delayMix.addEventListener('input', () => {
            document.getElementById('delayMixDisplay').textContent = delayMix.value;
            window.mangleEngine.setDelayMix(parseInt(delayMix.value));
        });
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

        densitySlider.addEventListener('input', () => {
            document.getElementById('aiDensityDisplay').textContent = densitySlider.value;
        });

        complexitySlider.addEventListener('input', () => {
            document.getElementById('aiComplexityDisplay').textContent = complexitySlider.value;
        });

        generateBtn.addEventListener('click', () => {
            const vibe = document.querySelector('.vibe-btn.active')?.dataset.vibe || 'calm';
            const density = parseInt(densitySlider.value);
            const complexity = parseInt(complexitySlider.value);

            const suggestions = window.aiComposer.generateRhythm(vibe, density, complexity);
            this.updateSeqGrid();
            this.updateSeqOverview();
            this.displaySuggestions(suggestions);
        });

        surpriseBtn.addEventListener('click', () => {
            const result = window.aiComposer.surprise();
            this.updateSeqGrid();
            this.updateSeqOverview();
            this.displaySuggestions(result.suggestions);
        });

        // Build Full Arrangement button
        const arrangementBtn = document.getElementById('aiArrangement');
        arrangementBtn.addEventListener('click', () => {
            const result = window.aiComposer.generateArrangement(4, 4);
            this.updateSeqGrid();
            this.updateSeqOverview();

            // Show arrangement suggestions
            const suggestions = window.aiComposer.getArrangementSuggestions();
            this.displaySuggestions(suggestions);

            // Switch to Mix tab to show arrangement
            document.querySelector('[data-tab="mixer"]')?.click();

            console.log('Generated arrangement:', result);
        });
    }

    displaySuggestions(suggestions) {
        const list = document.getElementById('suggestionList');
        if (!suggestions || suggestions.length === 0) {
            list.innerHTML = '<p class="placeholder">No suggestions</p>';
            return;
        }

        list.innerHTML = suggestions.map((s, i) => `
            <div class="suggestion-item" data-index="${i}">
                <div class="suggestion-type">${s.type}</div>
                <div class="suggestion-text">${s.text}</div>
            </div>
        `).join('');

        // Add click handlers
        list.querySelectorAll('.suggestion-item').forEach((el, i) => {
            el.addEventListener('click', () => {
                if (suggestions[i].action) {
                    suggestions[i].action();
                    this.updateSeqGrid();
                    this.updateSeqOverview();
                }
            });
        });
    }

    // Radio
    setupRadio() {
        const searchBtn = document.getElementById('radioSearchBtn');
        const searchInput = document.getElementById('radioSearch');
        const countrySelect = document.getElementById('radioCountry');
        const genreSelect = document.getElementById('radioGenre');
        const stationList = document.getElementById('stationList');
        const stopBtn = document.getElementById('radioStop');

        const doSearch = async () => {
            const query = searchInput.value;
            const country = countrySelect.value;
            const genre = genreSelect.value;

            stationList.innerHTML = '<p class="placeholder">Searching...</p>';

            const stations = await window.radioPlayer.searchStations(query, country, genre);

            if (stations.length === 0) {
                stationList.innerHTML = '<p class="placeholder">No stations found</p>';
                return;
            }

            stationList.innerHTML = stations.map(s => `
                <div class="station-item" data-url="${s.url}" data-name="${s.name}">
                    <div>
                        <div class="station-name">${s.name}</div>
                        <div class="station-genre">${s.genre} • ${s.country || 'Unknown'}</div>
                    </div>
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
                        stopBtn.disabled = false;
                    }
                });
            });
        };

        searchBtn.addEventListener('click', doSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doSearch();
        });
        countrySelect.addEventListener('change', doSearch);
        genreSelect.addEventListener('change', doSearch);

        stopBtn.addEventListener('click', () => {
            window.radioPlayer.stop();
            document.getElementById('currentStation').textContent = 'None';
            stopBtn.disabled = true;
            stationList.querySelectorAll('.station-item').forEach(i => i.classList.remove('playing'));
        });
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
