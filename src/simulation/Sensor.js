export class Sensor {
  constructor() { this.connected = true; this.lastSampleSeconds = 0; }
  read(physical, timeSeconds) {
    if (!this.connected || timeSeconds - this.lastSampleSeconds < 2 - 1e-9) return null;
    this.lastSampleSeconds = timeSeconds;
    // Copy data: a real sensor sends a packet, not a reference to the physical world.
    // Round to 0.1 °C to demonstrate finite measurement resolution without random noise.
    return { timeSeconds, servers: physical.snapshot().map(server => ({
      ...server, temperatureC: Math.round(server.temperatureC * 10) / 10,
    })) };
  }
}
