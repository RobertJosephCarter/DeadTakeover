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
  { name: "Rifle", ammoType: "5.56 AP", ammo: 30, reserve: 180, magSize: 30, damage: 24, fireDelay: 0.105, recoil: 0.9, range: 135, reloadTime: 1.45, bulletSpeed: 96, pierce: 1, unlocked: true },
  { name: "Pistol", ammoType: "9mm HP", ammo: 15, reserve: 105, magSize: 15, damage: 20, fireDelay: 0.18, recoil: 0.55, range: 100, reloadTime: 1.0, bulletSpeed: 88, critChance: 0.18, critMultiplier: 1.75, unlocked: true },
  { name: "Shotgun", ammoType: "12g Buck", ammo: 8, reserve: 40, magSize: 8, damage: 18, fireDelay: 0.78, recoil: 2.35, range: 34, reloadTime: 2.15, pellets: 10, pelletSpeed: 68, stagger: 0.26, unlocked: true },
  { name: "Crossbow", ammoType: "Bolts", ammo: 1, reserve: 28, magSize: 1, damage: 92, fireDelay: 0.95, recoil: 0.45, range: 190, reloadTime: 1.35, silent: true, bolt: true, bleedDamage: 26, retrieveChance: 0.35, unlocked: true },
  { name: "Flamethrower", ammoType: "Fuel", ammo: 120, reserve: 480, magSize: 120, damage: 5, fireDelay: 0.038, recoil: 0.15, range: 22, reloadTime: 2.6, continuous: true, burnDamage: 12, unlocked: true },
  { name: "Sniper", ammoType: ".308 Match", ammo: 5, reserve: 35, magSize: 5, damage: 125, fireDelay: 1.25, recoil: 2.9, range: 280, reloadTime: 2.45, bulletSpeed: 150, scope: true, adsRequired: true, pierce: 2, armorBreak: true, unlocked: true },
  { name: "Rocket", ammoType: "Rockets", ammo: 1, reserve: 7, magSize: 1, damage: 185, fireDelay: 1.7, recoil: 4.2, range: 135, reloadTime: 2.9, explosive: true, selfDamage: true, blastRadius: 12.5, rocketSpeed: 58, unlocked: true },
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
