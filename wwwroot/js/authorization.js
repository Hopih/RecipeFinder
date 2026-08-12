document.getElementById("theme-btn")?.addEventListener("click", () => {
  document.body.classList.toggle("is-light");
});

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const statusEl = document.getElementById("auth-status");

if (getCurrentUser()) {
  window.location.href = "/";
}

document.getElementById("show-register")?.addEventListener("click", () => {
  loginForm.hidden = true;
  registerForm.hidden = false;
  statusEl.hidden = true;
});

document.getElementById("show-login")?.addEventListener("click", () => {
  registerForm.hidden = true;
  loginForm.hidden = false;
  statusEl.hidden = true;
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitAuth("/api/Recipes/authorization", {
    email: document.getElementById("login-email").value.trim(),
    password: document.getElementById("login-password").value
  });
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitAuth("/api/Recipes/registration", {
    name: document.getElementById("register-name").value.trim(),
    email: document.getElementById("register-email").value.trim(),
    password: document.getElementById("register-password").value
  });
});

async function submitAuth(url, body) {
  showStatus("Отправляем…", false);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    let data = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const message = typeof data === "string"
        ? data
        : data?.title || data?.detail || response.statusText || "Не удалось выполнить запрос";
      showStatus(message, true);
      return;
    }

    setCurrentUser({
      id: data.id,
      name: data.name,
      email: data.email,
      isAdmin: data.isAdmin
    });

    window.location.href = "/";
  } catch {
    showStatus("Сервер недоступен. Запусти API и попробуй снова.", true);
  }
}

function showStatus(message, isError) {
  statusEl.textContent = message;
  statusEl.hidden = false;
  statusEl.classList.toggle("is-error", Boolean(isError));
}
