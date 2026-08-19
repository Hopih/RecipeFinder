using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeFinder.Controllers;
using RecipeFinder.Data;
using RecipeFinder.Models;
using System.Text.Json;

namespace RecipeFinder.Tests;

public class RecipesControllerTests
{
    // Каждый тест — своя in-memory БД (имя уникальное), без PostgreSQL.
    private static AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private static async Task SeedAsync(AppDbContext db)
    {
        db.Recipes.AddRange(
            new Recipe
            {
                Name = "Паста",
                Instructions = "Сварить пасту",
                Difficulty = "easy",
                ImageUrl = "https://example.com/pasta.jpg",
                Products = [new Product { Name = "макароны" }, new Product { Name = "сыр" }]
            },
            new Recipe
            {
                Name = "Суп",
                Instructions = "Сварить суп",
                Difficulty = "medium",
                ImageUrl = "https://example.com/soup.jpg",
                Products = [new Product { Name = "картофель" }]
            }
        );

        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task GetAll_ReturnsRecipesFromDb()
    {
        await using var db = CreateDb();
        await SeedAsync(db);
        var controller = new RecipesController(db);

        var result = await controller.GetAll(userId: null);

        var ok = Assert.IsType<OkObjectResult>(result);
        var recipes = DeserializeRecipes(ok.Value);

        Assert.Equal(2, recipes.Count);
        Assert.Contains(recipes, r => r.Name == "Паста");
        Assert.Contains(recipes, r => r.Name == "Суп");
    }

    [Fact]
    public async Task GetAll_WithUserId_MarksFavorites()
    {
        await using var db = CreateDb();
        await SeedAsync(db);

        var pasta = await db.Recipes.FirstAsync(r => r.Name == "Паста");
        var user = new User
        {
            Name = "Тест",
            Email = "test@example.com",
            Password = "123456",
            Favorites = [pasta]
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var controller = new RecipesController(db);

        var result = await controller.GetAll(userId: user.Id);

        var ok = Assert.IsType<OkObjectResult>(result);
        var recipes = DeserializeRecipes(ok.Value);

        Assert.True(recipes.Single(r => r.Name == "Паста").IsFavorite);
        Assert.False(recipes.Single(r => r.Name == "Суп").IsFavorite);
    }

    [Fact]
    public async Task GetRecipes_ReturnsSortedByName()
    {
        await using var db = CreateDb();
        await SeedAsync(db);
        var controller = new RecipesController(db);

        var result = await controller.GetRecipes();

        var ok = Assert.IsType<OkObjectResult>(result);
        var recipes = DeserializeRecipes(ok.Value);

        Assert.Equal(["Паста", "Суп"], recipes.Select(r => r.Name).ToList());
    }

    private static List<RecipeResponse> DeserializeRecipes(object? value)
    {
        var json = JsonSerializer.Serialize(value);
        return JsonSerializer.Deserialize<List<RecipeResponse>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }) ?? [];
    }

    private sealed class RecipeResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Instructions { get; set; } = "";
        public string Difficulty { get; set; } = "";
        public bool IsFavorite { get; set; }
        public List<string> Products { get; set; } = [];
    }
}
