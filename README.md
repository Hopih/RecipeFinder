# 🍳 RecipeFinder

<div align="center">

### Найди рецепт из продуктов, которые уже есть дома

RecipeFinder подбирает блюда по ингредиентам, показывает недостающие продукты<br/>
и сохраняет любимые рецепты отдельно для каждого пользователя.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Открыть-22c55e?style=for-the-badge&logo=render&logoColor=white)](https://recipefinder-s9co.onrender.com)
[![.NET](https://img.shields.io/badge/.NET-10-512BD4?style=for-the-badge&logo=dotnet)](https://dotnet.microsoft.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

</div>

> [!NOTE]
> Демо размещено на бесплатном Render. После периода бездействия первый запуск может занять до 50 секунд.

## ✨ Возможности

- 🔎 Поиск рецептов по одному или нескольким ингредиентам
- 📊 Сортировка по числу совпавших продуктов
- 🧾 Отображение имеющихся и недостающих ингредиентов
- 🎚️ Фильтрация по сложности: `easy`, `medium`, `hard`
- ❤️ Персональное избранное для каждого пользователя
- 👤 Регистрация, вход и выход из аккаунта
- 🥕 Каталог продуктов с количеством подходящих рецептов
- 📖 Подробные инструкции приготовления
- 🌓 Светлая и тёмная темы
- 🐳 Запуск приложения и PostgreSQL через Docker Compose
- 🚀 Автоматический деплой из GitHub на Render

## 🧱 Архитектура

```mermaid
flowchart LR
    User([Пользователь])

    subgraph Browser["Frontend · Browser"]
        Pages["HTML pages<br/>Search · Products · Favorites · Auth"]
        Scripts["Vanilla JavaScript<br/>Fetch API · DOM · localStorage"]
        Styles["CSS<br/>Responsive UI · Themes"]
    end

    subgraph Backend["Backend · ASP.NET Core 10"]
        Static["Static Files Middleware"]
        Controller["RecipesController<br/>REST API"]
        EF["Entity Framework Core<br/>AppDbContext"]
        Seeder["Migrations + DbSeeder"]
    end

    subgraph Storage["Data · PostgreSQL 16"]
        Recipes[(Recipes)]
        Products[(Products)]
        Users[(Users)]
        Relations[(Many-to-many tables)]
    end

    User --> Pages
    Pages --> Scripts
    Styles --> Pages
    Scripts -->|"HTTP / JSON"| Controller
    Static --> Pages
    Controller --> EF
    Seeder --> EF
    EF --> Recipes
    EF --> Products
    EF --> Users
    EF --> Relations
```

### Поток поиска

```mermaid
sequenceDiagram
    actor User as Пользователь
    participant UI as Frontend
    participant API as RecipesController
    participant EF as Entity Framework
    participant DB as PostgreSQL

    User->>UI: Добавляет ингредиенты и сложность
    UI->>API: POST /api/Recipes/search
    API->>EF: Загружает Recipes + Products
    EF->>DB: SQL-запрос
    DB-->>EF: Рецепты и ингредиенты
    EF-->>API: Модели
    API->>API: Считает совпадения и недостающие продукты
    API-->>UI: SearchRecipeDto[]
    UI-->>User: Ранжированные карточки рецептов
```

### Схема развёртывания

```mermaid
flowchart LR
    Dev["Локальная разработка"] -->|git push| GitHub["GitHub · main"]
    GitHub -->|Auto Deploy| Render["Render Web Service<br/>Docker · .NET 10"]
    Render -->|Private Network| CloudDB[("Render PostgreSQL")]

    Docker["Docker Compose"] --> LocalApp["RecipeFinder container"]
    Docker --> LocalDB[("PostgreSQL container")]
    LocalApp --> LocalDB
```

## 🗃️ Модель данных

```mermaid
erDiagram
    USER }o--o{ RECIPE : favorites
    RECIPE }o--o{ PRODUCT : ingredients

    USER {
        int Id PK
        string Name
        string Email
        string Password
        bool IsAdmin
    }

    RECIPE {
        int Id PK
        string Name
        string Instructions
        string ImageUrl
        string Difficulty
    }

    PRODUCT {
        int Id PK
        string Name
    }
```

`Recipe ↔ Product` и `User ↔ Recipe` — связи many-to-many, которые EF Core хранит в промежуточных таблицах.

## 🧰 Технологии

| Слой | Технологии |
|---|---|
| Backend | ASP.NET Core 10, C# |
| ORM | Entity Framework Core 10 |
| Database | PostgreSQL 16, Npgsql |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| API | REST, JSON, Swagger / OpenAPI |
| Infrastructure | Docker, Docker Compose |
| Hosting | Render Web Service + Render PostgreSQL |

## 📁 Структура проекта

```text
RecipeFinder/
├── Controllers/
│   └── RecipesController.cs        # REST API
├── Data/
│   ├── AppDbContext.cs             # EF Core context
│   ├── DbSeeder.cs                 # Синхронизация каталога с БД
│   ├── RecipeCatalog.cs            # Начальный каталог рецептов
│   └── Migrations/                 # Миграции PostgreSQL
├── Models/
│   ├── Recipe.cs
│   ├── Product.cs
│   ├── User.cs
│   └── *Request.cs                 # DTO входящих запросов
├── wwwroot/
│   ├── index.html                  # Поиск и рекомендации
│   ├── products.html               # Каталог продуктов
│   ├── favorites.html              # Избранное пользователя
│   ├── authorization.html          # Вход и регистрация
│   ├── css/site.css
│   └── js/
│       ├── app.js
│       ├── auth.js
│       ├── authorization.js
│       ├── favorites.js
│       └── products.js
├── Dockerfile
├── docker-compose.yml
├── Program.cs
└── RecipeFinder.csproj
```

## 🔌 API

Базовый адрес: `/api/Recipes`

| Метод | Endpoint | Назначение |
|---|---|---|
| `GET` | `/api/Recipes?userId={id}` | Получить все рецепты |
| `GET` | `/api/Recipes/products` | Получить каталог продуктов |
| `GET` | `/api/Recipes/favorites?userId={id}` | Избранное пользователя |
| `POST` | `/api/Recipes/search` | Найти рецепты по ингредиентам |
| `POST` | `/api/Recipes/{id}/favorite` | Добавить или убрать рецепт из избранного |
| `POST` | `/api/Recipes/registration` | Зарегистрировать пользователя |
| `POST` | `/api/Recipes/authorization` | Выполнить вход |

<details>
<summary><b>Пример запроса поиска</b></summary>

```http
POST /api/Recipes/search
Content-Type: application/json

{
  "products": ["яйца", "молоко", "сыр"],
  "difficulty": "all",
  "userId": 1
}
```

В ответе для каждого рецепта возвращаются:

- `haveProducts` — найденные ингредиенты;
- `missingProducts` — недостающие ингредиенты;
- `matchCount` и `totalCount` — количество совпадений;
- `hasAllIngredients` — достаточно ли выбранных продуктов;
- `isFavorite` — находится ли рецепт в избранном пользователя.

</details>

<details>
<summary><b>Пример переключения избранного</b></summary>

```http
POST /api/Recipes/12/favorite
Content-Type: application/json

{
  "userId": 1
}
```

</details>

## 🚀 Быстрый запуск через Docker

### Требования

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Docker Compose

### Запуск

```bash
cp .env.example .env
docker compose up --build -d
```

После запуска:

- приложение: [http://localhost:8080](http://localhost:8080);
- PostgreSQL с хоста: `localhost:5433`;
- внутри Docker-сети база доступна как `db:5432`.

Проверить контейнеры:

```bash
docker compose ps
```

Остановить:

```bash
docker compose down
```

Удалить контейнеры вместе с данными БД:

```bash
docker compose down -v
```

## 💻 Запуск без Docker

### Требования

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- PostgreSQL

Укажи строку подключения через `appsettings.Development.json` или переменную окружения:

```text
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=recipe_finder;Username=postgres;Password=YOUR_PASSWORD
```

Запусти приложение:

```bash
dotnet restore
dotnet run --launch-profile RecipeFinder
```

Локальный адрес: [http://localhost:5080](http://localhost:5080).

При запуске приложение автоматически:

1. применяет EF Core migrations;
2. создаёт необходимые таблицы;
3. добавляет и обновляет каталог рецептов через `DbSeeder`.

## ☁️ Деплой на Render

Проект уже настроен для автоматического деплоя:

1. изменения отправляются в ветку `main`;
2. Render собирает образ по `Dockerfile`;
3. приложение запускается на порту `10000`;
4. строка подключения передаётся через `ConnectionStrings__DefaultConnection`;
5. после успешного запуска миграции применяются автоматически.

```bash
git add .
git commit -m "Describe your changes"
git push
```

Live-версия: **https://recipefinder-s9co.onrender.com**

## ⚠️ Важно для production

Текущая авторизация сделана в учебных целях. Перед реальным production-запуском необходимо:

- хранить пароли только в виде безопасного хеша (`PasswordHasher`, Argon2 или BCrypt);
- заменить передачу `userId` клиентом на cookie-сессию или JWT;
- добавить валидацию DTO и ограничение частоты запросов;
- не хранить секреты в Git — использовать переменные окружения;
- настроить HTTPS, резервные копии БД и ротацию credentials.

## 🛣️ Идеи для развития

- [ ] JWT или cookie-аутентификация
- [ ] Хеширование паролей
- [ ] Панель администратора для управления рецептами
- [ ] Загрузка собственных изображений
- [ ] Пагинация и полнотекстовый поиск
- [ ] Оценки и комментарии пользователей
- [ ] Автоматические тесты и CI

---

<div align="center">

Сделано на **ASP.NET Core**, **PostgreSQL** и **Vanilla JavaScript**

</div>
