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
  createSmgMesh,
  createRevolverMesh,
  createMinigunMesh,
  createWorldWeaponMesh,
  initDefaultWeapons,
} from "./combat/weaponSystem.js";
import { showUpgradeBench, hideUpgradeBench } from "./ui/upgradeBench.js";
import { createInventoryOverlay, showInventory, hideInventory } from "./ui/inventory.js";
import { createEventDirector, updateEventDirector, executeEvent, isSurvivorAlive, damageSurvivor, clearCamp, EVENT_TYPES } from "./game/events.js";
import { WORLD_MAPS, mapById } from "./core/config.js";
import { createWeather, initWeather as initWeatherSystem, updateWeather as updateWeatherSystem, clearWeather as clearWeatherSystem } from "./world/weather.js";
import { noise2D as terrainNoise2D, terrainHeight as terrainHeightFn, terrainNormal as terrainNormalFn } from "./world/terrain.js";
import { spawnModel, preloadModels } from "./world/spawnModel.js";
import { modelsByCategory, getModelDef } from "./world/modelRegistry.js";
import { buildZombieMesh, statsForType as zombieStatsForType, rollZombieType, SPECIAL_INFECTED_TYPES } from "./entities/zombie.js";
import { emitSoundEvent, pruneSoundEvents, flankOffset, NOISE_RADIUS } from "./entities/zombieAI.js";
import { resolveBossFlavor } from "./entities/bosses.js";
import { createAudioState, persistMutedFlag } from "./audio/state.js";
import {
  ensureAudioUnlocked as ensureAudioUnlockedEngine,
  playNoise as playNoiseEngine,
  playTone as playToneEngine,
  playSpatialSfx as playSpatialSfxEngine,
  playSfx as playSfxEngine,
  applyBgmVolume as applyBgmVolumeEngine,
  stopHtmlBgmHard as stopHtmlBgmHardEngine,
  stopTitleMusic as stopTitleMusicEngine,
  playHtmlBgm as playHtmlBgmEngine,
  startTitleMusicFallback as startTitleMusicFallbackEngine,
  stopAmbientLoop as stopAmbientLoopEngine,
  startAmbientLoop as startAmbientLoopEngine,
} from "./audio/engine.js";
import { createMissionGenerator, updateMissions, onMaterialCollected, onZombieKilled, getMissionRewards, formatMissionStatus, MISSION_TYPES } from "./game/missionSystem.js";
import { loadProgression, addGlobalXP, getLevel, getXPForCurrentLevel, formatProgression } from "./game/progression.js";
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
// Environment PBR textures (Polyhaven CC0) + blood decal (OpenGameArt CC0)
import asphaltDiffuseUrl from "./assets/textures/asphalt_diffuse.jpg";
import asphaltNormalUrl  from "./assets/textures/asphalt_normal.jpg";
import asphaltRoughUrl   from "./assets/textures/asphalt_rough.jpg";
import concreteDiffuseUrl from "./assets/textures/concrete_diffuse.jpg";
import concreteNormalUrl  from "./assets/textures/concrete_normal.jpg";
import concreteRoughUrl   from "./assets/textures/concrete_rough.jpg";
import brickDiffuseUrl    from "./assets/textures/brick_diffuse.jpg";
import brickNormalUrl     from "./assets/textures/brick_normal.jpg";
import brickRoughUrl      from "./assets/textures/brick_rough.jpg";
import rustyMetalDiffuseUrl from "./assets/textures/rusty_metal_diffuse.jpg";
import rustyMetalNormalUrl  from "./assets/textures/rusty_metal_normal.jpg";
import rustyMetalRoughUrl   from "./assets/textures/rusty_metal_rough.jpg";
import dirtDiffuseUrl       from "./assets/textures/dirt_diffuse.jpg";
import dirtNormalUrl        from "./assets/textures/dirt_normal.jpg";
import dirtRoughUrl         from "./assets/textures/dirt_rough.jpg";
import woodPlanksDiffuseUrl from "./assets/textures/wood_planks_diffuse.jpg";
import woodPlanksNormalUrl  from "./assets/textures/wood_planks_normal.jpg";
import woodPlanksRoughUrl   from "./assets/textures/wood_planks_rough.jpg";
import bloodSplatterUrl     from "./assets/textures/blood_splatter_decal.png";
import bloodDropsUrl        from "./assets/textures/blood_drops_decal.png";
// New feature textures (ambientCG CC0)
import turretBodyDiffuseUrl  from "./assets/textures/turret_body_diffuse.jpg";
import turretBodyNormalUrl   from "./assets/textures/turret_body_normal.jpg";
import turretBodyRoughUrl    from "./assets/textures/turret_body_rough.jpg";
import turretBarrelDiffuseUrl from "./assets/textures/turret_barrel_diffuse.jpg";
import turretBarrelNormalUrl  from "./assets/textures/turret_barrel_normal.jpg";
import turretBarrelRoughUrl   from "./assets/textures/turret_barrel_rough.jpg";
import toxicBarrelDiffuseUrl from "./assets/textures/toxic_barrel_diffuse.jpg";
import toxicBarrelNormalUrl  from "./assets/textures/toxic_barrel_normal.jpg";
import toxicBarrelRoughUrl   from "./assets/textures/toxic_barrel_rough.jpg";
import lootCrateDiffuseUrl   from "./assets/textures/loot_crate_diffuse.jpg";
import lootCrateNormalUrl    from "./assets/textures/loot_crate_normal.jpg";
import lootCrateRoughUrl     from "./assets/textures/loot_crate_rough.jpg";
const ak47ModelUrl = new URL("../textured_ak47_-_free_for_download.glb", import.meta.url).href;
const remingtonModelUrl = new URL("../call_of_duty_black_ops_cold_war_-_gallo_sa12.glb", import.meta.url).href;
/** Textured handgun GLB (Webaverse sample asset — https://github.com/webaverse/pistol ) */
const pistolModelUrl = new URL("../webaverse_pistol.glb", import.meta.url).href;

const canvas = document.querySelector("#game");
canvas.tabIndex = -1;
const healthFillEl = document.querySelector("#health-fill");
const staminaFillEl = document.querySelector("#stamina-fill");
const statsMetaEl = document.querySelector("#stats-meta");
const messageEl = document.querySelector("#message");
const minimapEl = document.querySelector("#minimap");
const minimapCtx = minimapEl.getContext("2d");
const damageFlashEl = document.querySelector("#damage-flash");
const damageDirEl = document.querySelector("#damage-direction");
let _damageDirTimer = 0;

/** Show a directional damage indicator pointing toward the source position. */
function showDamageDirection(sourcePos) {
  if (!damageDirEl) return;
  // Compute angle from player facing direction to the attacker
  const dx = sourcePos.x - player.position.x;
  const dz = sourcePos.z - player.position.z;
  const angleToSource = Math.atan2(-dx, -dz); // world space
  const relAngle = angleToSource - player.yaw; // relative to camera
  // Rotate the indicator element (CSS arrow points up, rotate to match)
  damageDirEl.style.transform = `rotate(${relAngle}rad)`;
  damageDirEl.style.opacity = "1";
  _damageDirTimer = 0.65;
}
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

/** Objective compass — points to the most urgent nearby world objective. */
const objectiveCompassEl = document.createElement("div");
objectiveCompassEl.id = "objective-compass";
objectiveCompassEl.innerHTML = `
  <div class="objective-compass-arrow">▲</div>
  <div class="objective-compass-copy">
    <div class="objective-compass-label"></div>
    <div class="objective-compass-distance"></div>
  </div>
`;
document.body.appendChild(objectiveCompassEl);
const objectiveCompassArrowEl = objectiveCompassEl.querySelector(".objective-compass-arrow");
const objectiveCompassLabelEl = objectiveCompassEl.querySelector(".objective-compass-label");
const objectiveCompassDistanceEl = objectiveCompassEl.querySelector(".objective-compass-distance");

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
scene.background = new THREE.Color(0x4a5a52);
scene.fog = new THREE.Fog(0x6a7862, 60, 260);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 1.8, 6);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
// Initial pixel ratio must not depend on adaptiveQuality yet (declared later).
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
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
sun.shadow.mapSize.set(1024, 1024);
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
barkDiffuse.anisotropy = 8;

const barkBump = textureLoader.load(treeBarkBumpUrl);
barkBump.wrapS = THREE.RepeatWrapping;
barkBump.wrapT = THREE.RepeatWrapping;
barkBump.repeat.set(1, 2.2);
barkBump.anisotropy = 8;

const zombieCloth = textureLoader.load(zombieClothDiffuseUrl);
zombieCloth.wrapS = THREE.RepeatWrapping;
zombieCloth.wrapT = THREE.RepeatWrapping;
zombieCloth.repeat.set(0.7, 0.7);
zombieCloth.colorSpace = THREE.SRGBColorSpace;
zombieCloth.anisotropy = 8;

const zombieSkinDetail = textureLoader.load(zombieSkinDetailUrl);
zombieSkinDetail.wrapS = THREE.RepeatWrapping;
zombieSkinDetail.wrapT = THREE.RepeatWrapping;
zombieSkinDetail.repeat.set(1.2, 1.2);
zombieSkinDetail.anisotropy = 8;

// Web-sourced texture (OpenGameArt/LPC): rotten flesh diffuse.
const zombieFleshRottenRed = textureLoader.load(zombieFleshRottenRedUrl);
zombieFleshRottenRed.wrapS = THREE.RepeatWrapping;
zombieFleshRottenRed.wrapT = THREE.RepeatWrapping;
zombieFleshRottenRed.repeat.set(1.4, 1.4);
zombieFleshRottenRed.colorSpace = THREE.SRGBColorSpace;
zombieFleshRottenRed.anisotropy = 8;

const gunMetalDiffuse = textureLoader.load(gunMetalDiffuseUrl);
gunMetalDiffuse.wrapS = THREE.RepeatWrapping;
gunMetalDiffuse.wrapT = THREE.RepeatWrapping;
gunMetalDiffuse.repeat.set(2.2, 2.2);
gunMetalDiffuse.colorSpace = THREE.SRGBColorSpace;
gunMetalDiffuse.anisotropy = 8;

const gunMetalNormal = textureLoader.load(gunMetalNormalUrl);
gunMetalNormal.wrapS = THREE.RepeatWrapping;
gunMetalNormal.wrapT = THREE.RepeatWrapping;
gunMetalNormal.repeat.set(2.2, 2.2);
gunMetalNormal.anisotropy = 8;

const gunMetalRough = textureLoader.load(gunMetalRoughUrl);
gunMetalRough.wrapS = THREE.RepeatWrapping;
gunMetalRough.wrapT = THREE.RepeatWrapping;
gunMetalRough.repeat.set(2.2, 2.2);
gunMetalRough.anisotropy = 8;

const gunGripDiffuse = textureLoader.load(gunGripDiffuseUrl);
gunGripDiffuse.wrapS = THREE.RepeatWrapping;
gunGripDiffuse.wrapT = THREE.RepeatWrapping;
gunGripDiffuse.repeat.set(1.6, 1.6);
gunGripDiffuse.colorSpace = THREE.SRGBColorSpace;
gunGripDiffuse.anisotropy = 8;

const gunGripNormal = textureLoader.load(gunGripNormalUrl);
gunGripNormal.wrapS = THREE.RepeatWrapping;
gunGripNormal.wrapT = THREE.RepeatWrapping;
gunGripNormal.repeat.set(1.6, 1.6);
gunGripNormal.anisotropy = 8;

const gunGripRough = textureLoader.load(gunGripRoughUrl);
gunGripRough.wrapS = THREE.RepeatWrapping;
gunGripRough.wrapT = THREE.RepeatWrapping;
gunGripRough.repeat.set(1.6, 1.6);
gunGripRough.anisotropy = 8;

const teammateJacketDiffuse = textureLoader.load(teammateJacketDiffuseUrl);
teammateJacketDiffuse.wrapS = THREE.RepeatWrapping;
teammateJacketDiffuse.wrapT = THREE.RepeatWrapping;
teammateJacketDiffuse.repeat.set(1.2, 1.2);
teammateJacketDiffuse.colorSpace = THREE.SRGBColorSpace;
teammateJacketDiffuse.anisotropy = 8;

const teammateJacketRough = textureLoader.load(teammateJacketRoughUrl);
teammateJacketRough.wrapS = THREE.RepeatWrapping;
teammateJacketRough.wrapT = THREE.RepeatWrapping;
teammateJacketRough.repeat.set(1.2, 1.2);
teammateJacketRough.anisotropy = 8;

const teammateJacketNormal = textureLoader.load(teammateJacketNormalUrl);
teammateJacketNormal.wrapS = THREE.RepeatWrapping;
teammateJacketNormal.wrapT = THREE.RepeatWrapping;
teammateJacketNormal.repeat.set(1.2, 1.2);
teammateJacketNormal.anisotropy = 8;

const teammatePantsDiffuse = textureLoader.load(teammatePantsDiffuseUrl);
teammatePantsDiffuse.wrapS = THREE.RepeatWrapping;
teammatePantsDiffuse.wrapT = THREE.RepeatWrapping;
teammatePantsDiffuse.repeat.set(1.2, 1.2);
teammatePantsDiffuse.colorSpace = THREE.SRGBColorSpace;
teammatePantsDiffuse.anisotropy = 8;

const teammatePantsRough = textureLoader.load(teammatePantsRoughUrl);
teammatePantsRough.wrapS = THREE.RepeatWrapping;
teammatePantsRough.wrapT = THREE.RepeatWrapping;
teammatePantsRough.repeat.set(1.2, 1.2);
teammatePantsRough.anisotropy = 8;

const teammatePantsNormal = textureLoader.load(teammatePantsNormalUrl);
teammatePantsNormal.wrapS = THREE.RepeatWrapping;
teammatePantsNormal.wrapT = THREE.RepeatWrapping;
teammatePantsNormal.repeat.set(1.2, 1.2);
teammatePantsNormal.anisotropy = 8;

/** Load a tileable PBR set (diffuse + normal + rough) with consistent UV repeat.
 *  Returns { map, normalMap, roughnessMap }. Used for asphalt, brick, concrete,
 *  dirt, rusty metal, and weathered planks. */
function loadPbrSet(diffUrl, normUrl, roughUrl, repeat = 4) {
  const map = textureLoader.load(diffUrl);
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat, repeat);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const normalMap = textureLoader.load(normUrl);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(repeat, repeat);
  normalMap.anisotropy = 8;
  normalMap.minFilter = THREE.LinearMipmapLinearFilter;

  const roughnessMap = textureLoader.load(roughUrl);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeat, repeat);
  roughnessMap.anisotropy = 8;
  roughnessMap.minFilter = THREE.LinearMipmapLinearFilter;

  return { map, normalMap, roughnessMap };
}

/** Shared PBR sets — loaded once, reused across all matching materials. */
const asphaltPbr     = loadPbrSet(asphaltDiffuseUrl,    asphaltNormalUrl,    asphaltRoughUrl,    16);
const concretePbr    = loadPbrSet(concreteDiffuseUrl,   concreteNormalUrl,   concreteRoughUrl,    1.5);
const brickPbr       = loadPbrSet(brickDiffuseUrl,      brickNormalUrl,      brickRoughUrl,       1.5);
const rustyMetalPbr  = loadPbrSet(rustyMetalDiffuseUrl, rustyMetalNormalUrl, rustyMetalRoughUrl,  1);
const dirtPbr        = loadPbrSet(dirtDiffuseUrl,       dirtNormalUrl,       dirtRoughUrl,       16);
const woodPlanksPbr  = loadPbrSet(woodPlanksDiffuseUrl, woodPlanksNormalUrl, woodPlanksRoughUrl,  1.2);
// New feature PBR sets (ambientCG CC0)
const turretBodyPbr   = loadPbrSet(turretBodyDiffuseUrl,   turretBodyNormalUrl,   turretBodyRoughUrl,   1);
const turretBarrelPbr = loadPbrSet(turretBarrelDiffuseUrl, turretBarrelNormalUrl, turretBarrelRoughUrl, 1);
const toxicBarrelPbr  = loadPbrSet(toxicBarrelDiffuseUrl,  toxicBarrelNormalUrl,  toxicBarrelRoughUrl,  1);
const lootCratePbr    = loadPbrSet(lootCrateDiffuseUrl,    lootCrateNormalUrl,    lootCrateRoughUrl,    1);

/** Blood splatter texture (CC0 OpenGameArt) — flat ground decals with RGBA transparency. */
const bloodSplatterTex = textureLoader.load(bloodSplatterUrl);
bloodSplatterTex.colorSpace = THREE.SRGBColorSpace;
bloodSplatterTex.anisotropy = 8;
bloodSplatterTex.minFilter = THREE.LinearMipmapLinearFilter;
const bloodDropsTex = textureLoader.load(bloodDropsUrl);
bloodDropsTex.colorSpace = THREE.SRGBColorSpace;
bloodDropsTex.anisotropy = 8;
bloodDropsTex.minFilter = THREE.LinearMipmapLinearFilter;

/** Playable regions are defined in src/core/config.js (single source of truth). */

let activeMapConfig = mapById(localStorage.getItem("zowg_map") || "meadows");
let pendingMapId = activeMapConfig.id;
let mapDirty = false;
let akTemplateRef = null;
let pistolTemplateRef = null;
let remingtonTemplateRef = null;

/** Hard cap on active particles to prevent GC spikes. */
const MAX_PARTICLES = 600;

// Shared particle geometries — created once and NEVER disposed during gameplay.
const _pGeoBlood  = new THREE.SphereGeometry(0.032, 4, 4);
const _pGeoFire   = new THREE.SphereGeometry(0.08, 4, 4);
const _pGeoSpark  = new THREE.SphereGeometry(0.025, 3, 3);
const _pGeoDebris = new THREE.SphereGeometry(0.07, 4, 4);
const _pGeoDecal  = new THREE.CircleGeometry(0.7, 12);
const _pGeoToxic  = new THREE.SphereGeometry(0.12, 4, 4);
[_pGeoBlood, _pGeoFire, _pGeoSpark, _pGeoDebris, _pGeoDecal, _pGeoToxic].forEach(g => { g.userData.preventDispose = true; });

// Particle material pool — avoids creating and disposing materials per particle.
// Each particle still gets its own instance (needed for per-particle opacity) but
// instances are recycled instead of being GC'd + GPU-destroyed every frame.
const _particleMatPools = { blood: [], fireOrange: [], fireYellow: [], spark: [], dust: [], toxic: [] };
function _getParticleMat(poolKey, color) {
  const pool = _particleMatPools[poolKey];
  if (pool.length > 0) {
    const m = pool.pop();
    m.opacity = 1;
    m.visible = true;
    return m;
  }
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1, depthWrite: false });
}
function _returnParticleMat(poolKey, mat) {
  if (_particleMatPools[poolKey].length < 200) _particleMatPools[poolKey].push(mat);
  else mat.dispose();
}

/** Persistent ground-blood decals pool. Each kill drops one; old ones fade and
 *  recycle when the cap is hit so the scene never accumulates unbounded meshes. */
const MAX_BLOOD_DECALS = 40;
const bloodDecals = [];

/** Reusable Vector3 pool to reduce per-frame GC pressure. */
const _v3Pool = Array.from({ length: 64 }, () => new THREE.Vector3());
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
const groundChunkMap = new Map();
const trees = [];
const structureGroups = [];
const cityPropGroups = [];
const visionBlockers = [];
const visibleVisionBlockers = [];

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
  // The city GLBs reference a shared texture folder by relative URI.
  // Pin the resource path so those texture lookups resolve correctly when
  // Vite serves the app from a relative base path.
  loader.setResourcePath(path);
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
            if (mat.map) {
              mat.map.colorSpace = THREE.SRGBColorSpace;
              mat.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
              mat.map.minFilter = THREE.LinearMipmapLinearFilter;
              mat.map.magFilter = THREE.LinearFilter;
            }
            if (mat.emissiveMap) {
              mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
              mat.emissiveMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
            }
            for (const key of ["normalMap", "roughnessMap", "metalnessMap", "aoMap"]) {
              if (mat[key]) {
                mat[key].anisotropy = renderer.capabilities.getMaxAnisotropy();
                mat[key].minFilter = THREE.LinearMipmapLinearFilter;
              }
            }
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
const chunkRadius = 4;
const chunkGeometry = new THREE.PlaneGeometry(chunkSize, chunkSize, 24, 24);
const CHUNK_STREAM_BUDGET = 4;
const CHUNK_PREWARM_BUDGET = 20;
const CHUNK_STREAM_BOOST_SECONDS = 8;
const MAX_VALID_WORLD_ABS = chunkSize * (chunkRadius + 1) * 8;

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
  dayDuration: 720,
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
let turretCount = 0;
let isNight = false;
let hordeNightActive = false;
let hordeNightTimer = 0;
let bossAlive = false;
let footstepTimer = 0;
let lowAmmoWarning = false;
let lastDamageTime = -999;
const grenades = [];
const arrows = [];
const rockets = [];
const flamePuffs = [];
const molotovProjectiles = [];
const molotovFires = [];
const landMines = [];
const spikeTraps = [];
const turrets = [];
const toxicBarrels = [];
const lootCrates = [];
const particles = [];
const barrels = [];
const acidPuddles = [];
const acidProjectiles = [];
const zombieCorpses = [];
const distractions = [];
const flyingDistractions = [];
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
let lastStreamChunkX = Number.NaN;
let lastStreamChunkZ = Number.NaN;
let minimapRefreshTimer = 0;
let weaponHudRefreshTimer = 0;
let missionHudRefreshTimer = 0;
let objectiveCompassRefreshTimer = 0;
let visibleVisionBlockersRefreshTimer = 0;
let zombieAiUpdateCursor = 0;
let zombieSeparationCursor = 0;
let hudStatsRefreshTimer = 0;
let enemyHealthBarsRefreshTimer = 0;
let adaptiveQualityPollTimer = 0;
let adaptiveQualityRecoverTimer = 0;
let nextChunkMaintenanceAt = 0;
let chunkStreamingBoostUntil = 0;
let frameBudgetDebt = 0;
const lastSafePlayerPosition = new THREE.Vector3(0, 1.8, 0);
let allowSpawnPositionUntil = 0;
const playerProgression = loadProgression();

/** Scavenging / Crafting materials */
const materials = {
  scrap: 0,
  wood: 0,
  metal: 0,
  cloth: 0,
  chemicals: 0,
};

/** Weather system state — owned by ./world/weather.js */
const weatherState = createWeather(scene);

const adaptiveQuality = {
  level: 0,
  pixelRatios: [Math.min(window.devicePixelRatio, 1.25), 1, 0.85],
  shadowsEnabled: true,
  frameSamples: [],
  averageFrameMs: 16.7,
};

function getAdaptivePixelRatio() {
  const maxRatio = adaptiveQuality.pixelRatios[Math.min(adaptiveQuality.level, adaptiveQuality.pixelRatios.length - 1)];
  return Math.min(window.devicePixelRatio, maxRatio);
}

function applyAdaptiveQuality() {
  renderer.setPixelRatio(getAdaptivePixelRatio());
  const enableShadows = adaptiveQuality.level < 2;
  if (adaptiveQuality.shadowsEnabled !== enableShadows) {
    adaptiveQuality.shadowsEnabled = enableShadows;
    renderer.shadowMap.enabled = enableShadows;
    sun.castShadow = enableShadows;
  }
}

function sampleFrameTime(frameDt) {
  const frameMs = frameDt * 1000;
  if (!Number.isFinite(frameMs) || frameMs <= 0) return;
  const samples = adaptiveQuality.frameSamples;
  samples.push(frameMs);
  if (samples.length > 60) samples.shift();
  let total = 0;
  for (let i = 0; i < samples.length; i += 1) total += samples[i];
  adaptiveQuality.averageFrameMs = total / samples.length;
}

