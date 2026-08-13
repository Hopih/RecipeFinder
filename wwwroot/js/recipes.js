const status = document.getElementById("status");
const workspace = document.getElementById("workspace");
const results = document.getElementById("recipes-container");
const detail = document.getElementById("detail");
const empty = document.getElementById("empty");
const countEl = document.getElementById("recipes-count");
const filterInput = document.getElementById("recipes-filter");

let recipes = [];
let selectedId = null;

document.getElementById("theme-btn")?.addEventListener("click", () => {
  document.body.classList.toggle("is-light");
});

filterInput?.addEventListener("input", () => renderPage());

loadRecipes();

async function loadRecipes() {
  status.textContent = "Загружаем рецепты…";

  try {
    const userId = getAuthUserId();
    const url = userId ? `/api/Recipes?userId=${userId}` : "/api/Recipes";
    const response = await fetch(url);
    if (!response.ok) throw new Error("status " + response.status);

    recipes = await response.json();

    if (!Array.isArray(recipes) || recipes.length === 0) {
      status.textContent = "";
      workspace.hidden = true;
      empty.hidden = false;
      countEl.textContent = "0";
      return;
    }

    selectedId = recipes[0].id;
    status.textContent = "";
    renderPage();
  } catch (error) {
    status.textContent = "Не удалось загрузить рецепты. Проверь, что API запущен.";
    workspace.hidden = true;
    empty.hidden = true;
    console.error(error);
  }
}

function getFilteredRecipes() {
  const query = (filterInput?.value || "").trim().toLowerCase();
  if (!query) return recipes;
  return recipes.filter((recipe) =>
    String(recipe.name || "").toLowerCase().includes(query)
  );
}

function renderPage() {
  const filtered = getFilteredRecipes();
  countEl.textContent = String(filtered.length);

  if (filtered.length === 0) {
    workspace.hidden = true;
    detail.hidden = true;
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  workspace.hidden = false;

  if (!filtered.some((recipe) => recipe.id === selectedId)) {
    selectedId = filtered[0].id;
  }

  results.innerHTML = filtered
    .map((recipe, index) => {
      const isSelected = recipe.id === selectedId;
      const isFav = !!recipe.isFavorite;
      const meta = recipeMeta(recipe);
      const image = recipe.imageUrl
        ? `<img src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(recipe.name)}" loading="lazy" />`
        : `<div class="card-media--empty" style="height:100%"></div>`;

      return `
        <article class="card ${isSelected ? "is-selected" : ""}" data-id="${recipe.id}" style="animation-delay:${index * 40}ms">
          <div class="card-media">
            ${image}
            <button type="button" class="fav-btn ${isFav ? "is-on" : ""}" data-fav="${recipe.id}" aria-label="В избранное">
              <svg viewBox="0 0 24 24" fill="${isFav ? "currentColor" : "none"}" aria-hidden="true">
                <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="card-body">
            <h3>${escapeHtml(recipe.name)}</h3>
            <p class="card-meta">
              <span>⏱ ${meta.time}</span>
              <span>✦ ${escapeHtml(difficultyLabel(recipe.difficulty))}</span>
            </p>
            <p class="match-partial">${escapeHtml((recipe.products || []).slice(0, 4).join(", "))}${(recipe.products || []).length > 4 ? "…" : ""}</p>
          </div>
        </article>`;
    })
    .join("");

  results.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-fav]")) return;
      selectedId = Number(card.dataset.id);
      renderPage();
    });
  });

  results.querySelectorAll("[data-fav]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      await toggleFavorite(button.dataset.fav);
    });
  });

  const selected = filtered.find((recipe) => recipe.id === selectedId);
  if (selected) renderDetail(selected);
}

async function toggleFavorite(id) {
  const userId = getAuthUserId();
  if (!userId) {
    window.location.href = "/authorization.html";
    return;
  }

  try {
    const response = await fetch(`/api/Recipes/${id}/favorite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    if (response.status === 404) {
      clearCurrentUser?.();
      window.location.href = "/authorization.html";
      return;
    }

    if (!response.ok) throw new Error("status " + response.status);

    const data = await response.json();
    const isFavorite = Boolean(data.isFavorite ?? data.IsFavorite);
    const recipe = recipes.find((item) => String(item.id) === String(id));
    if (recipe) recipe.isFavorite = isFavorite;
    renderPage();
  } catch (error) {
    console.error(error);
    status.textContent = "Не удалось обновить избранное.";
  }
}

function renderDetail(recipe) {
  const meta = recipeMeta(recipe);
  const steps = String(recipe.instructions || "")
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  const products = recipe.products || [];
  const image = recipe.imageUrl
    ? `<img class="detail-image" src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(recipe.name)}" />`
    : `<div class="detail-image detail-image--empty" aria-hidden="true"></div>`;

  detail.hidden = false;
  detail.innerHTML = `
    <h2 class="detail-title">${escapeHtml(recipe.name)}</h2>
    <p class="detail-meta">
      <span>⏱ ${meta.time}</span>
      <span>✦ ${escapeHtml(difficultyLabel(recipe.difficulty))}</span>
      <span>🍽 ${meta.servings}</span>
    </p>
    <p class="detail-desc">${escapeHtml(meta.blurb)}</p>
    ${image}
    <div class="detail-columns">
      <div>
        <h3>Ингредиенты</h3>
        <ul class="ing-list">
          ${products
            .map(
              (name) => `
              <li class="have">
                <span class="check" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
                ${escapeHtml(name)}
              </li>`
            )
            .join("")}
        </ul>
      </div>
      <div>
        <h3>Шаги</h3>
        <ol class="step-list">
          ${steps
            .map(
              (step, index) => `
              <li>
                <span class="step-num">${index + 1}</span>
                <span>${escapeHtml(step)}</span>
              </li>`
            )
            .join("")}
        </ol>
      </div>
    </div>`;
}

function recipeMeta(recipe) {
  switch ((recipe.difficulty || "").toLowerCase()) {
    case "easy":
      return { time: "15 мин", servings: "1–2 порции", blurb: "Простое блюдо на скорую руку — минимум шагов и продуктов." };
    case "medium":
      return { time: "25 мин", servings: "2 порции", blurb: "Немного внимания на плите — и получится сытный результат." };
    case "hard":
      return { time: "40 мин", servings: "3–4 порции", blurb: "Потребует чуть больше времени, но результат того стоит." };
    default:
      return { time: "20 мин", servings: "2 порции", blurb: "Рецепт из каталога RecipeFinder." };
  }
}

function difficultyLabel(value) {
  switch ((value || "").toLowerCase()) {
    case "easy":
      return "Легко";
    case "medium":
      return "Средне";
    case "hard":
      return "Сложно";
    default:
      return value || "—";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
