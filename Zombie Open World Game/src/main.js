import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  getActiveWeapon,
  getWeaponReserveCap,
  syncPlayerAmmoFields,
  commitPlayerAmmoFields,
  switchToWeapon,
  swapPlayerWeapon,
  reloadWeapon,
  applyWeaponUpgrade,
  getUpgradeCost,
  canAffordUpgrade,
  deductUpgradeCost,
  createCrossbowMesh,
  createFlamethrowerMesh,
  createSniperMesh,
  createRocketLauncherMesh,
  createWorldWeaponMesh,
  initDefaultWeapons,
} from "./combat/weaponSystem.js";
import { showUpgradeBench, hideUpgradeBench } from "./ui/upgradeBench.js";
import { createInventoryOverlay, showInventory, hideInventory } from "./ui/inventory.js";
import { createEventDirector, updateEventDirector, executeEvent, isSurvivorAlive, damageSurvivor, EVENT_TYPES } from "./game/events.js";
import { createMissionGenerator, updateMissions, onMaterialCollected, onZombieKilled, getMissionRewards, formatMissionStatus, MISSION_TYPES } from "./game/missionSystem.js";
import { loadProgression, addGlobalXP, getLevel, formatProgression } from "./game/progression.js";
import gunMetalDiffuseUrl from "./assets/textures/gun_metal_diffuse.jpg";
import gunMetalNormalUrl from "./assets/textures/gun_metal_normal.jpg";
import gunMetalRoughUrl from "./assets/textures/gun_metal_rough.jpg";
import gunGripDiffuseUrl from "./assets/textures/gun_grip_diffuse.jpg";
import gunGripNormalUrl from "./assets/textures/gun_grip_normal.jpg";
import gunGripRoughUrl from "./assets/textures/gun_grip_rough.jpg";
import teammateJacketDiffuseUrl from "./assets/textures/teammate_jacket_diffuse.jpg";
import teammateJacketRoughUrl from "./assets/textures/teammate_jacket_rough.jpg";
import teammateJacketNormalUrl from "./assets/textures/teammate_jacket_normal.jpg";
import teammatePantsDiffuseUrl from "./assets/textures/teammate_pants_diffuse.jpg";
import teammatePantsRoughUrl from "./assets/textures/teammate_pants_rough.jpg";
import teammatePantsNormalUrl from "./assets/textures/teammate_pants_normal.jpg";
import treeBarkDiffuseUrl from "./assets/textures/tree_bark_diffuse.jpg";
import treeBarkBumpUrl from "./assets/textures/tree_bark_bump.jpg";
import zombieClothDiffuseUrl from "./assets/textures/zombie_cloth_diffuse.jpg";
import zombieSkinDetailUrl from "./assets/textures/zombie_skin_detail.jpg";
import zombieFleshRottenRedUrl from "./assets/textures/zombie_flesh_rotten_red_1024.png";
import grassDiffuseUrl from "./assets/textures/grass_diffuse.jpg";
const ak47ModelUrl = new URL("../textured_ak47_-_free_for_download.glb", import.meta.url).href;
const remingtonModelUrl = new URL("../call_of_duty_black_ops_cold_war_-_gallo_sa12.glb", import.meta.url).href;
/** Textured handgun GLB (Webaverse sample asset — https://github.com/webaverse/pistol ) */
const pistolModelUrl = new URL("../webaverse_pistol.glb", import.meta.url).href;

const canvas = document.querySelector("#game");
const healthFillEl = document.querySelector("#health-fill");
const staminaFillEl = document.querySelector("#stamina-fill");
const statsMetaEl = document.querySelector("#stats-meta");
const messageEl = document.querySelector("#message");
const minimapEl = document.querySelector("#minimap");
const minimapCtx = minimapEl.getContext("2d");
const damageFlashEl = document.querySelector("#damage-flash");
const crosshairEl = document.querySelector("#crosshair");
const hitMarkerEl = document.querySelector("#hit-marker");
const worldStatsEl = document.querySelector("#world-stats");
const topCenterAlertEl = document.querySelector("#top-center-alert");
const menuOverlayEl = document.querySelector("#menu-overlay");
const menuTitleEl = document.querySelector("#menu-title");
const menuSubtitleEl = document.querySelector("#menu-subtitle");
const startBtnEl = document.querySelector("#btn-start");
const continueBtnEl = document.querySelector("#btn-continue");
const resumeBtnEl = document.querySelector("#btn-resume");
const restartBtnEl = document.querySelector("#btn-restart");
const audioBtnEl = document.querySelector("#btn-audio");
const skyVignetteEl = document.querySelector("#sky-vignette");
const mapGridEl = document.querySelector("#map-grid");
const mapSelectEl = document.querySelector("#map-select");
const extraMetaEl = document.querySelector("#extra-meta");
const skillMetaEl = document.querySelector("#skill-meta");
const killStreakEl = document.querySelector("#kill-streak-display");
const nightIndicatorEl = document.querySelector("#night-indicator");
const buildHintEl = document.querySelector("#build-hint");

/** Mission list HUD element — created dynamically. */
const missionListEl = document.createElement("div");
missionListEl.id = "mission-list";
document.body.appendChild(missionListEl);

/** Weapon slots HUD element — created dynamically since markup is missing. */
const weaponSlotsEl = document.createElement("div");
weaponSlotsEl.id = "weapon-slots";
document.body.appendChild(weaponSlotsEl);

/** Floating damage number container — absolutely positioned DOM elements. */
const damageNumContainer = document.createElement("div");
damageNumContainer.id = "damage-numbers";
damageNumContainer.style.cssText = "position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:15;";
document.body.appendChild(damageNumContainer);

/** Kill feed — scrolling list of recent kills on the right side. */
const killFeedEl = document.createElement("div");
killFeedEl.id = "kill-feed";
killFeedEl.style.cssText = "position:fixed;top:50%;right:12px;transform:translateY(-50%);pointer-events:none;z-index:13;display:flex;flex-direction:column-reverse;gap:3px;max-height:260px;overflow:hidden;";
document.body.appendChild(killFeedEl);
const killFeedEntries = [];

function addKillFeedEntry(text, color = "#ffdd88") {
  const div = document.createElement("div");
  div.textContent = text;
  div.style.cssText = `color:${color};font-size:11px;font-weight:600;font-family:'Segoe UI',sans-serif;background:rgba(0,0,0,0.55);border:1px solid rgba(255,255,255,0.15);border-radius:4px;padding:2px 7px;text-shadow:0 1px 2px rgba(0,0,0,0.9);opacity:1;transition:opacity 0.5s ease;`;
  killFeedEl.prepend(div);
  const entry = { el: div, life: 5 };
  killFeedEntries.push(entry);
  if (killFeedEntries.length > 7) {
    const old = killFeedEntries.shift();
    old.el.remove();
  }
}

function updateKillFeed(dt) {
  for (let i = killFeedEntries.length - 1; i >= 0; i--) {
    const e = killFeedEntries[i];
    e.life -= dt;
    if (e.life < 1) e.el.style.opacity = `${Math.max(0, e.life)}`;
    if (e.life <= 0) { e.el.remove(); killFeedEntries.splice(i, 1); }
  }
}

/** Reload progress bar shown below crosshair. */
const reloadBarEl = document.createElement("div");
reloadBarEl.style.cssText = "position:fixed;left:50%;top:calc(50% + 22px);transform:translateX(-50%);width:80px;height:4px;background:rgba(0,0,0,0.55);border-radius:999px;border:1px solid rgba(255,255,255,0.2);pointer-events:none;z-index:15;opacity:0;transition:opacity 0.12s ease;";
reloadBarEl.innerHTML = '<div id="reload-bar-fill" style="height:100%;background:linear-gradient(90deg,#f7c948,#ffe080);border-radius:999px;width:0%;transition:none;"></div>';
document.body.appendChild(reloadBarEl);
const reloadBarFillEl = reloadBarEl.querySelector("#reload-bar-fill");

/** Health bar overlay canvas for special/boss zombies. */
const hpBarCanvas = document.createElement("canvas");
hpBarCanvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:14;";
document.body.appendChild(hpBarCanvas);
const hpBarCtx = hpBarCanvas.getContext("2d");
function resizeHpBarCanvas() {
  hpBarCanvas.width = window.innerWidth;
  hpBarCanvas.height = window.innerHeight;
}
resizeHpBarCanvas();
window.addEventListener("resize", resizeHpBarCanvas);

/** Active floating damage number entries. */
const floatingDamageNums = [];

/** Vehicle HP bar element shown when driving. */
const vehicleHudEl = document.createElement("div");
vehicleHudEl.id = "vehicle-hud";
vehicleHudEl.style.cssText = "position:fixed;bottom:140px;left:50%;transform:translateX(-50%);pointer-events:none;display:none;z-index:15;";
vehicleHudEl.innerHTML = `<div style="background:rgba(12,18,12,0.8);border:1px solid rgba(196,218,165,0.38);border-radius:8px;padding:7px 14px;text-align:center;color:#eaf5dd;font-size:12px;min-width:160px;"><div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;opacity:.8;margin-bottom:4px;">Vehicle</div><div id="vehicle-hp-label" style="font-weight:700;margin-bottom:4px;">HP 100 / 100</div><div style="height:8px;border-radius:999px;background:rgba(34,45,30,0.9);border:1px solid rgba(220,238,196,0.18);overflow:hidden;"><div id="vehicle-hp-fill" style="height:100%;background:linear-gradient(90deg,#8b1a1a,#d94040);transition:width .12s linear;width:100%;"></div></div></div>`;
document.body.appendChild(vehicleHudEl);
const vehicleHpLabelEl = vehicleHudEl.querySelector("#vehicle-hp-label");
const vehicleHpFillEl = vehicleHudEl.querySelector("#vehicle-hp-fill");

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x6a7862, 60, 260);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 1.8, 6);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.07;

const hemi = new THREE.HemisphereLight(0xa5d7ff, 0x2e392a, 0.6);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff4d3, 1.4);
sun.position.set(30, 45, -10);
sun.castShadow = true;
sun.shadow.bias = -0.0002;
sun.shadow.normalBias = 0.02;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 8;
sun.shadow.camera.far = 130;
sun.shadow.camera.left = -42;
sun.shadow.camera.right = 42;
sun.shadow.camera.top = 42;
sun.shadow.camera.bottom = -42;
scene.add(sun);

const textureLoader = new THREE.TextureLoader();
const barkDiffuse = textureLoader.load(treeBarkDiffuseUrl);
barkDiffuse.wrapS = THREE.RepeatWrapping;
barkDiffuse.wrapT = THREE.RepeatWrapping;
barkDiffuse.repeat.set(1, 2.2);
barkDiffuse.colorSpace = THREE.SRGBColorSpace;

const barkBump = textureLoader.load(treeBarkBumpUrl);
barkBump.wrapS = THREE.RepeatWrapping;
barkBump.wrapT = THREE.RepeatWrapping;
barkBump.repeat.set(1, 2.2);

const zombieCloth = textureLoader.load(zombieClothDiffuseUrl);
zombieCloth.wrapS = THREE.RepeatWrapping;
zombieCloth.wrapT = THREE.RepeatWrapping;
zombieCloth.repeat.set(0.7, 0.7);
zombieCloth.colorSpace = THREE.SRGBColorSpace;

const zombieSkinDetail = textureLoader.load(zombieSkinDetailUrl);
zombieSkinDetail.wrapS = THREE.RepeatWrapping;
zombieSkinDetail.wrapT = THREE.RepeatWrapping;
zombieSkinDetail.repeat.set(1.2, 1.2);

// Web-sourced texture (OpenGameArt/LPC): rotten flesh diffuse.
const zombieFleshRottenRed = textureLoader.load(zombieFleshRottenRedUrl);
zombieFleshRottenRed.wrapS = THREE.RepeatWrapping;
zombieFleshRottenRed.wrapT = THREE.RepeatWrapping;
zombieFleshRottenRed.repeat.set(1.4, 1.4);
zombieFleshRottenRed.colorSpace = THREE.SRGBColorSpace;

const gunMetalDiffuse = textureLoader.load(gunMetalDiffuseUrl);
gunMetalDiffuse.wrapS = THREE.RepeatWrapping;
gunMetalDiffuse.wrapT = THREE.RepeatWrapping;
gunMetalDiffuse.repeat.set(2.2, 2.2);
gunMetalDiffuse.colorSpace = THREE.SRGBColorSpace;

const gunMetalNormal = textureLoader.load(gunMetalNormalUrl);
gunMetalNormal.wrapS = THREE.RepeatWrapping;
gunMetalNormal.wrapT = THREE.RepeatWrapping;
gunMetalNormal.repeat.set(2.2, 2.2);

const gunMetalRough = textureLoader.load(gunMetalRoughUrl);
gunMetalRough.wrapS = THREE.RepeatWrapping;
gunMetalRough.wrapT = THREE.RepeatWrapping;
gunMetalRough.repeat.set(2.2, 2.2);

const gunGripDiffuse = textureLoader.load(gunGripDiffuseUrl);
gunGripDiffuse.wrapS = THREE.RepeatWrapping;
gunGripDiffuse.wrapT = THREE.RepeatWrapping;
gunGripDiffuse.repeat.set(1.6, 1.6);
gunGripDiffuse.colorSpace = THREE.SRGBColorSpace;

const gunGripNormal = textureLoader.load(gunGripNormalUrl);
gunGripNormal.wrapS = THREE.RepeatWrapping;
gunGripNormal.wrapT = THREE.RepeatWrapping;
gunGripNormal.repeat.set(1.6, 1.6);

const gunGripRough = textureLoader.load(gunGripRoughUrl);
gunGripRough.wrapS = THREE.RepeatWrapping;
gunGripRough.wrapT = THREE.RepeatWrapping;
gunGripRough.repeat.set(1.6, 1.6);

const teammateJacketDiffuse = textureLoader.load(teammateJacketDiffuseUrl);
teammateJacketDiffuse.wrapS = THREE.RepeatWrapping;
teammateJacketDiffuse.wrapT = THREE.RepeatWrapping;
teammateJacketDiffuse.repeat.set(1.2, 1.2);
teammateJacketDiffuse.colorSpace = THREE.SRGBColorSpace;

const teammateJacketRough = textureLoader.load(teammateJacketRoughUrl);
teammateJacketRough.wrapS = THREE.RepeatWrapping;
teammateJacketRough.wrapT = THREE.RepeatWrapping;
teammateJacketRough.repeat.set(1.2, 1.2);

const teammateJacketNormal = textureLoader.load(teammateJacketNormalUrl);
teammateJacketNormal.wrapS = THREE.RepeatWrapping;
teammateJacketNormal.wrapT = THREE.RepeatWrapping;
teammateJacketNormal.repeat.set(1.2, 1.2);

const teammatePantsDiffuse = textureLoader.load(teammatePantsDiffuseUrl);
teammatePantsDiffuse.wrapS = THREE.RepeatWrapping;
teammatePantsDiffuse.wrapT = THREE.RepeatWrapping;
teammatePantsDiffuse.repeat.set(1.2, 1.2);
teammatePantsDiffuse.colorSpace = THREE.SRGBColorSpace;

const teammatePantsRough = textureLoader.load(teammatePantsRoughUrl);
teammatePantsRough.wrapS = THREE.RepeatWrapping;
teammatePantsRough.wrapT = THREE.RepeatWrapping;
teammatePantsRough.repeat.set(1.2, 1.2);

const teammatePantsNormal = textureLoader.load(teammatePantsNormalUrl);
teammatePantsNormal.wrapS = THREE.RepeatWrapping;
teammatePantsNormal.wrapT = THREE.RepeatWrapping;
teammatePantsNormal.repeat.set(1.2, 1.2);

/** Playable regions — noise, foliage, fog/sky tuning, ground canvas colors. */
const WORLD_MAPS = [
  {
    id: "meadows",
    name: "Verdant Meadows",
    blurb: "Rolling hills and deep woods.",
    noiseFreq: 1,
    heightAmp: 0.13,
    treesPerChunk: 12,
    structureChance: 0.3,
    groundTint: 0x89a86f,
    groundFill: "#567c3d",
    speckleRgb: [55, 90, 40],
    stripeRgb: [35, 65, 22],
    leafColor: 0x3f6f30,
    trunkTint: 0xffffff,
    hemiSky: 0xa5d7ff,
    hemiGround: 0x2e392a,
    skyHueShift: 0,
    minimapFill: "rgba(68,95,58,0.72)",
    bgm: "map-meadows.mp3",
    weather: { type: "rain", chance: 0.35, intensity: 0.6 },
  },
  {
    id: "dead_valley",
    name: "Dead Valley",
    blurb: "Gray mist, sparse dead trees.",
    noiseFreq: 0.82,
    heightAmp: 0.15,
    treesPerChunk: 7,
    structureChance: 0.38,
    groundTint: 0x6a7062,
    groundFill: "#4a5248",
    speckleRgb: [62, 68, 58],
    stripeRgb: [38, 42, 36],
    leafColor: 0x3d4538,
    trunkTint: 0x8a8a82,
    hemiSky: 0x8a9cad,
    hemiGround: 0x252a28,
    skyHueShift: -0.03,
    minimapFill: "rgba(72,78,70,0.75)",
    bgm: "map-dead_valley.mp3",
    weather: { type: "fog", chance: 0.65, intensity: 0.85 },
  },
  {
    id: "frost",
    name: "Frost Expanse",
    blurb: "Frozen flats, ice-glazed crowns.",
    noiseFreq: 1.15,
    heightAmp: 0.09,
    treesPerChunk: 5,
    structureChance: 0.22,
    groundTint: 0xb8d4dc,
    groundFill: "#9eb8c4",
    speckleRgb: [200, 220, 230],
    stripeRgb: [120, 140, 155],
    leafColor: 0xc5e8f0,
    trunkTint: 0x6a5a4a,
    hemiSky: 0xc8e8ff,
    hemiGround: 0x3a484e,
    skyHueShift: 0.04,
    minimapFill: "rgba(130,160,175,0.72)",
    bgm: "map-frost.mp3",
    weather: { type: "snow", chance: 0.55, intensity: 0.7 },
  },
  {
    id: "badlands",
    name: "Badlands",
    blurb: "Rust canyons, brutal slopes.",
    noiseFreq: 0.62,
    heightAmp: 0.2,
    treesPerChunk: 2,
    structureChance: 0.5,
    groundTint: 0xc4906a,
    groundFill: "#a86f48",
    speckleRgb: [140, 85, 55],
    stripeRgb: [90, 50, 35],
    leafColor: 0x5c4a32,
    trunkTint: 0x8b6914,
    hemiSky: 0xffc9a0,
    hemiGround: 0x4a3020,
    skyHueShift: 0.06,
    minimapFill: "rgba(120,82,52,0.75)",
    bgm: "map-badlands.mp3",
    weather: { type: "dust", chance: 0.4, intensity: 0.5 },
  },
  {
    id: "ruins",
    name: "Ruined City",
    blurb: "Broken blocks and ash asphalt.",
    noiseFreq: 1.45,
    heightAmp: 0.07,
    treesPerChunk: 4,
    structureChance: 0.72,
    groundTint: 0x5a5d62,
    groundFill: "#3a3d42",
    speckleRgb: [70, 72, 78],
    stripeRgb: [35, 36, 40],
    leafColor: 0x2f4a38,
    trunkTint: 0x555555,
    hemiSky: 0x8899aa,
    hemiGround: 0x1c1e22,
    skyHueShift: -0.02,
    minimapFill: "rgba(58,62,68,0.75)",
    bgm: "map-ruins.mp3",
    weather: { type: "ash", chance: 0.5, intensity: 0.6 },
  },
  {
    id: "outbreak_city",
    name: "Outbreak City",
    blurb: "Flat ruined streets — Kenney buildings + procedural asphalt.",
    flatTerrain: true,
    noiseFreq: 1,
    heightAmp: 0,
    treesPerChunk: 0,
    structureChance: 0,
    cityBuildingsPerChunk: 5,
    useCityGroundTexture: true,
    groundTint: 0x8f9399,
    groundFill: "#567c3d",
    speckleRgb: [55, 90, 40],
    stripeRgb: [35, 65, 22],
    leafColor: 0x2a3228,
    trunkTint: 0x555555,
    hemiSky: 0x9aa8c2,
    hemiGround: 0x2a2d32,
    skyHueShift: -0.01,
    minimapFill: "rgba(72,76,82,0.78)",
    bgm: "map-city.mp3",
    weather: { type: "rain", chance: 0.45, intensity: 0.55 },
  },
];

function mapById(id) {
  return WORLD_MAPS.find((m) => m.id === id) || WORLD_MAPS[0];
}

let activeMapConfig = mapById(localStorage.getItem("zowg_map") || "meadows");
let pendingMapId = activeMapConfig.id;
let mapDirty = false;
let akTemplateRef = null;
let pistolTemplateRef = null;
let remingtonTemplateRef = null;

/** Reusable Vector3 pool to reduce per-frame GC pressure. */
const _v3Pool = Array.from({ length: 8 }, () => new THREE.Vector3());
let _v3Index = 0;
function getV3() {
  _v3Index = (_v3Index + 1) % _v3Pool.length;
  return _v3Pool[_v3Index].set(0, 0, 0);
}

hemi.color.setHex(activeMapConfig.hemiSky);
hemi.groundColor.setHex(activeMapConfig.hemiGround);

function createGroundTextureForMap(map, grassPhotoTex = null) {
  const size = 128;
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = size;
  textureCanvas.height = size;
  const ctx = textureCanvas.getContext("2d");

  ctx.fillStyle = map.groundFill;
  ctx.fillRect(0, 0, size, size);

  const [sr, sg, sb] = map.speckleRgb;
  for (let i = 0; i < 2200; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 2.1 + 0.4;
    const green = sg + Math.floor(Math.random() * 50 - 12);
    const red = sr + Math.floor(Math.random() * 40 - 15);
    const blue = sb + Math.floor(Math.random() * 35 - 10);
    ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${0.18 + Math.random() * 0.15})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const [tr, tg, tb] = map.stripeRgb;
  for (let i = 0; i < 180; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = 8 + Math.random() * 20;
    const h = 1 + Math.random() * 2;
    ctx.fillStyle = `rgba(${tr}, ${tg}, ${tb}, ${0.08 + Math.random() * 0.07})`;
    ctx.fillRect(x, y, w, h);
  }

  if (grassPhotoTex && grassPhotoTex.image && grassPhotoTex.image.complete && grassPhotoTex.image.width) {
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.globalCompositeOperation = "multiply";
    const pat = ctx.createPattern(grassPhotoTex.image, "repeat");
    if (pat) {
      const scale = 0.22;
      ctx.scale(scale, scale);
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, size / scale, size / scale);
    }
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(20, 20);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

let groundDiffuse = createGroundTextureForMap(activeMapConfig);
/** Seamless procedural asphalt for Outbreak City (never use a sprite atlas as terrain). */
let cityStreetDiffuse = null;

const groundChunks = [];
const trees = [];
const structureGroups = [];
const cityPropGroups = [];
const visionBlockers = [];

/** Bullet mesh + record pooling — fewer allocations on high fire-rate paths (see GC / object-pool guidance for JS game loops). */
const bulletMeshPoolsByKey = new Map();
const bulletRadiusGeometry = new Map();
const bulletColorMaterial = new Map();
const bulletRecordPool = [];

const particlePool = [];
const zombiePool = [];
const barricades = [];

/** Kenney CC0 city kit (GLB) — cloned per chunk on the Outbreak City map. */
const cityBuildingTemplates = [];

function assetBasePath() {
  let b = import.meta.env.BASE_URL || "/";
  if (!b.endsWith("/")) b += "/";
  return b;
}

function createCityStreetGroundTexture() {
  const size = 256;
  const cvs = document.createElement("canvas");
  cvs.width = size;
  cvs.height = size;
  const ctx = cvs.getContext("2d");
  ctx.fillStyle = "#3a3d45";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 9000; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const a = 0.04 + Math.random() * 0.1;
    ctx.fillStyle = `rgba(110, 118, 128, ${a})`;
    ctx.fillRect(x, y, 1 + Math.random(), 1 + Math.random() * 2);
  }
  for (let i = 0; i < 140; i += 1) {
    ctx.strokeStyle = `rgba(22, 24, 30, ${0.18 + Math.random() * 0.22})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    let y = Math.random() * size;
    ctx.moveTo(0, y);
    for (let x = 0; x < size; x += 6) {
      y += (Math.random() - 0.5) * 2.2;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  for (let i = 0; i < 35; i += 1) {
    ctx.fillStyle = `rgba(55, 58, 64, ${0.12 + Math.random() * 0.1})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 40 + Math.random() * 80, 3 + Math.random() * 2);
  }
  const tex = new THREE.CanvasTexture(cvs);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

async function loadCityBuildingLibrary() {
  if (cityBuildingTemplates.length) return;
  const names = [
    "building-skyscraper-a.glb",
    "building-skyscraper-b.glb",
    "building-skyscraper-c.glb",
    "building-skyscraper-d.glb",
    "building-skyscraper-e.glb",
    "building-a.glb",
    "building-b.glb",
    "building-c.glb",
    "building-d.glb",
    "low-detail-building-wide-a.glb",
    "low-detail-building-wide-b.glb",
    "low-detail-building-a.glb",
    "low-detail-building-b.glb",
  ];
  const loader = new GLTFLoader();
  const path = `${assetBasePath()}city/buildings/`;
  loader.setPath(path);
  try {
    for (const name of names) {
      const gltf = await loader.loadAsync(name);
      const root = gltf.scene;
      root.traverse((obj) => {
        if (obj.isLight || obj.isCamera) obj.removeFromParent();
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = true;
          obj.receiveShadow = true;
          obj.frustumCulled = true;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of mats) {
            if (!mat) continue;
            if (mat.map) mat.map.colorSpace = THREE.SRGBColorSpace;
            if (mat.emissiveMap) mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
            mat.needsUpdate = true;
          }
        }
      });
      cityBuildingTemplates.push(root);
    }
  } catch {
    cityBuildingTemplates.length = 0;
  }
}
const chunkSize = 60;
const chunkRadius = 2;
const chunkGeometry = new THREE.PlaneGeometry(chunkSize, chunkSize, 48, 48);

const player = {
  position: new THREE.Vector3(0, 1.8, 0),
  velocityY: 0,
  moveVelocity: new THREE.Vector3(),
  yaw: Math.PI,
  pitch: 0,
  hp: 100,
  stamina: 100,
  ammo: 20,
  reserveAmmo: 100,
  activeWeapon: 0,
  weapons: initDefaultWeapons(),
  kills: 0,
  shootCooldown: 0,
  reloadTimer: 0,
  bobTime: 0,
  damageFlash: 0,
  isGrounded: true,
};