function updateAdaptiveQuality(frameDt) {
  sampleFrameTime(frameDt);
  adaptiveQualityPollTimer -= frameDt;
  adaptiveQualityRecoverTimer -= frameDt;
  if (adaptiveQualityPollTimer > 0) return;
  adaptiveQualityPollTimer = 0.4;

  if (adaptiveQuality.averageFrameMs > 24 && adaptiveQuality.level < 2) {
    adaptiveQuality.level += 1;
    adaptiveQualityRecoverTimer = 4;
    applyAdaptiveQuality();
    return;
  }

  if (adaptiveQuality.averageFrameMs < 17.5 && adaptiveQuality.level > 0 && adaptiveQualityRecoverTimer <= 0) {
    adaptiveQuality.level -= 1;
    adaptiveQualityRecoverTimer = 3;
    applyAdaptiveQuality();
  }
}

function refreshVisibleVisionBlockers() {
  visibleVisionBlockers.length = 0;
  const origin = activeVehicle ? activeVehicle.mesh.position : player.position;
  const maxDistanceSq = 85 * 85;
  const maxBlockers = 220;
  for (let i = 0; i < visionBlockers.length; i += 1) {
    const blocker = visionBlockers[i];
    if (!blocker?.parent && blocker !== camera) continue;
    const pos = blocker.position || blocker.getWorldPosition?.(getV3());
    if (!pos) continue;
    const dx = pos.x - origin.x;
    const dz = pos.z - origin.z;
    if (dx * dx + dz * dz <= maxDistanceSq) {
      visibleVisionBlockers.push(blocker);
      if (visibleVisionBlockers.length >= maxBlockers) break;
    }
  }
}

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
let vehicleInput = { forward: false, backward: false, left: false, right: false, brake: false };

const teammates = [];
/** Calm menu / death screen loop (distinct from in-game map tracks). */
const TITLE_BGM_FILE = "title.mp3";

/** Audio system state — all Web Audio nodes plus HTML5 BGM bookkeeping.
 *  Implementation lives in ./audio/engine.js; this is just the data. */
const audioSystem = createAudioState();

// Re-exported via weaponSystem.js imports at top of file.

function clearInputState() {
  keys.clear();
  isADS = false;
  mouseLeftHeld = false;
  vehicleInput = { forward: false, backward: false, left: false, right: false, brake: false };
}

// Global registry of in-flight timers so we can cancel them on reset.
const pendingTimeouts = new Set();
const pendingIntervals = new Set();
function clearPendingTimers() {
  for (const id of pendingTimeouts) clearTimeout(id);
  pendingTimeouts.clear();
  for (const id of pendingIntervals) clearInterval(id);
  pendingIntervals.clear();
}

/** Centralised player-death path — every fatal hit goes through here. */
function killPlayer(reason = "You died.") {
  if (gameOver) return;
  player.hp = 0;
  gameOver = true;
  if (activeVehicle) exitVehicle();
  clearInputState();
  player.shootCooldown = 0;
  player.reloadTimer = 0;
  messageEl.textContent = reason;
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  setMenuMode("death");
}

/** Returns true if the straight segment A→B is blocked by any visionBlocker. */
const _segDir = new THREE.Vector3();
const _segRay = new THREE.Raycaster();
function segmentBlockedByScenery(from, to) {
  _segDir.subVectors(to, from);
  const dist = _segDir.length();
  if (dist <= 0.0001) return false;
  _segDir.normalize();
  _segRay.set(from, _segDir);
  _segRay.far = dist;
  return _segRay.intersectObjects(visibleVisionBlockers, true).length > 0;
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
  persistMutedFlag(audioSystem.muted);
  applyBgmVolumeEngine(audioSystem);
  if (!audioSystem.muted) {
    if (audioSystem.unlocked) setAudioScene(gameState === "PLAYING" ? "playing" : gameState === "MENU_PAUSE" ? "pause" : "title");
    if (audioSystem.bgmEl?.src) audioSystem.bgmEl.play().catch(() => {});
  } else {
    audioSystem.bgmEl?.pause();
  }
  updateAudioButtonLabel();
}

async function ensureAudioUnlocked() {
  const ok = await ensureAudioUnlockedEngine(audioSystem);
  if (!ok) return;
  if (gameState === "PLAYING") setAudioScene("playing");
  else if (gameState === "MENU_DEATH") setAudioScene("death");
  else if (gameState === "MENU_PAUSE") setAudioScene("pause");
  else setAudioScene("title");
}

// ─── Audio wrappers ───────────────────────────────────────────────────────────
// Implementation lives in ./audio/engine.js. Wrappers below glue the engine
// to game state (camera, gameState, activeMapConfig) without leaking those
// dependencies into the engine module.

function playNoise(duration, gainNode, options) { playNoiseEngine(audioSystem, duration, gainNode, options); }
function playTone(freq, duration, gainNode, options) { playToneEngine(audioSystem, freq, duration, gainNode, options); }
function playSpatialSfx(name, worldPosition, volume = 1) { playSpatialSfxEngine(audioSystem, camera, name, worldPosition, volume); }
function playSfx(name, volume = 1) { playSfxEngine(audioSystem, name, volume); }
function startTitleMusicFallback() { startTitleMusicFallbackEngine(audioSystem); }
function startAmbientLoop() { startAmbientLoopEngine(audioSystem); }
function stopAmbientLoop() { stopAmbientLoopEngine(audioSystem); }
function stopTitleMusic() { stopTitleMusicEngine(audioSystem); }
function stopHtmlBgmHard() { stopHtmlBgmHardEngine(audioSystem); }

/** Fallback handler invoked by the engine when an MP3 fails to load/play.
 *  Project ships without all BGM tracks, so we degrade to procedural audio. */
function onBgmLoadError(filename) {
  if (filename === TITLE_BGM_FILE) startTitleMusicFallback();
  else startAmbientLoop();
}

function playHtmlBgm(filename) { return playHtmlBgmEngine(audioSystem, filename, onBgmLoadError); }

function setAudioScene(mode) {
  if (!audioSystem.unlocked) return;
  stopAmbientLoop();
  if (audioSystem.titleTimer) {
    clearInterval(audioSystem.titleTimer);
    audioSystem.titleTimer = null;
  }
  if (mode === "title" || mode === "death") {
    void playHtmlBgm(TITLE_BGM_FILE);
  } else if (mode === "pause" || mode === "playing") {
    void playHtmlBgm(activeMapConfig.bgm);
  }
}

function setMenuMode(mode) {
  menuOverlayEl.inert = false;
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

    // ─── High score persistence ────────────────────────────────────────
    const prevBest = parseInt(localStorage.getItem("zowg_highscore") || "0", 10);
    const isNewRecord = score > prevBest;
    if (isNewRecord) localStorage.setItem("zowg_highscore", String(score));
    const prevBestWave = parseInt(localStorage.getItem("zowg_highwave") || "0", 10);
    if (wave > prevBestWave) localStorage.setItem("zowg_highwave", String(wave));
    const prevBestKills = parseInt(localStorage.getItem("zowg_highkills") || "0", 10);
    if (player.kills > prevBestKills) localStorage.setItem("zowg_highkills", String(player.kills));

    let progMsg = `Wave ${wave} | Kills ${player.kills} | Score ${score}`;
    if (isNewRecord) progMsg += " ★ NEW HIGH SCORE!";
    progMsg += ` | Best: ${Math.max(score, prevBest)} | +${runXP} Global XP`;
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
  menuOverlayEl.inert = true;
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  canvas.focus({ preventScroll: true });
  setAudioScene("playing");
}

// ─── Save / Load Progress ────────────────────────────────────────────────────
function hasSavedRun() {
  try { return localStorage.getItem("zowg_save") !== null; } catch { return false; }
}

function saveRun() {
  if (gameState !== "PLAYING" || gameOver) return;
  const save = {
    wave,
    score,
    playerKills: player.kills,
    playerHp: player.hp,
    playerStamina: player.stamina,
    playerPosition: player.position.toArray(),
    playerYaw: player.yaw,
    playerPitch: player.pitch,
    gameTime,
    materials,
    skills,
    skillPoints,
    skillXp,
    grenadeCount,
    molotovCount,
    landMineCount,
    spikeTrapCount,
    turretCount,
    noiseMakerCount,
    activeMapId: activeMapConfig.id,
    weapons: player.weapons.map(w => ({ name: w.name, ammo: w.ammo, reserve: w.reserve, upgrades: w.upgrades })),
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
    wave = save.wave ?? 1;
    score = save.score ?? 0;
    player.kills = save.playerKills ?? 0;
    player.hp = save.playerHp ?? 100;
    player.stamina = save.playerStamina ?? 100;
    if (Array.isArray(save.playerPosition) && save.playerPosition.length >= 3) {
      const [x, y, z] = save.playerPosition;
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        const clampedX = THREE.MathUtils.clamp(x, -MAX_VALID_WORLD_ABS, MAX_VALID_WORLD_ABS);
        const clampedZ = THREE.MathUtils.clamp(z, -MAX_VALID_WORLD_ABS, MAX_VALID_WORLD_ABS);
        const safeY = Number.isFinite(y) ? y : terrainHeight(clampedX, clampedZ) + getPlayerEyeHeight();
        player.position.set(clampedX, safeY, clampedZ);
        clampPlayerToTerrainFloor();
        markSpawnPositionAllowed();
        lastStreamChunkX = Number.NaN;
        lastStreamChunkZ = Number.NaN;
        chunkStreamingBoostUntil = gameTime + CHUNK_STREAM_BOOST_SECONDS;
        ensureChunks(CHUNK_PREWARM_BUDGET);
      }
    }
    player.yaw = Number.isFinite(save.playerYaw) ? save.playerYaw : player.yaw;
    player.pitch = Number.isFinite(save.playerPitch) ? save.playerPitch : player.pitch;
    gameTime = save.gameTime ?? 0;
    Object.assign(materials, save.materials || materials);
    Object.keys(skills).forEach(k => {
      if (save.skills && save.skills[k]) {
        skills[k].level = save.skills[k].level ?? 0;
        skills[k].value = save.skills[k].value ?? 0;
      }
    });
    skillPoints = save.skillPoints ?? 0;
    skillXp = save.skillXp ?? 0;
    grenadeCount = save.grenadeCount ?? 3;
    molotovCount = save.molotovCount ?? 0;
    landMineCount = save.landMineCount ?? 0;
    spikeTrapCount = save.spikeTrapCount ?? 0;
    turretCount = save.turretCount ?? 0;
    noiseMakerCount = save.noiseMakerCount ?? 2;
    if (save.weapons) {
      for (let i = 0; i < Math.min(save.weapons.length, player.weapons.length); i++) {
        player.weapons[i].ammo = save.weapons[i].ammo ?? player.weapons[i].ammo;
        player.weapons[i].reserve = save.weapons[i].reserve ?? player.weapons[i].reserve;
        if (save.weapons[i].upgrades) {
          player.weapons[i].upgrades = { ...save.weapons[i].upgrades };
        }
      }
    }
    player.activeWeapon = save.activeWeapon ?? 0;
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

/** Asset bag passed to ./entities/zombie.js — keeps the module pure while
 *  reusing every shared material & geometry instance the engine already owns. */
const zombieAssets = {
  geometries: { box: gBox1x1x1, sphere: gSphere1, sphereLow: gSphereLow },
  materials: {
    skin: zombieSkinMaterial,
    cloth: zombieClothMaterial,
    blood: zombieBloodMaterial,
    spitterSkin: spitterSkinMat,
    spitterCloth: spitterClothMat,
    acidSac: acidSacMat,
    hunterSkin: hunterSkinMat,
    hunterCloth: hunterClothMat,
    chargerSkin: chargerSkinMat,
    chargerCloth: chargerClothMat,
    juggernautSkin: juggernautSkinMat,
    juggernautCloth: juggernautClothMat,
    juggernautArmor: juggernautArmorMat,
    boomerSkin: boomerSkinMat,
    boomerCloth: boomerClothMat,
    boomerBloat: boomerBloatMat,
    screamerSkin: screamerSkinMat,
    screamerCloth: screamerClothMat,
    eyes: eyeMaterials,
  },
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
  // Free any procedurally-generated canvas textures from the previous map.
  if (groundDiffuse && groundDiffuse.dispose) {
    groundDiffuse.dispose();
    groundDiffuse = null;
  }
  if (cityStreetDiffuse && cityStreetDiffuse.dispose) {
    cityStreetDiffuse.dispose();
    cityStreetDiffuse = null;
  }

  if (activeMapConfig.useCityGroundTexture) {
    // Outbreak City — prefer PBR asphalt, fallback to procedural asphalt.
    if (isTextureReady(asphaltPbr.map)) {
      groundMaterial.map = asphaltPbr.map;
      groundMaterial.normalMap = asphaltPbr.normalMap;
      groundMaterial.roughnessMap = asphaltPbr.roughnessMap;
      groundMaterial.normalScale = new THREE.Vector2(0.6, 0.6);
      groundMaterial.roughness = 1.0;
      groundMaterial.metalness = 0.0;
      groundMaterial.color.setHex(0x9b9ea4);
    } else {
      cityStreetDiffuse = createCityStreetGroundTexture();
      groundMaterial.map = cityStreetDiffuse;
      groundMaterial.normalMap = null;
      groundMaterial.roughnessMap = null;
      groundMaterial.roughness = 0.98;
      groundMaterial.metalness = 0.02;
      groundMaterial.color.setHex(0x8f9399);
    }
  } else if (activeMapConfig.id === "badlands") {
    // Badlands — prefer PBR dirt/mud, fallback to procedural texture.
    if (isTextureReady(dirtPbr.map)) {
      groundMaterial.map = dirtPbr.map;
      groundMaterial.normalMap = dirtPbr.normalMap;
      groundMaterial.roughnessMap = dirtPbr.roughnessMap;
      groundMaterial.normalScale = new THREE.Vector2(0.8, 0.8);
      groundMaterial.roughness = 1.0;
      groundMaterial.metalness = 0.0;
      groundMaterial.color.setHex(activeMapConfig.groundTint);
    } else {
      groundDiffuse = createGroundTextureForMap(activeMapConfig, grassGroundDiffuse);
      groundMaterial.map = groundDiffuse;
      groundMaterial.normalMap = null;
      groundMaterial.roughnessMap = null;
      groundMaterial.roughness = 0.95;
      groundMaterial.metalness = 0;
      groundMaterial.color.setHex(activeMapConfig.groundTint);
    }
  } else {
    // Other maps still use the procedural canvas texture (grass / frost / etc).
    groundDiffuse = createGroundTextureForMap(
      activeMapConfig,
      grassGroundDiffuse?.image?.complete ? grassGroundDiffuse : null,
    );
    groundMaterial.map = groundDiffuse;
    groundMaterial.normalMap = null;
    groundMaterial.roughnessMap = null;
    groundMaterial.roughness = 0.95;
    groundMaterial.metalness = 0;
    groundMaterial.color.setHex(activeMapConfig.groundTint);
  }
  groundMaterial.needsUpdate = true;
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

  const smgGroup = createSmgMesh(gunMetalMaterial, gunGripMaterial);
  smgGroup.scale.setScalar(0.95);
  smgGroup.visible = false;

  const revolverGroup = createRevolverMesh(gunMetalMaterial, gunGripMaterial);
  revolverGroup.scale.setScalar(1.05);
  revolverGroup.visible = false;

  const minigunGroup = createMinigunMesh(gunMetalMaterial, gunGripMaterial);
  minigunGroup.scale.setScalar(0.9);
  minigunGroup.visible = false;

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
    smgGroup,
    revolverGroup,
    minigunGroup,
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
    smgGroup,
    revolverGroup,
    minigunGroup,
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
      { name: "Rifle", ammoType: "5.56 AP", ammo: 30, reserve: 240, magSize: 30, damage: 20, fireDelay: 0.16, range: 32, preferredRange: 18, bulletSpeed: 82, pierce: 1 },
      { name: "Pistol", ammoType: "9mm HP", ammo: 15, reserve: 180, magSize: 15, damage: 14, fireDelay: 0.28, range: 18, preferredRange: 10, bulletSpeed: 72, critChance: 0.12, critMultiplier: 1.6 },
      { name: "Shotgun", ammoType: "12g Buck", ammo: 8, reserve: 40, magSize: 8, damage: 18, fireDelay: 0.78, range: 25, preferredRange: 12, bulletSpeed: 64, pellets: 10, stagger: 0.2 },
    ],
    visionRange: 34,
    loseRange: 42,
    visionFovCos: Math.cos(THREE.MathUtils.degToRad(72)),
    currentTarget: null,
    targetMemory: 0,
    lastKnownTargetPosition: new THREE.Vector3(),
    walkPhase: Math.random() * Math.PI * 2,
    hp: 100,
    maxHp: 100,
    downed: false,
    downedTimer: 0,
    reviveTimer: 0,
    beingRevived: false,
  };
}

// Thin wrappers around the pure helpers in ./world/terrain.js so the
// implementation has one home but call sites don't have to thread mapConfig.
function noise2D(x, z) { return terrainNoise2D(x, z, activeMapConfig.noiseFreq); }
function terrainHeight(x, z) { return terrainHeightFn(x, z, activeMapConfig); }

function getPlayerEyeHeight() {
  return isCrouching ? 1.1 : 1.8;
}

function clampPlayerToTerrainFloor() {
  const floor = terrainHeight(player.position.x, player.position.z) + getPlayerEyeHeight();
  if (player.position.y < floor) {
    player.position.y = floor;
    player.velocityY = 0;
    player.isGrounded = true;
  }
  return floor;
}

function markSpawnPositionAllowed(duration = 0.75) {
  allowSpawnPositionUntil = gameTime + duration;
  lastSafePlayerPosition.copy(player.position);
}

function updateLastSafePlayerPosition() {
  if (gameState !== "PLAYING" || gameOver || activeVehicle) return;
  if (!Number.isFinite(player.position.x) || !Number.isFinite(player.position.y) || !Number.isFinite(player.position.z)) return;
  lastSafePlayerPosition.copy(player.position);
}

function preventUnexpectedSpawnTeleport() {
  if (gameState !== "PLAYING" || gameOver || activeVehicle) return;
  if (gameTime <= allowSpawnPositionUntil) return;
  const nearSpawnNow = Math.hypot(player.position.x, player.position.z) < 3;
  const wasAwayFromSpawn = Math.hypot(lastSafePlayerPosition.x, lastSafePlayerPosition.z) > 12;
  const snappedFar = player.position.distanceTo(lastSafePlayerPosition) > 10;
  if (nearSpawnNow && wasAwayFromSpawn && snappedFar) {
    player.position.copy(lastSafePlayerPosition);
    clampPlayerToTerrainFloor();
    lastStreamChunkX = Number.NaN;
    lastStreamChunkZ = Number.NaN;
    chunkStreamingBoostUntil = gameTime + CHUNK_STREAM_BOOST_SECONDS;
    ensureChunks();
    camera.position.set(player.position.x, player.position.y, player.position.z);
    messageEl.textContent = "Blocked a bad spawn teleport.";
  }
}

function terrainNormal(x, z) { return terrainNormalFn(x, z, activeMapConfig); }

function isTextureReady(tex) {
  return !!(tex && tex.image && tex.image.complete && tex.image.width > 0);
}

function hasMissingChunksAround(pcx, pcz) {
  for (let x = pcx - chunkRadius; x <= pcx + chunkRadius; x += 1) {
    for (let z = pcz - chunkRadius; z <= pcz + chunkRadius; z += 1) {
      if (!groundChunkMap.has(`${x},${z}`)) return true;
    }
  }
  return false;
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

  // Pick brick or concrete for the wall (50/50) — gives the world variety.
  const useBrick = Math.random() < 0.5;
  const wallPbr = useBrick ? brickPbr : concretePbr;
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(8 + Math.random() * 8, 4 + Math.random() * 3, 8 + Math.random() * 8),
    new THREE.MeshStandardMaterial({
      map: wallPbr.map,
      normalMap: wallPbr.normalMap,
      roughnessMap: wallPbr.roughnessMap,
      color: useBrick ? 0xb89080 : 0x9a9c9f,
      roughness: 1.0,
      metalness: 0.05,
    }),
  );
  base.position.y = base.geometry.parameters.height * 0.5;
  base.castShadow = true;
  base.receiveShadow = true;

  // Roof — weathered wood planks (Polyhaven CC0).
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(base.geometry.parameters.width * 0.62, 2, 4),
    new THREE.MeshStandardMaterial({
      map: woodPlanksPbr.map,
      normalMap: woodPlanksPbr.normalMap,
      roughnessMap: woodPlanksPbr.roughnessMap,
      color: 0x6b4a2e,
      roughness: 1.0,
      metalness: 0.0,
    }),
  );
  roof.position.y = base.position.y + base.geometry.parameters.height * 0.5 + 1.2;
  roof.rotation.y = Math.PI * 0.25;
  roof.castShadow = true;

  group.add(base, roof);
  scene.add(group);
  visionBlockers.push(base, roof);
  structureGroups.push(group);
  group.userData.visionChildren = [base, roof];
  registerStaticCollider(group, 0.15, "structure");

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
  const chunkKey = `${cx},${cz}`;
  if (groundChunkMap.has(chunkKey)) return;
  const mesh = new THREE.Mesh(chunkGeometry.clone(), groundMaterial);
  mesh.rotation.x = -Math.PI / 2;
  mesh.receiveShadow = true;
  mesh.position.set(cx * chunkSize, 0, cz * chunkSize);

  const positions = mesh.geometry.attributes.position;
  const normals = mesh.geometry.attributes.normal;
  for (let i = 0; i < positions.count; i += 1) {
    const vx = positions.getX(i) + mesh.position.x;
    const vz = mesh.position.z - positions.getY(i);
    const h = terrainHeight(vx, vz);
    positions.setZ(i, h);

    // Rotate world normal by +90deg around X into plane-local normal without allocations.
    const worldNormal = terrainNormal(vx, vz);
    normals.setXYZ(i, worldNormal.x, -worldNormal.z, worldNormal.y);
  }
  positions.needsUpdate = true;
  normals.needsUpdate = true;
  scene.add(mesh);
  const chunkRecord = { cx, cz, mesh, key: chunkKey };
  groundChunks.push(chunkRecord);
  groundChunkMap.set(chunkKey, chunkRecord);

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
    const n = Math.max(1, Math.floor((activeMapConfig.cityBuildingsPerChunk || 0) * 0.6));
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
      registerStaticCollider(holder, 0.2, "cityBuilding");
    }
  }

  // Drop GLB world props on top of the chunk (vehicles + survival clutter +
  // street furniture). Only on the city map; other maps stay procedural.
  if (activeMapConfig.id === "outbreak_city") {
    placeMapProps(cx, cz);
  }
}

/** Spawn a curated mix of GLB props on a city chunk: cars on the streets,
 *  barrels/crates near building edges, lamps + cones for street furniture.
 *  Each call schedules ~10 async spawns; spawnModel caches GLB templates so
 *  only the FIRST chunk pays the load cost — every subsequent chunk reuses
 *  the cached template. Spawns are skipped if a prop would collide with the
 *  player spawn area (radius 18m around origin). */
