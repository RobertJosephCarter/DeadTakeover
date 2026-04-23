/** Global progression system for DeadTakeover.
 *  XP and levels persist between runs via localStorage.
 */

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
  8: { type: "weapon", id: 4, name: "Flamethrower" },
  12: { type: "weapon", id: 5, name: "Sniper Rifle" },
  15: { type: "weapon", id: 6, name: "Rocket Launcher" },
  20: { type: "vehicle", id: "truck", name: "Truck + Mounted Gun" },
};

const STORAGE_KEY = "deadtakeover_progression";

export function loadProgression() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { level: 1, xp: 0, totalXP: 0, unlocks: [] };
}

export function saveProgression(progression) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progression));
  } catch { /* ignore */ }
}

export function addGlobalXP(progression, amount) {
  if (amount <= 0) return { leveled: false, newUnlocks: [] };
  progression.xp += amount;
  progression.totalXP += amount;
  const newUnlocks = [];
  let leveled = false;

  while (true) {
    const nextLevel = progression.level + 1;
    const threshold = LEVEL_THRESHOLDS[nextLevel];
    if (!threshold || progression.xp < threshold) break;
    progression.xp -= threshold;
    progression.level = nextLevel;
    leveled = true;
    const unlock = UNLOCKS[nextLevel];
    if (unlock) {
      progression.unlocks.push(unlock);
      newUnlocks.push(unlock);
    }
  }

  saveProgression(progression);
  return { leveled, newUnlocks };
}

export function getXPToNextLevel(progression) {
  const next = LEVEL_THRESHOLDS[progression.level + 1];
  if (!next) return 0;
  return next - progression.xp;
}

export function isUnlocked(progression, type, id) {
  return progression.unlocks.some((u) => u.type === type && u.id === id);
}

export function getLevel(progression) {
  return progression.level;
}

export function formatProgression(progression) {
  const next = getXPToNextLevel(progression);
  return `Lvl ${progression.level} | XP: ${progression.xp}${next > 0 ? ` / ${progression.xp + next}` : ""}`;
}
