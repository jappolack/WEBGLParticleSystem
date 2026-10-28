# WebGL Particle System

A browser-based Three.js particle-effects demo with interactive scenes for fire, water, weather, explosions, grass, and magic.

## Run

Serve the project directory over HTTP (ES modules do not load reliably from `file://` URLs):

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000/particle.html](http://localhost:8000/particle.html). The page loads Three.js from unpkg, so an internet connection is required. Use a WebGL-capable browser.

## Controls

- **Effect Type** selects a scene.
- **Particle Count** adjusts the effect's particle density.
- **Orbit** by dragging the scene; scroll to zoom.
- **Magic / Sci-Fi**: move the mouse to guide the wand and attract particles; click the scene to cast a burst.

## Effects

- **Fire & Smoke**: a house chimney emits animated flame and smoke.
- **Water & Liquids**: animated particles move inside a shallow pool.
- **Weather**: rain streaks fall and create expanding puddle ripples on impact.
- **Explosions & Sparks**: a cannon launches a ball with a smoke trail and particle burst on impact.
- **Grass / Fur / Hair**: swaying grass surrounds a wandering, particle-furred sheep.
- **Magic / Sci-Fi**: a mouse-following wand attracts orbiting particles and casts click-triggered bursts.