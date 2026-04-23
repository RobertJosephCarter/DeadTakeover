import * as THREE from "three";

export const VEHICLE_TYPES = {
  JEEP: "jeep",
  TRUCK: "truck",
  MOTORCYCLE: "motorcycle",
};

export function createJeepMesh() {
  const group = new THREE.Group();
  const bodyColor = new THREE.MeshStandardMaterial({ color: 0x4a5a3a, roughness: 0.6, metalness: 0.2 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.7 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88aabb, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.5 });

  // Main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 4.2), bodyColor);
  body.position.y = 0.85;
  // Hood
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.4), bodyColor);
  hood.position.set(0, 1.05, 1.4);
  // Cabin
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 1.6), bodyColor);
  cabin.position.set(0, 1.55, -0.3);
  // Windshield
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 0.05), glassMat);
  windshield.position.set(0, 1.55, 0.51);
  windshield.rotation.x = -0.15;
  // Roll bars
  const rollBarL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), metalMat);
  rollBarL.position.set(-0.9, 1.8, -0.8);
  const rollBarR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2), metalMat);
  rollBarR.position.set(0.9, 1.8, -0.8);
  const rollBarTop = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8), metalMat);
  rollBarTop.rotation.z = Math.PI / 2;
  rollBarTop.position.set(0, 2.4, -0.8);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const fl = new THREE.Mesh(wheelGeo, tireMat); fl.position.set(-1.0, 0.45, 1.4);
  const fr = new THREE.Mesh(wheelGeo, tireMat); fr.position.set(1.0, 0.45, 1.4);
  const bl = new THREE.Mesh(wheelGeo, tireMat); bl.position.set(-1.0, 0.45, -1.4);
  const br = new THREE.Mesh(wheelGeo, tireMat); br.position.set(1.0, 0.45, -1.4);

  // Bumpers
  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 0.15), metalMat);
  frontBumper.position.set(0, 0.6, 2.15);
  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.2, 0.15), metalMat);
  rearBumper.position.set(0, 0.6, -2.15);

  // Headlights
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
  const hlL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), headLightMat);
  hlL.position.set(-0.7, 0.95, 2.1);
  const hlR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), headLightMat);
  hlR.position.set(0.7, 0.95, 2.1);

  group.add(body, hood, cabin, windshield, rollBarL, rollBarR, rollBarTop, fl, fr, bl, br, frontBumper, rearBumper, hlL, hlR);
  group.traverse((obj) => { if (obj instanceof THREE.Mesh) obj.castShadow = true; });
  return { mesh: group, seats: 4, wheels: [fl, fr, bl, br] };
}

export function createTruckMesh() {
  const group = new THREE.Group();
  const bodyColor = new THREE.MeshStandardMaterial({ color: 0x6b4433, roughness: 0.6, metalness: 0.2 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.7 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88aabb, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.5 });

  // Cab
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.1, 1.8), bodyColor);
  cab.position.set(0, 1.1, 1.2);
  const cabTop = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.6, 1.4), bodyColor);
  cabTop.position.set(0, 1.7, 1.25);
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.05), glassMat);
  windshield.position.set(0, 1.65, 2.06);
  windshield.rotation.x = -0.12;

  // Bed
  const bedFloor = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 2.4), metalMat);
  bedFloor.position.set(0, 0.8, -0.8);
  const bedSideL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 2.4), metalMat);
  bedSideL.position.set(-0.96, 1.05, -0.8);
  const bedSideR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 2.4), metalMat);
  bedSideR.position.set(0.96, 1.05, -0.8);
  const bedTail = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.08), metalMat);
  bedTail.position.set(0, 1.05, -1.96);

  // Wheels (6 for truck)
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const fl = new THREE.Mesh(wheelGeo, tireMat); fl.position.set(-0.9, 0.5, 1.5);
  const fr = new THREE.Mesh(wheelGeo, tireMat); fr.position.set(0.9, 0.5, 1.5);
  const mbl = new THREE.Mesh(wheelGeo, tireMat); mbl.position.set(-0.9, 0.5, -0.3);
  const mbr = new THREE.Mesh(wheelGeo, tireMat); mbr.position.set(0.9, 0.5, -0.3);
  const bl = new THREE.Mesh(wheelGeo, tireMat); bl.position.set(-0.9, 0.5, -1.4);
  const br = new THREE.Mesh(wheelGeo, tireMat); br.position.set(0.9, 0.5, -1.4);

  // Headlights
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
  const hlL = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), headLightMat);
  hlL.position.set(-0.6, 1.15, 2.1);
  const hlR = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), headLightMat);
  hlR.position.set(0.6, 1.15, 2.1);

  group.add(cab, cabTop, windshield, bedFloor, bedSideL, bedSideR, bedTail, fl, fr, mbl, mbr, bl, br, hlL, hlR);
  group.traverse((obj) => { if (obj instanceof THREE.Mesh) obj.castShadow = true; });
  return { mesh: group, seats: 2, wheels: [fl, fr, mbl, mbr, bl, br] };
}

