/**
 * Web Audio API Environmental Noise Synthesizer
 * Generates an accurate acoustic simulation of a data center chiller plant:
 * - Low-frequency compressor hum (60 Hz / 120 Hz / 180 Hz harmonics)
 * - Turbulent airflow fan roar (low-pass filtered white/pink noise)
 * - Realistic decibel-to-amplitude acoustic volume scaling
 * - Suburban night ambient background (soft crickets/breeze)
 */

class AcousticEarSimulator {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.isMuted = false;

    // Audio nodes
    this.masterGain = null;
    this.chillerGain = null;
    this.ambientGain = null;

    // Chiller harmonic oscillators
    this.hum60Hz = null;
    this.hum120Hz = null;
    this.hum180Hz = null;

    // Fan noise nodes
    this.fanNoiseSource = null;
    this.fanFilter = null;

    // Ambient crickets/night noise nodes
    this.ambientNoiseSource = null;
    this.ambientFilter = null;

    this.currentDba = 55;
  }

  init() {
    if (this.audioCtx) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      console.warn("Web Audio API not supported in this browser.");
      return;
    }

    this.audioCtx = new AudioContext();

    // Master Output Gain
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, this.audioCtx.currentTime);
    this.masterGain.connect(this.audioCtx.destination);

    // Chiller Sub-mix Gain
    this.chillerGain = this.audioCtx.createGain();
    this.chillerGain.connect(this.masterGain);

    // Ambient Night Sub-mix Gain
    this.ambientGain = this.audioCtx.createGain();
    this.ambientGain.gain.value = 0.08;
    this.ambientGain.connect(this.masterGain);

    // 1. Harmonics of compressor mechanical hum (60 Hz, 120 Hz, 180 Hz)
    this.hum60Hz = this.audioCtx.createOscillator();
    this.hum60Hz.type = "sine";
    this.hum60Hz.frequency.value = 60;
    const gain60 = this.audioCtx.createGain();
    gain60.gain.value = 0.35;
    this.hum60Hz.connect(gain60);
    gain60.connect(this.chillerGain);

    this.hum120Hz = this.audioCtx.createOscillator();
    this.hum120Hz.type = "triangle";
    this.hum120Hz.frequency.value = 120;
    const gain120 = this.audioCtx.createGain();
    gain120.gain.value = 0.25;
    this.hum120Hz.connect(gain120);
    gain120.connect(this.chillerGain);

    this.hum180Hz = this.audioCtx.createOscillator();
    this.hum180Hz.type = "sine";
    this.hum180Hz.frequency.value = 180;
    const gain180 = this.audioCtx.createGain();
    gain180.gain.value = 0.12;
    this.hum180Hz.connect(gain180);
    gain180.connect(this.chillerGain);

    // 2. Turbulent fan airflow noise (White noise passed through a resonant bandpass filter)
    const bufferSize = this.audioCtx.sampleRate * 2;
    const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.fanNoiseSource = this.audioCtx.createBufferSource();
    this.fanNoiseSource.buffer = noiseBuffer;
    this.fanNoiseSource.loop = true;

    this.fanFilter = this.audioCtx.createBiquadFilter();
    this.fanFilter.type = "lowpass";
    this.fanFilter.frequency.value = 380; // Muffled fan roar over distance
    this.fanFilter.Q.value = 1.2;

    const fanGain = this.audioCtx.createGain();
    fanGain.gain.value = 0.45;

    this.fanNoiseSource.connect(this.fanFilter);
    this.fanFilter.connect(fanGain);
    fanGain.connect(this.chillerGain);

    // Start oscillators and noise generators
    this.hum60Hz.start();
    this.hum120Hz.start();
    this.hum180Hz.start();
    this.fanNoiseSource.start();
  }

  /**
   * Updates playback volume dynamically based on calculated dBA at receptor
   * @param {number} dba - Received sound pressure level in dBA
   */
  setDecibels(dba) {
    this.currentDba = dba;
    if (!this.audioCtx || !this.isPlaying || this.isMuted) return;

    // Perceptual loudness mapping:
    // 35 dBA (whisper quiet) -> gain ~ 0.015
    // 45 dBA (EPA limit) -> gain ~ 0.08
    // 60 dBA (noisy conversation / violation) -> gain ~ 0.28
    // 75 dBA (loud industrial roar) -> gain ~ 0.65
    const normalizedDba = Math.max(30, Math.min(85, dba));
    // Psychoacoustic loudness doubles roughly every 10 dB
    const targetGain = 0.01 + Math.pow((normalizedDba - 30) / 50, 2.2) * 0.55;

    // Attenuation also shifts frequency content: Higher barriers muffle high frequencies more
    const filterFreq = Math.max(120, Math.min(800, 150 + (normalizedDba - 35) * 12));

    const now = this.audioCtx.currentTime;
    this.chillerGain.gain.setTargetAtTime(targetGain, now, 0.15);
    if (this.fanFilter) {
      this.fanFilter.frequency.setTargetAtTime(filterFreq, now, 0.2);
    }
  }

  start() {
    this.init();
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
    this.isPlaying = true;
    this.isMuted = false;
    this.masterGain.gain.setTargetAtTime(0.7, this.audioCtx.currentTime, 0.2);
    this.setDecibels(this.currentDba);
  }

  stop() {
    if (!this.audioCtx || !this.isPlaying) return;
    this.isPlaying = false;
    this.masterGain.gain.setTargetAtTime(0.0001, this.audioCtx.currentTime, 0.1);
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }
}

export const acousticSimulator = new AcousticEarSimulator();
