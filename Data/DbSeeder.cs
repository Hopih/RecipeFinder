using RecipeFinder.Models;

namespace RecipeFinder.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext db)
    {
        // Если рецепты уже есть — ничего не делаем (чтобы не дублировать при каждом запуске)
        if (db.Recipes.Any())
        {
            return;
        }

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
                Instructions = "Взбить яйца с молоком и солью, пожарить на сковороде.",
                Products = [eggs, milk, salt]
            },
            new Recipe
            {
                Name = "Блинчики",
                Instructions = "Смешать муку, молоко, яйца и сахар. Жарить тонкие блины.",
                Products = [flour, milk, eggs, sugar]
            },
            new Recipe
            {
                Name = "Гренки с сыром",
                Instructions = "Хлеб обжарить с маслом, сверху положить сыр.",
                Products = [bread, butter, cheese]
            },
            new Recipe
            {
                Name = "Яичница",
                Instructions = "Разбить яйца на сковороду, посолить, пожарить.",
                Products = [eggs, salt]
            }
        );

        db.SaveChanges();
    }
}
