/**
 * Energy, Carbon, and Thermodynamic Efficiency Engine for Data Centers
 * Models IT compute load, chiller COP thermodynamics, condenser fan affinity laws,
 * PUE (Power Usage Effectiveness), grid carbon emissions, and operational cost.
 */

import { DATA_CENTER_SITES } from "./datacenterSites.js";

export const ENERGY_DEFAULTS = {
  baselineCopNominal: 4.4, // Nominal Chiller Coefficient of Performance at 20°C
  tempCopPenaltyPerC: 0.022, // 2.2% COP reduction per °C above 20°C ambient
  tempCopBonusPerC: 0.018, // 1.8% COP improvement per °C below 20°C (free-cooling economizer)
  fanPowerRatioAt100: 0.088, // Peak condenser fan power as % of IT load (~44kW for 500kW IT)
  pumpingPowerRatio: 0.032, // Chilled water & condenser pumps (~3.2% of IT load)
  upsElectricalLossRatio: 0.042, // Electrical distribution, UPS, transformer & switchgear losses
  silencerBackpressureFanPenalty: 0.045, // 4.5% fan energy penalty from acoustic silencer baffles
};

/**
 * Calculates complete facility energy metrics, cooling split, PUE, carbon, and operational cost.
 *
 * @param {Object} options
 * @param {number} options.itPowerKw - IT compute power load in kilowatts (default 500)
 * @param {number} options.ambientTempC - Outdoor ambient temperature in Celsius
 * @param {number} options.fanSpeedPercent - Condenser fan duty percentage (0-100)
 * @param {string} options.chillerPlacement - "surface" | "side_exposed" | "rear_shielded" | "semi_berm" | "underground" | "rooftop"
 * @param {boolean} options.silencers - Whether acoustic exhaust silencers are installed
 * @param {string} options.siteId - Target data center site ID
 * @param {string} options.timeOfDay - "day" | "night"
 * @returns {Object} Comprehensive energy, PUE, carbon, and cost breakdown
 */
