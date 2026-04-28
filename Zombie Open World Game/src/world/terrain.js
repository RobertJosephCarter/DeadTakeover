/** Pure terrain math — height field and normal computation.
 *
 *  These helpers only depend on the active map's noise/height parameters.
 *  Chunk streaming, tree placement, and structure spawning still live in
 *  main.js because they touch many shared collections (trees[], visionBlockers[],
 *  structureGroups[], etc.) — extracting them would require threading those
 *  collections through arguments and isn't worth the noise.
 */

import * as THREE from "three";

/** 3-octave deterministic pseudo-noise. Same x,z always yields the same value
 *  so chunk borders never visibly seam.
 */
export function noise2D(x, z, freq = 1) {
  const f = freq;
  const n1 = Math.sin(x * 0.045 * f) * 5.2 + Math.cos(z * 0.046 * f) * 5.2;
  const n2 = Math.sin((x + z) * 0.09 * f) * 1.8 + Math.cos((x - z) * 0.08 * f) * 1.5;
  const n3 = Math.sin(x * 0.16 * f + z * 0.12 * f) * 0.8;
  return n1 + n2 + n3;
}

/** Sampled terrain height at world-space (x, z). Flat maps return 0. */
export function terrainHeight(x, z, mapConfig) {
  if (mapConfig.flatTerrain) return 0;
  return noise2D(x, z, mapConfig.noiseFreq) * mapConfig.heightAmp;
}

const _normal = new THREE.Vector3();

/** Numerical surface normal sampled around (x, z). */
export function terrainNormal(x, z, mapConfig) {
  if (mapConfig.flatTerrain) return _normal.set(0, 1, 0);
  const eps = 0.8;
  const hL = terrainHeight(x - eps, z, mapConfig);
  const hR = terrainHeight(x + eps, z, mapConfig);
  const hD = terrainHeight(x, z - eps, mapConfig);
  const hU = terrainHeight(x, z + eps, mapConfig);
  return _normal.set(hL - hR, 2 * eps, hD - hU).normalize();
}
