/** Registry of GLB/GLTF models served from /public/models/.
 *
 *  Drop a file in public/models/, then add a key here describing how to
 *  spawn it. The spawn helper in ./spawnModel.js handles loading, caching,
 *  scaling, and shadow setup.
 *
 *  url        — relative to the site root (Vite serves /public/* verbatim)
 *  scale      — uniform scale applied after load (default 1)
 *  yOffset    — additional Y offset after auto-grounding (default 0)
 *  collider   — { radius } if the model should block bullets / vision
 *  shadow     — set true to enable cast/receive shadow on all meshes
 *  autoGround — auto-translate so model.box.min.y == 0 (default true)
 *  category   — loose tag used by placeMapProps() to choose what to spawn
 */

export const MODELS = {
  // ─── Vehicles (Kenney Car Kit, CC0) ────────────────────────────────────────
  ambulance:        { url: "models/ambulance.glb",        scale: 1.6, collider: { radius: 1.6 }, shadow: true, category: "vehicle" },
  sedan:            { url: "models/sedan.glb",            scale: 1.6, collider: { radius: 1.4 }, shadow: true, category: "vehicle" },
  suv:              { url: "models/suv.glb",              scale: 1.6, collider: { radius: 1.5 }, shadow: true, category: "vehicle" },
  police:           { url: "models/police.glb",           scale: 1.6, collider: { radius: 1.4 }, shadow: true, category: "vehicle" },
  taxi:             { url: "models/taxi.glb",             scale: 1.6, collider: { radius: 1.4 }, shadow: true, category: "vehicle" },
  van:              { url: "models/van.glb",              scale: 1.6, collider: { radius: 1.6 }, shadow: true, category: "vehicle" },
  garbage_truck:    { url: "models/garbage-truck.glb",    scale: 1.6, collider: { radius: 1.9 }, shadow: true, category: "vehicle" },
  firetruck:        { url: "models/firetruck.glb",        scale: 1.6, collider: { radius: 2.0 }, shadow: true, category: "vehicle" },
  delivery_truck:   { url: "models/delivery.glb",         scale: 1.6, collider: { radius: 1.7 }, shadow: true, category: "vehicle" },
  hatchback:        { url: "models/hatchback-sports.glb", scale: 1.6, collider: { radius: 1.3 }, shadow: true, category: "vehicle" },
  truck:            { url: "models/truck.glb",            scale: 1.6, collider: { radius: 1.8 }, shadow: true, category: "vehicle" },

  // Vehicle debris (no collider — just visual clutter)
  debris_tire:      { url: "models/debris-tire.glb",      scale: 1.4, shadow: true, category: "debris" },
  debris_door:      { url: "models/debris-door.glb",      scale: 1.4, shadow: true, category: "debris" },
  debris_bumper:    { url: "models/debris-bumper.glb",    scale: 1.4, shadow: true, category: "debris" },

  // ─── Survival props (Kenney Survival Kit, CC0) ─────────────────────────────
  barrel:           { url: "models/barrel.glb",           scale: 1.3, collider: { radius: 0.55 }, shadow: true, category: "prop" },
  barrel_open:      { url: "models/barrel-open.glb",      scale: 1.3, collider: { radius: 0.55 }, shadow: true, category: "prop" },
  crate:            { url: "models/box.glb",              scale: 1.3, collider: { radius: 0.55 }, shadow: true, category: "prop" },
  crate_large:      { url: "models/box-large.glb",        scale: 1.4, collider: { radius: 0.75 }, shadow: true, category: "prop" },
  chest:            { url: "models/chest.glb",            scale: 1.3, collider: { radius: 0.6  }, shadow: true, category: "prop" },
  fence:            { url: "models/fence.glb",            scale: 1.3, collider: { radius: 0.7  }, shadow: true, category: "barricade" },
  fence_fortified:  { url: "models/fence-fortified.glb",  scale: 1.3, collider: { radius: 0.7  }, shadow: true, category: "barricade" },
  fence_doorway:    { url: "models/fence-doorway.glb",    scale: 1.3, collider: { radius: 0.7  }, shadow: true, category: "barricade" },
  campfire:         { url: "models/campfire-pit.glb",     scale: 1.6, shadow: true, category: "decor" },
  signpost:         { url: "models/signpost.glb",         scale: 1.3, collider: { radius: 0.3  }, shadow: true, category: "decor" },
  metal_wall:       { url: "models/structure-metal-wall.glb", scale: 1.5, collider: { radius: 1.2 }, shadow: true, category: "barricade" },
  metal_panel:      { url: "models/metal-panel-screws.glb", scale: 1.4, collider: { radius: 0.8 }, shadow: true, category: "barricade" },
  planks_pile:      { url: "models/resource-planks.glb",  scale: 1.3, shadow: true, category: "decor" },
  wood_pile:        { url: "models/resource-wood.glb",    scale: 1.3, shadow: true, category: "decor" },
  tent:             { url: "models/tent.glb",             scale: 1.6, collider: { radius: 1.4 }, shadow: true, category: "decor" },
  rock_a:           { url: "models/rock-a.glb",           scale: 1.4, collider: { radius: 0.7 }, shadow: true, category: "decor" },
  rock_b:           { url: "models/rock-b.glb",           scale: 1.4, collider: { radius: 0.7 }, shadow: true, category: "decor" },
  rock_flat:        { url: "models/rock-flat.glb",        scale: 1.4, shadow: true, category: "decor" },
  workbench:        { url: "models/workbench.glb",        scale: 1.3, collider: { radius: 0.7 }, shadow: true, category: "decor" },

  // ─── Street kit (Kenney City Kit Roads, CC0) ───────────────────────────────
  cone:             { url: "models/construction-cone.glb",    scale: 1.4, shadow: true, category: "decor" },
  road_barrier:     { url: "models/construction-barrier.glb", scale: 1.5, collider: { radius: 0.8 }, shadow: true, category: "barricade" },
  road_light:       { url: "models/construction-light.glb",   scale: 1.4, shadow: true, category: "decor" },
  street_lamp:      { url: "models/light-square.glb",         scale: 1.6, collider: { radius: 0.25 }, shadow: true, category: "decor" },
  street_lamp_curve:{ url: "models/light-curved.glb",         scale: 1.6, collider: { radius: 0.25 }, shadow: true, category: "decor" },
  highway_sign:     { url: "models/sign-highway.glb",         scale: 1.3, collider: { radius: 0.3 }, shadow: true, category: "decor" },
  // Road tiles — large flat pieces. NOT colliders (player walks on them).
  road_straight:    { url: "models/road-straight.glb",        scale: 4.0, shadow: false, category: "road" },
  road_crossroad:   { url: "models/road-crossroad.glb",       scale: 4.0, shadow: false, category: "road" },
  road_bend:        { url: "models/road-bend.glb",            scale: 4.0, shadow: false, category: "road" },
  road_side:        { url: "models/road-side.glb",            scale: 4.0, shadow: false, category: "road" },
};

/** Get raw definition for a model id, or undefined if unknown. */
export function getModelDef(id) {
  return MODELS[id];
}

/** All model ids that match a category (e.g. "vehicle", "prop", "barricade"). */
export function modelsByCategory(category) {
  return Object.entries(MODELS)
    .filter(([, def]) => def.category === category)
    .map(([id]) => id);
}