export function createMotorcycleMesh() {
  const group = new THREE.Group();
  const bodyColor = new THREE.MeshStandardMaterial({ color: 0x882222, roughness: 0.5, metalness: 0.3 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.8 });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.95 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

  // Main body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 1.2), bodyColor);
  body.position.y = 0.65;
  // Tank
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.5), bodyColor);
  tank.position.set(0, 0.95, 0.3);
  // Seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.55), seatMat);
  seat.position.set(0, 0.9, -0.15);
  // Handlebars
  const handleStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4), metalMat);
  handleStem.position.set(0, 1.05, 0.55);
  handleStem.rotation.x = -0.3;
  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7), metalMat);
  handleBar.rotation.z = Math.PI / 2;
  handleBar.position.set(0, 1.2, 0.55);

  // Front fork
  const forkL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7), metalMat);
  forkL.position.set(-0.18, 0.55, 0.85);
  forkL.rotation.x = -0.25;
  const forkR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7), metalMat);
  forkR.position.set(0.18, 0.55, 0.85);
  forkR.rotation.x = -0.25;

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.12, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const frontWheel = new THREE.Mesh(wheelGeo, tireMat);
  frontWheel.position.set(0, 0.32, 0.9);
  const rearWheel = new THREE.Mesh(wheelGeo, tireMat);
  rearWheel.position.set(0, 0.32, -0.55);

  // Headlight
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
  const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), headLightMat);
  headlight.position.set(0, 1.05, 0.62);

  group.add(body, tank, seat, handleStem, handleBar, forkL, forkR, frontWheel, rearWheel, headlight);
  group.traverse((obj) => { if (obj instanceof THREE.Mesh) obj.castShadow = true; });
  return { mesh: group, seats: 1, wheels: [frontWheel, rearWheel] };
}

export function createVehicle(type, x, z, terrainHeightFn) {
  let data;
  switch (type) {
    case VEHICLE_TYPES.JEEP:
      data = createJeepMesh();
      break;
    case VEHICLE_TYPES.TRUCK:
      data = createTruckMesh();
      break;
    case VEHICLE_TYPES.MOTORCYCLE:
      data = createMotorcycleMesh();
      break;
    default:
      data = createJeepMesh();
  }

  const y = terrainHeightFn(x, z);
  data.mesh.position.set(x, y, z);

  return {
    mesh: data.mesh,
    type,
    seats: data.seats,
    wheels: data.wheels,
    hp: type === VEHICLE_TYPES.JEEP ? 200 : type === VEHICLE_TYPES.TRUCK ? 300 : 80,
    maxHp: type === VEHICLE_TYPES.JEEP ? 200 : type === VEHICLE_TYPES.TRUCK ? 300 : 80,
    fuel: 100,
    maxFuel: 100,
    speed: 0,
    maxSpeed: type === VEHICLE_TYPES.JEEP ? 18 : type === VEHICLE_TYPES.TRUCK ? 12 : 28,
    acceleration: type === VEHICLE_TYPES.JEEP ? 8 : type === VEHICLE_TYPES.TRUCK ? 5 : 12,
    turnSpeed: type === VEHICLE_TYPES.MOTORCYCLE ? 3.5 : 2.0,
    occupied: false,
    driver: null,
    passengers: [],
    yaw: 0,
    armorLevel: 0,
    engineLevel: 0,
    destroyed: false,
  };
}

