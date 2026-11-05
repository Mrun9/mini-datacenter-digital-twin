import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateChillerSoundPower,
  calculateWallAttenuation,
  calculateVegetationAttenuation,
  calculatePlacementAttenuation,
  evaluateSiteAcoustics,
  calculateNoiseAtPoint,
  calculateIsophoneRadii,
} from "../src/simulation/acoustics.js";
import { DATA_CENTER_SITES, WALL_MATERIALS, REGIONAL_TREE_SPECIES } from "../src/simulation/datacenterSites.js";

test("chiller sound power increases with ambient temperature and fan duty", () => {
  const coolLw = calculateChillerSoundPower(500, 20, 60);
  const hotLw = calculateChillerSoundPower(500, 42, 60); // Phoenix 42°C
  const maxFanLw = calculateChillerSoundPower(500, 20, 100); // 100% fan

  assert.ok(hotLw > coolLw, "Higher ambient temperature increases chiller sound power");
  assert.ok(maxFanLw > coolLw, "Higher fan speed increases acoustic emission");
  assert.ok(coolLw >= 85 && coolLw <= 115, "Sound power level within realistic industrial range");
});

test("acoustic wall provides Maekawa diffraction and absorptive bonus", () => {
  const disabled = calculateWallAttenuation(8, "absorptive_metal", 15, 300, false);
  assert.equal(disabled.attenuationDb, 0, "Disabled wall has zero attenuation");

  const lowWall = calculateWallAttenuation(4, "absorptive_metal", 15, 300, true);
  const highWall = calculateWallAttenuation(12, "absorptive_metal", 15, 300, true);
  assert.ok(highWall.attenuationDb > lowWall.attenuationDb, "12m wall attenuates more than 4m wall");

  const metalWall = calculateWallAttenuation(8, "absorptive_metal", 15, 300, true);
  const concreteWall = calculateWallAttenuation(8, "dense_concrete", 15, 300, true);
  assert.ok(
    metalWall.attenuationDb > concreteWall.attenuationDb,
    "Absorptive metal composite absorbs sound rather than reflecting it"
  );
  assert.ok(metalWall.costEstimate > 0, "Provides wall CAPEX estimate");
});

test("vegetation buffer provides bio-acoustic scattering and eco-metrics", () => {
  const zeroDepth = calculateVegetationAttenuation(0, "virginia_pine", true);
  assert.equal(zeroDepth.attenuationDb, 0);

  const shallow = calculateVegetationAttenuation(10, "virginia_pine", true);
  const deep = calculateVegetationAttenuation(50, "virginia_pine", true);

  assert.ok(deep.attenuationDb > shallow.attenuationDb, "Deeper tree buffer scatters more sound");
  assert.ok(deep.annualMaintenanceCost > 0, "Provides maintenance cost");
  assert.ok(deep.annualCo2Kg > 0, "Provides carbon sequestration metric");

  // Regional tree comparison: Desert cypress uses far less water than universal poplar
  const cypress = calculateVegetationAttenuation(30, "arizona_cypress", true);
  const poplar = calculateVegetationAttenuation(30, "hybrid_poplar", true);
  assert.ok(cypress.annualWaterGallons < poplar.annualWaterGallons, "Native desert trees conserve water");
});

test("subterranean placement attenuates direct line-of-sight sound", () => {
  const surface = calculatePlacementAttenuation("surface");
  const semiBerm = calculatePlacementAttenuation("semi_berm");
  const underground = calculatePlacementAttenuation("underground");

  assert.equal(surface.attenuationDb, 0);
  assert.ok(semiBerm.attenuationDb >= 10, "Semi-berm offers ~11 dB");
  assert.ok(underground.attenuationDb >= 25, "Underground vault eliminates direct line-of-sight noise");
});

