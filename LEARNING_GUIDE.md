# Learning the Mini Data Center Digital Twin

This is a deliberately small educational model, not a calibrated data center engineering tool. Temperatures, acoustic levels, and forecasts are illustrative. No measurements come from real hardware.

## Architecture: four different kinds of state

Think of each JavaScript class as a Python class with a constructor (`__init__`), methods, and ordinary records (`dict`-like objects).

```text
React controls → PhysicalSimulator → Sensor (every 2 simulation seconds)
                       │                     │
                       │                     ▼
                       │                DigitalTwin → Predictor (+30 seconds)
                       ▼                     │
                 3D physical view       Dashboard estimates
                       └────── both states appear on the graph ──────┘
```

- **PhysicalSimulator** is the pretend real world. It knows actual commands and temperature.
- **Sensor** packages copies of physical data at a limited rate, with temperature rounded to 0.1 °C.
- **DigitalTwin** owns separate records. Between packets, it estimates temperature using its last observed controls. It cannot directly read the physical simulator.
- **Predictor** asks what the twin's temperature would be in 30 seconds with unchanged observed controls.
- **React** displays values and sends commands. It contains no thermal equations.
- **React Three Fiber** draws the physical simulator, not the twin. This choice makes a hidden fan fault visible even while the twin is disconnected. Labels explicitly say “physical system.”

Three fixed racks represent three logical servers. Each rack holds 1–6 identical server units at one shared lumped temperature and uses one shared cooling fan. Adding a unit increases power and heat capacity, but not cooling conductance. Removing a unit preserves the remaining rack temperature. The last unit cannot be removed, keeping all three servers available.

## 1. What happens when I move the CPU utilization slider?

`ServerControls.jsx` converts the range input's string into a number and calls `command(id, { cpuPercent })`. `App.jsx` forwards it to `PhysicalSimulator.command()` and requests a React redraw.

Power updates immediately. Temperature changes on subsequent simulation ticks, because temperature represents stored heat rather than instantaneous load. The twin continues using the old load until it receives a sensor packet. This prototype intentionally has no separate command channel into the twin.

## 2. How is server temperature calculated?

All parameters and equations live in `src/simulation/physics.js`.

Let `u = CPU percent / 100`, `f = fan percent / 100` when enabled (otherwise zero), and `n = number of units`.

| Quantity            | Equation                                  | Meaning                                                          |
| ------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| Ambient temperature | `Ta = 22 °C`                              | Constant room temperature                                        |
| Rack power          | `P = n × (60 + 180u) W`                   | 60 W idle, 240 W full load per unit                              |
| Heat capacity       | `C = 120n J/°C`                           | Small illustrative thermal mass makes changes observable quickly |
| Cooling conductance | `k = 1 + 7f W/°C`                         | Passive cooling remains when the fan stops                       |
| Temperature rate    | `dT/dt = (P − k(T − Ta)) / C`             | Heat generated minus heat removed                                |
| Equilibrium         | `Teq = Ta + P/k`                          | Temperature where incoming and outgoing heat balance             |
| Update over Δt      | `Tnew = Teq + (Told − Teq) × exp(−kΔt/C)` | Exact solution for constant controls during a tick               |

We use the exponential solution rather than Euler integration to avoid numerical instability at large time steps. The physical state and twin both advance by 0.25 simulation seconds per timer callback. If a background browser throttles timers, simulation time runs slower; it does not silently skip sensor events.

At 100% CPU and fan speed, a single unit tends toward `22 + 240/8 = 52 °C`. With the fan disabled it tends toward `262 °C` in this intentionally simplified model. Real equipment would throttle or shut down; this prototype does neither. Do not interpret extreme values as realistic operating temperatures.

Status colors: normal below 55 °C, warm from 55 to below 75 °C, overheating from 75 °C. These are educational thresholds.

### Acoustic model

For each enabled fan with nonzero speed, `Li = 20 + 30f dBA`. A stopped fan is excluded. A 25 dBA background is always included:

```text
Ltotal = 10 log10(10^(25/10) + Σ 10^(Li/10))
```

Decibels are logarithmic, so we sum intensities and then convert back. This rough empirical fan curve ignores distance, frequency, room acoustics, and reflections. It is a visual estimate; the app does not play audio. Electrical fan power is not separately modeled.

## 3. How do sensors communicate with the twin?

Read `Simulation.tick()` in this order:

1. Advance the physical system by 0.25 seconds.
2. Advance the twin's independent estimate by the same amount.
3. Increase simulation time.
4. Ask `Sensor.read()` for a packet. It returns `null` if disconnected or fewer than two seconds have passed since the last successful sample.
5. If a packet exists, replace the twin estimate with copied readings. Save those readings separately so the dashboard can show a frozen “last sensor” value alongside the continuously estimated temperature.
6. Once per simulation second, append physical and twin temperatures to the chart. Keep the most recent 120 points.

A packet includes the timestamp, temperature, CPU load, fan speed, fan-enabled flag, and unit count for all three racks. The t = 0 state is a shared initialization assumption, not a real sensor observation. Later readings are quantized to 0.1 °C. Reconnection samples on the next tick if the two-second interval has already elapsed; otherwise it waits for that interval.

## 4. Why can the physical state and twin differ?

The twin cannot see a new command until sampling. It also receives rounded temperatures. During disconnection it keeps integrating its old model with old controls, while reality may change. The displayed “last sensor update” age is in simulation seconds.

