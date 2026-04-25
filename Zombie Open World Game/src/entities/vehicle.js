import * as THREE from "three";

export const VEHICLE_TYPES = {
  JEEP: "jeep",
  TRUCK: "truck",
  MOTORCYCLE: "motorcycle",
  SEDAN: "sedan",
  AMBULANCE: "ambulance",
  ATV: "atv",
};

const vehicleTextureCache = new Map();

function hexStyle(hex) {
  return `#${hex.toString(16).padStart(6, "0")}`;
}

function getVehiclePaintTexture(baseHex, rustHex = 0x7b3f22) {
  const key = `paint:${baseHex}:${rustHex}`;
  if (vehicleTextureCache.has(key)) return vehicleTextureCache.get(key);
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = hexStyle(baseHex);
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1300; i += 1) {
    const shade = 55 + Math.floor(Math.random() * 90);
    ctx.fillStyle = `rgba(${shade},${shade},${shade},${0.025 + Math.random() * 0.055})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
  }

  for (let i = 0; i < 34; i += 1) {
    ctx.strokeStyle = `rgba(235,235,220,${0.08 + Math.random() * 0.12})`;
    ctx.lineWidth = 0.7 + Math.random() * 1.2;
    ctx.beginPath();
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.moveTo(x, y);
    ctx.lineTo(x + 8 + Math.random() * 28, y + (Math.random() - 0.5) * 6);
    ctx.stroke();
  }

  const rust = new THREE.Color(rustHex);
  for (let i = 0; i < 26; i += 1) {
    ctx.fillStyle = `rgba(${Math.round(rust.r * 255)},${Math.round(rust.g * 255)},${Math.round(rust.b * 255)},${0.12 + Math.random() * 0.16})`;
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * size,
      Math.random() * size,
      2 + Math.random() * 7,
      1 + Math.random() * 4,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.5, 1.5);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  vehicleTextureCache.set(key, texture);
  return texture;
}

function getTireTreadTexture() {
  const key = "tire-tread";
  if (vehicleTextureCache.has(key)) return vehicleTextureCache.get(key);
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#141414";
  ctx.fillRect(0, 0, size, size);
  for (let y = -size; y < size * 2; y += 12) {
    ctx.strokeStyle = "rgba(65,65,65,0.85)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + 34);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size, y);
    ctx.lineTo(0, y + 34);
    ctx.stroke();
  }
  for (let i = 0; i < 700; i += 1) {
    const g = 25 + Math.floor(Math.random() * 55);
    ctx.fillStyle = `rgba(${g},${g},${g},0.12)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1, 1);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2.5, 2.5);
  texture.colorSpace = THREE.SRGBColorSpace;
  vehicleTextureCache.set(key, texture);
  return texture;
}

function createPaintMaterial(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: getVehiclePaintTexture(color, options.rustColor),
    roughness: options.roughness ?? 0.62,
    metalness: options.metalness ?? 0.22,
  });
}

function createTireMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: getTireTreadTexture(),
    roughness: 0.96,
  });
}

