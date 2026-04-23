/** Inventory and crafting UI for DeadTakeover. */

const RECIPES = [
  { id: "medkit", name: "Medkit", icon: "🏥", cost: { cloth: 2, chemicals: 1 }, heal: 40, description: "Restores 40 HP" },
  { id: "ammo_pack", name: "Ammo Pack", icon: "🔫", cost: { scrap: 1, metal: 1 }, description: "Refills current weapon reserve" },
  { id: "molotov", name: "Molotov", icon: "🔥", cost: { cloth: 1, chemicals: 1 }, description: "Throwable fire bottle (G to throw)" },
  { id: "land_mine", name: "Land Mine", icon: "💣", cost: { scrap: 2, metal: 1 }, description: "Placed trap, 5m trigger radius" },
  { id: "spike_trap", name: "Spike Trap", icon: "🗡️", cost: { wood: 3, scrap: 1 }, description: "Damages zombies that walk over it" },
];

export function createInventoryOverlay() {
  const el = document.createElement("div");
  el.id = "inventory-overlay";
  el.className = "inventory-overlay is-hidden";
  el.innerHTML = `
    <div class="inventory-card">
      <h2>Inventory & Crafting</h2>
      <div class="inventory-section">
        <div class="inventory-label">Materials</div>
        <div class="material-grid" id="inv-materials"></div>
      </div>
      <div class="inventory-section">
        <div class="inventory-label">Crafting Recipes</div>
        <div class="recipe-grid" id="inv-recipes"></div>
      </div>
      <div class="inventory-actions">
        <button id="inv-close">Close (Tab)</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);
  return {
    overlay: el,
    materialsGrid: el.querySelector("#inv-materials"),
    recipesGrid: el.querySelector("#inv-recipes"),
    closeBtn: el.querySelector("#inv-close"),
  };
}

export function showInventory(inventoryUI, materials, player) {
  inventoryUI.overlay.classList.remove("is-hidden");
  renderMaterials(inventoryUI.materialsGrid, materials);
  renderRecipes(inventoryUI.recipesGrid, materials, player, inventoryUI);
}

export function hideInventory(inventoryUI) {
  inventoryUI.overlay.classList.add("is-hidden");
}

function renderMaterials(grid, materials) {
  grid.innerHTML = "";
  const matDefs = [
    { key: "scrap", label: "Scrap", icon: "🔩" },
    { key: "wood", label: "Wood", icon: "🪵" },
    { key: "metal", label: "Metal", icon: "🔧" },
    { key: "cloth", label: "Cloth", icon: "🧵" },
    { key: "chemicals", label: "Chemicals", icon: "🧪" },
  ];
  for (const def of matDefs) {
    const count = materials[def.key] || 0;
    const chip = document.createElement("div");
    chip.className = "material-chip";
    chip.innerHTML = `<span class="material-icon">${def.icon}</span><span class="material-name">${def.label}</span><span class="material-count">${count}</span>`;
    grid.appendChild(chip);
  }
}

function renderRecipes(grid, materials, player, inventoryUI) {
  grid.innerHTML = "";
  for (const recipe of RECIPES) {
    const canAfford = canAffordRecipe(recipe, materials);
    const card = document.createElement("div");
    card.className = "recipe-card" + (canAfford ? "" : " is-locked");

    const costStr = Object.entries(recipe.cost).map(([mat, amt]) => `${amt} ${mat}`).join(", ");
    card.innerHTML = `
      <div class="recipe-header">
        <span class="recipe-icon">${recipe.icon}</span>
        <span class="recipe-name">${recipe.name}</span>
      </div>
      <div class="recipe-desc">${recipe.description}</div>
      <div class="recipe-cost">${costStr}</div>
      <button class="recipe-btn" ${canAfford ? "" : "disabled"}>Craft</button>
    `;

    if (canAfford) {
      card.querySelector(".recipe-btn").addEventListener("click", () => {
        craftRecipe(recipe, materials, player);
        renderMaterials(inventoryUI.materialsGrid, materials);
        renderRecipes(inventoryUI.recipesGrid, materials, player, inventoryUI);
      });
    }
    grid.appendChild(card);
  }
}

function canAffordRecipe(recipe, materials) {
  for (const [mat, amt] of Object.entries(recipe.cost)) {
    if ((materials[mat] || 0) < amt) return false;
  }
  return true;
}

function craftRecipe(recipe, materials, player) {
  for (const [mat, amt] of Object.entries(recipe.cost)) {
    materials[mat] -= amt;
  }
  if (recipe.heal) {
    player.hp = Math.min(player.hp + recipe.heal, 100 + (player.skills?.health?.value || 0) * 15);
  }
  // Ammo pack: refills current weapon reserve by 30%
  if (recipe.id === "ammo_pack" && player.weapons && player.weapons[player.activeWeapon]) {
    const w = player.weapons[player.activeWeapon];
    w.reserve = Math.min(w.reserve + Math.floor(w.reserve * 0.3), (w.magSize || 20) * 12);
  }
  // Molotov / mine / spike: add to grenade count as proxy for now
  if (recipe.id === "molotov") {
    // Could add separate throwable count later
  }
}

export function getRecipes() {
  return RECIPES;
}
