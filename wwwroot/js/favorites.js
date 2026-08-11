const status = document.getElementById("status");
const workspace = document.getElementById("workspace");
const results = document.getElementById("results");
const detail = document.getElementById("detail");
const empty = document.getElementById("empty");
const favCount = document.getElementById("fav-count");

let recipes = [];
let selectedId = null;

document.getElementById("theme-btn")?.addEventListener("click", () => {
  document.body.classList.toggle("is-light");
});

loadFavoritesPage();

async function loadFavoritesPage() {
  status.textContent = "Загружаем избранное…";

  try {
    const response = await fetch("/api/Recipes/favorites");
    if (!response.ok) throw new Error("status " + response.status);

    recipes = await response.json();

    if (!Array.isArray(recipes) || recipes.length === 0) {
      showEmpty();
      return;
    }

    selectedId = recipes[0].id;
    renderPage();
  } catch (error) {
    status.textContent = "Не удалось загрузить избранное. Проверь, что API запущен.";
    workspace.hidden = true;
    empty.hidden = true;
    console.error(error);
  }
}

function showEmpty() {
  status.textContent = "";
  workspace.hidden = true;
  detail.hidden = true;
  empty.hidden = false;
}

function renderPage() {
  empty.hidden = true;
  workspace.hidden = false;
  status.textContent = "";
  favCount.textContent = `${recipes.length}`;

  results.innerHTML = recipes
    .map((recipe, index) => {
      const isSelected = recipe.id === selectedId;
      const meta = recipeMeta(recipe);
      const image = recipe.imageUrl
        ? `<img src="${escapeHtml(recipe.imageUrl)}" alt="${escapeHtml(recipe.name)}" loading="lazy" />`
        : `<div class="card-media--empty" style="height:100%"></div>`;

      return `
        <article class="card ${isSelected ? "is-selected" : ""}" data-id="${recipe.id}" style="animation-delay:${index * 40}ms">
          <div class="card-media">
            ${image}
            <button type="button" class="fav-btn is-on" data-fav="${recipe.id}" aria-label="Убрать из избранного">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
            <p class="match-ok"><span aria-hidden="true">♥</span> В избранном</p>
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
      await removeFavorite(button.dataset.fav);
    });
  });

  const selected = recipes.find((recipe) => recipe.id === selectedId);
  if (selected) renderDetail(selected);
}

async function removeFavorite(id) {
  try {
    const response = await fetch(`/api/Recipes/${id}/favorite`, { method: "POST" });
    if (!response.ok) throw new Error("status " + response.status);

    recipes = recipes.filter((recipe) => String(recipe.id) !== String(id));

    if (recipes.length === 0) {
      showEmpty();
      return;
    }

    if (!recipes.some((recipe) => recipe.id === selectedId)) {
      selectedId = recipes[0].id;
    }

    renderPage();
  } catch (error) {
    console.error(error);
    status.textContent = "Не удалось убрать из избранного.";
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
      return { time: "20 мин", servings: "2 порции", blurb: "Рецепт из твоего избранного." };
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
