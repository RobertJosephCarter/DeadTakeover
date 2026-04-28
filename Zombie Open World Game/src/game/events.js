/** Dynamic world event system for DeadTakeover.
 *  Triggers random events to break up wave rhythm and add variety.
 */

import * as THREE from "three";

export const EVENT_TYPES = {
  HORDE_RUSH: "horde_rush",
  STRANDED_SURVIVOR: "stranded_survivor",
  TOXIC_ZONE: "toxic_zone",
  AIRDROP_WEAPON: "airdrop_weapon",
  ZOMBIE_TIDE: "zombie_tide",
  ABANDONED_CAMP: "abandoned_camp",
  EMERGENCY_BROADCAST: "emergency_broadcast",
};

export const EVENT_WEIGHTS = {
  [EVENT_TYPES.HORDE_RUSH]: 0.22,
  [EVENT_TYPES.STRANDED_SURVIVOR]: 0.18,
  [EVENT_TYPES.TOXIC_ZONE]: 0.13,
  [EVENT_TYPES.AIRDROP_WEAPON]: 0.13,
  [EVENT_TYPES.ZOMBIE_TIDE]: 0.14,
  [EVENT_TYPES.ABANDONED_CAMP]: 0.10,
  [EVENT_TYPES.EMERGENCY_BROADCAST]: 0.10,
};

export function pickEventType() {
  const roll = Math.random();
  let cumulative = 0;
  for (const [type, weight] of Object.entries(EVENT_WEIGHTS)) {
    cumulative += weight;
    if (roll <= cumulative) return type;
  }
  return EVENT_TYPES.HORDE_RUSH;
}

export function createEventDirector() {
  return {
    timer: 0,
    nextEventIn: 45 + Math.random() * 60, // 45-105 seconds between events
    activeEvent: null,
    eventData: {},
    survivorTimer: 0,
    survivorActive: false,
    survivorPosition: null,
    survivorHP: 0,
    survivorMesh: null,
    toxicZones: [],
    // Zombie tide — sustained directional spawn stream.
    tideActive: false,
    tideTimer: 0,
    tideAngle: 0,
    tideSpawnAccumulator: 0,
    // Emergency broadcast — temporary buff to supply drop frequency.
    broadcastActive: false,
    broadcastTimer: 0,
    // Abandoned camp — passive loot stash. Cleaned up when looted or expired.
    campActive: false,
    campMarker: null,
    campPosition: null,
    campTimer: 0,
  };
}

export function updateEventDirector(director, dt, player, zombies, scene, terrainHeight) {
  director.timer += dt;

  // Reset zombie stats to base before applying temporary zone buffs
  for (const zombie of zombies) {
    if (zombie.baseSpeed !== undefined) zombie.speed = zombie.baseSpeed;
    if (zombie.baseDamage !== undefined) zombie.damage = zombie.baseDamage;
  }

  // Update toxic zones
  for (let i = director.toxicZones.length - 1; i >= 0; i--) {
    const zone = director.toxicZones[i];
    zone.life -= dt;
    zone.mesh.material.opacity = Math.max(0, zone.life / zone.maxLife * 0.45);
    if (zone.life <= 0) {
      scene.remove(zone.mesh);
      zone.mesh.geometry.dispose();
      zone.mesh.material.dispose();
      director.toxicZones.splice(i, 1);
      continue;
    }
    // Mutate zombies inside toxic zone
    for (const zombie of zombies) {
      if (zombie.mesh.position.distanceTo(zone.position) < zone.radius) {
        zombie.speed = Math.max(zombie.speed, 5.5);
        zombie.damage = Math.max(zombie.damage, 12);
      }
    }
  }

  let result = null;

  // Update stranded survivor
  if (director.survivorActive) {
    director.survivorTimer -= dt;
    if (director.survivorTimer <= 0 || director.survivorHP <= 0) {
      director.survivorActive = false;
      if (director.survivorMesh) {
        scene.remove(director.survivorMesh);
        disposeSurvivor(director.survivorMesh);
        director.survivorMesh = null;
      }
      result = { type: "survivor_end", success: director.survivorHP > 0 };
    }
  }

  // Sustained zombie tide — spawns runners on a fixed bearing for 20s.
  if (director.tideActive) {
    director.tideTimer -= dt;
    director.tideSpawnAccumulator += dt;
    // ~3 zombies per second
    if (director.tideSpawnAccumulator >= 0.33) {
      director.tideSpawnAccumulator = 0;
      result = result || { type: "tide_spawn", angle: director.tideAngle };
    }
    if (director.tideTimer <= 0) {
      director.tideActive = false;
      result = { type: "tide_end" };
    }
  }

  // Emergency broadcast — caller drives drop frequency, we just count down.
  if (director.broadcastActive) {
    director.broadcastTimer -= dt;
    if (director.broadcastTimer <= 0) {
      director.broadcastActive = false;
      result = result || { type: "broadcast_end" };
    }
  }

  // Abandoned camp — auto-expire after 4 minutes if untouched.
  if (director.campActive) {
    director.campTimer -= dt;
    if (director.campTimer <= 0) {
      result = result || { type: "camp_expired" };
      clearCamp(director, scene);
    }
  }

  // Trigger new event
  if (director.timer >= director.nextEventIn && !director.activeEvent && !director.survivorActive) {
    director.timer = 0;
    director.nextEventIn = 45 + Math.random() * 60;
    const eventType = pickEventType();
    director.activeEvent = eventType;
    return { type: "trigger", eventType };
  }

  return result;
}

