import * as THREE from "three";

/** Mission system for DeadTakeover.
 *  Generates and tracks active missions with objectives and rewards.
 */

export const MISSION_TYPES = {
  SCAVENGE: "scavenge",
  DEFEND: "defend",
  RESCUE: "rescue",
  ELIMINATE: "eliminate",
  SUPPLY_RUN: "supply_run",
};

export function createMissionGenerator() {
  return {
    activeMissions: [],
    completedMissions: 0,
    nextMissionId: 1,
    timer: 0,
    nextMissionIn: 30 + Math.random() * 30, // First mission after 30-60s
  };
}

export function generateMission(id, playerPosition, terrainHeight, worldSize = 250) {
  const types = Object.values(MISSION_TYPES);
  const type = types[Math.floor(Math.random() * types.length)];
  const angle = Math.random() * Math.PI * 2;
  const dist = 30 + Math.random() * 50;
  const tx = playerPosition.x + Math.cos(angle) * dist;
  const tz = playerPosition.z + Math.sin(angle) * dist;

  switch (type) {
    case MISSION_TYPES.SCAVENGE: {
      const mats = ["scrap", "wood", "metal", "cloth", "chemicals"];
      const mat = mats[Math.floor(Math.random() * mats.length)];
      const amount = 3 + Math.floor(Math.random() * 5);
      return {
        id,
        type,
        title: `Scavenge ${amount} ${mat}`,
        description: `Collect ${amount} units of ${mat} from zombie drops.`,
        targetMaterial: mat,
        targetAmount: amount,
        collected: 0,
        completed: false,
        rewardXP: 30 + amount * 5,
        rewardMaterials: { [mat]: Math.floor(amount * 0.5) },
        rewardScore: 100,
        timeLimit: 180,
        timer: 180,
      };
    }
    case MISSION_TYPES.DEFEND: {
      return {
        id,
        type,
        title: "Defend Position",
        description: "Hold the marked position for 2 minutes against waves.",
        position: { x: tx, y: terrainHeight(tx, tz), z: tz },
        radius: 12,
        defendTimer: 120,
        maxDefendTimer: 120,
        completed: false,
        failed: false,
        rewardXP: 60,
        rewardScore: 300,
        rewardSkillPoints: 1,
      };
    }
    case MISSION_TYPES.RESCUE: {
      return {
        id,
        type,
        title: "Rescue Survivor",
        description: "Find and escort the stranded survivor to safety.",
        position: { x: tx, y: terrainHeight(tx, tz), z: tz },
        radius: 3,
        survivorFound: false,
        escortComplete: false,
        completed: false,
        rewardXP: 50,
        rewardScore: 250,
        rewardMaterials: { scrap: 3, metal: 2, chemicals: 1 },
      };
    }
    case MISSION_TYPES.ELIMINATE: {
      const targets = ["juggernaut", "brute", "spitter", "hunter", "charger"];
      const target = targets[Math.floor(Math.random() * targets.length)];
      return {
        id,
        type,
        title: `Eliminate ${target.charAt(0).toUpperCase() + target.slice(1)}`,
        description: `Kill ${target === "juggernaut" ? 1 : 2} ${target}(s).`,
        targetType: target,
        killsNeeded: target === "juggernaut" ? 1 : 2,
        kills: 0,
        completed: false,
        rewardXP: target === "juggernaut" ? 80 : 40,
        rewardScore: target === "juggernaut" ? 400 : 200,
        timeLimit: 150,
        timer: 150,
      };
    }
    case MISSION_TYPES.SUPPLY_RUN: {
      const aAngle = angle + Math.PI;
      const aDist = 30 + Math.random() * 40;
      const ax = playerPosition.x + Math.cos(aAngle) * aDist;
      const az = playerPosition.z + Math.sin(aAngle) * aDist;
      return {
        id,
        type,
        title: "Supply Run",
        description: "Travel to the marked location and return.",
        position: { x: tx, y: terrainHeight(tx, tz), z: tz },
        returnPosition: { x: ax, y: terrainHeight(ax, az), z: az },
        reached: false,
        returned: false,
        completed: false,
        rewardXP: 45,
        rewardScore: 200,
        rewardMaterials: { scrap: 2, wood: 2, metal: 2 },
      };
    }
    default:
      return null;
  }
}