function placeMapProps(cx, cz) {
  const vehicles = ["sedan", "suv", "police", "taxi", "van", "ambulance",
                    "garbage_truck", "firetruck", "delivery_truck", "hatchback", "truck"];
  const heavyProps = ["barrel", "barrel_open", "crate", "crate_large", "chest", "workbench"];
  const barricades = ["fence", "fence_fortified", "fence_doorway", "road_barrier", "metal_panel"];
  const decor = ["cone", "street_lamp", "street_lamp_curve", "highway_sign", "signpost",
                 "road_light", "debris_tire", "debris_door", "debris_bumper",
                 "campfire", "tent", "rock_a", "rock_b"];

  const cellOriginX = cx * chunkSize;
  const cellOriginZ = cz * chunkSize;
  const half = chunkSize * 0.5;

  // Vehicles — 2-3 per chunk, parked along streets at random rotations.
  const vehicleCount = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < vehicleCount; i += 1) {
    const id = vehicles[Math.floor(Math.random() * vehicles.length)];
    const x = cellOriginX + (Math.random() - 0.5) * (chunkSize - 8);
    const z = cellOriginZ + (Math.random() - 0.5) * (chunkSize - 8);
    if (Math.hypot(x, z) < 18 || !isCircleClearOfStatics(x, z, 2.5)) continue;
    spawnPropAt(id, x, z, Math.random() * Math.PI * 2);
  }

  // Heavy props — 3-5 per chunk.
  const heavyCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < heavyCount; i += 1) {
    const id = heavyProps[Math.floor(Math.random() * heavyProps.length)];
    const x = cellOriginX + (Math.random() - 0.5) * (chunkSize - 4);
    const z = cellOriginZ + (Math.random() - 0.5) * (chunkSize - 4);
    if (Math.hypot(x, z) < 14 || !isCircleClearOfStatics(x, z, 1.5)) continue;
    spawnPropAt(id, x, z, Math.random() * Math.PI * 2);
  }

  // Barricades — 1-2 per chunk (fences strewn around).
  const barricadeCount = Math.random() < 0.6 ? 1 : 0;
  for (let i = 0; i < barricadeCount; i += 1) {
    const id = barricades[Math.floor(Math.random() * barricades.length)];
    const x = cellOriginX + (Math.random() - 0.5) * (chunkSize - 4);
    const z = cellOriginZ + (Math.random() - 0.5) * (chunkSize - 4);
    if (Math.hypot(x, z) < 14 || !isCircleClearOfStatics(x, z, 1.5)) continue;
    spawnPropAt(id, x, z, Math.random() * Math.PI * 2);
  }

  // Decor — 4-6 per chunk (cones, lamps, debris). Cheap, no colliders for most.
  const decorCount = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < decorCount; i += 1) {
    const id = decor[Math.floor(Math.random() * decor.length)];
    const x = cellOriginX + (Math.random() - 0.5) * (chunkSize - 2);
    const z = cellOriginZ + (Math.random() - 0.5) * (chunkSize - 2);
    if (Math.hypot(x, z) < 12 || !isCircleClearOfStatics(x, z, 1.0)) continue;
    spawnPropAt(id, x, z, Math.random() * Math.PI * 2);
  }

  // Toxic barrels — ~30% chance per chunk, 1 barrel
  if (Math.random() < 0.3) {
    const x = cellOriginX + (Math.random() - 0.5) * (chunkSize - 6);
    const z = cellOriginZ + (Math.random() - 0.5) * (chunkSize - 6);
    if (Math.hypot(x, z) >= 16 && isCircleClearOfStatics(x, z, 1.5)) {
      spawnToxicBarrel(x, z);
    }
  }

  // Loot crates — ~25% chance per chunk, 1 crate
  if (Math.random() < 0.25) {
    const x = cellOriginX + (Math.random() - 0.5) * (chunkSize - 6);
    const z = cellOriginZ + (Math.random() - 0.5) * (chunkSize - 6);
    if (Math.hypot(x, z) >= 20 && isCircleClearOfStatics(x, z, 1.2)) {
      spawnLootCrate(x, z);
    }
  }
}

/** Spawn a single GLB prop at world (x, z) using the registry. The prop is
 *  added to cityPropGroups so it gets cleaned up when the chunk unloads, and
 *  registered as a static collider if the registry entry has a collider. */
function spawnPropAt(id, x, z, yaw) {
  const y = terrainHeight(x, z);
  spawnModel(id, scene, { x, y, z, yaw }).then((group) => {
    if (!group) return;
    // City clutter shadows are expensive and add little gameplay value.
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) obj.castShadow = false;
    });
    cityPropGroups.push(group);
    // Block sight + bullets on solid props (vehicles, barrels, fences).
    const def = getModelDef(id);
    if (def && def.collider) {
      visionBlockers.push(group);
      registerStaticCollider(group, def.collider.radius || 0.5, id);
    }
  }).catch(() => { /* swallow — file may be missing while user is iterating */ });
}

function ensureChunks(maxCreates = CHUNK_STREAM_BUDGET) {
  const pcx = Math.floor(player.position.x / chunkSize);
  const pcz = Math.floor(player.position.z / chunkSize);
  let created = 0;

  // Build chunks center-out so terrain under/near the player appears first.
  for (let r = 0; r <= chunkRadius && created < maxCreates; r += 1) {
    for (let dx = -r; dx <= r && created < maxCreates; dx += 1) {
      for (let dz = -r; dz <= r && created < maxCreates; dz += 1) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        const x = pcx + dx;
        const z = pcz + dz;
        const key = `${x},${z}`;
        if (!groundChunkMap.has(key)) {
          makeChunk(x, z);
          created += 1;
        }
      }
    }
  }
  // Unload chunks that moved out of range
  for (let i = groundChunks.length - 1; i >= 0; i -= 1) {
    const c = groundChunks[i];
    if (Math.abs(c.cx - pcx) > chunkRadius + 1 || Math.abs(c.cz - pcz) > chunkRadius + 1) {
      scene.remove(c.mesh);
      c.mesh.geometry?.dispose();
      groundChunkMap.delete(c.key);
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
      // Clean visionBlockers — structures push `base` and `roof` (vision children), not the group itself.
      const visChildren = g.userData?.visionChildren || [g];
      for (let j = visionBlockers.length - 1; j >= 0; j--) {
        if (visChildren.includes(visionBlockers[j]) || visionBlockers[j] === g) {
          visionBlockers.splice(j, 1);
        }
      }
      removeStaticCollider(g);
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
      for (let j = visionBlockers.length - 1; j >= 0; j--) {
        if (visionBlockers[j] === g) visionBlockers.splice(j, 1);
      }
      removeStaticCollider(g);
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

/** Dispose a one-off runtime object and all owned materials/geometries.
 *  Skips geometries marked preventDispose (shared pool assets). */
function disposeOwnedObject3D(obj) {
  obj.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      if (!o.geometry?.userData?.preventDispose) o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
      for (const m of mats) m?.dispose?.();
    }
  });
}

function buildMapSelectUi() {
  if (!mapGridEl) {
    console.warn("[DeadTakeover] buildMapSelectUi: map-grid element not found");
    return;
  }
  try {
    mapGridEl.innerHTML = "";
    for (const m of WORLD_MAPS) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "map-chip";
      b.dataset.mapId = m.id;
      b.innerHTML = `<span class="map-chip-name">${m.name}</span><span class="map-chip-blurb">${m.blurb}</span>`;
      b.addEventListener("click", async () => {
        pendingMapId = m.id;
        try { localStorage.setItem("zowg_map", pendingMapId); } catch {}
        mapDirty = pendingMapId !== activeMapConfig.id;
        if (m.id === "outbreak_city") {
          try { await loadCityBuildingLibrary(); } catch {}
        }
        buildMapSelectUi();
      });
      if (m.id === pendingMapId) b.classList.add("is-active-map");
      mapGridEl.appendChild(b);
    }
  } catch (uiErr) {
    console.error("[DeadTakeover] buildMapSelectUi error:", uiErr);
  }
}

function resetWorldForNewMap() {
  if (gameState === "PLAYING") return;
  // Cancel all in-flight timers (boss spawn setTimeout, acid spit intervals, etc.)
  clearPendingTimers();
  // Wipe the static collider table — every world object will be re-registered at spawn.
  staticColliders.length = 0;
  for (const c of groundChunks) {
    scene.remove(c.mesh);
    c.mesh.geometry.dispose();
  }
  groundChunks.length = 0;
  groundChunkMap.clear();
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
  markSpawnPositionAllowed();
  player.hp = 100;
  player.stamina = 100;
  player.yaw = Math.PI;
  player.pitch = 0;
  player.velocityY = 0;
  player.moveVelocity.set(0, 0, 0);
  player.damageFlash = 0;
  player.reloadTimer = 0;
  // Force a fresh stream pass after teleport/reset.
  lastStreamChunkX = Number.NaN;
  lastStreamChunkZ = Number.NaN;
  chunkStreamingBoostUntil = gameTime + CHUNK_STREAM_BOOST_SECONDS;
  player.shootCooldown = 0;
  player.bobTime = 0;
  player.activeWeapon = 0;
  mouseLeftHeld = false;
  keys.clear();
  gameState = "MENU_TITLE";
  gameOver = false;
  paused = false;
  inventoryOpen = false;
  upgradeBenchOpen = false;
  wave = 1;
  waveSpawnBudget = 24;
  nextWaveTimer = 0;
  spawnTimer = 0;
  gameTime = 0;
  lastDamageTime = -999;
  player.kills = 0;
  const defaults = initDefaultWeapons();
  for (let i = 0; i < Math.min(player.weapons.length, defaults.length); i++) {
    player.weapons[i].ammo = defaults[i].ammo;
    player.weapons[i].reserve = defaults[i].reserve;
    player.weapons[i].upgrades = {};
  }
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
  turretCount = 0;
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
  for (const f of flamePuffs) { scene.remove(f.mesh); _returnFlamePuffMat(f.mesh.material); }
  flamePuffs.length = 0;
  for (const mp of molotovProjectiles) { scene.remove(mp.mesh); disposeOwnedObject3D(mp.mesh); }
  molotovProjectiles.length = 0;
  for (const f of molotovFires) { scene.remove(f.mesh); disposeOwnedObject3D(f.mesh); }
  molotovFires.length = 0;
  for (const m of landMines) { scene.remove(m.mesh); disposeOwnedObject3D(m.mesh); }
  landMines.length = 0;
  for (const s of spikeTraps) { scene.remove(s.mesh); disposeOwnedObject3D(s.mesh); }
  spikeTraps.length = 0;
  for (const t of turrets) { scene.remove(t.mesh); t.mesh.traverse((o) => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } }); }
  turrets.length = 0;
  for (const b of toxicBarrels) { scene.remove(b.mesh); b.mesh.traverse((o) => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } }); }
  toxicBarrels.length = 0;
  for (const c of toxicClouds) { scene.remove(c.mesh); scene.remove(c.light); c.mesh.geometry?.dispose(); c.mesh.material?.dispose(); c.light?.dispose(); }
  toxicClouds.length = 0;
  for (const l of lootCrates) { scene.remove(l.mesh); l.mesh.traverse((o) => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } }); }
  lootCrates.length = 0;
  _lootCratePromptShown = false;
  for (const p of particles) {
    scene.remove(p.mesh);
    p.mesh.geometry?.dispose();
    p.mesh.material?.dispose();
  }
  particles.length = 0;
  for (const d of bloodDecals) {
    scene.remove(d.mesh);
    d.mesh.material.dispose();
  }
  bloodDecals.length = 0;
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
  for (const ap of acidProjectiles) {
    scene.remove(ap.mesh);
  }
  acidProjectiles.length = 0;
  for (const c of zombieCorpses) {
    scene.remove(c.mesh);
    disposeObject3D(c.mesh);
  }
  zombieCorpses.length = 0;
  for (const dc of deathCollapses) {
    scene.remove(dc.mesh);
    disposeObject3D(dc.mesh);
  }
  deathCollapses.length = 0;
  for (const d of distractions) { d.active = false; scene.remove(d.mesh); disposeObject3D(d.mesh); }
  distractions.length = 0;
  flyingDistractions.length = 0;
  _supplyDropTimer = 0;
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
  vehicleInput = { forward: false, backward: false, left: false, right: false, brake: false };
  clearWeather();

  // Reset materials
  materials.scrap = 0; materials.wood = 0; materials.metal = 0;
  materials.cloth = 0; materials.chemicals = 0;

  // Reset event director state
  eventDirector.timer = 0;
  eventDirector.nextEventIn = 45 + Math.random() * 60;
  eventDirector.activeEvent = null;
  eventDirector.eventData = {};
  eventDirector.survivorTimer = 0;
  eventDirector.survivorActive = false;
  eventDirector.survivorPosition = null;
  eventDirector.survivorHP = 0;
  if (eventDirector.survivorMesh) {
    scene.remove(eventDirector.survivorMesh);
    eventDirector.survivorMesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry?.dispose();
        if (obj.material?.dispose) obj.material.dispose();
      }
    });
    eventDirector.survivorMesh = null;
  }
  for (const zone of eventDirector.toxicZones) {
    scene.remove(zone.mesh);
    zone.mesh.geometry?.dispose();
    zone.mesh.material?.dispose();
  }
  eventDirector.toxicZones = [];
  // New event state — tide / broadcast / camp.
  eventDirector.tideActive = false;
  eventDirector.tideTimer = 0;
  eventDirector.tideAngle = 0;
  eventDirector.tideSpawnAccumulator = 0;
  eventDirector.broadcastActive = false;
  eventDirector.broadcastTimer = 0;
  if (eventDirector.campActive) clearCamp(eventDirector, scene);

  // Reset mission generator state
  missionGenerator.activeMissions = [];
  missionGenerator.completedMissions = 0;
  missionGenerator.nextMissionId = 1;
  missionGenerator.timer = 0;
  missionGenerator.nextMissionIn = 30 + Math.random() * 30;

  applyActiveMapVisuals();
  applyAdaptiveQuality();
  ensureChunks(CHUNK_PREWARM_BUDGET);
  initWeather();
  updateDayNight();
  for (let i = 0; i < 8; i += 1) spawnZombieNearPlayer();
  for (let i = 0; i < 3; i += 1) {
    teammates.push(createTeammate(2 + i * 2.5, 2 + i, i, akTemplateRef, remingtonTemplateRef, pistolTemplateRef));
  }
  spawnVehiclesForMap();
}

function addZombie(x, z, forceType = null) {
  if (zombies.length >= settings.maxZombies) return null;
  const type = forceType || rollZombieType(wave);
  const isSpecial = SPECIAL_INFECTED_TYPES.includes(type);

  // Build the visual mesh (delegated to ./entities/zombie.js).
  const y = terrainHeight(x, z);
  const { group, leftArm, rightArm, leftLeg, rightLeg } = buildZombieMesh({
    type, x, y, z, assets: zombieAssets,
  });
  scene.add(group);

  // Stats — start from per-type baseline, then apply wave HP scaling.
  const base = zombieStatsForType(type, settings);
  let hp = base.hp;
  if (wave > 3) hp = Math.round(hp * (1 + (wave - 3) * 0.08));
  const maxHp = hp;

  zombies.push({
    mesh: group,
    leftArm, rightArm, leftLeg, rightLeg,
    type,
    hp, maxHp,
    speed: base.speed,
    damage: base.damage,
    baseSpeed: base.speed,
    baseDamage: base.damage,
    walkPhase: Math.random() * Math.PI * 2,
    attackTimer: 0,
    wanderSeed: Math.random() * 1000,
    isBoss: false,
    isSpecial,
    // Special infected ability cooldowns
    spitterCooldown: type === "spitter" ? 3 + Math.random() * 2 : 0,
    hunterCooldown: type === "hunter" ? 4 + Math.random() * 3 : 0,
    hunterLeaping: false,
    chargeCooldown: type === "charger" ? 5 + Math.random() * 3 : 0,
    isCharging: false,
    chargeTarget: null,
    chargeDirection: new THREE.Vector3(),
    attackAnimating: false,
    attackAnimTime: 0,
    screamCooldown: type === "screamer" ? 6 + Math.random() * 4 : 0,
    hasScreamed: false,
    isFleeing: type === "screamer",
    ignoreBarricades: type === "juggernaut",
    boomerExploded: false,
    leapTime: 0,
    leapVelocity: new THREE.Vector3(),
    growlCooldown: 2 + Math.random() * 6, // stagger initial growl timings
  });
  return zombies[zombies.length - 1];
}

function spawnZombieNearPlayer() {
  const angle = Math.random() * Math.PI * 2;
  const distance = 25 + Math.random() * 35;
  addZombie(player.position.x + Math.cos(angle) * distance, player.position.z + Math.sin(angle) * distance);
}

// ─── Vehicle System ─────────────────────────────────────────────────────────
import { createVehicle, updateVehicle, damageVehicle, repairVehicle, refuelVehicle, upgradeVehicleArmor, upgradeVehicleEngine, VEHICLE_TYPES } from "./entities/vehicle.js";

function spawnVehiclesForMap() {
  const countByMap = {
    outbreak_city: 6,
    ruins: 4,
    badlands: 3,
    dead_valley: 2,
    frost: 2,
    meadows: 2,
  };
  const count = countByMap[activeMapConfig.id] ?? 2;
  const types = Object.values(VEHICLE_TYPES);
  let spawned = 0;
  let attempts = 0;
  while (spawned < count && attempts < count * 10) {
    attempts += 1;
    const angle = Math.random() * Math.PI * 2;
    const dist = 22 + Math.random() * (activeMapConfig.id === "outbreak_city" ? 85 : 68);
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;
    if (Math.hypot(x, z) < 18 || !isCircleClearOfStatics(x, z, VEHICLE_RADIUS + 0.9)) continue;
    const type = types[Math.floor(Math.random() * types.length)];
    const vehicle = createVehicle(type, x, z, terrainHeight);
    vehicles.push(vehicle);
    scene.add(vehicle.mesh);
    registerStaticCollider(vehicle.mesh, 0.15, "vehicle");
    spawned += 1;
  }
}

