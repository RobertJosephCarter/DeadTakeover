/** Async GLB model loader + spawner.
 *
 *  Loads each unique model once, caches the parsed scene, and returns a
 *  fresh clone each time `spawnModel` is called. Models defined in
 *  ./modelRegistry.js can be spawned by string id without the caller
 *  having to know the URL or loading details.
 *
 *  Usage:
 *      import { spawnModel } from "./world/spawnModel.js";
 *      const car = await spawnModel("abandoned_car", scene, { x: 10, z: -5 });
 *      if (car) car.userData.collidable = true;
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { debugWarn } from "../core/debug.js";
import { getModelDef } from "./modelRegistry.js";

const _cache = new Map();   // id -> Promise<THREE.Group> (template)

/** Load (and cache) the template for a given model id. */
function loadTemplate(id) {
  const def = getModelDef(id);
  if (!def) {
    debugWarn(`spawnModel: unknown model id "${id}" — add it to src/world/modelRegistry.js`);
    return null;
  }
  if (_cache.has(id)) return _cache.get(id);

  const baseUrl = (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "/";
  const fullUrl = `${baseUrl.replace(/\/$/, "")}/${def.url.replace(/^\//, "")}`;
  const resourceUrl = fullUrl.slice(0, fullUrl.lastIndexOf("/") + 1);

  // Each load gets its OWN GLTFLoader instance so concurrent loads don't
  // clobber each other's resourcePath (the old code shared a single _loader
  // and called setResourcePath before each async .load — a race condition
  // that caused intermittent white/untextured models).
  const loader = new GLTFLoader();
  loader.setResourcePath(resourceUrl);

  const promise = new Promise((resolve) => {
    loader.load(
      fullUrl,
      (gltf) => {
        const root = gltf.scene;
        // Normalise every mesh's textures for quality + correct colour.
        root.traverse((obj) => {
          if (!obj.isMesh) return;
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of mats) {
            if (!mat) continue;
            // Diffuse / base-colour map
            if (mat.map) {
              mat.map.colorSpace = THREE.SRGBColorSpace;
              mat.map.anisotropy = 8;
              mat.map.minFilter = THREE.LinearMipmapLinearFilter;
              mat.map.magFilter = THREE.LinearFilter;
            }
            // Emissive map
            if (mat.emissiveMap) {
              mat.emissiveMap.colorSpace = THREE.SRGBColorSpace;
              mat.emissiveMap.anisotropy = 8;
            }
            // Normal / roughness / metalness / AO — keep Linear, but sharpen
            for (const key of ["normalMap", "roughnessMap", "metalnessMap", "aoMap"]) {
              if (mat[key]) {
                mat[key].anisotropy = 8;
                mat[key].minFilter = THREE.LinearMipmapLinearFilter;
              }
            }
            mat.needsUpdate = true;
          }
        });
        resolve(root);
      },
      undefined,
      (err) => {
        debugWarn(`spawnModel: failed to load ${fullUrl}`, err);
        resolve(null);
      },
    );
  });
  _cache.set(id, promise);
  return promise;
}

/** Spawn a model into the scene at (x, z), grounded to the given y if provided.
 *
 *  Returns the spawned `THREE.Group`, or null if the model couldn't be loaded.
 *  The group is added to `scene` for you and has `userData.modelId = id` set
 *  so you can identify it later (e.g. for collider registration).
 */
export async function spawnModel(id, scene, { x = 0, y = 0, z = 0, yaw = 0 } = {}) {
  const def = getModelDef(id);
  if (!def) return null;

  const template = await loadTemplate(id);
  if (!template) return null;

  const inst = template.clone(true);
  const group = new THREE.Group();
  group.add(inst);
  group.userData.modelId = id;

  // Auto-ground: shift so bbox.min.y is at 0 before applying user yOffset.
  if (def.autoGround !== false) {
    const box = new THREE.Box3().setFromObject(inst);
    inst.position.y -= box.min.y;
  }
  if (def.yOffset) inst.position.y += def.yOffset;
  if (def.scale && def.scale !== 1) inst.scale.setScalar(def.scale);

  group.position.set(x, y, z);
  group.rotation.y = yaw;

  if (def.shadow) {
    group.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }

  scene.add(group);
  return group;
}

/** Pre-load a list of model ids. Useful at level start to avoid hitches mid-game. */
export function preloadModels(ids) {
  return Promise.all(ids.map((id) => loadTemplate(id)).filter(Boolean));
}
