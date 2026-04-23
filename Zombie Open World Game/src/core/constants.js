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
  { name: "Rifle", ammo: 20, reserve: 120, magSize: 20, damage: 26, fireDelay: 0.12, recoil: 1.0, range: 120, reloadTime: 1.25 },
  { name: "Pistol", ammo: 12, reserve: 84, magSize: 12, damage: 18, fireDelay: 0.2, recoil: 0.65, range: 95, reloadTime: 1.1 },
  { name: "Shotgun", ammo: 6, reserve: 30, magSize: 6, damage: 20, fireDelay: 0.85, recoil: 2.5, range: 25, reloadTime: 2.1, pellets: 8 },
];

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