export function createJeepMesh() {
  const group = new THREE.Group();
  const bodyColor = createPaintMaterial(0x4a5a3a, { roughness: 0.66, metalness: 0.18 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.7 });
  const tireMat = createTireMaterial();
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
  const bodyColor = createPaintMaterial(0x6b4433, { roughness: 0.68, metalness: 0.16, rustColor: 0x8a4a28 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.7 });
  const tireMat = createTireMaterial();
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
  const bodyColor = createPaintMaterial(0x882222, { roughness: 0.56, metalness: 0.26 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.3, metalness: 0.8 });
  const tireMat = createTireMaterial();
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

export function createSedanMesh() {
  const group = new THREE.Group();
  const bodyColor = createPaintMaterial(0x2f5f7f, { roughness: 0.58, metalness: 0.24 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.45, metalness: 0.55 });
  const tireMat = createTireMaterial();
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x99bbcc, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.5 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 3.6), bodyColor);
  body.position.set(0, 0.72, 0);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.32, 1.05), bodyColor);
  hood.position.set(0, 1.02, 1.2);
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.3, 0.95), bodyColor);
  trunk.position.set(0, 1.0, -1.25);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.65, 1.25), bodyColor);
  cabin.position.set(0, 1.35, -0.15);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.42, 0.04), glassMat);
  windshield.position.set(0, 1.35, 0.52);
  windshield.rotation.x = -0.22;
  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.4, 0.04), glassMat);
  rearWindow.position.set(0, 1.35, -0.82);
  rearWindow.rotation.x = 0.22;
  const sideWindowL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 1.0), glassMat);
  sideWindowL.position.set(-0.8, 1.35, -0.15);
  const sideWindowR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 1.0), glassMat);
  sideWindowR.position.set(0.8, 1.35, -0.15);

  const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.24, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const fl = new THREE.Mesh(wheelGeo, tireMat); fl.position.set(-0.9, 0.38, 1.15);
  const fr = new THREE.Mesh(wheelGeo, tireMat); fr.position.set(0.9, 0.38, 1.15);
  const bl = new THREE.Mesh(wheelGeo, tireMat); bl.position.set(-0.9, 0.38, -1.15);
  const br = new THREE.Mesh(wheelGeo, tireMat); br.position.set(0.9, 0.38, -1.15);

  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 0.1), trimMat);
  frontBumper.position.set(0, 0.55, 1.85);
  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.16, 0.1), trimMat);
  rearBumper.position.set(0, 0.55, -1.85);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 0.04), trimMat);
  grille.position.set(0, 0.82, 1.82);

  const headLightMat = new THREE.MeshBasicMaterial({ color: 0xffffbb });
  const tailLightMat = new THREE.MeshBasicMaterial({ color: 0xaa1111 });
  const hlL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), headLightMat);
  hlL.position.set(-0.58, 0.82, 1.83);
  const hlR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), headLightMat);
  hlR.position.set(0.58, 0.82, 1.83);
  const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.04), tailLightMat);
  tlL.position.set(-0.62, 0.78, -1.83);
  const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.04), tailLightMat);
  tlR.position.set(0.62, 0.78, -1.83);

  group.add(body, hood, trunk, cabin, windshield, rearWindow, sideWindowL, sideWindowR, fl, fr, bl, br, frontBumper, rearBumper, grille, hlL, hlR, tlL, tlR);
  group.traverse((obj) => { if (obj instanceof THREE.Mesh) obj.castShadow = true; });
  return { mesh: group, seats: 4, wheels: [fl, fr, bl, br] };
}

