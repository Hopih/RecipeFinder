const form = document.getElementById("search-form");
const input = document.getElementById("products-input");
const results = document.getElementById("results");
const status = document.getElementById("status");

form.addEventListener("submit", async (event) => {
  // Не даём браузеру перезагрузить страницу при отправке формы
  event.preventDefault();

  const products = input.value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  if (products.length === 0) {
    status.textContent = "Введи хотя бы один продукт.";
    results.innerHTML = "";
    return;
  }

  status.textContent = "Ищем рецепты...";
  results.innerHTML = "";

  try {
    // Тот же адрес, что в Swagger: POST /api/Recipes/search
    const response = await fetch("/api/Recipes/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(products),
    });

    if (!response.ok) {
      throw new Error("Сервер вернул ошибку: " + response.status);
    }

    const recipes = await response.json();
    renderRecipes(recipes);
  } catch (error) {
    status.textContent = "Не удалось выполнить поиск. Проверь, что API запущен.";
    console.error(error);
  }
});

function renderRecipes(recipes) {
  if (!Array.isArray(recipes) || recipes.length === 0) {
    status.textContent = "Подходящих рецептов не найдено.";
    results.innerHTML = "";
    return;
  }

  status.textContent = `Найдено: ${recipes.length}`;

  // Рисуем результат в блок #results на странице
  results.innerHTML = recipes
    .map(
      (recipe) => `
      <article class="recipe">
        <h2>${escapeHtml(recipe.name)}</h2>
        <p class="recipe-products">${escapeHtml((recipe.products || []).join(", "))}</p>
        <p>${escapeHtml(recipe.instructions)}</p>
      </article>
    `
    )
    .join("");
}

// Защита от вставки HTML из ответа API
function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
