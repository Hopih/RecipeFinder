const form = document.getElementById("search-form");
const input = document.getElementById("products-input");
const addBtn = document.getElementById("add-product-btn");
const tagsEl = document.getElementById("ingredient-tags");
const results = document.getElementById("results");
const status = document.getElementById("status");
const workspace = document.getElementById("workspace");
const detail = document.getElementById("detail");
const sortSelect = document.getElementById("sort-select");
const loadMoreBtn = document.getElementById("load-more");
const suggestions = document.getElementById("product-suggestions");
const difficultyButtons = document.querySelectorAll(".difficulty-btn");

const FAV_KEY = "recipefinder:favorites";
const PAGE_SIZE = 4;

let selectedDifficulty = "all";
let ingredients = [];
let lastRecipes = [];
let selectedId = null;
let visibleCount = PAGE_SIZE;
let favorites = loadFavorites();

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    difficultyButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    selectedDifficulty = button.dataset.difficulty;
  });
});

addBtn.addEventListener("click", () => addIngredientFromInput());
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addIngredientFromInput();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  addIngredientFromInput();

  if (ingredients.length === 0) {
    status.textContent = "Добавь хотя бы один продукт.";
    workspace.hidden = true;
    return;
  }

  status.textContent = "Ищем рецепты…";
  results.innerHTML = "";
  detail.hidden = true;
  detail.innerHTML = "";
  selectedId = null;

  try {
    const response = await fetch("/api/Recipes/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        products: ingredients,
        difficulty: selectedDifficulty,
      }),
    });

    if (!response.ok) {
      throw new Error("Сервер вернул ошибку: " + response.status);
    }

    lastRecipes = await response.json();
    visibleCount = PAGE_SIZE;
    applySort();
    renderResults();
  } catch (error) {
    status.textContent = "Не удалось выполнить поиск. Проверь, что API запущен.";
    workspace.hidden = true;
    console.error(error);
  }
});

sortSelect.addEventListener("change", () => {
  applySort();
  renderResults();
});

loadMoreBtn.addEventListener("click", () => {
  visibleCount += PAGE_SIZE;
  renderResults();
});

document.getElementById("theme-btn")?.addEventListener("click", () => {
  document.body.classList.toggle("is-light");
});

loadProductSuggestions();
renderTags();

function addIngredientFromInput() {
  const value = input.value.trim();
  if (!value) return;

  const parts = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  for (const part of parts) {
    if (!ingredients.some((item) => item.toLowerCase() === part.toLowerCase())) {
      ingredients.push(part);
    }
  }

  input.value = "";
  renderTags();
}

function removeIngredient(name) {
  ingredients = ingredients.filter((item) => item !== name);
  renderTags();
}

function renderTags() {
  tagsEl.innerHTML = ingredients
    .map(
      (name) => `
      <span class="tag">
        ${escapeHtml(name)}
        <button type="button" aria-label="Удалить ${escapeHtml(name)}" data-remove="${escapeHtml(name)}">×</button>
      </span>`
    )
    .join("");

  tagsEl.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => removeIngredient(button.dataset.remove));
  });
}

function applySort() {
  const rank = { easy: 1, medium: 2, hard: 3 };
  const mode = sortSelect.value;

  lastRecipes = [...lastRecipes].sort((a, b) => {
    if (mode === "easy") {
      return (rank[a.difficulty] || 9) - (rank[b.difficulty] || 9);
    }
    if (mode === "hard") {
      return (rank[b.difficulty] || 0) - (rank[a.difficulty] || 0);
    }
    // relevance
    if (a.hasAllIngredients !== b.hasAllIngredients) {
      return a.hasAllIngredients ? -1 : 1;
    }
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount;
    }
    return (a.totalCount - a.matchCount) - (b.totalCount - b.matchCount);
  });
}

function renderResults() {
  if (!Array.isArray(lastRecipes) || lastRecipes.length === 0) {
    status.textContent = "Подходящих рецептов не найдено.";
    workspace.hidden = true;
    return;
  }

  workspace.hidden = false;
  status.textContent = `Найдено: ${lastRecipes.length}`;

  const slice = lastRecipes.slice(0, visibleCount);
  loadMoreBtn.hidden = visibleCount >= lastRecipes.length;

  if (!selectedId || !lastRecipes.some((recipe) => recipe.id === selectedId)) {
    selectedId = slice[0]?.id ?? null;
  }

  results.innerHTML = slice
    .map((recipe, index) => {
      const isBest = index === 0 && recipe.hasAllIngredients;
      const isFav = favorites.has(String(recipe.id));
      const isSelected = recipe.id === selectedId;
      const meta = recipeMeta(recipe);

      const image = recipe.imageUrl
        ? `<img src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(recipe.name)}" loading="lazy" />`
        : `<div class="card-media--empty" style="height:100%"></div>`;

      const matchText = recipe.hasAllIngredients
        ? `<p class="match-ok"><span aria-hidden="true">✓</span> Все продукты есть</p>`
        : `<p class="match-partial">Не хватает: ${escapeHtml((recipe.missingProducts || []).join(", "))}</p>`;

      return `
        <article class="card ${isBest ? "is-best" : ""} ${isSelected ? "is-selected" : ""}" data-id="${recipe.id}" style="animation-delay:${index * 40}ms">
          <div class="card-media">
            ${image}
            ${isBest ? `<span class="badge-best">Лучший матч</span>` : ""}
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
            ${matchText}
          </div>
        </article>`;
    })
    .join("");

  results.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-fav]")) return;
      selectedId = Number(card.dataset.id);
      renderResults();
    });
  });

  results.querySelectorAll("[data-fav]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFavorite(button.dataset.fav);
      renderResults();
    });
  });

  const selected = lastRecipes.find((recipe) => recipe.id === selectedId);
  if (selected) {
    renderDetail(selected);
  }
}

function renderDetail(recipe) {
  const meta = recipeMeta(recipe);
  const steps = String(recipe.instructions || "")
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean);

  const have = new Set((recipe.haveProducts || []).map((item) => item.toLowerCase()));
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
            .map((name) => {
              const owned = have.has(name.toLowerCase());
              return `
                <li class="${owned ? "have" : ""}">
                  <span class="check" aria-hidden="true">
                    ${owned ? `<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ""}
                  </span>
                  ${escapeHtml(name)}
                </li>`;
            })
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
      return { time: "20 мин", servings: "2 порции", blurb: "Подходящий рецепт под твои продукты." };
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

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.map(String) : []);
  } catch {
    return new Set();
  }
}

function toggleFavorite(id) {
  const key = String(id);
  if (favorites.has(key)) favorites.delete(key);
  else favorites.add(key);
  localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
}

async function loadProductSuggestions() {
  try {
    const response = await fetch("/api/Recipes/products");
    if (!response.ok) return;
    const products = await response.json();
    suggestions.innerHTML = (products || [])
      .map((name) => `<option value="${escapeHtml(name)}"></option>`)
      .join("");
  } catch {
    // suggestions are optional
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
