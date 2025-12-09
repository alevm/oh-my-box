# Oh My Box - Changelog

## v1.0.2 (2025-12-09)

### Mobile Fixes
- Removed sticky pads - all content scrolls naturally
- Fixed overflow issues causing panel overlap
- Changed to flexbox layout on mobile for proper stacking
- Increased gap between panels

---

## v1.0.1 (2025-12-09)

### Mobile Support
- Added responsive CSS for mobile devices (max-width: 768px)
- Single column layout on mobile
- Pads sticky at bottom (4x2 grid)
- Horizontal mixer faders on mobile
- Larger touch targets for buttons
- Scrollable content area

---

## v1.0.0 (2025-12-09)

### Layout
- Grid layout with 4 columns: Mixer (200px), SEQ/EQ, CTRL/Location/AI/Radio, Synth/Scenes/FX/REC
- PADS span full bottom row (8 pads in a row)
- App width 75% of screen, centered
- Vin Mariani background image

### Components
- MIXER: 5 channels (MIC, SMP, SYN, RAD, OUT) with faders and mute buttons
- SEQ: 8-track sequencer with RND, CLR, EUC, DUB, FILL controls
- EQ: 3-band equalizer (LO, MID, HI)
- CTRL: 4 knobs (FREQ, FILT, DLY, GRN)
- LOCATION: Map display with GPS coordinates
- AI GEN: Vibe buttons (C, U, N, X) + Generate
- RADIO: Search with station list
- SYNTH: Matrix routing, waveform selection
- SCENES: A/B/C/D with crossfader
- FX: Delay, Grain, Glitch, Crush + punch-in effects (STT, REV, FLT, TPE)
- REC: Recording counter with list

### Admin/Settings
- Sample kit selection
- Synth presets
- Theme selection (Vin Mariani, Location Map, Dark)

### Fixes
- Added missing stationList element for radio
- Added missing recList element for recordings
- Added missing synthPresets element for admin modal
- Fixed mixer overflow issues
- Fixed sequencer track visibility

---

## Pre-1.0 Development (v0.7.x)

Multiple iterations on layout and sizing adjustments during development session.
