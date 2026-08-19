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
const timeFilter = document.getElementById("time-filter");
const typeFilter = document.getElementById("type-filter");
const historyEl = document.getElementById("search-history");
const historyEmpty = document.getElementById("history-empty");
const recommendations = document.getElementById("recommended-results");

const PAGE_SIZE = 4;
const HISTORY_KEY = "recipefinder:history";

let selectedDifficulty = "all";
let ingredients = [];
let lastRecipes = [];
let searchedRecipes = [];
let recommendedRecipes = [];
let selectedId = null;
let visibleCount = PAGE_SIZE;

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    difficultyButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    selectedDifficulty = button.dataset.difficulty;
  });
});

addBtn.addEventListener("click", () => addIngredientFromInput());
document.getElementById("clear-products").addEventListener("click", () => {
  ingredients = [];
  renderTags();
});

document.querySelectorAll("[data-quick-product]").forEach((button) => {
  button.addEventListener("click", () => addIngredient(button.dataset.quickProduct));
});

document.querySelectorAll("[data-collection]").forEach((button) => {
  button.addEventListener("click", () => {
    ingredients = button.dataset.collection.split(",");
    renderTags();
    form.requestSubmit();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addIngredientFromInput();
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  addIngredientFromInput();
  await searchRecipes();
});

async function searchRecipes() {
  if (ingredients.length === 0) {
    status.classList.add("is-error");
    status.textContent = "Добавь хотя бы один продукт.";
    workspace.hidden = true;
    return;
  }

  status.classList.remove("is-error");
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
        userId: getAuthUserId(),
      }),
    });

    if (!response.ok) {
      throw new Error("Сервер вернул ошибку: " + response.status);
    }

    searchedRecipes = await response.json();
    applyFilters();
    saveSearchHistory();
    visibleCount = PAGE_SIZE;
    applySort();
    renderResults();
  } catch (error) {
    status.textContent = "Не удалось выполнить поиск. Проверь, что API запущен.";
    workspace.hidden = true;
    console.error(error);
  }
}

sortSelect.addEventListener("change", () => {
  applySort();
  renderResults();
});

loadMoreBtn.addEventListener("click", () => {
  visibleCount += PAGE_SIZE;
  renderResults();
});

[timeFilter, typeFilter].forEach((select) => {
  select.addEventListener("change", () => {
    if (searchedRecipes.length === 0) return;
    applyFilters();
    applySort();
    renderResults();
  });
});

document.getElementById("theme-btn")?.addEventListener("click", () => {
  document.body.classList.toggle("is-light");
});

loadProductSuggestions();
loadRecommendations();
renderSearchHistory();
applyProductFromQuery();
renderTags();

function applyProductFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const product = params.get("product");
  if (product) {
    addIngredient(product);
  }
}

function addIngredient(name) {
  const value = String(name || "").trim();
  if (!value) return;
  if (!ingredients.some((item) => item.toLowerCase() === value.toLowerCase())) {
    ingredients.push(value);
    renderTags();
  }
}

function addIngredientFromInput() {
  const value = input.value.trim();
  if (!value) return;

  const parts = value
    .replaceAll(","," ")
    .split(/\s+/)
    .filter(Boolean);

  for (const part of parts) {
    addIngredient(part);
  } 
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

function applyFilters() {
  const maxMinutes = timeFilter.value === "all" ? Infinity : Number(timeFilter.value);
  const selectedType = typeFilter.value;

  lastRecipes = searchedRecipes.filter((recipe) => {
    const meta = recipeMeta(recipe);
    return meta.minutes <= maxMinutes && (selectedType === "all" || meta.type === selectedType);
  });
}

function saveSearchHistory() {
  const history = readSearchHistory();
  const current = [...ingredients];
  const signature = current.map((item) => item.toLowerCase()).sort().join("|");
  const unique = history.filter(
    (entry) => entry.map((item) => item.toLowerCase()).sort().join("|") !== signature
  );

  localStorage.setItem(HISTORY_KEY, JSON.stringify([current, ...unique].slice(0, 4)));
  renderSearchHistory();
}

function readSearchHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(value) ? value.filter(Array.isArray) : [];
  } catch {
    return [];
  }
}

