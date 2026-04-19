# RuralHealth PWA

Minimal progressive web app + Node server to connect patients in rural areas with nearby healthcare providers in real time.

## Features
- Real-time matching of patients to providers within 50 km
- Interactive map showing locations (using Leaflet)
- Chat functionality for matched pairs
- Manual location input option (in addition to geolocation)
- PWA: installable, offline-capable

Quick start:

1. Install deps
```bash
npm install
```

2. Run
```bash
npm start
```

3. Open http://localhost:3000 in two devices/windows:
- On the first device, click "I'm a Provider" and enter your location
- On the second device, click "I'm a Patient" and enter your location. The app finds nearest provider within 50 km and opens a chat room.

Notes:
- This scaffold is for demo / prototype only. For production, add authentication, secure transport (HTTPS), rate limits, privacy checks, persistent storage, and verification of providers.
- To make it a full PWA: add proper icons in `public/icons/`, tune `manifest.json`, and serve over HTTPS.