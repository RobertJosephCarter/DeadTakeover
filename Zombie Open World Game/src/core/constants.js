export const SETTINGS = {
  walkSpeed: 9,
  sprintSpeed: 14,
  gravity: -24,
  jumpSpeed: 8.5,
  zombieSpeed: 4.1,
  runnerSpeed: 6.6,
  bruteSpeed: 2.55,
  zombieHitDistance: 1.2,
  zombieAttackEvery: 0.7,
  zombieDamage: 7,
  dayDuration: 180,
  maxZombies: 30,
};

export const WEAPON_DEFINITIONS = [
  { name: "Rifle", ammo: 20, reserve: 120, magSize: 20, damage: 26, fireDelay: 0.12, recoil: 1.0, range: 120, reloadTime: 1.25, unlocked: true },
  { name: "Pistol", ammo: 12, reserve: 84, magSize: 12, damage: 18, fireDelay: 0.2, recoil: 0.65, range: 95, reloadTime: 1.1, unlocked: true },
  { name: "Shotgun", ammo: 6, reserve: 30, magSize: 6, damage: 20, fireDelay: 0.85, recoil: 2.5, range: 25, reloadTime: 2.1, pellets: 8, unlocked: true },
  { name: "Crossbow", ammo: 1, reserve: 20, magSize: 1, damage: 85, fireDelay: 1.1, recoil: 0.8, range: 180, reloadTime: 1.6, silent: true, bolt: true, unlocked: true },
  { name: "Flamethrower", ammo: 100, reserve: 300, magSize: 100, damage: 4, fireDelay: 0.04, recoil: 0.2, range: 18, reloadTime: 2.5, continuous: true, unlocked: true },
  { name: "Sniper", ammo: 5, reserve: 25, magSize: 5, damage: 110, fireDelay: 1.4, recoil: 3.2, range: 250, reloadTime: 2.8, scope: true, adsRequired: true, unlocked: true },
  { name: "Rocket", ammo: 1, reserve: 5, magSize: 1, damage: 150, fireDelay: 1.6, recoil: 4.0, range: 120, reloadTime: 3.0, explosive: true, selfDamage: true, unlocked: true },
];

export const WEAPON_UPGRADES = {
  extendedMag: { id: "extendedMag", name: "Extended Mag", tier: 1, maxTier: 3, costPerTier: { scrap: 2, metal: 1 }, effect: "magSize", valuePerTier: 0.15 },
  damageBoost: { id: "damageBoost", name: "Damage Boost", tier: 1, maxTier: 3, costPerTier: { scrap: 1, metal: 2, chemicals: 1 }, effect: "damage", valuePerTier: 0.15 },
  laserSight: { id: "laserSight", name: "Laser Sight", tier: 0, maxTier: 1, costPerTier: { scrap: 3, metal: 2 }, effect: "laser", valuePerTier: 1 },
  suppressor: { id: "suppressor", name: "Suppressor", tier: 0, maxTier: 1, costPerTier: { scrap: 2, metal: 3, chemicals: 2 }, effect: "suppress", valuePerTier: 1 },
  fireRate: { id: "fireRate", name: "Fire Rate Mod", tier: 1, maxTier: 3, costPerTier: { scrap: 2, metal: 1, chemicals: 1 }, effect: "fireDelay", valuePerTier: -0.08 },
};

export const SKILLS_TEMPLATE = {
  reloadSpeed: { level: 0, max: 3, value: 0, name: "Fast Hands" },
  damage: { level: 0, max: 3, value: 0, name: "Power Shot" },
  health: { level: 0, max: 3, value: 0, name: "Toughness" },
  speed: { level: 0, max: 3, value: 0, name: "Agility" },
  headshotBonus: { level: 0, max: 3, value: 0, name: "Dead Eye" },
};

export const MATERIALS_TEMPLATE = {
  scrap: 0,
  wood: 0,
  metal: 0,
  cloth: 0,
  chemicals: 0,
};

export const CHUNK_SIZE = 60;
export const CHUNK_RADIUS = 2;

export const TITLE_BGM_FILE = "title.mp3";