export function createAmbulanceMesh() {
  const group = new THREE.Group();
  const bodyColor = createPaintMaterial(0xe8e6da, { roughness: 0.62, metalness: 0.16, rustColor: 0x9b5a2c });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xb51f24, roughness: 0.5, metalness: 0.15 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.42, metalness: 0.65 });
  const tireMat = createTireMaterial();
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x8fb2c4, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.48 });

  const rearBox = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.35, 2.8), bodyColor);
  rearBox.position.set(0, 1.25, -0.72);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.95, 1.5), bodyColor);
  cab.position.set(0, 1.03, 1.45);
  const cabTop = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.58, 1.15), bodyColor);
  cabTop.position.set(0, 1.62, 1.42);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.42, 0.9), bodyColor);
  hood.position.set(0, 0.92, 2.25);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 0.04), glassMat);
  windshield.position.set(0, 1.55, 2.0);
  windshield.rotation.x = -0.16;
  const sideWindowL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.72), glassMat);
  sideWindowL.position.set(-0.94, 1.52, 1.42);
  const sideWindowR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.36, 0.72), glassMat);
  sideWindowR.position.set(0.94, 1.52, 1.42);

  const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 2.55), redMat);
  stripeL.position.set(-1.12, 1.35, -0.73);
  const stripeR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 2.55), redMat);
  stripeR.position.set(1.12, 1.35, -0.73);
  const rearStripe = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.18, 0.04), redMat);
  rearStripe.position.set(0, 1.35, -2.14);
  const crossVertical = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.56, 0.04), redMat);
  crossVertical.position.set(0, 1.55, -2.15);
  const crossHorizontal = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.04), redMat);
  crossHorizontal.position.set(0, 1.55, -2.16);

  const roofRack = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.55), metalMat);
  roofRack.position.set(0, 2.02, 1.1);
  const redBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.22), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
  redBeacon.position.set(-0.28, 2.15, 1.1);
  const blueBeacon = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.22), new THREE.MeshBasicMaterial({ color: 0x2266ff }));
  blueBeacon.position.set(0.28, 2.15, 1.1);

  const wheelGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.28, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const fl = new THREE.Mesh(wheelGeo, tireMat); fl.position.set(-1.0, 0.46, 1.45);
  const fr = new THREE.Mesh(wheelGeo, tireMat); fr.position.set(1.0, 0.46, 1.45);
  const bl = new THREE.Mesh(wheelGeo, tireMat); bl.position.set(-1.0, 0.46, -1.45);
  const br = new THREE.Mesh(wheelGeo, tireMat); br.position.set(1.0, 0.46, -1.45);

  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.18, 0.12), metalMat);
  frontBumper.position.set(0, 0.55, 2.72);
  const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.18, 0.12), metalMat);
  rearBumper.position.set(0, 0.55, -2.18);
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0xffffbb });
  const hlL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), headLightMat);
  hlL.position.set(-0.62, 0.92, 2.72);
  const hlR = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), headLightMat);
  hlR.position.set(0.62, 0.92, 2.72);

  group.add(rearBox, cab, cabTop, hood, windshield, sideWindowL, sideWindowR, stripeL, stripeR, rearStripe, crossVertical, crossHorizontal, roofRack, redBeacon, blueBeacon, fl, fr, bl, br, frontBumper, rearBumper, hlL, hlR);
  group.traverse((obj) => { if (obj instanceof THREE.Mesh) obj.castShadow = true; });
  return { mesh: group, seats: 2, wheels: [fl, fr, bl, br] };
}

export function createATVMesh() {
  const group = new THREE.Group();
  const bodyColor = createPaintMaterial(0x3f6f2a, { roughness: 0.63, metalness: 0.2 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.36, metalness: 0.75 });
  const tireMat = createTireMaterial();
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.88 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.28, 1.45), bodyColor);
  base.position.set(0, 0.72, 0);
  const frontCowling = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.28, 0.52), bodyColor);
  frontCowling.position.set(0, 0.95, 0.45);
  const rearCowling = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.2, 0.5), bodyColor);
  rearCowling.position.set(0, 0.88, -0.58);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.12, 0.62), seatMat);
  seat.position.set(0, 1.04, -0.2);

  const frontAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.35), metalMat);
  frontAxle.rotation.z = Math.PI / 2;
  frontAxle.position.set(0, 0.48, 0.75);
  const rearAxle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.35), metalMat);
  rearAxle.rotation.z = Math.PI / 2;
  rearAxle.position.set(0, 0.48, -0.75);

  const handleStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45), metalMat);
  handleStem.position.set(0, 1.08, 0.5);
  handleStem.rotation.x = -0.25;
  const handleBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.65), metalMat);
  handleBar.rotation.z = Math.PI / 2;
  handleBar.position.set(0, 1.22, 0.58);

  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 12);
  wheelGeo.rotateZ(Math.PI / 2);
  const fl = new THREE.Mesh(wheelGeo, tireMat); fl.position.set(-0.65, 0.34, 0.75);
  const fr = new THREE.Mesh(wheelGeo, tireMat); fr.position.set(0.65, 0.34, 0.75);
  const bl = new THREE.Mesh(wheelGeo, tireMat); bl.position.set(-0.65, 0.34, -0.75);
  const br = new THREE.Mesh(wheelGeo, tireMat); br.position.set(0.65, 0.34, -0.75);

  const frontRack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.38), metalMat);
  frontRack.position.set(0, 1.03, 0.88);
  const rearRack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.42), metalMat);
  rearRack.position.set(0, 0.98, -0.9);
  const headLightMat = new THREE.MeshBasicMaterial({ color: 0xffffaa });
  const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), headLightMat);
  headlight.position.set(0, 0.98, 0.75);

  group.add(base, frontCowling, rearCowling, seat, frontAxle, rearAxle, handleStem, handleBar, fl, fr, bl, br, frontRack, rearRack, headlight);
  group.traverse((obj) => { if (obj instanceof THREE.Mesh) obj.castShadow = true; });
  return { mesh: group, seats: 1, wheels: [fl, fr, bl, br] };
}

