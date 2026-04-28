# GLB Models

Drop `.glb` (preferred) or `.gltf` files in this directory.

## How to add a new model

1. Save the file here, e.g. `public/models/abandoned_car.glb`.
2. Open `src/world/modelRegistry.js` and add an entry:

```js
abandoned_car: {
  url: "models/abandoned_car.glb",
  scale: 1.0,                 // post-load uniform scale
  yOffset: 0,                 // raise/lower from ground if needed
  collider: { radius: 1.4 },  // optional — adds it to visionBlockers/colliders
  shadow: true,
}
```

3. Anywhere in the game you can now do:

```js
import { spawnModel } from "./world/spawnModel.js";
const car = await spawnModel("abandoned_car", scene, { x: 5, z: 12 });
```

## Where to get free, license-friendly models

- **Kenney.nl** — CC0, low-poly, perfect style match for this game.
- **Quaternius.com** — CC0, survival/zombie packs.
- **Poly Pizza** — CC0/CC-BY, tagged search.
- **Sketchfab** — filter by "Downloadable" + "CC0" or "CC-BY".

Always check the license on each model before publishing.

## Why models go in `public/models/` not `src/`

Files under `public/` are served as-is at the URL path `/models/*.glb`. They
are NOT processed by Vite (no hashing, no bundling) — you can swap them
without rebuilding. They also don't bloat the JS bundle.

Files imported from `src/` go through Vite, get hashed, and end up in
`dist/assets/`. That's appropriate for textures used at module load time
but wasteful for optional/lazy 3D content.
