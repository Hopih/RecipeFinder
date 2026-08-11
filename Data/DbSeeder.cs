using RecipeFinder.Models;

namespace RecipeFinder.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        if (!db.Recipes.Any())
        {
            SeedInitialData(db);
            return;
        }

        BackfillRecipes(db);
    }

    private static void SeedInitialData(AppDbContext db)
    {
        var eggs = new Product { Name = "яйца" };
        var milk = new Product { Name = "молоко" };
        var salt = new Product { Name = "соль" };
        var flour = new Product { Name = "мука" };
        var sugar = new Product { Name = "сахар" };
        var butter = new Product { Name = "масло" };
        var bread = new Product { Name = "хлеб" };
        var cheese = new Product { Name = "сыр" };

        db.Products.AddRange(eggs, milk, salt, flour, sugar, butter, bread, cheese);

        db.Recipes.AddRange(
            new Recipe
            {
                Name = "Омлет",
                Difficulty = "easy",
                ImageUrl = "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80",
                Instructions =
                    "1. Разбей 2–3 яйца в миску, добавь щепотку соли и 50 мл молока.\n" +
                    "2. Взбей венчиком до однородности.\n" +
                    "3. Разогрей сковороду на среднем огне, слегка смажь маслом.\n" +
                    "4. Вылей смесь, жарь 3–4 минуты под крышкой до готовности.\n" +
                    "5. Сложи пополам и подавай сразу.",
                Products = [eggs, milk, salt]
            },
            new Recipe
            {
                Name = "Блинчики",
                Difficulty = "hard",
                ImageUrl = "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1200&q=80",
                Instructions =
                    "1. Смешай 200 г муки, 2 яйца, 300 мл молока и 1 ст. л. сахара.\n" +
                    "2. Взбей тесто без комков, дай постоять 10 минут.\n" +
                    "3. Разогрей сковороду, смажь тонким слоем масла.\n" +
                    "4. Наливай тесто тонким слоем, жарь по 1–2 минуты с каждой стороны.\n" +
                    "5. Стопку блинов можно подавать с вареньем или сметаной.",
                Products = [flour, milk, eggs, sugar]
            },
            new Recipe
            {
                Name = "Гренки с сыром",
                Difficulty = "medium",
                ImageUrl = "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=1200&q=80",
                Instructions =
                    "1. Нарежь хлеб ломтями толщиной около 1.5 см.\n" +
                    "2. Разогрей сковороду с кусочком масла.\n" +
                    "3. Обжарь хлеб с двух сторон до золотистой корочки.\n" +
                    "4. Сразу положи сверху ломтик сыра, чтобы он начал таять.\n" +
                    "5. Накрой крышкой на 30–60 секунд и подавай горячими.",
                Products = [bread, butter, cheese]
            },
            new Recipe
            {
                Name = "Яичница",
                Difficulty = "easy",
                ImageUrl = "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80",
                Instructions =
                    "1. Разогрей сковороду на среднем огне.\n" +
                    "2. Аккуратно разбей 1–2 яйца, стараясь не повредить желток.\n" +
                    "3. Посоли по вкусу.\n" +
                    "4. Жарь 2–4 минуты: для жидкого желтка — меньше, для плотного — дольше.\n" +
                    "5. Подавай сразу, можно с хлебом.",
                Products = [eggs, salt]
            }
        );

        db.SaveChanges();
    }

    private static void BackfillRecipes(AppDbContext db)
    {
        var recipes = db.Recipes.ToList();
        var changed = false;

        foreach (var recipe in recipes)
        {
            var (imageUrl, instructions, difficulty) = recipe.Name switch
            {
                "Омлет" => (
                    "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1200&q=80",
                    "1. Разбей 2–3 яйца в миску, добавь щепотку соли и 50 мл молока.\n" +
                    "2. Взбей венчиком до однородности.\n" +
                    "3. Разогрей сковороду на среднем огне, слегка смажь маслом.\n" +
                    "4. Вылей смесь, жарь 3–4 минуты под крышкой до готовности.\n" +
                    "5. Сложи пополам и подавай сразу.",
                    "easy"
                ),
                "Блинчики" => (
                    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=1200&q=80",
                    "1. Смешай 200 г муки, 2 яйца, 300 мл молока и 1 ст. л. сахара.\n" +
                    "2. Взбей тесто без комков, дай постоять 10 минут.\n" +
                    "3. Разогрей сковороду, смажь тонким слоем масла.\n" +
                    "4. Наливай тесто тонким слоем, жарь по 1–2 минуты с каждой стороны.\n" +
                    "5. Стопку блинов можно подавать с вареньем или сметаной.",
                    "hard"
                ),
                "Гренки с сыром" => (
                    "https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=1200&q=80",
                    "1. Нарежь хлеб ломтями толщиной около 1.5 см.\n" +
                    "2. Разогрей сковороду с кусочком масла.\n" +
                    "3. Обжарь хлеб с двух сторон до золотистой корочки.\n" +
                    "4. Сразу положи сверху ломтик сыра, чтобы он начал таять.\n" +
                    "5. Накрой крышкой на 30–60 секунд и подавай горячими.",
                    "medium"
                ),
                "Яичница" => (
                    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80",
                    "1. Разогрей сковороду на среднем огне.\n" +
                    "2. Аккуратно разбей 1–2 яйца, стараясь не повредить желток.\n" +
                    "3. Посоли по вкусу.\n" +
                    "4. Жарь 2–4 минуты: для жидкого желтка — меньше, для плотного — дольше.\n" +
                    "5. Подавай сразу, можно с хлебом.",
                    "easy"
                ),
                _ => (recipe.ImageUrl, recipe.Instructions, recipe.Difficulty)
            };

            if (string.IsNullOrWhiteSpace(recipe.ImageUrl) || recipe.ImageUrl != imageUrl)
            {
                recipe.ImageUrl = imageUrl;
                changed = true;
            }

            if (recipe.Instructions != instructions)
            {
                recipe.Instructions = instructions;
                changed = true;
            }

            if (string.IsNullOrWhiteSpace(recipe.Difficulty) || recipe.Difficulty != difficulty)
            {
                recipe.Difficulty = difficulty;
                changed = true;
            }
        }

        if (changed)
        {
            db.SaveChanges();
        }
    }
}