function findNearestVehicle() {
  let nearest = null;
  let nearestDist = 5.0; // Max interaction distance
  for (const v of vehicles) {
    if (v.destroyed) continue;
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
  // Remove the vehicle's collider while being driven (player is inside it)
  removeStaticCollider(vehicle.mesh);
  player.moveVelocity.set(0, 0, 0);
  syncPlayerToVehicle(vehicle);
  camera.position.copy(vehicle.mesh.position);
  camera.position.y += 2.5;
  firstPersonWeapon.rig.visible = false;
  messageEl.textContent = `Entered ${vehicle.type.toUpperCase()}! WASD drive, Space brake, F exit, H horn.`;
  return true;
}

function syncPlayerToVehicle(vehicle) {
  player.position.set(vehicle.mesh.position.x, vehicle.mesh.position.y + 1.8, vehicle.mesh.position.z);
  player.velocityY = 0;
  player.isGrounded = true;
  player.yaw = vehicle.yaw;
}

function exitVehicle() {
  if (!activeVehicle) return;
  const v = activeVehicle;
  v.occupied = false;
  v.driver = null;
  // Place player beside vehicle
  const side = new THREE.Vector3(Math.cos(v.yaw + Math.PI / 2), 0, Math.sin(v.yaw + Math.PI / 2));
  player.position.copy(v.mesh.position).addScaledVector(side, 2.5);
  player.position.y = terrainHeight(player.position.x, player.position.z) + 1.8;
  player.yaw = v.yaw;
  activeVehicle = null;
  vehicleInput = { forward: false, backward: false, left: false, right: false, brake: false };
  firstPersonWeapon.rig.visible = true;
  // Re-register the vehicle as a static collider if it's not destroyed
  if (!v.destroyed) registerStaticCollider(v.mesh, 0.15, "vehicle");
  messageEl.textContent = "Exited vehicle.";
}

function triggerVehicleExplosion(vehicle) {
  if (!vehicle || vehicle.hasExploded) return;
  vehicle.hasExploded = true;
  vehicle.destroyed = true;
  vehicle.speed = 0;
  removeStaticCollider(vehicle.mesh);
  const explosionPos = vehicle.mesh.position.clone();
  createExplosion(explosionPos, 6, 60);
  playSpatialSfx("explosion", explosionPos, 1);
  topCenterAlertEl.textContent = "VEHICLE DESTROYED!";
  alertTimer = 2.5;
  if (activeVehicle === vehicle) {
    exitVehicle();
    player.hp = Math.max(0, player.hp - 25);
    player.damageFlash = 1.0;
    lastDamageTime = gameTime;
    messageEl.textContent = "Vehicle exploded! You were thrown clear!";
    if (player.hp <= 0) killPlayer("Caught in the vehicle explosion.");
  }
}

function updateVehicles(dt) {
  for (const vehicle of vehicles) {
    if (vehicle.destroyed) {
      continue;
    }
    if (activeVehicle === vehicle) {
      updateVehicle(vehicle, dt, vehicleInput, terrainHeight);
      syncPlayerToVehicle(vehicle);
    }
    // Zombies damage vehicles
    for (const zombie of zombies) {
      const d = zombie.mesh.position.distanceTo(vehicle.mesh.position);
      if (d < 2.5) {
        const wasDestroyed = vehicle.destroyed;
        const destroyed = damageVehicle(vehicle, zombie.damage * dt);
        if (destroyed && !wasDestroyed) {
          triggerVehicleExplosion(vehicle);
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
        removeStaticCollider(v.mesh);
        scene.remove(v.mesh);
        disposeOwnedObject3D(v.mesh);
        vehicles.splice(i, 1);
      }
    }
  }
}

function findNearestDownedTeammate(maxDistance = 2.5) {
  let nearest = null;
  let nearestDistSq = maxDistance * maxDistance;
  for (const mate of teammates) {
    if (!mate.downed) continue;
    const d2 = mate.mesh.position.distanceToSquared(player.position);
    if (d2 < nearestDistSq) {
      nearestDistSq = d2;
      nearest = mate;
    }
  }
  return nearest;
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
    pierce = 0,
    stagger = 0,
    crit = false,
    ammoType = "",
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
  rec.pierce = pierce;
  rec.stagger = stagger;
  rec.crit = crit;
  rec.ammoType = ammoType;
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
const _teammateRetreatGoal = new THREE.Vector3();

function hasLineOfSight(origin, targetPosition) {
  _losDirection.subVectors(targetPosition, origin);
  const distance = _losDirection.length();
  if (distance <= 0.001) return true;
  _losDirection.normalize();

  _losRaycaster.set(origin, _losDirection);
  _losRaycaster.far = Math.max(0.01, distance - 0.15);
  return _losRaycaster.intersectObjects(visibleVisionBlockers, true).length === 0;
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
  if (activeVehicle) return; // Can't shoot while driving
  if (inventoryOpen || upgradeBenchOpen) return;
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
  else if (wn === "Rocket") playSfx("grenade_throw", 0.7);
  else playSfx(isShotgunNow ? "shotgun_player" : "gunshot_player", 1);

  // Sound investigation — nearby zombies investigate the gunshot.
  // Suppressor and silent weapons reduce or eliminate the alert radius.
  const isSuppressed = (weapon.upgrades?.suppressor || 0) > 0;
  let noiseKind = isShotgunNow ? "shotgun" : "gunshot";
  if (wn === "Crossbow") noiseKind = null;            // crossbow is silent
  else if (wn === "Rocket") noiseKind = "rocket";
  else if (isSuppressed) noiseKind = "gunshot_suppressed";
  if (noiseKind) {
    emitSoundEvent(distractions, player.position, noiseKind, 2.0);
  }
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

  // Muzzle flash dynamic light — brief point light for 1-2 frames of scene illumination
  flashMuzzleLight();

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
    spawnArrow(_bulletOrigin, _bulletDirection, weapon.damage, weapon);
    commitPlayerAmmoFields(player);
    return;
  }

  if (wName === "Rocket") {
    // Physical rocket that flies and detonates
    spawnRocket(_bulletOrigin, _bulletDirection, weapon.damage, weapon);
    commitPlayerAmmoFields(player);
    return;
  }

  if (wName === "Flamethrower") {
    // Burst of flame puffs in a cone — spawned per shot, damage applied per frame
    for (let fp = 0; fp < 5; fp++) spawnFlamePuff(_bulletOrigin, _bulletDirection, weapon);
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
        speed: weapon.pelletSpeed || 64,
        life: weapon.range / (weapon.pelletSpeed || 64) + 0.08,
        color: 0xffaa44,
        radius: 0.04,
        owner: "player",
        stagger: weapon.stagger || 0,
        ammoType: weapon.ammoType,
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
    const isCrit = (weapon.critChance || 0) > 0 && Math.random() < weapon.critChance;
    const shotDamage = isCrit ? weapon.damage * (weapon.critMultiplier || 1.6) : weapon.damage;
    const shotSpeed = weapon.bulletSpeed || (isSniper ? 200 : 75);
    spawnBullet(_bulletOrigin, _bulletDirection, shotDamage, {
      speed: shotSpeed,
      life: weapon.range / shotSpeed + 0.18,
      color: isCrit ? 0xfff0a8 : isSniper ? 0x44ddff : wName === "Rifle" ? 0xffe2a8 : 0xffd08a,
      radius: isSniper ? 0.075 : 0.05,
      owner: "player",
      pierce: weapon.pierce || 0,
      crit: isCrit,
      ammoType: weapon.ammoType,
    });
    if (isCrit) messageEl.textContent = "Critical hollow-point hit ready.";
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
  const isSmg = weaponName === "SMG";
  const isRevolver = weaponName === "Revolver";
  const isMinigun = weaponName === "Minigun";

  const adsXOffset = isADS ? 0.0 : (isPistol ? 0.4 : isShotgun ? 0.34 : 0.36);
  const adsYOffset = isADS ? -0.2 : (isPistol ? -0.26 : isShotgun ? -0.24 : -0.28);
  const adsZOffset = isADS ? -0.38 : (isPistol ? -0.48 : isShotgun ? -0.5 : -0.55);
  // Reload weapon dip: lower and tilt the model during magazine swap
  let reloadDipY = 0;
  let reloadDipZ = 0;
  let reloadTiltZ = 0;
  if (player.reloadTimer > 0) {
    const weapon = getActiveWeapon(player);
    const reloadTotal = (weapon.reloadTime || 1.25) * (1 - (skills?.reloadSpeed?.value || 0));
    // 0→1→0 ease: peaks at mid-reload then returns
    const t = 1 - player.reloadTimer / reloadTotal;
    const dipCurve = Math.sin(t * Math.PI); // smooth bell curve
    reloadDipY = -0.18 * dipCurve;
    reloadDipZ = 0.06 * dipCurve;
    reloadTiltZ = 0.12 * dipCurve;
  }

  firstPersonWeapon.weapon.position.set(
    adsXOffset + bobX - lookSwayX * 0.0014,
    adsYOffset - bobY + weaponKick * 0.03 + lookSwayY * 0.0012 + reloadDipY,
    adsZOffset + weaponKick * 0.11 + reloadDipZ,
  );

  firstPersonWeapon.weapon.rotation.set(
    (isPistol ? -0.1 : -0.12) - weaponRecoil * 0.12 + lookSwayY * 0.0009,
    (isPistol ? -0.05 : -0.1) + lookSwayX * 0.0011,
    -0.04 + bobX * 0.9 + reloadTiltZ,
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
  if (firstPersonWeapon.smgGroup) firstPersonWeapon.smgGroup.visible = isSmg;
  if (firstPersonWeapon.revolverGroup) firstPersonWeapon.revolverGroup.visible = isRevolver;
  if (firstPersonWeapon.minigunGroup) firstPersonWeapon.minigunGroup.visible = isMinigun;

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
  } else if (isSmg) {
    firstPersonWeapon.muzzleFlash.position.set(0, 0.01, -0.66);
  } else if (isRevolver) {
    firstPersonWeapon.muzzleFlash.position.set(0, 0.01, -0.32);
  } else if (isMinigun) {
    firstPersonWeapon.muzzleFlash.position.set(0, 0.01, -0.6);
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

  // Footstep sounds
  if (moving && player.isGrounded) {
    const stepInterval = sprinting ? 0.28 : isCrouching ? 0.55 : 0.38;
    footstepTimer -= dt;
    if (footstepTimer <= 0) {
      footstepTimer = stepInterval;
      playSfx(sprinting ? "footstep_sprint" : "footstep", 1);
    }
  } else {
    footstepTimer = 0;
  }

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
  clampPlayerToTerrainFloor();

  camera.position.set(player.position.x, player.position.y, player.position.z);
  camera.position.y += Math.sin(player.bobTime) * (moving ? 0.045 : 0);
  camera.rotation.order = "YXZ";
  camera.rotation.y = player.yaw;
  camera.rotation.x = player.pitch;
}

function maybeDropPickup(position) {
  if (Math.random() < 0.35) {
    const onCity = activeMapConfig.id === "outbreak_city";
    const ammoIndex = Math.floor(Math.random() * player.weapons.length);
    const ammoWeapon = player.weapons[ammoIndex];
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
    pickups.push({ mesh: pickup, spin: Math.random() * 2 + 1, ammoIndex, ammoType: ammoWeapon?.ammoType || ammoWeapon?.name || "Ammo" });
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

    // Terrain impact — bullet hit the ground
    const groundY = terrainHeight(bullet.mesh.position.x, bullet.mesh.position.z);
    if (bullet.mesh.position.y <= groundY + 0.05) {
      spawnSparks(bullet.mesh.position, 4);
      spawnTerrainImpactDust(bullet.mesh.position);
      releaseBulletRecord(bullet);
      bullets.splice(i, 1);
      continue;
    }

    if (bullet.owner === "player" && checkBarrelHits(_bulletPrev, bullet.mesh.position)) {
      releaseBulletRecord(bullet);
      bullets.splice(i, 1);
      continue;
    }
    if (bullet.owner === "player" && checkToxicBarrelHits(_bulletPrev, bullet.mesh.position, bullet.damage || 24)) {
      releaseBulletRecord(bullet);
      bullets.splice(i, 1);
      continue;
    }
    // Block projectile against scenery (buildings, trees) so you can't shoot through walls.
    if (segmentBlockedByScenery(_bulletPrev, bullet.mesh.position)) {
      spawnSparks(bullet.mesh.position, 3);
      releaseBulletRecord(bullet);
      bullets.splice(i, 1);
      continue;
    }
    let hitZombie = false;
    for (let zi = zombies.length - 1; zi >= 0; zi -= 1) {
      const zombie = zombies[zi];
      const hit = getZombieHit(_bulletPrev, bullet.mesh.position, zombie);
      if (hit) {
        const hs = hit.part === "head";
        applyZombieDamage(zi, bullet.damage * hit.multiplier, hs);
        const zombieSurvived = zombies[zi] === zombie;
        if (zombieSurvived && bullet.stagger) {
          zombie.staggerTimer = Math.max(zombie.staggerTimer || 0, bullet.stagger);
        }
        if (bullet.owner === "player") {
          triggerHitMarker(hs);
          if (hs) {
            addScreenShake(0.08);
            triggerHitStop(0.045);
          }
          if (zombieSurvived && bullet.crit) {
            // Reuse scratch vector — this fires every crit hit, can be many per second.
            spawnFloatingDamage(_tempVec1.copy(zombie.mesh.position).setY(zombie.mesh.position.y + 2.8), bullet.damage, true);
            addScreenShake(0.05);
          }
          if (hs) score += 10;
          messageEl.textContent =
            bullet.crit ? "Critical hit!" : hs ? `Headshot! +${isADS ? 160 : 150}pts` : hit.part === "torso" ? "Body hit." : "Limb hit.";
        }
        hitZombie = true;
        bullet.pierce = Math.max(0, bullet.pierce || 0);
        if (bullet.pierce > 0) {
          bullet.pierce -= 1;
          bullet.damage *= 0.72;
          spawnSparks(bullet.mesh.position, 2);
        } else {
          releaseBulletRecord(bullet);
          bullets.splice(i, 1);
        }
        break;
      }
    }
    if (hitZombie) continue;
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
    const bossName = zombie.bossName;
    const bossRewardMult = zombie.bossRewardMult || 1;
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

    // Dispose cloned burn materials before collapse so they don't leak.
    if (zombie._burnTinted && zombie._burnOrigMats) {
      for (const entry of zombie._burnOrigMats) {
        if (entry.mesh.material && entry.mesh.material !== entry.mat) {
          entry.mesh.material.dispose();
        }
        entry.mesh.material = entry.mat;
      }
      zombie._burnOrigMats = null;
      zombie._burnTinted = false;
    }
    // Death collapse: instead of vanishing instantly, the zombie tips over.
    // We push it into a short-lived collapse list; the mesh is removed after
    // the animation completes (see updateDeathCollapses).
    startDeathCollapse(zombie.mesh);
    zombies.splice(index, 1);
    player.kills += 1;
    onZombieKilled(missionGenerator, zombieType);
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
    // Persistent splat on the ground — bigger for special infected and bosses.
    spawnBloodDecal(pos.x, pos.z, wasBoss ? 2.4 : isSpecial ? 1.4 : 1.0, wasBoss ? 60 : 28);

    // Skill XP gain
    addSkillXP(wasBoss ? 50 : zombieType === "juggernaut" ? 40 : zombieType === "boomer" ? 20 : zombieType === "screamer" ? 15 : isSpecial ? 25 : 10);

    if (wasBoss) {
      bossAlive = false;
      const reward = Math.round(500 * bossRewardMult);
      score += reward;
      topCenterAlertEl.textContent = `★ ${(bossName || "BOSS").toUpperCase()} DEFEATED! +${reward} pts`;
      alertTimer = 3.5;
      grenadeCount = Math.min(grenadeCount + 2, 6);
      skillPoints += 2;
      messageEl.textContent = `${bossName || "Boss"} down! +2 grenades, +2 skill points!`;
      addKillFeedEntry(`💀 ${(bossName || "BOSS").toUpperCase()} DOWN +${reward}pts`, "#ff6600");
      // Always drop a chunk of materials on boss kill.
      for (let m = 0; m < 4; m++) spawnMaterialDrop(pos);
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

function igniteZombie(zombie, seconds = 3, dps = 10) {
  if (!zombie) return;
  zombie.burnTimer = Math.max(zombie.burnTimer || 0, seconds);
  zombie.burnDps = Math.max(zombie.burnDps || 0, dps);
}

function bleedZombie(zombie, seconds = 3, dps = 7) {
  if (!zombie) return;
  zombie.bleedTimer = Math.max(zombie.bleedTimer || 0, seconds);
  zombie.bleedDps = Math.max(zombie.bleedDps || 0, dps);
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
      const ammoWeapon = player.weapons[p.ammoIndex] || player.weapons[player.activeWeapon];
      const cap = getWeaponReserveCap(ammoWeapon);
      const gain = Math.max(Math.ceil((ammoWeapon.magSize || 10) * 1.35), Math.floor(cap * 0.14));
      ammoWeapon.reserve = Math.min(cap, ammoWeapon.reserve + gain);
      syncPlayerAmmoFields(player);
      player.hp = Math.min(getPlayerMaxHealth(), player.hp + 8);
      scene.remove(p.mesh);
      disposeOwnedObject3D(p.mesh);
      pickups.splice(i, 1);
      messageEl.textContent = `Picked up ${gain} ${ammoWeapon.ammoType || ammoWeapon.name} ammo and +hp.`;
    }
  }
}

function separateTeammate(mate) {
  const sepRadius = 1.35;
  const sepRadiusSq = sepRadius * sepRadius;
  for (const other of teammates) {
    if (other === mate || other.downed) continue;
    const dx = mate.mesh.position.x - other.mesh.position.x;
    const dz = mate.mesh.position.z - other.mesh.position.z;
    const d2 = dx * dx + dz * dz;
    if (d2 > 0.0001 && d2 < sepRadiusSq) {
      const d = Math.sqrt(d2);
      const push = (sepRadius - d) / d * 0.5;
      mate.mesh.position.x += dx * push;
      mate.mesh.position.z += dz * push;
    }
  }
  if (!activeVehicle) {
    const dx = mate.mesh.position.x - player.position.x;
    const dz = mate.mesh.position.z - player.position.z;
    const d2 = dx * dx + dz * dz;
    if (d2 > 0.0001 && d2 < sepRadiusSq) {
      const d = Math.sqrt(d2);
      const push = (sepRadius - d) / d * 0.65;
      mate.mesh.position.x += dx * push;
      mate.mesh.position.z += dz * push;
    }
  }
}

function updateTeammates(dt) {
  for (const mate of teammates) {
    mate.shootCooldown = Math.max(0, mate.shootCooldown - dt);
    mate.targetMemory = Math.max(0, mate.targetMemory - dt);
    if (mate.calloutCooldown) mate.calloutCooldown = Math.max(0, mate.calloutCooldown - dt);
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

    // Downed teammate logic — player OR another teammate may revive.
    if (mate.downed) {
      mate.downedTimer -= dt;
      if (mate.downedTimer <= 0) {
        // Teammate dies permanently
        scene.remove(mate.mesh);
        const idx = teammates.indexOf(mate);
        if (idx >= 0) teammates.splice(idx, 1);
        addKillFeedEntry("Teammate lost...", "#ff3333");
        messageEl.textContent = "A teammate didn't make it...";
        continue;
      }

      // Player revive (F key when within 2.5m)
      const distToPlayer = mate.mesh.position.distanceTo(player.position);
      const playerReviving = !activeVehicle && distToPlayer < 2.5 && keys.has("KeyF");

      // Teammate AI revive — closest non-downed teammate within 2m and
      // not in active combat (no current target) will start a revive.
      let mateReviving = false;
      if (!playerReviving) {
        for (const other of teammates) {
          if (other === mate || other.downed) continue;
          if (other.mesh.position.distanceToSquared(mate.mesh.position) < 4) {
            // 2m radius. Buddy gets stuck reviving until done.
            other.reviving = mate;
            mateReviving = true;
            break;
          }
        }
      }

      if (playerReviving || mateReviving) {
        mate.beingRevived = true;
        mate.reviveTimer += dt;
        if (mate.reviveTimer >= 3) {
          // Revived!
          mate.downed = false;
          mate.hp = 50;
          mate.downedTimer = 0;
          mate.reviveTimer = 0;
          mate.beingRevived = false;
          mate.mesh.rotation.x = 0;
          mate.mesh.position.y = terrainHeight(mate.mesh.position.x, mate.mesh.position.z);
          messageEl.textContent = playerReviving ? "Teammate revived!" : "Teammates revived a buddy!";
          addKillFeedEntry(playerReviving ? "Teammate revived!" : "Buddy revived a teammate!", "#44ff88");
          playSfx("skill_up", 0.6);
          // Clear revive lock on whoever was reviving.
          for (const other of teammates) if (other.reviving === mate) other.reviving = null;
        }
      } else {
        mate.beingRevived = false;
        mate.reviveTimer = Math.max(0, mate.reviveTimer - dt * 2);
      }
      // Visual: downed teammate lies on ground
      mate.mesh.rotation.x = Math.PI / 2 * 0.65;
      mate.mesh.position.y = terrainHeight(mate.mesh.position.x, mate.mesh.position.z) + 0.3;
      continue; // Skip normal behavior when downed
    }

    // If this teammate is currently reviving someone, plant feet & don't shoot.
    if (mate.reviving) {
      // If the patient died/revived, drop the lock.
      if (!mate.reviving.downed) mate.reviving = null;
      else {
        const r = mate.reviving;
        // Kneel-ish posture: don't move, don't aim.
        mate.currentTarget = null;
        mate.targetMemory = 0;
        // Face the patient so the animation reads.
        const dx = r.mesh.position.x - mate.mesh.position.x;
        const dz = r.mesh.position.z - mate.mesh.position.z;
        if (dx * dx + dz * dz > 0.01) mate.mesh.rotation.y = Math.atan2(dx, dz);
        mate.mesh.position.y = terrainHeight(mate.mesh.position.x, mate.mesh.position.z);
        continue;
      }
    }

    mate.mesh.rotation.x *= Math.exp(-dt * 10);

    // Slow auto-heal when not in combat
    if (!mate.currentTarget && mate.hp < mate.maxHp) {
      mate.hp = Math.min(mate.maxHp, mate.hp + 3 * dt);
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
      // Callout: first time this teammate sees a special infected or boss,
      // push a kill-feed line so the player knows where attention is going.
      const isBig = visibleTarget.isBoss || visibleTarget.isSpecial;
      if (isBig && mate.currentTarget !== visibleTarget && (mate.calloutCooldown || 0) <= 0) {
        const label = visibleTarget.isBoss
          ? `🎯 "${visibleTarget.bossName || "Boss"} spotted!"`
          : `🎯 "${visibleTarget.type} on us!"`;
        addKillFeedEntry(label, "#88ccff");
        mate.calloutCooldown = 6; // Don't spam the kill feed.
      }
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
      if (preferredWeapon < 0 || preferredWeapon >= mate.weapons.length) preferredWeapon = mate.activeWeapon;
      mate.activeWeapon = preferredWeapon;
      const weapon = mate.weapons[mate.activeWeapon];
      if (d2 < 7 * 7) {
        _teammateRetreatGoal
          .copy(mate.mesh.position)
          .sub(_tempVec1.copy(targetPosition).sub(mate.mesh.position).setY(0).normalize().multiplyScalar(4.5));
        moveGoal = _teammateRetreatGoal;
      } else if (d2 > weapon.preferredRange * weapon.preferredRange && mate.mesh.position.distanceToSquared(player.position) < 14 * 14) {
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
    separateTeammate(mate);
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

// Pre-allocated vectors for the zombie update loop — avoids per-frame heap allocs.
const _zombieTargetPos    = new THREE.Vector3();
const _zombieSurvivorPos  = new THREE.Vector3();
const _zombieSpitterOff1  = new THREE.Vector3(0, 2, 0);
const _zombieSpitterOff2  = new THREE.Vector3(0, 1.5, 0);
const _zombieAcidOrigin   = new THREE.Vector3();
const _zombieAcidTarget   = new THREE.Vector3();

function updateZombies(dt) {
  // Expire short-lived sound events (gunshot/explosion alerts).
  pruneSoundEvents(distractions, dt);

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
        lastDamageTime = gameTime;
        if (player.hp <= 0) killPlayer("Dissolved by acid...");
      }
    }
    // Fire puddles damage zombies
    if (puddle.isFire) {
      for (let zi = zombies.length - 1; zi >= 0; zi -= 1) {
        const z = zombies[zi];
        if (z.mesh.position.distanceTo(puddle.mesh.position) >= puddle.radius) continue;
        z.hp -= puddle.damagePerSecond * dt;
        if (z.hp <= 0) applyZombieDamage(zi, 0);
      }
    }
  }

  const zombieCount = zombies.length;
  if (!zombieCount) return;
  const fullStep = adaptiveQuality.level === 0 ? zombieCount : Math.max(12, Math.ceil(zombieCount * 0.55));
  let processed = 0;
  for (let pass = 0; pass < zombieCount && processed < fullStep; pass += 1) {
    const i = (zombieAiUpdateCursor - pass + zombieCount) % zombieCount;
    const zombie = zombies[i];
    if (!zombie) continue;
    processed += 1;
    zombie.attackTimer -= dt;
    if (zombie.staggerTimer > 0) zombie.staggerTimer = Math.max(0, zombie.staggerTimer - dt);
    if (zombie.burnTimer > 0) {
      zombie.burnTimer = Math.max(0, zombie.burnTimer - dt);
      applyZombieDamage(i, (zombie.burnDps || 0) * dt);
      if (!zombies[i]) continue;
      // Visual fire effect — spawn small fire particles while burning
      zombie._burnVfxTimer = (zombie._burnVfxTimer || 0) - dt;
      if (zombie._burnVfxTimer <= 0) {
        zombie._burnVfxTimer = 0.08 + Math.random() * 0.06;
        spawnBurningParticle(zombie.mesh.position);
      }
      // Tint the zombie mesh orange-red while on fire (clone material to avoid shared mutation)
      if (!zombie._burnTinted) {
        zombie._burnTinted = true;
        zombie._burnOrigMats = [];
        zombie.mesh.traverse((o) => {
          if (o.isMesh && o.material) {
            zombie._burnOrigMats.push({ mesh: o, mat: o.material });
            o.material = o.material.clone();
            o.material.emissive = new THREE.Color(0xff4400);
            o.material.emissiveIntensity = 0.35;
          }
        });
      }
    } else if (zombie._burnTinted) {
      // Restore original shared material and dispose cloned copy
      zombie._burnTinted = false;
      if (zombie._burnOrigMats) {
        for (const entry of zombie._burnOrigMats) {
          if (entry.mesh.material) entry.mesh.material.dispose();
          entry.mesh.material = entry.mat;
        }
        zombie._burnOrigMats = null;
      }
    }
    if (zombie.bleedTimer > 0) {
      zombie.bleedTimer = Math.max(0, zombie.bleedTimer - dt);
      applyZombieDamage(i, (zombie.bleedDps || 0) * dt);
      if (!zombies[i]) continue;
    }

    // Pick a target kind explicitly so stealth, vehicles, survivors, and teammates
    // don't collapse into a single "not player" bucket.
    let targetKind = "wander";
    let targetMate = null;
    const playerTargetPosition = activeVehicle ? activeVehicle.mesh.position : player.position;
    const playerDetectionRange = activeVehicle ? 72 : isCrouching ? 12 : 52;
    const playerDistSq = zombie.mesh.position.distanceToSquared(playerTargetPosition);
    let nearestDistanceSq = Infinity;
    if (playerDistSq < playerDetectionRange * playerDetectionRange) {
      nearestDistanceSq = playerDistSq;
      _zombieTargetPos.copy(playerTargetPosition);
      targetKind = activeVehicle ? "vehicle" : "player";
    }

    // Check for distractions (noise makers, beepers, gunshots, explosions).
    // Sound events use their own radius; physical distractions use a default of 60.
    for (const dist of distractions) {
      if (!dist.active || !dist.position) continue;
      const radius = dist.isSound ? dist.soundRadius : 60;
      const d2 = zombie.mesh.position.distanceToSquared(dist.position);
      if (d2 < nearestDistanceSq && d2 < radius * radius) {
        nearestDistanceSq = d2;
        _zombieTargetPos.copy(dist.position);
        targetKind = "distraction";
        targetMate = null;
      }
    }

    // Normal targeting
    for (const mate of teammates) {
      if (mate.downed) continue;
      const d2 = zombie.mesh.position.distanceToSquared(mate.mesh.position);
      if (d2 < nearestDistanceSq) {
        nearestDistanceSq = d2;
        _zombieTargetPos.copy(mate.mesh.position);
        targetKind = "teammate";
        targetMate = mate;
      }
    }

    // Target stranded survivor if active
    if (isSurvivorAlive(eventDirector) && eventDirector.survivorPosition) {
      _zombieSurvivorPos.set(eventDirector.survivorPosition.x, eventDirector.survivorPosition.y, eventDirector.survivorPosition.z);
      const d2 = zombie.mesh.position.distanceToSquared(_zombieSurvivorPos);
      if (d2 < nearestDistanceSq) {
        nearestDistanceSq = d2;
        _zombieTargetPos.copy(_zombieSurvivorPos);
        targetKind = "survivor";
        targetMate = null;
      }
    }

    if (targetKind === "wander") {
      _zombieTargetPos.set(
        zombie.mesh.position.x + Math.sin(gameTime * 0.7 + zombie.wanderSeed) * 5,
        zombie.mesh.position.y,
        zombie.mesh.position.z + Math.cos(gameTime * 0.55 + zombie.wanderSeed) * 5,
      );
    } else if (targetKind === "player" || targetKind === "teammate" || targetKind === "vehicle" || targetKind === "survivor") {
      // Apply flanking offset so packs don't all converge on a single point.
      // Only when the zombie is far enough away that lateral motion still helps;
      // up close we want them to commit to the kill.
      const distSq = nearestDistanceSq;
      if (distSq > 64) { // > 8 units
        const { ox, oz } = flankOffset(zombie, _zombieTargetPos, zombies.length);
        _zombieTargetPos.x += ox;
        _zombieTargetPos.z += oz;
      }
    }

    const toTarget = getV3().subVectors(_zombieTargetPos, zombie.mesh.position);
    toTarget.y = 0;
    const distance = toTarget.length();

    const toxicSlow = zombie._toxicSlow || 1.0;
    zombie._toxicSlow = 1.0; // reset each tick; reapplied by updateToxicClouds if still inside
    const nightSpeedMult = ((isNight || hordeNightActive) ? 1.45 : 1.0) * (zombie.staggerTimer > 0 ? 0.35 : 1.0) * toxicSlow;

    // Special infected behaviors
    if (zombie.type === "spitter") {
      zombie.spitterCooldown -= dt;
      // Spitter tries to maintain distance and spits acid
      if (distance < 35 && distance > 12 && zombie.spitterCooldown <= 0 && hasLineOfSight(zombie.mesh.position, _zombieTargetPos)) {
        zombie.spitterCooldown = 4 + Math.random() * 2;
        playSpatialSfx("acid_spit", zombie.mesh.position, 0.7);
        // Create acid projectile
        _zombieAcidOrigin.copy(zombie.mesh.position).add(_zombieSpitterOff1);
        _zombieAcidTarget.copy(_zombieTargetPos).add(_zombieSpitterOff2);
        spawnAcidSpit(_zombieAcidOrigin, _zombieAcidTarget);
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
        if (targetKind === "player" && distance < 1.8 && zombie.leapTime > 0 && !gameOver) {
          player.hp = Math.max(0, player.hp - 18);
          player.damageFlash = 0.9;
          lastDamageTime = gameTime;
          showDamageDirection(zombie.mesh.position);
          addScreenShake(0.4);
          triggerHitStop(0.05);
          messageEl.textContent = "HUNTER POUNCED!";
          zombie.hunterLeaping = false;
          if (player.hp <= 0) killPlayer("A Hunter got you.");
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
        if (targetKind === "player" && distance < 2 && !gameOver) {
          player.hp = Math.max(0, player.hp - zombie.damage * 2);
          player.damageFlash = 0.9;
          lastDamageTime = gameTime;
          showDamageDirection(zombie.mesh.position);
          addScreenShake(0.6);
          triggerHitStop(0.075);
          // Knockback
          const knockDir = zombie.chargeDirection.clone();
          player.position.addScaledVector(knockDir, 6);
          messageEl.textContent = "CHARGER HIT!";
          zombie.isCharging = false;
          if (player.hp <= 0) killPlayer("Trampled by a Charger.");
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
        const roomLeft = Math.max(0, settings.maxZombies - zombies.length);
        const allowedSpawns = Math.min(screamCount, roomLeft);
        for (let s = 0; s < allowedSpawns; s++) {
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

    resolveZombieObstacles(zombie);
    zombie.mesh.position.y = terrainHeight(zombie.mesh.position.x, zombie.mesh.position.z);

    // Zombie-zombie separation: push apart to prevent stacking
    const sepRadius = 1.4;
    const sepRadiusSq = sepRadius * sepRadius;
    const sepForce = 2.5;
    const separationChecks = Math.min(zombies.length - 1, adaptiveQuality.level === 0 ? zombies.length - 1 : 10);
    for (let step = 0; step < separationChecks; step += 1) {
      const j = (zombieSeparationCursor + step) % zombies.length;
      if (j === i) continue;
      const other = zombies[j];
      const dx = zombie.mesh.position.x - other.mesh.position.x;
      const dz = zombie.mesh.position.z - other.mesh.position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < sepRadiusSq && d2 > 0.001) {
        const d = Math.sqrt(d2);
        const push = (sepRadius - d) / d * sepForce * dt;
        zombie.mesh.position.x += dx * push;
        zombie.mesh.position.z += dz * push;
      }
    }
    zombieSeparationCursor = (zombieSeparationCursor + 3) % Math.max(1, zombies.length);

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

    // Proximity growl — adds atmosphere. Each zombie growls on its own cooldown
    // so the soundscape doesn't sync into a single burst every N seconds.
    zombie.growlCooldown -= dt;
    if (zombie.growlCooldown <= 0 && distance < 22 && distance > 1.5) {
      zombie.growlCooldown = 3.5 + Math.random() * 5;
      const vol = Math.max(0.08, 0.45 - distance * 0.018);
      playSpatialSfx("zombie_growl", zombie.mesh.position, vol);
    }

    const attackDistance = zombie.type === "brute" ? 1.45 : settings.zombieHitDistance;
    const effectiveAttackDistance = targetKind === "vehicle" ? 2.4 : attackDistance;
    if (!gameOver && distance < effectiveAttackDistance && zombie.attackTimer <= 0 && !zombie.hunterLeaping && !zombie.isCharging) {
      zombie.attackTimer = settings.zombieAttackEvery;
      zombie.attackAnimating = true;
      zombie.attackAnimTime = 0;
      if (targetKind === "player") {
        player.hp = Math.max(0, player.hp - zombie.damage);
        player.damageFlash = 0.9;
        lastDamageTime = gameTime;
        showDamageDirection(zombie.mesh.position);
        addScreenShake(
          zombie.type === "juggernaut" ? 0.28 : zombie.type === "brute" ? 0.18 : zombie.type === "charger" ? 0.16 : 0.13,
        );
        if (zombie.type === "juggernaut" || zombie.type === "brute" || zombie.type === "charger") {
          triggerHitStop(0.04);
        }
        messageEl.textContent = zombie.type === "brute" ? "Brute smash!" : zombie.type === "spitter" ? "Spitter clawed you!" : zombie.type === "hunter" ? "Hunter slashed!" : zombie.type === "charger" ? "Charger punched!" : zombie.type === "crawler" ? "Crawler bit you!" : zombie.type === "juggernaut" ? "Juggernaut crushed you!" : zombie.type === "boomer" ? "Boomer clawed you!" : zombie.type === "screamer" ? "Screamer scratched you!" : "A zombie hit you!";
        if (player.hp <= 0) killPlayer("A zombie got you.");
      } else if (targetKind === "vehicle" && activeVehicle) {
        const wasDestroyed = activeVehicle.destroyed;
        const destroyed = damageVehicle(activeVehicle, zombie.damage * 1.6);
        if (destroyed && !wasDestroyed) triggerVehicleExplosion(activeVehicle);
        else messageEl.textContent = "Vehicle under attack!";
      } else if (targetKind === "survivor" && isSurvivorAlive(eventDirector) && eventDirector.survivorPosition) {
        _zombieSurvivorPos.set(eventDirector.survivorPosition.x, eventDirector.survivorPosition.y, eventDirector.survivorPosition.z);
        if (zombie.mesh.position.distanceTo(_zombieSurvivorPos) < attackDistance + 1) {
          const sHP = damageSurvivor(eventDirector, zombie.damage);
          messageEl.textContent = `Survivor under attack! HP: ${Math.max(0, Math.floor(sHP))}`;
        }
      } else if (targetKind === "teammate" && targetMate && !targetMate.downed) {
        const mateDistSq = zombie.mesh.position.distanceToSquared(targetMate.mesh.position);
        if (mateDistSq < (attackDistance + 1) * (attackDistance + 1)) {
          targetMate.hp = Math.max(0, targetMate.hp - zombie.damage);
          if (targetMate.hp <= 0) {
            targetMate.downed = true;
            targetMate.downedTimer = 30; // 30 seconds to revive before death
            targetMate.reviveTimer = 0;
            targetMate.beingRevived = false;
            messageEl.textContent = "Teammate downed! Hold F near them to revive!";
            addKillFeedEntry(`Teammate downed by ${zombie.type}!`, "#ff6644");
            playSfx("teammate_downed", 0.8);
          } else {
            messageEl.textContent = "Teammate taking damage!";
          }
        }
      }
    }
  }
  zombieAiUpdateCursor = (zombieAiUpdateCursor + processed) % Math.max(1, zombies.length);
}

/** Shared geometry/material for acid spit projectiles — avoids per-spit allocations. */
const _acidSpitGeo = new THREE.SphereGeometry(0.15, 6, 6);
_acidSpitGeo.userData.preventDispose = true;
const _acidSpitMat = new THREE.MeshStandardMaterial({ color: 0x88ff44, emissive: 0x44aa22, emissiveIntensity: 0.5 });

function spawnAcidSpit(from, to) {
  const acid = new THREE.Mesh(_acidSpitGeo, _acidSpitMat);
  acid.position.copy(from);
  scene.add(acid);
  const velocity = new THREE.Vector3().subVectors(to, from).normalize().multiplyScalar(18);
  acidProjectiles.push({ mesh: acid, velocity, time: 0, duration: 0.8 });
}

/** Tick all in-flight acid spit projectiles — called from the main game loop. */
function updateAcidProjectiles(dt) {
  for (let i = acidProjectiles.length - 1; i >= 0; i--) {
    const p = acidProjectiles[i];
    p.time += dt;
    p.mesh.position.addScaledVector(p.velocity, dt);
    p.velocity.y += settings.gravity * dt * 0.3;
    const shouldEnd =
      p.time >= p.duration ||
      p.mesh.position.y < terrainHeight(p.mesh.position.x, p.mesh.position.z) ||
      gameState !== "PLAYING" || gameOver;
    if (shouldEnd) {
      const landPos = p.mesh.position.clone();
      scene.remove(p.mesh);
      acidProjectiles.splice(i, 1);
      if (gameState === "PLAYING" && !gameOver) createAcidPuddle(landPos);
    }
  }
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
// Implementation extracted to src/world/weather.js — these are thin wrappers
// so existing call sites (initWeather/updateWeather/clearWeather) keep working.
function initWeather() { initWeatherSystem(weatherState, activeMapConfig.weather); }
function updateWeather(dt) { updateWeatherSystem(weatherState, dt, player.position); }
function clearWeather() { clearWeatherSystem(weatherState); }

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
    } else if (recipeId === "turret") {
      turretCount = Math.min(turretCount + 1, 3);
      messageEl.textContent = `Crafted auto-turret! (${turretCount} — press G to deploy)`;
    } else if (recipeId === "ammo_pack") {
      messageEl.textContent = "Ammo pack crafted — all ammo reserves topped up.";
    }
    updateHUDMaterials();
  },
};

function openInventory() {
  if (gameState !== "PLAYING" || gameOver) return;
  paused = true;
  inventoryOpen = true;
  if (document.pointerLockElement === canvas) document.exitPointerLock();
  showInventory(inventoryUI, materials, player, skills, inventoryCraftHooks);
}

function closeInventory() {
  inventoryOpen = false;
  hideInventory(inventoryUI);
  paused = false;
  if (!gameOver) canvas.requestPointerLock();
}

function updateHUDMaterials() {
  if ((updateHUDMaterials._lastScore === score) &&
      (updateHUDMaterials._lastMolotov === molotovCount) &&
      (updateHUDMaterials._lastGrenades === grenadeCount) &&
      (updateHUDMaterials._lastLandMines === landMineCount) &&
      (updateHUDMaterials._lastSpikeTraps === spikeTrapCount) &&
      (updateHUDMaterials._lastNoise === noiseMakerCount) &&
      (updateHUDMaterials._lastCrouch === isCrouching) &&
      (updateHUDMaterials._lastAds === isADS) &&
      (updateHUDMaterials._lastMelee === (meleeCooldown > 0)) &&
      (updateHUDMaterials._lastBuildMode === buildMode) &&
      (updateHUDMaterials._lastBuildType === buildType) &&
      (updateHUDMaterials._lastScrap === materials.scrap) &&
      (updateHUDMaterials._lastWood === materials.wood) &&
      (updateHUDMaterials._lastMetal === materials.metal) &&
      (updateHUDMaterials._lastCloth === materials.cloth) &&
      (updateHUDMaterials._lastChemicals === materials.chemicals)) {
    return;
  }
  if (extraMetaEl) {
    const m = materials;
    const materialStr = `S:${m.scrap} W:${m.wood} M:${m.metal} C:${m.cloth} Ch:${m.chemicals}`;
    const throwStr = `🔥${molotovCount} 💥${grenadeCount} ⛏${landMineCount} 🗡${spikeTrapCount}`;
    extraMetaEl.textContent = `${throwStr} | 📢 ${noiseMakerCount} | ${materialStr} | Score: ${score}${isCrouching ? " | [CROUCH]" : ""}${isADS ? " | [ADS]" : ""}${meleeCooldown > 0 ? " | [KNIFE CD]" : ""}${buildMode ? ` | [BUILD:${buildType.toUpperCase()}]` : ""}`;
  }
  updateHUDMaterials._lastScore = score;
  updateHUDMaterials._lastMolotov = molotovCount;
  updateHUDMaterials._lastGrenades = grenadeCount;
  updateHUDMaterials._lastLandMines = landMineCount;
  updateHUDMaterials._lastSpikeTraps = spikeTrapCount;
  updateHUDMaterials._lastNoise = noiseMakerCount;
  updateHUDMaterials._lastCrouch = isCrouching;
  updateHUDMaterials._lastAds = isADS;
  updateHUDMaterials._lastMelee = meleeCooldown > 0;
  updateHUDMaterials._lastBuildMode = buildMode;
  updateHUDMaterials._lastBuildType = buildType;
  updateHUDMaterials._lastScrap = materials.scrap;
  updateHUDMaterials._lastWood = materials.wood;
  updateHUDMaterials._lastMetal = materials.metal;
  updateHUDMaterials._lastCloth = materials.cloth;
  updateHUDMaterials._lastChemicals = materials.chemicals;
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

// ─── Muzzle Flash Light ──────────────────────────────────────────────────────
/** A single reusable PointLight added to the camera rig. When a shot is fired
 *  it's turned on at full intensity and decays to zero over ~60 ms, giving a
 *  brief warm flash that illuminates nearby geometry — makes night fights and
 *  indoor areas feel much more dynamic. */
const _muzzleLight = new THREE.PointLight(0xffcc66, 0, 12, 2);
_muzzleLight.position.set(0, -0.1, -1.2); // roughly at barrel tip in camera space
camera.add(_muzzleLight);

let _muzzleLightLife = 0;

function flashMuzzleLight() {
  _muzzleLight.intensity = 2.8;
  _muzzleLightLife = 0.06; // seconds
}

function updateMuzzleLight(dt) {
  if (_muzzleLightLife > 0) {
    _muzzleLightLife -= dt;
    _muzzleLight.intensity *= Math.exp(-dt * 50);
    if (_muzzleLightLife <= 0) _muzzleLight.intensity = 0;
  }
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
  const toSpawn = Math.min(count, MAX_PARTICLES - particles.length);
  for (let i = 0; i < toSpawn; i++) {
    const dir = new THREE.Vector3((Math.random() - 0.5) * 2, 0.5 + Math.random() * 2, (Math.random() - 0.5) * 2).normalize();
    const isOrange = Math.random() < 0.6;
    const mat = _getParticleMat(isOrange ? "fireOrange" : "fireYellow", isOrange ? 0xff4400 : 0xffaa00);
    mat.opacity = 0.9;
    const p = new THREE.Mesh(_pGeoFire, mat);
    p.position.copy(position);
    p.position.y += 0.5 + Math.random() * 1.0;
    scene.add(p);
    particles.push({
      mesh: p, matPool: isOrange ? "fireOrange" : "fireYellow",
      velocity: dir.multiplyScalar(1 + Math.random() * 4),
      life: 0.5 + Math.random() * 0.8, maxLife: 1.3,
      gravity: true, isExplosion: false, isFire: true,
    });
  }
}

// ─── Electric spark effect ───────────────────────────────────────────────────
function spawnSparks(position, count = 8) {
  const toSpawn = Math.min(count, MAX_PARTICLES - particles.length);
  for (let i = 0; i < toSpawn; i++) {
    const dir = new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 2, (Math.random() - 0.5) * 2).normalize();
    const mat = _getParticleMat("spark", 0x88ccff);
    const p = new THREE.Mesh(_pGeoSpark, mat);
    p.position.copy(position);
    scene.add(p);
    particles.push({
      mesh: p, matPool: "spark",
      velocity: dir.multiplyScalar(3 + Math.random() * 8),
      life: 0.15 + Math.random() * 0.2, maxLife: 0.35,
      gravity: false, isExplosion: false, isSpark: true,
    });
  }
}

/** Small fire lick on a burning zombie. */
function spawnBurningParticle(position) {
  if (particles.length >= MAX_PARTICLES) return;
  const isOrange = Math.random() < 0.5;
  const mat = _getParticleMat(isOrange ? "fireOrange" : "fireYellow", isOrange ? 0xff6600 : 0xffaa00);
  mat.opacity = 0.85;
  const p = new THREE.Mesh(_pGeoFire, mat);
  p.position.set(
    position.x + (Math.random() - 0.5) * 0.5,
    position.y + 0.8 + Math.random() * 1.0,
    position.z + (Math.random() - 0.5) * 0.5,
  );
  p.scale.setScalar(0.4 + Math.random() * 0.3);
  scene.add(p);
  particles.push({
    mesh: p, matPool: isOrange ? "fireOrange" : "fireYellow",
    velocity: new THREE.Vector3((Math.random() - 0.5) * 0.5, 1.5 + Math.random(), (Math.random() - 0.5) * 0.5),
    life: 0.2 + Math.random() * 0.2, maxLife: 0.4,
    gravity: false, isExplosion: false, isSpark: false,
  });
}

/** Small dust puff when a bullet hits terrain — adds a lot of visual feedback. */
function spawnTerrainImpactDust(position) {
  const toSpawn = Math.min(5, MAX_PARTICLES - particles.length);
  for (let i = 0; i < toSpawn; i++) {
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 1.5,
      0.6 + Math.random() * 1.2,
      (Math.random() - 0.5) * 1.5,
    );
    const mat = _getParticleMat("dust", 0x887766);
    mat.opacity = 0.55;
    const p = new THREE.Mesh(_pGeoDebris, mat);
    p.position.copy(position);
    p.scale.setScalar(0.3 + Math.random() * 0.3);
    scene.add(p);
    particles.push({
      mesh: p, matPool: "dust",
      velocity: dir.multiplyScalar(1.5 + Math.random() * 2),
      life: 0.25 + Math.random() * 0.25, maxLife: 0.5,
      gravity: true, isExplosion: false, isSpark: false,
    });
  }
}

function updateWaveDirector(dt) {
  if (waveSpawnBudget <= 0 && zombies.length === 0 && nextWaveTimer <= 0) {
    nextWaveTimer = 5;
    topCenterAlertEl.textContent = `Wave ${wave} cleared!`;
    alertTimer = 2.5;
    playSfx("skill_up", 0.5);
    // Small HP bonus for surviving a wave
    player.hp = Math.min(getPlayerMaxHealth(), player.hp + 10);
    messageEl.textContent = `Wave ${wave} cleared! +10 HP`;
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
        if (!bossAlive) {
          const bossTid = setTimeout(() => { pendingTimeouts.delete(bossTid); if (gameState === "PLAYING" && !gameOver && !bossAlive) spawnBoss(); }, 4000);
          pendingTimeouts.add(bossTid);
        }
        if (grenadeCount < 2) { grenadeCount = 2; }
      } else {
        topCenterAlertEl.textContent = `Wave ${wave} incoming`;
        alertTimer = 3;
        addScreenShake(0.08);
        playSfx("ui_click", 0.6);
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
  scene.background.setHSL(
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

// ─── Static AABB colliders ───────────────────────────────────────────────────
// Any solid (building, parked car, barrel) registers an XZ rectangle here.
// Each entry: { minX, maxX, minZ, maxZ, kind, ref } — ref is the group/mesh
// so we can remove entries when a chunk unloads or a vehicle explodes.
const staticColliders = [];
const PLAYER_RADIUS = 0.55;
const ZOMBIE_RADIUS = 0.48;
const VEHICLE_RADIUS = 1.6;

function registerStaticCollider(obj, pad = 0, kind = "static") {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj);
  if (!isFinite(box.min.x) || !isFinite(box.max.x)) return;
  const entry = {
    minX: box.min.x - pad,
    maxX: box.max.x + pad,
    minZ: box.min.z - pad,
    maxZ: box.max.z + pad,
    kind,
    ref: obj,
  };
  staticColliders.push(entry);
  obj.userData.colliderEntry = entry;
  return entry;
}

function removeStaticCollider(obj) {
  const entry = obj?.userData?.colliderEntry;
  if (!entry) return;
  const idx = staticColliders.indexOf(entry);
  if (idx >= 0) staticColliders.splice(idx, 1);
  obj.userData.colliderEntry = null;
}

// Capsule (circle-in-XZ) push-out against every nearby AABB. O(N) with a tight
// broadphase: skip colliders farther than `skipRange` on either axis.
const COLLIDER_SKIP_RANGE = 50;
function resolveCircleVsStatics(px, pz, radius) {
  let ox = px;
  let oz = pz;
  for (let i = 0; i < staticColliders.length; i++) {
    const c = staticColliders[i];
    if (c.minX - ox > COLLIDER_SKIP_RANGE || ox - c.maxX > COLLIDER_SKIP_RANGE) continue;
    if (c.minZ - oz > COLLIDER_SKIP_RANGE || oz - c.maxZ > COLLIDER_SKIP_RANGE) continue;

    const closestX = Math.max(c.minX, Math.min(ox, c.maxX));
    const closestZ = Math.max(c.minZ, Math.min(oz, c.maxZ));
    const dx = ox - closestX;
    const dz = oz - closestZ;
    const dSq = dx * dx + dz * dz;
    if (dSq >= radius * radius) continue;

    const d = Math.sqrt(dSq);
    if (d < 0.0001) {
      // Inside the box — push out along the shortest axis.
      const leftPen = ox - c.minX;
      const rightPen = c.maxX - ox;
      const backPen = oz - c.minZ;
      const frontPen = c.maxZ - oz;
      const minPen = Math.min(leftPen, rightPen, backPen, frontPen);
      if (minPen === leftPen) ox = c.minX - radius;
      else if (minPen === rightPen) ox = c.maxX + radius;
      else if (minPen === backPen) oz = c.minZ - radius;
      else oz = c.maxZ + radius;
    } else {
      const push = (radius - d) / d;
      ox += dx * push;
      oz += dz * push;
    }
  }
  return { x: ox, z: oz };
}

function isCircleClearOfStatics(px, pz, radius) {
  for (const c of staticColliders) {
    const closestX = Math.max(c.minX, Math.min(px, c.maxX));
    const closestZ = Math.max(c.minZ, Math.min(pz, c.maxZ));
    const dx = px - closestX;
    const dz = pz - closestZ;
    if (dx * dx + dz * dz < radius * radius) return false;
  }
  return true;
}

function resolvePlayerObstacles() {
  const r = resolveCircleVsStatics(player.position.x, player.position.z, PLAYER_RADIUS);
  player.position.x = r.x;
  player.position.z = r.z;
}

function resolveZombieObstacles(zombie) {
  const radius = zombie.type === "juggernaut" ? 0.78 : zombie.type === "crawler" ? 0.34 : ZOMBIE_RADIUS;
  const r = resolveCircleVsStatics(zombie.mesh.position.x, zombie.mesh.position.z, radius);
  zombie.mesh.position.x = r.x;
  zombie.mesh.position.z = r.z;
}

function resolveVehicleObstacles(vehicle) {
  const r = resolveCircleVsStatics(vehicle.mesh.position.x, vehicle.mesh.position.z, VEHICLE_RADIUS);
  vehicle.mesh.position.x = r.x;
  vehicle.mesh.position.z = r.z;
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
      minimapCtx.fillStyle = mate.downed ? "#ff4444" : "#6bc7ff";
      minimapCtx.beginPath();
      minimapCtx.arc(rx, rz, mate.downed ? 3.5 : 2.8, 0, Math.PI * 2);
      minimapCtx.fill();
      if (mate.downed) {
        // Pulsing ring for downed teammates
        minimapCtx.strokeStyle = `rgba(255,68,68,${0.4 + 0.4 * Math.sin(gameTime * 4)})`;
        minimapCtx.lineWidth = 1.5;
        minimapCtx.beginPath();
        minimapCtx.arc(rx, rz, 5, 0, Math.PI * 2);
        minimapCtx.stroke();
      }
    }
  }

  for (const vehicle of vehicles) {
    const relX = vehicle.mesh.position.x - player.position.x;
    const relZ = vehicle.mesh.position.z - player.position.z;
    const rx = (relX / worldRadius) * (center - 12);
    const rz = (relZ / worldRadius) * (center - 12);
    if (Math.hypot(rx, rz) < center - 10) {
      minimapCtx.save();
      minimapCtx.translate(rx, rz);
      minimapCtx.rotate(vehicle.yaw - player.yaw);
      minimapCtx.fillStyle = vehicle.destroyed ? "rgba(120,120,120,0.7)" : vehicle === activeVehicle ? "#ffffff" : "#f0b35a";
      minimapCtx.fillRect(-3.8, -2.2, 7.6, 4.4);
      minimapCtx.restore();
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
  hudStatsRefreshTimer -= dt;
  if (hudStatsRefreshTimer <= 0) {
    const ammoTypeLabel = activeWpn.ammoType || (activeWpn.pellets ? "Shells" : "Ammo");
    const ammoLabel = `${player.ammo}/${player.reserveAmmo} ${ammoTypeLabel}`;
    const wpnNum = `[${player.activeWeapon + 1}]`;
    const wpnUpg = activeWpn.upgrades && Object.keys(activeWpn.upgrades).length > 0 ? " +" : "";
    statsMetaEl.textContent = `Map: ${activeMapConfig.name} | ${activeWpn.name}${wpnUpg} ${wpnNum} | ${ammoLabel} | Kills: ${player.kills} | Zombies: ${zombies.length} | Team: ${teammates.length + 1}`;
    if (extraMetaEl) {
      const throwStr = `🔥${molotovCount} 💥${grenadeCount} ⛏${landMineCount} 🗡${spikeTrapCount}`;
      const downedInfo = teammates.filter(m => m.downed).map((m, i) => `⚠DOWN ${Math.ceil(m.downedTimer)}s`).join(" ");
      extraMetaEl.textContent = `${throwStr} | 📢 ${noiseMakerCount} | Score: ${score}${isCrouching ? " | [CROUCH]" : ""}${isADS ? " | [ADS]" : ""}${meleeCooldown > 0 ? " | [KNIFE CD]" : ""}${downedInfo ? ` | ${downedInfo}` : ""}`;
    }
    if (skillMetaEl) {
      const activeSkills = Object.values(skills)
        .filter((s) => s.level > 0)
        .map((s) => `${s.name} ${s.level}`)
        .join(", ");
      const xpTarget = 120 + skillPoints * 40;
      const globalLvl = getLevel(playerProgression);
      const globalXp = playerProgression.xp || 0;
      const globalNext = getXPForCurrentLevel(playerProgression) || 0;
      const globalStr = globalNext > 0 ? `Lvl ${globalLvl} [${globalXp}/${globalNext}]` : `Lvl ${globalLvl} (MAX)`;
      skillMetaEl.textContent = `${globalStr} | SP:${skillPoints} XP:${Math.floor(skillXp)}/${xpTarget} | Shift+1..5${activeSkills ? ` | ${activeSkills}` : ""}`;
    }
    const elapsed = Math.floor(gameTime);
    const mm = `${Math.floor(elapsed / 60)}`.padStart(2, "0");
    const ss = `${elapsed % 60}`.padStart(2, "0");
    worldStatsEl.textContent = `Wave ${wave} | ${mm}:${ss}`;
    hudStatsRefreshTimer = 0.12;
  }
  // Low ammo warning: flash when mag is nearly empty
  const magPct = player.ammo / (activeWpn.magSize || 1);
  lowAmmoWarning = magPct <= 0.25 && player.ammo > 0;
  const emptyMag = player.ammo === 0 && player.reserveAmmo === 0;
  if (lowAmmoWarning || emptyMag) {
    const pulse = Math.sin(gameTime * 6) > 0;
    statsMetaEl.style.color = pulse ? "#ff4444" : "";
  } else {
    statsMetaEl.style.color = "";
  }
  minimapRefreshTimer -= dt;
  if (minimapRefreshTimer <= 0) {
    drawMinimap();
    minimapRefreshTimer = adaptiveQuality.level >= 1 ? 0.22 : 0.14;
  }

  player.damageFlash = Math.max(0, player.damageFlash - dt * 1.5);
  // Damage direction indicator
  if (_damageDirTimer > 0) {
    _damageDirTimer -= dt;
    damageDirEl.style.opacity = `${Math.min(1, _damageDirTimer * 2.5)}`;
  } else {
    damageDirEl.style.opacity = "0";
  }
  // Low health vignette: persistent pulsing red when HP < 30%
  const hpPct = player.hp / getPlayerMaxHealth();
  if (hpPct < 0.3 && hpPct > 0 && !gameOver) {
    const lowHpPulse = 0.08 + 0.06 * Math.sin(gameTime * 3);
    damageFlashEl.style.opacity = `${Math.max(player.damageFlash * 0.35, lowHpPulse)}`;
  } else {
    damageFlashEl.style.opacity = `${player.damageFlash * 0.35}`;
  }
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
  weaponHudRefreshTimer -= dt;
  if (weaponHudRefreshTimer <= 0) {
    renderWeaponSlotsHUD();
    weaponHudRefreshTimer = 0.2;
  }
  missionHudRefreshTimer -= dt;
  if (missionHudRefreshTimer <= 0) {
    renderMissionListHUD();
    missionHudRefreshTimer = 0.25;
  }
  objectiveCompassRefreshTimer -= dt;
  if (objectiveCompassRefreshTimer <= 0) {
    updateObjectiveCompass();
    objectiveCompassRefreshTimer = 0.08;
  }
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

function getMissionTarget(mission) {
  if (!mission) return null;
  if (mission.type === MISSION_TYPES.DEFEND && mission.position) {
    return { label: "Defend position", position: mission.position, urgency: 2 };
  }
  if (mission.type === MISSION_TYPES.RESCUE) {
    if (mission.survivorFound) {
      return { label: "Escort survivor home", position: { x: 0, y: 0, z: 0 }, urgency: 1.7 };
    }
    if (mission.position) return { label: "Find survivor", position: mission.position, urgency: 2.2 };
  }
  if (mission.type === MISSION_TYPES.SUPPLY_RUN) {
    if (mission.reached && mission.returnPosition) {
      return { label: "Return supplies", position: mission.returnPosition, urgency: 1.8 };
    }
    if (mission.position) return { label: "Reach supply point", position: mission.position, urgency: 1.6 };
  }
  return null;
}

function collectObjectiveCompassTargets() {
  const targets = [];
  for (const mate of teammates) {
    if (!mate.downed) continue;
    targets.push({
      label: "Revive teammate",
      position: mate.mesh.position,
      urgency: 5,
    });
  }

  if (eventDirector?.survivorActive && eventDirector.survivorPosition) {
    targets.push({
      label: "Defend survivor",
      position: eventDirector.survivorPosition,
      urgency: 4,
    });
  }

  for (const drop of supplyDrops) {
    if (drop.opened) continue;
    targets.push({
      label: drop.dropType === "weapon_crate" ? "Weapon crate" : drop.landed ? "Supply drop" : "Incoming supply drop",
      position: drop.mesh.position,
      urgency: drop.dropType === "weapon_crate" ? 3.4 : 2.8,
    });
  }

  for (const mission of missionGenerator.activeMissions) {
    const target = getMissionTarget(mission);
    if (target) targets.push(target);
  }
  return targets;
}

function updateObjectiveCompass() {
  if (!objectiveCompassEl || gameState !== "PLAYING" || gameOver) {
    if (objectiveCompassEl) objectiveCompassEl.classList.remove("is-visible");
    return;
  }

  let best = null;
  let bestScore = -Infinity;
  for (const target of collectObjectiveCompassTargets()) {
    const dx = target.position.x - player.position.x;
    const dz = target.position.z - player.position.z;
    const distance = Math.hypot(dx, dz);
    const score = target.urgency * 1000 - distance;
    if (score > bestScore) {
      bestScore = score;
      best = { ...target, dx, dz, distance };
    }
  }

  if (!best) {
    objectiveCompassEl.classList.remove("is-visible");
    return;
  }

  const worldAngle = Math.atan2(best.dx, best.dz);
  const relativeAngle = worldAngle - player.yaw;
  objectiveCompassArrowEl.style.transform = `rotate(${relativeAngle}rad)`;
  objectiveCompassLabelEl.textContent = best.label;
  objectiveCompassDistanceEl.textContent = `${Math.round(best.distance)}m`;
  objectiveCompassEl.classList.add("is-visible");
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
    div.innerHTML = `<span class="weapon-slot-key">${slotMap[i] || i + 1}</span><span class="weapon-slot-name">${w.name}</span><span class="weapon-slot-ammo">${w.ammo}/${w.reserve} ${w.ammoType || ""}</span>`;
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

  // Teammate health bars
  const tBarW = 36;
  const tBarH = 4;
  for (const mate of teammates) {
    const dist = mate.mesh.position.distanceTo(player.position);
    if (dist > 30) continue;
    _hpProjVec.set(mate.mesh.position.x, mate.mesh.position.y + 2.6, mate.mesh.position.z);
    _hpProjVec.project(camera);
    if (_hpProjVec.z > 1) continue;
    const sx = (_hpProjVec.x * 0.5 + 0.5) * w;
    const sy = (-_hpProjVec.y * 0.5 + 0.5) * h;
    if (sx < 0 || sx > w || sy < 0 || sy > h) continue;
    const pct = Math.max(0, mate.hp / mate.maxHp);
    const bx = sx - tBarW / 2;
    const by = sy - tBarH - 2;
    hpBarCtx.fillStyle = "rgba(0,0,0,0.5)";
    hpBarCtx.fillRect(bx - 1, by - 1, tBarW + 2, tBarH + 2);
    // Green for healthy, red for low
    const tr = Math.round(255 * (1 - pct));
    const tg = Math.round(220 * pct);
    hpBarCtx.fillStyle = mate.downed ? "rgba(255,80,80,0.9)" : `rgb(${tr},${tg},60)`;
    hpBarCtx.fillRect(bx, by, tBarW * pct, tBarH);
    hpBarCtx.strokeStyle = "rgba(255,255,255,0.3)";
    hpBarCtx.lineWidth = 0.5;
    hpBarCtx.strokeRect(bx - 0.5, by - 0.5, tBarW + 1, tBarH + 1);
    // Downed label and revive progress
    if (mate.downed) {
      hpBarCtx.fillStyle = "rgba(255,100,100,0.9)";
      hpBarCtx.font = "bold 8px sans-serif";
      hpBarCtx.textAlign = "center";
      hpBarCtx.fillText("DOWN", sx, by - 2);
      // Revive progress bar
      if (mate.beingRevived) {
        const revPct = Math.min(1, mate.reviveTimer / 3);
        const revBarW = 30;
        const revBarH = 3;
        const rbx = sx - revBarW / 2;
        const rby = by + tBarH + 3;
        hpBarCtx.fillStyle = "rgba(0,0,0,0.5)";
        hpBarCtx.fillRect(rbx - 1, rby - 1, revBarW + 2, revBarH + 2);
        hpBarCtx.fillStyle = "rgba(68,255,136,0.9)";
        hpBarCtx.fillRect(rbx, rby, revBarW * revPct, revBarH);
        hpBarCtx.strokeStyle = "rgba(255,255,255,0.3)";
        hpBarCtx.lineWidth = 0.5;
        hpBarCtx.strokeRect(rbx - 0.5, rby - 0.5, revBarW + 1, revBarH + 1);
      }
    }
  }
}

function maybeDrawEnemyHealthBars(dt) {
  enemyHealthBarsRefreshTimer -= dt;
  if (enemyHealthBarsRefreshTimer > 0) return;
  drawEnemyHealthBars();
  enemyHealthBarsRefreshTimer = adaptiveQuality.level >= 1 ? 0.18 : 0.1;
}

// ─── Floating Damage Numbers ──────────────────────────────────────────────────
const _projVec = new THREE.Vector3();
const MAX_FLOATING_DAMAGE = 40;
function spawnFloatingDamage(worldPosition, amount, isHeadshot = false) {
  if (!amount || amount <= 0) return;
  if (floatingDamageNums.length >= MAX_FLOATING_DAMAGE) return;
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

// ─── Blood Decals ────────────────────────────────────────────────────────────
/** Drop a flat blood splat on the ground at (x, z). Fades over `life` seconds.
 *  Recycles the oldest decal when the cap is hit. */
function spawnBloodDecal(x, z, scale = 1, life = 28) {
  const y = terrainHeight(x, z) + 0.02; // tiny lift to avoid z-fighting
  // Real CC0 blood splatter texture (OpenGameArt). Mix splatter / drops randomly
  // for variety. The PNG already has transparency, so we use `map` + `transparent`
  // and tint via `color` to keep the kill darker over time.
  const useDrops = Math.random() < 0.35;
  const mat = new THREE.MeshBasicMaterial({
    map: useDrops ? bloodDropsTex : bloodSplatterTex,
    color: 0x882020,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(_pGeoDecal, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  mesh.scale.setScalar(0.85 + Math.random() * 0.4 + (scale - 1) * 0.4);
  mesh.rotation.z = Math.random() * Math.PI * 2;
  scene.add(mesh);

  if (bloodDecals.length >= MAX_BLOOD_DECALS) {
    const old = bloodDecals.shift();
    scene.remove(old.mesh);
    old.mesh.material.dispose();
  }
  bloodDecals.push({ mesh, life, maxLife: life });
}

function updateBloodDecals(dt) {
  for (let i = bloodDecals.length - 1; i >= 0; i--) {
    const d = bloodDecals[i];
    d.life -= dt;
    if (d.life <= 0) {
      scene.remove(d.mesh);
      d.mesh.material.dispose();
      bloodDecals.splice(i, 1);
      continue;
    }
    // Fade out across the last 4 seconds of life so they don't pop out.
    if (d.life < 4) d.mesh.material.opacity = 0.95 * (d.life / 4);
  }
}

// ─── Blood Particles ─────────────────────────────────────────────────────────
function spawnBloodParticles(position, count = 6) {
  const toSpawn = Math.min(count, MAX_PARTICLES - particles.length);
  for (let i = 0; i < toSpawn; i++) {
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      0.2 + Math.random() * 1.8,
      (Math.random() - 0.5) * 2,
    ).normalize();
    const mat = _getParticleMat("blood", 0x8b0000);
    const p = new THREE.Mesh(_pGeoBlood, mat);
    p.position.copy(position);
    p.position.y += 1.3 + Math.random() * 0.5;
    scene.add(p);
    particles.push({
      mesh: p, matPool: "blood",
      velocity: dir.multiplyScalar(2.5 + Math.random() * 6),
      life: 0.18 + Math.random() * 0.28,
      maxLife: 0.46,
      gravity: true,
      isExplosion: false,
    });
  }
}

// Max WebGL resource frees per frame to prevent dispose-stutter.
const MAX_DISPOSES_PER_FRAME = 12;

function updateParticles(dt) {
  let disposedThisFrame = 0;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      scene.remove(p.mesh);
      if (p.matPool) {
        _returnParticleMat(p.matPool, p.mesh.material);
        // Don't dispose geometry (shared + preventDispose) — just detach mesh
      } else if (disposedThisFrame < MAX_DISPOSES_PER_FRAME) {
        disposeOwnedObject3D(p.mesh);
        disposedThisFrame++;
      }
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
  // Explosions alert zombies in a wider radius than gunshots.
  emitSoundEvent(distractions, position, "explosion", 3.5);
  spawnFireParticles(position, 14);
  spawnSparks(position, 8);
  // Debris particles — use shared geometry to avoid geometry allocation per particle
  const debrisCount = Math.min(18, MAX_PARTICLES - particles.length);
  for (let i = 0; i < debrisCount; i++) {
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * 2.8,
      (Math.random() - 0.5) * 2,
    ).normalize();
    const isOrange = Math.random() < 0.5;
    const mat = _getParticleMat(isOrange ? "fireOrange" : "fireYellow", isOrange ? 0xff8800 : 0xff3300);
    const p = new THREE.Mesh(_pGeoDebris, mat);
    p.position.copy(position);
    scene.add(p);
    particles.push({
      mesh: p, matPool: isOrange ? "fireOrange" : "fireYellow",
      velocity: dir.multiplyScalar(6 + Math.random() * 14),
      life: 0.3 + Math.random() * 0.4,
      maxLife: 0.7,
      gravity: true,
      isExplosion: false,
    });
  }
  // Flash sphere — this one stays large, give it its own geometry
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.92, depthWrite: false }),
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
      lastDamageTime = gameTime;
      showDamageDirection(position);
      triggerHitStop(0.08);
      if (player.hp <= 0) killPlayer("Killed by explosion.");
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
    const fp = f.mesh.position;
    if (gameState === "PLAYING" && !gameOver) {
      const d = fp.distanceTo(player.position);
      if (d < f.radius) {
        player.hp = Math.max(0, player.hp - f.damagePerSecond * dt * 0.55);
        player.damageFlash = 0.45;
        lastDamageTime = gameTime;
        if (player.hp <= 0) killPlayer("Burned by fire...");
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

function updateLandMines(_dt) {
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

// ─── Auto-Turret ──────────────────────────────────────────────────────────────
// Deployable sentry gun that targets the nearest zombie within range and fires
// automatically. Uses downloaded PBR textures for the body and barrel.
const TURRET_RANGE = 18;
const TURRET_DAMAGE = 14;
const TURRET_FIRE_RATE = 0.22; // seconds between shots
const TURRET_LIFETIME = 90;   // seconds before it runs out of ammo / breaks
const TURRET_MAX_ACTIVE = 3;

function placeTurret() {
  if (!pointerLocked || gameOver || turretCount <= 0) return;
  if (turrets.length >= TURRET_MAX_ACTIVE) {
    messageEl.textContent = "Max turrets deployed! Destroy one first.";
    return;
  }
  turretCount -= 1;
  playSfx("ui_click", 1.2);
  const dir = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const pos = player.position.clone().addScaledVector(dir, 2.5);
  pos.y = terrainHeight(pos.x, pos.z);

  const group = new THREE.Group();

  // Tripod legs
  const legMat = new THREE.MeshStandardMaterial({
    ...turretBarrelPbr, metalness: 0.7, roughness: 0.45,
  });
  for (let k = 0; k < 3; k++) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.55, 6), legMat);
    const a = (k / 3) * Math.PI * 2;
    leg.position.set(Math.cos(a) * 0.3, 0.25, Math.sin(a) * 0.3);
    leg.rotation.z = Math.cos(a) * 0.35;
    leg.rotation.x = Math.sin(a) * 0.35;
    leg.castShadow = true;
    group.add(leg);
  }

  // Body (box with painted metal texture)
  const bodyMat = new THREE.MeshStandardMaterial({
    ...turretBodyPbr, metalness: 0.3, roughness: 0.65,
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.35), bodyMat);
  body.position.y = 0.58;
  body.castShadow = true;
  group.add(body);

  // Barrel (cylinder with bare metal texture)
  const barrelMat = new THREE.MeshStandardMaterial({
    ...turretBarrelPbr, metalness: 0.85, roughness: 0.3,
  });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.55, 8), barrelMat);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.58, -0.4);
  barrel.castShadow = true;
  group.add(barrel);

  // Muzzle tip indicator (small emissive ring)
  const muzzleTip = new THREE.Mesh(
    new THREE.RingGeometry(0.025, 0.04, 8),
    new THREE.MeshBasicMaterial({ color: 0xff4400, side: THREE.DoubleSide }),
  );
  muzzleTip.rotation.x = Math.PI / 2;
  muzzleTip.position.set(0, 0.58, -0.68);
  group.add(muzzleTip);

  // Status LED
  const led = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0x00ff44 }),
  );
  led.position.set(0.18, 0.72, 0);
  group.add(led);

  group.position.set(pos.x, pos.y, pos.z);
  scene.add(group);

  turrets.push({
    mesh: group,
    barrel,
    muzzleTip,
    led,
    range: TURRET_RANGE,
    damage: TURRET_DAMAGE,
    fireCd: 0,
    muzzleFlash: 0,
    lifetime: TURRET_LIFETIME,
    yaw: player.yaw,
  });
  messageEl.textContent = `Auto-turret deployed! (${turretCount} left, ${Math.round(TURRET_LIFETIME)}s lifespan)`;
  updateHUDMaterials();
}

function updateTurrets(dt) {
  for (let ti = turrets.length - 1; ti >= 0; ti--) {
    const t = turrets[ti];
    t.lifetime -= dt;
    t.fireCd = Math.max(0, t.fireCd - dt);

    // Blink LED yellow when low on time
    if (t.lifetime < 15) {
      t.led.material.color.setHex(Math.sin(gameTime * 6) > 0 ? 0xffaa00 : 0x442200);
    }

    if (t.lifetime <= 0) {
      // Turret expires — small spark burst
      spawnSparks(t.mesh.position, 12);
      playSpatialSfx("explosion", t.mesh.position, 0.3);
      scene.remove(t.mesh);
      t.mesh.traverse((o) => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } });
      turrets.splice(ti, 1);
      messageEl.textContent = "A turret ran out of ammo!";
      continue;
    }

    // Find nearest zombie in range
    let nearestDist = t.range * t.range;
    let nearestIdx = -1;
    for (let zi = 0; zi < zombies.length; zi++) {
      const dSq = t.mesh.position.distanceToSquared(zombies[zi].mesh.position);
      if (dSq < nearestDist) {
        nearestDist = dSq;
        nearestIdx = zi;
      }
    }

    if (nearestIdx >= 0) {
      // Aim toward target
      const target = zombies[nearestIdx].mesh.position;
      const dx = target.x - t.mesh.position.x;
      const dz = target.z - t.mesh.position.z;
      const targetYaw = Math.atan2(-dx, -dz);
      // Smooth rotation with clamped angular velocity
      let diff = targetYaw - t.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const maxTurnSpeed = 6; // radians per second
      const turnStep = Math.sign(diff) * Math.min(Math.abs(diff), maxTurnSpeed * dt);
      t.yaw += turnStep;
      // Rotate barrel group around Y
      t.barrel.position.x = -Math.sin(t.yaw - t.mesh.rotation.y) * 0.4;
      t.barrel.position.z = -Math.cos(t.yaw - t.mesh.rotation.y) * 0.4;
      t.barrel.rotation.y = t.yaw - t.mesh.rotation.y;
      t.muzzleTip.position.x = -Math.sin(t.yaw - t.mesh.rotation.y) * 0.68;
      t.muzzleTip.position.z = -Math.cos(t.yaw - t.mesh.rotation.y) * 0.68;

      // Muzzle flash cooldown
      if (t.muzzleFlash > 0) {
        t.muzzleFlash -= dt;
        if (t.muzzleFlash <= 0) {
          t.muzzleTip.material.color.setHex(0xff4400);
        }
      }

      // Fire
      if (t.fireCd <= 0) {
        t.fireCd = TURRET_FIRE_RATE;
        applyZombieDamage(nearestIdx, t.damage);
        // Muzzle flash
        t.muzzleTip.material.color.setHex(0xffcc00);
        t.muzzleFlash = 0.05;
        // Spark at zombie
        if (zombies[nearestIdx]) {
          spawnSparks(zombies[nearestIdx].mesh.position.clone().setY(
            zombies[nearestIdx].mesh.position.y + 1.2), 3);
        }
        playSpatialSfx("pistol_fire", t.mesh.position, 0.35);
      }
    }
  }
}

// ─── Toxic Barrels ────────────────────────────────────────────────────────────
// Green barrels that spawn on maps. When shot, they explode into a toxic gas
// cloud that damages and slows zombies within it. Uses downloaded PBR textures
// tinted green via emissive.
const TOXIC_BARREL_CLOUD_RADIUS = 5.5;
const TOXIC_BARREL_CLOUD_DPS = 15;
const TOXIC_BARREL_CLOUD_DURATION = 8;
const toxicClouds = [];

function spawnToxicBarrel(x, z) {
  const y = terrainHeight(x, z);
  const group = new THREE.Group();

  // Barrel body (cylinder)
  const barrelMat = new THREE.MeshStandardMaterial({
    ...toxicBarrelPbr,
    metalness: 0.35,
    roughness: 0.6,
    emissive: new THREE.Color(0x114400),
    emissiveIntensity: 0.15,
  });
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.38, 1.0, 12), barrelMat);
  barrel.position.y = 0.5;
  barrel.castShadow = true;
  group.add(barrel);

  // Hazard stripe band
  const stripe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.39, 0.12, 12),
    new THREE.MeshStandardMaterial({
      color: 0x222222, metalness: 0.2, roughness: 0.9,
      emissive: new THREE.Color(0x33ff00), emissiveIntensity: 0.08,
    }),
  );
  stripe.position.y = 0.7;
  group.add(stripe);

  // Top cap
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.35, 0.06, 12),
    new THREE.MeshStandardMaterial({ color: 0x334433, metalness: 0.5, roughness: 0.5 }),
  );
  cap.position.y = 1.02;
  group.add(cap);

  // Subtle green glow point light
  const glow = new THREE.PointLight(0x44ff22, 0.3, 4);
  glow.position.y = 0.8;
  group.add(glow);

  group.position.set(x, y, z);
  scene.add(group);
  toxicBarrels.push({ mesh: group, hp: 30 });
}

