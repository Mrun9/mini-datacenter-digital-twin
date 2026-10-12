# Mini Data Center Digital Twin

An educational browser-only simulation of three servers, delayed sensors, an independent digital twin, and a 30-second thermal forecast. Values are illustrative, not validated physical measurements.

## Architecture

Vite builds a static React application. Plain JavaScript modules implement the physical simulator, two-second sensor sampling, twin state, and predictor. Recharts draws temperature history; React Three Fiber renders simple room geometry. No application backend, database, or authentication is required. ChatGPT Sites controls private hosting access.

## Installation

Use Node.js 22 or newer.

```sh
npm install
npm run dev
npm run build
npm test
```

## Learning objectives

Understand how commands affect a physical model, how delayed measurements update a separate estimate, how disconnection creates divergence, and how a model predicts future temperature. The planned LEARNING_GUIDE.md explains equations, files, and experiments.

## Privacy and deployment

The GitHub repository must remain private. Deployment uses static `dist/` output on ChatGPT Sites with owner-only access. Hosting compatibility must be verified before advanced visualization work.