export function calculateEnergyMetrics({
  itPowerKw = 500,
  ambientTempC = 22,
  fanSpeedPercent = 75,
  chillerPlacement = "side_exposed",
  silencers = false,
  siteId = "loudoun_va",
  timeOfDay = "night",
} = {}) {
  const safeItKw = Math.max(50, Number(itPowerKw) || 500);
  const safeFanPct = Math.max(30, Math.min(100, Number(fanSpeedPercent) || 75));
  const safeAmbientC = Number(ambientTempC) ?? 22;

  // Retrieve site metadata
  const site = DATA_CENTER_SITES.find((s) => s.id === siteId) || DATA_CENTER_SITES[0];
  const gridCarbonGramsPerKwh = site.gridCarbonGramsPerKwh || 385;
  const electricityPricePerKwh = site.electricityPricePerKwh || 0.09;

  // 1. Effective Ambient Temperature with Placement Effects
  // Subterranean vaults and berms offer thermal buffering (cooler air intake in summer, less direct solar insolation)
  let placementTempOffset = 0;
  if (chillerPlacement === "underground") {
    placementTempOffset = -3.8; // Cool subterranean vault thermal mass & shade
  } else if (chillerPlacement === "semi_berm") {
    placementTempOffset = -1.5; // Shaded earthen berm recess
  } else if (chillerPlacement === "rooftop") {
    placementTempOffset = +2.2; // Rooftop solar radiant heat island
  }
  const effectiveAmbientC = safeAmbientC + placementTempOffset;

  // 2. Chiller Thermodynamic COP (Coefficient of Performance)
  // Carnot-derived temperature lift penalty and economizer gains
  let chillerCop = ENERGY_DEFAULTS.baselineCopNominal;
  if (effectiveAmbientC > 20) {
    const deltaHot = effectiveAmbientC - 20;
    chillerCop = chillerCop / (1 + deltaHot * ENERGY_DEFAULTS.tempCopPenaltyPerC);
  } else {
    const deltaCold = 20 - effectiveAmbientC;
    chillerCop = chillerCop * (1 + deltaCold * ENERGY_DEFAULTS.tempCopBonusPerC);
  }
  // Safe bounds: real water/air-cooled chillers range between 2.2 (extreme desert) and 6.8 (cool economizer)
  chillerCop = Math.max(2.2, Math.min(6.8, chillerCop));

  // 3. Chiller Compressor Electrical Power (kW)
  const chillerCompressorKw = safeItKw / chillerCop;

  // 4. Condenser Fans Power (kW) with Fan Affinity Law (Cubic scaling: P ~ RPM^3)
  const peakFanPowerKw = safeItKw * ENERGY_DEFAULTS.fanPowerRatioAt100;
  const normalizedFanSpeed = safeFanPct / 100;
  let condenserFanKw = peakFanPowerKw * Math.pow(normalizedFanSpeed, 3);

  // Silencer backpressure penalty
  if (silencers) {
    condenserFanKw *= 1 + ENERGY_DEFAULTS.silencerBackpressureFanPenalty;
  }

  // 5. Chilled Water & Condenser Pumps (kW)
  const pumpsKw = safeItKw * ENERGY_DEFAULTS.pumpingPowerRatio;

  // 6. Total Cooling Power (kW)
  const coolingPowerKw = chillerCompressorKw + condenserFanKw + pumpsKw;

  // 7. Electrical Distribution & Auxiliary Losses (kW)
  const electricalLossesKw = (safeItKw + coolingPowerKw) * ENERGY_DEFAULTS.upsElectricalLossRatio;

  // 8. Total Facility Power (kW)
  const facilityPowerKw = safeItKw + coolingPowerKw + electricalLossesKw;

  // 9. PUE (Power Usage Effectiveness)
  const pue = facilityPowerKw / safeItKw;

  // PUE Rating & Aesthetic Color
  let pueRating = "High Efficiency";
  let pueColor = "#10b981"; // Emerald
  let pueDescription = "Optimized hyperscale cooling envelope";

  if (pue <= 1.15) {
    pueRating = "Exceptional (Tier IV)";
    pueColor = "#059669";
    pueDescription = "Near-ideal thermodynamic efficiency";
  } else if (pue <= 1.25) {
    pueRating = "High Efficiency";
    pueColor = "#0284c7";
    pueDescription = "Industry-leading eco-cooling design";
  } else if (pue <= 1.40) {
    pueRating = "Moderate Efficiency";
    pueColor = "#d97706";
    pueDescription = "Elevated ambient or fan heat stress";
  } else {
    pueRating = "Thermal Stress / High Loss";
    pueColor = "#dc2626";
    pueDescription = "Severe compressor lift penalty in high ambient heat";
  }

  // 10. Regional Carbon Emissions
  // kg CO2 per hour = (facility kW * gCO2/kWh) / 1000
  const hourlyCarbonKg = (facilityPowerKw * gridCarbonGramsPerKwh) / 1000;
  const annualCarbonTons = (hourlyCarbonKg * 8760) / 1000;

  // 11. Operational Electricity Cost
  const hourlyCostUsd = facilityPowerKw * electricityPricePerKwh;
  const annualCostUsd = hourlyCostUsd * 8760;

  // 12. Unoptimized Baseline Comparison (Surface chiller at 100% fan duty in ambient temp)
  const baselineFanKw = peakFanPowerKw * Math.pow(1.0, 3);
  let baselineCop = ENERGY_DEFAULTS.baselineCopNominal;
  if (safeAmbientC > 20) {
    baselineCop = baselineCop / (1 + (safeAmbientC - 20) * ENERGY_DEFAULTS.tempCopPenaltyPerC);
  }
  baselineCop = Math.max(2.2, Math.min(6.8, baselineCop));
  const baselineCompressorKw = safeItKw / baselineCop;
  const baselineCoolingKw = baselineCompressorKw + baselineFanKw + pumpsKw;
  const baselineFacilityKw = safeItKw + baselineCoolingKw + (safeItKw + baselineCoolingKw) * ENERGY_DEFAULTS.upsElectricalLossRatio;
  const baselinePue = baselineFacilityKw / safeItKw;
  const baselineHourlyCost = baselineFacilityKw * electricityPricePerKwh;
  const baselineHourlyCarbon = (baselineFacilityKw * gridCarbonGramsPerKwh) / 1000;

  const hourlyEnergySavedKwh = Math.max(0, baselineFacilityKw - facilityPowerKw);
  const hourlyCostSavedUsd = Math.max(0, baselineHourlyCost - hourlyCostUsd);
  const hourlyCarbonSavedKg = Math.max(0, baselineHourlyCarbon - hourlyCarbonKg);

  return {
    itPowerKw: Math.round(safeItKw * 10) / 10,
    coolingPowerKw: Math.round(coolingPowerKw * 10) / 10,
    chillerCompressorKw: Math.round(chillerCompressorKw * 10) / 10,
    condenserFanKw: Math.round(condenserFanKw * 10) / 10,
    pumpsKw: Math.round(pumpsKw * 10) / 10,
    electricalLossesKw: Math.round(electricalLossesKw * 10) / 10,
    facilityPowerKw: Math.round(facilityPowerKw * 10) / 10,
    chillerCop: Math.round(chillerCop * 100) / 100,
    effectiveAmbientC: Math.round(effectiveAmbientC * 10) / 10,
    pue: Math.round(pue * 1000) / 1000,
    pueRating,
    pueColor,
    pueDescription,
    gridName: site.powerGridType || "Regional Grid",
    gridCarbonGramsPerKwh,
    hourlyCarbonKg: Math.round(hourlyCarbonKg * 10) / 10,
    annualCarbonTons: Math.round(annualCarbonTons * 10) / 10,
    electricityPricePerKwh,
    hourlyCostUsd: Math.round(hourlyCostUsd * 100) / 100,
    annualCostUsd: Math.round(annualCostUsd),
    baselinePue: Math.round(baselinePue * 1000) / 1000,
    hourlyEnergySavedKwh: Math.round(hourlyEnergySavedKwh * 10) / 10,
    hourlyCostSavedUsd: Math.round(hourlyCostSavedUsd * 100) / 100,
    hourlyCarbonSavedKg: Math.round(hourlyCarbonSavedKg * 10) / 10,
    coolingFractionPercent: Math.round((coolingPowerKw / facilityPowerKw) * 1000) / 10,
    itFractionPercent: Math.round((safeItKw / facilityPowerKw) * 1000) / 10,
  };
}