function damageToxicBarrel(barrelIdx, damage) {
  const b = toxicBarrels[barrelIdx];
  b.hp -= damage;
  if (b.hp <= 0) {
    const pos = b.mesh.position.clone();
    scene.remove(b.mesh);
    b.mesh.traverse((o) => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } });
    toxicBarrels.splice(barrelIdx, 1);
    // Spawn toxic cloud
    createToxicCloud(pos);
    playSpatialSfx("explosion", pos, 0.6);
    spawnFireParticles(pos, 6);
    topCenterAlertEl.textContent = "☣ Toxic cloud!";
    alertTimer = 2;
  }
}

function createToxicCloud(position) {
  // Visual: translucent green sphere
  const cloud = new THREE.Mesh(
    new THREE.SphereGeometry(TOXIC_BARREL_CLOUD_RADIUS, 16, 12),
    new THREE.MeshBasicMaterial({
      color: 0x22ff44, transparent: true, opacity: 0.15,
      side: THREE.DoubleSide, depthWrite: false,
    }),
  );
  cloud.position.copy(position);
  cloud.position.y += 1.5;
  scene.add(cloud);

  // Inner glow
  const inner = new THREE.PointLight(0x33ff11, 1.5, TOXIC_BARREL_CLOUD_RADIUS * 1.2);
  inner.position.copy(position);
  inner.position.y += 1;
  scene.add(inner);

  toxicClouds.push({
    mesh: cloud,
    light: inner,
    position: position.clone(),
    radius: TOXIC_BARREL_CLOUD_RADIUS,
    dps: TOXIC_BARREL_CLOUD_DPS,
    life: TOXIC_BARREL_CLOUD_DURATION,
    maxLife: TOXIC_BARREL_CLOUD_DURATION,
  });
}

