/** Map-specific boss zombie configurations.
 *
 *  Each entry adjusts the existing boss mesh + stats so the player faces
 *  something visually distinct on each map without needing a unique mesh
 *  builder per boss. The default mesh in spawnBoss() is a brute-shaped
 *  zombie; these configs only tint materials, scale, and tweak stats.
 *
 *  Used by main.js spawnBoss() — see resolveBossFlavor().
 */

export const BOSS_FLAVORS = {
  meadows: {
    name: "The Overgrown",
    skinColor: 0x3a4a22,        // mossy green skin
    bodyColor: 0x1c1f10,
    eyeColor: 0x88ff44,
    scale: 2.45,
    hpMult: 1.0,
    speedMult: 1.0,
    damageMult: 1.0,
    rewardMult: 1.0,
  },
  dead_valley: {
    name: "Mist Walker",
    skinColor: 0x5a5a52,
    bodyColor: 0x141414,
    eyeColor: 0xeaeaea,         // dim white — almost invisible in fog
    scale: 2.35,
    hpMult: 0.9,
    speedMult: 1.15,            // faster but slightly squishier
    damageMult: 1.0,
    rewardMult: 1.05,
  },
  frost: {
    name: "Frostbite",
    skinColor: 0xa8c8d8,
    bodyColor: 0x2a3840,
    eyeColor: 0x66ddff,
    scale: 2.55,
    hpMult: 1.15,
    speedMult: 0.9,             // slower tank
    damageMult: 1.05,
    rewardMult: 1.1,
  },
  badlands: {
    name: "Rustlung",
    skinColor: 0x8a4a2a,
    bodyColor: 0x2a1810,
    eyeColor: 0xff5500,
    scale: 2.6,
    hpMult: 1.2,                // chunky armored brute
    speedMult: 0.85,
    damageMult: 1.15,
    rewardMult: 1.15,
  },
  ruins: {
    name: "Concrete Reaper",
    skinColor: 0x4a4a52,
    bodyColor: 0x121218,
    eyeColor: 0xff2244,
    scale: 2.4,
    hpMult: 1.0,
    speedMult: 1.0,
    damageMult: 1.1,
    rewardMult: 1.0,
  },
  outbreak_city: {
    name: "Patient Zero",
    skinColor: 0x2a2014,
    bodyColor: 0x080808,
    eyeColor: 0xff0033,
    scale: 2.5,
    hpMult: 1.25,
    speedMult: 1.05,
    damageMult: 1.15,
    rewardMult: 1.2,
  },
};

/** Default fallback if a new map id is added before its flavor is. */
const DEFAULT_FLAVOR = {
  name: "Brute",
  skinColor: 0x243018,
  bodyColor: 0x101008,
  eyeColor: 0xff2200,
  scale: 2.35,
  hpMult: 1.0,
  speedMult: 1.0,
  damageMult: 1.0,
  rewardMult: 1.0,
};

export function resolveBossFlavor(mapId) {
  return BOSS_FLAVORS[mapId] || DEFAULT_FLAVOR;
}