const settings = {
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

const zombies = [];
const bullets = [];
const pickups = [];
const keys = new Set();
let gameTime = 0;
let spawnTimer = 0;
let wave = 1;
let waveSpawnBudget = 24;
let nextWaveTimer = 0;
let paused = false;
let alertTimer = 0;
let hitMarkerTimer = 0;
let crosshairSpread = 0;
let crosshairFireImpulse = 0;
let gameOver = false;
let pointerLocked = false;
let weaponRecoil = 0;
let weaponKick = 0;
let lookSwayX = 0;
let lookSwayY = 0;
let gameState = "MENU_TITLE";
let score = 0;
let killStreak = 0;
let killStreakTimer = 0;
let screenShake = 0;
let screenShakeTime = Math.random() * 1000;
let isCrouching = false;
let isADS = false;
let grenadeCount = 3;
let molotovCount = 0;
let landMineCount = 0;
let spikeTrapCount = 0;
let isNight = false;
let hordeNightActive = false;
let hordeNightTimer = 0;
let bossAlive = false;
const grenades = [];
const arrows = [];
const rockets = [];
const flamePuffs = [];
const molotovProjectiles = [];
const molotovFires = [];
const landMines = [];
const spikeTraps = [];
const particles = [];
const barrels = [];
const acidPuddles = [];
const zombieCorpses = [];
const distractions = [];
const supplyDrops = [];

// Dynamic Event Director
const eventDirector = createEventDirector();
const missionGenerator = createMissionGenerator();

// Skill/Perk System
const skills = {
  reloadSpeed: { level: 0, max: 3, value: 0, name: "Fast Hands" },
  damage: { level: 0, max: 3, value: 0, name: "Power Shot" },
  health: { level: 0, max: 3, value: 0, name: "Toughness" },
  speed: { level: 0, max: 3, value: 0, name: "Agility" },
  headshotBonus: { level: 0, max: 3, value: 0, name: "Dead Eye" },
};
let skillPoints = 0;
let skillXp = 0;
let meleeCooldown = 0;
let noiseMakerCount = 2;
let hitMarkerPulse = 0;
let hitMarkerHeadshotTimer = 0;
let hitStopTimer = 0;
let hitStopCooldown = 0;
const playerProgression = loadProgression();

/** Scavenging / Crafting materials */
const materials = {
  scrap: 0,
  wood: 0,
  metal: 0,
  cloth: 0,
  chemicals: 0,
};

/** Weather system state */
const weatherState = {
  active: false,
  type: null,
  intensity: 0,
  particles: [],
  windDir: new THREE.Vector3(1, 0, 0.3).normalize(),
  timer: 0,
  nextChange: 30 + Math.random() * 60,
};

/** Barricade build mode */
let buildMode = false;
let buildType = "wood"; // wood | metal

let upgradeBenchOpen = false;
const upgradeBenchUI = {
  overlay: document.querySelector("#upgrade-bench"),
  weaponList: document.querySelector("#upgrade-weapon-list"),
  details: document.querySelector("#upgrade-details"),
  weaponName: document.querySelector("#upgrade-weapon-name"),
  grid: document.querySelector("#upgrade-grid"),
  closeBtn: document.querySelector("#upgrade-bench-close"),
};

// Inventory system
let inventoryOpen = false;
const inventoryUI = createInventoryOverlay();
if (inventoryUI.closeBtn) {
  inventoryUI.closeBtn.addEventListener("click", () => {
    inventoryOpen = false;
    hideInventory(inventoryUI);
    paused = false;
    if (!gameOver) canvas.requestPointerLock();
  });
}

// Vehicle system
const vehicles = [];
let activeVehicle = null;
let vehicleInput = { forward: false, backward: false, left: false, right: false };

const teammates = [];
/** Calm menu / death screen loop (distinct from in-game map tracks). */
const TITLE_BGM_FILE = "title.mp3";

const audioSystem = {
  ctx: null,
  unlocked: false,
  muted: localStorage.getItem("zowg_audio_muted") === "1",
  master: null,
  music: null,
  ambient: null,
  sfx: null,
  ui: null,
  titleTimer: null,
  ambientNodes: [],
  /** HTML5 element for reliable looping MP3 background music (Web Audio decode was easy to miss in-browser). */
  bgmEl: null,
  bgmCurrentFile: null,
  bgmNominalVolume: 0.55,
};

// Re-exported via weaponSystem.js imports at top of file.

function clearInputState() {
  keys.clear();
  isADS = false;
}

function updateAudioButtonLabel() {
  audioBtnEl.textContent = `Audio: ${audioSystem.muted ? "Off" : "On"}`;
}

// Combat feedback based on "juice" best practices: use smooth trauma-based shake
// and short, throttled freeze frames for heavy impacts instead of random jitter.
function addScreenShake(amount) {
  screenShake = Math.min(1, screenShake + amount);
}

function triggerHitStop(duration) {
  if (duration <= 0 || gameState !== "PLAYING" || gameOver || hitStopCooldown > 0) return;
  hitStopTimer = Math.max(hitStopTimer, duration);
  hitStopCooldown = Math.max(hitStopCooldown, Math.max(0.08, duration * 2.5));
}

function triggerHitMarker(isHeadshot = false) {
  hitMarkerTimer = isHeadshot ? 0.18 : 0.12;
  hitMarkerPulse = 1;
  if (isHeadshot) hitMarkerHeadshotTimer = 0.22;
}

function toggleAudioMuted() {
  audioSystem.muted = !audioSystem.muted;
  if (audioSystem.master) audioSystem.master.gain.value = audioSystem.muted ? 0 : 0.85;
  localStorage.setItem("zowg_audio_muted", audioSystem.muted ? "1" : "0");
  applyBgmVolume();
  if (!audioSystem.muted) {
    if (audioSystem.unlocked) setAudioScene(gameState === "PLAYING" ? "playing" : gameState === "MENU_PAUSE" ? "pause" : "title");
    if (audioSystem.bgmEl?.src) audioSystem.bgmEl.play().catch(() => {});
  } else {
    audioSystem.bgmEl?.pause();
  }
  updateAudioButtonLabel();
}

function createAudioGraph() {
  if (audioSystem.ctx) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  audioSystem.ctx = ctx;
  audioSystem.master = ctx.createGain();
  audioSystem.music = ctx.createGain();
  audioSystem.ambient = ctx.createGain();
  audioSystem.sfx = ctx.createGain();
  audioSystem.ui = ctx.createGain();

  audioSystem.music.gain.value = 0.32;
  audioSystem.ambient.gain.value = 0.26;
  audioSystem.sfx.gain.value = 0.78;
  audioSystem.ui.gain.value = 0.45;
  audioSystem.master.gain.value = audioSystem.muted ? 0 : 0.85;

  audioSystem.music.connect(audioSystem.master);
  audioSystem.ambient.connect(audioSystem.master);
  audioSystem.sfx.connect(audioSystem.master);
  audioSystem.ui.connect(audioSystem.master);
  audioSystem.master.connect(ctx.destination);

  // Spatial listener (HRTF-based 3D audio)
  audioSystem.listener = ctx.listener;
  // Forward orientation is -Z, up is +Y in Three.js camera space
  if (audioSystem.listener.positionX) {
    audioSystem.listener.positionX.value = 0;
    audioSystem.listener.positionY.value = 0;
    audioSystem.listener.positionZ.value = 0;
  }
}

async function ensureAudioUnlocked() {
  createAudioGraph();
  if (!audioSystem.ctx) return;
  if (audioSystem.ctx.state !== "running") {
    try {
      await audioSystem.ctx.resume();
    } catch {
      return;
    }
  }
  audioSystem.unlocked = true;
  if (gameState === "PLAYING") setAudioScene("playing");
  else if (gameState === "MENU_DEATH") setAudioScene("death");
  else if (gameState === "MENU_PAUSE") setAudioScene("pause");
  else setAudioScene("title");
}

function playNoise(duration, gainNode, options = {}) {
  if (!audioSystem.unlocked || audioSystem.muted || !audioSystem.ctx || !gainNode) return;
  const { volume = 0.2, hp = 300, lp = 4000 } = options;
  const ctx = audioSystem.ctx;
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < channel.length; i += 1) channel[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const highPass = ctx.createBiquadFilter();
  highPass.type = "highpass";
  highPass.frequency.value = hp;
  const lowPass = ctx.createBiquadFilter();
  lowPass.type = "lowpass";
  lowPass.frequency.value = lp;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  source.connect(highPass);
  highPass.connect(lowPass);
  lowPass.connect(g);
  g.connect(gainNode);
  source.start(t);
  source.stop(t + duration + 0.01);
}

function playTone(freq, duration, gainNode, options = {}) {
  if (!audioSystem.unlocked || audioSystem.muted || !audioSystem.ctx || !gainNode) return;
  const { volume = 0.2, type = "triangle", glide = 0 } = options;
  const ctx = audioSystem.ctx;
  const osc = ctx.createOscillator();
  osc.type = type;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  osc.frequency.setValueAtTime(freq, t);
  if (glide !== 0) osc.frequency.linearRampToValueAtTime(freq + glide, t + duration);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(g);
  g.connect(gainNode);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

/** Play a spatial 3D sound at a world position (e.g., zombie growl, explosion).
 * Uses HRTF panning relative to the audio listener (camera/player position).
 */
const _spatialForward = new THREE.Vector3();
const _spatialUp = new THREE.Vector3();
function playSpatialSfx(name, worldPosition, volume = 1) {
  if (!audioSystem.unlocked || audioSystem.muted || !audioSystem.ctx) return;
  const ctx = audioSystem.ctx;
  const panner = ctx.createPanner();
  panner.panningModel = "HRTF";
  panner.distanceModel = "inverse";
  panner.refDistance = 6;
  panner.maxDistance = 100;
  panner.rolloffFactor = 1.2;
  panner.coneInnerAngle = 360;
  panner.coneOuterAngle = 360;
  panner.coneOuterGain = 0;

  // Update listener position/orientation from camera
  const cam = camera;
  _spatialForward.set(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
  _spatialUp.set(0, 1, 0).applyQuaternion(cam.quaternion).normalize();
  if (audioSystem.listener.positionX) {
    audioSystem.listener.positionX.value = cam.position.x;
    audioSystem.listener.positionY.value = cam.position.y;
    audioSystem.listener.positionZ.value = cam.position.z;
    audioSystem.listener.forwardX.value = _spatialForward.x;
    audioSystem.listener.forwardY.value = _spatialForward.y;
    audioSystem.listener.forwardZ.value = _spatialForward.z;
    audioSystem.listener.upX.value = _spatialUp.x;
    audioSystem.listener.upY.value = _spatialUp.y;
    audioSystem.listener.upZ.value = _spatialUp.z;
  } else {
    audioSystem.listener.setPosition(cam.position.x, cam.position.y, cam.position.z);
    audioSystem.listener.setOrientation(_spatialForward.x, _spatialForward.y, _spatialForward.z, _spatialUp.x, _spatialUp.y, _spatialUp.z);
  }

  panner.positionX.value = worldPosition.x;
  panner.positionY.value = worldPosition.y;
  panner.positionZ.value = worldPosition.z;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  const outGain = ctx.createGain();
  outGain.gain.value = 1.0;
  outGain.connect(audioSystem.sfx);

  switch (name) {
    case "zombie_growl": {
      const osc = ctx.createOscillator();
      const noiseGain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 90 + Math.random() * 40;
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.35);
      noiseGain.gain.value = 0.14 * volume;
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(panner);
      panner.connect(gain);
      gain.connect(outGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
      break;
    }
    case "zombie_death": {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = 105;
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.22);
      gain.gain.value = 0.15 * volume;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(panner);
      panner.connect(gain);
      gain.connect(outGain);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      break;
    }
    case "explosion": {
      const bufferSize = ctx.sampleRate * 0.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.08));
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      gain.gain.value = 0.5 * volume;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      src.connect(panner);
      panner.connect(gain);
      gain.connect(outGain);
      src.start();
      break;
    }
    default:
      // Fall back to non-spatial for unknown sounds
      playSfx(name, volume);
      return;
  }
}

function playSfx(name, volume = 1) {
  if (!audioSystem.unlocked || audioSystem.muted) return;
  switch (name) {
    case "ui_click":
      playTone(900, 0.05, audioSystem.ui, { volume: 0.1 * volume, type: "square", glide: -120 });
      break;
    case "gunshot_player":
      playNoise(0.09, audioSystem.sfx, { volume: 0.24 * volume, hp: 500, lp: 5000 });
      playTone(120, 0.08, audioSystem.sfx, { volume: 0.16 * volume, type: "sawtooth", glide: -60 });
      break;
    case "teammate_shot":
      playNoise(0.06, audioSystem.sfx, { volume: 0.15 * volume, hp: 600, lp: 4200 });
      playTone(180, 0.05, audioSystem.sfx, { volume: 0.06 * volume, type: "triangle", glide: -40 });
      break;
    case "reload_player":
      playTone(320, 0.07, audioSystem.sfx, { volume: 0.08 * volume, type: "square", glide: -35 });
      playTone(420, 0.07, audioSystem.sfx, { volume: 0.06 * volume, type: "square", glide: -20 });
      break;
    case "zombie_hit":
      playTone(130, 0.11, audioSystem.sfx, { volume: 0.1 * volume, type: "sawtooth", glide: -30 });
      break;
    case "zombie_death":
      playTone(105, 0.22, audioSystem.sfx, { volume: 0.15 * volume, type: "sawtooth", glide: -70 });
      break;
    case "shotgun_player":
      playNoise(0.16, audioSystem.sfx, { volume: 0.42 * volume, hp: 160, lp: 3000 });
      playTone(80, 0.14, audioSystem.sfx, { volume: 0.25 * volume, type: "sawtooth", glide: -50 });
      break;
    case "grenade_throw":
      playTone(520, 0.06, audioSystem.sfx, { volume: 0.07 * volume, type: "square", glide: -90 });
      playNoise(0.04, audioSystem.sfx, { volume: 0.06 * volume, hp: 900, lp: 3200 });
      break;
    case "explosion":
      playNoise(0.6, audioSystem.sfx, { volume: 0.6 * volume, hp: 18, lp: 800 });
      playTone(52, 0.45, audioSystem.sfx, { volume: 0.38 * volume, type: "sawtooth", glide: -28 });
      break;
    case "boss_alert":
      playTone(108, 0.7, audioSystem.sfx, { volume: 0.32 * volume, type: "sawtooth", glide: -18 });
      playTone(80, 0.9, audioSystem.sfx, { volume: 0.26 * volume, type: "square", glide: -12 });
      break;
    case "acid_spit":
      playNoise(0.28, audioSystem.sfx, { volume: 0.18 * volume, hp: 200, lp: 2200 });
      playTone(440, 0.12, audioSystem.sfx, { volume: 0.08 * volume, type: "sawtooth", glide: 90 });
      break;
    case "hunter_leap":
      playTone(180, 0.18, audioSystem.sfx, { volume: 0.25 * volume, type: "sawtooth", glide: -120 });
      break;
    case "charger_charge":
      playNoise(0.55, audioSystem.sfx, { volume: 0.45 * volume, hp: 60, lp: 800 });
      break;
    case "noise_maker":
      playTone(800, 0.25, audioSystem.sfx, { volume: 0.35 * volume, type: "square", glide: -200 });
      playNoise(0.4, audioSystem.sfx, { volume: 0.2 * volume, hp: 400, lp: 4000 });
      break;
    case "melee_knife":
      playNoise(0.05, audioSystem.sfx, { volume: 0.22 * volume, hp: 1200, lp: 5000 });
      playTone(420, 0.06, audioSystem.sfx, { volume: 0.1 * volume, type: "triangle" });
      break;
    case "supply_drop":
      playTone(660, 0.35, audioSystem.sfx, { volume: 0.28 * volume, type: "sine", glide: -100 });
      playTone(880, 0.5, audioSystem.sfx, { volume: 0.2 * volume, type: "sine" });
      break;
    case "zombie_revive":
      playTone(95, 0.55, audioSystem.sfx, { volume: 0.22 * volume, type: "sawtooth", glide: 25 });
      break;
    case "skill_up":
      playTone(523.25, 0.15, audioSystem.ui, { volume: 0.35 * volume, type: "sine" });
      playTone(659.25, 0.25, audioSystem.ui, { volume: 0.3 * volume, type: "sine" });
      break;
    default:
      break;
  }
}

function musicAssetUrl(filename) {
  let base = import.meta.env.BASE_URL || "/";
  if (!base.endsWith("/")) base += "/";
  return `${base}music/${encodeURIComponent(filename)}`;
}

function ensureBgmElement() {
  if (audioSystem.bgmEl) return audioSystem.bgmEl;
  const el = document.createElement("audio");
  el.setAttribute("playsinline", "true");
  el.preload = "auto";
  el.addEventListener("error", () => {
    // The project currently ships without music assets; fall back to procedural audio.
    if (audioSystem.bgmCurrentFile === TITLE_BGM_FILE) startTitleMusicFallback();
    else startAmbientLoop();
  });
  document.body.appendChild(el);
  audioSystem.bgmEl = el;
  return el;
}

function applyBgmVolume() {
  const el = audioSystem.bgmEl;
  if (!el) return;
  el.volume = audioSystem.muted ? 0 : audioSystem.bgmNominalVolume;
}

function stopHtmlBgmHard() {
  const el = audioSystem.bgmEl;
  if (!el) return;
  el.pause();
  el.removeAttribute("src");
  el.load();
  audioSystem.bgmCurrentFile = null;
}

function stopTitleMusic() {
  stopHtmlBgmHard();
  if (audioSystem.titleTimer) {
    clearInterval(audioSystem.titleTimer);
    audioSystem.titleTimer = null;
  }
}

async function playHtmlBgm(filename) {
  if (!audioSystem.unlocked || !filename) return;
  const el = ensureBgmElement();
  if (audioSystem.bgmCurrentFile === filename && el.src) {
    applyBgmVolume();
    try {
      await el.play();
    } catch {
      if (filename === TITLE_BGM_FILE) startTitleMusicFallback();
      else startAmbientLoop();
    }
    return;
  }
  audioSystem.bgmCurrentFile = filename;
  el.loop = true;
  el.src = musicAssetUrl(filename);
  el.load();
  applyBgmVolume();
  try {
    await el.play();
  } catch {
    if (filename === TITLE_BGM_FILE) startTitleMusicFallback();
    else startAmbientLoop();
  }
}

function startTitleMusicFallback() {
  if (!audioSystem.unlocked || audioSystem.muted || audioSystem.titleTimer) return;
  const el = audioSystem.bgmEl;
  if (el && el.src && !el.paused) return;
  const notes = [220, 261.63, 329.63, 392, 329.63, 261.63];
  let idx = 0;
  audioSystem.titleTimer = setInterval(() => {
    playTone(notes[idx % notes.length], 0.24, audioSystem.music, { volume: 0.12, type: "triangle", glide: -8 });
    if (idx % 2 === 0) playTone(notes[(idx + 2) % notes.length] / 2, 0.32, audioSystem.music, { volume: 0.05, type: "sine" });
    idx += 1;
  }, 320);
}

function stopAmbientLoop() {
  for (const n of audioSystem.ambientNodes) {
    try {
      n.stop();
    } catch {
      // no-op
    }
  }
  audioSystem.ambientNodes = [];
}

function startAmbientLoop() {
  if (!audioSystem.unlocked || audioSystem.muted || audioSystem.ambientNodes.length > 0) return;
  const el = audioSystem.bgmEl;
  if (el && el.src && !el.paused) return;
  const base = [58, 73];
  for (const f of base) {
    const osc = audioSystem.ctx.createOscillator();
    const g = audioSystem.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    g.gain.value = 0.03;
    osc.connect(g);
    g.connect(audioSystem.ambient);
    osc.start();
    audioSystem.ambientNodes.push(osc);
  }
}

function setAudioScene(mode) {
  if (!audioSystem.unlocked) return;
  stopAmbientLoop();
  if (audioSystem.titleTimer) {
    clearInterval(audioSystem.titleTimer);
    audioSystem.titleTimer = null;
  }
  if (mode === "title" || mode === "death") {
    void playHtmlBgm(TITLE_BGM_FILE);
  } else if (mode === "pause") {
    void playHtmlBgm(activeMapConfig.bgm);
  } else if (mode === "playing") {
    void playHtmlBgm(activeMapConfig.bgm);
  }
}

function setMenuMode(mode) {
  if (mode === "title") {
    gameState = "MENU_TITLE";
    menuTitleEl.textContent = "DeadTakeover";
    menuSubtitleEl.textContent = "Survive with your teammates.";
    startBtnEl.classList.remove("is-hidden");
    resumeBtnEl.classList.add("is-hidden");
    restartBtnEl.classList.remove("is-hidden");
    if (continueBtnEl) {
      if (hasSavedRun()) continueBtnEl.classList.remove("is-hidden");
      else continueBtnEl.classList.add("is-hidden");
    }
    if (mapSelectEl) {
      mapSelectEl.classList.remove("is-hidden");
      buildMapSelectUi();
    }
  } else if (mode === "pause") {
    gameState = "MENU_PAUSE";
    menuTitleEl.textContent = "Paused";
    menuSubtitleEl.textContent = "Take a breath, then jump back in.";
    startBtnEl.classList.add("is-hidden");
    resumeBtnEl.classList.remove("is-hidden");
    restartBtnEl.classList.remove("is-hidden");
    if (mapSelectEl) mapSelectEl.classList.add("is-hidden");
  } else if (mode === "death") {
    gameState = "MENU_DEATH";
    menuTitleEl.textContent = "You Died";
    const runXP = Math.floor(score * 0.05 + player.kills * 2);
    const progResult = addGlobalXP(playerProgression, runXP);
    let progMsg = `Wave ${wave} | Kills ${player.kills} | Score ${score} | +${runXP} Global XP`;
    if (progResult.leveled) {
      progMsg += ` | ⬆ Lvl ${getLevel(playerProgression)}!`;
      if (progResult.newUnlocks.length > 0) {
        progMsg += ` Unlocked: ${progResult.newUnlocks.map((u) => u.name).join(", ")}!`;
      }
    }
    menuSubtitleEl.textContent = progMsg;
    startBtnEl.classList.add("is-hidden");
    resumeBtnEl.classList.add("is-hidden");
    restartBtnEl.classList.remove("is-hidden");
    if (mapSelectEl) mapSelectEl.classList.add("is-hidden");
  }
  menuOverlayEl.classList.remove("is-hidden");
  setAudioScene(mode);
}

function startPlaying() {
  paused = false;
  gameState = "PLAYING";
  menuOverlayEl.classList.add("is-hidden");
  setAudioScene("playing");
}

// ─── Save / Load Progress ────────────────────────────────────────────────────
function hasSavedRun() {
  return localStorage.getItem("zowg_save") !== null;
}

function saveRun() {
  if (gameState !== "PLAYING" || gameOver) return;
  const save = {
    wave,
    score,
    playerKills: player.kills,
    playerHp: player.hp,
    playerStamina: player.stamina,
    gameTime,
    materials,
    skills,
    skillPoints,
    skillXp,
    grenadeCount,
    molotovCount,
    landMineCount,
    spikeTrapCount,
    noiseMakerCount,
    activeMapId: activeMapConfig.id,
    weapons: player.weapons.map(w => ({ name: w.name, ammo: w.ammo, reserve: w.reserve })),
    activeWeapon: player.activeWeapon,
    timestamp: Date.now(),
  };
  localStorage.setItem("zowg_save", JSON.stringify(save));
  topCenterAlertEl.textContent = "💾 Progress Saved!";
  alertTimer = 1.5;
}

function loadRun() {
  const raw = localStorage.getItem("zowg_save");
  if (!raw) return false;
  try {
    const save = JSON.parse(raw);
    wave = save.wave || 1;
    score = save.score || 0;
    player.kills = save.playerKills || 0;
    player.hp = save.playerHp || 100;
    player.stamina = save.playerStamina || 100;
    gameTime = save.gameTime || 0;
    Object.assign(materials, save.materials || materials);
    Object.keys(skills).forEach(k => {
      if (save.skills && save.skills[k]) {
        skills[k].level = save.skills[k].level || 0;
        skills[k].value = save.skills[k].value || 0;
      }
    });
    skillPoints = save.skillPoints || 0;
    skillXp = save.skillXp || 0;
    grenadeCount = save.grenadeCount || 3;
    molotovCount = save.molotovCount || 0;
    landMineCount = save.landMineCount || 0;
    spikeTrapCount = save.spikeTrapCount || 0;
    noiseMakerCount = save.noiseMakerCount || 2;
    if (save.weapons) {
      for (let i = 0; i < Math.min(save.weapons.length, player.weapons.length); i++) {
        player.weapons[i].ammo = save.weapons[i].ammo;
        player.weapons[i].reserve = save.weapons[i].reserve;
      }
    }
    player.activeWeapon = save.activeWeapon || 0;
    syncPlayerAmmoFields(player);
    waveSpawnBudget = 18 + wave * 8;
    settings.maxZombies = Math.min(80, 24 + wave * 5);
    return true;
  } catch {
    return false;
  }
}

function clearSavedRun() {
  localStorage.removeItem("zowg_save");
}

function autoSaveTick(dt) {
  if (gameState !== "PLAYING" || gameOver) return;
  autoSaveTick.timer = (autoSaveTick.timer || 0) + dt;
  if (autoSaveTick.timer >= 30) {
    autoSaveTick.timer = 0;
    saveRun();
  }
}

const groundMaterial = new THREE.MeshStandardMaterial({
  map: groundDiffuse,
  color: activeMapConfig.groundTint,
  roughness: 0.95,
  metalness: 0,
});

const grassGroundDiffuse = textureLoader.load(grassDiffuseUrl, (tex) => {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (!activeMapConfig.useCityGroundTexture) {
    if (groundDiffuse) groundDiffuse.dispose();
    groundDiffuse = createGroundTextureForMap(activeMapConfig, tex);
    groundMaterial.map = groundDiffuse;
    groundMaterial.needsUpdate = true;
  }
});
grassGroundDiffuse.wrapS = THREE.RepeatWrapping;
grassGroundDiffuse.wrapT = THREE.RepeatWrapping;
grassGroundDiffuse.repeat.set(6, 6);
grassGroundDiffuse.colorSpace = THREE.SRGBColorSpace;

const zombieSkinMaterial = new THREE.MeshStandardMaterial({
  map: zombieFleshRottenRed,
  color: 0xc3bea7,
  bumpMap: zombieSkinDetail,
  bumpScale: 0.05,
  roughness: 0.92,
  metalness: 0.02,
});

const zombieClothMaterial = new THREE.MeshStandardMaterial({
  map: zombieCloth,
  color: 0x35363f,
  roughness: 0.82,
});

const zombieBloodMaterial = new THREE.MeshStandardMaterial({
  color: 0x5e1616,
  roughness: 0.78,
});

const gunMetalMaterial = new THREE.MeshStandardMaterial({
  map: gunMetalDiffuse,
  normalMap: gunMetalNormal,
  roughnessMap: gunMetalRough,
  color: 0x8d9297,
  roughness: 0.58,
  metalness: 0.75,
  normalScale: new THREE.Vector2(0.42, 0.42),
});

const gunGripMaterial = new THREE.MeshStandardMaterial({
  map: gunGripDiffuse,
  normalMap: gunGripNormal,
  roughnessMap: gunGripRough,
  color: 0x4c382d,
  roughness: 0.85,
  metalness: 0.08,
  normalScale: new THREE.Vector2(0.3, 0.3),
});

/** Shared geometry templates — scale meshes instead of creating new geometries per entity. */
const gBox1x1x1 = new THREE.BoxGeometry(1, 1, 1);
const gSphere1 = new THREE.SphereGeometry(1, 12, 10);
const gSphereLow = new THREE.SphereGeometry(1, 8, 8);
const gCylinder1 = new THREE.CylinderGeometry(1, 1, 1, 12);
for (const g of [gBox1x1x1, gSphere1, gSphereLow, gCylinder1]) {
  g.userData.preventDispose = true;
}

/** Shared special-infected materials (prevents per-instance material leaks). */
const spitterClothMat = new THREE.MeshStandardMaterial({ color: 0x4a6b3a, roughness: 0.75 });
const spitterSkinMat = new THREE.MeshStandardMaterial({ color: 0x8db88a, roughness: 0.68, bumpMap: zombieSkinDetail, bumpScale: 0.03 });
const hunterClothMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.85 });
const hunterSkinMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.7, bumpMap: zombieSkinDetail, bumpScale: 0.028 });
const chargerClothMat = new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 0.8 });
const chargerSkinMat = new THREE.MeshStandardMaterial({ color: 0x8a6a5a, roughness: 0.65, bumpMap: zombieSkinDetail, bumpScale: 0.025 });
const acidSacMat = new THREE.MeshStandardMaterial({ color: 0x88cc44, emissive: 0x446622, emissiveIntensity: 0.3 });

/** New special infected materials */
const juggernautClothMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.9, metalness: 0.1 });
const juggernautSkinMat = new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.7, bumpMap: zombieSkinDetail, bumpScale: 0.04 });
const juggernautArmorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.7 });
const boomerClothMat = new THREE.MeshStandardMaterial({ color: 0x5a6b2a, roughness: 0.85 });
const boomerSkinMat = new THREE.MeshStandardMaterial({ color: 0x8a9a4a, roughness: 0.7, bumpMap: zombieSkinDetail, bumpScale: 0.022 });
const boomerBloatMat = new THREE.MeshStandardMaterial({ color: 0xaacc44, emissive: 0x668822, emissiveIntensity: 0.25, transparent: true, opacity: 0.85 });
const screamerClothMat = new THREE.MeshStandardMaterial({ color: 0x4a3a5a, roughness: 0.8 });
const screamerSkinMat = new THREE.MeshStandardMaterial({ color: 0x8a7aaa, roughness: 0.65, bumpMap: zombieSkinDetail, bumpScale: 0.024 });

/** Shared eye materials (prevents per-zombie material leaks). */
const eyeMaterials = {
  walker: new THREE.MeshBasicMaterial({ color: 0xf7f3b2 }),
  runner: new THREE.MeshBasicMaterial({ color: 0xffd9c7 }),
  spitter: new THREE.MeshBasicMaterial({ color: 0x88ff44 }),
  hunter: new THREE.MeshBasicMaterial({ color: 0xff4444 }),
  charger: new THREE.MeshBasicMaterial({ color: 0xff8844 }),
  brute: new THREE.MeshBasicMaterial({ color: 0xf7f3b2 }),
  crawler: new THREE.MeshBasicMaterial({ color: 0xf7f3b2 }),
  juggernaut: new THREE.MeshBasicMaterial({ color: 0xff6600 }),
  boomer: new THREE.MeshBasicMaterial({ color: 0xccff44 }),
  screamer: new THREE.MeshBasicMaterial({ color: 0xaa44ff }),
};

const teammateJacketMaterial = new THREE.MeshStandardMaterial({
  map: teammateJacketDiffuse,
  roughnessMap: teammateJacketRough,
  normalMap: teammateJacketNormal,
  normalScale: new THREE.Vector2(0.6, 0.6),
  color: 0x819071,
  roughness: 1,
  metalness: 0,
});

const teammatePantsMaterial = new THREE.MeshStandardMaterial({
  map: teammatePantsDiffuse,
  roughnessMap: teammatePantsRough,
  normalMap: teammatePantsNormal,
  normalScale: new THREE.Vector2(0.55, 0.55),
  color: 0x6c7690,
  roughness: 1,
  metalness: 0,
});

const teammateVestMaterial = new THREE.MeshStandardMaterial({
  map: gunGripDiffuse,
  color: 0x3c4336,
  roughness: 0.96,
  metalness: 0.02,
});

const teammateSkinMaterial = new THREE.MeshStandardMaterial({
  color: 0xc9bcaa,
  bumpMap: zombieSkinDetail,
  bumpScale: 0.018,
  roughness: 0.88,
});

const trunkMaterial = new THREE.MeshStandardMaterial({
  map: barkDiffuse,
  bumpMap: barkBump,
  bumpScale: 0.08,
  roughness: 0.95,
  color: activeMapConfig.trunkTint,
});

const leafMaterial = new THREE.MeshStandardMaterial({
  color: activeMapConfig.leafColor,
  roughness: 0.98,
});

function applyActiveMapVisuals() {
  if (activeMapConfig.useCityGroundTexture) {
    if (groundDiffuse) {
      groundDiffuse.dispose();
      groundDiffuse = null;
    }
    if (cityStreetDiffuse) {
      cityStreetDiffuse.dispose();
      cityStreetDiffuse = null;
    }
    cityStreetDiffuse = createCityStreetGroundTexture();
    groundMaterial.map = cityStreetDiffuse;
    groundMaterial.normalMap = null;
    groundMaterial.roughness = 0.9;
    groundMaterial.metalness = 0.06;
    groundMaterial.color.setHex(activeMapConfig.groundTint);
    groundMaterial.needsUpdate = true;
  } else {
    if (cityStreetDiffuse) {
      cityStreetDiffuse.dispose();
      cityStreetDiffuse = null;
    }
    if (groundDiffuse) groundDiffuse.dispose();
    groundDiffuse = createGroundTextureForMap(
      activeMapConfig,
      grassGroundDiffuse?.image?.complete ? grassGroundDiffuse : null,
    );
    groundMaterial.map = groundDiffuse;
    groundMaterial.normalMap = null;
    groundMaterial.roughness = 0.95;
    groundMaterial.metalness = 0;
    groundMaterial.color.setHex(activeMapConfig.groundTint);
    groundMaterial.needsUpdate = true;
  }
  leafMaterial.color.setHex(activeMapConfig.leafColor);
  trunkMaterial.color.setHex(activeMapConfig.trunkTint);
  hemi.color.setHex(activeMapConfig.hemiSky);
  hemi.groundColor.setHex(activeMapConfig.hemiGround);
}

/** Clone + normalize AK mesh once; clones share materials (efficient). */
function buildAk47TemplateFromGltf(gltfScene) {
  const akModel = gltfScene.clone(true);
  akModel.updateMatrixWorld(true);
  const toRemove = [];
  akModel.traverse((obj) => {
    if (obj.isLight || obj.isCamera) {
      toRemove.push(obj);
      return;
    }
    if (obj instanceof THREE.Mesh) {
      obj.frustumCulled = true;
    }
  });
  toRemove.forEach((obj) => obj.removeFromParent());

  const box = new THREE.Box3().setFromObject(akModel);
  if (box.isEmpty()) {
    return null;
  }
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 1e-6);
  const targetLength = 1.05;
  let s = targetLength / maxDim;
  s = Math.min(Math.max(s, 1e-4), 200);

  akModel.scale.setScalar(s);
  akModel.position.set(-center.x * s, -center.y * s, -center.z * s);
  akModel.rotation.set(0, 0, 0);

  const template = new THREE.Group();
  template.add(akModel);
  return template;
}

let ak47TemplatePromise = null;

function ensureAk47TemplateRoot() {
  if (!ak47TemplatePromise) {
    ak47TemplatePromise = new Promise((resolve, reject) => {
      new GLTFLoader().load(
        ak47ModelUrl,
        (gltf) => {
          try {
            resolve(buildAk47TemplateFromGltf(gltf.scene));
          } catch (e) {
            ak47TemplatePromise = null;
            reject(e);
          }
        },
        undefined,
        (err) => {
          ak47TemplatePromise = null;
          reject(err);
        },
      );
    });
  }
  return ak47TemplatePromise;
}

/** Clone + normalize pistol mesh once (shorter than rifle for first-person scale). */
function buildPistolTemplateFromGltf(gltfScene) {
  const pistolModel = gltfScene.clone(true);
  pistolModel.updateMatrixWorld(true);
  const toRemove = [];
  pistolModel.traverse((obj) => {
    if (obj.isLight || obj.isCamera) {
      toRemove.push(obj);
      return;
    }
    if (obj instanceof THREE.Mesh) {
      obj.frustumCulled = true;
    }
  });
  toRemove.forEach((obj) => obj.removeFromParent());

  const box = new THREE.Box3().setFromObject(pistolModel);
  if (box.isEmpty()) {
    return null;
  }
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 1e-6);
  const targetLength = 0.48;
  let s = targetLength / maxDim;
  s = Math.min(Math.max(s, 1e-4), 200);

  pistolModel.scale.setScalar(s);
  pistolModel.position.set(-center.x * s, -center.y * s, -center.z * s);
  pistolModel.rotation.set(0, 0, 0);

  const template = new THREE.Group();
  template.add(pistolModel);
  return template;
}

let pistolTemplatePromise = null;

function ensurePistolTemplateRoot() {
  if (!pistolTemplatePromise) {
    pistolTemplatePromise = new Promise((resolve, reject) => {
      new GLTFLoader().load(
        pistolModelUrl,
        (gltf) => {
          try {
            resolve(buildPistolTemplateFromGltf(gltf.scene));
          } catch (e) {
            pistolTemplatePromise = null;
            reject(e);
          }
        },
        undefined,
        (err) => {
          pistolTemplatePromise = null;
          reject(err);
        },
      );
    });
  }
  return pistolTemplatePromise;
}

/** Clone + normalize Remington 870 mesh once; clones share materials (efficient). */
function buildRemingtonTemplateFromGltf(gltfScene) {
  const sgModel = SkeletonUtils.clone(gltfScene);
  sgModel.updateMatrixWorld(true);
  const toRemove = [];
  sgModel.traverse((obj) => {
    if (obj.isLight || obj.isCamera) {
      toRemove.push(obj);
      return;
    }
    if (obj instanceof THREE.Mesh) {
      obj.frustumCulled = true;
    }
  });
  toRemove.forEach((obj) => obj.removeFromParent());

  const box = new THREE.Box3().setFromObject(sgModel);
  if (box.isEmpty()) {
    return null;
  }
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 1e-6);
  const targetLength = 1.05;
  let s = targetLength / maxDim;
  s = Math.min(Math.max(s, 1e-4), 200);

  sgModel.scale.setScalar(s);
  sgModel.position.set(-center.x * s, -center.y * s, -center.z * s);
  sgModel.rotation.set(0, 0, 0);

  const template = new THREE.Group();
  template.add(sgModel);
  return template;
}

let remingtonTemplatePromise = null;

function ensureRemingtonTemplateRoot() {
  if (!remingtonTemplatePromise) {
    remingtonTemplatePromise = new Promise((resolve, reject) => {
      new GLTFLoader().load(
        remingtonModelUrl,
        (gltf) => {
          try {
            resolve(buildRemingtonTemplateFromGltf(gltf.scene));
          } catch (e) {
            remingtonTemplatePromise = null;
            reject(e);
          }
        },
        undefined,
        (err) => {
          remingtonTemplatePromise = null;
          reject(err);
        },
      );
    });
  }
  return remingtonTemplatePromise;
}

