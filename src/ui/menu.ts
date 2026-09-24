import { AIRCRAFT_CONFIGS, AIRCRAFT_IDS } from "../physics/aircraftConfigs";
import { CITIES } from "../world/cities/cityRegistry";

export interface MenuSelection {
  aircraftId: string;
  cityId: string;
}

export class MainMenu {
  private root: HTMLDivElement;
  private aircraftId = "f18";
  private cityId = "montreal";

  constructor(private onStart: (selection: MenuSelection) => void) {
    this.root = document.createElement("div");
    this.root.id = "menu";
    this.root.innerHTML = `
      <div class="menu-panel">
        <h1>AERODYNE <span>Flight Simulator</span></h1>
        <p class="menu-sub">Runs entirely in your browser — no server, no downloads.</p>
        <div class="menu-columns">
          <div class="menu-col">
            <h2>Aircraft</h2>
            <div class="menu-list" data-el="aircraftList"></div>
          </div>
          <div class="menu-col">
            <h2>Location</h2>
            <div class="menu-list" data-el="cityList"></div>
            <h2 class="menu-controls-heading">Controls</h2>
            <ul class="menu-controls">
              <li><b>W/S</b> pitch &middot; <b>A/D</b> roll &middot; <b>Q/E</b> yaw</li>
              <li><b>Shift/Ctrl</b> throttle &middot; <b>Space</b> afterburner</li>
              <li><b>G</b> gear &middot; <b>F</b> flaps &middot; <b>B</b> speedbrake</li>
              <li><b>V</b> VTOL nozzle (F-35) &middot; <b>N</b> wing sweep (F-14)</li>
              <li><b>C</b> camera view &middot; drag mouse to orbit</li>
            </ul>
          </div>
        </div>
        <button class="menu-start" data-el="startBtn">Start Flight</button>
      </div>
    `;
    document.body.appendChild(this.root);

    const aircraftList = this.root.querySelector<HTMLElement>('[data-el="aircraftList"]')!;
    for (const id of AIRCRAFT_IDS) {
      const cfg = AIRCRAFT_CONFIGS[id];
      const item = document.createElement("button");
      item.className = "menu-item" + (id === this.aircraftId ? " selected" : "");
      item.textContent = cfg.displayName;
      item.addEventListener("click", () => {
        this.aircraftId = id;
        aircraftList.querySelectorAll(".menu-item").forEach((n) => n.classList.remove("selected"));
        item.classList.add("selected");
      });
      aircraftList.appendChild(item);
    }

    const cityList = this.root.querySelector<HTMLElement>('[data-el="cityList"]')!;
    for (const city of CITIES) {
      const item = document.createElement("button");
      item.className = "menu-item" + (city.id === this.cityId ? " selected" : "");
      item.textContent = city.name;
      item.addEventListener("click", () => {
        this.cityId = city.id;
        cityList.querySelectorAll(".menu-item").forEach((n) => n.classList.remove("selected"));
        item.classList.add("selected");
      });
      cityList.appendChild(item);
    }

    this.root.querySelector<HTMLButtonElement>('[data-el="startBtn"]')!.addEventListener("click", () => {
      this.hide();
      this.onStart({ aircraftId: this.aircraftId, cityId: this.cityId });
    });
  }

  hide(): void {
    this.root.style.display = "none";
  }

  show(): void {
    this.root.style.display = "flex";
  }
}
