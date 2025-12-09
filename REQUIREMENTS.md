# Oh My Box - Requirements Document

## Layout Requirements

### Grid Structure
- [x] 4-column layout: Mixer, SEQ/EQ, Controls, Synth/FX
- [x] PADS span full bottom across all columns
- [x] App uses 100% of screen width
- [x] All columns resizable (user can adjust widths)
- [x] Column sizes saved to localStorage

### Column Sizing
- Mixer: 200px fixed (must show all 5 channels: MIC, SMP, SYN, RAD, OUT)
- SEQ/EQ column: flexible
- CTRL column: flexible
- Synth/FX column: flexible
- Equal distribution for columns 2-4

### Background
- [x] Vin Mariani image as page background
- [ ] Brightness/filter adjustable via theme

### Mobile
- [x] Responsive layout for mobile (max-width: 768px)
- [x] Touch support for knobs/faders
- [x] Scrollable content on mobile

---

## Component Requirements

### Mixer
- [x] 5 vertical faders (MIC, SMP, SYN, RAD, OUT)
- [x] Mute buttons for each channel
- [x] All channels fully visible
- [x] VU meters for each channel

### Sequencer
- [x] 8 tracks x 16 steps
- [x] Source selection per track (SMP, SYN, RAD, MIC)
- [x] RND, CLR, EUC buttons
- [x] DUB mode (off/dub/overdub)
- [x] FILL button (hold to activate)
- [x] P-Lock editor (shift+click step)
- [x] Tracks visible in UI

### Equalizer
- [x] 3-band EQ (LO, MID, HI)
- [x] Vertical sliders
- [x] Channel selector (OUT, MIC, SMP, SYN, RAD)
- [x] Per-channel EQ in audio routing

### Pads
- [x] 8 pads in a row
- [x] Trigger samples on press
- [x] Kit selection dropdown
- [ ] Velocity sensitivity

### CTRL Knobs
- [x] FREQ, FILT, DLY, GRN
- [x] Drag to adjust
- [x] Touch support on mobile
- [x] Visual feedback on value (tooltip)

### Location
- [x] GPS coordinates display
- [x] Mini map image
- [ ] Auto-refresh position
- [x] Reverse geocoding (for local radio search)

### AI Gen
- [x] Vibe buttons (Calm, Urban, Nature, Chaos)
- [x] Generate button
- [x] Generates patterns based on vibe
- [x] Sets tempo, FX, mixer levels based on vibe
- [x] Auto-tunes to local radio station

### Radio
- [x] Search input
- [x] Play/Stop buttons
- [x] Station list (search results)
- [x] Local station search via GPS
- [x] Currently playing indicator
- [ ] Favorites

### Synth
- [x] ON/OFF toggle
- [x] Waveform selection (SIN, TRI, SAW, SQR)
- [x] Matrix routing
- [x] ADSR envelope
- [ ] Multiple oscillators

### Scenes
- [x] A/B/C/D buttons
- [x] Crossfader
- [x] Save button
- [x] Scope selector (ALL, mixer, seq, fx)
- [x] Scene recall working
- [x] Scene morphing with crossfader

### FX
- [x] Delay, Grain, Glitch, Crush sliders
- [x] Punch-in FX buttons (STT, REV, FLT, TPE)
- [x] FX presets save/load

### Recordings
- [x] Recording counter
- [x] LIST button
- [x] Recording list with play/download
- [x] Delete recordings
- [x] Rename recordings (double-click)

---

## Admin/Settings Requirements

- [x] Settings modal accessible via gear button
- [x] Sample kit selection
- [x] Synth preset selection
- [x] Theme selection
- [ ] Column width configuration (resizable columns saved here)
- [ ] Export/import settings
- [ ] Recording format selection
- [ ] GPS embed toggle

---

## Technical Requirements

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari/iOS: Works with tap-to-start

### Audio
- Web Audio API
- Click required to initialize (browser restriction)
- Low latency playback

### GPS
- Geolocation API
- HTTPS required for GPS
- Permission prompt on first use

### Storage
- localStorage for settings
- IndexedDB for recordings (future)

---

## Pending Features

1. Multiple oscillators for synth
2. Radio favorites
3. Offline mode / PWA support
4. MIDI controller support
5. Pad velocity sensitivity