function createFirstPersonWeapon() {
  const rig = new THREE.Group();
  const weapon = new THREE.Group();
  rig.add(weapon);

  /** Rifle / AK-47 fallback group */
  const fallbackGun = new THREE.Group();
  let akLoadSuccess = false;
  let akHolder = null;

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 1.05), gunMetalMaterial);
  const topRail = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.06, 0.6), gunMetalMaterial);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.95, 12), gunMetalMaterial);
  const shroud = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.15, 0.48), gunMetalMaterial);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.42, 0.22), gunGripMaterial);
  const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.16), gunMetalMaterial);
  const sightRear = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.05), gunMetalMaterial);
  const sightFront = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.07, 0.05), gunMetalMaterial);

  receiver.position.set(0, 0, 0);
  topRail.position.set(0, 0.1, -0.05);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, -0.015, -0.88);
  shroud.position.set(0, 0.02, -0.6);
  grip.position.set(0.03, -0.28, 0.2);
  grip.rotation.z = 0.22;
  magazine.position.set(0.01, -0.33, -0.02);
  magazine.rotation.z = 0.08;
  sightRear.position.set(0, 0.12, 0.2);
  sightFront.position.set(0, 0.12, -0.7);

  fallbackGun.add(receiver, topRail, barrel, shroud, grip, magazine, sightRear, sightFront);

  /** Shotgun group — textured procedural model */
  const shotgunGroup = new THREE.Group();
  // Pump body (receiver)
  const sgBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.55), gunMetalMaterial);
  sgBody.position.set(0, 0, 0);
  // Pump grip (fore-end) — textured with grip material
  const sgPump = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.14, 0.28), gunGripMaterial);
  sgPump.position.set(0, -0.02, -0.38);
  // Long barrel
  const sgBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.72, 10), gunMetalMaterial);
  sgBarrel.rotation.x = Math.PI / 2;
  sgBarrel.position.set(0, 0.01, -0.72);
  // Stock — wooden textured grip
  const sgStock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.38), gunGripMaterial);
  sgStock.position.set(0, 0.02, 0.42);
  // Trigger guard
  const sgGuard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.1), gunMetalMaterial);
  sgGuard.position.set(0, -0.12, 0.08);
  // Pistol grip
  const sgPistolGrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.1), gunGripMaterial);
  sgPistolGrip.position.set(0, -0.18, 0.16);
  sgPistolGrip.rotation.z = 0.18;
  // Top rib/sight rail
  const sgRib = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.6), gunMetalMaterial);
  sgRib.position.set(0, 0.1, -0.3);
  // Front bead sight
  const sgBead = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.9, roughness: 0.2 }));
  sgBead.position.set(0, 0.12, -0.72);
  // Shell tube under barrel
  const sgTube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8), gunMetalMaterial);
  sgTube.rotation.x = Math.PI / 2;
  sgTube.position.set(0, -0.05, -0.55);

  shotgunGroup.add(sgBody, sgPump, sgBarrel, sgStock, sgGuard, sgPistolGrip, sgRib, sgBead, sgTube);
  shotgunGroup.visible = false;

  /** Pistol group */
  const pistolGroup = new THREE.Group();
  const psSlide = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.36), gunMetalMaterial);
  const psFrame = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.08, 0.28), gunMetalMaterial);
  psFrame.position.set(0, -0.03, 0);
  const psBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 10), gunMetalMaterial);
  psBarrel.rotation.x = Math.PI / 2;
  psBarrel.position.set(0, -0.01, -0.22);
  const psGrip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.21, 0.1), gunGripMaterial);
  psGrip.position.set(0.03, -0.18, 0.08);
  psGrip.rotation.z = 0.22;
  pistolGroup.add(psSlide, psFrame, psBarrel, psGrip);
  pistolGroup.visible = false;

  /** Special weapon groups (textured procedural models) */
  const crossbowGroup = createCrossbowMesh(gunMetalMaterial, gunGripMaterial);
  crossbowGroup.scale.setScalar(0.95);
  crossbowGroup.visible = false;

  const flamethrowerGroup = createFlamethrowerMesh(gunMetalMaterial, gunGripMaterial);
  flamethrowerGroup.scale.setScalar(0.9);
  flamethrowerGroup.visible = false;

  const sniperGroup = createSniperMesh(gunMetalMaterial, gunGripMaterial);
  sniperGroup.scale.setScalar(0.95);
  sniperGroup.visible = false;

  const rocketGroup = createRocketLauncherMesh(gunMetalMaterial, gunGripMaterial);
  rocketGroup.scale.setScalar(0.9);
  rocketGroup.visible = false;

  /** Muzzle flash for rifle (at barrel tip) */
  const muzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffd78a, transparent: true, opacity: 0 }),
  );
  muzzleFlash.position.set(0, 0, -1.35);

  /** Shotgun muzzle flash (positioned at SG barrel tip) */
  const sgMuzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffaa55, transparent: true, opacity: 0 }),
  );
  sgMuzzleFlash.position.set(0, 0.01, -1.18);
  sgMuzzleFlash.visible = false;

  weapon.add(
    fallbackGun,
    shotgunGroup,
    pistolGroup,
    crossbowGroup,
    flamethrowerGroup,
    sniperGroup,
    rocketGroup,
    muzzleFlash,
    sgMuzzleFlash,
  );
  weapon.position.set(0.36, -0.28, -0.55);
  weapon.rotation.set(-0.12, -0.1, -0.04);

  ensureAk47TemplateRoot()
    .then((tpl) => {
      if (!tpl) return;
      const akModel = tpl.clone(true);
      akModel.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = false;
          obj.receiveShadow = false;
        }
      });
      akHolder = new THREE.Group();
      akHolder.position.set(0.02, -0.1, 0.13);
      akHolder.add(akModel);
      weapon.add(akHolder);
      akLoadSuccess = true;
      fallbackGun.visible = false;
    })
    .catch(() => {
      akLoadSuccess = false;
      fallbackGun.visible = true;
    });

  let remingtonHolder = null;
  let remingtonLoadSuccess = false;
  ensureRemingtonTemplateRoot()
    .then((tpl) => {
      if (!tpl) return;
      const sgModel = SkeletonUtils.clone(tpl);
      sgModel.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = false;
          obj.receiveShadow = false;
        }
      });
      remingtonHolder = new THREE.Group();
      remingtonHolder.position.set(0.02, -0.1, 0.13);
      // Gallo mesh faces +Z; FP aim is camera −Z — flip 180° so the barrel lines up with shots.
      remingtonHolder.rotation.y = Math.PI;
      remingtonHolder.add(sgModel);
      weapon.add(remingtonHolder);
      remingtonLoadSuccess = true;
    })
    .catch(() => {
      remingtonLoadSuccess = false;
    });

  let pistolHolder = null;
  let pistolLoadSuccess = false;
  ensurePistolTemplateRoot()
    .then((tpl) => {
      if (!tpl) return;
      const pModel = tpl.clone(true);
      pModel.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.castShadow = false;
          obj.receiveShadow = false;
        }
      });
      pistolHolder = new THREE.Group();
      pistolHolder.position.set(0.02, -0.1, 0.13);
      pistolHolder.add(pModel);
      weapon.add(pistolHolder);
      pistolLoadSuccess = true;
    })
    .catch(() => {
      pistolLoadSuccess = false;
    });

  rig.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = false;
      obj.receiveShadow = false;
    }
  });

  return {
    rig,
    weapon,
    muzzleFlash,
    sgMuzzleFlash,
    shotgunGroup,
    pistolGroup,
    crossbowGroup,
    flamethrowerGroup,
    sniperGroup,
    rocketGroup,
    get akHolder() {
      return akHolder;
    },
    get akLoadSuccess() {
      return akLoadSuccess;
    },
    fallbackGun,
    get remingtonHolder() {
      return remingtonHolder;
    },
    get remingtonLoadSuccess() {
      return remingtonLoadSuccess;
    },
    get pistolHolder() {
      return pistolHolder;
    },
    get pistolLoadSuccess() {
      return pistolLoadSuccess;
    },
  };
}

const firstPersonWeapon = createFirstPersonWeapon();
camera.add(firstPersonWeapon.rig);

function createWorldGun(type = "rifle", scale = 1) {
  const gun = new THREE.Group();
  const muzzle = new THREE.Object3D();
  const muzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd78a, transparent: true, opacity: 0 }),
  );

  if (type === "rifle") {
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.12, 0.62), gunMetalMaterial);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.13, 0.3), gunGripMaterial);
    stock.position.set(0, -0.01, 0.34);
    const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.11, 0.42), gunMetalMaterial);
    handguard.position.set(0, 0.01, -0.45);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.5, 12), gunMetalMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0, -0.76);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.22, 0.11), gunGripMaterial);
    grip.position.set(0.04, -0.18, 0.02);
    grip.rotation.z = 0.2;
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.23, 0.11), gunMetalMaterial);
    mag.position.set(0, -0.18, -0.12);
    mag.rotation.z = 0.08;
    gun.add(receiver, stock, handguard, barrel, grip, mag);
    muzzle.position.set(0, 0, -1.02);
    muzzleFlash.position.copy(muzzle.position);
  } else if (type === "shotgun") {
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.55), gunMetalMaterial);
    receiver.position.set(0, 0, 0);
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.14, 0.28), gunGripMaterial);
    pump.position.set(0, -0.02, -0.38);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.72, 10), gunMetalMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.01, -0.72);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.38), gunGripMaterial);
    stock.position.set(0, 0.02, 0.42);
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.1), gunMetalMaterial);
    guard.position.set(0, -0.12, 0.08);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.1), gunGripMaterial);
    grip.position.set(0, -0.18, 0.16);
    grip.rotation.z = 0.18;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.6), gunMetalMaterial);
    rib.position.set(0, 0.1, -0.3);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), new THREE.MeshStandardMaterial({ color: 0xffcc00, metalness: 0.9, roughness: 0.2 }));
    bead.position.set(0, 0.12, -0.72);
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 8), gunMetalMaterial);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, -0.05, -0.55);
    gun.add(receiver, pump, barrel, stock, guard, grip, rib, bead, tube);
    muzzle.position.set(0, 0.01, -1.18);
    muzzleFlash.position.copy(muzzle.position);
  } else {
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.36), gunMetalMaterial);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.08, 0.28), gunMetalMaterial);
    frame.position.set(0, -0.03, 0);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22, 10), gunMetalMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, -0.01, -0.22);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.21, 0.1), gunGripMaterial);
    grip.position.set(0.03, -0.18, 0.08);
    grip.rotation.z = 0.22;
    gun.add(slide, frame, barrel, grip);
    muzzle.position.set(0, -0.005, -0.34);
    muzzleFlash.position.copy(muzzle.position);
  }

  gun.add(muzzle, muzzleFlash);
  gun.scale.setScalar(scale);
  return { group: gun, muzzle, muzzleFlash };
}

function createWorldAkReplica(templateRoot, scale = 1) {
  const gun = new THREE.Group();
  const vis = templateRoot.clone(true);
  vis.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  // FP view uses camera −Z as “forward”; teammates face +Z at yaw 0. Same mesh needs a 180° yaw for 3rd person.
  vis.rotation.y = Math.PI;
  gun.add(vis);
  vis.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(vis);
  const center = box.getCenter(new THREE.Vector3());
  const muzzle = new THREE.Object3D();
  muzzle.position.set(center.x, center.y, box.max.z + 0.04);
  const muzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd78a, transparent: true, opacity: 0 }),
  );
  muzzleFlash.position.copy(muzzle.position);
  gun.add(muzzle, muzzleFlash);
  gun.scale.setScalar(scale);
  return { group: gun, muzzle, muzzleFlash };
}

function createWorldRemingtonReplica(templateRoot, scale = 1) {
  const gun = new THREE.Group();
  const vis = SkeletonUtils.clone(templateRoot);
  vis.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  vis.rotation.y = Math.PI;
  gun.add(vis);
  vis.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(vis);
  const center = box.getCenter(new THREE.Vector3());
  const muzzle = new THREE.Object3D();
  muzzle.position.set(center.x, center.y, box.max.z + 0.04);
  const muzzleFlash = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffaa55, transparent: true, opacity: 0 }),
  );
  muzzleFlash.position.copy(muzzle.position);
  gun.add(muzzle, muzzleFlash);
  gun.scale.setScalar(scale);
  return { group: gun, muzzle, muzzleFlash };
}

function createTeammate(x, z, index, akTemplate = null, remingtonTemplate = null, pistolTemplate = null) {
  const group = new THREE.Group();
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.34, 0.34), teammatePantsMaterial);
  hips.position.set(0, 0.98, 0);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.86, 0.42), teammateJacketMaterial);
  torso.position.set(0, 1.48, 0);
  const vest = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.58, 0.46), teammateVestMaterial);
  vest.position.set(0, 1.46, 0.03);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), teammateSkinMaterial);
  head.position.set(0, 2.08, 0.02);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), teammateVestMaterial);
  helmet.position.set(0, 2.16, 0.01);
  helmet.scale.set(1, 0.7, 1);

  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-0.38, 1.8, -0.02);
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.78, 0.18), teammateJacketMaterial);
  leftArm.position.set(0, -0.36, 0);
  leftArmPivot.add(leftArm);

  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(0.38, 1.8, -0.02);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.78, 0.18), teammateJacketMaterial);
  rightArm.position.set(0, -0.36, 0);
  rightArmPivot.add(rightArm);

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.18, 0.84, 0);
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.86, 0.2), teammatePantsMaterial);
  leftLeg.position.set(0, -0.42, 0);
  leftLegPivot.add(leftLeg);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.18, 0.84, 0);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.86, 0.2), teammatePantsMaterial);
  rightLeg.position.set(0, -0.42, 0);
  rightLegPivot.add(rightLeg);

  const weaponAnchor = new THREE.Group();
  const rifle = akTemplate ? createWorldAkReplica(akTemplate, 0.92) : createWorldGun("rifle", 0.92);
  const pistol = pistolTemplate ? createWorldAkReplica(pistolTemplate, 0.58) : createWorldGun("pistol", 1);
  const shotgun = remingtonTemplate ? createWorldRemingtonReplica(remingtonTemplate, 0.88) : createWorldGun("shotgun", 0.88);
  pistol.group.visible = false;
  shotgun.group.visible = false;
  weaponAnchor.add(rifle.group, pistol.group, shotgun.group);

  group.add(
    hips,
    torso,
    vest,
    head,
    helmet,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    weaponAnchor,
  );
  group.position.set(x, terrainHeight(x, z), z);
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.castShadow = true;
  });
  scene.add(group);

  return {
    mesh: group,
    leftArmPivot,
    rightArmPivot,
    leftLegPivot,
    rightLegPivot,
    weaponAnchor,
    rifle,
    pistol,
    shotgun,
    followOffset: new THREE.Vector3(Math.cos(index * 2.2) * 3.8, 0, Math.sin(index * 2.2) * 3.8),
    shootCooldown: 0,
    reloadTimer: 0,
    activeWeapon: 0,
    weapons: [
      { name: "Rifle", ammo: 20, reserve: 200, magSize: 20, damage: 18, fireDelay: 0.2, range: 28, preferredRange: 16, bulletSpeed: 72 },
      { name: "Pistol", ammo: 12, reserve: 180, magSize: 12, damage: 12, fireDelay: 0.32, range: 16, preferredRange: 9, bulletSpeed: 66 },
      { name: "Shotgun", ammo: 6, reserve: 30, magSize: 6, damage: 20, fireDelay: 0.85, range: 25, preferredRange: 12, bulletSpeed: 60, pellets: 8 },
    ],
    visionRange: 34,
    loseRange: 42,
    visionFovCos: Math.cos(THREE.MathUtils.degToRad(72)),
    currentTarget: null,
    targetMemory: 0,
    lastKnownTargetPosition: new THREE.Vector3(),
    walkPhase: Math.random() * Math.PI * 2,
  };
}

function noise2D(x, z) {
  const f = activeMapConfig.noiseFreq;
  const n1 = Math.sin(x * 0.045 * f) * 5.2 + Math.cos(z * 0.046 * f) * 5.2;
  const n2 = Math.sin((x + z) * 0.09 * f) * 1.8 + Math.cos((x - z) * 0.08 * f) * 1.5;
  const n3 = Math.sin(x * 0.16 * f + z * 0.12 * f) * 0.8;
  return n1 + n2 + n3;
}

function terrainHeight(x, z) {
  if (activeMapConfig.flatTerrain) return 0;
  return noise2D(x, z) * activeMapConfig.heightAmp;
}

const _terrainNormalVec = new THREE.Vector3();
function terrainNormal(x, z) {
  if (activeMapConfig.flatTerrain) return _terrainNormalVec.set(0, 1, 0);
  const eps = 0.8;
  const hL = terrainHeight(x - eps, z);
  const hR = terrainHeight(x + eps, z);
  const hD = terrainHeight(x, z - eps);
  const hU = terrainHeight(x, z + eps);
  return _terrainNormalVec.set(hL - hR, 2 * eps, hD - hU).normalize();
}

function makeTree(x, z) {
  const group = new THREE.Group();
  const y = terrainHeight(x, z);
  group.position.set(x, y, z);

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 3, 8), trunkMaterial);
  trunk.position.y = 1.5;
  trunk.castShadow = true;

  const crown = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 7), leafMaterial);
  crown.position.y = 3.7;
  crown.castShadow = true;

  group.add(trunk);
  group.add(crown);
  visionBlockers.push(trunk);
  return { x, z, radius: 1.3, group };
}

function makeStructure(x, z) {
  const group = new THREE.Group();
  const y = terrainHeight(x, z);
  group.position.set(x, y, z);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(8 + Math.random() * 8, 4 + Math.random() * 3, 8 + Math.random() * 8),
    new THREE.MeshStandardMaterial({ color: 0x5a5f66, roughness: 0.85 }),
  );
  base.position.y = base.geometry.parameters.height * 0.5;
  base.castShadow = true;
  base.receiveShadow = true;

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(base.geometry.parameters.width * 0.62, 2, 4),
    new THREE.MeshStandardMaterial({ color: 0x3a2323, roughness: 0.92 }),
  );
  roof.position.y = base.position.y + base.geometry.parameters.height * 0.5 + 1.2;
  roof.rotation.y = Math.PI * 0.25;
  roof.castShadow = true;

  group.add(base, roof);
  visionBlockers.push(base, roof);
  structureGroups.push(group);
  scene.add(group);

  if (Math.random() < 0.6) {
    const numBarrels = 1 + Math.floor(Math.random() * 3);
    for (let bi = 0; bi < numBarrels; bi++) {
      const bx = x + (Math.random() - 0.5) * 7;
      const bz = z + (Math.random() - 0.5) * 7;
      spawnExplosiveBarrel(bx, bz);
    }
  }
}

function makeChunk(cx, cz) {
  const mesh = new THREE.Mesh(chunkGeometry.clone(), groundMaterial);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.position.set(cx * chunkSize, 0, cz * chunkSize);

  const positions = mesh.geometry.attributes.position;
  const normals = mesh.geometry.attributes.normal;
  for (let i = 0; i < positions.count; i += 1) {
    const vx = positions.getX(i) + mesh.position.x;
    const vz = positions.getY(i) + mesh.position.z;
    const h = terrainHeight(vx, vz);
    positions.setZ(i, h);

    // Compute deterministic normals from the height function so neighboring chunks
    // share the same shading at borders (avoids visible seam/glitch lines).
    const worldNormal = terrainNormal(vx, vz);
    const localNormal = worldNormal.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
    normals.setXYZ(i, localNormal.x, localNormal.y, localNormal.z);
  }
  positions.needsUpdate = true;
  normals.needsUpdate = true;
  scene.add(mesh);
  groundChunks.push({ cx, cz, mesh });

  const treeBudget =
    activeMapConfig.id === "outbreak_city" ? 0 : activeMapConfig.treesPerChunk;
  for (let i = 0; i < treeBudget; i += 1) {
    const tx = cx * chunkSize + (Math.random() - 0.5) * (chunkSize - 8);
    const tz = cz * chunkSize + (Math.random() - 0.5) * (chunkSize - 8);
    if (Math.hypot(tx, tz) < 14) continue;
    const tree = makeTree(tx, tz);
    trees.push(tree);
    scene.add(tree.group);
  }

  if (
    activeMapConfig.id !== "outbreak_city" &&
    Math.random() < activeMapConfig.structureChance
  ) {
    const sx = cx * chunkSize + (Math.random() - 0.5) * (chunkSize - 20);
    const sz = cz * chunkSize + (Math.random() - 0.5) * (chunkSize - 20);
    if (Math.hypot(sx, sz) > 40) makeStructure(sx, sz);
  }

  if (
    activeMapConfig.id === "outbreak_city" &&
    cityBuildingTemplates.length > 0 &&
    (activeMapConfig.cityBuildingsPerChunk || 0) > 0
  ) {
    const n = activeMapConfig.cityBuildingsPerChunk;
    for (let bi = 0; bi < n; bi += 1) {
      const tx = cx * chunkSize + (Math.random() - 0.5) * (chunkSize - 14);
      const tz = cz * chunkSize + (Math.random() - 0.5) * (chunkSize - 14);
      if (Math.hypot(tx, tz) < 18) continue;
      const tpl = cityBuildingTemplates[Math.floor(Math.random() * cityBuildingTemplates.length)];
      const inst = tpl.clone(true);
      const holder = new THREE.Group();
      holder.add(inst);
      const box = new THREE.Box3().setFromObject(inst);
      const sz = box.getSize(new THREE.Vector3());
      const max = Math.max(sz.x, sz.y, sz.z, 0.001);
      const targetH = 8 + Math.random() * 14;
      inst.scale.setScalar(targetH / max);
      inst.updateMatrixWorld(true);
      const b2 = new THREE.Box3().setFromObject(inst);
      inst.position.y = -b2.min.y;
      holder.position.set(tx, 0, tz);
      holder.rotation.y = Math.random() * Math.PI * 2;
      scene.add(holder);
      cityPropGroups.push(holder);
      visionBlockers.push(holder);
    }
  }
}

function ensureChunks() {
  const pcx = Math.floor(player.position.x / chunkSize);
  const pcz = Math.floor(player.position.z / chunkSize);
  for (let x = pcx - chunkRadius; x <= pcx + chunkRadius; x += 1) {
    for (let z = pcz - chunkRadius; z <= pcz + chunkRadius; z += 1) {
      if (!groundChunks.some((c) => c.cx === x && c.cz === z)) makeChunk(x, z);
    }
  }
  // Unload chunks that moved out of range
  for (let i = groundChunks.length - 1; i >= 0; i -= 1) {
    const c = groundChunks[i];
    if (Math.abs(c.cx - pcx) > chunkRadius + 1 || Math.abs(c.cz - pcz) > chunkRadius + 1) {
      scene.remove(c.mesh);
      c.mesh.geometry?.dispose();
      groundChunks.splice(i, 1);
    }
  }
  // Unload trees that moved out of range
  for (let i = trees.length - 1; i >= 0; i -= 1) {
    const t = trees[i];
    const tcx = Math.floor(t.group.position.x / chunkSize);
    const tcz = Math.floor(t.group.position.z / chunkSize);
    if (Math.abs(tcx - pcx) > chunkRadius + 1 || Math.abs(tcz - pcz) > chunkRadius + 1) {
      scene.remove(t.group);
      disposeTreeGroup(t.group);
      // Clean visionBlockers
      for (let j = visionBlockers.length - 1; j >= 0; j--) {
        if (visionBlockers[j] === t.group || visionBlockers[j] === t.trunk) {
          visionBlockers.splice(j, 1);
        }
      }
      trees.splice(i, 1);
    }
  }
  // Unload structures that moved out of range
  for (let i = structureGroups.length - 1; i >= 0; i -= 1) {
    const g = structureGroups[i];
    const sx = Math.floor(g.position.x / chunkSize);
    const sz = Math.floor(g.position.z / chunkSize);
    if (Math.abs(sx - pcx) > chunkRadius + 1 || Math.abs(sz - pcz) > chunkRadius + 1) {
      scene.remove(g);
      g.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry?.dispose();
          if (Array.isArray(o.material)) o.material.forEach((mm) => mm.dispose());
          else o.material?.dispose();
        }
      });
      // Clean visionBlockers
      for (let j = visionBlockers.length - 1; j >= 0; j--) {
        if (visionBlockers[j] === g) visionBlockers.splice(j, 1);
      }
      structureGroups.splice(i, 1);
    }
  }
  // Unload city props that moved out of range
  for (let i = cityPropGroups.length - 1; i >= 0; i -= 1) {
    const g = cityPropGroups[i];
    const cx = Math.floor(g.position.x / chunkSize);
    const cz = Math.floor(g.position.z / chunkSize);
    if (Math.abs(cx - pcx) > chunkRadius + 1 || Math.abs(cz - pcz) > chunkRadius + 1) {
      scene.remove(g);
      disposeObject3D(g);
      // Clean visionBlockers
      for (let j = visionBlockers.length - 1; j >= 0; j--) {
        if (visionBlockers[j] === g) visionBlockers.splice(j, 1);
      }
      cityPropGroups.splice(i, 1);
    }
  }
}

function disposeTreeGroup(g) {
  g.traverse((o) => {
    if (o instanceof THREE.Mesh) o.geometry?.dispose();
  });
}

/** Recursively dispose a THREE.Object3D (and children). Skips shared zombie/template geometries (userData.preventDispose). Only disposes materials marked userData.disposeWithMesh (safe for one-off props). */
function disposeObject3D(obj) {
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      if (o.geometry && !o.geometry.userData.preventDispose) {
        o.geometry.dispose();
      }
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) {
        if (m && m.userData?.disposeWithMesh && !m.userData.disposed) {
          m.dispose();
          m.userData.disposed = true;
        }
      }
    }
  });
}

/** Dispose a one-off runtime object and all owned materials/geometries. */
function disposeOwnedObject3D(obj) {
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) m?.dispose?.();
    }
  });
}

function buildMapSelectUi() {
  if (!mapGridEl) return;
  mapGridEl.innerHTML = "";
  for (const m of WORLD_MAPS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "map-chip";
    b.dataset.mapId = m.id;
    b.innerHTML = `<span class="map-chip-name">${m.name}</span><span class="map-chip-blurb">${m.blurb}</span>`;
    b.addEventListener("click", async () => {
      pendingMapId = m.id;
      localStorage.setItem("zowg_map", pendingMapId);
      mapDirty = pendingMapId !== activeMapConfig.id;
      if (m.id === "outbreak_city") await loadCityBuildingLibrary();
      buildMapSelectUi();
    });
    if (m.id === pendingMapId) b.classList.add("is-active-map");
    mapGridEl.appendChild(b);
  }
}

function resetWorldForNewMap() {
  for (const c of groundChunks) {
    scene.remove(c.mesh);
    c.mesh.geometry.dispose();
  }
  groundChunks.length = 0;
  for (const t of trees) {
    scene.remove(t.group);
    disposeTreeGroup(t.group);
  }
  trees.length = 0;
  for (const g of structureGroups) {
    scene.remove(g);
    g.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry?.dispose();
        if (Array.isArray(o.material)) o.material.forEach((mm) => mm.dispose());
        else o.material?.dispose();
      }
    });
  }
  structureGroups.length = 0;
  for (const g of cityPropGroups) {
    scene.remove(g);
    disposeObject3D(g);
  }
  cityPropGroups.length = 0;
  visionBlockers.length = 0;

  for (const z of zombies) {
    scene.remove(z.mesh);
    disposeObject3D(z.mesh);
  }
  zombies.length = 0;
  for (const b of bullets) {
    releaseBulletRecord(b);
  }
  bullets.length = 0;
  for (const p of pickups) {
    scene.remove(p.mesh);
    disposeObject3D(p.mesh);
  }
  pickups.length = 0;
  for (const m of teammates) {
    scene.remove(m.mesh);
    disposeObject3D(m.mesh);
  }
  teammates.length = 0;

  player.position.set(0, 1.8, 0);
  player.hp = 100;
  player.stamina = 100;
  player.yaw = Math.PI;
  player.pitch = 0;
  player.velocityY = 0;
  player.moveVelocity.set(0, 0, 0);
  gameOver = false;
  paused = false;
  wave = 1;
  waveSpawnBudget = 24;
  nextWaveTimer = 0;
  spawnTimer = 0;
  gameTime = 0;
  player.kills = 0;
  player.weapons[0].ammo = 20;
  player.weapons[0].reserve = 120;
  player.weapons[1].ammo = 12;
  player.weapons[1].reserve = 84;
  player.weapons[2].ammo = 6;
  player.weapons[2].reserve = 30;
  syncPlayerAmmoFields(player);
  score = 0;
  killStreak = 0;
  killStreakTimer = 0;
  screenShake = 0;
  screenShakeTime = Math.random() * 1000;
  hitMarkerPulse = 0;
  hitMarkerHeadshotTimer = 0;
  hitStopTimer = 0;
  hitStopCooldown = 0;
  isCrouching = false;
  isADS = false;
  crosshairSpread = 0;
  crosshairFireImpulse = 0;
  grenadeCount = 3;
  molotovCount = 0;
  landMineCount = 0;
  spikeTrapCount = 0;
  noiseMakerCount = 2;
  isNight = false;
  hordeNightActive = false;
  hordeNightTimer = 0;
  bossAlive = false;
  meleeCooldown = 0;
  skillPoints = 0;
  skillXp = 0;
  // Reset skills
  Object.values(skills).forEach(s => { s.level = 0; s.value = 0; });
  updateSkillDisplay();

  for (const g of grenades) {
    scene.remove(g.mesh);
    g.mesh.geometry?.dispose();
    g.mesh.material?.dispose();
  }
  grenades.length = 0;
  for (const a of arrows) { scene.remove(a.mesh); a.mesh.traverse(o => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } }); }
  arrows.length = 0;
  for (const r of rockets) { scene.remove(r.mesh); r.mesh.traverse(o => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } }); }
  rockets.length = 0;
  for (const f of flamePuffs) { scene.remove(f.mesh); f.mesh.geometry?.dispose(); f.mesh.material?.dispose(); }
  flamePuffs.length = 0;
  for (const mp of molotovProjectiles) { scene.remove(mp.mesh); disposeOwnedObject3D(mp.mesh); }
  molotovProjectiles.length = 0;
  for (const f of molotovFires) { scene.remove(f.mesh); disposeOwnedObject3D(f.mesh); }
  molotovFires.length = 0;
  for (const m of landMines) { scene.remove(m.mesh); disposeOwnedObject3D(m.mesh); }
  landMines.length = 0;
  for (const s of spikeTraps) { scene.remove(s.mesh); disposeOwnedObject3D(s.mesh); }
  spikeTraps.length = 0;
  for (const p of particles) {
    scene.remove(p.mesh);
    p.mesh.geometry?.dispose();
    p.mesh.material?.dispose();
  }
  particles.length = 0;
  for (const b of barrels) {
    scene.remove(b.mesh);
    disposeObject3D(b.mesh);
  }
  barrels.length = 0;
  for (const a of acidPuddles) {
    scene.remove(a.mesh);
    a.mesh.geometry?.dispose();
    a.mesh.material?.dispose();
  }
  acidPuddles.length = 0;
  for (const c of zombieCorpses) {
    scene.remove(c.mesh);
    disposeObject3D(c.mesh);
  }
  zombieCorpses.length = 0;
  for (const d of distractions) { d.active = false; scene.remove(d.mesh); disposeObject3D(d.mesh); }
  distractions.length = 0;
  for (const s of supplyDrops) {
    scene.remove(s.mesh);
    disposeObject3D(s.mesh);
  }
  supplyDrops.length = 0;
  for (const b of barricades) {
    scene.remove(b.mesh);
    disposeObject3D(b.mesh);
  }
  barricades.length = 0;
  for (const v of vehicles) {
    scene.remove(v.mesh);
    v.mesh.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry?.dispose();
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material?.dispose();
      }
    });
  }
  vehicles.length = 0;
  activeVehicle = null;
  vehicleInput = { forward: false, backward: false, left: false, right: false };
  clearWeather();

  // Reset materials
  materials.scrap = 0; materials.wood = 0; materials.metal = 0;
  materials.cloth = 0; materials.chemicals = 0;

  applyActiveMapVisuals();
  ensureChunks();
  initWeather();
  for (let i = 0; i < 8; i += 1) spawnZombieNearPlayer();
  for (let i = 0; i < 3; i += 1) {
    teammates.push(createTeammate(2 + i * 2.5, 2 + i, i, akTemplateRef, remingtonTemplateRef, pistolTemplateRef));
  }
}

