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
    public async Task<IActionResult> GetAll([FromQuery] int? userId)
    {
        var recipes = await _db.Recipes
            .Include(recipe => recipe.Products)
            .ToListAsync();

        var favoriteIds = await GetFavoriteIdsAsync(userId);

        return Ok(recipes.Select(recipe => MapRecipe(recipe, favoriteIds.Contains(recipe.Id))));
    }

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts()
    {
        var products = await _db.Products
            .Include(product => product.Recipes)
            .OrderBy(product => product.Name)
            .ToListAsync();

        return Ok(products.Select(MapProduct));
    }

    [HttpGet("favorites")]
    public async Task<IActionResult> GetFavorites([FromQuery] int userId)
    {
        if (userId <= 0)
        {
            return BadRequest("Передай userId, например: /api/Recipes/favorites?userId=1");
        }

        var user = await _db.Users
            .Include(u => u.Favorites)
            .ThenInclude(recipe => recipe.Products)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
        {
            return NotFound($"Пользователь {userId} не найден");
        }

        return Ok(user.Favorites.Select(recipe => MapRecipe(recipe, true)));
    }

    [HttpGet("recipes")]
    public async Task<IActionResult> GetRecipes()
    {
        var recipes = await _db.Recipes
            .Include(recipe => recipe.Products)
            .OrderBy(recipe => recipe.Name)
            .ToListAsync();
            
        return Ok(recipes.Select(recipe => MapRecipe(recipe, false)));
    }

    [HttpPost("{id:int}/favorite")]
    public async Task<IActionResult> ToggleFavorite(int id, [FromBody] FavoriteRequest? request)
    {
        if (request is null || request.UserId <= 0)
        {
            return BadRequest("Передай userId в теле запроса: { \"userId\": 1 }");
        }

        var user = await _db.Users
            .Include(u => u.Favorites)
            .FirstOrDefaultAsync(u => u.Id == request.UserId);

        if (user is null)
        {
            return NotFound($"Пользователь {request.UserId} не найден");
        }

        var recipe = await _db.Recipes.FindAsync(id);
        if (recipe is null)
        {
            return NotFound($"Рецепт {id} не найден");
        }

        var existing = user.Favorites.FirstOrDefault(item => item.Id == id);
        bool isFavorite;

        if (existing is not null)
        {
            user.Favorites.Remove(existing);
            isFavorite = false;
        }
        else
        {
            user.Favorites.Add(recipe);
            isFavorite = true;
        }

        await _db.SaveChangesAsync();

        return Ok(new { recipe.Id, IsFavorite = isFavorite });
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
        var favoriteIds = await GetFavoriteIdsAsync(request.UserId);

        var recipes = await _db.Recipes
            .Include(recipe => recipe.Products)
            .ToListAsync();

        var matched = recipes
            .Where(recipe =>
                (string.Equals(recipe.Difficulty, difficulty, StringComparison.OrdinalIgnoreCase) || difficulty == "all") &&
                recipe.Products.Any(product => normalized.Contains(product.Name.ToLower())))
            .Select(recipe => MapSearchRecipe(recipe, normalized, favoriteIds.Contains(recipe.Id)))
            .OrderByDescending(recipe => recipe.HasAllIngredients)
            .ThenByDescending(recipe => recipe.MatchCount)
            .ThenBy(recipe => recipe.TotalCount - recipe.MatchCount)
            .ToList();

        return Ok(matched);
    }

    [HttpPost("authorization")]
    public async Task<IActionResult> Authorization([FromBody] AuthorizationRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(user =>
            user.Email == request.Email && user.Password == request.Password);

        if (user is null)
        {
            return Unauthorized("Неверный email или пароль");
        }

        return Ok(MapUser(user));
    }

    [HttpPost("registration")]
    public async Task<IActionResult> Registration([FromBody] RegistrationRequest request)
    {
        var exists = await _db.Users.AnyAsync(user => user.Email == request.Email);
        if (exists)
        {
            return BadRequest("Пользователь с таким email уже существует");
        }

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            Password = request.Password
        };

        await _db.Users.AddAsync(user);
        await _db.SaveChangesAsync();

        return Ok(MapUser(user));
    }

    private async Task<HashSet<int>> GetFavoriteIdsAsync(int? userId)
    {
        if (userId is null or <= 0)
        {
            return [];
        }

        var user = await _db.Users
            .Include(u => u.Favorites)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
        {
            return [];
        }

        return user.Favorites.Select(recipe => recipe.Id).ToHashSet();
    }

    private static object MapUser(User user) => new
    {
        user.Id,
        user.Name,
        user.Email,
        user.IsAdmin
    };

    private static object MapRecipe(Recipe recipe, bool isFavorite) => new
    {
        recipe.Id,
        recipe.Name,
        recipe.Instructions,
        recipe.ImageUrl,
        recipe.Difficulty,
        IsFavorite = isFavorite,
        Products = recipe.Products.Select(product => product.Name).ToList()
    };

    private static object MapProduct(Product product) => new
    {
        product.Id,
        product.Name,
        RecipesCount = product.Recipes.Count
    };

    private static SearchRecipeDto MapSearchRecipe(Recipe recipe, HashSet<string> normalized, bool isFavorite)
    {
        var products = recipe.Products.Select(product => product.Name).ToList();
        var have = products.Where(name => normalized.Contains(name.ToLower())).ToList();
        var missing = products.Where(name => !normalized.Contains(name.ToLower())).ToList();

        return new SearchRecipeDto(
            recipe.Id,
            recipe.Name,
            recipe.Instructions,
            recipe.ImageUrl,
            recipe.Difficulty,
            isFavorite,
            products,
            have,
            missing,
            have.Count,
            products.Count,
            missing.Count == 0
        );
    }

    private sealed record SearchRecipeDto(
        int Id,
        string Name,
        string Instructions,
        string ImageUrl,
        string Difficulty,
        bool IsFavorite,
        List<string> Products,
        List<string> HaveProducts,
        List<string> MissingProducts,
        int MatchCount,
        int TotalCount,
        bool HasAllIngredients
    );
}
