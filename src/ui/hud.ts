import type { FlightTelemetry, ControlInputs } from "../physics/flightModel";
import type { AircraftConfig } from "../physics/aircraftConfigs";
import type { CameraMode } from "../camera/cameraRig";

export class Hud {
  private root: HTMLDivElement;
  private els: Record<string, HTMLElement> = {};

  constructor() {
    this.root = document.createElement("div");
    this.root.id = "hud";
    this.root.innerHTML = `
      <div class="hud-corner hud-top-left">
        <div class="hud-aircraft" data-el="aircraftName"></div>
        <div class="hud-city" data-el="cityName"></div>
      </div>
      <div class="hud-corner hud-top-right">
        <div data-el="cameraMode" class="hud-mode"></div>
      </div>
      <div class="hud-speed-alt">
        <div class="hud-readout">
          <div class="hud-label">IAS</div>
          <div class="hud-value" data-el="speed">0</div>
          <div class="hud-unit">kt</div>
        </div>
        <div class="hud-readout">
          <div class="hud-label">ALT</div>
          <div class="hud-value" data-el="altitude">0</div>
          <div class="hud-unit">ft</div>
        </div>
      </div>
      <div class="hud-center-bottom">
        <div class="hud-heading" data-el="heading">000</div>
        <div class="hud-bars">
          <div class="hud-bar-track"><div class="hud-bar-fill" data-el="throttleBar"></div><span class="hud-bar-label">THR</span></div>
          <div class="hud-bar-track"><div class="hud-bar-fill hud-bar-g" data-el="gBar"></div><span class="hud-bar-label" data-el="gLabel">1.0G</span></div>
        </div>
        <div class="hud-status-row" data-el="statusRow"></div>
      </div>
      <div class="hud-warning" data-el="stallWarning">STALL</div>
      <div class="hud-mach" data-el="machReadout"></div>
    `;
    document.body.appendChild(this.root);
    this.root.querySelectorAll<HTMLElement>("[data-el]").forEach((el) => {
      this.els[el.dataset.el!] = el;
    });
  }

  setStaticInfo(config: AircraftConfig, cityName: string): void {
    this.els.aircraftName.textContent = config.displayName;
    this.els.cityName.textContent = cityName;
  }

  update(telemetry: FlightTelemetry, controls: ControlInputs, cameraMode: CameraMode): void {
    const kt = telemetry.airspeed * 1.94384;
    const ft = telemetry.altitude * 3.28084;
    this.els.speed.textContent = Math.round(kt).toString();
    this.els.altitude.textContent = Math.round(ft).toLocaleString();
    this.els.cameraMode.textContent = cameraMode.toUpperCase();

    const headingDeg = ((THREE_deg(telemetry.headingRad) % 360) + 360) % 360;
    this.els.heading.textContent = Math.round(headingDeg).toString().padStart(3, "0") + "°";

    this.els.throttleBar.style.height = `${Math.round(controls.throttle * 100)}%`;
    const gClamped = Math.max(-2, Math.min(10, telemetry.gForce));
    this.els.gBar.style.height = `${Math.round(((gClamped + 2) / 12) * 100)}%`;
    this.els.gLabel.textContent = `${telemetry.gForce.toFixed(1)}G`;

    this.els.stallWarning.style.opacity = telemetry.stalled && telemetry.altitudeAGL > 5 ? "1" : "0";
    this.els.machReadout.textContent = telemetry.mach > 0.55 ? `M ${telemetry.mach.toFixed(2)}` : "";

    const status: string[] = [];
    if (controls.gearDown) status.push("GEAR");
    if (controls.flaps > 0.05) status.push("FLAPS");
    if (controls.afterburner) status.push("A/B");
    if (controls.speedbrake) status.push("SPD BRK");
    if (telemetry.onGround) status.push("WOW");
    this.els.statusRow.textContent = status.join("  ·  ");
  }

  setVisible(visible: boolean): void {
    this.root.style.display = visible ? "block" : "none";
  }
}

function THREE_deg(rad: number): number {
  return (rad * 180) / Math.PI;
}