/** Remove the abandoned camp marker. Called when looted or on expiry. */
export function clearCamp(director, scene) {
  director.campActive = false;
  if (director.campMarker) {
    scene.remove(director.campMarker);
    director.campMarker.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose?.());
        else obj.material?.dispose?.();
      }
    });
    director.campMarker = null;
  }
  director.campPosition = null;
}

export function executeEvent(eventType, director, player, scene, terrainHeight, addZombieFn, spawnDropFn) {
  switch (eventType) {
    case EVENT_TYPES.HORDE_RUSH: {
      const angle = Math.random() * Math.PI * 2;
      const count = 15 + Math.floor(Math.random() * 6); // 15-20 runners
      for (let i = 0; i < count; i++) {
        const offset = (Math.random() - 0.5) * 20;
        const dist = 35 + Math.random() * 20;
        const zx = player.position.x + Math.cos(angle) * dist + Math.cos(angle + Math.PI / 2) * offset;
        const zz = player.position.z + Math.sin(angle) * dist + Math.sin(angle + Math.PI / 2) * offset;
        addZombieFn(zx, zz, "runner");
      }
      director.activeEvent = null;
      return { alert: "⚠ HORDE RUSH! Runners incoming!", alertTimer: 3 };
    }
    case EVENT_TYPES.STRANDED_SURVIVOR: {
      const sAngle = Math.random() * Math.PI * 2;
      const sDist = 40 + Math.random() * 50;
      const sx = player.position.x + Math.cos(sAngle) * sDist;
      const sz = player.position.z + Math.sin(sAngle) * sDist;
      director.survivorPosition = { x: sx, y: terrainHeight(sx, sz), z: sz };
      director.survivorHP = 80;
      director.survivorTimer = 60; // 60 seconds to defend
      director.survivorActive = true;
      director.survivorMesh = createSurvivorMesh(director.survivorPosition);
      scene.add(director.survivorMesh);
      director.activeEvent = null;
      return { alert: "🆘 STRANDED SURVIVOR! Defend for 60s!", alertTimer: 4 };
    }
    case EVENT_TYPES.TOXIC_ZONE: {
      const tAngle = Math.random() * Math.PI * 2;
      const tDist = 25 + Math.random() * 40;
      const tx = player.position.x + Math.cos(tAngle) * tDist;
      const tz = player.position.z + Math.sin(tAngle) * tDist;
      const zoneGeo = new THREE.SphereGeometry(10, 16, 16);
      const zoneMat = new THREE.MeshBasicMaterial({ color: 0x44aa22, transparent: true, opacity: 0.35 });
      const zoneMesh = new THREE.Mesh(zoneGeo, zoneMat);
      zoneMesh.position.set(tx, terrainHeight(tx, tz) + 2, tz);
      zoneMesh.scale.set(1, 0.3, 1);
      scene.add(zoneMesh);
      director.toxicZones.push({
        mesh: zoneMesh,
        position: new THREE.Vector3(tx, terrainHeight(tx, tz), tz),
        radius: 10,
        life: 30,
        maxLife: 30,
      });
      director.activeEvent = null;
      return { alert: "☣️ TOXIC ZONE! Zombies inside mutate!", alertTimer: 3 };
    }
    case EVENT_TYPES.AIRDROP_WEAPON: {
      const aAngle = Math.random() * Math.PI * 2;
      const aDist = 30 + Math.random() * 45;
      const ax = player.position.x + Math.cos(aAngle) * aDist;
      const az = player.position.z + Math.sin(aAngle) * aDist;
      spawnDropFn({ x: ax, y: terrainHeight(ax, az) + 15, z: az }, "weapon_crate");
      director.activeEvent = null;
      return { alert: "📦 WEAPON CRATE dropping!", alertTimer: 3 };
    }
    case EVENT_TYPES.ZOMBIE_TIDE: {
      // Pick a compass bearing the player will see zombies streaming in from.
      director.tideAngle = Math.random() * Math.PI * 2;
      director.tideTimer = 20;            // 20 seconds of sustained spawning
      director.tideSpawnAccumulator = 0;
      director.tideActive = true;
      const compass = bearingLabel(director.tideAngle);
      director.activeEvent = null;
      return { alert: `🌊 ZOMBIE TIDE from the ${compass}!`, alertTimer: 4 };
    }
    case EVENT_TYPES.ABANDONED_CAMP: {
      // Place a small camp marker somewhere in the world. The caller is
      // expected to spawn loot pickups around campPosition.
      const cAngle = Math.random() * Math.PI * 2;
      const cDist = 50 + Math.random() * 60;
      const cx = player.position.x + Math.cos(cAngle) * cDist;
      const cz = player.position.z + Math.sin(cAngle) * cDist;
      const cy = terrainHeight(cx, cz);
      director.campPosition = { x: cx, y: cy, z: cz };
      director.campMarker = createCampMesh(director.campPosition);
      director.campActive = true;
      director.campTimer = 240; // 4 minute lifetime if undiscovered
      scene.add(director.campMarker);
      director.activeEvent = null;
      return { alert: "🏕 ABANDONED CAMP spotted on the minimap.", alertTimer: 4, campPosition: director.campPosition };
    }
    case EVENT_TYPES.EMERGENCY_BROADCAST: {
      // 60-second window of boosted supply drop frequency. Caller reads
      // director.broadcastActive each tick to multiply its drop chance.
      director.broadcastActive = true;
      director.broadcastTimer = 60;
      director.activeEvent = null;
      return { alert: "📡 EMERGENCY BROADCAST — supply drops incoming!", alertTimer: 4 };
    }
    default:
      director.activeEvent = null;
      return null;
  }
}