function updateToxicClouds(dt) {
  for (let ci = toxicClouds.length - 1; ci >= 0; ci--) {
    const c = toxicClouds[ci];
    c.life -= dt;
    const t = c.life / c.maxLife;
    c.mesh.material.opacity = 0.15 * t;
    c.mesh.scale.setScalar(1 + (1 - t) * 0.3); // expand slightly as it fades
    c.light.intensity = 1.5 * t;

    // Spawn rising green wisp particles
    if (particles.length < MAX_PARTICLES && Math.random() < 0.35) {
      const mat = _getParticleMat("toxic", 0x33ff33);
      mat.opacity = 0.6;
      const wisp = new THREE.Mesh(_pGeoToxic, mat);
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * c.radius * 0.8;
      wisp.position.set(
        c.position.x + Math.cos(angle) * r,
        c.position.y + Math.random() * 0.5,
        c.position.z + Math.sin(angle) * r,
      );
      scene.add(wisp);
      particles.push({
        mesh: wisp,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.4, 1.2 + Math.random() * 0.8, (Math.random() - 0.5) * 0.4),
        life: 0.6 + Math.random() * 0.5,
        maxLife: 1.1,
        gravity: false,
        isExplosion: false,
        matPool: "toxic",
      });
    }

    if (c.life <= 0) {
      scene.remove(c.mesh);
      scene.remove(c.light);
      c.mesh.geometry.dispose();
      c.mesh.material.dispose();
      c.light.dispose();
      toxicClouds.splice(ci, 1);
      continue;
    }

    // Damage + slow zombies inside
    for (let zi = zombies.length - 1; zi >= 0; zi--) {
      const dSq = c.position.distanceToSquared(zombies[zi].mesh.position);
      if (dSq < c.radius * c.radius) {
        applyZombieDamage(zi, c.dps * dt);
        if (zombies[zi]) {
          // Slow effect
          zombies[zi]._toxicSlow = 0.5; // 50% speed for next tick
        }
      }
    }

    // Also damage player if inside
    const playerDist = player.position.distanceToSquared(c.position);
    if (playerDist < c.radius * c.radius) {
      player.hp = Math.max(0, player.hp - c.dps * dt * 0.4);
      if (player.hp <= 0) killPlayer("Poisoned by toxic gas...");
    }
  }
}

