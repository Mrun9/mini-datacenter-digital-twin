import test from "node:test";
import assert from "node:assert/strict";
import { calculateEnergyMetrics, ENERGY_DEFAULTS } from "../src/simulation/energy.js";
import { DATA_CENTER_SITES } from "../src/simulation/datacenterSites.js";

test("calculateEnergyMetrics produces valid facility energy, cooling, and PUE", () => {
  const result = calculateEnergyMetrics({
    itPowerKw: 500,
    ambientTempC: 22,
    fanSpeedPercent: 75,
    chillerPlacement: "side_exposed",
    siteId: "loudoun_va",
  });

  assert.equal(result.itPowerKw, 500);
  assert.ok(result.coolingPowerKw > 0, "Cooling power must be positive");
  assert.ok(result.facilityPowerKw > result.itPowerKw, "Facility power must exceed IT power");
  assert.ok(result.pue >= 1.10 && result.pue <= 1.60, `PUE (${result.pue}) should be in realistic data center range`);
  assert.ok(result.chillerCop >= 3.0 && result.chillerCop <= 6.0, `COP (${result.chillerCop}) should be realistic`);
  assert.ok(result.hourlyCostUsd > 0, "Hourly cost must be positive");
  assert.ok(result.hourlyCarbonKg > 0, "Hourly carbon must be positive");
});

test("condenser fan power scales cubically with fan speed (Fan Affinity Law)", () => {
  const fan100 = calculateEnergyMetrics({ itPowerKw: 500, fanSpeedPercent: 100 });
  const fan50 = calculateEnergyMetrics({ itPowerKw: 500, fanSpeedPercent: 50 });

  // Ratio (50/100)^3 = 0.125
  const expectedRatio = Math.pow(0.5, 3);
  const actualRatio = fan50.condenserFanKw / fan100.condenserFanKw;

  assert.ok(Math.abs(actualRatio - expectedRatio) < 0.01, `Fan power ratio ${actualRatio} should match cubic law ${expectedRatio}`);
  assert.ok(fan50.facilityPowerKw < fan100.facilityPowerKw, "Throttling fan reduces facility power");
  assert.ok(fan50.pue < fan100.pue, "Lower fan speed improves PUE");
});

test("ambient temperature increases chiller compressor lift and degrades PUE", () => {
  const coolSite = calculateEnergyMetrics({ itPowerKw: 500, ambientTempC: 15, siteId: "the_dalles_or" });
  const desertSite = calculateEnergyMetrics({ itPowerKw: 500, ambientTempC: 42, siteId: "phoenix_az" });

  assert.ok(desertSite.chillerCop < coolSite.chillerCop, "Extreme heat degrades chiller COP");
  assert.ok(desertSite.coolingPowerKw > coolSite.coolingPowerKw, "Desert site requires significantly more cooling power");
  assert.ok(desertSite.pue > coolSite.pue, "Desert site has higher PUE under thermal stress");
});

test("subterranean placement provides thermal buffering benefit", () => {
  const surface = calculateEnergyMetrics({ itPowerKw: 500, ambientTempC: 35, chillerPlacement: "side_exposed" });
  const bunker = calculateEnergyMetrics({ itPowerKw: 500, ambientTempC: 35, chillerPlacement: "underground" });

  assert.ok(bunker.effectiveAmbientC < surface.effectiveAmbientC, "Underground bunker provides cooler intake air");
  assert.ok(bunker.chillerCop > surface.chillerCop, "Underground bunker improves COP");
  assert.ok(bunker.chillerCompressorKw < surface.chillerCompressorKw, "Underground bunker reduces compressor power");
});

test("regional grid carbon intensity differentiates clean hydro vs fossil grids", () => {
  const loudoun = calculateEnergyMetrics({ itPowerKw: 500, siteId: "loudoun_va" }); // PJM grid 385 g/kWh
  const theDalles = calculateEnergyMetrics({ itPowerKw: 500, siteId: "the_dalles_or" }); // BPA Hydro 24 g/kWh

  assert.ok(
    loudoun.hourlyCarbonKg > theDalles.hourlyCarbonKg * 10,
    "Loudoun PJM grid emits over 10x the carbon of Oregon BPA hydro"
  );
  assert.equal(theDalles.gridCarbonGramsPerKwh, 24);
  assert.equal(loudoun.gridCarbonGramsPerKwh, 385);
});
