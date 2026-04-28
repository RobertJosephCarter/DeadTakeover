/** Zombie AI helpers — sound investigation and flanking approach.
 *
 *  These are self-contained pure helpers that the main update loop calls.
 *  They take all needed state as arguments so the module is testable.
 */

/** Default noise radii by event kind. Suppressed shots are quieter. */
export const NOISE_RADIUS = {
  gunshot: 22,
  gunshot_suppressed: 8,
  shotgun: 28,
  rocket: 40,
  explosion: 36,
  vehicle: 18,
  // melee makes essentially no sound — caller can omit
};

/** Emit a sound event into the distractions array. Zombies within `radius`
 *  will turn toward it for `duration` seconds.
 *
 *  @param {Array} distractions  Shared distractions array (main.js owns it).
 *  @param {Object} marker       A plain object — caller decides if it gets a mesh.
 *                               We just need {x,y,z} on `position`.
 *  @param {string} kind         Event kind, used to pick radius.
 *  @param {number} duration     Seconds the sound remains in the array.
 *  @param {number} [radiusOverride]  Skip the table lookup.
 */
export function emitSoundEvent(distractions, position, kind, duration, radiusOverride) {
  const radius = radiusOverride ?? NOISE_RADIUS[kind] ?? 20;
  const ev = {
    mesh: null,
    velocity: null,
    active: true,
    beepTimer: 0,
    isSound: true,           // flag so existing zombie targeting can read it
    soundRadius: radius,
    soundKind: kind,
    position: { x: position.x, y: position.y || 0, z: position.z },
    expireAt: duration,      // caller decrements; we just store hint for cleanup
  };
  distractions.push(ev);
  return ev;
}

/** Sweep distractions and remove any whose lifetimes have expired.
 *  Call once per frame from the main update loop. Returns count removed. */
export function pruneSoundEvents(distractions, dt) {
  let removed = 0;
  for (let i = distractions.length - 1; i >= 0; i--) {
    const d = distractions[i];
    if (!d.isSound) continue;     // only manage sound events here
    d.expireAt -= dt;
    if (d.expireAt <= 0) {
      distractions.splice(i, 1);
      removed++;
    }
  }
  return removed;
}

/** Pick an approach offset for a zombie targeting `targetPos`.
 *  Returns {ox, oz} world-space offset to add to the target so multiple
 *  zombies don't stack on the same line. Spread is determined by the
 *  zombie's wanderSeed so each one is consistent across frames.
 *
 *  Special infected (charger, hunter) get bigger lateral spread —
 *  visually they "flank".
 */
export function flankOffset(zombie, basePos, otherCount = 0) {
  const seed = zombie.wanderSeed || 0;
  // Stable angle in [-π/3, π/3] biased by seed
  const angle = ((seed * 0.317) % 1) * (Math.PI / 1.5) - (Math.PI / 3);
  // Lateral distance grows slightly with crowd size so packs spread out
  let lateral = 1.5 + Math.min(otherCount * 0.15, 3.5);
  if (zombie.type === "charger" || zombie.type === "hunter") lateral += 1.5;
  if (zombie.type === "runner") lateral += 0.5;

  // Compute perpendicular offset to the bee-line player→zombie direction
  const dx = zombie.mesh.position.x - basePos.x;
  const dz = zombie.mesh.position.z - basePos.z;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  // Perpendicular vectors (rotate 90°): (-uz, ux). Mix with raw angle for variety.
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const ox = (-uz * ca + ux * sa) * lateral;
  const oz = (ux * ca + uz * sa) * lateral;
  return { ox, oz };
}

/** Track LOS-loss memory. When a zombie can't see its target, decay its
 *  knowledge over `memorySeconds`. Returns true if the zombie should keep
 *  pathing to lastKnown, false if it should fall back to wander. */
export function tickTargetMemory(zombie, hadLOS, dt, memorySeconds = 4) {
  if (hadLOS) {
    zombie.targetMemory = memorySeconds;
    return true;
  }
  if (zombie.targetMemory > 0) {
    zombie.targetMemory = Math.max(0, zombie.targetMemory - dt);
    return zombie.targetMemory > 0;
  }
  return false;
}
