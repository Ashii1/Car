import * as THREE from 'three';
import { TimeOfDay } from '../types/openCity';

export interface SunShadowProfile {
  sunOffset: THREE.Vector3;
  sunColor: THREE.Color;
  sunIntensity: number;
  frustumHalfSize: number;
  near: number;
  far: number;
  bias: number;
  normalBias: number;
  radius: number;
  ambientColor: THREE.Color;
  ambientIntensity: number;
  hemiSkyColor: THREE.Color;
  hemiGroundColor: THREE.Color;
  hemiIntensity: number;
  fogColor: THREE.Color;
  fogDensity: number;
}

// Physically grounded solar & shadow presets for each time of day
export const SUN_SHADOW_PROFILES: Record<TimeOfDay, SunShadowProfile> = {
  // 1. MORNING (Sunrise / Dawn Golden Glow)
  // Low elevation angle on Eastern horizon (~22°).
  // Long, dramatic morning shadows stretching westward across boulevards.
  // Warm atmospheric scattering produces diffuse penumbra.
  morning: {
    sunOffset: new THREE.Vector3(-145, 72, 85),
    sunColor: new THREE.Color(0xffe2be),
    sunIntensity: 2.45,
    frustumHalfSize: 135,
    near: 5.0,
    far: 490.0,
    bias: -0.00035,
    normalBias: 0.038,
    radius: 2.8,
    ambientColor: new THREE.Color(0xffe8d6),
    ambientIntensity: 1.15,
    hemiSkyColor: new THREE.Color(0xffe5cc),
    hemiGroundColor: new THREE.Color(0x3e3025),
    hemiIntensity: 1.1,
    fogColor: new THREE.Color(0xfed7aa),
    fogDensity: 0.00095,
  },

  // 2. AFTERNOON (Midday Crisp Solar Zenith)
  // High elevation angle (~68°), slightly south-southwest.
  // Razor-sharp, high-contrast contact shadows directly beneath vehicles, spoilers, wheels, and street furniture.
  // Compact shadow frustum yields maximum shadow-map resolution.
  afternoon: {
    sunOffset: new THREE.Vector3(58, 220, 68),
    sunColor: new THREE.Color(0xfffcf5),
    sunIntensity: 2.8,
    frustumHalfSize: 95,
    near: 10.0,
    far: 430.0,
    bias: -0.0002,
    normalBias: 0.022,
    radius: 1.15,
    ambientColor: new THREE.Color(0xfffaed),
    ambientIntensity: 1.2,
    hemiSkyColor: new THREE.Color(0x87ceeb),
    hemiGroundColor: new THREE.Color(0x3a4835),
    hemiIntensity: 1.25,
    fogColor: new THREE.Color(0xb0d5f8),
    fogDensity: 0.00085,
  },

  // 3. SUNSET (Golden Hour & Cinematic Raking Shadows)
  // Sun sinking low on the Western horizon (~14° elevation).
  // Ultra-long cinematic shadows cast eastward across multi-lane highways and toll plazas.
  // Rich radiant amber/tangerine glow with high normal-bias to eliminate low-angle grazing shadow acne.
  sunset: {
    sunOffset: new THREE.Vector3(185, 48, -78),
    sunColor: new THREE.Color(0xf97316),
    sunIntensity: 2.25,
    frustumHalfSize: 145,
    near: 5.0,
    far: 530.0,
    bias: -0.00045,
    normalBias: 0.048,
    radius: 3.4,
    ambientColor: new THREE.Color(0xfb923c),
    ambientIntensity: 1.25,
    hemiSkyColor: new THREE.Color(0xf472b6),
    hemiGroundColor: new THREE.Color(0x451a03),
    hemiIntensity: 1.15,
    fogColor: new THREE.Color(0xea580c),
    fogDensity: 0.0011,
  },

  // 4. NIGHT (Celestial Moonlight)
  // Elevated cool silver-blue moonlight (~52°).
  // Atmospheric nighttime contact shadows grounding vehicles under moonlight,
  // working in harmony with dynamic streetlamps and vehicle LED headlights.
  night: {
    sunOffset: new THREE.Vector3(92, 168, 92),
    sunColor: new THREE.Color(0x60a5fa),
    sunIntensity: 0.45,
    frustumHalfSize: 90,
    near: 10.0,
    far: 390.0,
    bias: -0.0003,
    normalBias: 0.03,
    radius: 2.2,
    ambientColor: new THREE.Color(0x334155),
    ambientIntensity: 0.65,
    hemiSkyColor: new THREE.Color(0x1e293b),
    hemiGroundColor: new THREE.Color(0x0f172a),
    hemiIntensity: 0.55,
    fogColor: new THREE.Color(0x070b14),
    fogDensity: 0.0018,
  },
};

