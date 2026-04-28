/** Audio engine — Web Audio graph + procedural sound generators + HTML5 BGM.
 *
 *  All state is held by an external `audioSystem` object (see ./state.js).
 *  Functions take that object as the first argument so the module is fully
 *  testable / shareable and avoids hidden module-level globals.
 */

import * as THREE from "three";
import { debugWarn } from "../core/debug.js";

// ─── Audio graph setup ────────────────────────────────────────────────────────

export function createAudioGraph(audioSystem) {
  if (audioSystem.ctx) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    debugWarn("Web Audio not supported");
    return;
  }
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

  audioSystem.listener = ctx.listener;
  if (audioSystem.listener.positionX) {
    audioSystem.listener.positionX.value = 0;
    audioSystem.listener.positionY.value = 0;
    audioSystem.listener.positionZ.value = 0;
  }
}

export async function ensureAudioUnlocked(audioSystem) {
  createAudioGraph(audioSystem);
  if (!audioSystem.ctx) return false;
  if (audioSystem.ctx.state !== "running") {
    try {
      await audioSystem.ctx.resume();
    } catch (err) {
      debugWarn("audio resume failed", err);
      return false;
    }
  }
  audioSystem.unlocked = true;
  return true;
}

// ─── Procedural sound primitives ──────────────────────────────────────────────

