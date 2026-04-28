/** Zombie mesh construction.
 *
 *  Builds the visual `THREE.Group` for each zombie type. Stats, AI state,
 *  and the zombies[] array still live in main.js — this module's job is
 *  only the geometry/material tree.
 *
 *  Materials and shared geometries are passed in as `assets` so the same
 *  textured material instances are reused across all zombies (this matters:
 *  per-instance materials would balloon GPU memory and break the existing
 *  texture-sharing optimization).
 */

import * as THREE from "three";

/** Zombie types that have unique behavior — used to flag isSpecial. */
export const SPECIAL_INFECTED_TYPES = ["spitter", "hunter", "charger", "juggernaut", "boomer", "screamer"];

/** All supported zombie types. */
export const ZOMBIE_TYPES = ["walker", "runner", "crawler", "brute", ...SPECIAL_INFECTED_TYPES];

/** Build the zombie mesh group at world position (x, y, z).
 *
 *  @param {Object} opts
 *  @param {string} opts.type
 *  @param {number} opts.x
 *  @param {number} opts.y           Terrain height at (x, z)
 *  @param {number} opts.z
 *  @param {Object} opts.assets      Shared materials + geometries (see below)
 *  @returns {{ group: THREE.Group, leftArm, rightArm, leftLeg, rightLeg }}
 *
 *  Required `assets` shape:
 *    geometries: { box, sphere, sphereLow }
 *    materials: {
 *      skin, cloth, blood,
 *      spitterSkin, spitterCloth, acidSac,
 *      hunterSkin, hunterCloth,
 *      chargerSkin, chargerCloth,
 *      juggernautSkin, juggernautCloth, juggernautArmor,
 *      boomerSkin, boomerCloth, boomerBloat,
 *      screamerSkin, screamerCloth,
 *      eyes: { walker, runner, brute, ... } — keyed by type, fallback used for missing keys
 *    }
 */
export function buildZombieMesh({ type, x, y, z, assets }) {
  const { geometries: g, materials: m } = assets;
  const group = new THREE.Group();

  const { skinMat, clothMat } = pickBodyMaterials(type, m);

  // Reuse shared geometries via scaling — avoids per-zombie BufferGeometry allocations.
  const hips = new THREE.Mesh(g.box, clothMat);
  hips.scale.set(0.78, 0.56, 0.42);
  const torso = new THREE.Mesh(g.box, clothMat);
  torso.scale.set(0.9, 0.9, 0.48);
  const head = new THREE.Mesh(g.sphere, skinMat);
  head.scale.set(0.3, 0.3, 0.3);
  const jaw = new THREE.Mesh(g.box, m.blood);
  jaw.scale.set(0.28, 0.12, 0.24);
  const leftArm = new THREE.Mesh(g.box, skinMat);
  leftArm.scale.set(0.22, 0.86, 0.22);
  const rightArm = new THREE.Mesh(g.box, skinMat);
  rightArm.scale.set(0.22, 0.86, 0.22);
  const leftLeg = new THREE.Mesh(g.box, clothMat);
  leftLeg.scale.set(0.24, 0.96, 0.24);
  const rightLeg = new THREE.Mesh(g.box, clothMat);
  rightLeg.scale.set(0.24, 0.96, 0.24);

  // Charger has one massive arm
  if (type === "charger") {
    rightArm.scale.set(0.396, 1.118, 0.308);
    rightArm.position.x = 0.7;
  }

  torso.position.set(0, 1.48, 0);
  hips.position.set(0, 1.0, 0);
  head.position.set(0, 2.14, 0.02);
  jaw.position.set(0, 1.93, 0.2);
  leftArm.position.set(-0.56, 1.47, 0);
  rightArm.position.set(0.56, 1.47, 0);
  leftLeg.position.set(-0.23, 0.45, 0);
  rightLeg.position.set(0.23, 0.45, 0);

  const eyeMat = m.eyes[type] || m.eyes.walker;
  const eyeLeft = new THREE.Mesh(g.sphereLow, eyeMat);
  eyeLeft.scale.set(0.04, 0.04, 0.04);
  const eyeRight = new THREE.Mesh(g.sphereLow, eyeMat);
  eyeRight.scale.set(0.04, 0.04, 0.04);
  eyeLeft.position.set(-0.1, 2.2, 0.26);
  eyeRight.position.set(0.1, 2.2, 0.26);

  // Type-specific extras
  if (type === "spitter") {
    const acidSac = new THREE.Mesh(g.sphere, m.acidSac);
    acidSac.scale.set(0.45, 0.45, 0.45);
    acidSac.position.set(0, 1.8, -0.35);
    group.add(acidSac);
  }

  if (type === "juggernaut") {
    const chestPlate = new THREE.Mesh(g.box, m.juggernautArmor);
    chestPlate.scale.set(0.94, 0.72, 0.52);
    chestPlate.position.set(0, 1.48, 0.04);
    const shoulderL = new THREE.Mesh(g.sphere, m.juggernautArmor);
    shoulderL.scale.set(0.18, 0.18, 0.18);
    shoulderL.position.set(-0.62, 1.82, 0);
    const shoulderR = new THREE.Mesh(g.sphere, m.juggernautArmor);
    shoulderR.scale.set(0.18, 0.18, 0.18);
    shoulderR.position.set(0.62, 1.82, 0);
    group.add(chestPlate, shoulderL, shoulderR);
  }

  if (type === "boomer") {
    const bloat = new THREE.Mesh(g.sphere, m.boomerBloat);
    bloat.scale.set(0.52, 0.48, 0.44);
    bloat.position.set(0, 1.42, 0.18);
    group.add(bloat);
  }

  if (type === "screamer") {
    jaw.scale.set(0.38, 0.18, 0.30);
    jaw.position.set(0, 1.88, 0.28);
    const throat = new THREE.Mesh(g.sphere, m.screamerSkin);
    throat.scale.set(0.18, 0.22, 0.18);
    throat.position.set(0, 1.72, 0.06);
    group.add(throat);
  }

  group.add(hips, torso, head, jaw, leftArm, rightArm, leftLeg, rightLeg, eyeLeft, eyeRight);
  group.position.set(x, y, z);

  // Per-instance silhouette variation — scales individual body parts ±6% so
  // crowds don't look identical. No allocation cost; reuses shared meshes.
  const v = (range) => 1 + (Math.random() - 0.5) * range;
  hips.scale.multiplyScalar(v(0.10));
  torso.scale.multiplyScalar(v(0.10));
  head.scale.multiplyScalar(v(0.12));
  leftArm.scale.y *= v(0.12);
  rightArm.scale.y *= v(0.12);
  leftLeg.scale.y *= v(0.10);
  rightLeg.scale.y *= v(0.10);
  // Slight head/jaw rotation jitter so the front line doesn't all stare straight ahead.
  head.rotation.y = (Math.random() - 0.5) * 0.6;
  head.rotation.z = (Math.random() - 0.5) * 0.25;
  jaw.rotation.x = (Math.random() - 0.5) * 0.3;

  // Body-scale per type
  if (type === "brute") group.scale.setScalar(1.25);
  else if (type === "runner") group.scale.set(0.92, 0.92, 0.92);
  else if (type === "charger") group.scale.set(1.15, 1.1, 1.15);
  else if (type === "hunter") group.scale.set(0.88, 0.95, 0.88);
  else if (type === "crawler") group.scale.set(0.95, 0.55, 0.95);
  else if (type === "juggernaut") group.scale.setScalar(1.45);
  else if (type === "boomer") group.scale.set(1.05, 1.15, 1.05);
  else if (type === "screamer") group.scale.set(0.92, 1.02, 0.92);

  // Zombie shadow casters are one of the biggest frame-time costs during hordes.
  // Keep receiveShadow false and disable per-zombie casting for stable gameplay FPS.
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.castShadow = false;
  });

  return { group, leftArm, rightArm, leftLeg, rightLeg };
}

