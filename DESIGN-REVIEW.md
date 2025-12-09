# Oh My Box - Design Review & Roadmap

## Current State Assessment

Oh My Box is a web-based music creation tool with:
- 4-column layout (Mixer, SEQ/EQ, CTRL/Location/AI/Radio, Synth/Scenes/FX/REC)
- 8-track sequencer with P-locks
- Scene system with crossfader morphing
- AI-assisted pattern generation with GPS awareness
- Radio streaming integration
- Punch-in FX

**Unique Strengths:**
- GPS/Location-aware music generation
- Radio integration (local station discovery)
- AI vibe-based composition
- Web-based = accessible anywhere

---

## Usability Issues (Priority Fixes)

### Critical
1. **Too many panels visible at once** - cognitive overload
2. **No clear workflow** - user doesn't know where to start
3. **Sequencer tracks too small** - hard to see/edit patterns
4. **No visual feedback when sounds play** - pads/steps don't flash
5. **Transport controls lost in header** - Play/Stop not prominent

### Important
6. **Knobs too small on desktop** - hard to grab
7. **No keyboard shortcuts visible** - hidden functionality
8. **No undo/redo** - destructive edits
9. **Pattern length fixed at 16** - limits creativity
10. **No sample preview** - can't hear before loading

### Nice to Have
11. **No dark mode** - eye strain at night
12. **No tempo tap** - have to guess BPM
13. **No metronome** - hard to play in time
14. **No copy/paste patterns** - tedious workflow

---

## Hardware Inspiration Analysis

### Elektron Octatrack

**What makes it special:**
- Parameter locks on EVERY step (not just a few params)
- Conditional trigs (1:2, 2:4, A:B, PRE, etc.)
- Pickup machines (live looping with tempo sync)
- Slices (auto-chop samples into 16/32/64 pieces)
- Scenes + Crossfader = performance machine
- Parts (4 variations per pattern)
- Arranger mode for full songs

**Adopt for Oh My Box:**
- [ ] **Conditional triggers** - 1:2, 2:4, random %, A:B fills
- [ ] **Slice mode** - auto-slice loaded samples
- [ ] **Pickup machine** - loop pedal style recording
- [ ] **Parts** - 4 variations per pattern (A/B/C/D)
- [ ] **Better P-locks** - lock ANY parameter per step

### Teenage Engineering OP-Z

**What makes it special:**
- Extreme minimalism - one encoder does many things
- Step components - micro-timing, direction, jumps
- Punch-in effects with one-finger hold
- Tape track for arrangement
- Performance mode (mutes as buttons)
- Modular connections (lights, video)

**Adopt for Oh My Box:**
- [ ] **Step components** - per-step timing offset, swing
- [ ] **Tape track** - visual arrangement timeline
- [ ] **Performance mode** - big mute buttons, instant access
- [ ] **Minimal mode** - hide everything but essentials
- [ ] **Motion sequencing** - record knob movements

### Bastl Microgranny

**What makes it special:**
- Granular synthesis focused
- Lo-fi aesthetic is the feature
- Immediate - load sample, play, mangle
- Physical randomization
- Brutal crusher/filter

**Adopt for Oh My Box:**
- [ ] **Granular focus** - make grain engine primary
- [ ] **Randomize everything** - one button chaos
- [ ] **Lo-fi mode** - force 8-bit, mono, low sample rate
- [ ] **Start/End points** - visual waveform with draggable markers
- [ ] **Hold mode** - sustain sample while held

### Roland SP-404

**What makes it special:**
- Pads are EVERYTHING - big, responsive, immediate
- Effects are immediate - hold pad = effect active
- Pattern sequencer is secondary
- Resampling workflow
- DJ-friendly (vinyl sim, isolator)

**Adopt for Oh My Box:**
- [ ] **Bigger pads** - make them the star
- [ ] **Resample button** - capture output as new sample
- [ ] **Pad FX** - each pad can have assigned effect
- [ ] **Bank system** - A/B/C/D banks x 8 pads = 32 sounds
- [ ] **DJ isolator** - quick kill low/mid/hi

---

## Proposed Design Modes

### Mode 1: PLAY (Default - SP-404 inspired)
```
┌─────────────────────────────────────────────┐
│ [▶] [■] [●]   120 BPM   [TAP]   [FX] [SET] │
├─────────────────────────────────────────────┤
│                                             │
│   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐   │
│   │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │ │ 7 │ │ 8 │   │
│   └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘   │
│   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐   │
│   │ 9 │ │10 │ │11 │ │12 │ │13 │ │14 │ │15 │ │16 │   │
│   └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ └───┘   │
│                                             │
│  [DLY] [REV] [FLT] [GRN] [GLI] [CRU] [ISO] [VIN]   │
│                                             │
│      A ═══════════════════════ B    [REC]  │
└─────────────────────────────────────────────┘
```
- 16 big pads (4x4 or 2x8)
- Hold FX buttons for temporary effect
- Crossfader between scenes
- Minimal controls visible

