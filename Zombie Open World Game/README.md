# DeadTakeover

DeadTakeover is a browser-based open-world zombie survival FPS built with **Three.js** and **Vite**.  
Fight through escalating hordes, build barricades, scavenge resources, and survive across multiple hostile maps with AI teammates.

## Why This Project

This game is focused on high-intensity survival loops inside the browser:

- Fast combat with weapon switching, ADS, and tactical utility items
- Squad-style pressure with special infected variants and map-based pacing
- Progression systems (materials, perks, and defensive building) that reward long runs

## Gameplay Highlights

- **6 playable maps**: Verdant Meadows, Dead Valley, Frost Expanse, Badlands, Ruined City, Outbreak City
- **AI teammates** that assist in combat and survival
- **Special infected roster** including Spitter, Hunter, Charger, Crawler, Juggernaut, Boomer, and Screamer
- **Barricade system** with wood and metal variants
- **Material scavenging** from combat encounters
- **Skill/perk upgrades** for damage, health, speed, reload, and headshot bonuses
- **Dynamic world pressure** via weather systems, day/night cycle, and horde spikes
- **Combat feedback systems** like kill feed, floating damage numbers, and enemy HP bars

## Controls

| Action | Key |
| --- | --- |
| Move | `W` `A` `S` `D` |
| Sprint | `Shift` |
| Crouch | `C` |
| Jump | `Space` |
| Shoot | `LMB` |
| Aim Down Sights | `RMB` |
| Reload | `R` |
| Swap Weapon | `Q` / `E` |
| Weapon Slots | `1` Rifle, `2` Shotgun, `3` Pistol |
| Throw Grenade | `G` |
| Throw Noise Maker | `V` |
| Melee Knife | `F` |
| Build Barricade | `B` |
| Switch Build Material | `N` |
| Team Swap | `T` |
| Pause | `P` |
| Toggle Audio | `M` |

## Quick Start

```bash
npm install
npm run dev
```

Open the Vite URL shown in your terminal (usually `http://localhost:5173`).

## Build Commands

```bash
npm run build
npm run preview
```

## Tech Stack

- [Three.js](https://threejs.org/)
- [Vite](https://vitejs.dev/)
- Web Audio API
- HTML5 Canvas HUD/Minimap

## Assets and Credits

- Building kits and street atlas: [Kenney](https://kenney.nl/) (CC0)
- Pistol model: [Webaverse pistol asset](https://github.com/webaverse/pistol)
- Music: Kevin MacLeod ([Incompetech](https://incompetech.com/), CC BY)
  - Title theme: *Floating Cities*
  - Map themes: *Movement Proposition*, *Darkest Child*, *Frost Waltz*, *Crossing the Chasm*, *Volatile Reaction*, *District Four*

## Repository Notes

- This repository is currently configured as private in `package.json`.
- All rights for project-specific code/content remain with the author unless noted otherwise.