function addZombie(x, z, forceType = null) {
  const roll = Math.random();
  // Special infected chance increases with wave; new types appear from wave 3+
  const specialChance = Math.min(0.30, wave * 0.025);
  const newTypeChance = wave >= 3 ? Math.min(0.12, (wave - 2) * 0.015) : 0;
  let type = forceType;

  if (!type) {
    if (roll < 0.10) type = "brute";
    else if (roll < 0.28) type = "runner";
    else if (roll < 0.36) type = "crawler";
    else if (roll < 0.36 + specialChance) {
      const specialRoll = Math.random();
      if (specialRoll < 0.25) type = "spitter";
      else if (specialRoll < 0.50) type = "hunter";
      else if (specialRoll < 0.75) type = "charger";
      else if (wave >= 3 && specialRoll < 0.85) {
        const newRoll = Math.random();
        if (newRoll < 0.33) type = "juggernaut";
        else if (newRoll < 0.66) type = "boomer";
        else type = "screamer";
      } else type = "charger";
    } else if (roll < 0.36 + specialChance + newTypeChance) {
      const newRoll = Math.random();
      if (newRoll < 0.33) type = "juggernaut";
      else if (newRoll < 0.66) type = "boomer";
      else type = "screamer";
    } else type = "walker";
  }

  const group = new THREE.Group();
  const isSpecial = ["spitter", "hunter", "charger", "juggernaut", "boomer", "screamer"].includes(type);

  // Special infected materials (shared to prevent per-instance leaks)
  let skinMat = zombieSkinMaterial;
  let clothMat = zombieClothMaterial;
  if (type === "spitter") { clothMat = spitterClothMat; skinMat = spitterSkinMat; }
  else if (type === "hunter") { clothMat = hunterClothMat; skinMat = hunterSkinMat; }
  else if (type === "charger") { clothMat = chargerClothMat; skinMat = chargerSkinMat; }
  else if (type === "juggernaut") { clothMat = juggernautClothMat; skinMat = juggernautSkinMat; }
  else if (type === "boomer") { clothMat = boomerClothMat; skinMat = boomerSkinMat; }
  else if (type === "screamer") { clothMat = screamerClothMat; skinMat = screamerSkinMat; }

  // Reuse shared geometries by scaling meshes instead of creating new BoxGeometry/SphereGeometry per zombie
  const hips = new THREE.Mesh(gBox1x1x1, clothMat);
  hips.scale.set(0.78, 0.56, 0.42);
  const torso = new THREE.Mesh(gBox1x1x1, clothMat);
  torso.scale.set(0.9, 0.9, 0.48);
  const head = new THREE.Mesh(gSphere1, skinMat);
  head.scale.set(0.3, 0.3, 0.3);
  const jaw = new THREE.Mesh(gBox1x1x1, zombieBloodMaterial);
  jaw.scale.set(0.28, 0.12, 0.24);
  const leftArm = new THREE.Mesh(gBox1x1x1, skinMat);
  leftArm.scale.set(0.22, 0.86, 0.22);
  const rightArm = new THREE.Mesh(gBox1x1x1, skinMat);
  rightArm.scale.set(0.22, 0.86, 0.22);
  const leftLeg = new THREE.Mesh(gBox1x1x1, clothMat);
  leftLeg.scale.set(0.24, 0.96, 0.24);
  const rightLeg = new THREE.Mesh(gBox1x1x1, clothMat);
  rightLeg.scale.set(0.24, 0.96, 0.24);

  // Charger has one massive arm
  if (type === "charger") {
    rightArm.scale.set(0.396, 1.118, 0.308);
    rightArm.position.x = 0.7;
  }

  torso.position.set(0, 1.48, 0);
  hips.position.set(0, 1.0, 0);
  head.position.set(0, 2.14, 0.02);
  jaw.position.set(0, 1.93, 0.2);
  leftArm.position.set(-0.56, 1.47, 0);
  rightArm.position.set(0.56, 1.47, 0);
  leftLeg.position.set(-0.23, 0.45, 0);
  rightLeg.position.set(0.23, 0.45, 0);

  const eyeMat = eyeMaterials[type] || eyeMaterials.walker;
  const eyeLeft = new THREE.Mesh(gSphereLow, eyeMat);
  eyeLeft.scale.set(0.04, 0.04, 0.04);
  const eyeRight = new THREE.Mesh(gSphereLow, eyeMat);
  eyeRight.scale.set(0.04, 0.04, 0.04);
  eyeLeft.position.set(-0.1, 2.2, 0.26);
  eyeRight.position.set(0.1, 2.2, 0.26);

  // Spitter has acid sac on back
  if (type === "spitter") {
    const acidSac = new THREE.Mesh(gSphere1, acidSacMat);
    acidSac.scale.set(0.45, 0.45, 0.45);
    acidSac.position.set(0, 1.8, -0.35);
    group.add(acidSac);
  }

  // Juggernaut has metal armor plates
  if (type === "juggernaut") {
    const chestPlate = new THREE.Mesh(gBox1x1x1, juggernautArmorMat);
    chestPlate.scale.set(0.94, 0.72, 0.52);
    chestPlate.position.set(0, 1.48, 0.04);
    const shoulderL = new THREE.Mesh(gSphere1, juggernautArmorMat);
    shoulderL.scale.set(0.18, 0.18, 0.18);
    shoulderL.position.set(-0.62, 1.82, 0);
    const shoulderR = new THREE.Mesh(gSphere1, juggernautArmorMat);
    shoulderR.scale.set(0.18, 0.18, 0.18);
    shoulderR.position.set(0.62, 1.82, 0);
    group.add(chestPlate, shoulderL, shoulderR);
  }

  // Boomer has a bloated stomach sac
  if (type === "boomer") {
    const bloat = new THREE.Mesh(gSphere1, boomerBloatMat);
    bloat.scale.set(0.52, 0.48, 0.44);
    bloat.position.set(0, 1.42, 0.18);
    group.add(bloat);
  }

  // Screamer has enlarged jaw / mouth
  if (type === "screamer") {
    jaw.scale.set(0.38, 0.18, 0.30);
    jaw.position.set(0, 1.88, 0.28);
    const throat = new THREE.Mesh(gSphere1, screamerSkinMat);
    throat.scale.set(0.18, 0.22, 0.18);
    throat.position.set(0, 1.72, 0.06);
    group.add(throat);
  }

  group.add(hips, torso, head, jaw, leftArm, rightArm, leftLeg, rightLeg, eyeLeft, eyeRight);
  group.position.set(x, terrainHeight(x, z), z);

  // Scaling
  if (type === "brute") group.scale.setScalar(1.25);
  if (type === "runner") group.scale.set(0.92, 0.92, 0.92);
  if (type === "charger") group.scale.set(1.15, 1.1, 1.15);
  if (type === "hunter") group.scale.set(0.88, 0.95, 0.88);
  if (type === "crawler") {
    group.scale.set(0.95, 0.55, 0.95);
    group.position.y = terrainHeight(x, z);
  }
  if (type === "juggernaut") group.scale.setScalar(1.45);
  if (type === "boomer") group.scale.set(1.05, 1.15, 1.05);
  if (type === "screamer") group.scale.set(0.92, 1.02, 0.92);

  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.castShadow = true;
  });
  scene.add(group);

  // Stats for each type
  let hp = 60, maxHp = 60, speed = settings.zombieSpeed, damage = settings.zombieDamage;
  if (type === "brute") { hp = 120; maxHp = 120; speed = settings.bruteSpeed; damage = 15; }
  else if (type === "runner") { hp = 36; maxHp = 36; speed = settings.runnerSpeed; damage = 5; }
  else if (type === "crawler") { hp = 40; maxHp = 40; speed = settings.zombieSpeed * 0.6; damage = 10; }
  else if (type === "spitter") { hp = 45; maxHp = 45; speed = settings.zombieSpeed * 0.85; damage = 4; }
  else if (type === "hunter") { hp = 38; maxHp = 38; speed = settings.runnerSpeed * 1.3; damage = 12; }
  else if (type === "charger") { hp = 95; maxHp = 95; speed = settings.zombieSpeed * 1.15; damage = 18; }
  else if (type === "juggernaut") { hp = 300; maxHp = 300; speed = settings.zombieSpeed * 0.4; damage = 22; }
  else if (type === "boomer") { hp = 60; maxHp = 60; speed = settings.zombieSpeed * 0.7; damage = 6; }
  else if (type === "screamer") { hp = 40; maxHp = 40; speed = settings.zombieSpeed * 1.2; damage = 3; }

  zombies.push({
    mesh: group,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    type,
    hp,
    maxHp,
    speed,
    damage,
    walkPhase: Math.random() * Math.PI * 2,
    attackTimer: 0,
    wanderSeed: Math.random() * 1000,
    isBoss: false,
    isSpecial,
    // Special infected abilities
    spitterCooldown: type === "spitter" ? 3 + Math.random() * 2 : 0,
    hunterCooldown: type === "hunter" ? 4 + Math.random() * 3 : 0,
    hunterLeaping: false,
    chargeCooldown: type === "charger" ? 5 + Math.random() * 3 : 0,
    isCharging: false,
    chargeTarget: null,
    chargeDirection: new THREE.Vector3(),
    attackAnimating: false,
    attackAnimTime: 0,
    // New infected abilities
    screamCooldown: type === "screamer" ? 6 + Math.random() * 4 : 0,
    hasScreamed: false,
    isFleeing: type === "screamer" ? true : false,
    ignoreBarricades: type === "juggernaut",
    boomerExploded: false,
  });
}

function spawnZombieNearPlayer() {
  const angle = Math.random() * Math.PI * 2;
  const distance = 25 + Math.random() * 35;
  addZombie(player.position.x + Math.cos(angle) * distance, player.position.z + Math.sin(angle) * distance);
}

// ─── Vehicle System ─────────────────────────────────────────────────────────
import { createVehicle, updateVehicle, damageVehicle, repairVehicle, refuelVehicle, upgradeVehicleArmor, upgradeVehicleEngine, VEHICLE_TYPES } from "./entities/vehicle.js";

function spawnVehiclesForMap() {
  const count = activeMapConfig.id === "outbreak_city" ? 4 : 2;
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 20 + Math.random() * 60;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    const types = [VEHICLE_TYPES.JEEP, VEHICLE_TYPES.TRUCK, VEHICLE_TYPES.MOTORCYCLE];
    const type = types[Math.floor(Math.random() * types.length)];
    const vehicle = createVehicle(type, x, z, terrainHeight);
    vehicles.push(vehicle);
    scene.add(vehicle.mesh);
  }
}

function findNearestVehicle() {
  let nearest = null;
  let nearestDist = 5.0; // Max interaction distance
  for (const v of vehicles) {
    const d = player.position.distanceTo(v.mesh.position);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = v;
    }
  }
  return nearest;
}

function enterVehicle(vehicle) {
  if (vehicle.destroyed || vehicle.occupied) return false;
  vehicle.occupied = true;
  vehicle.driver = "player";
  activeVehicle = vehicle;
  camera.position.copy(vehicle.mesh.position);
  camera.position.y += 2.5;
  firstPersonWeapon.rig.visible = false;
  messageEl.textContent = `Entered ${vehicle.type.toUpperCase()}! WASD drive, Space brake, F exit, H horn.`;
  return true;
}

function exitVehicle() {
  if (!activeVehicle) return;
  const v = activeVehicle;
  v.occupied = false;
  v.driver = null;
  // Place player beside vehicle
  const side = _tempVec1.set(Math.cos(v.yaw + Math.PI / 2), 0, Math.sin(v.yaw + Math.PI / 2));
  player.position.copy(v.mesh.position).addScaledVector(side, 2.5);
  player.position.y = terrainHeight(player.position.x, player.position.z) + 1.8;
  activeVehicle = null;
  firstPersonWeapon.rig.visible = true;
  messageEl.textContent = "Exited vehicle.";
}

function updateVehicles(dt) {
  for (const vehicle of vehicles) {
    if (vehicle.destroyed) continue;
    if (activeVehicle === vehicle) {
      updateVehicle(vehicle, dt, vehicleInput, terrainHeight);
      // Camera follows vehicle (reused vectors)
      const camOffset = _tempVec1.set(0, 3.5, 5.5);
      camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicle.yaw);
      const targetPos = _tempVec2.copy(vehicle.mesh.position).add(_tempVec3.set(0, 1, 0));
      camera.position.lerp(_tempVec4.copy(vehicle.mesh.position).add(camOffset), 0.15);
      camera.lookAt(targetPos);
    }
    // Zombies damage vehicles
    for (const zombie of zombies) {
      const d = zombie.mesh.position.distanceTo(vehicle.mesh.position);
      if (d < 2.5) {
        const destroyed = damageVehicle(vehicle, zombie.damage * dt);
        if (destroyed && !vehicle.destroyed) {
          vehicle.destroyed = true;
          createExplosion(vehicle.mesh.position, 6, 60);
          playSpatialSfx("explosion", vehicle.mesh.position, 1);
          topCenterAlertEl.textContent = "💥 VEHICLE DESTROYED!";
          alertTimer = 2.5;
          if (activeVehicle === vehicle) {
            exitVehicle();
            player.hp -= 25;
            player.damageFlash = 1.0;
            messageEl.textContent = "Vehicle exploded! You were thrown clear!";
          }
        }
      }
    }
  }
  // Remove destroyed vehicles after a delay
  for (let i = vehicles.length - 1; i >= 0; i--) {
    if (vehicles[i].destroyed && activeVehicle !== vehicles[i]) {
      const v = vehicles[i];
      v.hp -= dt * 10; // Fade out timer
      if (v.hp <= -30) {
        scene.remove(v.mesh);
        vehicles.splice(i, 1);
      }
    }
  }
}

function bulletPoolKey(radius, colorHex) {
  return `${radius}:${colorHex}`;
}

function getSharedBulletGeometry(radius) {
  let g = bulletRadiusGeometry.get(radius);
  if (!g) {
    g = new THREE.SphereGeometry(radius, 8, 8);
    bulletRadiusGeometry.set(radius, g);
  }
  return g;
}

function getSharedBulletMaterial(colorHex) {
  let m = bulletColorMaterial.get(colorHex);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: colorHex });
    bulletColorMaterial.set(colorHex, m);
  }
  return m;
}

function acquireBulletMesh(radius, colorHex) {
  const key = bulletPoolKey(radius, colorHex);
  let pool = bulletMeshPoolsByKey.get(key);
  if (!pool) {
    pool = [];
    bulletMeshPoolsByKey.set(key, pool);
  }
  const mesh = pool.pop() ?? new THREE.Mesh(getSharedBulletGeometry(radius), getSharedBulletMaterial(colorHex));
  mesh.visible = true;
  return mesh;
}

function releaseBulletMesh(mesh) {
  scene.remove(mesh);
  mesh.visible = false;
  const r = mesh.geometry.parameters.radius;
  const c = mesh.material.color.getHex();
  const key = bulletPoolKey(r, c);
  let pool = bulletMeshPoolsByKey.get(key);
  if (!pool) {
    pool = [];
    bulletMeshPoolsByKey.set(key, pool);
  }
  pool.push(mesh);
}

function releaseBulletRecord(bullet) {
  releaseBulletMesh(bullet.mesh);
  bullet.mesh = null;
  bulletRecordPool.push(bullet);
}

function spawnBullet(origin, direction, damage, options = {}) {
  const {
    speed = 75,
    life = 1.4,
    color = 0xffd08a,
    radius = 0.05,
    owner = "player",
  } = options;

  const mesh = acquireBulletMesh(radius, color);
  mesh.position.copy(origin);
  scene.add(mesh);
  const rec =
    bulletRecordPool.pop() ??
    { mesh: null, velocity: new THREE.Vector3(), life: 0, damage: 0, owner: "player" };
  rec.mesh = mesh;
  rec.velocity.copy(direction).normalize().multiplyScalar(speed);
  rec.life = life;
  rec.damage = damage;
  rec.owner = owner;
  bullets.push(rec);
}

const _losDirection = new THREE.Vector3();
const _losRaycaster = new THREE.Raycaster();
const _tempVec1 = new THREE.Vector3();
const _tempVec2 = new THREE.Vector3();
const _tempVec3 = new THREE.Vector3();
const _tempVec4 = new THREE.Vector3();
const _bulletOrigin = new THREE.Vector3();
const _bulletDirection = new THREE.Vector3();
const _bulletPelletDir = new THREE.Vector3();
const _bulletPrev = new THREE.Vector3();
const _losHeadVec = new THREE.Vector3();
const _muzzleWorld = new THREE.Vector3();
const _aimPointVec = new THREE.Vector3();
const _teammateShotDir = new THREE.Vector3();
const _pelletDirScratch = new THREE.Vector3();
const _segAb = new THREE.Vector3();
const _segAc = new THREE.Vector3();
const _segClosest = new THREE.Vector3();
const _hitZoneCenters = Array.from({ length: 6 }, () => new THREE.Vector3());
const _worldAxisY = new THREE.Vector3(0, 1, 0);
const _teammateFollowTarget = new THREE.Vector3();
const _teammateTargetPosition = new THREE.Vector3();

function hasLineOfSight(origin, targetPosition) {
  _losDirection.subVectors(targetPosition, origin);
  const distance = _losDirection.length();
  if (distance <= 0.001) return true;
  _losDirection.normalize();

  _losRaycaster.set(origin, _losDirection);
  _losRaycaster.far = Math.max(0.01, distance - 0.15);
  return _losRaycaster.intersectObjects(visionBlockers, true).length === 0;
}

const _eyeVec = new THREE.Vector3();
const _chestVec = new THREE.Vector3();
const _toTargetVec = new THREE.Vector3();
const _flatToTargetVec = new THREE.Vector3();
const _facingVec = new THREE.Vector3();
function canTeammateSeeZombie(mate, zombie) {
  _eyeVec.copy(mate.mesh.position).add(_tempVec1.set(0, 1.58, 0));
  _chestVec.copy(zombie.mesh.position).add(_tempVec2.set(0, 1.45, 0));
  _toTargetVec.subVectors(_chestVec, _eyeVec);
  const distanceSq = _toTargetVec.lengthSq();
  if (distanceSq > mate.visionRange * mate.visionRange) return false;

  _flatToTargetVec.copy(_toTargetVec);
  _flatToTargetVec.y = 0;
  if (_flatToTargetVec.lengthSq() < 0.0001) return true;
  _flatToTargetVec.normalize();

  _facingVec.set(Math.sin(mate.mesh.rotation.y), 0, Math.cos(mate.mesh.rotation.y)).normalize();
  if (_facingVec.dot(_flatToTargetVec) < mate.visionFovCos) return false;

  _losHeadVec.set(zombie.mesh.position.x, zombie.mesh.position.y + 2.05, zombie.mesh.position.z);
  return hasLineOfSight(_eyeVec, _chestVec) || hasLineOfSight(_eyeVec, _losHeadVec);
}

function computeCurrentBulletSpread(weapon) {
  if (weapon.pellets) return isADS ? 0.045 : 0.14;
  const moveRatio = THREE.MathUtils.clamp(player.moveVelocity.length() / settings.sprintSpeed, 0, 1);
  const movePenalty = moveRatio * (isADS ? 0.004 : 0.018);
  const airbornePenalty = player.isGrounded ? 0 : (isADS ? 0.006 : 0.028);
  const firePenalty = crosshairFireImpulse * (isADS ? 0.002 : 0.01);
  let baseSpread = isADS ? 0.0006 : 0.0025;
  if (weapon.name === "Pistol") baseSpread = isADS ? 0.0012 : 0.0042;
  else if (weapon.name === "Crossbow") baseSpread = isADS ? 0.0003 : 0.0013;
  else if (weapon.name === "Sniper") baseSpread = isADS ? 0.0002 : 0.0072;
  else if (weapon.name === "Rocket") baseSpread = isADS ? 0.0012 : 0.006;
  return baseSpread + movePenalty + airbornePenalty + firePenalty;
}

function applyDirectionalSpread(direction, spreadAmount) {
  if (spreadAmount <= 0) return direction.clone();
  const spreadDirection = direction.clone();
  spreadDirection.x += (Math.random() - 0.5) * spreadAmount * 2;
  spreadDirection.y += (Math.random() - 0.5) * spreadAmount;
  spreadDirection.z += (Math.random() - 0.5) * spreadAmount * 2;
  return spreadDirection.normalize();
}

function getActiveMuzzleNode(weapon) {
  if (weapon?.pellets && firstPersonWeapon.sgMuzzleFlash) return firstPersonWeapon.sgMuzzleFlash;
  return firstPersonWeapon.muzzleFlash || null;
}

function shoot() {
  if (!pointerLocked || gameOver || player.reloadTimer > 0 || player.shootCooldown > 0) return;
  const weapon = getActiveWeapon(player);
  syncPlayerAmmoFields(player);
  if (player.ammo <= 0) {
    messageEl.textContent = "Out of ammo. Press R to reload.";
    return;
  }

  player.ammo -= 1;
  const isShotgunNow = weapon.pellets;
  const wn = weapon.name;
  if (wn === "Crossbow") playSfx("gunshot_player", 0.45);
  else if (wn === "Flamethrower") playSfx("gunshot_player", 0.5);
  else if (wn === "Rocket") playSfx("explosion", 0.55);
  else playSfx(isShotgunNow ? "shotgun_player" : "gunshot_player", 1);
  player.shootCooldown = weapon.fireDelay;
  player.bobTime += 0.03;
  camera.fov = 77.5;
  camera.updateProjectionMatrix();
  weaponRecoil = weapon.recoil;
  weaponKick = 1;
  crosshairFireImpulse = Math.min(1.6, crosshairFireImpulse + 0.35 + weapon.recoil * 0.15);

  if (isShotgunNow && firstPersonWeapon.sgMuzzleFlash) {
    firstPersonWeapon.sgMuzzleFlash.material.opacity = 0.95;
    firstPersonWeapon.sgMuzzleFlash.scale.setScalar(1 + Math.random() * 1.5);
  } else {
    firstPersonWeapon.muzzleFlash.material.opacity = 0.95;
    firstPersonWeapon.muzzleFlash.scale.setScalar(1 + Math.random() * 1.2);
  }

  // Shell ejection effect
  ejectShell(weapon.name);

  _bulletDirection.set(
    -Math.sin(player.yaw) * Math.cos(player.pitch),
    Math.sin(player.pitch),
    -Math.cos(player.yaw) * Math.cos(player.pitch),
  ).normalize();

  const muzzleNode = getActiveMuzzleNode(weapon);
  if (muzzleNode) {
    firstPersonWeapon.weapon.updateMatrixWorld(true);
    muzzleNode.getWorldPosition(_bulletOrigin);
  } else {
    _bulletOrigin.copy(player.position);
    _bulletOrigin.y -= 0.2;
  }

  const wName = weapon.name;

  if (wName === "Crossbow") {
    // Arrow projectile — slow, visible shaft, sticks into zombies
    spawnArrow(_bulletOrigin, _bulletDirection, weapon.damage);
    commitPlayerAmmoFields(player);
    return;
  }

  if (wName === "Rocket") {
    // Physical rocket that flies and detonates
    spawnRocket(_bulletOrigin, _bulletDirection, weapon.damage);
    commitPlayerAmmoFields(player);
    return;
  }

  if (wName === "Flamethrower") {
    // Burst of flame puffs in a cone — spawned per shot, damage applied per frame
    for (let fp = 0; fp < 5; fp++) spawnFlamePuff(_bulletOrigin, _bulletDirection);
    commitPlayerAmmoFields(player);
    return;
  }

  if (weapon.pellets) {
    const spread = computeCurrentBulletSpread(weapon);
    for (let p = 0; p < weapon.pellets; p++) {
      _bulletPelletDir.copy(_bulletDirection);
      _bulletPelletDir.x += (Math.random() - 0.5) * spread * 2;
      _bulletPelletDir.y += (Math.random() - 0.5) * spread;
      _bulletPelletDir.z += (Math.random() - 0.5) * spread * 2;
      _bulletPelletDir.normalize();
      spawnBullet(_bulletOrigin, _bulletPelletDir, weapon.damage, {
        speed: 58,
        life: weapon.range / 58 + 0.08,
        color: 0xffaa44,
        radius: 0.04,
        owner: "player",
      });
    }
  } else {
    const spread = computeCurrentBulletSpread(weapon);
    if (spread > 0) {
      _bulletDirection.x += (Math.random() - 0.5) * spread * 2;
      _bulletDirection.y += (Math.random() - 0.5) * spread;
      _bulletDirection.z += (Math.random() - 0.5) * spread * 2;
      _bulletDirection.normalize();
    }
    // Sniper gets a large, fast, glowing tracer round
    const isSniper = wName === "Sniper";
    spawnBullet(_bulletOrigin, _bulletDirection, weapon.damage, {
      speed: isSniper ? 200 : 75,
      life: isSniper ? weapon.range / 200 + 0.25 : weapon.range / 75 + 0.18,
      color: isSniper ? 0x44ddff : 0xffd08a,
      radius: isSniper ? 0.085 : 0.05,
      owner: "player",
    });
  }
  commitPlayerAmmoFields(player);
}

function reload() {
  if (reloadWeapon(player, skills)) {
    playSfx("reload_player", 1);
    messageEl.textContent = "Reloading...";
  }
}

function doSwapPlayerWeapon() {
  swapPlayerWeapon(player);
  playSfx("ui_click", 1);
  messageEl.textContent = `Swapped to ${getActiveWeapon(player).name}.`;
}

function doSwitchToWeapon(index) {
  if (switchToWeapon(player, index)) {
    playSfx("ui_click", 1);
    messageEl.textContent = `Switched to ${getActiveWeapon(player).name}.`;
  }
}

function updateWeapon(dt) {
  const moving = player.moveVelocity.lengthSq() > 0.01;
  const swayTime = gameTime * (moving ? 9 : 4);
  const bobX = moving ? Math.sin(swayTime) * 0.018 : 0;
  const bobY = moving ? Math.abs(Math.cos(swayTime * 0.5)) * 0.014 : 0;

  weaponRecoil = Math.max(0, weaponRecoil - dt * 7.5);
  weaponKick = Math.max(0, weaponKick - dt * 11);
  lookSwayX *= Math.exp(-dt * 18);
  lookSwayY *= Math.exp(-dt * 18);
  const weapon = getActiveWeapon(player);
  const weaponName = weapon.name;
  const isRifle = weaponName === "Rifle";
  const isPistol = weapon.name === "Pistol";
  const isShotgun = weapon.name === "Shotgun";
  const isCrossbow = weaponName === "Crossbow";
  const isFlamethrower = weaponName === "Flamethrower";
  const isSniper = weaponName === "Sniper";
  const isRocket = weaponName === "Rocket";

  const adsXOffset = isADS ? 0.0 : (isPistol ? 0.4 : isShotgun ? 0.34 : 0.36);
  const adsYOffset = isADS ? -0.2 : (isPistol ? -0.26 : isShotgun ? -0.24 : -0.28);
  const adsZOffset = isADS ? -0.38 : (isPistol ? -0.48 : isShotgun ? -0.5 : -0.55);
  firstPersonWeapon.weapon.position.set(
    adsXOffset + bobX - lookSwayX * 0.0014,
    adsYOffset - bobY + weaponKick * 0.03 + lookSwayY * 0.0012,
    adsZOffset + weaponKick * 0.11,
  );

  firstPersonWeapon.weapon.rotation.set(
    (isPistol ? -0.1 : -0.12) - weaponRecoil * 0.12 + lookSwayY * 0.0009,
    (isPistol ? -0.05 : -0.1) + lookSwayX * 0.0011,
    -0.04 + bobX * 0.9,
  );
  firstPersonWeapon.weapon.scale.setScalar(isPistol ? 0.8 : 1);

  const ak = firstPersonWeapon.akHolder;
  const akOk = firstPersonWeapon.akLoadSuccess;
  const showAk = isRifle && akOk;
  firstPersonWeapon.fallbackGun.visible = isRifle && !akOk;

  const remington = firstPersonWeapon.remingtonHolder;
  const remingtonOk = firstPersonWeapon.remingtonLoadSuccess;
  const showRemington = isShotgun && remingtonOk;
  const showFallbackShotgun = isShotgun && !remingtonOk;
  if (firstPersonWeapon.shotgunGroup) firstPersonWeapon.shotgunGroup.visible = showFallbackShotgun;
  if (remington) remington.visible = showRemington;

  const pistolH = firstPersonWeapon.pistolHolder;
  const pistolOk = firstPersonWeapon.pistolLoadSuccess;
  const showPistolGlb = isPistol && pistolOk;
  const showPistolProc = isPistol && !pistolOk;
  if (firstPersonWeapon.pistolGroup) firstPersonWeapon.pistolGroup.visible = showPistolProc;
  if (pistolH) pistolH.visible = showPistolGlb;

  if (firstPersonWeapon.crossbowGroup) firstPersonWeapon.crossbowGroup.visible = isCrossbow;
  if (firstPersonWeapon.flamethrowerGroup) firstPersonWeapon.flamethrowerGroup.visible = isFlamethrower;
  if (firstPersonWeapon.sniperGroup) firstPersonWeapon.sniperGroup.visible = isSniper;
  if (firstPersonWeapon.rocketGroup) firstPersonWeapon.rocketGroup.visible = isRocket;

  if (isPistol) {
    firstPersonWeapon.muzzleFlash.position.set(0, 0, -0.56);
  } else if (isCrossbow) {
    firstPersonWeapon.muzzleFlash.position.set(0, 0.03, -0.9);
  } else if (isFlamethrower) {
    firstPersonWeapon.muzzleFlash.position.set(0, -0.01, -0.78);
  } else if (isSniper) {
    firstPersonWeapon.muzzleFlash.position.set(0, 0.02, -1.42);
  } else if (isRocket) {
    firstPersonWeapon.muzzleFlash.position.set(0, 0, -1.08);
  } else if (!isShotgun) {
    firstPersonWeapon.muzzleFlash.position.set(0, 0, -1.35);
  }

  if (ak) ak.visible = showAk;

  firstPersonWeapon.muzzleFlash.material.opacity *= Math.exp(-dt * 30);
  if (firstPersonWeapon.sgMuzzleFlash) {
    firstPersonWeapon.sgMuzzleFlash.material.opacity *= Math.exp(-dt * 25);
    firstPersonWeapon.sgMuzzleFlash.visible = isShotgun;
  }
}

