# Mini Data Center Digital Twin

A readable, browser-only educational simulation: three servers, two-second sensors, an independent digital twin, a 30-second temperature forecast, and an interactive 3D room.

- **Private GitHub repository:** https://github.com/Mrun9/mini-datacenter-digital-twin
- **Private ChatGPT Site:** https://mini-datacenter-digital-twin.muur3.chatgpt.site
- **Learning walkthrough:** [LEARNING_GUIDE.md](LEARNING_GUIDE.md)

## Run locally

Node.js 22.12+ recommended (also compatible with supported newer Node versions).

```sh
cd "/Volumes/Projects/Data Center twin"
npm ci
npm run dev
```

Open the URL printed by Vite (normally http://127.0.0.1:5173).

```sh
npm test
npm run build
npm run preview
```

## Architecture

Plain JavaScript modules model the physical world, sensor packets, twin estimates, and predictions. React displays controls and readings. Recharts draws physical and estimated temperature history. React Three Fiber renders simple Three.js geometry; the 3D module loads only when its tab is opened.

```text
Controls → PhysicalSimulator → Sensor → DigitalTwin → Predictor
                ↓                           ↓
          3D physical view            Estimated readings
                └───────── Dashboard / graph ┘
```

No backend, database, application authentication, cloud data services, or ML training. Vite produces static `dist/` output for ChatGPT Sites; Sites provides owner-only access. All simulation data stays in memory and resets on reload. No external textures or models are needed. A browser without WebGL can still use the dashboard and server controls.

## Learning objectives

Understand the difference between reality, measurements, and estimates; inspect the complete synchronization loop; explore delayed or missing information; and change a thermal or acoustic equation to observe its effect. The guide documents all important source files and provides three experiments.

## Model limits

Temperatures and dBA values are illustrative, not physically validated. Three fixed racks each contain 1–6 units sharing one temperature and one fan. There is no airflow coupling, thermal throttling, hardware shutdown, uncertainty interval, or sound playback. Forecasts assume unchanged last-observed inputs. Simulation time slows when a browser throttles background timers.

## Version control and deployment

The repository must remain **private** unless its owner explicitly approves a visibility change. Six milestone commits cover setup, physics, sensors/twin, dashboard, 3D, and final integration/documentation. Tests and a production build are required before a milestone commit.

`.openai/hosting.json` identifies the Site and its static output folder. Use the Sites workflow to synchronize committed source, package the matching build, and deploy privately. Never commit credentials, `.env`, `node_modules`, or `dist`. Site source synchronization may use a second Git remote; GitHub remains the user's private source repository.
