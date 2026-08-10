using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RecipeFinder.Data;

namespace RecipeFinder.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RecipesController : ControllerBase
{
    private readonly AppDbContext _db;

    // ASP.NET сам передаст AppDbContext (тот, что мы зарегистрировали в Program.cs)
    public RecipesController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/recipes — все рецепты
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var recipes = await _db.Recipes
            .Include(r => r.Products)
            .Select(r => new
            {
                r.Id,
                r.Name,
                r.Instructions,
                Products = r.Products.Select(p => p.Name).ToList()
            })
            .ToListAsync();

        return Ok(recipes);
    }

    // POST /api/recipes/search
    // Тело запроса: [ "яйца", "молоко", "мука" ]
    [HttpPost("search")]
    public async Task<IActionResult> SearchByProducts([FromBody] List<string> availableProducts)
    {
        if (availableProducts is null || availableProducts.Count == 0)
        {
            return BadRequest("Передай список продуктов, например: [\"яйца\", \"молоко\"]");
        }

        // Сравниваем без учёта регистра и лишних пробелов
        var normalized = availableProducts
            .Select(p => p.Trim().ToLower())
            .Where(p => p.Length > 0)
            .ToHashSet();

        var recipes = await _db.Recipes
            .Include(r => r.Products)
            .ToListAsync();

        // Рецепт подходит, если ВСЕ его продукты есть у пользователя
        var matched = recipes
            .Where(r => r.Products.All(p => normalized.Contains(p.Name.ToLower())))
            .Select(r => new
            {
                r.Id,
                r.Name,
                r.Instructions,
                Products = r.Products.Select(p => p.Name).ToList()
            })
            .ToList();

        return Ok(matched);
    }
}
