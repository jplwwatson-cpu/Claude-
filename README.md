# Aerodyne Flight Simulator

A browser-based, self-contained flight simulator. Everything — terrain, sky,
water, clouds, all 11 aircraft, every city landmark, and the audio — is
generated procedurally in code. There is no backend, no API keys, and no
runtime network calls: once built, it runs entirely offline from a static
file server or `file://`.

**Honest scope note:** this targets the best achievable result for a
self-contained browser app, not literal Microsoft Flight Simulator parity.
Real MSFS-grade photorealism depends on licensed global satellite/
photogrammetry data streamed live from Microsoft's servers, which cannot be
replicated in an offline app — see "Known limitations" below for exactly
where this falls short and why.

## Running it

```bash
npm install
npm run dev       # local dev server, http://localhost:5173
```

```bash
npm run build      # produces a fully static dist/
npm run preview    # serve dist/ locally to double check
```

`dist/` can also be opened straight from disk or served by any static file
host — nothing in it calls out to a server.

## Aircraft

F-35 Lightning II (RCAF) &middot; F/A-18 Hornet (RCAF) &middot; Dassault
Rafale &middot; B-2 Spirit &middot; MiG-29 Fulcrum &middot; F-22 Raptor
&middot; F-14 Tomcat &middot; A-10 Thunderbolt II &middot; F-16 Fighting
Falcon &middot; SR-71 Blackbird &middot; Boeing 747-400

Each has real per-aircraft mass, wing area, thrust, and drag figures driving
a genuine lift/drag/thrust flight model (`src/physics/flightModel.ts`) — not
scripted movement.

## Cities

Montreal, New York, Paris, Dubai, and Tokyo, all placed within one
continuous procedurally-generated, chunked/LOD-streamed terrain, so flying
between them (or just toward the horizon) never hits an edge.

## Controls

| Key | Action |
| --- | --- |
| W / S | Pitch |
| A / D | Roll |
| Q / E | Yaw |
| Shift / Ctrl | Throttle up / down |
| Space | Afterburner (needs throttle > 95%) |
| G | Gear |
| F | Flaps |
| B (hold) | Speedbrake |
| V | VTOL nozzle (F-35 only) |
| N | Wing sweep (F-14 only) |
| C | Cycle camera: chase / cockpit / orbit / flyby |
| Mouse drag / wheel | Orbit camera look / zoom (orbit mode) |
| Esc | Pause |

A connected gamepad/HOTAS is picked up automatically via the browser's
native Gamepad API.

## Known limitations (read before expecting MSFS)

- **Terrain and cities are stylized/procedural, not satellite imagery.**
  Real satellite textures would require a live maps API call, which
  conflicts with the "no server dependency" requirement, so terrain uses
  procedural PBR texturing and landmark shapes instead.
- **Aircraft models are procedurally built**, not imported from licensed
  real-world 3D scans — both to keep the app dependency-free and to avoid
  using someone else's copyrighted aircraft assets without permission.
- **Five aircraft currently use a placeholder silhouette**: F-35, F-14,
  B-2, SR-71, and Boeing 747 fly with their real, distinct physics profiles
  today, but visually still use the generic-fighter body shape pending
  bespoke geometry (a true flying wing for the B-2, a widebody with
  underwing engines for the 747, visible variable-sweep wing pivots for the
  F-14, and a visible STOVL lift nozzle for the F-35). The other six
  (F-18, Rafale, MiG-29, F-22, A-10, F-16) have distinct tuned silhouettes.
- Motion blur is a cheap radial "speed blur" shader, not a true per-pixel
  velocity buffer — chosen to keep frame rate high.

## Architecture

```
src/
  physics/    flight model, rigid body integration, per-aircraft configs
  aircraft/   procedural jet builders + shared geometry/material/livery kit
  world/      terrain, sky, water, clouds, environment probe, cities
  engine/     renderer, scene, render loop, input, post-processing
  camera/     chase/cockpit/orbit/flyby camera rig
  audio/      procedurally synthesized engine/wind/sonic-boom audio
  effects/    contrails, transonic vapor cone
  ui/         HUD and main menu
```
