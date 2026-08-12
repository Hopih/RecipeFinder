using Microsoft.EntityFrameworkCore;
using RecipeFinder.Models;

namespace RecipeFinder.Data;

public static class DbSeeder
{
    // Старые названия рецептов в базе -> исправленные названия из каталога.
    private static readonly Dictionary<string, string> LegacyNames = new()
    {
        ["фrittata с овощами"] = "Фриттата с овощами",
        ["фrittata с сыром"] = "Фриттата с сыром",
        ["frittata с овощами"] = "Фриттата с овощами",
        ["frittata с сыром"] = "Фриттата с сыром",
        ["гуacamole тост"] = "Гуакамоле тост",
        ["guacamole тост"] = "Гуакамоле тост"
    };

    public static void Seed(AppDbContext db)
    {
        FixLegacyNames(db);
        EnsureCatalog(db);
        BackfillFromCatalog(db);
    }

    private static void FixLegacyNames(AppDbContext db)
    {
        var recipes = db.Recipes.ToList();
        var existingNames = recipes.Select(recipe => recipe.Name.ToLower()).ToHashSet();
        var changed = false;

        foreach (var recipe in recipes)
        {
            if (!LegacyNames.TryGetValue(recipe.Name.ToLower(), out var newName))
            {
                continue;
            }

            // Не переименовываем, если рецепт с новым именем уже есть в базе.
            if (existingNames.Contains(newName.ToLower()))
            {
                continue;
            }

            recipe.Name = newName;
            existingNames.Add(newName.ToLower());
            changed = true;
        }

        if (changed)
        {
            db.SaveChanges();
        }
    }

    private static void EnsureCatalog(AppDbContext db)
    {
        var existingProducts = db.Products
            .AsNoTracking()
            .Select(product => product.Name.ToLower())
            .ToHashSet();

        foreach (var productName in RecipeCatalog.Products)
        {
            if (existingProducts.Contains(productName.ToLower()))
            {
                continue;
            }

            db.Products.Add(new Product { Name = productName });
            existingProducts.Add(productName.ToLower());
        }

        db.SaveChanges();

        var productsByName = db.Products
            .ToDictionary(product => product.Name.ToLower(), product => product);

        var existingRecipes = db.Recipes
            .AsNoTracking()
            .Select(recipe => recipe.Name.ToLower())
            .ToHashSet();

        foreach (var seed in RecipeCatalog.Recipes)
        {
            if (existingRecipes.Contains(seed.Name.ToLower()))
            {
                continue;
            }

            var recipeProducts = seed.ProductNames
                .Select(name => productsByName[name.ToLower()])
                .ToList();

            db.Recipes.Add(new Recipe
            {
                Name = seed.Name,
                Difficulty = seed.Difficulty,
                ImageUrl = seed.ImageUrl,
                Instructions = seed.Instructions,
                Products = recipeProducts
            });

            existingRecipes.Add(seed.Name.ToLower());
        }

        db.SaveChanges();
    }

    private static void BackfillFromCatalog(AppDbContext db)
    {
        var catalogByName = RecipeCatalog.Recipes
            .ToDictionary(recipe => recipe.Name.ToLower(), recipe => recipe);

        var recipes = db.Recipes.ToList();
        var changed = false;

        foreach (var recipe in recipes)
        {
            if (!catalogByName.TryGetValue(recipe.Name.ToLower(), out var seed))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(recipe.ImageUrl) || recipe.ImageUrl != seed.ImageUrl)
            {
                recipe.ImageUrl = seed.ImageUrl;
                changed = true;
            }

            if (recipe.Instructions != seed.Instructions)
            {
                recipe.Instructions = seed.Instructions;
                changed = true;
            }

            if (string.IsNullOrWhiteSpace(recipe.Difficulty) || recipe.Difficulty != seed.Difficulty)
            {
                recipe.Difficulty = seed.Difficulty;
                changed = true;
            }
        }

        if (changed)
        {
            db.SaveChanges();
        }
    }
}