/** Pick body materials based on type. Defaults to plain walker materials. */
function pickBodyMaterials(type, m) {
  switch (type) {
    case "spitter":     return { skinMat: m.spitterSkin,     clothMat: m.spitterCloth };
    case "hunter":      return { skinMat: m.hunterSkin,      clothMat: m.hunterCloth };
    case "charger":     return { skinMat: m.chargerSkin,     clothMat: m.chargerCloth };
    case "juggernaut":  return { skinMat: m.juggernautSkin,  clothMat: m.juggernautCloth };
    case "boomer":      return { skinMat: m.boomerSkin,      clothMat: m.boomerCloth };
    case "screamer":    return { skinMat: m.screamerSkin,    clothMat: m.screamerCloth };
    default:            return { skinMat: m.skin,            clothMat: m.cloth };
  }
}

/** Default stats per type. Wave-based HP scaling is applied by the caller. */
export function statsForType(type, settings) {
  switch (type) {
    case "brute":      return { hp: 120, speed: settings.bruteSpeed,           damage: 15 };
    case "runner":     return { hp: 36,  speed: settings.runnerSpeed,          damage: 5 };
    case "crawler":    return { hp: 40,  speed: settings.zombieSpeed * 0.6,    damage: 10 };
    case "spitter":    return { hp: 45,  speed: settings.zombieSpeed * 0.85,   damage: 4 };
    case "hunter":     return { hp: 38,  speed: settings.runnerSpeed * 1.3,    damage: 12 };
    case "charger":    return { hp: 95,  speed: settings.zombieSpeed * 1.15,   damage: 18 };
    case "juggernaut": return { hp: 300, speed: settings.zombieSpeed * 0.4,    damage: 22 };
    case "boomer":     return { hp: 60,  speed: settings.zombieSpeed * 0.7,    damage: 6 };
    case "screamer":   return { hp: 40,  speed: settings.zombieSpeed * 1.2,    damage: 3 };
    default:           return { hp: 60,  speed: settings.zombieSpeed,          damage: settings.zombieDamage };
  }
}

/** Roll a zombie type for the current wave. Returns one of ZOMBIE_TYPES. */
export function rollZombieType(wave) {
  const roll = Math.random();
  const specialChance = Math.min(0.30, wave * 0.025);
  const newTypeChance = wave >= 3 ? Math.min(0.12, (wave - 2) * 0.015) : 0;

  if (roll < 0.10) return "brute";
  if (roll < 0.28) return "runner";
  if (roll < 0.36) return "crawler";

  if (roll < 0.36 + specialChance) {
    const specialRoll = Math.random();
    if (specialRoll < 0.25) return "spitter";
    if (specialRoll < 0.50) return "hunter";
    if (specialRoll < 0.75) return "charger";
    if (wave >= 3 && specialRoll < 0.85) {
      const newRoll = Math.random();
      if (newRoll < 0.33) return "juggernaut";
      if (newRoll < 0.66) return "boomer";
      return "screamer";
    }
    return "charger";
  }

  if (roll < 0.36 + specialChance + newTypeChance) {
    const newRoll = Math.random();
    if (newRoll < 0.33) return "juggernaut";
    if (newRoll < 0.66) return "boomer";
    return "screamer";
  }

  return "walker";
}