function renderSearchHistory() {
  const history = readSearchHistory();
  historyEmpty.hidden = history.length > 0;
  historyEl.innerHTML = history
    .map(
      (entry, index) => `
        <button type="button" data-history-index="${index}">
          <span>${escapeHtml(entry.join(", "))}</span>
          <small>Повторить поиск →</small>
        </button>`
    )
    .join("");

  historyEl.querySelectorAll("[data-history-index]").forEach((button) => {
    button.addEventListener("click", () => {
      ingredients = [...history[Number(button.dataset.historyIndex)]];
      renderTags();
      form.requestSubmit();
    });
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

async function loadRecommendations() {
  try {
    const userId = getAuthUserId();
    const url = userId ? `/api/Recipes?userId=${userId}` : "/api/Recipes";
    const response = await fetch(url);
    if (!response.ok) throw new Error("status " + response.status);
    recommendedRecipes = await response.json();
    renderRecommendations();
  } catch (error) {
    recommendations.innerHTML = `<p class="recommendation-error">Не удалось загрузить рекомендации.</p>`;
    console.error(error);
  }
}

function renderRecommendations() {
  const badges = ["Лучший выбор", "Популярное", "Новое", "Полезно"];
  recommendations.innerHTML = recommendedRecipes
    .slice(0, 4)
    .map((recipe, index) => {
      const meta = recipeMeta(recipe);
      const isFav = !!recipe.isFavorite;
      const image = recipe.imageUrl
        ? `<img src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(recipe.name)}" loading="lazy" />`
        : `<div class="card-media--empty" style="height:100%"></div>`;

      return `
        <article class="recommendation-card" data-recommendation="${recipe.id}">
          <div class="recommendation-image">
            ${image}
            <span class="recommendation-badge badge-${index}">${badges[index]}</span>
            <button type="button" class="fav-btn ${isFav ? "is-on" : ""}" data-rec-fav="${recipe.id}" aria-label="В избранное">
              <svg viewBox="0 0 24 24" fill="${isFav ? "currentColor" : "none"}" aria-hidden="true">
                <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.6 12 20 12 20Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="recommendation-body">
            <h3>${escapeHtml(recipe.name)}</h3>
            <p class="card-meta"><span>⏱ ${meta.time}</span><span>✦ ${difficultyLabel(recipe.difficulty)}</span><span>🍽 ${meta.servings}</span></p>
            <p>${escapeHtml(meta.blurb)}</p>
          </div>
        </article>`;
    })
    .join("");

  recommendations.querySelectorAll("[data-recommendation]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("[data-rec-fav]")) return;
      const recipe = recommendedRecipes.find((item) => item.id === Number(card.dataset.recommendation));
      if (!recipe) return;
      ingredients = [...(recipe.products || [])];
      renderTags();
      form.requestSubmit();
    });
  });

  recommendations.querySelectorAll("[data-rec-fav]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      const id = Number(button.dataset.recFav);
      const data = await setFavorite(id);
      const recipe = recommendedRecipes.find((item) => item.id === id);
      if (recipe && data) recipe.isFavorite = data.isFavorite;
      renderRecommendations();
    });
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
      const isFav = !!recipe.isFavorite;
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
    button.addEventListener("click", async (event) => {
      event.stopPropagation();
      await toggleFavorite(button.dataset.fav);
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
    </div>
    <div class="nutrition">
      <div class="nutrition-head"><strong>Пищевая ценность</strong><span>на порцию</span></div>
      <div class="nutrition-grid">
        <span><small>Калории</small><strong>${meta.calories} ккал</strong></span>
        <span><small>Белки</small><strong>${meta.protein} г</strong></span>
        <span><small>Жиры</small><strong>${meta.fat} г</strong></span>
        <span><small>Углеводы</small><strong>${meta.carbs} г</strong></span>
      </div>
    </div>`;
}

function recipeMeta(recipe) {
  switch ((recipe.difficulty || "").toLowerCase()) {
    case "easy":
      return { time: "15 мин", minutes: 15, type: recipe.name?.toLowerCase().includes("яич") || recipe.name?.toLowerCase().includes("омлет") ? "breakfast" : "snack", servings: "1–2 порции", calories: 280, protein: 18, fat: 16, carbs: 12, blurb: "Простое блюдо на скорую руку — минимум шагов и продуктов." };
    case "medium":
      return { time: "25 мин", minutes: 25, type: "snack", servings: "2 порции", calories: 360, protein: 17, fat: 19, carbs: 30, blurb: "Немного внимания на плите — и получится сытный результат." };
    case "hard":
      return { time: "40 мин", minutes: 40, type: recipe.name?.toLowerCase().includes("блин") ? "breakfast" : "main", servings: "3–4 порции", calories: 450, protein: 12, fat: 14, carbs: 62, blurb: "Потребует чуть больше времени, но результат того стоит." };
    default:
      return { time: "20 мин", minutes: 20, type: "main", servings: "2 порции", calories: 320, protein: 16, fat: 12, carbs: 38, blurb: "Подходящий рецепт под твои продукты." };
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

async function toggleFavorite(id) {
  const data = await setFavorite(Number(id));
  if (data) {
    const recipe = lastRecipes.find((item) => item.id === Number(id));
    const recommended = recommendedRecipes.find((item) => item.id === Number(id));
    if (recipe) recipe.isFavorite = data.isFavorite;
    if (recommended) recommended.isFavorite = data.isFavorite;
    renderRecommendations();
  }
}

async function setFavorite(id) {
  const userId = getAuthUserId();
  if (!userId) {
    status.textContent = "Войди, чтобы сохранять избранное.";
    window.location.href = "/authorization.html";
    return null;
  }

  try {
    const response = await fetch(`/api/Recipes/${id}/favorite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const text = await response.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text };
      }
    }

    if (!response.ok) {
      if (response.status === 404) {
        clearCurrentUser();
        status.textContent = "Сессия устарела. Войди заново.";
        window.location.href = "/authorization.html";
        return null;
      }

      const message = data?.message || data?.title || text || `Ошибка ${response.status}`;
      status.textContent = `Не удалось обновить избранное: ${message}`;
      return null;
    }

    return {
      id: data.id ?? data.Id,
      isFavorite: data.isFavorite ?? data.IsFavorite,
    };
  } catch (error) {
    console.error(error);
    status.textContent = "Не удалось обновить избранное. Перезапусти API: dotnet run";
    return null;
  }
}

async function loadProductSuggestions() {
  try {
    const response = await fetch("/api/Recipes/products");
    if (!response.ok) return;
    const products = await response.json();
    suggestions.innerHTML = (products || [])
      .map((product) => {
        const name = typeof product === "string" ? product : product.name;
        return `<option value="${escapeHtml(name)}"></option>`;
      })
      .join("");
  } catch {
    console.error("Не удалось загрузить продукты.");
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