const VEHICLE_MESH_BUILDERS = {
  [VEHICLE_TYPES.JEEP]: createJeepMesh,
  [VEHICLE_TYPES.TRUCK]: createTruckMesh,
  [VEHICLE_TYPES.MOTORCYCLE]: createMotorcycleMesh,
  [VEHICLE_TYPES.SEDAN]: createSedanMesh,
  [VEHICLE_TYPES.AMBULANCE]: createAmbulanceMesh,
  [VEHICLE_TYPES.ATV]: createATVMesh,
};

const VEHICLE_STATS = {
  [VEHICLE_TYPES.JEEP]: { hp: 200, maxFuel: 100, maxSpeed: 18, acceleration: 8, turnSpeed: 2.0 },
  [VEHICLE_TYPES.TRUCK]: { hp: 300, maxFuel: 100, maxSpeed: 12, acceleration: 5, turnSpeed: 2.0 },
  [VEHICLE_TYPES.MOTORCYCLE]: { hp: 80, maxFuel: 100, maxSpeed: 28, acceleration: 12, turnSpeed: 3.5 },
  [VEHICLE_TYPES.SEDAN]: { hp: 160, maxFuel: 95, maxSpeed: 22, acceleration: 9, turnSpeed: 2.4 },
  [VEHICLE_TYPES.AMBULANCE]: { hp: 240, maxFuel: 120, maxSpeed: 14, acceleration: 5.5, turnSpeed: 1.7 },
  [VEHICLE_TYPES.ATV]: { hp: 120, maxFuel: 85, maxSpeed: 24, acceleration: 11, turnSpeed: 3.2 },
};

export function createVehicle(type, x, z, terrainHeightFn) {
  const selectedType = VEHICLE_MESH_BUILDERS[type] ? type : VEHICLE_TYPES.JEEP;
  const data = VEHICLE_MESH_BUILDERS[selectedType]();
  const stats = VEHICLE_STATS[selectedType];

  const y = terrainHeightFn(x, z);
  data.mesh.position.set(x, y, z);

  return {
    mesh: data.mesh,
    type: selectedType,
    seats: data.seats,
    wheels: data.wheels,
    hp: stats.hp,
    maxHp: stats.hp,
    fuel: stats.maxFuel,
    maxFuel: stats.maxFuel,
    speed: 0,
    maxSpeed: stats.maxSpeed,
    acceleration: stats.acceleration,
    turnSpeed: stats.turnSpeed,
    occupied: false,
    driver: null,
    passengers: [],
    yaw: 0,
    modelYawOffset: Math.PI,
    armorLevel: 0,
    engineLevel: 0,
    destroyed: false,
    hasExploded: false,
  };
}

export function updateVehicle(vehicle, dt, input, terrainHeightFn) {
  if (vehicle.destroyed || vehicle.fuel <= 0) {
    vehicle.speed *= 0.95;
    if (Math.abs(vehicle.speed) < 0.1) vehicle.speed = 0;
    return;
  }

  const forward = new THREE.Vector3(-Math.sin(vehicle.yaw), 0, -Math.cos(vehicle.yaw));

  // Acceleration / braking
  if (input.brake) {
    vehicle.speed *= Math.max(0, 1 - 5.5 * dt);
    if (Math.abs(vehicle.speed) < 0.15) vehicle.speed = 0;
  } else if (input.forward) {
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
  vehicle.mesh.rotation.y = vehicle.yaw + (vehicle.modelYawOffset || 0);

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
  vehicle.hasExploded = false;
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
