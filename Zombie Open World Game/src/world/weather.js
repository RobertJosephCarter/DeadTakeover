/** Weather system — particle-based rain / snow / ash / dust / fog overlays.
 *
 *  The system owns its internal state (particles, velocities, wind, type)
 *  and exposes a small API so the main game loop only needs to call
 *  `init` on map change and `update` each frame.
 */

import * as THREE from "three";

/** Create a fresh weather controller. */
export function createWeather(scene) {
  // Lightning flash light — only active during rain weather.
  const lightningLight = new THREE.DirectionalLight(0xddeeff, 0);
  lightningLight.position.set(20, 80, -10);
  scene.add(lightningLight);

  const state = {
    scene,
    active: false,
    type: null,
    intensity: 0,
    particles: null,
    velocities: null,
    windDir: new THREE.Vector3(1, 0, 0.3).normalize(),
    timer: 0,
    nextChange: 30 + Math.random() * 60,
    // Lightning state
    lightningLight,
    lightningTimer: 0,
    lightningFlashLife: 0,
    nextLightning: 8 + Math.random() * 12,
  };
  return state;
}

/** Roll for and spawn weather based on the active map's `weather` config. */
export function initWeather(state, mapWeather) {
  clearWeather(state);

  if (!mapWeather || Math.random() > mapWeather.chance) {
    state.active = false;
    return;
  }
  state.active = true;
  state.type = mapWeather.type;
  state.intensity = mapWeather.intensity;
  state.timer = 0;
  state.windDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();

  const count = Math.floor(400 * mapWeather.intensity);
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  // Type-specific fall speeds
  const verticalVel = (type) => {
    if (type === "snow") return -0.3 - Math.random() * 0.8;
    if (type === "ash") return -0.1 - Math.random() * 0.4;
    return -3 - Math.random() * 4; // rain / dust / fog
  };

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = Math.random() * 40 + 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    velocities[i * 3] = state.windDir.x * (0.5 + Math.random() * 2);
    velocities[i * 3 + 1] = verticalVel(mapWeather.type);
    velocities[i * 3 + 2] = state.windDir.z * (0.5 + Math.random() * 2);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  let color = 0xaaccff;
  let opacity = 0.45;
  let size = 0.08;
  if (mapWeather.type === "snow") { color = 0xffffff; opacity = 0.65; size = 0.12; }
  else if (mapWeather.type === "ash") { color = 0x554433; opacity = 0.35; size = 0.06; }
  else if (mapWeather.type === "dust") { color = 0xc4a060; opacity = 0.3; size = 0.05; }
  else if (mapWeather.type === "fog") { opacity = 0.25; size = 0.04; }

  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity,
    depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  state.scene.add(points);
  state.particles = points;
  state.velocities = velocities;
}

/** Advance particles each frame. Wraps them within ±50 of the player. */
export function updateWeather(state, dt, playerPosition) {
  if (!state.active || !state.particles) return;
  const positions = state.particles.geometry.attributes.position.array;
  const count = positions.length / 3;
  const px = playerPosition.x;
  const pz = playerPosition.z;

  for (let i = 0; i < count; i++) {
    positions[i * 3] += state.velocities[i * 3] * dt;
    positions[i * 3 + 1] += state.velocities[i * 3 + 1] * dt;
    positions[i * 3 + 2] += state.velocities[i * 3 + 2] * dt;

    // Recycle particles that fell out of range
    if (positions[i * 3 + 1] < 0 || positions[i * 3 + 1] > 45) {
      positions[i * 3] = px + (Math.random() - 0.5) * 70;
      positions[i * 3 + 1] = 35 + Math.random() * 10;
      positions[i * 3 + 2] = pz + (Math.random() - 0.5) * 70;
    }
    if (Math.abs(positions[i * 3] - px) > 50) {
      positions[i * 3] = px + (Math.random() - 0.5) * 60;
    }
    if (Math.abs(positions[i * 3 + 2] - pz) > 50) {
      positions[i * 3 + 2] = pz + (Math.random() - 0.5) * 60;
    }
  }
  state.particles.geometry.attributes.position.needsUpdate = true;

  // ─── Lightning ─────────────────────────────────────────────────────────────
  // Only during rain (including the Outbreak City rain). Random flashes with
  // double-strike timing for realism.
  if (state.type === "rain") {
    state.lightningTimer += dt;
    // Trigger a new flash
    if (state.lightningTimer >= state.nextLightning) {
      state.lightningTimer = 0;
      state.nextLightning = 6 + Math.random() * 18; // 6-24 seconds between strikes
      state.lightningFlashLife = 0.12 + Math.random() * 0.08; // 120-200ms flash
      state.lightningLight.intensity = 3.5 + Math.random() * 2.5;
      // Randomise direction slightly
      state.lightningLight.position.set(
        (Math.random() - 0.5) * 60,
        70 + Math.random() * 20,
        (Math.random() - 0.5) * 60,
      );
    }
    // Decay the flash
    if (state.lightningFlashLife > 0) {
      state.lightningFlashLife -= dt;
      state.lightningLight.intensity *= Math.exp(-dt * 25);
      if (state.lightningFlashLife <= 0) {
        state.lightningLight.intensity = 0;
      }
    }
  } else {
    state.lightningLight.intensity = 0;
  }
}

/** Stop active weather and dispose all particle resources. */
export function clearWeather(state) {
  if (state.particles) {
    const particleObjects = Array.isArray(state.particles) ? state.particles : [state.particles];
    for (const obj of particleObjects) {
      if (!obj) continue;
      state.scene.remove(obj);
      obj.geometry?.dispose?.();
      obj.material?.dispose?.();
    }
    state.particles = null;
  }
  state.velocities = null;
  state.active = false;
}
