/** Minimal debug logger. No-op in production, opt-in via:
 *    localStorage.setItem("deadtakeover_debug", "1")
 *  …and reload. Keeps the console quiet for normal play while making
 *  silent failures (save corruption, asset load errors, audio init) visible
 *  when a developer or playtester turns the flag on.
 */

const FLAG_KEY = "deadtakeover_debug";

function enabled() {
  try {
    return typeof localStorage !== "undefined" && localStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

export function debugLog(...args) {
  if (enabled()) console.log("[DT]", ...args);
}

export function debugWarn(...args) {
  if (enabled()) console.warn("[DT]", ...args);
}

export function debugError(...args) {
  // Errors are always logged — they're rare and silently eating them
  // is exactly the failure mode this module exists to prevent.
  console.error("[DT]", ...args);
}

/** Wrap a promise so rejections surface in the console instead of vanishing. */
export function reportRejection(promise, label = "promise rejected") {
  return promise.catch((err) => {
    debugError(label, err);
    throw err;
  });
}
