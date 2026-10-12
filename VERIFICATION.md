# Verification

## Automated checks

`npm test`: seven tests pass, covering analytical equilibrium, fan failure, bounded controls, logarithmic noise addition, two-second sampling, independent state copies, divergence/reconnection, non-mutating forecasts, bounded history, and reset defaults.

`npm run build`: succeeds. Vite warns that the chart and Three.js bundles exceed 500 kB; the 3D bundle is lazy-loaded. This is a size advisory, not a compilation error.

## Browser checks

Local in-app browser verification:

- Dashboard loads and both tabs switch successfully.
- Three racks, floor/walls, fan blades, and physical temperature labels render.
- Clicking the third rack selects Server 3 controls.
- Dragging rotates the camera and scrolling changes zoom.
- Adding two units to Server 2 displays three units and 720 W at full CPU load.
- CPU sliders, fan toggle, sensor disconnection, Start, Pause, and Reset work.
- At 19.5 simulation seconds after full-load fan failure with sensors disconnected, Server 1 physical temperature is 69.0 °C and its twin is 41.1 °C (28.0 °C displayed deviation).
- Reconnecting brings the deviation back to a displayed 0.0 °C; the graph shows the twin correction.
- Server 1 reaches the overheating status at 75.8 °C.
- Pause preserves the simulation clock across tab changes; Reset restores time zero, enabled fans, original CPU loads, one unit per rack, and 35 °C.

## Hosting

The MVP was packaged from source commit `f0e660b4086e71e616176073e7b2f3e0b83a3c51` and the private Sites deployment returned `succeeded` at:

https://mini-datacenter-digital-twin.muur3.chatgpt.site

The hosted sign-in gate was verified. Authenticated hosted interaction checks require the owner's ChatGPT sign-in in the testing browser; local rendering alone does not prove hosted runtime compatibility. Final source updates are repackaged and deployed through the same private operation.

GitHub repository metadata confirms `isPrivate: true`. No public access was requested or enabled.