function movePlayer(dt) {
  let dx = 0;
  let dz = 0;
  if (keys.has("KeyW")) dz -= 1;
  if (keys.has("KeyS")) dz += 1;
  if (keys.has("KeyA")) dx -= 1;
  if (keys.has("KeyD")) dx += 1;

  const moving = dx !== 0 || dz !== 0;
  const sprinting = keys.has("ShiftLeft") && moving && player.stamina > 0 && !isCrouching;
  const speedMult = 1 + skills.speed.value;
  const moveSpeed = (isCrouching ? settings.walkSpeed * 0.45 : (sprinting ? settings.sprintSpeed : settings.walkSpeed)) * speedMult;
  if (sprinting) player.stamina = Math.max(0, player.stamina - 22 * dt);
  else player.stamina = Math.min(100, player.stamina + 16 * dt);

  if (moving) {
    const inputLen = Math.sqrt(dx * dx + dz * dz) || 1;
    const inX = dx / inputLen;
    const inY = dz / inputLen;
    const _forward = getV3().set(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
    const _right = getV3().set(Math.cos(player.yaw), 0, -Math.sin(player.yaw));

    player.moveVelocity
      .copy(_forward.multiplyScalar(-inY))
      .add(_right.multiplyScalar(inX))
      .normalize()
      .multiplyScalar(moveSpeed);

    player.bobTime += dt * (sprinting ? 10 : 7);
  } else {
    player.moveVelocity.set(0, 0, 0);
  }

  player.position.addScaledVector(player.moveVelocity, dt);

  if (keys.has("Space") && player.isGrounded && !isCrouching) {
    player.velocityY = settings.jumpSpeed;
    player.isGrounded = false;
  }

  player.velocityY += settings.gravity * dt;
  player.position.y += player.velocityY * dt;
  const eyeHeight = isCrouching ? 1.1 : 1.8;
  const floor = terrainHeight(player.position.x, player.position.z) + eyeHeight;
  if (player.position.y < floor) {
    player.position.y = floor;
    player.velocityY = 0;
    player.isGrounded = true;
  }

  camera.position.set(player.position.x, player.position.y, player.position.z);
  camera.position.y += Math.sin(player.bobTime) * (moving ? 0.045 : 0);
  camera.rotation.order = "YXZ";
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
}

function maybeDropPickup(position) {
  if (Math.random() < 0.35) {
    const onCity = activeMapConfig.id === "outbreak_city";
    const pickup = new THREE.Mesh(
      onCity
        ? new THREE.BoxGeometry(0.48, 0.2, 0.34)
        : new THREE.BoxGeometry(0.35, 0.35, 0.35),
      new THREE.MeshStandardMaterial(
        onCity
          ? { color: 0xb87a42, emissive: 0x2a1808, roughness: 0.55, metalness: 0.2 }
          : { color: 0xd0e56b, emissive: 0x4d5f14 },
      ),
    );
    pickup.position.copy(position);
    pickup.position.y = terrainHeight(position.x, position.z) + 0.4;
    pickup.castShadow = true;
    scene.add(pickup);
    pickups.push({ mesh: pickup, spin: Math.random() * 2 + 1 });
  }
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i -= 1) {
    const bullet = bullets[i];
    bullet.life -= dt;
    _bulletPrev.copy(bullet.mesh.position);
    bullet.mesh.position.addScaledVector(bullet.velocity, dt);
    if (bullet.life <= 0) {
      releaseBulletRecord(bullet);
      bullets.splice(i, 1);
      continue;
    }

    if (bullet.owner === "player" && checkBarrelHits(_bulletPrev, bullet.mesh.position)) {
      releaseBulletRecord(bullet);
      bullets.splice(i, 1);
      continue;
    }
    for (let zi = zombies.length - 1; zi >= 0; zi -= 1) {
      const zombie = zombies[zi];
      const hit = getZombieHit(_bulletPrev, bullet.mesh.position, zombie);
      if (hit) {
        const hs = hit.part === "head";
        applyZombieDamage(zi, bullet.damage * hit.multiplier, hs);
        releaseBulletRecord(bullet);
        bullets.splice(i, 1);
        if (bullet.owner === "player") {
          triggerHitMarker(hs);
          if (hs) {
            addScreenShake(0.08);
            triggerHitStop(0.045);
          }
          if (hs) score += 10;
          messageEl.textContent =
            hs ? `Headshot! +${isADS ? 160 : 150}pts` : hit.part === "torso" ? "Body hit." : "Limb hit.";
        }
        break;
      }
    }
  }
}

function applyZombieDamage(index, damageAmount, isHeadshot = false, isMelee = false) {
  const zombie = zombies[index];
  if (!zombie) return;
  const damageMult = 1 + skills.damage.value + (isHeadshot ? skills.headshotBonus.value : 0);
  const finalDamage = damageAmount * damageMult;
  zombie.hp -= finalDamage;
  playSfx("zombie_hit", Math.min(1.3, finalDamage / 22));
  spawnBloodParticles(zombie.mesh.position, isHeadshot ? 10 : 5);
  if (damageAmount > 0) {
    const dmgPos = zombie.mesh.position.clone();
    dmgPos.y += 2.4 + (zombie.isBoss ? 0.8 : 0);
    spawnFloatingDamage(dmgPos, finalDamage, isHeadshot);
  }
  if (isMelee) {
    addScreenShake(isHeadshot ? 0.18 : 0.12);
    triggerHitStop(isHeadshot ? 0.06 : 0.045);
  }
  if (zombie.hp <= 0) {
    const pos = zombie.mesh.position.clone();
    const wasBoss = zombie.isBoss;
    const zombieType = zombie.type;
    const isSpecial = ["spitter", "hunter", "charger", "juggernaut", "boomer", "screamer"].includes(zombieType);
    if (wasBoss) {
      addScreenShake(0.32);
      triggerHitStop(0.085);
    } else if (zombieType === "juggernaut") {
      addScreenShake(0.22);
      triggerHitStop(0.07);
    }

    // Create corpse for revival mechanic (unless headshot)
    if (!isHeadshot && !wasBoss && zombieType !== "boomer") {
      createZombieCorpse(pos, zombieType, zombie.mesh.rotation.y);
    }

    // Boomer explosion on death
    if (zombieType === "boomer" && !zombie.boomerExploded) {
      zombie.boomerExploded = true;
      createExplosion(pos, 4, 35);
      playSpatialSfx("explosion", pos, 0.8);
      // Toxic cloud
      const cloudGeo = new THREE.SphereGeometry(3.5, 12, 12);
      const cloudMat = new THREE.MeshBasicMaterial({ color: 0x88cc44, transparent: true, opacity: 0.35 });
      const cloud = new THREE.Mesh(cloudGeo, cloudMat);
      cloud.position.copy(pos);
      cloud.position.y += 1;
      scene.add(cloud);
      acidPuddles.push({ mesh: cloud, life: 5, maxLife: 5, radius: 3.5, damagePerSecond: 12 });
      topCenterAlertEl.textContent = "💥 BOOMER EXPLODED! Toxic cloud!";
      alertTimer = 2;
    }

    scene.remove(zombie.mesh);
    disposeObject3D(zombie.mesh);
    zombies.splice(index, 1);
    player.kills += 1;
    playSpatialSfx("zombie_death", pos, 1);
    maybeDropPickup(pos);
    if (!wasBoss && Math.random() < 0.45) spawnMaterialDrop(pos);
    // Juggernaut drops rare materials
    if (zombieType === "juggernaut") {
      spawnMaterialDrop(pos);
      spawnMaterialDrop(pos);
      if (Math.random() < 0.5) spawnMaterialDrop(pos);
      score += 200;
      topCenterAlertEl.textContent = "★ JUGGERNAUT DOWN! +200 pts";
      alertTimer = 2.5;
    }
    spawnBloodParticles(pos, 14);

    // Skill XP gain
    addSkillXP(wasBoss ? 50 : zombieType === "juggernaut" ? 40 : zombieType === "boomer" ? 20 : zombieType === "screamer" ? 15 : isSpecial ? 25 : 10);

    if (wasBoss) {
      bossAlive = false;
      score += 500;
      topCenterAlertEl.textContent = "★ BOSS DEFEATED! +500 pts";
      alertTimer = 3.5;
      grenadeCount = Math.min(grenadeCount + 2, 6);
      skillPoints += 2;
      messageEl.textContent = "Boss down! +2 grenades, +2 skill points!";
      addKillFeedEntry("💀 BOSS DOWN +500pts", "#ff6600");
    } else {
      score += isHeadshot ? 150 : 50;
      const label = isHeadshot ? `💀 ${zombieType} HEADSHOT! +150` : `💀 ${zombieType} +50`;
      const color = isHeadshot ? "#ff4444" : (isSpecial ? "#ffaa44" : "#ffdd88");
      addKillFeedEntry(label, color);
    }
    killStreak += 1;
    killStreakTimer = 4.5;
    if (killStreak === 5) { topCenterAlertEl.textContent = "🔥 KILLING SPREE! x5"; alertTimer = 2; addKillFeedEntry("🔥 KILLING SPREE x5!", "#ff9900"); }
    else if (killStreak === 10) { topCenterAlertEl.textContent = "🔥 RAMPAGE! x10 +bonus"; alertTimer = 2.5; score += 200; addKillFeedEntry("🔥 RAMPAGE x10 +200pts!", "#ff6600"); }
    else if (killStreak === 20) { topCenterAlertEl.textContent = "🔥 UNSTOPPABLE! x20 +bonus"; alertTimer = 3; score += 500; addKillFeedEntry("🔥 UNSTOPPABLE x20 +500pts!", "#ff3300"); }
    else if (killStreak === 30) { topCenterAlertEl.textContent = "🔥 GODLIKE! x30 +bonus"; alertTimer = 3; score += 1000; addKillFeedEntry("🔥 GODLIKE x30 +1000pts!", "#ff0000"); }
  }
}

function segmentSphereHit(a, b, center, radius) {
  _segAb.subVectors(b, a);
  _segAc.subVectors(center, a);
  const abLenSq = Math.max(0.0001, _segAb.lengthSq());
  const t = THREE.MathUtils.clamp(_segAc.dot(_segAb) / abLenSq, 0, 1);
  _segClosest.copy(a).addScaledVector(_segAb, t);
  return _segClosest.distanceToSquared(center) <= radius * radius;
}

function getZombieHit(from, to, zombie) {
  const base = zombie.mesh.position;
  const bx = base.x;
  const by = base.y;
  const bz = base.z;
  _hitZoneCenters[0].set(bx, by + 2.08, bz + 0.02);
  _hitZoneCenters[1].set(bx, by + 1.46, bz);
  _hitZoneCenters[2].set(bx - 0.55, by + 1.35, bz);
  _hitZoneCenters[3].set(bx + 0.55, by + 1.35, bz);
  _hitZoneCenters[4].set(bx - 0.22, by + 0.45, bz);
  _hitZoneCenters[5].set(bx + 0.22, by + 0.45, bz);
  let r0 = 0.27;
  let r1 = 0.56;
  let r2 = 0.26;
  let r3 = 0.26;
  let r4 = 0.25;
  let r5 = 0.25;
  if (zombie.type === "brute") {
    r0 *= 1.22;
    r1 *= 1.22;
    r2 *= 1.22;
    r3 *= 1.22;
    r4 *= 1.22;
    r5 *= 1.22;
  } else if (zombie.type === "runner") {
    r0 *= 0.9;
    r1 *= 0.9;
    r2 *= 0.9;
    r3 *= 0.9;
    r4 *= 0.9;
    r5 *= 0.9;
  }
  const zones = [
    { part: "head", multiplier: 2.1, center: _hitZoneCenters[0], radius: r0 },
    { part: "torso", multiplier: 1.0, center: _hitZoneCenters[1], radius: r1 },
    { part: "limb", multiplier: 0.7, center: _hitZoneCenters[2], radius: r2 },
    { part: "limb", multiplier: 0.7, center: _hitZoneCenters[3], radius: r3 },
    { part: "limb", multiplier: 0.7, center: _hitZoneCenters[4], radius: r4 },
    { part: "limb", multiplier: 0.7, center: _hitZoneCenters[5], radius: r5 },
  ];

  for (const zone of zones) {
    if (segmentSphereHit(from, to, zone.center, zone.radius)) return zone;
  }
  return null;
}

function updatePickups(dt) {
  for (let i = pickups.length - 1; i >= 0; i -= 1) {
    const p = pickups[i];
    p.mesh.rotation.y += p.spin * dt;
    p.mesh.position.y += Math.sin(gameTime * 4 + i) * 0.002;
    if (p.mesh.position.distanceTo(player.position) < 1.5) {
      if (p.isMaterial) {
        const gain = 1 + Math.floor(Math.random() * 2);
        materials[p.materialType] += gain;
        onMaterialCollected(missionGenerator, p.materialType, gain);
        scene.remove(p.mesh);
        disposeOwnedObject3D(p.mesh);
        pickups.splice(i, 1);
        messageEl.textContent = `Picked up ${p.materialType}! (${materials[p.materialType]} total)`;
        playSfx("ui_click", 0.8);
        continue;
      }
      // Refill all reserves so weapon switching never leaves you "unable to reload".
      for (const w of player.weapons) {
        const gain = w.name === "Shotgun" ? 4 : 12;
        w.reserve = Math.min(getWeaponReserveCap(w), w.reserve + gain);
      }
      syncPlayerAmmoFields(player);
      player.hp = Math.min(getPlayerMaxHealth(), player.hp + 8);
      scene.remove(p.mesh);
      disposeOwnedObject3D(p.mesh);
      pickups.splice(i, 1);
      messageEl.textContent = "Picked up supplies (+all ammo reserves, +hp).";
    }
  }
}

function updateTeammates(dt) {
  for (const mate of teammates) {
    mate.shootCooldown = Math.max(0, mate.shootCooldown - dt);
    mate.targetMemory = Math.max(0, mate.targetMemory - dt);
    if (mate.reloadTimer > 0) {
      mate.reloadTimer -= dt;
      if (mate.reloadTimer <= 0) {
        const w = mate.weapons[mate.activeWeapon];
        const needed = w.magSize - w.ammo;
        const load = Math.min(needed, w.reserve);
        w.ammo += load;
        w.reserve -= load;
      }
    }

    mate.rifle.muzzleFlash.material.opacity *= Math.exp(-dt * 28);
    if (mate.shotgun) mate.shotgun.muzzleFlash.material.opacity *= Math.exp(-dt * 28);
    mate.pistol.muzzleFlash.material.opacity *= Math.exp(-dt * 28);

    const followTarget = _teammateFollowTarget
      .copy(player.position)
      .add(_tempVec3.copy(mate.followOffset).applyAxisAngle(_worldAxisY, player.yaw));

    let visibleTarget = null;
    let visibleDistanceSq = Infinity;
    for (const zombie of zombies) {
      if (!canTeammateSeeZombie(mate, zombie)) continue;
      const d2 = mate.mesh.position.distanceToSquared(zombie.mesh.position);
      if (d2 < visibleDistanceSq) {
        visibleDistanceSq = d2;
        visibleTarget = zombie;
      }
    }

    if (visibleTarget) {
      mate.currentTarget = visibleTarget;
      mate.targetMemory = 1.15;
      mate.lastKnownTargetPosition.copy(visibleTarget.mesh.position);
    } else if (mate.currentTarget && !zombies.includes(mate.currentTarget)) {
      mate.currentTarget = null;
    } else if (mate.currentTarget && mate.targetMemory > 0) {
      mate.lastKnownTargetPosition.copy(mate.currentTarget.mesh.position);
    } else {
      mate.currentTarget = null;
    }

    let moveGoal = followTarget;
    let combatDistanceSq = Infinity;
    if (mate.currentTarget) {
      const targetPosition = _teammateTargetPosition.copy(mate.currentTarget.mesh.position);
      const d2 = mate.mesh.position.distanceToSquared(targetPosition);
      combatDistanceSq = d2;
      const dist = Math.sqrt(d2);
      let preferredWeapon = dist > 18 ? 0 : dist < 10 ? 2 : 1;
      let fallback = -1;
      for (let wi = 0; wi < mate.weapons.length; wi += 1) {
        if (mate.weapons[wi].ammo > 0 || mate.weapons[wi].reserve > 0) {
          fallback = wi;
          break;
        }
      }
      if (fallback >= 0 && mate.weapons[preferredWeapon].ammo <= 0 && mate.weapons[preferredWeapon].reserve <= 0) {
        preferredWeapon = fallback;
      }
      mate.activeWeapon = preferredWeapon;
      const weapon = mate.weapons[mate.activeWeapon];
      if (d2 > weapon.preferredRange * weapon.preferredRange && mate.mesh.position.distanceToSquared(player.position) < 14 * 14) {
        moveGoal = targetPosition;
      }
    }

    const toGoal = getV3().subVectors(moveGoal, mate.mesh.position);
    toGoal.y = 0;
    const dist = toGoal.length();
    if (dist > 1.1) {
      mate.mesh.position.addScaledVector(toGoal.normalize(), Math.min(4.8, dist * 0.9) * dt);
      mate.walkPhase += dt * 8;
    }
    mate.mesh.position.y = terrainHeight(mate.mesh.position.x, mate.mesh.position.z);

    const aimTarget = mate.currentTarget ? mate.currentTarget.mesh.position : moveGoal;
    const toAim = getV3().subVectors(aimTarget, mate.mesh.position);
    toAim.y = 0;
    if (toAim.lengthSq() > 0.001) mate.mesh.rotation.y = Math.atan2(toAim.x, toAim.z);

    const weapon = mate.weapons[mate.activeWeapon];
    const usingRifle = mate.activeWeapon === 0;
    const usingShotgun = mate.activeWeapon === 2;
    const usingPistol = mate.activeWeapon === 1;
    mate.rifle.group.visible = usingRifle;
    if (mate.shotgun) mate.shotgun.group.visible = usingShotgun;
    mate.pistol.group.visible = usingPistol;

    const activeGun = usingShotgun && mate.shotgun ? mate.shotgun : (usingRifle ? mate.rifle : mate.pistol);
    const anchorPos = usingShotgun
      ? { x: 0.11, y: 1.34, z: -0.22 }
      : usingRifle
        ? { x: 0.11, y: 1.33, z: -0.25 }
        : { x: 0.16, y: 1.35, z: -0.12 };
    const anchorRot = usingShotgun
      ? { x: -0.08, y: -0.12, z: 0.08 }
      : usingRifle
        ? { x: -0.1, y: -0.12, z: 0.08 }
        : { x: -0.05, y: -0.04, z: 0.18 };
    mate.weaponAnchor.position.set(anchorPos.x, anchorPos.y, anchorPos.z);
    mate.weaponAnchor.rotation.set(anchorRot.x, anchorRot.y, anchorRot.z);

    if (mate.currentTarget && weapon.ammo <= 0 && weapon.reserve > 0 && mate.reloadTimer <= 0) {
      mate.reloadTimer = 1.2;
    } else if (
      mate.currentTarget &&
      mate.reloadTimer <= 0 &&
      mate.shootCooldown <= 0 &&
      combatDistanceSq < weapon.range * weapon.range &&
      weapon.ammo > 0 &&
      visibleTarget === mate.currentTarget
    ) {
      mate.mesh.updateMatrixWorld(true);
      activeGun.muzzle.getWorldPosition(_muzzleWorld);
      _aimPointVec.copy(mate.currentTarget.mesh.position).add(_tempVec1.set(0, 1.45, 0));
      _teammateShotDir.copy(_aimPointVec).sub(_muzzleWorld).normalize();
      _teammateShotDir.x += (Math.random() - 0.5) * 0.03;
      _teammateShotDir.y += (Math.random() - 0.5) * 0.02;
      _teammateShotDir.z += (Math.random() - 0.5) * 0.03;
      _teammateShotDir.normalize();

      weapon.ammo -= 1;
      mate.shootCooldown = weapon.fireDelay;
      activeGun.muzzleFlash.material.opacity = 0.9;
      activeGun.muzzleFlash.scale.setScalar(1 + Math.random() * 0.8);
      playSfx("teammate_shot", 0.75);
      if (usingShotgun && weapon.pellets) {
        for (let p = 0; p < weapon.pellets; p += 1) {
          _pelletDirScratch.copy(_teammateShotDir);
          _pelletDirScratch.x += (Math.random() - 0.5) * 0.08;
          _pelletDirScratch.y += (Math.random() - 0.5) * 0.06;
          _pelletDirScratch.z += (Math.random() - 0.5) * 0.08;
          _pelletDirScratch.normalize();
          spawnBullet(_muzzleWorld, _pelletDirScratch, weapon.damage, {
            speed: weapon.bulletSpeed,
            life: weapon.range / weapon.bulletSpeed + 0.12,
            color: 0x6bc7ff,
            radius: 0.034,
            owner: "teammate",
          });
        }
      } else {
        spawnBullet(_muzzleWorld, _teammateShotDir, weapon.damage, {
          speed: weapon.bulletSpeed,
          life: weapon.range / weapon.bulletSpeed + 0.12,
          color: 0x6bc7ff,
          radius: usingRifle ? 0.034 : 0.03,
          owner: "teammate",
        });
      }
    }

    const swing = Math.sin(mate.walkPhase) * 0.5;
    const isAiming = mate.currentTarget && mate.targetMemory > 0;
    mate.leftArmPivot.rotation.set(
      isAiming ? (usingRifle ? -0.95 : usingShotgun ? -0.9 : -0.45) : -0.35 + swing * 0.3,
      0,
      isAiming ? (usingRifle ? 0.6 : usingShotgun ? 0.55 : 0.24) : 0.05,
    );
    mate.rightArmPivot.rotation.set(
      isAiming ? (usingRifle ? -1.12 : usingShotgun ? -1.08 : -1.0) : -0.25 - swing * 0.35,
      0,
      isAiming ? (usingRifle ? -0.38 : usingShotgun ? -0.35 : -0.2) : -0.08,
    );
    mate.leftLegPivot.rotation.x = -swing * 0.6;
    mate.rightLegPivot.rotation.x = swing * 0.6;
  }
}

function updateZombies(dt) {
  // Update acid / fire puddles
  for (let ai = acidPuddles.length - 1; ai >= 0; ai--) {
    const puddle = acidPuddles[ai];
    puddle.life -= dt;
    puddle.mesh.material.opacity = Math.max(0, puddle.life / puddle.maxLife * 0.7);
    if (puddle.life <= 0) {
      scene.remove(puddle.mesh);
      disposeOwnedObject3D(puddle.mesh);
      acidPuddles.splice(ai, 1);
      continue;
    }
    // Damage players/teammates in acid puddles (fire puddles don't hurt player)
    if (gameState === "PLAYING" && !gameOver && !puddle.isFire) {
      const dToPlayer = puddle.mesh.position.distanceTo(player.position);
      if (dToPlayer < puddle.radius) {
        player.hp = Math.max(0, player.hp - puddle.damagePerSecond * dt);
        player.damageFlash = 0.5;
        if (player.hp <= 0 && !gameOver) {
          player.hp = 0;
          gameOver = true;
          messageEl.textContent = "Dissolved by acid...";
          if (document.pointerLockElement === canvas) document.exitPointerLock();
          setMenuMode("death");
        }
      }
    }
    // Fire puddles damage zombies
    if (puddle.isFire) {
      for (const z of zombies) {
        if (z.mesh.position.distanceTo(puddle.mesh.position) < puddle.radius) {
          z.hp -= puddle.damagePerSecond * dt;
          if (z.hp <= 0) {
            applyZombieDamage(zombies.indexOf(z), 0);
          }
        }
      }
    }
  }

  for (let i = zombies.length - 1; i >= 0; i -= 1) {
    const zombie = zombies[i];
    zombie.attackTimer -= dt;

    // Check distractions first (noise makers attract zombies)
    let targetPosition = player.position.clone();
    let targetIsPlayer = true;
    let nearestDistanceSq = zombie.mesh.position.distanceToSquared(player.position);

    // Check for distractions
    for (const dist of distractions) {
      if (dist.active && dist.position) {
        const d2 = zombie.mesh.position.distanceToSquared(dist.position);
        if (d2 < nearestDistanceSq && d2 < 60 * 60) {
          nearestDistanceSq = d2;
          targetPosition.copy(dist.position);
          targetIsPlayer = false;
        }
      }
    }

    // Normal targeting
    for (const mate of teammates) {
      const d2 = zombie.mesh.position.distanceToSquared(mate.mesh.position);
      if (d2 < nearestDistanceSq) {
        nearestDistanceSq = d2;
        targetPosition.copy(mate.mesh.position);
        targetIsPlayer = false;
      }
    }

    // Target stranded survivor if active
    if (isSurvivorAlive(eventDirector) && eventDirector.survivorPosition) {
      const sPos = new THREE.Vector3(eventDirector.survivorPosition.x, eventDirector.survivorPosition.y, eventDirector.survivorPosition.z);
      const d2 = zombie.mesh.position.distanceToSquared(sPos);
      if (d2 < nearestDistanceSq) {
        nearestDistanceSq = d2;
        targetPosition.copy(sPos);
        targetIsPlayer = false;
      }
    }

    const toTarget = getV3().subVectors(targetPosition, zombie.mesh.position);
    toTarget.y = 0;
    const distance = toTarget.length();

    const nightSpeedMult = (isNight || hordeNightActive) ? 1.45 : 1.0;

    // Special infected behaviors
    if (zombie.type === "spitter") {
      zombie.spitterCooldown -= dt;
      // Spitter tries to maintain distance and spits acid
      if (distance < 35 && distance > 12 && zombie.spitterCooldown <= 0 && hasLineOfSight(zombie.mesh.position, targetPosition)) {
        zombie.spitterCooldown = 4 + Math.random() * 2;
        playSpatialSfx("acid_spit", zombie.mesh.position, 0.7);
        // Create acid projectile
        spawnAcidSpit(zombie.mesh.position.clone().add(new THREE.Vector3(0, 2, 0)), targetPosition.clone().add(new THREE.Vector3(0, 1.5, 0)));
        topCenterAlertEl.textContent = "⚠ SPITTER ACID!";
        alertTimer = 1.5;
      }
      // Move away if too close
      if (distance < 10) {
        zombie.mesh.position.addScaledVector(toTarget.normalize(), -zombie.speed * nightSpeedMult * dt * 0.7);
      } else if (distance < 52) {
        zombie.mesh.position.addScaledVector(toTarget.normalize(), zombie.speed * nightSpeedMult * 0.6 * dt);
      }
    } else if (zombie.type === "hunter") {
      zombie.hunterCooldown -= dt;
      // Hunter crouches then leaps
      if (distance < 28 && distance > 8 && zombie.hunterCooldown <= 0 && !zombie.hunterLeaping) {
        zombie.hunterCooldown = 5 + Math.random() * 3;
        zombie.hunterLeaping = true;
        playSpatialSfx("hunter_leap", zombie.mesh.position, 0.8);
        // Calculate leap arc
        const leapDir = toTarget.clone().normalize();
        zombie.leapVelocity = leapDir.multiplyScalar(14);
        zombie.leapVelocity.y = 6;
        zombie.leapTime = 0.5;
      }
      if (zombie.hunterLeaping) {
        zombie.leapTime -= dt;
        zombie.leapVelocity.y += settings.gravity * 0.6 * dt;
        zombie.mesh.position.addScaledVector(zombie.leapVelocity, dt);
        if (zombie.mesh.position.y < terrainHeight(zombie.mesh.position.x, zombie.mesh.position.z)) {
          zombie.mesh.position.y = terrainHeight(zombie.mesh.position.x, zombie.mesh.position.z);
          zombie.hunterLeaping = false;
        }
        // Check collision with player
        if (targetIsPlayer && distance < 1.8 && zombie.leapTime > 0) {
          player.hp = Math.max(0, player.hp - 18);
          player.damageFlash = 0.9;
          addScreenShake(0.4);
          triggerHitStop(0.05);
          messageEl.textContent = "HUNTER POUNCED!";
          zombie.hunterLeaping = false;
          if (player.hp <= 0 && !gameOver) {
            gameOver = true;
            messageEl.textContent = "You died.";
            if (document.pointerLockElement === canvas) document.exitPointerLock();
            setMenuMode("death");
          }
        }
        continue; // Skip normal movement during leap
      } else if (distance < 52) {
        zombie.mesh.position.addScaledVector(toTarget.normalize(), zombie.speed * nightSpeedMult * 1.3 * dt);
      }
    } else if (zombie.type === "charger") {
      zombie.chargeCooldown -= dt;
      if (zombie.isCharging) {
        // Charging forward rapidly
        zombie.mesh.position.addScaledVector(zombie.chargeDirection, settings.sprintSpeed * 1.6 * dt);
        zombie.chargeTimer -= dt;
        // Check wall collision
        if (zombie.chargeTimer <= 0) {
          zombie.isCharging = false;
        }
        // Check player collision
        if (targetIsPlayer && distance < 2) {
          player.hp -= zombie.damage * 2;
          player.damageFlash = 0.9;
          addScreenShake(0.6);
          triggerHitStop(0.075);
          // Knockback
          const knockDir = zombie.chargeDirection.clone();
          player.position.addScaledVector(knockDir, 6);
          messageEl.textContent = "CHARGER HIT!";
          zombie.isCharging = false;
          if (player.hp <= 0 && !gameOver) {
            player.hp = 0;
            gameOver = true;
            messageEl.textContent = "Trampled by Charger...";
            if (document.pointerLockElement === canvas) document.exitPointerLock();
            setMenuMode("death");
          }
        }
      } else if (distance < 40 && distance > 6 && zombie.chargeCooldown <= 0) {
        // Start charge
        zombie.chargeCooldown = 6 + Math.random() * 4;
        zombie.isCharging = true;
        zombie.chargeTimer = 1.2;
        zombie.chargeDirection.copy(toTarget).normalize();
        playSfx("charger_charge", 0.9);
        topCenterAlertEl.textContent = "⚠ CHARGER!";
        alertTimer = 1.5;
      } else if (distance < 52) {
        zombie.mesh.position.addScaledVector(toTarget.normalize(), zombie.speed * nightSpeedMult * dt);
      }
    } else if (zombie.type === "juggernaut") {
      // Juggernaut ignores barricades and walks straight toward player
      if (distance < 52) {
        zombie.mesh.position.addScaledVector(toTarget.normalize(), zombie.speed * nightSpeedMult * dt);
      }
    } else if (zombie.type === "boomer") {
      // Boomer moves slowly toward player; if hit or within 3m, it explodes
      if (distance < 52) {
        zombie.mesh.position.addScaledVector(toTarget.normalize(), zombie.speed * nightSpeedMult * dt);
      }
    } else if (zombie.type === "screamer") {
      // Screamer tries to maintain distance, then screams and spawns zombies
      zombie.screamCooldown -= dt;
      if (zombie.hasScreamed && zombie.screamCooldown <= 0) zombie.hasScreamed = false;
      if (distance < 30 && distance > 10 && zombie.screamCooldown <= 0 && !zombie.hasScreamed) {
        zombie.screamCooldown = 8 + Math.random() * 4;
        zombie.hasScreamed = true;
        playSpatialSfx("zombie_growl", zombie.mesh.position, 1.2);
        // Spawn 3-5 extra zombies nearby
        const screamCount = 3 + Math.floor(Math.random() * 3);
        for (let s = 0; s < screamCount; s++) {
          const sAngle = Math.random() * Math.PI * 2;
          const sDist = 15 + Math.random() * 20;
          addZombie(zombie.mesh.position.x + Math.cos(sAngle) * sDist, zombie.mesh.position.z + Math.sin(sAngle) * sDist);
        }
        topCenterAlertEl.textContent = "⚠ SCREAMER! Horde incoming!";
        alertTimer = 2.5;
      }
      if (distance < 10) {
        // Run away from player
        zombie.mesh.position.addScaledVector(toTarget.normalize(), -zombie.speed * nightSpeedMult * dt * 0.8);
      } else if (distance < 52) {
        zombie.mesh.position.addScaledVector(toTarget.normalize(), zombie.speed * nightSpeedMult * 0.7 * dt);
      }
    } else {
      // Normal zombie movement
      if (distance < 52) {
        if (!zombieHitBarricade(zombie, dt)) {
          zombie.mesh.position.addScaledVector(toTarget.normalize(), zombie.speed * nightSpeedMult * dt);
        }
      } else {
        zombie.mesh.position.x += Math.sin(gameTime + zombie.wanderSeed) * dt * 1.05;
        zombie.mesh.position.z += Math.cos(gameTime * 0.7 + zombie.wanderSeed) * dt * 1.05;
      }
    }

    zombie.mesh.position.y = terrainHeight(zombie.mesh.position.x, zombie.mesh.position.z);
    if (toTarget.lengthSq() > 0.0001) zombie.mesh.rotation.y = Math.atan2(toTarget.x, toTarget.z);

    zombie.walkPhase += dt * 7;
    const swing = Math.sin(zombie.walkPhase) * 0.6;
    const baseLeftArm = swing;
    const baseRightArm = -swing;
    const baseLeftLeg = -swing * 0.65;
    const baseRightLeg = swing * 0.65;

    // New attack animation: wind-up -> slash -> recover.
    if (zombie.attackAnimating) {
      zombie.attackAnimTime += dt;
      const t = zombie.attackAnimTime;
      if (t < 0.16) {
        zombie.leftArm.rotation.x = baseLeftArm - t * 4.2;
        zombie.rightArm.rotation.x = baseRightArm - t * 5.1;
        zombie.leftLeg.rotation.x = baseLeftLeg * 0.5;
        zombie.rightLeg.rotation.x = baseRightLeg * 0.5;
      } else if (t < 0.34) {
        const p = (t - 0.16) / 0.18;
        zombie.leftArm.rotation.x = THREE.MathUtils.lerp(-0.7, 1.35, p);
        zombie.rightArm.rotation.x = THREE.MathUtils.lerp(-0.95, 1.55, p);
        zombie.leftLeg.rotation.x = baseLeftLeg + 0.2 * p;
        zombie.rightLeg.rotation.x = baseRightLeg - 0.2 * p;
      } else if (t < 0.58) {
        const p = (t - 0.34) / 0.24;
        zombie.leftArm.rotation.x = THREE.MathUtils.lerp(1.35, baseLeftArm, p);
        zombie.rightArm.rotation.x = THREE.MathUtils.lerp(1.55, baseRightArm, p);
        zombie.leftLeg.rotation.x = THREE.MathUtils.lerp(baseLeftLeg + 0.2, baseLeftLeg, p);
        zombie.rightLeg.rotation.x = THREE.MathUtils.lerp(baseRightLeg - 0.2, baseRightLeg, p);
      } else {
        zombie.attackAnimating = false;
        zombie.attackAnimTime = 0;
        zombie.leftArm.rotation.x = baseLeftArm;
        zombie.rightArm.rotation.x = baseRightArm;
        zombie.leftLeg.rotation.x = baseLeftLeg;
        zombie.rightLeg.rotation.x = baseRightLeg;
      }
    } else {
      zombie.leftArm.rotation.x = baseLeftArm;
      zombie.rightArm.rotation.x = baseRightArm;
      zombie.leftLeg.rotation.x = baseLeftLeg;
      zombie.rightLeg.rotation.x = baseRightLeg;
    }

    const attackDistance = zombie.type === "brute" ? 1.45 : settings.zombieHitDistance;
    if (distance < attackDistance && zombie.attackTimer <= 0 && !zombie.hunterLeaping && !zombie.isCharging) {
      zombie.attackTimer = settings.zombieAttackEvery;
      zombie.attackAnimating = true;
      zombie.attackAnimTime = 0;
      if (targetIsPlayer) {
        player.hp -= zombie.damage;
        player.damageFlash = 0.9;
        addScreenShake(
          zombie.type === "juggernaut" ? 0.28 : zombie.type === "brute" ? 0.18 : zombie.type === "charger" ? 0.16 : 0.08,
        );
        if (zombie.type === "juggernaut" || zombie.type === "brute" || zombie.type === "charger") {
          triggerHitStop(0.04);
        }
        messageEl.textContent = zombie.type === "brute" ? "Brute smash!" : zombie.type === "spitter" ? "Spitter clawed you!" : zombie.type === "hunter" ? "Hunter slashed!" : zombie.type === "charger" ? "Charger punched!" : zombie.type === "crawler" ? "Crawler bit you!" : zombie.type === "juggernaut" ? "Juggernaut crushed you!" : zombie.type === "boomer" ? "Boomer clawed you!" : zombie.type === "screamer" ? "Screamer scratched you!" : "A zombie hit you!";
        if (player.hp <= 0) {
          player.hp = 0;
          gameOver = true;
          messageEl.textContent = "You died.";
          if (document.pointerLockElement === canvas) document.exitPointerLock();
          setMenuMode("death");
        }
      } else if (isSurvivorAlive(eventDirector) && distance < attackDistance && eventDirector.survivorPosition) {
        const sPos = new THREE.Vector3(eventDirector.survivorPosition.x, eventDirector.survivorPosition.y, eventDirector.survivorPosition.z);
        if (zombie.mesh.position.distanceTo(sPos) < attackDistance + 1) {
          const sHP = damageSurvivor(eventDirector, zombie.damage);
          messageEl.textContent = `Survivor under attack! HP: ${Math.max(0, Math.floor(sHP))}`;
        }
      } else {
        messageEl.textContent = "Teammate engaged!";
      }
    }
  }
}