// ─── Loot Crates ──────────────────────────────────────────────────────────────
// Searchable crates that spawn on the map. Walk up and press E to search them
// for materials, ammo, or grenades. Uses downloaded PBR plank textures.
const LOOT_CRATE_INTERACT_DIST = 3.5;
let _lootCratePromptShown = false;

function spawnLootCrate(x, z) {
  const y = terrainHeight(x, z);
  const group = new THREE.Group();

  // Main crate box
  const crateMat = new THREE.MeshStandardMaterial({
    ...lootCratePbr, metalness: 0.0, roughness: 0.85,
  });
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.65, 0.6), crateMat);
  crate.position.y = 0.33;
  crate.castShadow = true;
  crate.receiveShadow = true;
  group.add(crate);

  // Metal corner brackets
  const bracketMat = new THREE.MeshStandardMaterial({
    color: 0x555555, metalness: 0.8, roughness: 0.4,
  });
  for (let cx = -1; cx <= 1; cx += 2) {
    for (let cz = -1; cz <= 1; cz += 2) {
      const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.68, 0.06), bracketMat);
      bracket.position.set(cx * 0.42, 0.34, cz * 0.27);
      group.add(bracket);
    }
  }

  // Lid (slightly ajar for visual interest)
  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.06, 0.62), crateMat);
  lid.position.set(0, 0.68, 0);
  lid.rotation.z = 0.04;
  lid.castShadow = true;
  group.add(lid);

  // Small "loot glow" from inside
  const glow = new THREE.PointLight(0xffcc44, 0.4, 3);
  glow.position.set(0, 0.5, 0);
  group.add(glow);

  group.position.set(x, y, z);
  group.rotation.y = Math.random() * Math.PI * 2;
  scene.add(group);
  lootCrates.push({ mesh: group, glow, lid, searched: false, openAnim: 0 });
}

function searchNearbyLootCrate() {
  for (let ci = lootCrates.length - 1; ci >= 0; ci--) {
    const c = lootCrates[ci];
    if (c.searched) continue;
    const dSq = player.position.distanceToSquared(c.mesh.position);
    if (dSq < LOOT_CRATE_INTERACT_DIST * LOOT_CRATE_INTERACT_DIST) {
      c.searched = true;
      c.openAnim = 0.001; // start open animation
      playSfx("ui_click", 1);

      // Random loot
      const lootRoll = Math.random();
      let msg = "Loot crate: ";
      if (lootRoll < 0.3) {
        // Materials
        const matTypes = ["scrap", "metal", "wood", "cloth", "chemicals"];
        const mat1 = matTypes[Math.floor(Math.random() * matTypes.length)];
        const mat2 = matTypes[Math.floor(Math.random() * matTypes.length)];
        const amt1 = 2 + Math.floor(Math.random() * 3);
        const amt2 = 1 + Math.floor(Math.random() * 2);
        materials[mat1] = (materials[mat1] || 0) + amt1;
        materials[mat2] = (materials[mat2] || 0) + amt2;
        msg += `+${amt1} ${mat1}, +${amt2} ${mat2}`;
      } else if (lootRoll < 0.55) {
        // Ammo for random weapon
        const wpn = player.weapons[Math.floor(Math.random() * player.weapons.length)];
        const ammoAmt = Math.floor(wpn.magSize * 1.5);
        const cap = getWeaponReserveCap(wpn);
        wpn.reserve = Math.min(wpn.reserve + ammoAmt, cap);
        syncPlayerAmmoFields(player);
        msg += `+${ammoAmt} ${wpn.name} ammo`;
      } else if (lootRoll < 0.72) {
        // Grenade + materials
        grenadeCount = Math.min(grenadeCount + 2, 8);
        materials.scrap = (materials.scrap || 0) + 2;
        msg += "+2 grenades, +2 scrap";
      } else if (lootRoll < 0.85) {
        // Medkit heal
        player.hp = Math.min(getPlayerMaxHealth(), player.hp + 35);
        materials.cloth = (materials.cloth || 0) + 1;
        msg += "+35 HP, +1 cloth";
      } else {
        // Jackpot — lots of materials
        const matTypes = ["scrap", "metal", "wood", "cloth", "chemicals"];
        msg += "Jackpot! ";
        for (const m of matTypes) {
          const amt = 2 + Math.floor(Math.random() * 3);
          materials[m] = (materials[m] || 0) + amt;
          msg += `+${amt} ${m} `;
        }
      }
      messageEl.textContent = msg;
      score += 50;
      updateHUDMaterials();
      addSkillXP(5);
      return true;
    }
  }
  return false;
}

function updateLootCratePrompt() {
  let showPrompt = false;
  for (const c of lootCrates) {
    if (c.searched) continue;
    const dSq = player.position.distanceToSquared(c.mesh.position);
    if (dSq < LOOT_CRATE_INTERACT_DIST * LOOT_CRATE_INTERACT_DIST) {
      showPrompt = true;
      break;
    }
  }
  if (showPrompt && !_lootCratePromptShown) {
    _lootCratePromptShown = true;
    messageEl.textContent = "Press [F] to search crate";
  } else if (!showPrompt && _lootCratePromptShown) {
    _lootCratePromptShown = false;
  }
}

function updateLootCrateAnims(dt) {
  for (const c of lootCrates) {
    if (c.openAnim > 0 && c.openAnim < 1) {
      c.openAnim = Math.min(1, c.openAnim + dt * 2.2);
      // Lid swings open (rotates around back edge)
      const t = c.openAnim;
      const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) * (-2 * t + 2) / 2; // easeInOutQuad
      c.lid.rotation.z = 0.04 + ease * 1.2; // ~70 degrees open
      c.lid.position.y = 0.68 - ease * 0.08;
      // Fade glow out as it opens
      c.glow.intensity = 0.4 * (1 - ease);
    }
  }
}

function useThrowableOrTrap() {
  if (!pointerLocked || gameOver) return;
  if (molotovCount > 0) {
    throwMolotov();
    return;
  }
  if (turretCount > 0) {
    placeTurret();
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
function spawnArrow(origin, direction, damage, weapon = {}) {
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
    bleedDamage: weapon.bleedDamage || 0,
    retrieveChance: weapon.retrieveChance || 0,
    life: 1.8,
    stuck: false,
    stuckTimer: 0,
  });
}

const _arrowDir     = new THREE.Vector3();
const _arrowForward = new THREE.Vector3(0, 0, 1);
const _arrowStickOff = new THREE.Vector3(0, 1.2, 0);
const _arrowPrev    = new THREE.Vector3();
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
    _arrowPrev.copy(a.mesh.position);
    a.mesh.position.addScaledVector(a.velocity, dt);
    _arrowDir.copy(a.velocity).normalize();
    a.mesh.quaternion.setFromUnitVectors(_arrowForward, _arrowDir);
    if (a.life <= 0) {
      scene.remove(a.mesh);
      a.mesh.traverse(o => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } });
      arrows.splice(i, 1);
      continue;
    }
    // Block arrows on scenery
    if (segmentBlockedByScenery(_arrowPrev, a.mesh.position)) {
      a.stuck = true;
      a.stuckTimer = 5;
      continue;
    }
    let hit = false;
    for (let zi = zombies.length - 1; zi >= 0; zi--) {
      const z = zombies[zi];
      if (a.mesh.position.distanceTo(z.mesh.position) < 0.9) {
        applyZombieDamage(zi, a.damage, false);
        if (zombies[zi] === z) bleedZombie(z, 3.2, (a.bleedDamage || 0) / 3.2);
        triggerHitMarker(false);
        if (Math.random() < (a.retrieveChance || 0)) {
          const crossbow = player.weapons.find((w) => w.name === "Crossbow");
          if (crossbow) crossbow.reserve = Math.min(getWeaponReserveCap(crossbow), crossbow.reserve + 1);
        }
        messageEl.textContent = `Bolt hit! ${a.damage.toFixed(0)} dmg${a.bleedDamage ? " + bleed" : ""}`;
        a.mesh.position.copy(z.mesh.position).add(_arrowStickOff);
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
function spawnRocket(origin, direction, damage, weapon = {}) {
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
    velocity: vel.clone().multiplyScalar(weapon.rocketSpeed || 52),
    damage,
    blastRadius: weapon.blastRadius || 11,
    life: 4.5,
  });
}

// Shared resources for rocket trail — allocated once, never disposed during gameplay.
const _rocketTrailGeo = new THREE.SphereGeometry(0.06, 4, 4);
_rocketTrailGeo.userData.preventDispose = true;
const _rocketDir     = new THREE.Vector3();
const _rocketForward = new THREE.Vector3(0, 0, 1);
const _rocketPos     = new THREE.Vector3();
const _trailVel      = new THREE.Vector3();

const _rocketPrev    = new THREE.Vector3();
function updateRockets(dt) {
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.life -= dt;
    _rocketPrev.copy(r.mesh.position);
    r.mesh.position.addScaledVector(r.velocity, dt);
    _rocketDir.copy(r.velocity).normalize();
    r.mesh.quaternion.setFromUnitVectors(_rocketForward, _rocketDir);

    // Exhaust trail — use shared geometry, allocate only the material (small, fast)
    if (particles.length < MAX_PARTICLES && Math.random() < 0.55) {
      const trailMat = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.7, depthWrite: false });
      const trailP = new THREE.Mesh(_rocketTrailGeo, trailMat);
      trailP.position.copy(r.mesh.position).addScaledVector(_rocketDir, -0.3);
      scene.add(trailP);
      _trailVel.set((Math.random()-0.5)*1.5, Math.random()*0.8, (Math.random()-0.5)*1.5);
      particles.push({ mesh: trailP, velocity: _trailVel.clone(), life: 0.22, maxLife: 0.22, gravity: false, isExplosion: false });
    }

    _rocketPos.copy(r.mesh.position);
    let exploded = r.life <= 0;

    if (!exploded) {
      const floor = terrainHeight(_rocketPos.x, _rocketPos.z);
      if (_rocketPos.y < floor + 0.2) exploded = true;
    }
    // Explode on wall/building impact
    if (!exploded && segmentBlockedByScenery(_rocketPrev, _rocketPos)) exploded = true;
    if (!exploded) {
      for (const z of zombies) {
        if (_rocketPos.distanceTo(z.mesh.position) < 1.4) { exploded = true; break; }
      }
    }

    if (exploded) {
      scene.remove(r.mesh);
      r.mesh.traverse(o => { if (o.isMesh) { o.geometry?.dispose(); o.material?.dispose(); } });
      rockets.splice(i, 1);
      createExplosion(_rocketPos, r.blastRadius || 11, r.damage);
      addScreenShake(0.55);
      topCenterAlertEl.textContent = "💥 ROCKET IMPACT!";
      alertTimer = 1.5;
    }
  }
}

// ─── Flamethrower Puffs ──────────────────────────────────────────────────────
// Shared geometry for flame puffs — avoids creating+destroying geometry per puff.
// Size variation is achieved via mesh.scale instead of per-puff geometry.
const _flamePuffGeo = new THREE.SphereGeometry(0.15, 5, 5);
_flamePuffGeo.userData.preventDispose = true;

// Material pool for flame puffs (same pattern as particle system).
const _flamePuffMatPool = [];
const _flamePuffColors = [0xff6600, 0xff3300, 0xffaa00];
function _getFlamePuffMat(color) {
  if (_flamePuffMatPool.length > 0) {
    const m = _flamePuffMatPool.pop();
    m.color.setHex(color);
    m.opacity = 0.82;
    m.visible = true;
    return m;
  }
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.82, depthWrite: false });
}
function _returnFlamePuffMat(mat) {
  if (_flamePuffMatPool.length < 200) _flamePuffMatPool.push(mat);
  else mat.dispose();
}

const MAX_FLAME_PUFFS = 120;

function spawnFlamePuff(origin, direction, weapon = {}) {
  if (flamePuffs.length >= MAX_FLAME_PUFFS) return;

  const spread = 0.18;
  const dir = direction.clone();
  dir.x += (Math.random() - 0.5) * spread;
  dir.y += (Math.random() - 0.5) * spread * 0.5;
  dir.z += (Math.random() - 0.5) * spread;
  dir.normalize();

  const color = _flamePuffColors[(Math.random() * 3) | 0];
  const size = 0.1 + Math.random() * 0.22;
  const mat = _getFlamePuffMat(color);
  const mesh = new THREE.Mesh(_flamePuffGeo, mat);
  mesh.scale.setScalar(size / 0.15); // scale shared geometry to desired size
  mesh.position.copy(origin);
  scene.add(mesh);
  flamePuffs.push({
    mesh,
    velocity: dir.multiplyScalar(12 + Math.random() * 6),
    life: 0.38 + Math.random() * 0.22,
    maxLife: 0.6,
    damage: 0,
    burnDamage: weapon.burnDamage || 10,
    damageTickCd: 0,
  });
}

const _flameDamagePerSec = 28;
// Set used to deduplicate zombie hits across flame puffs within a single tick.
const _flameHitThisTick = new Set();

function updateFlamePuffs(dt) {
  _flameHitThisTick.clear();

  for (let i = flamePuffs.length - 1; i >= 0; i--) {
    const f = flamePuffs[i];
    f.life -= dt;
    if (f.life <= 0) {
      scene.remove(f.mesh);
      _returnFlamePuffMat(f.mesh.material);
      // Geometry is shared — do NOT dispose
      flamePuffs.splice(i, 1);
      continue;
    }
    f.mesh.position.addScaledVector(f.velocity, dt);
    f.velocity.multiplyScalar(Math.exp(-dt * 3.5));
    f.mesh.position.y += dt * 0.6;
    const t = f.life / f.maxLife;
    f.mesh.material.opacity = t * 0.8;
    const baseScale = f.mesh.userData._baseScale || (f.mesh.userData._baseScale = f.mesh.scale.x);
    f.mesh.scale.setScalar(baseScale * (1 + (1 - t) * 1.8));

    f.damageTickCd -= dt;
    if (f.damageTickCd <= 0) {
      f.damageTickCd = 0.1;
      for (let zi = zombies.length - 1; zi >= 0; zi--) {
        if (_flameHitThisTick.has(zi)) continue; // already hit by another puff this tick
        if (f.mesh.position.distanceTo(zombies[zi].mesh.position) < 1.2) {
          _flameHitThisTick.add(zi);
          const zombie = zombies[zi];
          applyZombieDamage(zi, _flameDamagePerSec * 0.1);
          // Only ignite if the zombie survived (splice shifts indices)
          if (zombies[zi] === zombie) {
            igniteZombie(zombie, 2.8, f.burnDamage || 10);
          }
        }
      }
    }
  }
}

// ─── Boss Zombie ──────────────────────────────────────────────────────────────
function spawnBoss() {
  if (bossAlive || gameOver || gameState !== "PLAYING" || !pointerLocked) return;
  // Pull flavor from the active map so every region has its own headliner.
  const flavor = resolveBossFlavor(activeMapConfig.id);
  const angle = Math.random() * Math.PI * 2;
  const dist = 35 + Math.random() * 18;
  const bx = player.position.x + Math.cos(angle) * dist;
  const bz = player.position.z + Math.sin(angle) * dist;
  const group = new THREE.Group();
  const bossSkinMat = new THREE.MeshStandardMaterial({ color: flavor.skinColor, roughness: 0.75 });
  const bossBodyMat = new THREE.MeshStandardMaterial({ color: flavor.bodyColor, roughness: 0.9 });
  const bossEyeMat = new THREE.MeshBasicMaterial({ color: flavor.eyeColor });
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
  group.scale.setScalar(flavor.scale);
  group.traverse((obj) => { if (obj instanceof THREE.Mesh) obj.castShadow = true; });
  scene.add(group);

  const baseHp = 650;
  const hp = Math.round(baseHp * flavor.hpMult * (1 + Math.max(0, wave - 5) * 0.12));
  zombies.push({
    mesh: group,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    type: "brute",
    hp,
    maxHp: hp,
    speed: 2.2 * flavor.speedMult,
    damage: 28 * flavor.damageMult,
    walkPhase: 0,
    attackTimer: 0,
    wanderSeed: Math.random() * 1000,
    isBoss: true,
    bossName: flavor.name,
    bossRewardMult: flavor.rewardMult,
    attackAnimating: false,
    attackAnimTime: 0,
  });
  bossAlive = true;
  topCenterAlertEl.textContent = `⚠ ${flavor.name.toUpperCase()} APPROACHES!`;
  alertTimer = 4.5;
  playSfx("boss_alert", 1);
  const reward = Math.round(500 * flavor.rewardMult);
  messageEl.textContent = `${flavor.name}! Focus fire — worth ${reward} points.`;
}

// ─── Explosive Barrels ────────────────────────────────────────────────────────
function spawnExplosiveBarrel(x, z) {
  const y = terrainHeight(x, z);
  const group = new THREE.Group();
  // Rusty metal (Polyhaven CC0) tinted red — looks weathered & dangerous.
  const bodyMat = new THREE.MeshStandardMaterial({
    map: rustyMetalPbr.map,
    normalMap: rustyMetalPbr.normalMap,
    roughnessMap: rustyMetalPbr.roughnessMap,
    color: 0xcc4422,
    roughness: 1.0,
    metalness: 0.55,
  });
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.48, metalness: 0.45 });
  const topMat = new THREE.MeshStandardMaterial({
    map: rustyMetalPbr.map,
    normalMap: rustyMetalPbr.normalMap,
    color: 0x881100,
    roughness: 1.0,
    metalness: 0.6,
  });
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
  const barrel = { mesh: group, center: new THREE.Vector3(x, y + 0.43, z) };
  barrels.push(barrel);
  // Register a small AABB so the player can't walk through barrels
  registerStaticCollider(group, 0, "barrel");
}

function checkBarrelHits(bulletFrom, bulletTo) {
  for (let i = barrels.length - 1; i >= 0; i--) {
    const b = barrels[i];
    if (segmentSphereHit(bulletFrom, bulletTo, b.center, 0.44)) {
      const pos = b.center.clone();
      removeStaticCollider(b.mesh);
      scene.remove(b.mesh);
      disposeOwnedObject3D(b.mesh);
      barrels.splice(i, 1);
      createExplosion(pos, 7.5, 85);
      return true;
    }
  }
  return false;
}