test("evaluateSiteAcoustics computes full link budget and compliance status", () => {
  const unmitigated = evaluateSiteAcoustics({
    itPowerKw: 600,
    ambientTempC: 30,
    distanceToHomesMeters: 300,
    municipalNoiseLimitDba: 45,
    chillerPlacement: "surface",
    wallEnabled: false,
    treeEnabled: false,
  });

  assert.ok(
    unmitigated.netReceivedLp > unmitigated.municipalNoiseLimitDba,
    "Unmitigated chillers violate 45 dBA night limit"
  );
  assert.equal(unmitigated.isCompliant, false, "Marked non-compliant");

  // Apply full mitigation: Underground + 10m wall + 40m forest
  const fullyMitigated = evaluateSiteAcoustics({
    itPowerKw: 600,
    ambientTempC: 30,
    distanceToHomesMeters: 300,
    municipalNoiseLimitDba: 45,
    chillerPlacement: "underground",
    wallHeightMeters: 10,
    wallMaterial: "absorptive_metal",
    wallEnabled: true,
    treeBufferDepthMeters: 40,
    treeSpeciesId: "virginia_pine",
    treeEnabled: true,
    chillerOrientationAngle: 180,
  });

  assert.ok(fullyMitigated.netReceivedLp <= 45, "Fully mitigated data center meets 45 dBA limit");
  assert.equal(fullyMitigated.isCompliant, true, "Marked compliant");
  assert.ok(fullyMitigated.noiseReductionDb >= 15, "Achieved significant noise reduction");
  assert.ok(
    fullyMitigated.breakdown.totalMitigationDb >= 25,
    "Combined physical mitigation attenuation >= 25 dB"
  );
});

test("datacenter sites are properly configured with regional species", () => {
  assert.ok(DATA_CENTER_SITES.length >= 4, "Includes at least 4 real-world data center sites");
  for (const site of DATA_CENTER_SITES) {
    assert.ok(site.id, "Site has valid id");
    assert.ok(site.municipalNoiseLimitDba >= 35 && site.municipalNoiseLimitDba <= 65);
    assert.ok(REGIONAL_TREE_SPECIES[site.recommendedTreeId], "Site has valid recommended native tree");
  }
});

test("calculateNoiseAtPoint computes sound levels and sensation based on distance", () => {
  const closeReading = calculateNoiseAtPoint({
    probeDistanceMeters: 20,
    itPowerKw: 500,
    ambientTempC: 22,
    fanSpeedPercent: 75,
    chillerPlacement: "surface",
    wallEnabled: false,
    treeEnabled: false,
    municipalNoiseLimitDba: 45,
  });

  const farReading = calculateNoiseAtPoint({
    probeDistanceMeters: 300,
    itPowerKw: 500,
    ambientTempC: 22,
    fanSpeedPercent: 75,
    chillerPlacement: "surface",
    wallEnabled: false,
    treeEnabled: false,
    municipalNoiseLimitDba: 45,
  });

  assert.ok(closeReading.netDba > farReading.netDba, "Close probe reads higher sound than distant probe");
  assert.ok(closeReading.netDbc >= closeReading.netDba, "dBC includes low-frequency hum");
  assert.equal(closeReading.isCompliant, false, "Close to unmitigated plant is in violation");
  assert.ok(closeReading.sensation.length > 0, "Provides qualitative sensation description");
});

test("calculateIsophoneRadii returns concentric decibel contour radii that contract with mitigations", () => {
  const unmitigated = calculateIsophoneRadii({
    targetDbaLevels: [75, 65, 55, 45, 40],
    itPowerKw: 500,
    ambientTempC: 22,
    fanSpeedPercent: 75,
    chillerPlacement: "surface",
    wallEnabled: false,
    treeEnabled: false,
  });

  const mitigated = calculateIsophoneRadii({
    targetDbaLevels: [75, 65, 55, 45, 40],
    itPowerKw: 500,
    ambientTempC: 22,
    fanSpeedPercent: 75,
    chillerPlacement: "underground",
    wallHeightMeters: 8,
    wallMaterial: "absorptive_metal",
    wallEnabled: true,
    treeBufferDepthMeters: 25,
    treeSpeciesId: "virginia_pine",
    treeEnabled: true,
  });

  assert.equal(unmitigated.length, 5, "Calculates 5 isophone levels");
  // The radius for 45 dBA should be smaller when mitigated
  const unmitigated45 = unmitigated.find((r) => r.targetDba === 45).radiusMeters;
  const mitigated45 = mitigated.find((r) => r.targetDba === 45).radiusMeters;
  assert.ok(mitigated45 < unmitigated45, "Mitigations contract the concentric isophone circles");
});