function spawnAcidSpit(from, to) {
  // Create acid projectile
  const acid = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0x88ff44, emissive: 0x44aa22, emissiveIntensity: 0.5 }),
  );
  acid.position.copy(from);
  scene.add(acid);

  const velocity = new THREE.Vector3().subVectors(to, from).normalize().multiplyScalar(18);

  // Animate projectile
  const duration = 0.8;
  let time = 0;
  const interval = setInterval(() => {
    time += 0.016;
    acid.position.addScaledVector(velocity, 0.016);
    velocity.y += settings.gravity * 0.016 * 0.3;
    if (time >= duration || acid.position.y < terrainHeight(acid.position.x, acid.position.z)) {
      clearInterval(interval);
      scene.remove(acid);
      acid.geometry.dispose();
      acid.material.dispose();
      // Create acid puddle
      createAcidPuddle(acid.position);
    }
  }, 16);
}

function createAcidPuddle(position) {
  const puddle = new THREE.Mesh(
    new THREE.CircleGeometry(3.5, 16),
    new THREE.MeshStandardMaterial({ color: 0x66cc33, transparent: true, opacity: 0.6, emissive: 0x336611, emissiveIntensity: 0.2 }),
  );
  puddle.rotation.x = -Math.PI / 2;
  puddle.position.set(position.x, terrainHeight(position.x, position.z) + 0.05, position.z);
  scene.add(puddle);
  acidPuddles.push({ mesh: puddle, life: 8, maxLife: 8, radius: 3.5, damagePerSecond: 18 });
}

// ─── Weather System ───────────────────────────────────────────────────────────
function initWeather() {
  const mapWeather = activeMapConfig.weather;
  if (!mapWeather || Math.random() > mapWeather.chance) {
    weatherState.active = false;
    return;
  }
  weatherState.active = true;
  weatherState.type = mapWeather.type;
  weatherState.intensity = mapWeather.intensity;
  weatherState.timer = 0;
  weatherState.windDir.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();

  // Create weather particles (rain, snow, ash, dust)
  const count = Math.floor(400 * mapWeather.intensity);
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 80;
    positions[i * 3 + 1] = Math.random() * 40 + 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    velocities[i * 3] = weatherState.windDir.x * (0.5 + Math.random() * 2);
    velocities[i * 3 + 1] = mapWeather.type === "snow" ? -0.3 - Math.random() * 0.8 : mapWeather.type === "ash" ? -0.1 - Math.random() * 0.4 : -3 - Math.random() * 4;
    velocities[i * 3 + 2] = weatherState.windDir.z * (0.5 + Math.random() * 2);
  }
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  let color = 0xaaccff;
  let opacity = 0.45;
  let size = 0.08;
  if (mapWeather.type === "snow") { color = 0xffffff; opacity = 0.65; size = 0.12; }
  else if (mapWeather.type === "ash") { color = 0x554433; opacity = 0.35; size = 0.06; }
  else if (mapWeather.type === "dust") { color = 0xc4a060; opacity = 0.3; size = 0.05; }
  else if (mapWeather.type === "fog") { opacity = 0.25; size = 0.04; }

  const mat = new THREE.PointsMaterial({ color, size, transparent: true, opacity, depthWrite: false });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  weatherState.particles = points;
  weatherState.velocities = velocities;
}

function updateWeather(dt) {
  if (!weatherState.active || !weatherState.particles) return;
  const positions = weatherState.particles.geometry.attributes.position.array;
  const count = positions.length / 3;
  const px = player.position.x;
  const pz = player.position.z;
  for (let i = 0; i < count; i++) {
    positions[i * 3] += weatherState.velocities[i * 3] * dt;
    positions[i * 3 + 1] += weatherState.velocities[i * 3 + 1] * dt;
    positions[i * 3 + 2] += weatherState.velocities[i * 3 + 2] * dt;
    // Wrap around player
    if (positions[i * 3 + 1] < 0 || positions[i * 3 + 1] > 45) {
      positions[i * 3] = px + (Math.random() - 0.5) * 70;
      positions[i * 3 + 1] = 35 + Math.random() * 10;
      positions[i * 3 + 2] = pz + (Math.random() - 0.5) * 70;
    }
    if (Math.abs(positions[i * 3] - px) > 50) positions[i * 3] = px + (Math.random() - 0.5) * 60;
    if (Math.abs(positions[i * 3 + 2] - pz) > 50) positions[i * 3 + 2] = pz + (Math.random() - 0.5) * 60;
  }
  weatherState.particles.geometry.attributes.position.needsUpdate = true;
}

function clearWeather() {
  if (weatherState.particles) {
    scene.remove(weatherState.particles);
    weatherState.particles.geometry.dispose();
    weatherState.particles.material.dispose();
    weatherState.particles = null;
  }
  weatherState.active = false;
}

// ─── Scavenging / Materials ─────────────────────────────────────────────────
function spawnMaterialDrop(position) {
  const roll = Math.random();
  let type = "scrap";
  let color = 0x888888;
  if (roll < 0.25) { type = "wood"; color = 0x8b6914; }
  else if (roll < 0.5) { type = "metal"; color = 0xa0a8b0; }
  else if (roll < 0.7) { type = "cloth"; color = 0x6b5a3e; }
  else if (roll < 0.85) { type = "chemicals"; color = 0x44aa44; }

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.25, 0.25),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.2, roughness: 0.7 }),
  );
  mesh.position.copy(position);
  mesh.position.y = terrainHeight(position.x, position.z) + 0.3;
  mesh.castShadow = true;
  scene.add(mesh);
  pickups.push({ mesh, spin: Math.random() * 3 + 1, isMaterial: true, materialType: type });
}

// ─── Barricade Building ──────────────────────────────────────────────────────
function buildBarricade() {
  if (!pointerLocked || gameOver || gameState !== "PLAYING") return;
  const cost = buildType === "wood" ? { wood: 3 } : { metal: 2, scrap: 1 };
  for (const [mat, amount] of Object.entries(cost)) {
    if (materials[mat] < amount) {
      messageEl.textContent = `Need ${amount} ${mat} for ${buildType} barricade!`;
      return;
    }
  }
  for (const [mat, amount] of Object.entries(cost)) materials[mat] -= amount;

  const dir = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const pos = player.position.clone().addScaledVector(dir, 2.5);
  pos.y = terrainHeight(pos.x, pos.z);

  const isWood = buildType === "wood";
  const w = isWood ? 2.2 : 1.8;
  const h = isWood ? 1.6 : 2.0;
  const d = isWood ? 0.25 : 0.12;
  const group = new THREE.Group();
  const matColor = isWood ? 0x6b4423 : 0x556677;
  const roughness = isWood ? 0.92 : 0.45;
  const metalness = isWood ? 0.0 : 0.75;

  // Main panel
  const panelMat = new THREE.MeshStandardMaterial({ color: matColor, roughness, metalness });
  panelMat.userData.disposeWithMesh = true;
  const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), panelMat);
  panel.position.y = h / 2;
  panel.castShadow = true;
  panel.receiveShadow = true;

  // Support posts
  const postGeo = new THREE.BoxGeometry(0.12, h + 0.3, 0.12);
  const postMat = new THREE.MeshStandardMaterial({ color: isWood ? 0x5a3a1a : 0x445566, roughness, metalness });
  postMat.userData.disposeWithMesh = true;
  const leftPost = new THREE.Mesh(postGeo, postMat);
  leftPost.position.set(-w / 2 + 0.12, h / 2, 0);
  const rightPost = new THREE.Mesh(postGeo, postMat);
  rightPost.position.set(w / 2 - 0.12, h / 2, 0);

  group.add(panel, leftPost, rightPost);
  group.position.copy(pos);
  group.lookAt(player.position.x, pos.y, player.position.z);
  scene.add(group);

  const hp = isWood ? 120 : 350;
  barricades.push({ mesh: group, hp, maxHp: hp, type: buildType });
  visionBlockers.push(panel, leftPost, rightPost);
  messageEl.textContent = `${buildType.charAt(0).toUpperCase() + buildType.slice(1)} barricade built!`;
  playSfx("ui_click", 1.2);
  showBuildHint();
}

function updateBarricades(dt) {
  for (let i = barricades.length - 1; i >= 0; i--) {
    const b = barricades[i];
    if (b.hp <= 0) {
      scene.remove(b.mesh);
      for (const ch of b.mesh.children) {
        const idx = visionBlockers.indexOf(ch);
        if (idx >= 0) visionBlockers.splice(idx, 1);
      }
      barricades.splice(i, 1);
      messageEl.textContent = "Barricade destroyed!";
    }
  }
}

function switchBuildType() {
  buildType = buildType === "wood" ? "metal" : "wood";
  messageEl.textContent = `Build mode: ${buildType.toUpperCase()} (B to build, N to switch)`;
  showBuildHint();
}

function showBuildHint() {
  if (!buildHintEl) return;
  const cost = buildType === "wood"
    ? `Wood ×3 (have: ${materials.wood})`
    : `Metal ×2 + Scrap ×1 (have: M:${materials.metal} S:${materials.scrap})`;
  buildHintEl.textContent = `[B] Build ${buildType.toUpperCase()} barricade — Cost: ${cost}  [N] Switch type`;
  buildHintEl.style.opacity = "1";
  clearTimeout(showBuildHint._timer);
  showBuildHint._timer = setTimeout(() => { if (buildHintEl) buildHintEl.style.opacity = "0"; }, 3500);
}

// ─── Upgrade Bench ───────────────────────────────────────────────────────────
function openUpgradeBench() {
  if (gameState !== "PLAYING" || gameOver) return;
  paused = true;
  upgradeBenchOpen = true;
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  showUpgradeBench(upgradeBenchUI, player, materials, skills, () => {
    updateHUDMaterials();
    syncPlayerAmmoFields(player);
  });
  if (upgradeBenchUI.closeBtn) {
    upgradeBenchUI.closeBtn.onclick = () => closeUpgradeBench();
  }
}

function closeUpgradeBench() {
  upgradeBenchOpen = false;
  hideUpgradeBench(upgradeBenchUI);
  paused = false;
  if (!gameOver) canvas.requestPointerLock();
}

const inventoryCraftHooks = {
  getWeaponReserveCap,
  syncPlayerAmmoFields,
  onCrafted(recipeId) {
    if (recipeId === "molotov") {
      molotovCount = Math.min(molotovCount + 1, 8);
      messageEl.textContent = `Crafted molotov! (${molotovCount} ready — press G)`;
    } else if (recipeId === "land_mine") {
      landMineCount = Math.min(landMineCount + 1, 6);
      messageEl.textContent = `Crafted land mine! (${landMineCount} — press G to arm & place)`;
    } else if (recipeId === "spike_trap") {
      spikeTrapCount = Math.min(spikeTrapCount + 1, 8);
      messageEl.textContent = `Crafted spike trap! (${spikeTrapCount} — press G to place)`;
    } else if (recipeId === "ammo_pack") {
      messageEl.textContent = "Ammo pack crafted — reserve topped up.";
    }
    updateHUDMaterials();
  },
};

function openInventory() {
  if (gameState !== "PLAYING" || gameOver) return;
  paused = true;
  inventoryOpen = true;
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  showInventory(inventoryUI, materials, player, inventoryCraftHooks);
}

function closeInventory() {
  inventoryOpen = false;
  hideInventory(inventoryUI);
  paused = false;
  if (!gameOver) canvas.requestPointerLock();
}

function updateHUDMaterials() {
  if (extraMetaEl) {
    const m = materials;
    const materialStr = `S:${m.scrap} W:${m.wood} M:${m.metal} C:${m.cloth} Ch:${m.chemicals}`;
    const throwStr = `🔥${molotovCount} 💥${grenadeCount} ⛏${landMineCount} 🗡${spikeTrapCount}`;
    extraMetaEl.textContent = `${throwStr} | 📢 ${noiseMakerCount} | ${materialStr} | Score: ${score}${isCrouching ? " | [CROUCH]" : ""}${isADS ? " | [ADS]" : ""}${meleeCooldown > 0 ? " | [KNIFE CD]" : ""}${buildMode ? ` | [BUILD:${buildType.toUpperCase()}]` : ""}`;
  }
}

function updateVehicleHud() {
  if (!activeVehicle || activeVehicle.destroyed) {
    vehicleHudEl.style.display = "none";
    return;
  }
  vehicleHudEl.style.display = "block";
  const hp = Math.max(0, activeVehicle.hp || 0);
  const maxHp = activeVehicle.maxHp || 100;
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const fuel = Math.max(0, activeVehicle.fuel || 0);
  const maxFuel = activeVehicle.maxFuel || 100;
  const fuelPct = Math.max(0, Math.min(100, (fuel / maxFuel) * 100));
  vehicleHpLabelEl.textContent = `${activeVehicle.type.toUpperCase()} — HP ${Math.ceil(hp)}/${maxHp}  Fuel ${Math.ceil(fuelPct)}%`;
  vehicleHpFillEl.style.width = `${pct}%`;
  vehicleHpFillEl.style.background = pct > 60
    ? "linear-gradient(90deg,#1a6a1a,#3dba3d)"
    : pct > 30
      ? "linear-gradient(90deg,#7a5a00,#dba820)"
      : "linear-gradient(90deg,#8b1a1a,#d94040)";
}

// ─── Zombie hits barricades ──────────────────────────────────────────────────
function zombieHitBarricade(zombie, dt) {
  if (zombie.ignoreBarricades) return false;
  for (const b of barricades) {
    const d = zombie.mesh.position.distanceTo(b.mesh.position);
    if (d < 2.5) {
      b.hp -= zombie.damage * dt * 2;
      // Zombie stops to attack barricade
      return true;
    }
  }
  return false;
}

// ─── Shell Ejection ──────────────────────────────────────────────────────────
function ejectShell(weaponName) {
  if (!pointerLocked || gameOver) return;
  const isShotgun = weaponName === "Shotgun";
  const isPistol = weaponName === "Pistol";

  // Shell geometry
  const shellLen = isShotgun ? 0.055 : 0.032;
  const shellRad = isShotgun ? 0.011 : 0.007;
  const shellColor = isShotgun ? 0xc8a030 : 0xd4af37;

  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(shellRad, shellRad, shellLen, 6),
    new THREE.MeshStandardMaterial({ color: shellColor, metalness: 0.85, roughness: 0.3 }),
  );

  // Eject from right side of weapon, roughly at camera position
  const ejectPos = player.position.clone();
  const rightDir = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  ejectPos.addScaledVector(rightDir, 0.25);
  ejectPos.y += 1.4;

  shell.position.copy(ejectPos);
  shell.rotation.z = Math.PI / 2;
  shell.rotation.y = Math.random() * Math.PI;
  scene.add(shell);

  // Velocity: outward to the right, slightly up, and backward
  const velocity = rightDir.clone().multiplyScalar(1.5 + Math.random() * 1.5);
  velocity.y = 2.5 + Math.random() * 1.5;
  velocity.add(new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw)).multiplyScalar(0.8 + Math.random() * 0.5));

  const rotVel = new THREE.Vector3(
    (Math.random() - 0.5) * 15,
    (Math.random() - 0.5) * 15,
    (Math.random() - 0.5) * 20,
  );

  particles.push({
    mesh: shell,
    velocity,
    rotVel,
    life: 0.7 + Math.random() * 0.4,
    maxLife: 1.1,
    gravity: true,
    isExplosion: false,
    isShell: true,
    shellLen,
  });
}

// ─── Fire particles for explosions ───────────────────────────────────────────
function spawnFireParticles(position, count = 12) {
  for (let i = 0; i < count; i++) {
    const dir = new THREE.Vector3((Math.random() - 0.5) * 2, 0.5 + Math.random() * 2, (Math.random() - 0.5) * 2).normalize();
    const size = 0.04 + Math.random() * 0.12;
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(size, 4, 4),
      new THREE.MeshBasicMaterial({ color: Math.random() < 0.6 ? 0xff4400 : 0xffaa00, transparent: true, opacity: 0.9 }),
    );
    p.position.copy(position);
    p.position.y += 0.5 + Math.random() * 1.0;
    scene.add(p);
    particles.push({
      mesh: p, velocity: dir.multiplyScalar(1 + Math.random() * 4),
      life: 0.5 + Math.random() * 0.8, maxLife: 1.3,
      gravity: true, isExplosion: false, isFire: true,
    });
  }
}

// ─── Electric spark effect ───────────────────────────────────────────────────
function spawnSparks(position, count = 8) {
  for (let i = 0; i < count; i++) {
    const dir = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2).normalize();
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.02 + Math.random() * 0.03, 3, 3),
      new THREE.MeshBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 1 }),
    );
    p.position.copy(position);
    scene.add(p);
    particles.push({
      mesh: p, velocity: dir.multiplyScalar(3 + Math.random() * 8),
      life: 0.15 + Math.random() * 0.2, maxLife: 0.35,
      gravity: false, isExplosion: false, isSpark: true,
    });
  }
}

function updateWaveDirector(dt) {
  if (waveSpawnBudget <= 0 && zombies.length === 0 && zombieCorpses.length === 0 && nextWaveTimer <= 0) {
    nextWaveTimer = 5;
    topCenterAlertEl.textContent = `Wave ${wave} cleared!`;
    alertTimer = 2.5;
  }

  if (nextWaveTimer > 0) {
    nextWaveTimer -= dt;
    if (nextWaveTimer <= 0) {
      wave += 1;
      waveSpawnBudget = 18 + wave * 8;
      settings.maxZombies = Math.min(80, 24 + wave * 5);
      const isHordeWave = wave % 5 === 0;
      if (isHordeWave) {
        hordeNightActive = true;
        hordeNightTimer = 65;
        topCenterAlertEl.textContent = `⚠ WAVE ${wave} — HORDE NIGHT!`;
        alertTimer = 4.5;
        for (let i = 0; i < 14; i++) spawnZombieNearPlayer();
        messageEl.textContent = `HORDE NIGHT! Wave ${wave} — massive surge for 65 seconds!`;
        if (!bossAlive) setTimeout(() => spawnBoss(), 4000);
        if (grenadeCount < 2) { grenadeCount = 2; }
      } else {
        topCenterAlertEl.textContent = `Wave ${wave} incoming`;
        alertTimer = 3;
      }
    }
  }

  const desiredPressure = Math.min(settings.maxZombies, 8 + wave * 2);
  if (spawnTimer <= 0 && zombies.length < desiredPressure && waveSpawnBudget > 0) {
    spawnTimer = Math.max(0.22, 0.8 - wave * 0.03) + Math.random() * 0.35;
    spawnZombieNearPlayer();
    waveSpawnBudget -= 1;
  }
}

function updateDayNight() {
  const cycle = (gameTime % settings.dayDuration) / settings.dayDuration;
  const sunArc = Math.sin(cycle * Math.PI * 2);
  const daylight = THREE.MathUtils.smoothstep(sunArc, -0.15, 0.9);
  sun.intensity = THREE.MathUtils.lerp(0.45, 1.55, daylight);
  hemi.intensity = THREE.MathUtils.lerp(0.28, 0.85, daylight);
  sun.color.setHSL(
    THREE.MathUtils.lerp(0.08, 0.13, daylight),
    THREE.MathUtils.lerp(0.62, 0.38, daylight),
    THREE.MathUtils.lerp(0.5, 0.72, daylight),
  );
  const sh = activeMapConfig.skyHueShift;
  scene.background = new THREE.Color().setHSL(
    THREE.MathUtils.lerp(0.62, 0.56, daylight) + sh,
    THREE.MathUtils.lerp(0.3, 0.42, daylight),
    THREE.MathUtils.lerp(0.1, 0.62, daylight),
  );
  scene.fog.color.copy(scene.background).multiplyScalar(THREE.MathUtils.lerp(0.82, 0.93, daylight));
  const nightFogNear = hordeNightActive ? 28 : 45;
  const nightFogFar = hordeNightActive ? 120 : 190;
  scene.fog.near = THREE.MathUtils.lerp(nightFogNear, 85, daylight);
  scene.fog.far = THREE.MathUtils.lerp(nightFogFar, 300, daylight);
  skyVignetteEl.style.opacity = `${THREE.MathUtils.lerp(0.62, 0.28, daylight)}`;
  isNight = daylight < 0.35;
  if (nightIndicatorEl) {
    const showNight = isNight || hordeNightActive;
    nightIndicatorEl.textContent = hordeNightActive
      ? `🌙 HORDE NIGHT — ${Math.ceil(hordeNightTimer)}s remaining`
      : isNight ? "🌙 NIGHT — Zombies are faster" : "";
    nightIndicatorEl.style.opacity = showNight ? "1" : "0";
  }
}

function preventTreeCollision() {
  for (const tree of trees) {
    const dx = player.position.x - tree.x;
    const dz = player.position.z - tree.z;
    const d = Math.hypot(dx, dz);
    if (d < tree.radius) {
      const push = (tree.radius - d) / Math.max(0.0001, d);
      player.position.x += dx * push;
      player.position.z += dz * push;
    }
  }
}

function drawMinimap() {
  if (!minimapCtx) return;
  const size = minimapEl.width;
  const center = size / 2;
  const worldRadius = 90;

  minimapCtx.fillStyle = "#111713";
  minimapCtx.fillRect(0, 0, size, size);
  minimapCtx.strokeStyle = "rgba(198,220,172,0.6)";
  minimapCtx.lineWidth = 2;
  minimapCtx.strokeRect(1, 1, size - 2, size - 2);
  minimapCtx.fillStyle = activeMapConfig.minimapFill;
  minimapCtx.beginPath();
  minimapCtx.arc(center, center, center - 8, 0, Math.PI * 2);
  minimapCtx.fill();

  minimapCtx.save();
  minimapCtx.translate(center, center);
  minimapCtx.rotate(-player.yaw);

  minimapCtx.fillStyle = "#f7edb0";
  minimapCtx.beginPath();
  minimapCtx.moveTo(0, -8);
  minimapCtx.lineTo(5, 6);
  minimapCtx.lineTo(-5, 6);
  minimapCtx.closePath();
  minimapCtx.fill();

  for (const zombie of zombies) {
    const relX = zombie.mesh.position.x - player.position.x;
    const relZ = zombie.mesh.position.z - player.position.z;
    const rx = (relX / worldRadius) * (center - 12);
    const rz = (relZ / worldRadius) * (center - 12);
    if (Math.hypot(rx, rz) < center - 10) {
      minimapCtx.fillStyle = "#c33d3d";
      minimapCtx.beginPath();
      minimapCtx.arc(rx, rz, 3, 0, Math.PI * 2);
      minimapCtx.fill();
    }
  }

  for (const mate of teammates) {
    const relX = mate.mesh.position.x - player.position.x;
    const relZ = mate.mesh.position.z - player.position.z;
    const rx = (relX / worldRadius) * (center - 12);
    const rz = (relZ / worldRadius) * (center - 12);
    if (Math.hypot(rx, rz) < center - 10) {
      minimapCtx.fillStyle = "#6bc7ff";
      minimapCtx.beginPath();
      minimapCtx.arc(rx, rz, 2.8, 0, Math.PI * 2);
      minimapCtx.fill();
    }
  }

  // Supply drops — yellow star
  for (const drop of supplyDrops) {
    const relX = drop.mesh.position.x - player.position.x;
    const relZ = drop.mesh.position.z - player.position.z;
    const rx = (relX / worldRadius) * (center - 12);
    const rz = (relZ / worldRadius) * (center - 12);
    if (Math.hypot(rx, rz) < center - 10) {
      minimapCtx.fillStyle = drop.dropType === "weapon_crate" ? "#66aaff" : "#ffdd00";
      minimapCtx.beginPath();
      minimapCtx.arc(rx, rz, 4, 0, Math.PI * 2);
      minimapCtx.fill();
      minimapCtx.strokeStyle = "#ffffff";
      minimapCtx.lineWidth = 1;
      minimapCtx.stroke();
    }
  }

  // Stranded survivor — green diamond
  if (isSurvivorAlive(eventDirector) && eventDirector.survivorPosition) {
    const sp = eventDirector.survivorPosition;
    const relX = sp.x - player.position.x;
    const relZ = sp.z - player.position.z;
    const rx = (relX / worldRadius) * (center - 12);
    const rz = (relZ / worldRadius) * (center - 12);
    if (Math.hypot(rx, rz) < center - 10) {
      minimapCtx.save();
      minimapCtx.translate(rx, rz);
      minimapCtx.rotate(Math.PI / 4);
      minimapCtx.fillStyle = "#44ff88";
      minimapCtx.fillRect(-3.5, -3.5, 7, 7);
      minimapCtx.restore();
    }
  }

  // Zombie corpses about to revive — orange dot (only when < 6s remaining)
  for (const corpse of zombieCorpses) {
    if (corpse.reviveTimer > 6) continue;
    const relX = corpse.mesh.position.x - player.position.x;
    const relZ = corpse.mesh.position.z - player.position.z;
    const rx = (relX / worldRadius) * (center - 12);
    const rz = (relZ / worldRadius) * (center - 12);
    if (Math.hypot(rx, rz) < center - 10) {
      const pulse = 0.5 + 0.5 * Math.sin(gameTime * 6);
      minimapCtx.fillStyle = `rgba(255,${Math.round(80 + 80 * pulse)},0,${0.6 + 0.4 * pulse})`;
      minimapCtx.beginPath();
      minimapCtx.arc(rx, rz, 2.5, 0, Math.PI * 2);
      minimapCtx.fill();
    }
  }

  minimapCtx.restore();
}

function updateHud(dt) {
  const maxHp = getPlayerMaxHealth();
  healthFillEl.style.width = `${Math.max(0, Math.min(100, (player.hp / maxHp) * 100))}%`;
  staminaFillEl.style.width = `${player.stamina}%`;
  syncPlayerAmmoFields(player);
  const activeWpn = getActiveWeapon(player);
  const ammoLabel = activeWpn.pellets ? `${player.ammo}/${player.reserveAmmo} shells` : `${player.ammo}/${player.reserveAmmo}`;
  const wpnNum = `[${player.activeWeapon + 1}]`;
  const wpnUpg = activeWpn.upgrades && Object.keys(activeWpn.upgrades).length > 0 ? " +" : "";
  statsMetaEl.textContent = `Map: ${activeMapConfig.name} | ${activeWpn.name}${wpnUpg} ${wpnNum} | ${ammoLabel} | Kills: ${player.kills} | Zombies: ${zombies.length} | Team: ${teammates.length + 1}`;
  if (extraMetaEl) {
    const throwStr = `🔥${molotovCount} 💥${grenadeCount} ⛏${landMineCount} 🗡${spikeTrapCount}`;
    extraMetaEl.textContent = `${throwStr} | 📢 ${noiseMakerCount} | Score: ${score}${isCrouching ? " | [CROUCH]" : ""}${isADS ? " | [ADS]" : ""}${meleeCooldown > 0 ? " | [KNIFE CD]" : ""}`;
  }
  updateHUDMaterials();
  if (skillMetaEl) {
    const activeSkills = Object.values(skills)
      .filter((s) => s.level > 0)
      .map((s) => `${s.name} ${s.level}`)
      .join(", ");
    const xpTarget = 120 + skillPoints * 40;
    skillMetaEl.textContent = `SP:${skillPoints} XP:${Math.floor(skillXp)}/${xpTarget} | Upgrades: Shift+1..5${activeSkills ? ` | ${activeSkills}` : ""}`;
  }
  const elapsed = Math.floor(gameTime);
  const mm = `${Math.floor(elapsed / 60)}`.padStart(2, "0");
  const ss = `${elapsed % 60}`.padStart(2, "0");
  worldStatsEl.textContent = `Wave ${wave} | ${mm}:${ss}`;
  drawMinimap();

  player.damageFlash = Math.max(0, player.damageFlash - dt * 1.5);
  damageFlashEl.style.opacity = `${player.damageFlash * 0.35}`;
  crosshairFireImpulse = Math.max(0, crosshairFireImpulse - dt * 2.6);
  if (crosshairEl) {
    const moveRatio = THREE.MathUtils.clamp(player.moveVelocity.length() / settings.sprintSpeed, 0, 1);
    const airbornePx = player.isGrounded ? 0 : 8;
    const adsCollapse = isADS ? 0.18 : 1;
    const targetSpread = (2 + moveRatio * 9 + crosshairFireImpulse * 14 + airbornePx) * adsCollapse;
    crosshairSpread += (targetSpread - crosshairSpread) * Math.min(1, dt * 18);
    const crosshairScale = 1 + crosshairSpread / 22;
    const scopeLikeWeapon = activeWpn.adsRequired && isADS;
    crosshairEl.style.transform = `translate(-50%, -50%) scale(${crosshairScale.toFixed(3)})`;
    crosshairEl.style.opacity = scopeLikeWeapon ? "0.08" : (isADS ? "0.35" : "1");
  }
  hitMarkerTimer = Math.max(0, hitMarkerTimer - dt);
  hitMarkerPulse = Math.max(0, hitMarkerPulse - dt * 8.5);
  hitMarkerHeadshotTimer = Math.max(0, hitMarkerHeadshotTimer - dt);
  hitMarkerEl.style.opacity = `${hitMarkerTimer > 0 ? 1 : 0}`;
  hitMarkerEl.style.transform = `translate(-50%, -50%) scale(${1 + hitMarkerPulse * 0.45})`;
  hitMarkerEl.style.setProperty(
    "--hit-marker-color",
    hitMarkerHeadshotTimer > 0 ? "rgba(255, 116, 116, 0.98)" : "rgba(255, 235, 186, 0.95)",
  );
  hitMarkerEl.style.filter =
    hitMarkerHeadshotTimer > 0
      ? "drop-shadow(0 0 16px rgba(255, 90, 90, 0.58))"
      : "drop-shadow(0 0 10px rgba(255, 235, 186, 0.28))";
  alertTimer = Math.max(0, alertTimer - dt);
  topCenterAlertEl.style.opacity = `${alertTimer > 0 ? 1 : 0}`;
  killStreakTimer = Math.max(0, killStreakTimer - dt);
  if (killStreakTimer <= 0 && killStreak > 0) killStreak = 0;
  if (killStreakEl) {
    killStreakEl.textContent = killStreak >= 3 ? `🔥 ×${killStreak} streak!` : "";
    killStreakEl.style.opacity = killStreak >= 3 ? "1" : "0";
  }
  // Reload bar
  if (player.reloadTimer > 0) {
    const weapon = getActiveWeapon(player);
    const reloadTotal = (weapon.reloadTime || 1.25) * (1 - (skills?.reloadSpeed?.value || 0));
    const progress = Math.max(0, Math.min(1, 1 - player.reloadTimer / reloadTotal));
    reloadBarFillEl.style.width = `${progress * 100}%`;
    reloadBarEl.style.opacity = "1";
  } else {
    reloadBarEl.style.opacity = "0";
  }
  updateKillFeed(dt);
  renderWeaponSlotsHUD();
  renderMissionListHUD();
}

