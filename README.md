# RecipeFinder

> Введи продукты из холодильника — найди, что можно приготовить.

Веб-приложение на **ASP.NET Core** + **PostgreSQL**: поиск рецептов по ингредиентам, фильтр сложности, избранное в БД и каталог продуктов.

---

## Схема проекта

```mermaid
flowchart TB
  subgraph Client["Браузер"]
    Index["index.html<br/>поиск + рекомендации"]
    Products["products.html<br/>каталог продуктов"]
    Favorites["favorites.html<br/>избранное"]
    JS["app.js / products.js / favorites.js"]
  end

  subgraph Server["ASP.NET Core"]
    Static["Static Files<br/>wwwroot"]
    API["RecipesController<br/>/api/Recipes"]
    EF["AppDbContext<br/>Entity Framework"]
    Seeder["DbSeeder"]
  end

  subgraph DB["PostgreSQL"]
    Recipes[(Recipes)]
    ProductsTable[(Products)]
    Join[(Recipe ↔ Product)]
  end

  Index --> JS
  Products --> JS
  Favorites --> JS
  JS -->|"fetch JSON"| API
  Index -.-> Static
  Products -.-> Static
  Favorites -.-> Static
  API --> EF
  Seeder --> EF
  EF --> Recipes
  EF --> ProductsTable
  EF --> Join
```

---

## Как работает поиск

```mermaid
sequenceDiagram
  participant U as Пользователь
  participant F as Frontend
  participant C as RecipesController
  participant DB as PostgreSQL

  U->>F: Добавляет продукты + фильтры
  F->>C: POST /api/Recipes/search
  C->>DB: Recipes + Products
  DB-->>C: Список рецептов
  C-->>F: Совпадения + missingProducts
  F-->>U: Карточки и детали рецепта
```

---

## Модель данных

```mermaid
erDiagram
  Recipe ||--o{ RecipeProduct : содержит
  Product ||--o{ RecipeProduct : входит_в

  Recipe {
    int Id
    string Name
    string Instructions
    string ImageUrl
    string Difficulty
    bool IsFavorite
  }

  Product {
    int Id
    string Name
  }
```

| Сущность | Поля |
|----------|------|
| **Recipe** | название, шаги, картинка, сложность (`easy` / `medium` / `hard`), избранное |
| **Product** | название ингредиента |
| Связь | many-to-many: рецепт ↔ продукты |

---

## Структура папок

```text
RecipeFinder/
├── Controllers/
│   └── RecipesController.cs     # API
├── Models/
│   ├── Recipe.cs
│   ├── Product.cs
│   └── RecipeSearchRequest.cs
├── Data/
│   ├── AppDbContext.cs
│   ├── DbSeeder.cs
│   └── Migrations/
├── wwwroot/
│   ├── index.html               # Главная
│   ├── products.html            # Продукты
│   ├── favorites.html           # Избранное
│   ├── css/site.css
│   └── js/
│       ├── app.js
│       ├── products.js
│       └── favorites.js
├── Program.cs
└── README.md
```

---

## API

| Метод | URL | Описание |
|-------|-----|----------|
| `GET` | `/api/Recipes` | Все рецепты |
| `GET` | `/api/Recipes/products` | Все продукты |
| `GET` | `/api/Recipes/favorites` | Избранные рецепты |
| `POST` | `/api/Recipes/{id}/favorite` | Вкл / выкл избранное |
| `POST` | `/api/Recipes/search` | Поиск по продуктам + сложность |

Пример поиска:

```http
POST /api/Recipes/search
Content-Type: application/json

{
  "products": ["яйца", "молоко", "соль"],
  "difficulty": "all"
}
```

Ответ содержит `haveProducts`, `missingProducts`, `hasAllIngredients` и `matchCount`.

---

## Страницы

| Страница | Что умеет |
|----------|-----------|
| `/` | Поиск, теги, фильтры, рекомендации, детали рецепта |
| `/products.html` | Каталог всех продуктов из БД |
| `/favorites.html` | Рецепты с `IsFavorite = true` |
| `/swagger` | Документация API (в Development) |

---

## Запуск

### Требования

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- PostgreSQL

### Строка подключения

В `appsettings.Development.json` (или `appsettings.json`):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=recipe_finder;Username=postgres;Password=YOUR_PASSWORD"
  }
}
```

### Команды

```bash
dotnet ef database update
dotnet run --launch-profile RecipeFinder
```

Открой: **http://localhost:5080/**

При старте приложение само применяет миграции и заполняет тестовые рецепты через `DbSeeder`.

---

## Стек

![.NET](https://img.shields.io/badge/.NET-10-512BD4?style=flat-square&logo=dotnet)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-EF_Core-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?style=flat-square&logo=swagger&logoColor=black)

- **Backend:** ASP.NET Core Web API  
- **ORM:** Entity Framework Core + Npgsql  
- **Frontend:** HTML / CSS / Vanilla JS (`wwwroot`)  
- **API docs:** Swashbuckle (Swagger)

---

## Возможности

- Частичный матч продуктов: показываем, чего не хватает  
- Фильтр по сложности и доп. фильтры на фронте  
- Избранное хранится в PostgreSQL  
- Каталог продуктов с переходом в поиск  
- Тёмная / светлая тема
