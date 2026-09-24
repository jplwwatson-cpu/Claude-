import * as THREE from "three";

/**
 * Generates a reflection/ambient-lighting environment map at runtime from the
 * current sky, via PMREMGenerator — gives PBR fuselage materials realistic
 * reflections without downloading an HDRI file.
 */
export class EnvironmentProbe {
  private pmrem: THREE.PMREMGenerator;
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private framesSinceUpdate = 0;

  constructor(private renderer: THREE.WebGLRenderer) {
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.pmrem.compileEquirectangularShader();
  }

  /** Call occasionally (not every frame) — regenerating the env map is not free. */
  refresh(scene: THREE.Scene): THREE.Texture {
    this.renderTarget?.dispose();
    this.renderTarget = this.pmrem.fromScene(scene, 0.02, 1, 15000);
    return this.renderTarget.texture;
  }

  shouldRefresh(intervalFrames = 90): boolean {
    this.framesSinceUpdate++;
    if (this.framesSinceUpdate >= intervalFrames) {
      this.framesSinceUpdate = 0;
      return true;
    }
    return false;
  }
}
