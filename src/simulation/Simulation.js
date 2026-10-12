import { PhysicalSimulator } from "./PhysicalSimulator.js";
import { Sensor } from "./Sensor.js";
import { DigitalTwin } from "./DigitalTwin.js";
export class Simulation {
  constructor() {
    this.physical = new PhysicalSimulator();
    this.sensor = new Sensor();
    this.twin = new DigitalTwin(this.physical.snapshot());
    this.timeSeconds = 0;
    this.history = [this.historyPoint()];
  }
  historyPoint() {
    const point = { time: Number(this.timeSeconds.toFixed(1)) };
    this.physical.servers.forEach((server, index) => {
      point[`physical${server.id}`] = server.temperatureC;
      point[`twin${server.id}`] = this.twin.servers[index].temperatureC;
    });
    return point;
  }
  tick() {
    // Fixed simulation time makes pause and reproducible experiments straightforward.
    // Background browser throttling slows the simulation rather than skipping sensor events.
    const seconds = 0.25;
    this.physical.step(seconds);
    this.twin.step(seconds);
    this.timeSeconds += seconds;
    const packet = this.sensor.read(this.physical, this.timeSeconds);
    if (packet) this.twin.synchronize(packet);
    if (Number.isInteger(this.timeSeconds))
      this.history = [...this.history.slice(-119), this.historyPoint()];
  }
}