### Mode 2: SEQ (Octatrack inspired)
```
┌─────────────────────────────────────────────┐
│ T1 [●○○○│●○○○│●○○○│●○○○] SMP ▶ FLT ▶ DLY  │
│ T2 [○○●○│○○●○│○○●○│○○●○] SYN              │
│ T3 [○○○●│○○○●│○○○●│○○○●] RAD              │
│ T4 [●●○○│●●○○│●●○○│●●○○] MIC              │
│ T5 [○●○●│○●○●│○●○●│○●○●] SMP              │
│ T6 [○○○○│○○○○│○○○○│●○○○] SYN              │
│ T7 [○○○○│○○○○│○○○○│○○○○] -               │
│ T8 [○○○○│○○○○│○○○○│○○○○] -               │
├─────────────────────────────────────────────┤
│ STEP 5  │ NOTE: C3  VEL: 100  LEN: 1/16    │
│ P-LOCK  │ FILT: 2000  DLY: 30%  PAN: L15   │
│ TRIG    │ [1:1] [1:2] [2:2] [RND] [FIL]    │
└─────────────────────────────────────────────┘
```
- Full sequencer view
- P-lock parameter display
- Conditional trig selection
- Track routing visible

### Mode 3: MIX (Live performance)
```
┌─────────────────────────────────────────────┐
│  MIC    SMP    SYN    RAD    OUT           │
│  ┃┃     ┃┃     ┃┃     ┃┃     ┃┃            │
│  ██     ██     ██     ██     ██  ← VU      │
│  ██     ██     ▓▓     ▓▓     ██            │
│  ▓▓     ▓▓     ░░     ░░     ▓▓            │
│  ░░     ░░     ░░     ░░     ░░            │
│  [M]    [M]    [M]    [M]                  │
├─────────────────────────────────────────────┤
│  LO ════════════════════════════ HI        │
│  EQ: [▼▼▼] [───] [▲▲▲]                     │
├─────────────────────────────────────────────┤
│  A ═══════════○═══════════════ B   SCENE   │
└─────────────────────────────────────────────┘
```
- Big faders
- Big VU meters
- DJ-style EQ
- Scene crossfader prominent

### Mode 4: GEN (AI/Location - unique to Oh My Box)
```
┌─────────────────────────────────────────────┐
│  📍 Milan, Italy    🕐 23:45    🌡 12°C    │
├─────────────────────────────────────────────┤
│                                             │
│     [  CALM  ]  [  URBAN  ]                │
│     [ NATURE ]  [  CHAOS  ]                │
│                                             │
│  ────────────●────────────  DENSITY        │
│  ────────────────●────────  COMPLEXITY     │
│                                             │
│         [ ★ GENERATE ★ ]                   │
│                                             │
├─────────────────────────────────────────────┤
│  📻 Radio Milano 101.5 FM  [▶]             │
│     Jazz, Electronic, Ambient              │
└─────────────────────────────────────────────┘
```
- Location prominent
- Big vibe buttons
- Generation front and center
- Radio integration visible

---

## Implementation Priority

### Phase 1: Core UX (v1.2) ✓ COMPLETED
1. ~~Add mode switching (PLAY/SEQ/MIX/GEN)~~ → Deferred to v1.3
2. ✓ Make pads flash on trigger
3. ✓ Add keyboard shortcuts display ([?] button)
4. ✓ Add tempo tap button
5. ✓ Transport controls bigger/more visible
6. ✓ Full keyboard shortcuts (1-8, SPACE, R, D, F, Q/W/E/T, G, arrows)

### Phase 2: Sequencer Power (v1.3)
1. Conditional triggers (1:2, 2:4, %, fill)
2. Variable pattern length (1-64 steps)
3. Copy/paste patterns
4. Undo/redo for pattern edits

### Phase 3: Performance (v1.4)
1. Performance mode with big mute buttons
2. Hold-for-effect on pads
3. Resample to new pad
4. Motion recording (record knob movements)

### Phase 4: Polish (v2.0)
1. Dark mode theme
2. Slice mode for samples
3. Waveform display with markers
4. PWA offline support

---

## Questions for User

1. Which mode should be default? (PLAY, SEQ, MIX, or GEN)
2. Priority: More sequencer features or better live performance?
3. Should GPS/AI be a core differentiator or optional feature?
4. Target: Musicians or general creative exploration?
