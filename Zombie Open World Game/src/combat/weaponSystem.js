import * as THREE from "three";
import { WEAPON_DEFINITIONS, WEAPON_UPGRADES } from "../core/constants.js";

export function getActiveWeapon(player) {
  return player.weapons[player.activeWeapon];
}

export function getWeaponReserveCap(weapon) {
  if (!weapon) return 120;
  const baseCaps = {
    Rifle: 240,
    Pistol: 168,
    Shotgun: 72,
    Crossbow: 40,
    Flamethrower: 600,
    Sniper: 50,
    Rocket: 10,
  };
  return baseCaps[weapon.name] || weapon.magSize * 10;
}

export function syncPlayerAmmoFields(player) {
  const w = getActiveWeapon(player);
  player.ammo = w.ammo;
  player.reserveAmmo = w.reserve;
}

export function commitPlayerAmmoFields(player) {
  const w = getActiveWeapon(player);
  w.ammo = player.ammo;
  w.reserve = player.reserveAmmo;
}

export function switchToWeapon(player, index) {
  if (player.reloadTimer > 0 || index === player.activeWeapon || index < 0 || index >= player.weapons.length) return false;
  commitPlayerAmmoFields(player);
  player.activeWeapon = index;
  syncPlayerAmmoFields(player);
  return true;
}

export function swapPlayerWeapon(player) {
  if (player.reloadTimer > 0) return;
  commitPlayerAmmoFields(player);
  player.activeWeapon = (player.activeWeapon + 1) % player.weapons.length;
  syncPlayerAmmoFields(player);
}

export function reloadWeapon(player, skills) {
  syncPlayerAmmoFields(player);
  const weapon = getActiveWeapon(player);
  if (player.reloadTimer > 0 || player.ammo >= weapon.magSize || player.reserveAmmo <= 0) return false;
  const skillBonus = skills?.reloadSpeed?.value || 0;
  player.reloadTimer = (weapon.reloadTime || 1.25) * (1 - skillBonus);
  return true;
}

export function applyWeaponUpgrade(weapon, upgradeId) {
  const def = WEAPON_UPGRADES[upgradeId];
  if (!def) return false;
  if (!weapon.upgrades) weapon.upgrades = {};
  const current = weapon.upgrades[upgradeId] || 0;
  if (current >= def.maxTier) return false;

  const newTier = current + 1;
  weapon.upgrades[upgradeId] = newTier;

  const multiplier = 1 + def.valuePerTier * newTier;
  switch (def.effect) {
    case "magSize":
      weapon.magSize = Math.round(weapon.magSize * multiplier);
      break;
    case "damage":
      weapon.damage = Math.round(weapon.damage * multiplier);
      break;
    case "fireDelay":
      weapon.fireDelay = Math.max(0.02, weapon.fireDelay * multiplier);
      break;
    case "laser":
      weapon.laser = true;
      break;
    case "suppress":
      weapon.suppressed = true;
      break;
  }
  return true;
}

export function getUpgradeCost(upgradeId, currentTier) {
  const def = WEAPON_UPGRADES[upgradeId];
  if (!def) return null;
  if (currentTier >= def.maxTier) return null;
  const costs = {};
  for (const [mat, amount] of Object.entries(def.costPerTier)) {
    costs[mat] = amount * (currentTier + 1);
  }
  return costs;
}

export function canAffordUpgrade(materials, upgradeId, currentTier) {
  const cost = getUpgradeCost(upgradeId, currentTier);
  if (!cost) return false;
  for (const [mat, amount] of Object.entries(cost)) {
    if ((materials[mat] || 0) < amount) return false;
  }
  return true;
}

export function deductUpgradeCost(materials, upgradeId, currentTier) {
  const cost = getUpgradeCost(upgradeId, currentTier);
  if (!cost) return false;
  for (const [mat, amount] of Object.entries(cost)) {
    if ((materials[mat] || 0) < amount) return false;
  }
  for (const [mat, amount] of Object.entries(cost)) {
    materials[mat] -= amount;
  }
  return true;
}

/** Procedural Crossbow 3D mesh for first-person view. */
export function createCrossbowMesh(material, gripMaterial) {
  const group = new THREE.Group();
  const metal = material;
  const wood = gripMaterial;

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.55), wood);
  stock.position.set(0, -0.08, 0.1);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.3), metal);
  body.position.set(0, 0, -0.1);
  const prodLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.45, 6), metal);
  prodLeft.rotation.z = Math.PI / 2;
  prodLeft.position.set(-0.22, 0.04, -0.25);
  const prodRight = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.45, 6), metal);
  prodRight.rotation.z = Math.PI / 2;
  prodRight.position.set(0.22, 0.04, -0.25);
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.44, 4), new THREE.MeshBasicMaterial({ color: 0xcccccc }));
  string.rotation.x = Math.PI / 2;
  string.position.set(0, 0.04, -0.25);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8), metal);
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, 0.08, -0.08);

  group.add(stock, body, prodLeft, prodRight, string, scope);
  return group;
}

