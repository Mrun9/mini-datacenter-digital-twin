import { nextTemperature } from './physics.js';
// Pure function: forecasting must not advance either the physical system or twin.
export function forecastTemperature(server, horizonSeconds = 30) {
  return nextTemperature({ ...server }, horizonSeconds);
}