function checkToxicBarrelHits(bulletFrom, bulletTo, damage) {
  for (let i = toxicBarrels.length - 1; i >= 0; i--) {
    const b = toxicBarrels[i];
    const center = b.mesh.position.clone();
    center.y += 0.5;
    if (segmentSphereHit(bulletFrom, bulletTo, center, 0.4)) {
      damageToxicBarrel(i, damage);
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

// ─── Death Collapse Animation ──────────────────────────────────────────────
/** Brief tipping-over animation before a zombie mesh is removed from the scene.
 *  Mesh rotates forward ~90 degrees over 0.4 s, sinks slightly, then gets disposed. */
const deathCollapses = [];

function startDeathCollapse(mesh) {
  // Pick a random fall direction: forward, left, or right
  const fallAngle = (Math.random() - 0.5) * 0.6; // slight lateral variation
  deathCollapses.push({ mesh, time: 0, duration: 0.45, fallAngle });
}

function updateDeathCollapses(dt) {
  for (let i = deathCollapses.length - 1; i >= 0; i--) {
    const c = deathCollapses[i];
    c.time += dt;
    const t = Math.min(c.time / c.duration, 1);
    // Ease-in fall: accelerates like gravity
    const ease = t * t;
    c.mesh.rotation.x = ease * (Math.PI * 0.45);
    c.mesh.rotation.z = ease * c.fallAngle;
    c.mesh.position.y -= ease * dt * 2.5;
    // Fade out near end
    if (t > 0.7) {
      c.mesh.traverse((o) => {
        if (o.isMesh && o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of mats) {
            if (!m.transparent) { m.transparent = true; m.depthWrite = false; }
            m.opacity = Math.max(0, 1 - (t - 0.7) / 0.3);
          }
        }
      });
    }
    if (t >= 1) {
      scene.remove(c.mesh);
      disposeObject3D(c.mesh);
      deathCollapses.splice(i, 1);
    }
  }
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

  // Physics arc driven by game loop (see updateFlyingDistractions)
  flyingDistractions.push({ distraction, time: 0, maxTime: 1.2 });
}

function updateFlyingDistractions(dt) {
  for (let i = flyingDistractions.length - 1; i >= 0; i--) {
    const fd = flyingDistractions[i];
    fd.time += dt;
    fd.distraction.velocity.y += settings.gravity * dt;
    fd.distraction.mesh.position.addScaledVector(fd.distraction.velocity, dt);
    fd.distraction.mesh.rotation.x += 7.5 * dt;
    fd.distraction.mesh.rotation.z += 5 * dt;

    const floor = terrainHeight(fd.distraction.mesh.position.x, fd.distraction.mesh.position.z) + 0.11;
    if (fd.distraction.mesh.position.y <= floor || fd.time >= fd.maxTime) {
      fd.distraction.mesh.position.y = floor;
      fd.distraction.active = true;
      fd.distraction.position.copy(fd.distraction.mesh.position);
      startDistractionBeep(fd.distraction);
      flyingDistractions.splice(i, 1);
    }
  }
}

function startDistractionBeep(distraction) {
  let beeps = 0;
  const maxBeeps = 12;
  const beepInterval = setInterval(() => {
    if (!distraction.active || gameOver || beeps >= maxBeeps) {
      clearInterval(beepInterval);
      pendingIntervals.delete(beepInterval);
      if (distraction.active) deactivateDistraction(distraction);
      return;
    }
    playTone(900 + beeps * 30, 0.08, audioSystem.sfx, { volume: 0.4, type: "square", glide: -50 });
    distraction.mesh.scale.setScalar(1.3);
    setTimeout(() => distraction.mesh.scale.setScalar(1), 100);
    beeps++;
  }, 450);
  pendingIntervals.add(beepInterval);
}

function deactivateDistraction(distraction) {
  distraction.active = false;
  scene.remove(distraction.mesh);
  disposeOwnedObject3D(distraction.mesh);
  const idx = distractions.indexOf(distraction);
  if (idx >= 0) distractions.splice(idx, 1);
}

function triggerNoiseDistraction(position, duration = 4.5) {
  const marker = new THREE.Object3D();
  marker.position.copy(position);
  scene.add(marker);
  const distraction = {
    mesh: marker,
    velocity: null,
    active: true,
    beepTimer: 0,
    position: position.clone(),
  };
  distractions.push(distraction);
  const tid = setTimeout(() => {
    pendingTimeouts.delete(tid);
    deactivateDistraction(distraction);
  }, duration * 1000);
  pendingTimeouts.add(tid);
}

// ─── Abandoned Camp Loot ─────────────────────────────────────────────────────
/** Populate an abandoned camp with material pickups + light zombie defenders.
 *  The camp marker mesh is already placed by events.js; we just need the
 *  loot scatter and a couple of walkers nearby. */
function populateAbandonedCamp(campPos) {
  // Materials in a tight ring so the player has to step into the camp to grab them.
  const lootCount = 4 + Math.floor(Math.random() * 3); // 4-6 items
  for (let i = 0; i < lootCount; i++) {
    const a = (i / lootCount) * Math.PI * 2 + Math.random() * 0.4;
    const r = 1.2 + Math.random() * 1.6;
    spawnMaterialDrop({
      x: campPos.x + Math.cos(a) * r,
      y: campPos.y,
      z: campPos.z + Math.sin(a) * r,
    });
  }
  // 1-3 walkers loitering nearby — enough to make the player commit to clearing them.
  const guardCount = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < guardCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 6 + Math.random() * 4;
    addZombie(campPos.x + Math.cos(a) * r, campPos.z + Math.sin(a) * r, "walker");
  }
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
    const ammoGain = Math.floor(getWeaponReserveCap(player.weapons[ammoType]) * 0.38);
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
    messageEl.textContent = `Got ${ammoGain} ${player.weapons[ammoType].ammoType || player.weapons[ammoType].name} ammo, +scrap/metal/chem, +1 grenade!`;
    return;
  }

  // Give rewards
  const ammoRewards = [
    [0, 90],
    [1, 60],
    [2, 24],
    [3, 8],
    [4, 120],
    [5, 10],
    [6, 1],
  ];
  const claimed = [];
  for (let i = 0; i < 3; i += 1) {
    const [ammoType, ammoCount] = ammoRewards[Math.floor(Math.random() * ammoRewards.length)];
    const weapon = player.weapons[ammoType];
    weapon.reserve = Math.min(weapon.reserve + ammoCount, getWeaponReserveCap(weapon));
    claimed.push(`${ammoCount} ${weapon.ammoType || weapon.name}`);
  }
  grenadeCount = Math.min(grenadeCount + 2, 6);
  noiseMakerCount = Math.min(noiseMakerCount + 1, 5);
  player.hp = Math.min(player.hp + 30, getPlayerMaxHealth());

  topCenterAlertEl.textContent = "★ SUPPLY DROP OPENED!";
  alertTimer = 2.5;
  messageEl.textContent = `Got ${claimed.join(", ")}, +2 grenades, +1 noise maker, +30 HP!`;
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
// Pooled melee geometries / materials (avoid per-attack allocation + leaks)
const _meleeKnifeGeo = new THREE.BoxGeometry(0.06, 0.25, 0.02);
const _meleeKnifeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
const _meleeSlashGeo = new THREE.PlaneGeometry(0.8, 0.15);
const _meleeSlashMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide });

function performMelee() {
  if (!pointerLocked || gameOver || meleeCooldown > 0) return;
  if (activeVehicle || inventoryOpen || upgradeBenchOpen) return;
  if (player.reloadTimer > 0) return;
  meleeCooldown = 0.65;
  playSfx("melee_knife", 1);

  // Knife swing animation (pooled geo/mat)
  const knife = new THREE.Mesh(_meleeKnifeGeo, _meleeKnifeMat);
  knife.position.set(0.35, -0.25, -0.4);
  firstPersonWeapon.weapon.add(knife);
  const knifeTimeout = setTimeout(() => {
    firstPersonWeapon.weapon.remove(knife);
    pendingTimeouts.delete(knifeTimeout);
  }, 200);
  pendingTimeouts.add(knifeTimeout);

  // Calculate melee hit
  const reach = 3.5;
  const swingDir = new THREE.Vector3(-Math.sin(player.yaw), 0, -Math.cos(player.yaw));
  const hitPoint = player.position.clone().addScaledVector(swingDir, reach * 0.6);

  // Visual slash (pooled geo/mat)
  const slash = new THREE.Mesh(_meleeSlashGeo, _meleeSlashMat);
  slash.position.copy(hitPoint);
  slash.position.y += 1.5;
  slash.lookAt(player.position);
  scene.add(slash);
  const slashTimeout = setTimeout(() => {
    scene.remove(slash);
    pendingTimeouts.delete(slashTimeout);
  }, 100);
  pendingTimeouts.add(slashTimeout);

  // Check zombie hits
  let hitCount = 0;
  for (let i = zombies.length - 1; i >= 0; i--) {
    const zombie = zombies[i];
    const d = zombie.mesh.position.distanceTo(hitPoint);
    if (d < reach) {
      hitCount++;
      const damage = 45 * (1 + skills.damage.value); // Knife does high damage
      applyZombieDamage(i, damage, false, true); // Melee — not a headshot, but is melee
      spawnBloodParticles(_tempVec1.copy(zombie.mesh.position).setY(zombie.mesh.position.y + 1.5), 8);
    }
  }

  if (hitCount > 0) {
    messageEl.textContent = `Melee hit ${hitCount} zombie${hitCount > 1 ? 's' : ''}!`;
    addScreenShake(0.15);
  }
}

// ─── Periodic Events (supply drops) ─────────────────────────────────────────
let _supplyDropTimer = 0;
function updatePeriodicEvents(dt) {
  _supplyDropTimer += dt;
  if (_supplyDropTimer >= 45) {
    _supplyDropTimer -= 45;
    const broadcasting = !!eventDirector.broadcastActive;
    const baseChance = broadcasting ? 0.5 : 0.15;
    if (Math.random() < baseChance) spawnSupplyDrop();
    // During a broadcast, schedule a second drop ~22.5s later via a tracked timeout
    if (broadcasting && Math.random() < 0.4) {
      const t = setTimeout(() => {
        if (gameState === "PLAYING" && !gameOver && eventDirector.broadcastActive) spawnSupplyDrop();
        pendingTimeouts.delete(t);
      }, 22500);
      pendingTimeouts.add(t);
    }
  }
}

function animate(nowMs) {
  const now = nowMs * 0.001;
  const frameDt = Math.min(0.05, now - (animate.lastTime || now));
  animate.lastTime = now;
  updateAdaptiveQuality(frameDt);
  const freezeFrame = hitStopTimer > 0;
  if (hitStopCooldown > 0) hitStopCooldown = Math.max(0, hitStopCooldown - frameDt);
  if (hitStopTimer > 0) hitStopTimer = Math.max(0, hitStopTimer - frameDt);
  const dt = freezeFrame ? 0 : frameDt;

  if (dt > 0 && gameState === "PLAYING" && !gameOver && !upgradeBenchOpen && !inventoryOpen) {
    visibleVisionBlockersRefreshTimer -= dt;
    if (visibleVisionBlockersRefreshTimer <= 0) {
      refreshVisibleVisionBlockers();
      visibleVisionBlockersRefreshTimer = adaptiveQuality.level >= 1 ? 0.28 : 0.18;
    }

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
      // Camp event sets up loot pickups around campPosition once the event fires.
      if (exec && exec.campPosition) populateAbandonedCamp(exec.campPosition);
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
    } else if (eventResult && eventResult.type === "tide_spawn") {
      // Stream zombies in from a fixed bearing for the tide duration.
      const tideAngle = eventResult.angle;
      // Spread along a 30°-wide arc so the line isn't perfectly straight.
      const jitter = (Math.random() - 0.5) * (Math.PI / 6);
      const a = tideAngle + jitter;
      const dist = 38 + Math.random() * 14;
      const zx = player.position.x + Math.cos(a) * dist;
      const zz = player.position.z + Math.sin(a) * dist;
      // Mostly runners with the occasional brute to break formation.
      const type = Math.random() < 0.85 ? "runner" : "brute";
      addZombie(zx, zz, type);
    } else if (eventResult && eventResult.type === "tide_end") {
      messageEl.textContent = "The tide subsides...";
    } else if (eventResult && eventResult.type === "broadcast_end") {
      messageEl.textContent = "Broadcast signal lost.";
    } else if (eventResult && eventResult.type === "camp_expired") {
      messageEl.textContent = "The camp was overrun before you got there.";
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

    // Out-of-combat health regeneration: slow heal after 5 seconds without damage
    if (gameTime - lastDamageTime > 5 && player.hp < getPlayerMaxHealth() && player.hp > 0) {
      player.hp = Math.min(getPlayerMaxHealth(), player.hp + 2 * dt);
    }

    if (player.reloadTimer > 0) {
      player.reloadTimer -= dt;
      if (player.reloadTimer <= 0) {
        syncPlayerAmmoFields(player);
        const weapon = getActiveWeapon(player);
        const needed = Math.max(0, weapon.magSize - player.ammo);
        const loaded = Math.min(needed, Math.max(0, player.reserveAmmo));
        player.ammo += loaded;
        player.reserveAmmo = Math.max(0, player.reserveAmmo - loaded);
        commitPlayerAmmoFields(player);
        messageEl.textContent = "Reloaded.";
      }
    }

    player.shootCooldown = Math.max(0, player.shootCooldown - dt);
    // Auto-fire for flamethrower (and any other full-auto weapons) while mouse held
    if (mouseLeftHeld && pointerLocked && player.shootCooldown === 0 && !gameOver && !activeVehicle && !inventoryOpen && !upgradeBenchOpen) {
      const _aw = getActiveWeapon(player);
      if (_aw.name === "Flamethrower" || _aw.name === "Rifle" || _aw.name === "SMG" || _aw.name === "Minigun") shoot();
    }
    if (activeVehicle) {
      updateVehicles(dt);
      if (activeVehicle) {
        resolveVehicleObstacles(activeVehicle);
        syncPlayerToVehicle(activeVehicle);
        const camOffset = _tempVec1.set(0, 3.5, 5.5);
        camOffset.applyAxisAngle(_worldAxisY, activeVehicle.yaw);
        const targetPos = _tempVec2.copy(activeVehicle.mesh.position).add(_tempVec3.set(0, 1, 0));
        camera.position.lerp(_tempVec4.copy(activeVehicle.mesh.position).add(camOffset), 0.15);
        camera.lookAt(targetPos);
        sun.position.x = activeVehicle.mesh.position.x + 30;
        sun.position.z = activeVehicle.mesh.position.z - 10;
      } else {
        sun.position.x = player.position.x + 30;
        sun.position.z = player.position.z - 10;
      }
    } else {
      movePlayer(dt);
      sun.position.x = player.position.x + 30;
      sun.position.z = player.position.z - 10;
      preventTreeCollision();
      resolvePlayerObstacles();
      clampPlayerToTerrainFloor();
      updateVehicles(dt);
    }
    preventUnexpectedSpawnTeleport();
    const streamChunkX = Math.floor(player.position.x / chunkSize);
    const streamChunkZ = Math.floor(player.position.z / chunkSize);
    const chunkMoved = streamChunkX !== lastStreamChunkX || streamChunkZ !== lastStreamChunkZ;
    const needsFill = hasMissingChunksAround(streamChunkX, streamChunkZ);
    const streamBoostActive = gameTime < chunkStreamingBoostUntil;
    const idleFillBudget = streamBoostActive ? 3 : 1;
    const fillInterval = streamBoostActive ? 0.05 : 0.2;
    const canDoMaintenanceFill = streamBoostActive && gameTime >= nextChunkMaintenanceAt;
    if (chunkMoved || (needsFill && canDoMaintenanceFill)) {
      ensureChunks(chunkMoved ? CHUNK_STREAM_BUDGET : idleFillBudget);
      nextChunkMaintenanceAt = gameTime + (chunkMoved ? 0.05 : fillInterval);
      lastStreamChunkX = streamChunkX;
      lastStreamChunkZ = streamChunkZ;
    }
    updateLastSafePlayerPosition();
    updateZombies(dt);
    // If a zombie killed the player this frame, skip all further combat updates.
    if (!gameOver) {
    updateTeammates(dt);
    updateBullets(dt);
    updateArrows(dt);
    updateRockets(dt);
    updateFlamePuffs(dt);
    updatePickups(dt);
    updateGrenades(dt);
    updateAcidProjectiles(dt);
    updateFlyingDistractions(dt);
    updateMolotovProjectiles(dt);
    updateMolotovFires(dt);
    updateLandMines(dt);
    updateSpikeTraps(dt);
    updateParticles(dt);
    updateMuzzleLight(dt);
    updateBloodDecals(dt);
    updateDeathCollapses(dt);
    updateCorpses(dt);
    updateSupplyDrops(dt);
    updateBarricades(dt);
    updateTurrets(dt);
    updateToxicClouds(dt);
    updateLootCratePrompt();
    updateLootCrateAnims(dt);
    updatePeriodicEvents(dt);
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
    } // end if (!gameOver) combat block
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
  maybeDrawEnemyHealthBars(frameDt);
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

function handleReloadKeyCapture(e) {
  if (gameState !== "PLAYING" || e.code !== "KeyR") return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if (!audioSystem.unlocked) void ensureAudioUnlocked();
  if (!gameOver && !e.repeat && !inventoryOpen && !upgradeBenchOpen && !activeVehicle) reload();
}

window.addEventListener("keydown", handleReloadKeyCapture, true);

window.addEventListener("keydown", (e) => {
  if (!audioSystem.unlocked) {
    // First keyboard input should unlock audio context on browsers that gate autoplay.
    void ensureAudioUnlocked();
  }
  if (gameState === "PLAYING") {
    const gameplayKeys = new Set([
      "KeyW", "KeyA", "KeyS", "KeyD", "Space", "ShiftLeft", "ShiftRight",
      "KeyQ", "KeyE", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL",
      "KeyM", "KeyN", "KeyP", "KeyT", "KeyU", "KeyV", "KeyB", "KeyC",
      "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7",
      "Tab",
    ]);
    if (gameplayKeys.has(e.code)) e.preventDefault();
  }
  if (gameState === "PLAYING" && e.code === "KeyR") {
    e.preventDefault();
    e.stopPropagation();
    if (!gameOver && !e.repeat && !inventoryOpen && !upgradeBenchOpen && !activeVehicle) reload();
    return;
  }
  keys.add(e.code);
  if (activeVehicle) {
    if (e.code === "KeyW") vehicleInput.forward = true;
    if (e.code === "KeyS") vehicleInput.backward = true;
    if (e.code === "KeyA") vehicleInput.left = true;
    if (e.code === "KeyD") vehicleInput.right = true;
    if (e.code === "Space") vehicleInput.brake = true;
  }
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
  if (e.code === "KeyP" && gameState === "PLAYING" && !gameOver && !e.repeat) placeTurret();
  if (e.code === "KeyF" && gameState === "PLAYING" && !gameOver && !e.repeat) {
    if (activeVehicle) exitVehicle();
    else {
      // Try searching a loot crate first
      if (searchNearbyLootCrate()) return;
      const downedMate = findNearestDownedTeammate();
      if (downedMate) {
        downedMate.beingRevived = true;
        messageEl.textContent = "Hold F to revive teammate...";
        return;
      }
      const nearVehicle = findNearestVehicle();
      if (nearVehicle) enterVehicle(nearVehicle);
      else performMelee();
    }
  }
  if (e.code === "KeyH" && gameState === "PLAYING" && !gameOver && !e.repeat && activeVehicle) {
    playSpatialSfx("noise_maker", activeVehicle.mesh.position, 0.6);
    triggerNoiseDistraction(activeVehicle.mesh.position, 5.5);
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
  if (gameState === "PLAYING" && (e.code === "Space" || e.code === "Enter")) e.preventDefault();
  keys.delete(e.code);
  if (activeVehicle) {
    if (e.code === "KeyW") vehicleInput.forward = false;
    if (e.code === "KeyS") vehicleInput.backward = false;
    if (e.code === "KeyA") vehicleInput.left = false;
    if (e.code === "KeyD") vehicleInput.right = false;
    if (e.code === "Space") vehicleInput.brake = false;
  }
});
window.addEventListener("blur", clearInputState);
window.addEventListener("beforeunload", () => {
  if (gameState === "PLAYING" && !gameOver) saveRun();
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  applyAdaptiveQuality();
});

(async function bootstrap() {
  // Wrap entire early-init path so a single synchronous crash (GLTF refs,
  // WebGL caps, garbage localStorage, etc.) never blocks the menu.  The
  // game world is rebuilt cleanly when the player clicks Start anyway.
  try {
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
      try { await loadCityBuildingLibrary(); } catch { /* city props optional */ }
    }
    applyActiveMapVisuals();
    ensureChunks();
    initWeather();
    updateDayNight();
    for (let i = 0; i < 8; i += 1) spawnZombieNearPlayer();
    for (let i = 0; i < 3; i += 1) {
      teammates.push(createTeammate(2 + i * 2.5, 2 + i, i, akTemplate, remingtonTemplate, pistolTemplate));
    }
    spawnVehiclesForMap();
    syncPlayerAmmoFields(player);
    updateAudioButtonLabel();
  } catch (bootstrapErr) {
    // Log the error so developers can diagnose the underlying issue, but
    // keep going — the menu must render regardless so the player can still
    // select a map and start a fresh game.
    console.error("[DeadTakeover] bootstrap initialization error:", bootstrapErr);
  }

  // Always build the menu, even if world init partially failed.
  // resetWorldForNewMap() (called by Start) rebuilds everything from scratch.
  setMenuMode("title");
  messageEl.textContent = "Pick a map, then Start. Q swap, T team swap, P pause, M audio. B build, N switch build type.";
  animate(0);
})();

startBtnEl.addEventListener("click", async () => {
  if (gameState !== "MENU_TITLE") return;
  playSfx("ui_click", 1);
  await ensureAudioUnlocked();
  if (mapDirty) {
    activeMapConfig = mapById(pendingMapId);
    mapDirty = false;
  }
  try {
    resetWorldForNewMap();
  } catch (startErr) {
    console.error("[DeadTakeover] resetWorldForNewMap failed:", startErr);
    // Fall back to a clean page reload so the player isn't stuck.
    window.location.reload();
    return;
  }
  canvas.requestPointerLock();
});

resumeBtnEl.addEventListener("click", async () => {
  if (gameState !== "MENU_PAUSE" || gameOver) return;
  playSfx("ui_click", 1);
  await ensureAudioUnlocked();
  if (!gameOver) canvas.requestPointerLock();
});

restartBtnEl.addEventListener("click", () => {
  if (gameState === "PLAYING") return;
  playSfx("ui_click", 1);
  clearSavedRun();
  window.location.reload();
});

continueBtnEl.addEventListener("click", async () => {
  if (gameState !== "MENU_TITLE") return;
  playSfx("ui_click", 1);
  await ensureAudioUnlocked();

  // Peek at the saved map so we reset the world for the correct one
  let savedMapId = null;
  try {
    const raw = localStorage.getItem("zowg_save");
    if (raw) {
      const save = JSON.parse(raw);
      savedMapId = save.activeMapId;
    }
  } catch {}

  // Use saved map if available; otherwise fall back to the menu selection
  const targetMapId = savedMapId || pendingMapId;
  if (targetMapId && targetMapId !== activeMapConfig.id) {
    activeMapConfig = mapById(targetMapId);
    pendingMapId = activeMapConfig.id;
    mapDirty = false;
  }

  try {
    resetWorldForNewMap();
  } catch (continueErr) {
    console.error("[DeadTakeover] continue resetWorldForNewMap failed:", continueErr);
    window.location.reload();
    return;
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
