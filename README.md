# Oh My Box - Web Prototype

A browser-based proof-of-concept for the Oh My Box portable music instrument.

## Features

- **Microphone Input** - Capture ambient audio
- **Sample Player** - 8 touch pads with synthesized percussion
- **Synthesizer** - Oscillator + noise generator with filter
- **Internet Radio** - Stream from thousands of stations worldwide
- **4-Channel Mixer** - Volume and mute for each input
- **GPS Tracking** - Automatic location embedding in recordings
- **Session Recording** - Export audio with metadata

## Quick Start (Local)

```bash
cd oh-my-box-web

# Python 3
python -m http.server 8080

# Node.js
npx serve .

# PHP
php -S localhost:8080
```

Then open http://localhost:8080

**Note:** GPS requires HTTPS. For local testing, audio features work but GPS will show an error.

## Deploy to GitHub Pages

1. Create a GitHub repository
2. Push this folder to the `main` branch
3. Go to Settings → Pages → Source: `main` branch
4. Your app will be at `https://yourusername.github.io/repo-name`

## Deploy to Netlify (Drag & Drop)

1. Go to https://app.netlify.com/drop
2. Drag the `oh-my-box-web` folder
3. Get your HTTPS URL instantly

## Usage

1. **Tap "TAP TO START"** - Grants microphone & GPS permissions
2. **Mixer tab** - Adjust levels for each input source
3. **Pads tab** - Tap pads to trigger samples
4. **Synth tab** - Configure and start the synthesizer
5. **Radio tab** - Search and stream internet radio
6. **Files tab** - View and download recordings
7. **REC button** - Record the full mix with GPS metadata

## File Structure

```
oh-my-box-web/
├── index.html          # Main HTML
├── css/
│   └── style.css       # Mobile-first styling
├── js/
│   ├── app.js          # Main controller
│   ├── audio-engine.js # Core audio routing
│   ├── gps.js          # Location tracking
│   ├── mic-input.js    # Microphone capture
│   ├── sampler.js      # 8-pad sample player
│   ├── synth.js        # Oscillator + noise
│   ├── radio.js        # Internet radio
│   └── recorder.js     # Session recording
└── samples/            # (Optional) Custom samples
```

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari/iOS: Works (tap to start audio required)

## Export Format

Recordings are saved as WebM/Opus with a JSON metadata sidecar:

```json
{
  "name": "ohmybox_2025-01-15_14-30-00",
  "timestamp": "2025-01-15T14:30:00.000Z",
  "duration_ms": 45000,
  "gps": {
    "latitude": 40.4168,
    "longitude": -3.7038,
    "accuracy": 5,
    "formatted": "40.41680°N, 3.70380°W"
  },
  "app": "Oh My Box Web",
  "version": "1.0.0"
}
```

## License

Open source - part of the Oh My Box project.