export function updateVehicle(vehicle, dt, input, terrainHeightFn) {
  if (vehicle.destroyed || vehicle.fuel <= 0) {
    vehicle.speed *= 0.95;
    if (Math.abs(vehicle.speed) < 0.1) vehicle.speed = 0;
    return;
  }

  const forward = new THREE.Vector3(-Math.sin(vehicle.yaw), 0, -Math.cos(vehicle.yaw));
  const right = new THREE.Vector3(Math.cos(vehicle.yaw), 0, -Math.sin(vehicle.yaw));

  // Acceleration / braking
  if (input.forward) {
    vehicle.speed = Math.min(vehicle.maxSpeed, vehicle.speed + vehicle.acceleration * dt);
  } else if (input.backward) {
    vehicle.speed = Math.max(-vehicle.maxSpeed * 0.4, vehicle.speed - vehicle.acceleration * dt);
  } else {
    // Friction
    vehicle.speed *= 0.94;
    if (Math.abs(vehicle.speed) < 0.2) vehicle.speed = 0;
  }

  // Turning
  if (Math.abs(vehicle.speed) > 0.5) {
    const turnMult = vehicle.speed > 0 ? 1 : -1;
    if (input.left) vehicle.yaw += vehicle.turnSpeed * dt * turnMult;
    if (input.right) vehicle.yaw -= vehicle.turnSpeed * dt * turnMult;
  }

  // Move
  vehicle.mesh.position.addScaledVector(forward, vehicle.speed * dt);
  vehicle.mesh.rotation.y = vehicle.yaw;

  // Terrain following
  const groundY = terrainHeightFn(vehicle.mesh.position.x, vehicle.mesh.position.z);
  vehicle.mesh.position.y = groundY;

  // Fuel consumption
  if (Math.abs(vehicle.speed) > 0.5) {
    vehicle.fuel -= dt * 0.15 * (1 - vehicle.engineLevel * 0.1);
    vehicle.fuel = Math.max(0, vehicle.fuel);
  }

  // Wheel rotation animation
  const wheelSpeed = vehicle.speed * 2;
  for (const wheel of vehicle.wheels) {
    wheel.rotation.x += wheelSpeed * dt;
  }
}

export function damageVehicle(vehicle, amount) {
  const armorMult = 1 - vehicle.armorLevel * 0.1;
  vehicle.hp -= amount * armorMult;
  if (vehicle.hp <= 0) {
    vehicle.hp = 0;
    vehicle.destroyed = true;
    vehicle.speed = 0;
    return true; // Destroyed
  }
  return false;
}

export function repairVehicle(vehicle, materials) {
  if (vehicle.hp >= vehicle.maxHp) return false;
  const cost = { scrap: 2 + vehicle.armorLevel, metal: 1 + Math.floor(vehicle.armorLevel / 2) };
  if ((materials.scrap || 0) < cost.scrap || (materials.metal || 0) < cost.metal) return false;
  materials.scrap -= cost.scrap;
  materials.metal -= cost.metal;
  vehicle.hp = Math.min(vehicle.maxHp, vehicle.hp + 60);
  vehicle.destroyed = false;
  return true;
}

export function refuelVehicle(vehicle, amount) {
  vehicle.fuel = Math.min(vehicle.maxFuel, vehicle.fuel + amount);
}

export function upgradeVehicleArmor(vehicle, materials) {
  if (vehicle.armorLevel >= 3) return false;
  const cost = { metal: 4 + vehicle.armorLevel * 2, scrap: 2 };
  if ((materials.metal || 0) < cost.metal || (materials.scrap || 0) < cost.scrap) return false;
  materials.metal -= cost.metal;
  materials.scrap -= cost.scrap;
  vehicle.armorLevel += 1;
  vehicle.maxHp += 50;
  vehicle.hp += 50;
  return true;
}

export function upgradeVehicleEngine(vehicle, materials) {
  if (vehicle.engineLevel >= 3) return false;
  const cost = { chemicals: 2 + vehicle.engineLevel, scrap: 3 + vehicle.engineLevel, metal: 1 };
  if ((materials.chemicals || 0) < cost.chemicals || (materials.scrap || 0) < cost.scrap || (materials.metal || 0) < cost.metal) return false;
  materials.chemicals -= cost.chemicals;
  materials.scrap -= cost.scrap;
  materials.metal -= cost.metal;
  vehicle.engineLevel += 1;
  vehicle.maxSpeed += 3;
  vehicle.acceleration += 1.5;
  return true;
}
