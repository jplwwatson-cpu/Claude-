import type { ControlInputs, FlightTelemetry } from "../physics/flightModel";

/**
 * Fully procedural cockpit audio — engine drone, wind roar, afterburner
 * rumble, and a sonic-boom one-shot — synthesized with the Web Audio API.
 * No audio files, so there's nothing to download at runtime.
 */
export class EngineAudio {
  private ctx: AudioContext | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private abGain: GainNode | null = null;
  private abFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private wasSupersonic = false;
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    this.ctx = ctx;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.55;
    this.masterGain.connect(ctx.destination);

    // Engine drone: two detuned sawtooth oscillators through a lowpass.
    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = 0.05;
    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 900;
    this.engineOsc1 = ctx.createOscillator();
    this.engineOsc1.type = "sawtooth";
    this.engineOsc1.frequency.value = 70;
    this.engineOsc2 = ctx.createOscillator();
    this.engineOsc2.type = "sawtooth";
    this.engineOsc2.frequency.value = 71.5;
    this.engineOsc1.connect(engineFilter);
    this.engineOsc2.connect(engineFilter);
    engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    this.engineOsc1.start();
    this.engineOsc2.start();

    // Wind: filtered looping white noise, level/brightness scale with airspeed.
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    this.windSource = ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = "bandpass";
    this.windFilter.frequency.value = 400;
    this.windFilter.Q.value = 0.6;
    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;
    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    this.windSource.start();

    // Afterburner rumble: low sawtooth burst, gated by throttle/afterburner state.
    const abOsc = ctx.createOscillator();
    abOsc.type = "sawtooth";
    abOsc.frequency.value = 45;
    this.abFilter = ctx.createBiquadFilter();
    this.abFilter.type = "lowpass";
    this.abFilter.frequency.value = 300;
    this.abGain = ctx.createGain();
    this.abGain.gain.value = 0;
    abOsc.connect(this.abFilter);
    this.abFilter.connect(this.abGain);
    this.abGain.connect(this.masterGain);
    abOsc.start();
  }

  update(controls: ControlInputs, telemetry: FlightTelemetry): void {
    if (!this.ctx || !this.engineOsc1 || !this.engineOsc2 || !this.engineGain || !this.windGain || !this.windFilter || !this.abGain) return;
    const t = this.ctx.currentTime;
    const smoothing = 0.08;

    const throttle = THREE_clamp(controls.throttle);
    const engineFreq = 55 + throttle * 170;
    this.engineOsc1.frequency.setTargetAtTime(engineFreq, t, smoothing);
    this.engineOsc2.frequency.setTargetAtTime(engineFreq * 1.021, t, smoothing);
    this.engineGain.gain.setTargetAtTime(0.04 + throttle * 0.1, t, smoothing);

    const speedT = THREE_clamp(telemetry.airspeed / 300);
    this.windGain.gain.setTargetAtTime(speedT * 0.22, t, smoothing);
    this.windFilter.frequency.setTargetAtTime(250 + speedT * 2200, t, smoothing);

    const abTarget = controls.afterburner ? 0.22 : 0;
    this.abGain.gain.setTargetAtTime(abTarget, t, 0.15);

    const supersonic = telemetry.mach > 1.0;
    if (supersonic && !this.wasSupersonic) this.playSonicBoom();
    this.wasSupersonic = supersonic;
  }

  private playSonicBoom(): void {
    const ctx = this.ctx;
    if (!ctx || !this.masterGain) return;
    const dur = 0.6;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const env = Math.exp(-i / (ctx.sampleRate * 0.08));
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(4000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + dur);
    const gain = ctx.createGain();
    gain.gain.value = 0.8;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }
}

function THREE_clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}
