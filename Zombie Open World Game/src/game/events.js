/** Dynamic world event system for DeadTakeover.
 *  Triggers random events to break up wave rhythm and add variety.
 */

export const EVENT_TYPES = {
  HORDE_RUSH: "horde_rush",
  STRANDED_SURVIVOR: "stranded_survivor",
  TOXIC_ZONE: "toxic_zone",
  AIRDROP_WEAPON: "airdrop_weapon",
};

export const EVENT_WEIGHTS = {
  [EVENT_TYPES.HORDE_RUSH]: 0.35,
  [EVENT_TYPES.STRANDED_SURVIVOR]: 0.25,
  [EVENT_TYPES.TOXIC_ZONE]: 0.20,
  [EVENT_TYPES.AIRDROP_WEAPON]: 0.20,
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
  };
}

export function updateEventDirector(director, dt, player, zombies, scene, terrainHeight, worldSize = 200) {
  director.timer += dt;

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
      return { type: "survivor_end", success: director.survivorHP > 0 };
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

  return null;
}

export function executeEvent(eventType, director, player, scene, terrainHeight, addZombieFn, spawnDropFn, worldSize = 200) {
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
    default:
      director.activeEvent = null;
      return null;
  }
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
