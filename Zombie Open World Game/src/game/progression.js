/** Global progression system for DeadTakeover.
 *  XP and levels persist between runs via localStorage.
 */

import { debugWarn } from "../core/debug.js";

export const LEVEL_THRESHOLDS = {
  1: 0,
  2: 200,
  3: 500,
  4: 900,
  5: 1400,
  6: 2000,
  7: 2700,
  8: 3500,
  9: 4400,
  10: 5400,
  11: 6500,
  12: 7700,
  13: 9000,
  14: 10400,
  15: 11900,
  16: 13500,
  17: 15200,
  18: 17000,
  19: 18900,
  20: 20900,
};

export const UNLOCKS = {
  3: { type: "weapon", id: 3, name: "Crossbow" },
  5: { type: "vehicle", id: "motorcycle", name: "Motorcycle" },
  6: { type: "weapon", id: 7, name: "SMG" },
  8: { type: "weapon", id: 4, name: "Flamethrower" },
  10: { type: "weapon", id: 8, name: "Revolver" },
  12: { type: "weapon", id: 5, name: "Sniper Rifle" },
  15: { type: "weapon", id: 6, name: "Rocket Launcher" },
  18: { type: "weapon", id: 9, name: "Minigun" },
  20: { type: "vehicle", id: "truck", name: "Truck + Mounted Gun" },
};

const STORAGE_KEY = "deadtakeover_progression";

export function loadProgression() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      // Migrate old saves where xp was tracked per-level rather than cumulative.
      // If totalXP is missing or smaller than xp, recompute totalXP from level + xp.
      if (typeof p.totalXP !== "number") p.totalXP = (LEVEL_THRESHOLDS[p.level] || 0) + (p.xp || 0);
      return p;
    }
  } catch (err) {
    debugWarn("loadProgression failed", err);
  }
  return { level: 1, xp: 0, totalXP: 0, unlocks: [] };
}

export function saveProgression(progression) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progression));
  } catch (err) {
    debugWarn("saveProgression failed", err);
  }
}

/** Compute level from a cumulative totalXP value. */
function levelFromTotalXP(totalXP) {
  let level = 1;
  for (let n = 2; n <= 20; n++) {
    if (totalXP >= LEVEL_THRESHOLDS[n]) level = n;
    else break;
  }
  return level;
}

export function addGlobalXP(progression, amount) {
  if (amount <= 0) return { leveled: false, newUnlocks: [] };
  const previousLevel = progression.level;
  progression.totalXP += amount;
  progression.level = levelFromTotalXP(progression.totalXP);
  // xp = progress into the current level (cumulative xp minus current level threshold)
  progression.xp = progression.totalXP - (LEVEL_THRESHOLDS[progression.level] || 0);

  const newUnlocks = [];
  let leveled = progression.level > previousLevel;
  if (leveled) {
    for (let lvl = previousLevel + 1; lvl <= progression.level; lvl++) {
      const unlock = UNLOCKS[lvl];
      if (unlock && !progression.unlocks.some((u) => u.type === unlock.type && u.id === unlock.id)) {
        progression.unlocks.push(unlock);
        newUnlocks.push(unlock);
      }
    }
  }

  saveProgression(progression);
  return { leveled, newUnlocks };
}

/** XP needed within the current level to reach the next level (max-cap returns 0). */
export function getXPToNextLevel(progression) {
  const nextThreshold = LEVEL_THRESHOLDS[progression.level + 1];
  if (nextThreshold === undefined) return 0;
  const currentThreshold = LEVEL_THRESHOLDS[progression.level] || 0;
  return nextThreshold - currentThreshold - progression.xp;
}

/** Total XP cost of the current level band (for HUD: xp / xpNeededForLevel). */
export function getXPForCurrentLevel(progression) {
  const next = LEVEL_THRESHOLDS[progression.level + 1];
  if (next === undefined) return 0;
  return next - (LEVEL_THRESHOLDS[progression.level] || 0);
}



export function isUnlocked(progression, type, id) {
  return progression.unlocks.some((u) => u.type === type && u.id === id);
}

export function getLevel(progression) {
  return progression.level;
}

export function formatProgression(progression) {
  const needed = getXPForCurrentLevel(progression);
  if (needed === 0) return `Lvl ${progression.level} (MAX) | XP: ${progression.totalXP}`;
  return `Lvl ${progression.level} | XP: ${progression.xp} / ${needed}`;
}