test("LSARS wall types attenuate and adjust cost according to material specifications", () => {
  // 1. Perforated metal absorptive barrier: 10 to 15 dB drop
  const perfMetal = calculateWallAttenuation(8, "absorptive_metal", 15, 300, true);
  assert.ok(perfMetal.attenuationDb >= 10 && perfMetal.attenuationDb <= 15, "Perforated metal within 10-15 dB drop range");
  assert.equal(perfMetal.material.typicalThickness, "4 inches");

  // 2. Concrete / precast concrete: 6 to 10 dB drop (4" standard)
  const concrete4 = calculateWallAttenuation(8, "dense_concrete", 15, 300, true);
  assert.ok(concrete4.attenuationDb >= 6 && concrete4.attenuationDb <= 10, "Precast concrete 4\" within 6-10 dB drop range");
  assert.equal(concrete4.material.typicalThickness, "4 inches");

  // 4.5"+ reinforced concrete provides enhanced low-frequency attenuation over 4" concrete
  const concreteThick = calculateWallAttenuation(8, "concrete_thick", 15, 300, true);
  assert.ok(concreteThick.attenuationDb > concrete4.attenuationDb, "4.5\"+ concrete attenuates more than standard 4\" concrete");
  assert.ok(concreteThick.attenuationDb >= 9 && concreteThick.attenuationDb <= 14, "4.5\"+ concrete within 9-14 dB range");

  // 3. Masonry / brick: 4.5" thick and ~50 dB transmission loss
  const masonry = calculateWallAttenuation(8, "masonry_brick", 15, 300, true);
  assert.equal(masonry.material.transmissionLossDb, 50, "Masonry has 50 dB transmission loss rating");
  assert.equal(masonry.material.typicalThickness, "4.5 inches");
  assert.ok(masonry.attenuationDb > perfMetal.attenuationDb, "Masonry barrier provides high diffraction shielding");

  // 4. Steel or aluminum: 4 inches thick and 15-25 dB
  const steelAlum = calculateWallAttenuation(8, "steel_aluminum", 15, 300, true);
  assert.ok(steelAlum.attenuationDb >= 15 && steelAlum.attenuationDb <= 25, "Steel/aluminum within 15-25 dB drop range");
  assert.equal(steelAlum.material.typicalThickness, "4 inches");

  // 5. Green living walls with concrete (45-55), masonry (40-48), steel (35-42)
  const greenSteel = calculateWallAttenuation(8, "green_wall_steel", 15, 300, true);
  const greenMasonry = calculateWallAttenuation(8, "green_wall_masonry", 15, 300, true);
  const greenConcrete = calculateWallAttenuation(8, "green_wall_concrete", 15, 300, true);

  assert.ok(greenConcrete.attenuationDb > greenMasonry.attenuationDb, "Green wall with concrete > masonry");
  assert.ok(greenMasonry.attenuationDb > greenSteel.attenuationDb, "Green wall with masonry > steel");
  assert.ok(greenConcrete.material.transmissionLossDb >= 50, "Green concrete transmission loss >= 50 dB (45-55 dB class)");
  assert.ok(greenMasonry.material.transmissionLossDb >= 45, "Green masonry transmission loss in 40-48 dB class");
  assert.ok(greenSteel.material.transmissionLossDb >= 40, "Green steel transmission loss in 35-42 dB class");

  // Cost adjustments
  assert.ok(greenConcrete.costEstimate > masonry.costEstimate, "Green living wall has higher CAPEX than raw masonry");
  assert.ok(masonry.costEstimate > perfMetal.costEstimate, "Masonry CAPEX > Perforated metal CAPEX");
  assert.ok(perfMetal.costEstimate > concrete4.costEstimate, "Perforated metal CAPEX > Precast concrete CAPEX");
});

