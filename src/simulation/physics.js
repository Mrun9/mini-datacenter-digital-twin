// Educational parameters, not a calibrated model of a particular server.
export const AMBIENT_C = 22;
export const HEAT_CAPACITY_J_PER_C = 120;
export const powerWatts = (server) =>
  server.units * (60 + (180 * server.cpuPercent) / 100);
export const coolingWattsPerC = (server) =>
  1 + 7 * (server.fanEnabled ? server.fanPercent / 100 : 0);

export function nextTemperature(server, seconds) {
  const conductance = coolingWattsPerC(server);
  const capacity = HEAT_CAPACITY_J_PER_C * server.units;
  const equilibriumC = AMBIENT_C + powerWatts(server) / conductance;
  // Exact solution of C dT/dt = P - k(T - ambient), for constant controls.
  // Exponential integration stays stable even when a browser tick is delayed.
  return (
    equilibriumC +
    (server.temperatureC - equilibriumC) *
      Math.exp((-conductance * seconds) / capacity)
  );
}

export function totalNoiseDba(servers) {
  // Add sound intensities, not decibels. Include a 25 dBA room background.
  let intensity = 10 ** (25 / 10);
  for (const server of servers) {
    if (server.fanEnabled && server.fanPercent > 0) {
      const fanDba = 20 + (30 * server.fanPercent) / 100;
      intensity += 10 ** (fanDba / 10);
    }
  }
  return 10 * Math.log10(intensity);
}
export const statusOf = (temperatureC) =>
  temperatureC >= 75 ? "Overheating" : temperatureC >= 55 ? "Warm" : "Normal";
export const colorOf = (temperatureC) =>
  temperatureC >= 75 ? "#f87171" : temperatureC >= 55 ? "#fbbf24" : "#45d6b0";