/** Cardinal direction label for a yaw angle in radians (0 = +X). */
function bearingLabel(angle) {
  const norm = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const slice = Math.round(norm / (Math.PI / 4)) % 8;
  return ["E", "NE", "N", "NW", "W", "SW", "S", "SE"][slice];
}

/** Spawn a small abandoned camp marker — campfire stones + a tarp shape so the
 *  player sees something to investigate from a distance. Loot itself is the
 *  caller's responsibility (it has access to material drop helpers). */
function createCampMesh(position) {
  const group = new THREE.Group();
  // Fire pit ring
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4a4640, roughness: 0.95 });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const stone = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.32), stoneMat);
    stone.position.set(Math.cos(a) * 0.55, 0.09, Math.sin(a) * 0.55);
    stone.rotation.y = Math.random() * Math.PI;
    group.add(stone);
  }
  // Charred logs
  const logMat = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.95 });
  const log1 = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.12, 0.12), logMat);
  log1.position.y = 0.06;
  const log2 = log1.clone();
  log2.rotation.y = Math.PI / 3;
  group.add(log1, log2);

  // Tarp / lean-to: a tilted plane to suggest shelter
  const tarpMat = new THREE.MeshStandardMaterial({ color: 0x5c4628, roughness: 0.85, side: THREE.DoubleSide });
  const tarp = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), tarpMat);
  tarp.position.set(1.4, 0.85, 0);
  tarp.rotation.set(-Math.PI / 2.4, 0, Math.PI / 8);
  group.add(tarp);

  // Locator beacon — lifted plane the player can spot from range
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.8, side: THREE.DoubleSide });
  const beacon = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), beaconMat);
  beacon.position.y = 3.2;
  beacon.userData.isIcon = true;
  group.add(beacon);

  group.position.set(position.x, position.y, position.z);
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh && !obj.userData.isIcon) obj.castShadow = true;
  });
  return group;
}

function createSurvivorMesh(position) {
  const group = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xccaa88, roughness: 0.7 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: 0x4488cc, roughness: 0.8 });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.8 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), skinMat);
  head.position.y = 2.08;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), shirtMat);
  torso.position.y = 1.5;
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.3), pantsMat);
  hips.position.y = 1.0;
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.15), skinMat);
  leftArm.position.set(-0.4, 1.55, 0);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 0.15), skinMat);
  rightArm.position.set(0.4, 1.55, 0);
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.85, 0.18), pantsMat);
  leftLeg.position.set(-0.15, 0.5, 0);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.85, 0.18), pantsMat);
  rightLeg.position.set(0.15, 0.5, 0);

  // Help icon floating above
  const iconGeo = new THREE.PlaneGeometry(0.5, 0.5);
  const iconMat = new THREE.MeshBasicMaterial({ color: 0xffcc00, side: THREE.DoubleSide });
  const icon = new THREE.Mesh(iconGeo, iconMat);
  icon.position.y = 2.6;
  icon.userData.isIcon = true;

  group.add(head, torso, hips, leftArm, rightArm, leftLeg, rightLeg, icon);
  group.position.set(position.x, position.y, position.z);
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.castShadow = true;
  });
  return group;
}

function disposeSurvivor(mesh) {
  mesh.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (obj.material.dispose) obj.material.dispose();
    }
  });
}

export function damageSurvivor(director, amount) {
  if (director.survivorActive) {
    director.survivorHP -= amount;
    return director.survivorHP;
  }
  return 0;
}

export function isSurvivorAlive(director) {
  return director.survivorActive && director.survivorHP > 0;
}