Disconnecting without changing anything may produce almost no divergence: both sides use the same thermal equation and inputs. To reveal the information gap, disconnect **then** change CPU load or disable a fan. Reconnecting corrects the twin within 0.05 °C of the sampled physical temperature.

A more advanced twin could account for sensor noise, uncertain parameters, a command channel, or a Kalman filter. Those features are deliberately absent so the core loop stays easy to inspect.

## 5. How does prediction work?

`forecastTemperature(twinServer, 30)` evaluates the exact same heat equation over 30 seconds. It reads a copy and has no side effects. It assumes CPU load, fan state, unit count, and ambient temperature remain constant. It is a model forecast, not machine learning.

A disconnected twin can confidently predict the wrong outcome because its input controls are stale. Compare its forecast with physical readings after introducing an unseen fan fault.

## 6. Which files should I modify?

| File                                  | Purpose / experiment                                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/simulation/physics.js`           | Power, cooling, heat capacity, acoustic equation, status thresholds, colors. Start here.  |
| `src/simulation/PhysicalSimulator.js` | Initial conditions, physical updates, command limits. Change starting CPU or temperature. |
| `src/simulation/Sensor.js`            | Two-second sampling and 0.1 °C quantization. Try slower sampling.                         |
| `src/simulation/DigitalTwin.js`       | Independent prediction and packet synchronization. Try blending old and new estimates.    |
| `src/simulation/Predictor.js`         | Pure temperature forecast. Change the horizon.                                            |
| `src/simulation/Simulation.js`        | Tick order, simulation clock, and bounded chart history.                                  |
| `src/App.jsx`                         | React state, timer lifetime, tab selection, controls, summaries, and reset.               |
| `src/components/ServerControls.jsx`   | One server's readings, sliders, fan toggle, and unit buttons.                             |
| `src/components/TemperatureChart.jsx` | Recharts physical/twin temperature lines.                                                 |
| `src/components/ServerRoom.jsx`       | Three.js room, racks, local label textures, fan animation, camera, and WebGL fallback.    |
| `src/styles.css`                      | Responsive layout, colors, spacing, and typography.                                       |
| `src/main.jsx`                        | Mounts React into the HTML root element.                                                  |
| `index.html`                          | Browser entry point and metadata.                                                         |
| `vite.config.js`                      | Automatic JSX compilation.                                                                |
| `package.json` / `package-lock.json`  | Run commands and reproducible dependency versions.                                        |
| `tests/physics.test.js`               | Equilibrium, fan failure, command bounds, and decibel addition checks.                    |
| `tests/twin.test.js`                  | Sampling cadence, state isolation, disconnection, reconnection, and prediction checks.    |
| `.openai/hosting.json`                | Private Site identity and static `dist` build directory.                                  |
| `.gitignore`                          | Excludes dependencies, build output, secrets, and local temporary files.                  |
| `VERIFICATION.md` | Test results and browser/hosting verification limits. |
| `README.md`                           | Quick start, architecture, deployment, and limitations.                                   |
| `LEARNING_GUIDE.md`                   | This walkthrough.                                                                         |

### React essentials for a Python developer

JSX is HTML-like syntax inside JavaScript; `{expression}` inserts a value. Props are component function arguments. `useState` stores small UI values and triggers rendering. `useRef` preserves the simulation object between renders without creating a second model. `useEffect` starts the timer and returns a cleanup function to stop it on pause or unmount. The interval reads the current ref, so Reset can replace the entire model safely.

In Three Fiber, `<mesh>` pairs geometry (shape) with material (appearance). A `<group>` is a local coordinate frame. `useFrame` changes only the visual fan rotation every rendered frame; it never calculates physical temperature. OrbitControls comes with Three.js itself. Temperature labels use local canvas textures, and their old GPU textures are disposed when readings change.

## Three interactive experiments

### A. Load versus cooling

Reset, set Server 1 CPU to 100%, fan to 100%, and Start. Observe the temperature approach 52 °C. Lower fan speed to 30%. The new equilibrium is about 99.4 °C, so the rack eventually becomes warm and then overheating. Compare the forecast before and after the next sensor packet. Increase cooling to see the noise/temperature tradeoff.

### B. A blind twin

Reset and Start. Disconnect sensors, then disable Server 1's fan and set its CPU to 100%. Watch the physical line rise faster than the dashed twin line. The last sensor reading stays fixed, the twin estimate continues moving, and sample age grows. Reconnect and observe the correction at the next eligible tick.

### C. Capacity without more cooling

Reset, select the 3D tab, and Start. Click Server 2, then add two units. The rack now contains three visible units and draws three times its former power. Its heat capacity also triples, while the shared fan stays unchanged. Watch the forecast and temperatures increase. Remove units and compare the trajectory. Pause freezes thermal evolution and fan animation; Reset restores the three original one-unit racks.

## Modifying and validating an equation

Change one parameter in `physics.js`, run `npm test`, and reload the browser. Tests that encode a deliberate assumption may need updating when you change that assumption. Do not remove tests just to hide an unexpected regression. If you want a model mismatch rather than a different shared model, give the twin a deliberately different parameter through a separate calculation and document the distinction.

## Local commands

```sh
cd "/Volumes/Projects/Data Center twin"
npm ci
npm run dev
```

Open the localhost URL Vite prints. For production checks:

```sh
npm test
npm run build
npm run preview
```

No environment variables, server process in production, database, or external data feed is required. Browser reload clears all simulation state. Private hosting requires the owner's ChatGPT sign-in; that access layer is provided by Sites, not implemented in the application.