/** Procedural Flamethrower 3D mesh for first-person view. */
export function createFlamethrowerMesh(material, gripMaterial) {
  const group = new THREE.Group();
  const metal = material;
  const grip = gripMaterial;

  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.35, 12), new THREE.MeshStandardMaterial({ color: 0x556644, metalness: 0.4, roughness: 0.6 }));
  tank.rotation.x = Math.PI / 2;
  tank.position.set(0, 0.1, 0.12);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.4), metal);
  body.position.set(0, 0, -0.1);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.25, 8), metal);
  nozzle.rotation.x = Math.PI / 2;
  nozzle.position.set(0, 0, -0.42);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.1), grip);
  handle.position.set(0, -0.16, 0.05);
  handle.rotation.z = 0.12;
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.04, 0.08), metal);
  guard.position.set(0, -0.08, 0.08);

  group.add(tank, body, nozzle, handle, guard);
  return group;
}

/** Procedural Sniper Rifle 3D mesh for first-person view. */
export function createSniperMesh(material, gripMaterial) {
  const group = new THREE.Group();
  const metal = material;
  const grip = gripMaterial;

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.55), metal);
  receiver.position.set(0, 0, 0);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.95, 10), metal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.01, -0.72);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.13, 0.45), grip);
  stock.position.set(0, -0.01, 0.46);
  const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8), metal);
  scope.rotation.x = Math.PI / 2;
  scope.position.set(0, 0.12, -0.15);
  const lensFront = new THREE.Mesh(new THREE.CircleGeometry(0.018, 8), new THREE.MeshBasicMaterial({ color: 0x112244 }));
  lensFront.position.set(0, 0.12, -0.31);
  const lensRear = new THREE.Mesh(new THREE.CircleGeometry(0.018, 8), new THREE.MeshBasicMaterial({ color: 0x112244 }));
  lensRear.rotation.y = Math.PI;
  lensRear.position.set(0, 0.12, 0.01);
  const bipodL = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 4), metal);
  bipodL.rotation.z = 0.35;
  bipodL.position.set(-0.06, -0.12, -0.5);
  const bipodR = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 4), metal);
  bipodR.rotation.z = -0.35;
  bipodR.position.set(0.06, -0.12, -0.5);
  const gripMesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.09), grip);
  gripMesh.position.set(0.04, -0.18, 0.18);
  gripMesh.rotation.z = 0.2;

  group.add(receiver, barrel, stock, scope, lensFront, lensRear, bipodL, bipodR, gripMesh);
  return group;
}

/** Procedural Rocket Launcher 3D mesh for first-person view. */
export function createRocketLauncherMesh(material, gripMaterial) {
  const group = new THREE.Group();
  const metal = material;
  const grip = gripMaterial;

  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.7, 12), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.5, roughness: 0.5 }));
  tube.rotation.x = Math.PI / 2;
  tube.position.set(0, 0, -0.35);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.28), metal);
  body.position.set(0, 0, 0.08);
  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.05, 0.06), metal);
  sight.position.set(0, 0.1, -0.02);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.1), grip);
  handle.position.set(0.04, -0.18, 0.12);
  handle.rotation.z = 0.18;
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.08), metal);
  guard.position.set(0, -0.1, 0.1);
  const endCap = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.03, 12), metal);
  endCap.rotation.x = Math.PI / 2;
  endCap.position.set(0, 0, -0.7);

  group.add(tube, body, sight, handle, guard, endCap);
  return group;
}

/** Create a world-space replica of a weapon for teammates / pickups. */
export function createWorldWeaponMesh(type, scale = 1) {
  const gun = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.75, roughness: 0.35 });
  const grip = new THREE.MeshStandardMaterial({ color: 0x3c2a1e, metalness: 0.1, roughness: 0.85 });

  switch (type) {
    case "Crossbow": {
      const m = createCrossbowMesh(metal, grip);
      m.scale.setScalar(0.9);
      gun.add(m);
      break;
    }
    case "Flamethrower": {
      const m = createFlamethrowerMesh(metal, grip);
      m.scale.setScalar(0.85);
      gun.add(m);
      break;
    }
    case "Sniper": {
      const m = createSniperMesh(metal, grip);
      m.scale.setScalar(0.9);
      gun.add(m);
      break;
    }
    case "Rocket": {
      const m = createRocketLauncherMesh(metal, grip);
      m.scale.setScalar(0.85);
      gun.add(m);
      break;
    }
    default:
      return null;
  }

  const muzzle = new THREE.Object3D();
  muzzle.position.set(0, 0, -0.85);
  const muzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffd78a, transparent: true, opacity: 0 }),
  );
  muzzleFlash.position.copy(muzzle.position);
  gun.add(muzzle, muzzleFlash);
  gun.scale.setScalar(scale);
  return { group: gun, muzzle, muzzleFlash };
}

export function initDefaultWeapons() {
  return WEAPON_DEFINITIONS.filter((w) => w.unlocked).map((w) => ({ ...w, upgrades: {} }));
}
