using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeFinder.Data;
using RecipeFinder.Models;

namespace RecipeFinder.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecipesController : ControllerBase
{
    private readonly AppDbContext _db;

    public RecipesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var recipes = await _db.Recipes
            .Include(recipe => recipe.Products)
            .ToListAsync();

        return Ok(recipes.Select(MapRecipe));
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts()
    {
        var products = await _db.Products
            .OrderBy(product => product.Name)
            .Select(product => product.Name)
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("favorites")]
    public async Task<IActionResult> GetFavorites()
    {
        var favorites = await _db.Recipes
            .Include(recipe => recipe.Products)
            .Where(recipe => recipe.IsFavorite)
            .ToListAsync();

        return Ok(favorites.Select(MapRecipe));
    }

    // Переключает избранное: true ↔ false
    [HttpPost("{id:int}/favorite")]
    public async Task<IActionResult> ToggleFavorite(int id)
    {
        var recipe = await _db.Recipes.FindAsync(id);
        if (recipe is null)
        {
            return NotFound($"Рецепт {id} не найден");
        }

        recipe.IsFavorite = !recipe.IsFavorite;
        await _db.SaveChangesAsync();

        return Ok(new { recipe.Id, recipe.IsFavorite });
    }

    [HttpPost("search")]
    public async Task<IActionResult> SearchByProducts([FromBody] RecipeSearchRequest request)
    {
        if (request.Products is null || request.Products.Count == 0)
        {
            return BadRequest("Передай список продуктов, например: { \"products\": [\"яйца\", \"молоко\"], \"difficulty\": \"easy\" }");
        }

        var normalized = request.Products
            .Select(product => product.Trim().ToLower())
            .Where(product => product.Length > 0)
            .ToHashSet();

        var difficulty = (request.Difficulty ?? "all").Trim().ToLower();

        var recipes = await _db.Recipes
            .Include(recipe => recipe.Products)
            .ToListAsync();

        // Частичное совпадение: хотя бы 1 общий продукт + фильтр сложности
        var matched = recipes
            .Where(recipe =>
                (string.Equals(recipe.Difficulty, difficulty, StringComparison.OrdinalIgnoreCase) || difficulty == "all") &&
                recipe.Products.Any(product => normalized.Contains(product.Name.ToLower())))
            .Select(recipe =>
            {
                var products = recipe.Products.Select(product => product.Name).ToList();
                var have = products.Where(name => normalized.Contains(name.ToLower())).ToList();
                var missing = products.Where(name => !normalized.Contains(name.ToLower())).ToList();
                var hasAll = missing.Count == 0;

                return new
                {
                    recipe.Id,
                    recipe.Name,
                    recipe.Instructions,
                    recipe.ImageUrl,
                    recipe.Difficulty,
                    recipe.IsFavorite,
                    Products = products,
                    HaveProducts = have,
                    MissingProducts = missing,
                    MatchCount = have.Count,
                    TotalCount = products.Count,
                    HasAllIngredients = hasAll
                };
            })
            .OrderByDescending(recipe => recipe.HasAllIngredients)
            .ThenByDescending(recipe => recipe.MatchCount)
            .ThenBy(recipe => recipe.TotalCount - recipe.MatchCount)
            .ToList();

        return Ok(matched);
    }

    private static object MapRecipe(Recipe recipe) => new
    {
        recipe.Id,
        recipe.Name,
        recipe.Instructions,
        recipe.ImageUrl,
        recipe.Difficulty,
        recipe.IsFavorite,
        Products = recipe.Products.Select(product => product.Name).ToList()
    };
}