export function playNoise(audioSystem, duration, gainNode, options = {}) {
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

export function playTone(audioSystem, freq, duration, gainNode, options = {}) {
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

// ─── 3D / spatial SFX ─────────────────────────────────────────────────────────

const _spatialForward = new THREE.Vector3();
const _spatialUp = new THREE.Vector3();

/** Update HRTF listener from the current camera and play a spatial sound. */
export function playSpatialSfx(audioSystem, camera, name, worldPosition, volume = 1) {
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

  _spatialForward.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  _spatialUp.set(0, 1, 0).applyQuaternion(camera.quaternion).normalize();
  const lis = audioSystem.listener;
  if (lis.positionX) {
    lis.positionX.value = camera.position.x;
    lis.positionY.value = camera.position.y;
    lis.positionZ.value = camera.position.z;
    lis.forwardX.value = _spatialForward.x;
    lis.forwardY.value = _spatialForward.y;
    lis.forwardZ.value = _spatialForward.z;
    lis.upX.value = _spatialUp.x;
    lis.upY.value = _spatialUp.y;
    lis.upZ.value = _spatialUp.z;
  } else {
    lis.setPosition(camera.position.x, camera.position.y, camera.position.z);
    lis.setOrientation(_spatialForward.x, _spatialForward.y, _spatialForward.z, _spatialUp.x, _spatialUp.y, _spatialUp.z);
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
      osc.type = "sawtooth";
      osc.frequency.value = 90 + Math.random() * 40;
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.35);
      gain.gain.value = 0.14 * volume;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
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
      // Fall through: caller handles non-spatial fallback if desired.
      playSfx(audioSystem, name, volume);
      return;
  }
}

// ─── Sound library (procedural) ───────────────────────────────────────────────

export function playSfx(audioSystem, name, volume = 1) {
  if (!audioSystem.unlocked || audioSystem.muted) return;
  const noise = (d, gn, opts) => playNoise(audioSystem, d, gn, opts);
  const tone = (f, d, gn, opts) => playTone(audioSystem, f, d, gn, opts);
  const { sfx, ui } = audioSystem;

  switch (name) {
    case "ui_click":          tone(900, 0.05, ui, { volume: 0.1 * volume, type: "square", glide: -120 }); break;
    case "gunshot_player":
      noise(0.09, sfx, { volume: 0.24 * volume, hp: 500, lp: 5000 });
      tone(120, 0.08, sfx, { volume: 0.16 * volume, type: "sawtooth", glide: -60 });
      break;
    case "teammate_shot":
      noise(0.06, sfx, { volume: 0.15 * volume, hp: 600, lp: 4200 });
      tone(180, 0.05, sfx, { volume: 0.06 * volume, type: "triangle", glide: -40 });
      break;
    case "reload_player":
      tone(320, 0.07, sfx, { volume: 0.08 * volume, type: "square", glide: -35 });
      tone(420, 0.07, sfx, { volume: 0.06 * volume, type: "square", glide: -20 });
      break;
    case "zombie_hit":        tone(130, 0.11, sfx, { volume: 0.1 * volume, type: "sawtooth", glide: -30 }); break;
    case "zombie_death":      tone(105, 0.22, sfx, { volume: 0.15 * volume, type: "sawtooth", glide: -70 }); break;
    case "shotgun_player":
      noise(0.16, sfx, { volume: 0.42 * volume, hp: 160, lp: 3000 });
      tone(80, 0.14, sfx, { volume: 0.25 * volume, type: "sawtooth", glide: -50 });
      break;
    case "grenade_throw":
      tone(520, 0.06, sfx, { volume: 0.07 * volume, type: "square", glide: -90 });
      noise(0.04, sfx, { volume: 0.06 * volume, hp: 900, lp: 3200 });
      break;
    case "explosion":
      noise(0.6, sfx, { volume: 0.6 * volume, hp: 18, lp: 800 });
      tone(52, 0.45, sfx, { volume: 0.38 * volume, type: "sawtooth", glide: -28 });
      break;
    case "boss_alert":
      tone(108, 0.7, sfx, { volume: 0.32 * volume, type: "sawtooth", glide: -18 });
      tone(80, 0.9, sfx, { volume: 0.26 * volume, type: "square", glide: -12 });
      break;
    case "acid_spit":
      noise(0.28, sfx, { volume: 0.18 * volume, hp: 200, lp: 2200 });
      tone(440, 0.12, sfx, { volume: 0.08 * volume, type: "sawtooth", glide: 90 });
      break;
    case "hunter_leap":       tone(180, 0.18, sfx, { volume: 0.25 * volume, type: "sawtooth", glide: -120 }); break;
    case "charger_charge":    noise(0.55, sfx, { volume: 0.45 * volume, hp: 60, lp: 800 }); break;
    case "noise_maker":
      tone(800, 0.25, sfx, { volume: 0.35 * volume, type: "square", glide: -200 });
      noise(0.4, sfx, { volume: 0.2 * volume, hp: 400, lp: 4000 });
      break;
    case "melee_knife":
      noise(0.05, sfx, { volume: 0.22 * volume, hp: 1200, lp: 5000 });
      tone(420, 0.06, sfx, { volume: 0.1 * volume, type: "triangle" });
      break;
    case "footstep":
      noise(0.04, sfx, { volume: 0.06 * volume, hp: 100, lp: 800 });
      tone(60 + Math.random() * 30, 0.03, sfx, { volume: 0.04 * volume, type: "triangle" });
      break;
    case "footstep_sprint":
      noise(0.06, sfx, { volume: 0.09 * volume, hp: 100, lp: 1000 });
      tone(50 + Math.random() * 40, 0.04, sfx, { volume: 0.06 * volume, type: "triangle" });
      break;
    case "supply_drop":
      tone(660, 0.35, sfx, { volume: 0.28 * volume, type: "sine", glide: -100 });
      tone(880, 0.5, sfx, { volume: 0.2 * volume, type: "sine" });
      break;
    case "zombie_revive":     tone(95, 0.55, sfx, { volume: 0.22 * volume, type: "sawtooth", glide: 25 }); break;
    case "skill_up":
      tone(523.25, 0.15, ui, { volume: 0.35 * volume, type: "sine" });
      tone(659.25, 0.25, ui, { volume: 0.3 * volume, type: "sine" });
      break;
    case "teammate_downed":
      tone(200, 0.3, sfx, { volume: 0.2 * volume, type: "sawtooth", glide: -80 });
      tone(150, 0.4, sfx, { volume: 0.15 * volume, type: "square", glide: -40 });
      break;
    default:
      break;
  }
}

// ─── Background music (HTML5 Audio) ───────────────────────────────────────────

function musicAssetUrl(filename) {
  let base = import.meta.env.BASE_URL || "/";
  if (!base.endsWith("/")) base += "/";
  return `${base}music/${encodeURIComponent(filename)}`;
}

/** Ensure the <audio> element exists. `onLoadError` is called when the file
 *  fails to load (common in dev where some BGM mp3s ship empty). */
function ensureBgmElement(audioSystem, onLoadError) {
  if (audioSystem.bgmEl) return audioSystem.bgmEl;
  const el = document.createElement("audio");
  el.setAttribute("playsinline", "true");
  el.preload = "auto";
  el.addEventListener("error", () => {
    onLoadError?.(audioSystem.bgmCurrentFile);
  });
  document.body.appendChild(el);
  audioSystem.bgmEl = el;
  return el;
}

export function applyBgmVolume(audioSystem) {
  const el = audioSystem.bgmEl;
  if (!el) return;
  el.volume = audioSystem.muted ? 0 : audioSystem.bgmNominalVolume;
}

export function stopHtmlBgmHard(audioSystem) {
  const el = audioSystem.bgmEl;
  if (!el) return;
  el.pause();
  el.removeAttribute("src");
  el.load();
  audioSystem.bgmCurrentFile = null;
}

export function stopTitleMusic(audioSystem) {
  stopHtmlBgmHard(audioSystem);
  if (audioSystem.titleTimer) {
    clearInterval(audioSystem.titleTimer);
    audioSystem.titleTimer = null;
  }
}

/** Play (or resume) a looping BGM. `onError` is invoked when load/play fails
 *  so the caller can start a procedural fallback. */
export async function playHtmlBgm(audioSystem, filename, onError) {
  if (!audioSystem.unlocked || !filename) return;
  const el = ensureBgmElement(audioSystem, onError);
  if (audioSystem.bgmCurrentFile === filename && el.src) {
    applyBgmVolume(audioSystem);
    try { await el.play(); } catch (err) { onError?.(filename, err); }
    return;
  }
  audioSystem.bgmCurrentFile = filename;
  el.loop = true;
  el.src = musicAssetUrl(filename);
  el.load();
  applyBgmVolume(audioSystem);
  try { await el.play(); } catch (err) { onError?.(filename, err); }
}

export function startTitleMusicFallback(audioSystem) {
  if (!audioSystem.unlocked || audioSystem.muted || audioSystem.titleTimer) return;
  const el = audioSystem.bgmEl;
  if (el && el.src && !el.paused) return;
  const notes = [220, 261.63, 329.63, 392, 329.63, 261.63];
  let idx = 0;
  audioSystem.titleTimer = setInterval(() => {
    playTone(audioSystem, notes[idx % notes.length], 0.24, audioSystem.music, { volume: 0.12, type: "triangle", glide: -8 });
    if (idx % 2 === 0) playTone(audioSystem, notes[(idx + 2) % notes.length] / 2, 0.32, audioSystem.music, { volume: 0.05, type: "sine" });
    idx += 1;
  }, 320);
}

export function stopAmbientLoop(audioSystem) {
  for (const n of audioSystem.ambientNodes) {
    try { n.stop(); } catch { /* node may already be stopped */ }
  }
  audioSystem.ambientNodes = [];
}

export function startAmbientLoop(audioSystem) {
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
