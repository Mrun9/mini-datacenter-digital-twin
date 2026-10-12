import { nextTemperature } from "./physics.js";
export class DigitalTwin {
  constructor(initialServers) {
    this.servers = initialServers.map((server) => ({ ...server }));
    this.lastMeasurementSeconds = 0;
    this.measurements = initialServers.map((server) => ({ ...server }));
  }
  step(seconds) {
    // Between packets, estimate using the last observed controls, even if reality changes.
    this.servers = this.servers.map((server) => ({
      ...server,
      temperatureC: nextTemperature(server, seconds),
    }));
  }
  synchronize(packet) {
    this.servers = packet.servers.map((server) => ({ ...server }));
    this.measurements = packet.servers.map((server) => ({ ...server }));
    this.lastMeasurementSeconds = packet.timeSeconds;
  }
}