// ─── Mission List HUD ───────────────────────────────────────────────────────
function renderMissionListHUD() {
  if (!missionListEl || !missionGenerator || !missionGenerator.activeMissions) return;
  missionListEl.innerHTML = "";
  if (missionGenerator.activeMissions.length === 0) return;
  const title = document.createElement("div");
  title.className = "mission-list-title";
  title.textContent = `★ Missions (${missionGenerator.activeMissions.length})`;
  missionListEl.appendChild(title);
  for (const m of missionGenerator.activeMissions) {
    const div = document.createElement("div");
    div.className = "mission-item";
    const status = formatMissionStatus(m);
    const timerStr = m.timer && m.timeLimit ? ` | ${Math.max(0, Math.ceil(m.timer))}s` : "";
    div.textContent = `${m.title}${status ? ` — ${status}` : ""}${timerStr}`;
    missionListEl.appendChild(div);
  }
}

// ─── Weapon Slots HUD ─────────────────────────────────────────────────────
function renderWeaponSlotsHUD() {
  if (!weaponSlotsEl) return;
  weaponSlotsEl.innerHTML = "";
  const slotMap = { 0: "1", 1: "2", 2: "3", 3: "4", 4: "5", 5: "6", 6: "7" };
  for (let i = 0; i < player.weapons.length; i++) {
    const w = player.weapons[i];
    const isActive = i === player.activeWeapon;
    const div = document.createElement("div");
    div.className = "weapon-slot" + (isActive ? " is-active" : "");
    div.innerHTML = `<span class="weapon-slot-key">${slotMap[i] || i + 1}</span><span class="weapon-slot-name">${w.name}</span><span class="weapon-slot-ammo">${w.ammo}/${w.reserve}</span>`;
    weaponSlotsEl.appendChild(div);
  }
}

// ─── Enemy Health Bars ────────────────────────────────────────────────────────
const _hpProjVec = new THREE.Vector3();
function drawEnemyHealthBars() {
  hpBarCtx.clearRect(0, 0, hpBarCanvas.width, hpBarCanvas.height);
  if (gameState !== "PLAYING" || gameOver) return;
  const w = hpBarCanvas.width;
  const h = hpBarCanvas.height;
  const barW = 42;
  const barH = 5;
  for (const zombie of zombies) {
    const showBar = zombie.isSpecial || zombie.isBoss || zombie.type === "juggernaut" || zombie.type === "boomer" || zombie.type === "screamer";
    if (!showBar) continue;
    // Only draw if within visual range
    const dist = zombie.mesh.position.distanceTo(player.position);
    if (dist > 40) continue;
    const headY = zombie.isBoss ? 2.55 : 2.55;
    _hpProjVec.set(zombie.mesh.position.x, zombie.mesh.position.y + headY, zombie.mesh.position.z);
    _hpProjVec.project(camera);
    if (_hpProjVec.z > 1 || _hpProjVec.z < -1) continue;
    const sx = (_hpProjVec.x * 0.5 + 0.5) * w;
    const sy = (-_hpProjVec.y * 0.5 + 0.5) * h;
    if (sx < -barW || sx > w + barW || sy < 0 || sy > h) continue;

    const pct = Math.max(0, zombie.hp / zombie.maxHp);
    const bx = sx - barW / 2;
    const by = sy - barH - 4;

    // Background
    hpBarCtx.fillStyle = "rgba(0,0,0,0.6)";
    hpBarCtx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    // HP fill colour
    const r = Math.round(255 * (1 - pct));
    const g = Math.round(200 * pct);
    hpBarCtx.fillStyle = zombie.isBoss ? `rgb(255,${g},0)` : `rgb(${r},${g},0)`;
    hpBarCtx.fillRect(bx, by, barW * pct, barH);
    // Border
    hpBarCtx.strokeStyle = "rgba(255,255,255,0.35)";
    hpBarCtx.lineWidth = 0.5;
    hpBarCtx.strokeRect(bx - 0.5, by - 0.5, barW + 1, barH + 1);
    // Label for boss
    if (zombie.isBoss) {
      hpBarCtx.fillStyle = "rgba(255,200,80,0.9)";
      hpBarCtx.font = "bold 9px sans-serif";
      hpBarCtx.textAlign = "center";
      hpBarCtx.fillText("BOSS", sx, by - 3);
    }
  }

  // Barricade health bars — only show when damaged
  const bBarW = 38;
  const bBarH = 4;
  for (const barricade of barricades) {
    if (barricade.hp >= barricade.maxHp) continue;
    const dist = barricade.mesh.position.distanceTo(player.position);
    if (dist > 25) continue;
    _hpProjVec.set(barricade.mesh.position.x, barricade.mesh.position.y + 2.2, barricade.mesh.position.z);
    _hpProjVec.project(camera);
    if (_hpProjVec.z > 1) continue;
    const sx = (_hpProjVec.x * 0.5 + 0.5) * w;
    const sy = (-_hpProjVec.y * 0.5 + 0.5) * h;
    if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
    const pct = Math.max(0, barricade.hp / barricade.maxHp);
    const bx = sx - bBarW / 2;
    const by = sy - bBarH - 2;
    hpBarCtx.fillStyle = "rgba(0,0,0,0.55)";
    hpBarCtx.fillRect(bx - 1, by - 1, bBarW + 2, bBarH + 2);
    hpBarCtx.fillStyle = barricade.type === "metal"
      ? `rgba(${Math.round(80 + 175 * (1 - pct))},${Math.round(180 * pct)},200,0.9)`
      : `rgba(${Math.round(200 + 55 * (1 - pct))},${Math.round(160 * pct)},40,0.9)`;
    hpBarCtx.fillRect(bx, by, bBarW * pct, bBarH);
    hpBarCtx.strokeStyle = "rgba(255,255,255,0.25)";
    hpBarCtx.lineWidth = 0.5;
    hpBarCtx.strokeRect(bx - 0.5, by - 0.5, bBarW + 1, bBarH + 1);
  }
}

// ─── Floating Damage Numbers ──────────────────────────────────────────────────
const _projVec = new THREE.Vector3();
function spawnFloatingDamage(worldPosition, amount, isHeadshot = false) {
  if (!amount || amount <= 0) return;
  const el = document.createElement("div");
  const rounded = Math.round(amount);
  el.textContent = isHeadshot ? `${rounded}!` : `${rounded}`;
  el.style.cssText = [
    "position:absolute",
    "font-family:'Segoe UI',sans-serif",
    `font-size:${isHeadshot ? "16px" : "13px"}`,
    `font-weight:${isHeadshot ? "900" : "700"}`,
    `color:${isHeadshot ? "#ff4444" : "#ffdd88"}`,
    "text-shadow:0 1px 3px rgba(0,0,0,0.9)",
    "pointer-events:none",
    "user-select:none",
    "white-space:nowrap",
    "will-change:transform,opacity",
  ].join(";");
  damageNumContainer.appendChild(el);

  // Project world position to screen
  _projVec.copy(worldPosition).project(camera);
  const sx = (_projVec.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-_projVec.y * 0.5 + 0.5) * window.innerHeight;

  const entry = {
    el,
    x: sx + (Math.random() - 0.5) * 18,
    y: sy,
    vy: -52,
    life: 0,
    maxLife: isHeadshot ? 0.9 : 0.7,
    worldPos: worldPosition.clone(),
  };
  floatingDamageNums.push(entry);
}

function updateFloatingDamageNums(dt) {
  for (let i = floatingDamageNums.length - 1; i >= 0; i--) {
    const n = floatingDamageNums[i];
    n.life += dt;
    if (n.life >= n.maxLife) {
      n.el.remove();
      floatingDamageNums.splice(i, 1);
      continue;
    }
    // Re-project to follow the world position (handles camera movement)
    _projVec.copy(n.worldPos).project(camera);
    if (_projVec.z > 1) { n.el.style.opacity = "0"; continue; }
    const sx = (_projVec.x * 0.5 + 0.5) * window.innerWidth;
    const sy = (-_projVec.y * 0.5 + 0.5) * window.innerHeight;
    const t = n.life / n.maxLife;
    const offsetY = n.vy * n.life;
    n.el.style.transform = `translate(${sx - 16}px, ${sy + offsetY - 20}px)`;
    n.el.style.opacity = `${1 - t * t}`;
  }
}

// ─── Blood Particles ─────────────────────────────────────────────────────────
function spawnBloodParticles(position, count = 6) {
  for (let i = 0; i < count; i++) {
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      0.2 + Math.random() * 1.8,
      (Math.random() - 0.5) * 2,
    ).normalize();
    const size = 0.022 + Math.random() * 0.038;
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(size, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0x8b0000, transparent: true, opacity: 1 }),
    );
    p.position.copy(position);
    p.position.y += 1.3 + Math.random() * 0.5;
    scene.add(p);
    particles.push({
      mesh: p,
      velocity: dir.multiplyScalar(2.5 + Math.random() * 6),
      life: 0.18 + Math.random() * 0.28,
      maxLife: 0.46,
      gravity: true,
      isExplosion: false,
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      disposeOwnedObject3D(p.mesh);
      particles.splice(i, 1);
      continue;
    }
    const t = p.life / p.maxLife;
    if (p.isExplosion) {
      const scale = (1 - t) * p.targetScale + 0.08;
      p.mesh.scale.setScalar(Math.max(0.01, scale));
      p.mesh.material.opacity = t * 0.88;
    } else if (p.isFire) {
      if (p.gravity) p.velocity.y += settings.gravity * 0.15 * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      const flicker = 0.5 + Math.sin(gameTime * 15 + i) * 0.3;
      p.mesh.material.opacity = t * flicker;
      p.mesh.scale.setScalar(0.5 + (1 - t) * 1.5);
    } else if (p.isSpark) {
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.material.opacity = t;
      p.mesh.scale.setScalar(0.8 + (1 - t) * 0.5);
    } else if (p.isShell) {
      if (p.gravity) p.velocity.y += settings.gravity * 0.55 * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      // Rotate shell as it flies
      if (p.rotVel) {
        p.mesh.rotation.x += p.rotVel.x * dt;
        p.mesh.rotation.y += p.rotVel.y * dt;
        p.mesh.rotation.z += p.rotVel.z * dt;
      }
      // Bounce off ground
      const groundY = terrainHeight(p.mesh.position.x, p.mesh.position.z);
      const sl = p.shellLen || 0.04;
      if (p.mesh.position.y < groundY + sl) {
        p.mesh.position.y = groundY + sl;
        p.velocity.y = Math.abs(p.velocity.y) * 0.35;
        p.velocity.x *= 0.7;
        p.velocity.z *= 0.7;
      }
      p.mesh.material.opacity = Math.min(1, t * 2); // Stay visible until near end
    } else {
      if (p.gravity) p.velocity.y += settings.gravity * 0.25 * dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.mesh.material.opacity = t;
    }
  }
}

// ─── Explosions ───────────────────────────────────────────────────────────────
function createExplosion(position, radius, damage) {
  addScreenShake(Math.min(0.75, 0.24 + radius * 0.06));
  playSfx("explosion", 1);
  spawnFireParticles(position, 18);
  spawnSparks(position, 12);
  for (let i = 0; i < 30; i++) {
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 2.8,
      (Math.random() - 0.5) * 2,
    ).normalize();
    const p = new THREE.Mesh(
      new THREE.SphereGeometry(0.05 + Math.random() * 0.1, 4, 4),
      new THREE.MeshBasicMaterial({ color: Math.random() < 0.5 ? 0xff8800 : 0xff3300, transparent: true, opacity: 1 }),
    );
    p.position.copy(position);
    scene.add(p);
    particles.push({
      mesh: p,
      velocity: dir.multiplyScalar(6 + Math.random() * 14),
      life: 0.3 + Math.random() * 0.4,
      maxLife: 0.7,
      gravity: true,
      isExplosion: false,
    });
  }
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.92 }),
  );
  flash.position.copy(position);
  scene.add(flash);
  particles.push({
    mesh: flash,
    velocity: new THREE.Vector3(),
    life: 0.3,
    maxLife: 0.3,
    gravity: false,
    isExplosion: true,
    targetScale: radius * 1.9,
  });
  for (let i = zombies.length - 1; i >= 0; i--) {
    const dSq = position.distanceToSquared(zombies[i].mesh.position);
    if (dSq < radius * radius) {
      const falloff = Math.max(0.08, 1 - Math.sqrt(dSq) / radius);
      applyZombieDamage(i, damage * falloff);
    }
  }
  if (gameState === "PLAYING" && !gameOver) {
    const pDist = position.distanceTo(player.position);
    if (pDist < radius) {
      const falloff = 1 - pDist / radius;
      player.hp = Math.max(0, player.hp - damage * falloff * 0.4);
      player.damageFlash = 0.9;
      triggerHitStop(0.08);
      if (player.hp <= 0) {
        player.hp = 0;
        gameOver = true;
        messageEl.textContent = "Killed by explosion.";
        if (document.pointerLockElement === canvas) document.exitPointerLock();
        setMenuMode("death");
      }
    }
  }
}

// ─── Grenades / crafted throwables ────────────────────────────────────────────
function getThrowDirection() {
  return new THREE.Vector3(
    -Math.sin(player.yaw) * Math.cos(player.pitch),
    Math.sin(player.pitch) + 0.3,
    -Math.cos(player.yaw) * Math.cos(player.pitch),
  ).normalize();
}

function throwGrenade() {
  if (!pointerLocked || gameOver || grenadeCount <= 0) return;
  grenadeCount -= 1;
  playSfx("grenade_throw", 1);
  messageEl.textContent = `Grenade thrown! (${grenadeCount} left)`;
  const grenadeMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0x2e3820, roughness: 0.65, metalness: 0.3 }),
  );
  grenadeMesh.castShadow = true;
  const pin = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.013, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0xb0a020, metalness: 0.85 }),
  );
  pin.rotation.x = Math.PI / 2;
  pin.position.y = 0.1;
  grenadeMesh.add(pin);
  const origin = player.position.clone();
  origin.y -= 0.15;
  const direction = getThrowDirection();
  grenadeMesh.position.copy(origin);
  scene.add(grenadeMesh);
  grenades.push({ mesh: grenadeMesh, velocity: direction.clone().multiplyScalar(16), fuse: 2.4 });
  updateHUDMaterials();
}

function throwMolotov() {
  if (!pointerLocked || gameOver || molotovCount <= 0) return;
  molotovCount -= 1;
  playSfx("grenade_throw", 0.95);
  messageEl.textContent = `Molotov thrown! (${molotovCount} left)`;
  const bottle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.055, 0.22, 8),
    new THREE.MeshStandardMaterial({ color: 0x448822, roughness: 0.35, metalness: 0.1 }),
  );
  bottle.rotation.z = Math.PI / 2;
  bottle.castShadow = true;
  const wick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6),
    new THREE.MeshStandardMaterial({ color: 0x221100, roughness: 0.9 }),
  );
  wick.position.set(0, 0.14, 0);
  bottle.add(wick);
  const origin = player.position.clone();
  origin.y -= 0.12;
  bottle.position.copy(origin);
  const direction = getThrowDirection();
  scene.add(bottle);
  molotovProjectiles.push({ mesh: bottle, velocity: direction.clone().multiplyScalar(14), fuse: 3.2 });
  updateHUDMaterials();
}

function startMolotovFireAt(pos) {
  const y = terrainHeight(pos.x, pos.z) + 0.07;
  const fireMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.35, 0.04, 14),
    new THREE.MeshBasicMaterial({ color: 0xff7722, transparent: true, opacity: 0.62 }),
  );
  fireMesh.rotation.x = -Math.PI / 2;
  fireMesh.position.set(pos.x, y, pos.z);
  scene.add(fireMesh);
  molotovFires.push({
    mesh: fireMesh,
    life: 6,
    maxLife: 6,
    radius: 2.35,
    damagePerSecond: 42,
  });
  playSpatialSfx("explosion", new THREE.Vector3(pos.x, y, pos.z), 0.35);
}

function updateMolotovProjectiles(dt) {
  for (let i = molotovProjectiles.length - 1; i >= 0; i--) {
    const m = molotovProjectiles[i];
    m.fuse -= dt;
    m.velocity.y += settings.gravity * 0.5 * dt;
    m.mesh.position.addScaledVector(m.velocity, dt);
    m.mesh.rotation.x += dt * 8;
    const floor = terrainHeight(m.mesh.position.x, m.mesh.position.z) + 0.08;
    let hit = m.fuse <= 0;
    if (m.mesh.position.y < floor) {
      m.mesh.position.y = floor;
      m.velocity.y = Math.abs(m.velocity.y) * 0.22;
      m.velocity.x *= 0.55;
      m.velocity.z *= 0.55;
      hit = true;
    }
    if (hit) {
      const pos = m.mesh.position.clone();
      scene.remove(m.mesh);
      disposeOwnedObject3D(m.mesh);
      molotovProjectiles.splice(i, 1);
      startMolotovFireAt(pos);
    }
  }
}

function updateMolotovFires(dt) {
  for (let fi = molotovFires.length - 1; fi >= 0; fi--) {
    const f = molotovFires[fi];
    f.life -= dt;
    const t = Math.max(0, f.life / f.maxLife);
    f.mesh.material.opacity = 0.2 + t * 0.5;
    f.mesh.scale.setScalar(0.88 + (1 - t) * 0.12);
    if (f.life <= 0) {
      scene.remove(f.mesh);
      f.mesh.geometry.dispose();
      f.mesh.material.dispose();
      molotovFires.splice(fi, 1);
      continue;
    }
    if (gameState === "PLAYING" && !gameOver) {
      const fp = f.mesh.position;
      const d = fp.distanceTo(player.position);
      if (d < f.radius) {
        player.hp = Math.max(0, player.hp - f.damagePerSecond * dt * 0.55);
        player.damageFlash = 0.45;
        if (player.hp <= 0 && !gameOver) {
          player.hp = 0;
          gameOver = true;
          messageEl.textContent = "Burned by fire...";
          if (document.pointerLockElement === canvas) document.exitPointerLock();
          setMenuMode("death");
        }
      }
    }
    for (let zi = zombies.length - 1; zi >= 0; zi--) {
      const zp = zombies[zi].mesh.position;
      if (fp.distanceToSquared(zp) < f.radius * f.radius) {
        applyZombieDamage(zi, f.damagePerSecond * dt * 0.9);
      }
    }
  }
}

function placeLandMine() {
  if (!pointerLocked || gameOver || landMineCount <= 0) return;
  landMineCount -= 1;
  playSfx("ui_click", 1.1);
  const dir = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const pos = player.position.clone().addScaledVector(dir, 2.2);
  pos.y = terrainHeight(pos.x, pos.z);
  const mine = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 0.08, 10),
    new THREE.MeshStandardMaterial({ color: 0x3a3a2a, roughness: 0.75, metalness: 0.35 }),
  );
  mine.position.set(pos.x, pos.y + 0.05, pos.z);
  mine.rotation.y = player.yaw;
  mine.castShadow = true;
  scene.add(mine);
  landMines.push({ mesh: mine, triggerRadius: 2.8, armed: true });
  messageEl.textContent = `Land mine armed! (${landMineCount} left)`;
  updateHUDMaterials();
}

function updateLandMines() {
  for (let mi = landMines.length - 1; mi >= 0; mi--) {
    const mine = landMines[mi];
    if (!mine.armed) continue;
    for (const z of zombies) {
      if (z.mesh.position.distanceToSquared(mine.mesh.position) < mine.triggerRadius * mine.triggerRadius) {
        const pos = mine.mesh.position.clone();
        scene.remove(mine.mesh);
        mine.mesh.geometry.dispose();
        mine.mesh.material.dispose();
        landMines.splice(mi, 1);
        createExplosion(pos, 6.2, 78);
        playSpatialSfx("explosion", pos, 0.85);
        topCenterAlertEl.textContent = "💥 Land mine!";
        alertTimer = 1.8;
        break;
      }
    }
  }
}

function updateSpikeTraps(dt) {
  for (const trap of spikeTraps) {
    for (let zi = zombies.length - 1; zi >= 0; zi--) {
      const z = zombies[zi];
      const dx = z.mesh.position.x - trap.mesh.position.x;
      const dz = z.mesh.position.z - trap.mesh.position.z;
      if (dx * dx + dz * dz < trap.radius * trap.radius) {
        applyZombieDamage(zi, trap.dps * dt);
      }
    }
  }
}

function placeSpikeTrap() {
  if (!pointerLocked || gameOver || spikeTrapCount <= 0) return;
  spikeTrapCount -= 1;
  playSfx("ui_click", 1.05);
  const dir = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const pos = player.position.clone().addScaledVector(dir, 2.0);
  pos.y = terrainHeight(pos.x, pos.z);
  const group = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.9, 1.0, 0.06, 12),
    new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.88 }),
  );
  base.position.y = 0.04;
  base.castShadow = true;
  group.add(base);
  const spikeMat = new THREE.MeshStandardMaterial({ color: 0x8899aa, metalness: 0.6, roughness: 0.45 });
  for (let k = 0; k < 9; k++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.28, 6), spikeMat);
    const a = (k / 9) * Math.PI * 2;
    spike.position.set(Math.cos(a) * 0.55, 0.22, Math.sin(a) * 0.55);
    group.add(spike);
  }
  group.position.set(pos.x, pos.y, pos.z);
  group.rotation.y = player.yaw;
  scene.add(group);
  spikeTraps.push({ mesh: group, radius: 1.15, dps: 52 });
  messageEl.textContent = `Spike trap placed! (${spikeTrapCount} left)`;
  updateHUDMaterials();
}

function useThrowableOrTrap() {
  if (!pointerLocked || gameOver) return;
  if (molotovCount > 0) {
    throwMolotov();
    return;
  }
  if (landMineCount > 0) {
    placeLandMine();
    return;
  }
  if (spikeTrapCount > 0) {
    placeSpikeTrap();
    return;
  }
  throwGrenade();
}

function updateGrenades(dt) {
  for (let i = grenades.length - 1; i >= 0; i--) {
    const g = grenades[i];
    g.fuse -= dt;
    g.velocity.y += settings.gravity * 0.48 * dt;
    g.mesh.position.addScaledVector(g.velocity, dt);
    g.mesh.rotation.x += dt * 10;
    g.mesh.rotation.z += dt * 7;
    const floor = terrainHeight(g.mesh.position.x, g.mesh.position.z) + 0.1;
    if (g.mesh.position.y < floor) {
      g.mesh.position.y = floor;
      g.velocity.y = Math.abs(g.velocity.y) * 0.28;
      g.velocity.x *= 0.52;
      g.velocity.z *= 0.52;
    }
    if (g.fuse <= 0) {
      const pos = g.mesh.position.clone();
      scene.remove(g.mesh);
      disposeOwnedObject3D(g.mesh);
      grenades.splice(i, 1);
      createExplosion(pos, 8.5, 95);
    }
  }
}

// ─── Arrow (Crossbow) ────────────────────────────────────────────────────────
function spawnArrow(origin, direction, damage) {
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.55, 6),
    new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.85, metalness: 0.05 }),
  );
  shaft.rotation.x = Math.PI / 2;
  const head = new THREE.Mesh(
    new THREE.ConeGeometry(0.022, 0.1, 6),
    new THREE.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.3, metalness: 0.9 }),
  );
  head.rotation.x = -Math.PI / 2;
  head.position.set(0, 0, -0.32);
  const flights = new THREE.Mesh(
    new THREE.BoxGeometry(0.001, 0.07, 0.12),
    new THREE.MeshBasicMaterial({ color: 0xcccccc }),
  );
  flights.position.set(0, 0, 0.26);
  group.add(shaft, head, flights);
  group.position.copy(origin);
  const vel = direction.clone().normalize();
  group.lookAt(origin.clone().add(vel));
  scene.add(group);
  arrows.push({
    mesh: group,
    velocity: vel.clone().multiplyScalar(88),
    damage,
    life: 1.8,
    stuck: false,
    stuckTimer: 0,
  });
}

function updateArrows(dt) {
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    if (a.stuck) {
      a.stuckTimer -= dt;
      if (a.stuckTimer <= 0) {
        scene.remove(a.mesh);
        a.mesh.traverse(o => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } });
        arrows.splice(i, 1);
      }
      continue;
    }
    a.life -= dt;
    a.velocity.y += settings.gravity * 0.18 * dt;
    a.mesh.position.addScaledVector(a.velocity, dt);
    const dir = a.velocity.clone().normalize();
    a.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    if (a.life <= 0) {
      scene.remove(a.mesh);
      a.mesh.traverse(o => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } });
      arrows.splice(i, 1);
      continue;
    }
    let hit = false;
    for (let zi = zombies.length - 1; zi >= 0; zi--) {
      const z = zombies[zi];
      if (a.mesh.position.distanceTo(z.mesh.position) < 0.9) {
        applyZombieDamage(zi, a.damage, false);
        triggerHitMarker(false);
        messageEl.textContent = `Arrow hit! ${a.damage.toFixed(0)} dmg`;
        a.mesh.position.copy(z.mesh.position).add(new THREE.Vector3(0, 1.2, 0));
        a.stuck = true;
        a.stuckTimer = 4;
        hit = true;
        break;
      }
    }
    if (!hit) {
      const floor = terrainHeight(a.mesh.position.x, a.mesh.position.z) + 0.06;
      if (a.mesh.position.y < floor) {
        a.mesh.position.y = floor;
        a.stuck = true;
        a.stuckTimer = 6;
      }
    }
  }
}

// ─── Rocket ──────────────────────────────────────────────────────────────────
function spawnRocket(origin, direction, damage) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.04, 0.42, 10),
    new THREE.MeshStandardMaterial({ color: 0x4a4a55, roughness: 0.5, metalness: 0.8 }),
  );
  body.rotation.x = Math.PI / 2;
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.055, 0.18, 10),
    new THREE.MeshStandardMaterial({ color: 0x88cc44, roughness: 0.4, metalness: 0.6 }),
  );
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0, -0.3);
  const finMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6, metalness: 0.7 });
  for (let f = 0; f < 4; f++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.002, 0.09, 0.1), finMat);
    fin.position.set(
      Math.sin(f * Math.PI / 2) * 0.06,
      Math.cos(f * Math.PI / 2) * 0.06,
      0.22,
    );
    group.add(fin);
  }
  group.add(body, nose);
  group.position.copy(origin);
  const vel = direction.clone().normalize();
  group.lookAt(origin.clone().add(vel));
  scene.add(group);
  rockets.push({
    mesh: group,
    velocity: vel.clone().multiplyScalar(52),
    damage,
    life: 4.5,
  });
}

const _rocketPos = new THREE.Vector3();
function updateRockets(dt) {
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.life -= dt;
    r.mesh.position.addScaledVector(r.velocity, dt);
    const dir = r.velocity.clone().normalize();
    r.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

    // Exhaust trail particle
    if (Math.random() < 0.6) {
      const trailP = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.7 }),
      );
      trailP.position.copy(r.mesh.position).addScaledVector(dir, -0.3);
      scene.add(trailP);
      particles.push({ mesh: trailP, velocity: new THREE.Vector3((Math.random()-0.5)*1.5, Math.random()*0.8, (Math.random()-0.5)*1.5), life: 0.25, maxLife: 0.25, gravity: false, isExplosion: false });
    }

    _rocketPos.copy(r.mesh.position);
    let exploded = r.life <= 0;

    if (!exploded) {
      const floor = terrainHeight(_rocketPos.x, _rocketPos.z);
      if (_rocketPos.y < floor + 0.2) exploded = true;
    }
    if (!exploded) {
      for (const z of zombies) {
        if (_rocketPos.distanceTo(z.mesh.position) < 1.4) { exploded = true; break; }
      }
    }

    if (exploded) {
      scene.remove(r.mesh);
      r.mesh.traverse(o => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } });
      rockets.splice(i, 1);
      createExplosion(_rocketPos, 11, r.damage);
      addScreenShake(0.55);
      topCenterAlertEl.textContent = "💥 ROCKET IMPACT!";
      alertTimer = 1.5;
    }
  }
}

// ─── Flamethrower Puffs ──────────────────────────────────────────────────────
function spawnFlamePuff(origin, direction) {
  const spread = 0.18;
  const dir = direction.clone();
  dir.x += (Math.random() - 0.5) * spread;
  dir.y += (Math.random() - 0.5) * spread * 0.5;
  dir.z += (Math.random() - 0.5) * spread;
  dir.normalize();

  const color = Math.random() < 0.5 ? 0xff6600 : Math.random() < 0.5 ? 0xff3300 : 0xffaa00;
  const size = 0.1 + Math.random() * 0.22;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(size, 5, 5),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.82 }),
  );
  mesh.position.copy(origin);
  scene.add(mesh);
  flamePuffs.push({
    mesh,
    velocity: dir.multiplyScalar(12 + Math.random() * 6),
    life: 0.38 + Math.random() * 0.22,
    maxLife: 0.6,
    damage: 0,
    damageTickCd: 0,
  });
}

const _flameDamagePerSec = 28;
function updateFlamePuffs(dt) {
  for (let i = flamePuffs.length - 1; i >= 0; i--) {
    const f = flamePuffs[i];
    f.life -= dt;
    if (f.life <= 0) {
      scene.remove(f.mesh);
      f.mesh.geometry?.dispose();
      f.mesh.material?.dispose();
      flamePuffs.splice(i, 1);
      continue;
    }
    f.mesh.position.addScaledVector(f.velocity, dt);
    f.velocity.multiplyScalar(Math.exp(-dt * 3.5));
    f.mesh.position.y += dt * 0.6;
    const t = f.life / f.maxLife;
    f.mesh.material.opacity = t * 0.8;
    f.mesh.scale.setScalar(1 + (1 - t) * 1.8);

    f.damageTickCd -= dt;
    if (f.damageTickCd <= 0) {
      f.damageTickCd = 0.1;
      for (let zi = zombies.length - 1; zi >= 0; zi--) {
        if (f.mesh.position.distanceTo(zombies[zi].mesh.position) < 1.2) {
          applyZombieDamage(zi, _flameDamagePerSec * 0.1);
        }
      }
    }
  }
}

// ─── Boss Zombie ──────────────────────────────────────────────────────────────
function spawnBoss() {
  if (bossAlive || gameOver || gameState !== "PLAYING" || !pointerLocked) return;
  const angle = Math.random() * Math.PI * 2;
  const dist = 35 + Math.random() * 18;
  const bx = player.position.x + Math.cos(angle) * dist;
  const bz = player.position.z + Math.sin(angle) * dist;
  const group = new THREE.Group();
  const bossSkinMat = new THREE.MeshStandardMaterial({ color: 0x243018, roughness: 0.75 });
  const bossBodyMat = new THREE.MeshStandardMaterial({ color: 0x101008, roughness: 0.9 });
  const bossEyeMat = new THREE.MeshBasicMaterial({ color: 0xff2200 });
  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.56, 0.42), bossBodyMat);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.48), bossBodyMat);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 12), bossSkinMat);
  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.28), zombieBloodMaterial);
  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.96, 0.26), bossSkinMat);
  const rightArm = leftArm.clone();
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1.06, 0.26), bossBodyMat);
  const rightLeg = leftLeg.clone();
  torso.position.set(0, 1.48, 0);
  hips.position.set(0, 1.0, 0);
  head.position.set(0, 2.2, 0.02);
  jaw.position.set(0, 1.96, 0.24);
  leftArm.position.set(-0.6, 1.47, 0);
  rightArm.position.set(0.6, 1.47, 0);
  leftLeg.position.set(-0.24, 0.45, 0);
  rightLeg.position.set(0.24, 0.45, 0);
  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyeL = new THREE.Mesh(eyeGeo, bossEyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, bossEyeMat);
  eyeL.position.set(-0.12, 2.24, 0.3);
  eyeR.position.set(0.12, 2.24, 0.3);
  group.add(hips, torso, head, jaw, leftArm, rightArm, leftLeg, rightLeg, eyeL, eyeR);
  group.position.set(bx, terrainHeight(bx, bz), bz);
  group.scale.setScalar(2.35);
  group.traverse((obj) => { if (obj instanceof THREE.Mesh) obj.castShadow = true; });
  scene.add(group);
  zombies.push({
    mesh: group,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    type: "brute",
    hp: 650,
    maxHp: 650,
    speed: 2.2,
    damage: 28,
    walkPhase: 0,
    attackTimer: 0,
    wanderSeed: Math.random() * 1000,
    isBoss: true,
    attackAnimating: false,
    attackAnimTime: 0,
  });
  bossAlive = true;
  topCenterAlertEl.textContent = "⚠ BOSS ZOMBIE INCOMING!";
  alertTimer = 4.5;
  playSfx("boss_alert", 1);
  messageEl.textContent = "BOSS ZOMBIE! Focus fire — worth 500 points!";
}

