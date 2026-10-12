import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulation } from '../src/simulation/Simulation.js';
import { forecastTemperature } from '../src/simulation/Predictor.js';
test('two-second packets synchronize separate state without aliasing', () => {
  const model = new Simulation();
  model.physical.command(1, { cpuPercent: 100 });
  for (let i = 0; i < 7; i++) model.tick();
  assert.equal(model.twin.servers[0].cpuPercent, 35);
  model.tick();
  assert.equal(model.twin.servers[0].cpuPercent, 100);
  assert.equal(model.twin.lastMeasurementSeconds, 2);
  assert.notEqual(model.twin.servers[0], model.physical.servers[0]);
});
test('disconnect diverges after an unseen fan fault; reconnect corrects the twin', () => {
  const model = new Simulation();
  model.sensor.connected = false;
  model.physical.command(1, { fanEnabled: false, cpuPercent: 100 });
  for (let i = 0; i < 120; i++) model.tick();
  assert.ok(model.physical.servers[0].temperatureC - model.twin.servers[0].temperatureC > 20);
  model.sensor.connected = true;
  model.tick();
  assert.ok(Math.abs(model.physical.servers[0].temperatureC - model.twin.servers[0].temperatureC) <= 0.05);
});
test('forecast is non-mutating and matches a 30-second constant-control rollout', () => {
  const model = new Simulation();
  const before = JSON.stringify(model.twin.servers);
  const predicted = forecastTemperature(model.twin.servers[0]);
  assert.equal(JSON.stringify(model.twin.servers), before);
  for (let i = 0; i < 120; i++) model.tick();
  assert.ok(Math.abs(predicted - model.physical.servers[0].temperatureC) < 1e-9);
});
