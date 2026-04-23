# DeadTakeover

A browser-based zombie open-world survival FPS built with **Three.js** and **Vite**.

Play solo with AI teammates across multiple maps, survive waves of undead, build barricades, and scavenge materials from the environment.

---

## Play Now

Clone the repo, install dependencies, and run:

```bash
npm install
npm run dev
```

Then open the Vite dev URL in your browser (usually `http://localhost:5173`).

---

## Controls

| Action | Key |
|--------|-----|
| Move | `W` `A` `S` `D` |
| Sprint | `Shift` |
| Crouch | `C` |
| Jump | `Space` |
| Shoot | `LMB` (Click) |
| Aim Down Sights | `RMB` |
| Reload | `R` |
| Swap Weapon | `Q` / `E` |
| Weapon Slots | `1` (Rifle) `2` (Shotgun) `3` (Pistol) |
| Throw Grenade | `G` |
| Throw Noise Maker | `V` |
| Melee Knife | `F` |
| Build Barricade | `B` |
| Switch Build Type | `N` (Wood / Metal) |
| Team Swap | `T` |
| Pause | `P` |
| Toggle Audio | `M` |

---

## Features

- **6 Maps** — Verdant Meadows, Dead Valley, Frost Expanse, Badlands, Ruined City, and Outbreak City
- **AI Teammates** — AI companions that fight alongside you
- **Special Zombies** — Spitter (acid spit), Hunter (leap attack), Charger (charge), Crawler (low profile), Juggernaut, Boomer, Screamer
- **Corpse Revival** — Zombies revive if not killed with a headshot
- **Barricade Building** — Place wood or metal barricades to hold choke points
- **Material Scavenging** — Collect scrap, wood, metal, cloth, and chemicals from defeated zombies
- **Skill / Perk System** — Upgrade reload speed, damage, health, speed, and headshot bonus
- **Supply Drops** — Watch for star-marked supply drops falling from the sky (shown on minimap)
- **Weather System** — Dynamic rain, snow, fog, dust, and ash per map
- **Day / Night Cycle** — Horde nights with increased zombie spawns
- **Explosive Barrels** — Use environmental explosives to your advantage
- **Floating Damage Numbers** — See real-time hit values and headshot crits above enemies
- **Kill Feed** — Scrolling kill log on the right side showing kills, streaks, and bonuses
- **Enemy Health Bars** — Health bars displayed above special and boss zombies in-world
- **Barricade HP Bars** — Visual health bars appear above damaged barricades
- **Reload Progress Bar** — Crosshair-adjacent bar shows reload completion percentage
- **Vehicle HUD** — HP and fuel gauge displayed when driving a vehicle
- **Enhanced Minimap** — Supply drops, survivors, and near-reviving corpses are marked

---

## Tech Stack

- [Three.js](https://threejs.org/) — WebGL rendering engine
- [Vite](https://vitejs.dev/) — Build tool and dev server
- Web Audio API — Spatial 3D audio and procedural sound effects
- HTML5 Canvas — Minimap rendering

---

## Assets & Credits

- **Buildings & street atlas** — [Kenney.nl](https://kenney.nl/) (CC0)
- **Pistol GLB** — [Webaverse](https://github.com/webaverse/pistol)
- **Music** — Kevin MacLeod ([incompetech.com](https://incompetech.com/), CC BY)
  - Title: *Floating Cities*
  - Maps + Outbreak City: *Movement Proposition*, *Darkest Child*, *Frost Waltz*, *Crossing the Chasm*, *Volatile Reaction*, *District Four*

---

## License

This project is private. All code and assets remain the property of the author unless otherwise stated.