export class DynamicSunShadowSystem {
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.AmbientLight;
  private hemiLight?: THREE.HemisphereLight;
  private sceneFog?: THREE.FogExp2 | THREE.Fog | null;

  private currentTimeOfDay: TimeOfDay = 'afternoon';

  // Interpolated working states
  private currentSunOffset = new THREE.Vector3();
  private currentSunColor = new THREE.Color();
  private currentSunIntensity = 2.8;
  private currentFrustumHalfSize = 95;
  private currentNear = 10;
  private currentFar = 430;
  private currentBias = -0.0002;
  private currentNormalBias = 0.022;
  private currentRadius = 1.15;

  private currentAmbientColor = new THREE.Color();
  private currentAmbientIntensity = 1.2;

  private currentHemiSkyColor = new THREE.Color();
  private currentHemiGroundColor = new THREE.Color();
  private currentHemiIntensity = 1.25;

  private currentFogColor = new THREE.Color();
  private currentFogDensity = 0.00085;

  // Smoothed player tracking anchor to prevent shadow jitter at high speeds
  private smoothedTargetAnchor = new THREE.Vector3();
  private tempTargetAnchor = new THREE.Vector3();
  private isInitialized = false;

  constructor(
    sunLight: THREE.DirectionalLight,
    ambientLight: THREE.AmbientLight,
    hemiLight?: THREE.HemisphereLight,
    sceneFog?: THREE.FogExp2 | THREE.Fog | null
  ) {
    this.sunLight = sunLight;
    this.ambientLight = ambientLight;
    this.hemiLight = hemiLight;
    this.sceneFog = sceneFog;

    // Apply high-performance shadow settings to sun directional light
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 512;
    this.sunLight.shadow.mapSize.height = 512;
  }

  /**
   * Set current time of day state.
   * If instant is true, snaps values without transition interpolation (useful for boot).
   */
  public setTimeOfDay(timeOfDay: TimeOfDay, instant = false): void {
    this.currentTimeOfDay = timeOfDay;
    const target = SUN_SHADOW_PROFILES[timeOfDay] || SUN_SHADOW_PROFILES.afternoon;

    if (instant || !this.isInitialized) {
      this.currentSunOffset.copy(target.sunOffset);
      this.currentSunColor.copy(target.sunColor);
      this.currentSunIntensity = target.sunIntensity;
      this.currentFrustumHalfSize = target.frustumHalfSize;
      this.currentNear = target.near;
      this.currentFar = target.far;
      this.currentBias = target.bias;
      this.currentNormalBias = target.normalBias;
      this.currentRadius = target.radius;

      this.currentAmbientColor.copy(target.ambientColor);
      this.currentAmbientIntensity = target.ambientIntensity;

      this.currentHemiSkyColor.copy(target.hemiSkyColor);
      this.currentHemiGroundColor.copy(target.hemiGroundColor);
      this.currentHemiIntensity = target.hemiIntensity;

      this.currentFogColor.copy(target.fogColor);
      this.currentFogDensity = target.fogDensity;

      this.applyParametersToThreeObjects(true);
      this.isInitialized = true;
    }
  }

