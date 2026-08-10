namespace RecipeFinder.Models;

public class Recipe
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Instructions { get; set; } = string.Empty;

    // Продукты, нужные для этого рецепта
    public List<Product> Products { get; set; } = [];
}
