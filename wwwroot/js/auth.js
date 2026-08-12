const USER_KEY = "recipefinder:user";

const avatar = document.getElementById("user-avatar");
const menuPanel = document.getElementById("user-menu-panel");
const menuName = document.getElementById("user-menu-name");
const logoutBtn = document.getElementById("user-menu-logout");

function normalizeUser(user) {
  if (!user) {
    return null;
  }

  const id = user.id ?? user.Id;
  const name = user.name ?? user.Name;

  if (!id || !name) {
    return null;
  }

  return {
    id: Number(id),
    name: String(name),
    email: user.email ?? user.Email ?? "",
    isAdmin: Boolean(user.isAdmin ?? user.IsAdmin),
  };
}

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? normalizeUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function getAuthUserId() {
  const user = getCurrentUser();
  return user?.id ?? null;
}

function setCurrentUser(user) {
  const normalized = normalizeUser(user);
  if (!normalized) {
    return;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(normalized));
  applyAuthUi();
}

function clearCurrentUser() {
  localStorage.removeItem(USER_KEY);
  closeUserMenu();
  applyAuthUi();
}

function applyAuthUi() {
  if (!avatar) {
    return;
  }

  const user = getCurrentUser();

  if (user?.name) {
    avatar.textContent = user.name.trim().charAt(0).toUpperCase();
    avatar.title = `${user.name} — нажми для выхода`;
    avatar.setAttribute("aria-label", `Профиль: ${user.name}`);
    avatar.setAttribute("aria-haspopup", "true");
    avatar.setAttribute("aria-expanded", menuPanel?.hidden === false ? "true" : "false");
    avatar.removeAttribute("href");
    avatar.classList.add("is-logged-in");

    if (menuName) {
      menuName.textContent = user.name;
    }
  } else {
    avatar.textContent = "A";
    avatar.title = "Вход";
    avatar.setAttribute("aria-label", "Вход и регистрация");
    avatar.setAttribute("href", "/authorization.html");
    avatar.removeAttribute("aria-haspopup");
    avatar.removeAttribute("aria-expanded");
    avatar.classList.remove("is-logged-in");
    closeUserMenu();
  }
}

function openUserMenu() {
  if (!menuPanel || !getCurrentUser()) {
    return;
  }

  menuPanel.hidden = false;
  avatar?.setAttribute("aria-expanded", "true");
}

function closeUserMenu() {
  if (!menuPanel) {
    return;
  }

  menuPanel.hidden = true;
  avatar?.setAttribute("aria-expanded", "false");
}

function toggleUserMenu() {
  if (!getCurrentUser()) {
    return;
  }

  if (menuPanel?.hidden) {
    openUserMenu();
  } else {
    closeUserMenu();
  }
}

avatar?.addEventListener("click", (event) => {
  if (!getCurrentUser()) {
    return;
  }

  event.preventDefault();
  toggleUserMenu();
});

logoutBtn?.addEventListener("click", () => {
  clearCurrentUser();

  if (window.location.pathname.endsWith("authorization.html")) {
    window.location.href = "/";
  }
});

document.addEventListener("click", (event) => {
  if (!menuPanel || menuPanel.hidden) {
    return;
  }

  const menu = document.getElementById("user-menu");
  if (menu && !menu.contains(event.target)) {
    closeUserMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeUserMenu();
  }
});

applyAuthUi();
