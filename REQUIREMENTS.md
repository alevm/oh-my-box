# Oh My Box - Requirements Document

## Layout Requirements

### Grid Structure
- [ ] 4-column layout: Mixer, SEQ/EQ, Controls, Synth/FX
- [ ] PADS span full bottom across all columns
- [ ] App uses 75% of screen width, centered
- [ ] All columns resizable (user can adjust widths)
- [ ] Column sizes saved to localStorage

### Column Sizing
- Mixer: 200px fixed (must show all 5 channels: MIC, SMP, SYN, RAD, OUT)
- SEQ/EQ column: flexible
- CTRL column: flexible
- Synth/FX column: flexible
- Equal distribution for columns 2-4

### Background
- Vin Mariani image as page background
- Brightness/filter adjustable via theme

---

## Component Requirements

### Mixer
- [x] 5 vertical faders (MIC, SMP, SYN, RAD, OUT)
- [x] Mute buttons for each channel
- [x] All channels fully visible
- [ ] VU meters for each channel

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
- [ ] EQ affects master output

### Pads
- [x] 8 pads in a row
- [x] Trigger samples on press
- [x] Kit selection dropdown
- [ ] Velocity sensitivity

### CTRL Knobs
- [x] FREQ, FILT, DLY, GRN
- [x] Drag to adjust
- [ ] Visual feedback on value

### Location
- [x] GPS coordinates display
- [x] Mini map image
- [ ] Auto-refresh position
- [ ] Reverse geocoding (city name)

### AI Gen
- [x] Vibe buttons (Calm, Urban, Nature, Chaos)
- [x] Generate button
- [ ] Actually generate patterns based on vibe

### Radio
- [x] Search input
- [x] Play/Stop buttons
- [x] Station list (search results)
- [ ] Currently playing indicator
- [ ] Favorites

### Synth
- [x] ON/OFF toggle
- [x] Waveform selection (SIN, TRI, SAW, SQR)
- [x] Matrix routing
- [ ] ADSR envelope
- [ ] Multiple oscillators

### Scenes
- [x] A/B/C/D buttons
- [x] Crossfader
- [x] Save button
- [x] Scope selector (ALL, mixer, fx)
- [ ] Scene morphing with crossfader

### FX
- [x] Delay, Grain, Glitch, Crush sliders
- [x] Punch-in FX buttons (STT, REV, FLT, TPE)
- [ ] FX presets save/load

### Recordings
- [x] Recording counter
- [x] LIST button
- [x] Recording list with play/download
- [ ] Delete recordings
- [ ] Rename recordings

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

1. Resizable columns with save to admin
2. VU meters
3. Full EQ integration with audio engine
4. Better synth with ADSR
5. Scene morphing
6. FX presets
7. Recording management (delete, rename)
8. Offline mode
9. PWA support
10. MIDI support
