const status = document.getElementById("status");
const grid = document.getElementById("products-grid");
const empty = document.getElementById("empty");
const countEl = document.getElementById("products-count");
const filterInput = document.getElementById("products-filter");

let products = [];

document.getElementById("theme-btn")?.addEventListener("click", () => {
  document.body.classList.toggle("is-light");
});

filterInput.addEventListener("input", () => renderProducts());

loadProducts();

async function loadProducts() {
  status.textContent = "Загружаем продукты…";

  try {
    const response = await fetch("/api/Recipes/products");
    if (!response.ok) throw new Error("status " + response.status);

    products = await response.json();
    if (!Array.isArray(products) || products.length === 0) {
      status.textContent = "";
      empty.hidden = false;
      countEl.textContent = "0";
      return;
    }

    status.textContent = "";
    renderProducts();
  } catch (error) {
    status.textContent = "Не удалось загрузить продукты. Проверь, что API запущен.";
    empty.hidden = true;
    console.error(error);
  }
}

function renderProducts() {
  const query = filterInput.value.trim().toLowerCase();
  const filtered = products.filter((product) => {
    const name = String(product.name || "").toLowerCase();
    return !query || name.includes(query);
  });

  countEl.textContent = String(filtered.length);
  empty.hidden = filtered.length > 0;
  grid.hidden = filtered.length === 0;

  grid.innerHTML = filtered
    .map(
      (product, index) => `
      <a
        class="product-card"
        href="/?product=${encodeURIComponent(product.name)}"
        style="animation-delay:${index * 30}ms"
      >
        <span class="product-card-icon" aria-hidden="true">${productIcon(product.name)}</span>
        <span class="product-card-body">
          <strong>${escapeHtml(product.name)}</strong>
          <small>${recipesLabel(product.recipesCount)}</small>
        </span>
        <span class="product-card-arrow" aria-hidden="true">→</span>
      </a>`
    )
    .join("");
}

function recipesLabel(count) {
  const value = Number(count) || 0;
  if (value === 1) return "1 рецепт";
  if (value >= 2 && value <= 4) return `${value} рецепта`;
  return `${value} рецептов`;
}

function productIcon(name) {
  const key = String(name || "").toLowerCase();
  if (key.includes("яйц")) return "🥚";
  if (key.includes("молок")) return "🥛";
  if (key.includes("сыр")) return "🧀";
  if (key.includes("хлеб")) return "🍞";
  if (key.includes("мук")) return "🌾";
  if (key.includes("сахар")) return "🍬";
  if (key.includes("масл")) return "🧈";
  if (key.includes("сол")) return "🧂";
  if (key.includes("помид") || key.includes("томат")) return "🍅";
  return "🧺";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
