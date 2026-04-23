import { WEAPON_UPGRADES } from "../core/constants.js";
import { getUpgradeCost, canAffordUpgrade, deductUpgradeCost, applyWeaponUpgrade } from "../combat/weaponSystem.js";

const UPGRADE_ICONS = {
  extendedMag: "🔋",
  damageBoost: "⚔️",
  laserSight: "🎯",
  suppressor: "🔇",
  fireRate: "⚡",
};

export function createUpgradeBenchOverlay() {
  const el = document.createElement("div");
  el.id = "upgrade-bench";
  el.className = "upgrade-bench-overlay is-hidden";
  el.innerHTML = `
    <div class="upgrade-bench-card">
      <h2>Weapon Upgrade Bench</h2>
      <p class="upgrade-bench-subtitle">Select a weapon to upgrade using scavenged materials.</p>
      <div id="upgrade-weapon-list" class="upgrade-weapon-list"></div>
      <div id="upgrade-details" class="upgrade-details is-hidden">
        <div class="upgrade-weapon-name" id="upgrade-weapon-name"></div>
        <div class="upgrade-grid" id="upgrade-grid"></div>
      </div>
      <div class="upgrade-bench-actions">
        <button id="upgrade-bench-close">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  return {
    overlay: el,
    weaponList: el.querySelector("#upgrade-weapon-list"),
    details: el.querySelector("#upgrade-details"),
    weaponName: el.querySelector("#upgrade-weapon-name"),
    grid: el.querySelector("#upgrade-grid"),
    closeBtn: el.querySelector("#upgrade-bench-close"),
  };
}

export function showUpgradeBench(bench, player, materials, skills, onApply) {
  bench.overlay.classList.remove("is-hidden");
  bench.weaponList.innerHTML = "";
  bench.details.classList.add("is-hidden");

  for (let i = 0; i < player.weapons.length; i++) {
    const w = player.weapons[i];
    const chip = document.createElement("button");
    chip.className = "upgrade-weapon-chip";
    chip.innerHTML = `<span class="upgrade-weapon-chip-icon">${i + 1}</span><span class="upgrade-weapon-chip-name">${w.name}</span>`;
    chip.addEventListener("click", () => {
      bench.details.classList.remove("is-hidden");
      bench.weaponName.textContent = `${w.name} (Slot ${i + 1})`;
      renderUpgradeGrid(bench, w, materials, () => onApply(i));
    });
    bench.weaponList.appendChild(chip);
  }
}

export function hideUpgradeBench(bench) {
  bench.overlay.classList.add("is-hidden");
}

function renderUpgradeGrid(bench, weapon, materials, onApply) {
  bench.grid.innerHTML = "";

  for (const [id, def] of Object.entries(WEAPON_UPGRADES)) {
    const currentTier = (weapon.upgrades && weapon.upgrades[id]) || 0;
    const isMaxed = currentTier >= def.maxTier;
    const canAfford = !isMaxed && canAffordUpgrade(materials, id, currentTier);

    const card = document.createElement("div");
    card.className = "upgrade-card" + (isMaxed ? " is-maxed" : canAfford ? "" : " is-locked");

    const icon = UPGRADE_ICONS[id] || "🔧";
    const costStr = isMaxed
      ? "Maxed"
      : formatCost(getUpgradeCost(id, currentTier));

    const effectStr = getEffectDescription(def, weapon);

    card.innerHTML = `
      <div class="upgrade-card-header">
        <span class="upgrade-card-icon">${icon}</span>
        <span class="upgrade-card-name">${def.name}</span>
      </div>
      <div class="upgrade-card-tier">Tier ${currentTier}/${def.maxTier}</div>
      <div class="upgrade-card-effect">${effectStr}</div>
      <div class="upgrade-card-cost">${costStr}</div>
      <button class="upgrade-card-btn" ${canAfford ? "" : "disabled"}>${isMaxed ? "Maxed" : "Upgrade"}</button>
    `;

    if (canAfford && !isMaxed) {
      card.querySelector(".upgrade-card-btn").addEventListener("click", () => {
        if (deductUpgradeCost(materials, id, currentTier)) {
          applyWeaponUpgrade(weapon, id);
          onApply();
          renderUpgradeGrid(bench, weapon, materials, onApply);
        }
      });
    }

    bench.grid.appendChild(card);
  }
}

function formatCost(cost) {
  if (!cost) return "";
  return Object.entries(cost)
    .map(([mat, amt]) => `${mat}: ${amt}`)
    .join(" | ");
}

function getEffectDescription(def, weapon) {
  switch (def.effect) {
    case "magSize":
      return `+${Math.round(def.valuePerTier * 100)}% magazine size per tier`;
    case "damage":
      return `+${Math.round(def.valuePerTier * 100)}% damage per tier`;
    case "fireDelay":
      return `-${Math.round(-def.valuePerTier * 100)}% fire delay per tier`;
    case "laser":
      return "Improves hip-fire accuracy";
    case "suppress":
      return "Reduces zombie alert radius";
    default:
      return "Passive improvement";
  }
}
