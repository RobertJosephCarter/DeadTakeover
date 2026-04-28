/** Audio system state container.
 *  All Web Audio nodes plus HTML5 BGM bookkeeping live here.
 *  The engine module mutates this object — no global singletons.
 */

const MUTE_KEY = "zowg_audio_muted";

export function createAudioState() {
  return {
    ctx: null,
    unlocked: false,
    muted: readMutedFlag(),
    master: null,
    music: null,
    ambient: null,
    sfx: null,
    ui: null,
    listener: null,
    titleTimer: null,
    ambientNodes: [],
    /** HTML5 element for reliable looping MP3 background music. */
    bgmEl: null,
    bgmCurrentFile: null,
    bgmNominalVolume: 0.55,
  };
}

function readMutedFlag() {
  try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
}

export function persistMutedFlag(muted) {
  try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch { /* private mode etc. */ }
}