// ─── Explosive Barrels ────────────────────────────────────────────────────────
function spawnExplosiveBarrel(x, z) {
  const y = terrainHeight(x, z);
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcc2200, roughness: 0.5, metalness: 0.6 });
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.48, metalness: 0.45 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0x881100, roughness: 0.5, metalness: 0.65 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.86, 10), bodyMat);
  const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.07, 10), topMat);
  const band1 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.07, 10), bandMat);
  const band2 = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.07, 10), bandMat);
  body.position.y = 0.43;
  topCap.position.y = 0.9;
  band1.position.y = 0.28;
  band2.position.y = 0.62;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body, topCap, band1, band2);
  group.position.set(x, y, z);
  scene.add(group);
  barrels.push({ mesh: group, center: new THREE.Vector3(x, y + 0.43, z) });
}

function checkBarrelHits(bulletFrom, bulletTo) {
  for (let i = barrels.length - 1; i >= 0; i--) {
    const b = barrels[i];
    if (segmentSphereHit(bulletFrom, bulletTo, b.center, 0.44)) {
      const pos = b.center.clone();
      scene.remove(b.mesh);
      disposeOwnedObject3D(b.mesh);
      barrels.splice(i, 1);
      createExplosion(pos, 7.5, 85);
      return true;
    }
  }
  return false;
}

// ─── Zombie Corpse Revival System ────────────────────────────────────────────
function createZombieCorpse(position, type, rotationY) {
  const corpse = new THREE.Group();
  const corpseBodyMat = new THREE.MeshStandardMaterial({ color: 0x5a6b4a, roughness: 0.9 });
  corpseBodyMat.userData.disposeWithMesh = true;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.25, 0.55),
    corpseBodyMat,
  );
  body.position.y = 0.12;
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 8, 6),
    zombieSkinMaterial,
  );
  head.position.set(0, 0.35, 0.25);
  corpse.add(body, head);
  corpse.position.copy(position);
  corpse.position.y = terrainHeight(position.x, position.z);
  corpse.rotation.y = rotationY;
  scene.add(corpse);
  zombieCorpses.push({
    mesh: corpse,
    reviveTimer: 30 + Math.random() * 15,
    type,
    position: position.clone(),
  });
}

function updateCorpses(dt) {
  for (let i = zombieCorpses.length - 1; i >= 0; i--) {
    const corpse = zombieCorpses[i];
    corpse.reviveTimer -= dt;
    // Visual indicator as revival approaches
    if (corpse.reviveTimer < 5) {
      corpse.mesh.children[0].material.emissive.setHex(0x331100);
      corpse.mesh.children[0].material.emissiveIntensity = (5 - corpse.reviveTimer) / 5 * 0.5;
    }
    if (corpse.reviveTimer <= 0) {
      playSfx("zombie_revive", 0.8);
      scene.remove(corpse.mesh);
      disposeObject3D(corpse.mesh);
      zombieCorpses.splice(i, 1);
      // Revive as same type
      addZombie(corpse.position.x, corpse.position.z, corpse.type);
      messageEl.textContent = `A ${corpse.type} has revived!`;
    }
  }
}

// ─── Distraction / Noise Maker System ────────────────────────────────────────
function throwNoiseMaker() {
  if (!pointerLocked || gameOver || noiseMakerCount <= 0) return;
  noiseMakerCount -= 1;
  playSfx("noise_maker", 1);
  messageEl.textContent = `Noise maker thrown! (${noiseMakerCount} left)`;

  const noiseMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 0.22, 6),
    new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.8, roughness: 0.3 }),
  );
  noiseMesh.castShadow = true;

  const origin = player.position.clone();
  origin.y += 0.3;
  const direction = new THREE.Vector3(
    -Math.sin(player.yaw) * Math.cos(player.pitch),
    Math.sin(player.pitch) + 0.25,
    -Math.cos(player.yaw) * Math.cos(player.pitch),
  ).normalize();

  noiseMesh.position.copy(origin);
  scene.add(noiseMesh);

  const velocity = direction.clone().multiplyScalar(10);
  const distraction = { mesh: noiseMesh, velocity, active: false, beepTimer: 0, position: origin.clone() };
  distractions.push(distraction);

  // Physics arc
  let time = 0;
  const maxTime = 1.2;
  const interval = setInterval(() => {
    time += 0.02;
    distraction.velocity.y += settings.gravity * 0.02;
    noiseMesh.position.addScaledVector(distraction.velocity, 0.02);
    noiseMesh.rotation.x += 0.15;
    noiseMesh.rotation.z += 0.1;

    const floor = terrainHeight(noiseMesh.position.x, noiseMesh.position.z) + 0.11;
    if (noiseMesh.position.y <= floor || time >= maxTime) {
      clearInterval(interval);
      noiseMesh.position.y = floor;
      distraction.active = true;
      distraction.position.copy(noiseMesh.position);
      // Start beeping
      startDistractionBeep(distraction);
    }
  }, 20);
}

function startDistractionBeep(distraction) {
  let beeps = 0;
  const maxBeeps = 12;
  const beepInterval = setInterval(() => {
    if (!distraction.active || gameOver || beeps >= maxBeeps) {
      clearInterval(beepInterval);
      if (distraction.active) deactivateDistraction(distraction);
      return;
    }
    playTone(900 + beeps * 30, 0.08, audioSystem.sfx, { volume: 0.4, type: "square", glide: -50 });
    distraction.mesh.scale.setScalar(1.3);
    setTimeout(() => distraction.mesh.scale.setScalar(1), 100);
    beeps++;
  }, 450);
}

function deactivateDistraction(distraction) {
  distraction.active = false;
  scene.remove(distraction.mesh);
  disposeOwnedObject3D(distraction.mesh);
  const idx = distractions.indexOf(distraction);
  if (idx >= 0) distractions.splice(idx, 1);
}

// ─── Supply Drop System ───────────────────────────────────────────────────
function spawnSupplyDrop() {
  if (gameState !== "PLAYING" || gameOver) return;
  const angle = Math.random() * Math.PI * 2;
  const dist = 35 + Math.random() * 40;
  const dropX = player.position.x + Math.cos(angle) * dist;
  const dropZ = player.position.z + Math.sin(angle) * dist;
  const dropY = 45;

  // Parachute crate
  const crate = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.0, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x228822, roughness: 0.7 }),
  );
  const tape1 = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.15, 0.25), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const tape2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 1.25), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  tape1.position.y = 0.1;
  tape2.position.y = -0.1;

  // Parachute
  const chute = new THREE.Mesh(
    new THREE.ConeGeometry(2.5, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: 0xff6600, side: THREE.DoubleSide }),
  );
  chute.position.y = 4;
  const lines = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 4, 4),
    new THREE.MeshBasicMaterial({ color: 0xcccccc }),
  );
  lines.position.y = 2;

  crate.add(box, tape1, tape2, chute, lines);
  crate.position.set(dropX, dropY, dropZ);
  crate.castShadow = true;
  scene.add(crate);

  const supplyDrop = {
    mesh: crate,
    position: new THREE.Vector3(dropX, dropY, dropZ),
    velocityY: -6,
    landed: false,
    opened: false,
    height: 1.0,
  };
  supplyDrops.push(supplyDrop);

  topCenterAlertEl.textContent = "★ SUPPLY DROP INCOMING!";
  alertTimer = 4;
  playSfx("supply_drop", 0.9);
}

/** Spawn a supply drop at a specific position (for dynamic events). */
function spawnSupplyDropAt(position, type = "standard") {
  if (gameState !== "PLAYING" || gameOver) return;
  const dropX = position.x;
  const dropZ = position.z;
  const dropY = position.y || 45;

  const crate = new THREE.Group();
  const color = type === "weapon_crate" ? 0x2244aa : 0x228822;
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.0, 1.2),
    new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
  );
  const tape1 = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.15, 0.25), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  const tape2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 1.25), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  tape1.position.y = 0.1;
  tape2.position.y = -0.1;
  const chute = new THREE.Mesh(
    new THREE.ConeGeometry(2.5, 1.2, 8),
    new THREE.MeshStandardMaterial({ color: type === "weapon_crate" ? 0x3366ff : 0xff6600, side: THREE.DoubleSide }),
  );
  chute.position.y = 4;
  const lines = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 4, 4),
    new THREE.MeshBasicMaterial({ color: 0xcccccc }),
  );
  lines.position.y = 2;
  crate.add(box, tape1, tape2, chute, lines);
  crate.position.set(dropX, dropY, dropZ);
  crate.castShadow = true;
  scene.add(crate);

  const supplyDrop = {
    mesh: crate,
    position: new THREE.Vector3(dropX, dropY, dropZ),
    velocityY: -6,
    landed: false,
    opened: false,
    height: 1.0,
    dropType: type,
  };
  supplyDrops.push(supplyDrop);
}

function updateSupplyDrops(dt) {
  for (let i = supplyDrops.length - 1; i >= 0; i--) {
    const drop = supplyDrops[i];
    if (!drop.landed) {
      drop.velocityY += settings.gravity * 0.3 * dt;
      drop.mesh.position.y += drop.velocityY * dt;
      const groundY = terrainHeight(drop.mesh.position.x, drop.mesh.position.z) + drop.height / 2;
      if (drop.mesh.position.y <= groundY) {
        drop.mesh.position.y = groundY;
        drop.landed = true;
        const lines = drop.mesh.children[4];
        const chute = drop.mesh.children[3];
        drop.mesh.remove(lines); // Remove chute
        drop.mesh.remove(chute);
        disposeOwnedObject3D(lines);
        disposeOwnedObject3D(chute);
        // Add smoke effect
        spawnSmoke(drop.mesh.position);
      }
    } else if (!drop.opened) {
      const dToPlayer = drop.mesh.position.distanceTo(player.position);
      if (dToPlayer < 2) {
        openSupplyDrop(drop);
        supplyDrops.splice(i, 1);
      }
    }
  }
}

function spawnSmoke(position) {
  for (let i = 0; i < 15; i++) {
    const smoke = new THREE.Mesh(
      new THREE.SphereGeometry(0.15 + Math.random() * 0.25, 5, 5),
      new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.5 }),
    );
    smoke.position.copy(position);
    smoke.position.x += (Math.random() - 0.5) * 1.5;
    smoke.position.z += (Math.random() - 0.5) * 1.5;
    smoke.position.y += Math.random() * 0.5;
    scene.add(smoke);
    particles.push({
      mesh: smoke,
      velocity: new THREE.Vector3((Math.random() - 0.5) * 2, 0.5 + Math.random() * 1.5, (Math.random() - 0.5) * 2),
      life: 2 + Math.random(),
      maxLife: 3,
      gravity: false,
      isExplosion: false,
    });
  }
}

function openSupplyDrop(drop) {
  playSfx("ui_click", 1.2);
  drop.opened = true;
  scene.remove(drop.mesh);
  disposeOwnedObject3D(drop.mesh);

  if (drop.dropType === "weapon_crate") {
    // Weapon crate: random weapon ammo + upgrade materials
    const ammoType = Math.floor(Math.random() * player.weapons.length);
    const ammoGain = Math.floor(getWeaponReserveCap(player.weapons[ammoType]) * 0.3);
    player.weapons[ammoType].reserve = Math.min(
      player.weapons[ammoType].reserve + ammoGain,
      getWeaponReserveCap(player.weapons[ammoType]),
    );
    // Bonus materials
    materials.scrap += 3 + Math.floor(Math.random() * 4);
    materials.metal += 2 + Math.floor(Math.random() * 3);
    materials.chemicals += 1 + Math.floor(Math.random() * 2);
    grenadeCount = Math.min(grenadeCount + 1, 6);
    topCenterAlertEl.textContent = "📦 WEAPON CRATE OPENED!";
    alertTimer = 2.5;
    messageEl.textContent = `Got ${ammoGain} ${player.weapons[ammoType].name} ammo, +scrap/metal/chem, +1 grenade!`;
    return;
  }

  // Give rewards
  const ammoType = Math.random() < 0.5 ? 0 : Math.random() < 0.7 ? 1 : 2;
  const ammoCounts = [60, 40, 18];
  const ammoNames = ["Rifle", "Pistol", "Shotgun"];

  player.weapons[ammoType].reserve = Math.min(
    player.weapons[ammoType].reserve + ammoCounts[ammoType],
    getWeaponReserveCap(player.weapons[ammoType]),
  );
  grenadeCount = Math.min(grenadeCount + 2, 6);
  noiseMakerCount = Math.min(noiseMakerCount + 1, 5);
  player.hp = Math.min(player.hp + 30, getPlayerMaxHealth());

  topCenterAlertEl.textContent = "★ SUPPLY DROP OPENED!";
  alertTimer = 2.5;
  messageEl.textContent = `Got ${ammoCounts[ammoType]} ${ammoNames[ammoType]} ammo, +2 grenades, +1 noise maker, +30 HP!`;
}

// ─── Skill/Perk System ────────────────────────────────────────────────────
function addSkillXP(amount) {
  if (amount <= 0) return;
  skillXp += amount;
  let leveled = false;
  while (skillXp >= 120 + skillPoints * 40) {
    skillXp -= 120 + skillPoints * 40;
    skillPoints += 1;
    leveled = true;
  }
  if (leveled) {
    playSfx("skill_up", 1);
    messageEl.textContent = `Skill point gained! Use Shift+1..5 to upgrade. (${skillPoints} available)`;
    updateSkillDisplay();
  }
}

function upgradeSkill(skillId) {
  const skill = skills[skillId];
  if (!skill || skillPoints <= 0 || skill.level >= skill.max) return;
  skillPoints -= 1;
  skill.level += 1;
  skill.value = skill.level * 0.15; // 15% per level
  if (skillId === "health") {
    player.hp = Math.min(getPlayerMaxHealth(), player.hp + 15);
  }
  playSfx("skill_up", 1);
  messageEl.textContent = `${skill.name} upgraded to Lv${skill.level}.`;
  updateSkillDisplay();
}

function updateSkillDisplay() {
  if (!skillMetaEl) return;
  const activeSkills = Object.values(skills).filter((s) => s.level > 0).map((s) => `${s.name} ${s.level}`).join(", ");
  skillMetaEl.textContent = activeSkills || "Skills: None";
}

function getPlayerMaxHealth() {
  return 100 + skills.health.value * 100;
}

// ─── Melee Attack System ────────────────────────────────────────────────────
function performMelee() {
  if (!pointerLocked || gameOver || meleeCooldown > 0) return;
  meleeCooldown = 0.65;
  playSfx("melee_knife", 1);

  // Knife swing animation
  const knife = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.25, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 }),
  );
  knife.position.set(0.35, -0.25, -0.4);
  firstPersonWeapon.weapon.add(knife);
  setTimeout(() => firstPersonWeapon.weapon.remove(knife), 200);

  // Calculate melee hit
  const reach = 3.5;
  const swingDir = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const hitPoint = player.position.clone().addScaledVector(swingDir, reach * 0.6);

  // Visual slash
  const slash = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.15),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
  );
  slash.position.copy(hitPoint);
  slash.position.y += 1.5;
  slash.lookAt(player.position);
  scene.add(slash);
  setTimeout(() => {
    scene.remove(slash);
    disposeOwnedObject3D(slash);
  }, 100);

  // Check zombie hits
  let hitCount = 0;
  for (let i = zombies.length - 1; i >= 0; i--) {
    const zombie = zombies[i];
    const d = zombie.mesh.position.distanceTo(hitPoint);
    if (d < reach) {
      hitCount++;
      const damage = 45 * (1 + skills.damage.value); // Knife does high damage
      applyZombieDamage(i, damage, true, true); // Melee headshots count
      spawnBloodParticles(zombie.mesh.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 8);
    }
  }

  if (hitCount > 0) {
    messageEl.textContent = `Melee hit ${hitCount} zombie${hitCount > 1 ? 's' : ''}!`;
    addScreenShake(0.15);
  }
}

// ─── Periodic Events ────────────────────────────────────────────────────────
setInterval(() => {
  if (gameState === "PLAYING" && !gameOver && Math.random() < 0.15) {
    spawnSupplyDrop();
  }
}, 45000); // Try supply drop every 45s

function animate(nowMs) {
  const now = nowMs * 0.001;
  const frameDt = Math.min(0.05, now - (animate.lastTime || now));
  animate.lastTime = now;
  const freezeFrame = hitStopTimer > 0;
  if (hitStopCooldown > 0) hitStopCooldown = Math.max(0, hitStopCooldown - frameDt);
  if (hitStopTimer > 0) hitStopTimer = Math.max(0, hitStopTimer - frameDt);
  const dt = freezeFrame ? 0 : frameDt;

  if (dt > 0 && gameState === "PLAYING" && !gameOver && !upgradeBenchOpen && !inventoryOpen) {

    gameTime += dt;
    spawnTimer -= dt;
    updateWaveDirector(dt);

    // Dynamic events
    const eventResult = updateEventDirector(eventDirector, dt, player, zombies, scene, terrainHeight);
    if (eventResult && eventResult.type === "trigger") {
      const exec = executeEvent(eventResult.eventType, eventDirector, player, scene, terrainHeight, addZombie, (pos, type) => {
        if (type === "weapon_crate") spawnSupplyDropAt(pos);
      });
      if (exec && exec.alert) {
        topCenterAlertEl.textContent = exec.alert;
        alertTimer = exec.alertTimer || 3;
      }
    } else if (eventResult && eventResult.type === "survivor_end") {
      if (eventResult.success) {
        score += 300;
        skillPoints += 1;
        grenadeCount = Math.min(grenadeCount + 1, 6);
        topCenterAlertEl.textContent = "★ SURVIVOR SAVED! +300 pts +1 SP";
        alertTimer = 3;
        messageEl.textContent = "Survivor rescued! Well done.";
      } else {
        topCenterAlertEl.textContent = "💀 Survivor didn't make it...";
        alertTimer = 2.5;
      }
    }

    // Mission system
    const missionResult = updateMissions(missionGenerator, dt, player, materials, zombies, terrainHeight);
    if (missionResult && missionResult.completed) {
      for (const mission of missionResult.completed) {
        const rewards = getMissionRewards(mission);
        score += rewards.score;
        addSkillXP(rewards.xp);
        skillPoints += rewards.skillPoints || 0;
        for (const [mat, amt] of Object.entries(rewards.materials)) {
          materials[mat] = (materials[mat] || 0) + amt;
        }
        topCenterAlertEl.textContent = `★ MISSION COMPLETE: ${mission.title}`;
        alertTimer = 3;
        messageEl.textContent = `Completed "${mission.title}"! +${rewards.score} pts, +${rewards.xp} XP`;
      }
    }

    if (player.reloadTimer > 0) {
      player.reloadTimer -= dt;
      if (player.reloadTimer <= 0) {
        syncPlayerAmmoFields(player);
        const weapon = getActiveWeapon(player);
        const needed = weapon.magSize - player.ammo;
        const loaded = Math.min(needed, player.reserveAmmo);
        player.ammo += loaded;
        player.reserveAmmo -= loaded;
        commitPlayerAmmoFields(player);
        messageEl.textContent = "Reloaded.";
      }
    }

    player.shootCooldown = Math.max(0, player.shootCooldown - dt);
    // Auto-fire for flamethrower (and any other full-auto weapons) while mouse held
    if (mouseLeftHeld && pointerLocked && player.shootCooldown === 0 && !gameOver) {
      const _aw = getActiveWeapon(player);
      if (_aw.name === "Flamethrower" || _aw.name === "Rifle") shoot();
    }
    if (activeVehicle) {
      updateVehicles(dt);
      sun.position.x = activeVehicle.mesh.position.x + 30;
      sun.position.z = activeVehicle.mesh.position.z - 10;
    } else {
      movePlayer(dt);
      sun.position.x = player.position.x + 30;
      sun.position.z = player.position.z - 10;
      preventTreeCollision();
    }
    ensureChunks();
    updateZombies(dt);
    updateTeammates(dt);
    updateBullets(dt);
    updateArrows(dt);
    updateRockets(dt);
    updateFlamePuffs(dt);
    updatePickups(dt);
    updateGrenades(dt);
    updateMolotovProjectiles(dt);
    updateMolotovFires(dt);
    updateLandMines(dt);
    updateSpikeTraps(dt);
    updateParticles(dt);
    updateCorpses(dt);
    updateSupplyDrops(dt);
    updateBarricades(dt);
    updateWeather(dt);
    updateDayNight();
    autoSaveTick(dt);
    if (meleeCooldown > 0) meleeCooldown -= dt;
    if (hordeNightActive) {
      hordeNightTimer -= dt;
      if (hordeNightTimer <= 0) {
        hordeNightActive = false;
        topCenterAlertEl.textContent = "Horde Night over. Well done.";
        alertTimer = 3;
        messageEl.textContent = "Horde Night survived! Grenades restocked.";
        grenadeCount = Math.min(grenadeCount + 1, 5);
      }
    }
  }

  const adsFov = isADS ? 48 : 75;
  camera.fov += (adsFov - camera.fov) * Math.min(1, dt * 13);
  camera.updateProjectionMatrix();
  if (screenShake > 0 && dt > 0) {
    screenShake = Math.max(0, screenShake - dt * 1.9);
    screenShakeTime += dt * (18 + screenShake * 18);
    const shakePower = screenShake * screenShake;
    const sh = shakePower * 0.34;
    camera.position.x += Math.sin(screenShakeTime * 21.7 + 0.6) * sh;
    camera.position.y += Math.sin(screenShakeTime * 17.3 + 1.9) * sh * 0.65;
    camera.position.z += Math.cos(screenShakeTime * 19.8 + 2.7) * sh * 0.85;
  }
  updateWeapon(dt);
  updateHUDMaterials();
  updateHud(frameDt);
  updateFloatingDamageNums(dt);
  updateVehicleHud();
  renderer.render(scene, camera);
  drawEnemyHealthBars();
  requestAnimationFrame(animate);
}

canvas.addEventListener("click", async () => {
  await ensureAudioUnlocked();
  if (!pointerLocked && gameState !== "PLAYING") canvas.requestPointerLock();
});

let mouseLeftHeld = false;
window.addEventListener("mousedown", (e) => {
  if (e.button === 0) mouseLeftHeld = true;
  if (e.button === 0 && pointerLocked && gameState === "PLAYING") shoot();
  if (e.button === 2 && pointerLocked && gameState === "PLAYING") isADS = true;
});

window.addEventListener("mouseup", (e) => {
  if (e.button === 0) mouseLeftHeld = false;
  if (e.button === 2) isADS = false;
});

document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === canvas;
  if (pointerLocked && !gameOver) {
    startPlaying();
    messageEl.textContent = "Survive. Loot drops from zombies.";
  } else if (!pointerLocked && !gameOver) {
    clearInputState();
    paused = true;
    setMenuMode("pause");
    messageEl.textContent = "Click resume to re-enter battle.";
  }
});

window.addEventListener("mousemove", (e) => {
  if (!pointerLocked) return;
  player.yaw -= e.movementX * 0.0024;
  player.pitch -= e.movementY * 0.0021;
  player.pitch = Math.max(-1.35, Math.min(1.35, player.pitch));
  lookSwayX += e.movementX;
  lookSwayY += e.movementY;
});

window.addEventListener("keydown", (e) => {
  if (!audioSystem.unlocked) {
    // First keyboard input should unlock audio context on browsers that gate autoplay.
    void ensureAudioUnlocked();
  }
  keys.add(e.code);
  if (activeVehicle) {
    if (e.code === "KeyW") vehicleInput.forward = true;
    if (e.code === "KeyS") vehicleInput.backward = true;
    if (e.code === "KeyA") vehicleInput.left = true;
    if (e.code === "KeyD") vehicleInput.right = true;
    if (e.code === "Space") vehicleInput.backward = true; // Brake
  }
  if (e.code === "KeyR" && gameState === "PLAYING") reload();
  if (e.code === "KeyQ" && gameState === "PLAYING") doSwapPlayerWeapon();
  if (e.code === "KeyU" && gameState === "PLAYING" && !gameOver && !e.repeat) {
    e.preventDefault();
    if (upgradeBenchOpen) closeUpgradeBench();
    else openUpgradeBench();
  }
  if (e.code === "KeyT") {
    for (const mate of teammates) {
      mate.activeWeapon = (mate.activeWeapon + 1) % mate.weapons.length;
    }
    playSfx("ui_click", 1);
    messageEl.textContent = "Teammates swapped weapons.";
  }
  if (e.code === "KeyP") {
    playSfx("ui_click", 1);
    if (gameState === "PLAYING") {
      paused = true;
      if (document.pointerLockElement === canvas) document.exitPointerLock();
      setMenuMode("pause");
      messageEl.textContent = "Paused.";
    } else if (gameState === "MENU_PAUSE" && !gameOver) {
      canvas.requestPointerLock();
    }
  }
  if (e.code === "KeyM") {
    toggleAudioMuted();
  }
  if (e.code === "KeyF" && gameOver) window.location.reload();
  if (e.code === "KeyG" && gameState === "PLAYING" && !gameOver) useThrowableOrTrap();
  if (e.code === "KeyV" && gameState === "PLAYING" && !gameOver) throwNoiseMaker();
  if (e.code === "KeyJ" && gameState === "PLAYING" && !gameOver) throwMolotov();
  if (e.code === "KeyK" && gameState === "PLAYING" && !gameOver && !e.repeat) placeLandMine();
  if (e.code === "KeyL" && gameState === "PLAYING" && !gameOver && !e.repeat) placeSpikeTrap();
  if (e.code === "KeyF" && gameState === "PLAYING" && !gameOver && !e.repeat) {
    if (activeVehicle) exitVehicle();
    else {
      const nearVehicle = findNearestVehicle();
      if (nearVehicle) enterVehicle(nearVehicle);
      else performMelee();
    }
  }
  if (e.code === "KeyH" && gameState === "PLAYING" && !gameOver && !e.repeat && activeVehicle) {
    playSpatialSfx("noise_maker", activeVehicle.mesh.position, 0.6);
    messageEl.textContent = "HONK!";
  }
  if (e.code === "KeyB" && gameState === "PLAYING" && !gameOver && !e.repeat) buildBarricade();
  if (e.code === "KeyN" && gameState === "PLAYING" && !gameOver && !e.repeat) switchBuildType();
  if (e.code === "F6" && gameState === "PLAYING" && !gameOver) {
    e.preventDefault();
    saveRun();
  }
  if (e.code === "KeyE" && gameState === "PLAYING") doSwapPlayerWeapon();
  // Direct weapon switching: 1-7 maps to weapon slots
  if (!e.shiftKey && !e.repeat && gameState === "PLAYING") {
    if (e.code === "Digit1") { e.preventDefault(); doSwitchToWeapon(0); }
    if (e.code === "Digit2") { e.preventDefault(); doSwitchToWeapon(1); }
    if (e.code === "Digit3") { e.preventDefault(); doSwitchToWeapon(2); }
    if (e.code === "Digit4") { e.preventDefault(); doSwitchToWeapon(3); }
    if (e.code === "Digit5") { e.preventDefault(); doSwitchToWeapon(4); }
    if (e.code === "Digit6") { e.preventDefault(); doSwitchToWeapon(5); }
    if (e.code === "Digit7") { e.preventDefault(); doSwitchToWeapon(6); }
  }
  if (e.code === "Tab" && gameState === "PLAYING" && !gameOver && !e.repeat) {
    e.preventDefault();
    if (inventoryOpen) closeInventory();
    else openInventory();
  }
  if (e.code === "KeyC" && gameState === "PLAYING" && !gameOver) {
    isCrouching = !isCrouching;
    messageEl.textContent = isCrouching ? "Crouching — quieter, slower." : "Standing up.";
  }
  // Skill upgrade shortcuts (hold Shift + number)
  if (e.shiftKey && gameState === "PLAYING" && !gameOver) {
    if (e.code === "Digit1") { e.preventDefault(); upgradeSkill("reloadSpeed"); }
    if (e.code === "Digit2") { e.preventDefault(); upgradeSkill("damage"); }
    if (e.code === "Digit3") { e.preventDefault(); upgradeSkill("health"); }
    if (e.code === "Digit4") { e.preventDefault(); upgradeSkill("speed"); }
    if (e.code === "Digit5") { e.preventDefault(); upgradeSkill("headshotBonus"); }
  }
});

window.addEventListener("keyup", (e) => {
  keys.delete(e.code);
  if (activeVehicle) {
    if (e.code === "KeyW") vehicleInput.forward = false;
    if (e.code === "KeyS") vehicleInput.backward = false;
    if (e.code === "KeyA") vehicleInput.left = false;
    if (e.code === "KeyD") vehicleInput.right = false;
  }
});
window.addEventListener("blur", clearInputState);

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

(async function bootstrap() {
  let akTemplate = null;
  try {
    akTemplate = await ensureAk47TemplateRoot();
  } catch {
    akTemplate = null;
  }
  akTemplateRef = akTemplate;

  let remingtonTemplate = null;
  try {
    remingtonTemplate = await ensureRemingtonTemplateRoot();
  } catch {
    remingtonTemplate = null;
  }
  remingtonTemplateRef = remingtonTemplate;

  let pistolTemplate = null;
  try {
    pistolTemplate = await ensurePistolTemplateRoot();
  } catch {
    pistolTemplate = null;
  }
  pistolTemplateRef = pistolTemplate;

  if (pendingMapId === "outbreak_city" || activeMapConfig.id === "outbreak_city") {
    await loadCityBuildingLibrary();
  }
  applyActiveMapVisuals();
  ensureChunks();
  initWeather();
  for (let i = 0; i < 8; i += 1) spawnZombieNearPlayer();
  for (let i = 0; i < 3; i += 1) {
    teammates.push(createTeammate(2 + i * 2.5, 2 + i, i, akTemplate, remingtonTemplate, pistolTemplate));
  }
  // Spawn vehicles on Outbreak City and Ruins maps
  if (activeMapConfig.id === "outbreak_city" || activeMapConfig.id === "ruins") {
    spawnVehiclesForMap();
  }
  syncPlayerAmmoFields(player);
  updateAudioButtonLabel();
  setMenuMode("title");
  messageEl.textContent = "Pick a map, then Start. Q swap, T team swap, P pause, M audio. B build, N switch build type.";
  animate(0);
})();

startBtnEl.addEventListener("click", async () => {
  playSfx("ui_click", 1);
  await ensureAudioUnlocked();
  if (mapDirty) {
    activeMapConfig = mapById(pendingMapId);
    resetWorldForNewMap();
    mapDirty = false;
  }
  canvas.requestPointerLock();
});

resumeBtnEl.addEventListener("click", async () => {
  playSfx("ui_click", 1);
  await ensureAudioUnlocked();
  if (!gameOver) canvas.requestPointerLock();
});

restartBtnEl.addEventListener("click", () => {
  playSfx("ui_click", 1);
  clearSavedRun();
  window.location.reload();
});

continueBtnEl.addEventListener("click", async () => {
  playSfx("ui_click", 1);
  await ensureAudioUnlocked();
  if (mapDirty) {
    activeMapConfig = mapById(pendingMapId);
    resetWorldForNewMap();
    mapDirty = false;
  }
  loadRun();
  canvas.requestPointerLock();
});

audioBtnEl.addEventListener("click", async () => {
  await ensureAudioUnlocked();
  toggleAudioMuted();
});

document.addEventListener("visibilitychange", () => {
  if (!audioSystem.ctx || !audioSystem.unlocked) return;
  if (document.hidden) {
    audioSystem.ctx.suspend();
    audioSystem.bgmEl?.pause();
  } else {
    audioSystem.ctx.resume();
    if (audioSystem.bgmEl?.src && !audioSystem.muted) audioSystem.bgmEl.play().catch(() => {});
  }
});
