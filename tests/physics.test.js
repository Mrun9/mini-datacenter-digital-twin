import test from "node:test";
import assert from "node:assert/strict";
import { PhysicalSimulator } from "../src/simulation/PhysicalSimulator.js";
import {
  nextTemperature,
  powerWatts,
  coolingWattsPerC,
  totalNoiseDba,
} from "../src/simulation/physics.js";
test("temperature approaches the analytical equilibrium", () => {
  const server = new PhysicalSimulator().snapshot()[0];
  assert.ok(
    Math.abs(
      nextTemperature(server, 10000) -
        (22 + powerWatts(server) / coolingWattsPerC(server)),
    ) < 1e-8,
  );
});
test("fan failure heats faster and controls remain bounded", () => {
  const physical = new PhysicalSimulator();
  const server = physical.snapshot()[0];
  assert.ok(
    nextTemperature({ ...server, fanEnabled: false }, 30) >
      nextTemperature(server, 30),
  );
  physical.command(1, { cpuPercent: 200, fanPercent: -10, units: 0 });
  assert.equal(physical.servers[0].cpuPercent, 100);
  assert.equal(physical.servers[0].fanPercent, 0);
  assert.equal(physical.servers[0].units, 1);
});
test("noise uses intensity addition and stopped fans contribute no sound", () => {
  const server = new PhysicalSimulator().snapshot()[0];
  assert.equal(totalNoiseDba([{ ...server, fanEnabled: false }]), 25);
  const increase = totalNoiseDba([server, server]) - totalNoiseDba([server]);
  assert.ok(increase > 2 && increase < 3.02);
});