export function updateMissions(generator, dt, player, materials, zombies, terrainHeight) {
  const missionPos = new THREE.Vector3();
  const returnPos = new THREE.Vector3();
  generator.timer += dt;

  // Generate new mission if slot available (max 3 active)
  if (generator.timer >= generator.nextMissionIn && generator.activeMissions.length < 3) {
    generator.timer = 0;
    generator.nextMissionIn = 40 + Math.random() * 50;
    const mission = generateMission(generator.nextMissionId++, player.position, terrainHeight);
    if (mission) generator.activeMissions.push(mission);
  }

  const completed = [];
  const expired = [];

  for (let i = generator.activeMissions.length - 1; i >= 0; i--) {
    const m = generator.activeMissions[i];

    // Time-limited missions
    if (m.timeLimit) {
      m.timer -= dt;
      if (m.timer <= 0 && !m.completed) {
        expired.push(m);
        generator.activeMissions.splice(i, 1);
        continue;
      }
    }

    // Check completion
    if (m.type === MISSION_TYPES.SCAVENGE) {
      if (m.collected >= m.targetAmount) {
        m.completed = true;
        completed.push(m);
        generator.activeMissions.splice(i, 1);
      }
    } else if (m.type === MISSION_TYPES.DEFEND) {
      missionPos.set(m.position.x, m.position.y, m.position.z);
      const d = player.position.distanceTo(missionPos);
      if (d < m.radius) {
        m.defendTimer -= dt;
        if (m.defendTimer <= 0) {
          m.completed = true;
          completed.push(m);
          generator.activeMissions.splice(i, 1);
        }
      }
    } else if (m.type === MISSION_TYPES.RESCUE) {
      missionPos.set(m.position.x, m.position.y, m.position.z);
      const d = player.position.distanceTo(missionPos);
      if (d < m.radius && !m.survivorFound) {
        m.survivorFound = true;
      }
      if (m.survivorFound && !m.escortComplete) {
        // Escort to starting position
        if (player.position.length() < 10) {
          m.escortComplete = true;
          m.completed = true;
          completed.push(m);
          generator.activeMissions.splice(i, 1);
        }
      }
    } else if (m.type === MISSION_TYPES.ELIMINATE) {
      if (m.kills >= m.killsNeeded) {
        m.completed = true;
        completed.push(m);
        generator.activeMissions.splice(i, 1);
      }
    } else if (m.type === MISSION_TYPES.SUPPLY_RUN) {
      missionPos.set(m.position.x, m.position.y, m.position.z);
      const d = player.position.distanceTo(missionPos);
      if (d < 8 && !m.reached) {
        m.reached = true;
      }
      if (m.reached) {
        returnPos.set(m.returnPosition.x, m.returnPosition.y, m.returnPosition.z);
        const rd = player.position.distanceTo(returnPos);
        if (rd < 8) {
          m.returned = true;
          m.completed = true;
          completed.push(m);
          generator.activeMissions.splice(i, 1);
        }
      }
    }
  }

  return { completed, expired };
}

export function onMaterialCollected(generator, materialType, amount) {
  for (const m of generator.activeMissions) {
    if (m.type === MISSION_TYPES.SCAVENGE && m.targetMaterial === materialType) {
      m.collected += amount;
    }
  }
}

export function onZombieKilled(generator, zombieType) {
  for (const m of generator.activeMissions) {
    if (m.type === MISSION_TYPES.ELIMINATE && m.targetType === zombieType) {
      m.kills += 1;
    }
  }
}

export function getMissionRewards(mission) {
  return {
    xp: mission.rewardXP || 0,
    score: mission.rewardScore || 0,
    skillPoints: mission.rewardSkillPoints || 0,
    materials: mission.rewardMaterials || {},
  };
}

export function formatMissionStatus(mission) {
  if (mission.type === MISSION_TYPES.SCAVENGE) {
    return `${mission.collected}/${mission.targetAmount}`;
  } else if (mission.type === MISSION_TYPES.DEFEND) {
    const remaining = Math.max(0, Math.ceil(mission.defendTimer));
    return `${remaining}s`;
  } else if (mission.type === MISSION_TYPES.ELIMINATE) {
    return `${mission.kills}/${mission.killsNeeded}`;
  } else if (mission.type === MISSION_TYPES.SUPPLY_RUN) {
    return mission.reached ? "Return to base" : "Reach location";
  } else if (mission.type === MISSION_TYPES.RESCUE) {
    return mission.survivorFound ? "Escort to base" : "Find survivor";
  }
  return "";
}

export function getActiveMissionCount(generator) {
  return generator.activeMissions.length;
}
