namespace RecipeFinder.Models;

public class Recipe
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Instructions { get; set; } = string.Empty;

    // Ссылка на фото блюда (показывается на фронте)
    public string ImageUrl { get; set; } = string.Empty;

    // easy | medium | hard
    public string Difficulty { get; set; } = "easy";

    // Избранное — хранится в БД
    public bool IsFavorite { get; set; }

    // Продукты, нужные для этого рецепта
    public List<Product> Products { get; set; } = [];
}