  /**
   * Main per-frame update loop.
   * Dynamically tracks target vehicle/player and smoothly blends light & shadow shifts.
   */
  public update(
    delta: number,
    timeOfDay: TimeOfDay,
    playerX: number,
    playerY: number,
    playerZ: number
  ): void {
    if (timeOfDay !== this.currentTimeOfDay) {
      this.setTimeOfDay(timeOfDay, false);
    }

    const targetProfile = SUN_SHADOW_PROFILES[this.currentTimeOfDay] || SUN_SHADOW_PROFILES.afternoon;
    const blendRate = Math.min(delta * 2.8, 1.0);

    // Smoothly interpolate solar direction vector & shadow properties
    this.currentSunOffset.lerp(targetProfile.sunOffset, blendRate);
    this.currentSunColor.lerp(targetProfile.sunColor, blendRate);
    this.currentSunIntensity = THREE.MathUtils.lerp(this.currentSunIntensity, targetProfile.sunIntensity, blendRate);
    this.currentFrustumHalfSize = THREE.MathUtils.lerp(this.currentFrustumHalfSize, targetProfile.frustumHalfSize, blendRate);
    this.currentNear = THREE.MathUtils.lerp(this.currentNear, targetProfile.near, blendRate);
    this.currentFar = THREE.MathUtils.lerp(this.currentFar, targetProfile.far, blendRate);
    this.currentBias = THREE.MathUtils.lerp(this.currentBias, targetProfile.bias, blendRate);
    this.currentNormalBias = THREE.MathUtils.lerp(this.currentNormalBias, targetProfile.normalBias, blendRate);
    this.currentRadius = THREE.MathUtils.lerp(this.currentRadius, targetProfile.radius, blendRate);

    // Smoothly interpolate ambient & hemisphere fill
    this.currentAmbientColor.lerp(targetProfile.ambientColor, blendRate);
    this.currentAmbientIntensity = THREE.MathUtils.lerp(this.currentAmbientIntensity, targetProfile.ambientIntensity, blendRate);

    this.currentHemiSkyColor.lerp(targetProfile.hemiSkyColor, blendRate);
    this.currentHemiGroundColor.lerp(targetProfile.hemiGroundColor, blendRate);
    this.currentHemiIntensity = THREE.MathUtils.lerp(this.currentHemiIntensity, targetProfile.hemiIntensity, blendRate);

    this.currentFogColor.lerp(targetProfile.fogColor, blendRate);
    this.currentFogDensity = THREE.MathUtils.lerp(this.currentFogDensity, targetProfile.fogDensity, blendRate);

    // Dynamic player tracking anchor: smoothly centers shadow frustum over active vehicle
    if (!this.isInitialized) {
      this.smoothedTargetAnchor.set(playerX, playerY + 0.6, playerZ);
      this.isInitialized = true;
    } else {
      const anchorFollowRate = Math.min(delta * 14.0, 1.0);
      this.tempTargetAnchor.set(playerX, playerY + 0.6, playerZ);
      this.smoothedTargetAnchor.lerp(this.tempTargetAnchor, anchorFollowRate);
    }

    // Position sun light relative to smoothed player anchor
    this.sunLight.target.position.copy(this.smoothedTargetAnchor);
    this.sunLight.position.set(
      this.smoothedTargetAnchor.x + this.currentSunOffset.x,
      this.smoothedTargetAnchor.y + this.currentSunOffset.y,
      this.smoothedTargetAnchor.z + this.currentSunOffset.z
    );
    this.sunLight.target.updateMatrixWorld();

    this.applyParametersToThreeObjects(false);
  }

  /**
   * Applies the current interpolated shadow and light settings to Three.js objects.
   */
  private applyParametersToThreeObjects(forceFrustumUpdate: boolean): void {
    // 1. Directional Sun Light
    this.sunLight.color.copy(this.currentSunColor);
    this.sunLight.intensity = this.currentSunIntensity;

    // 2. Dynamic Shadow Properties
    const shadow = this.sunLight.shadow;
    shadow.bias = this.currentBias;
    shadow.normalBias = this.currentNormalBias;
    shadow.radius = this.currentRadius;

    // 3. Shadow Camera Frustum Calculation
    const cam = shadow.camera;
    let frustumDirty = forceFrustumUpdate;

    if (Math.abs(cam.left - (-this.currentFrustumHalfSize)) > 0.5) {
      cam.left = -this.currentFrustumHalfSize;
      cam.right = this.currentFrustumHalfSize;
      cam.top = this.currentFrustumHalfSize;
      cam.bottom = -this.currentFrustumHalfSize;
      frustumDirty = true;
    }

    if (Math.abs(cam.near - this.currentNear) > 0.4 || Math.abs(cam.far - this.currentFar) > 1.0) {
      cam.near = this.currentNear;
      cam.far = this.currentFar;
      frustumDirty = true;
    }

    if (frustumDirty) {
      cam.updateProjectionMatrix();
    }

    // 4. Ambient & Hemisphere Light
    this.ambientLight.color.copy(this.currentAmbientColor);
    this.ambientLight.intensity = this.currentAmbientIntensity;

    if (this.hemiLight) {
      this.hemiLight.color.copy(this.currentHemiSkyColor);
      this.hemiLight.groundColor.copy(this.currentHemiGroundColor);
      this.hemiLight.intensity = this.currentHemiIntensity;
    }

    // 5. Atmospheric Fog
    if (this.sceneFog) {
      this.sceneFog.color.copy(this.currentFogColor);
      if ('density' in this.sceneFog) {
        this.sceneFog.density = this.currentFogDensity;
      }
    }
  }

  /**
   * Returns current solar azimuth and elevation angle in degrees for debugging / UI telemetry if needed.
   */
  public getSolarAngles(): { elevation: number; azimuth: number } {
    const x = this.currentSunOffset.x;
    const y = this.currentSunOffset.y;
    const z = this.currentSunOffset.z;
    const horizontalDist = Math.hypot(x, z);
    const elevation = (Math.atan2(y, horizontalDist) * 180) / Math.PI;
    const azimuth = (Math.atan2(x, z) * 180) / Math.PI;
    return { elevation, azimuth };
  }
}
