namespace RecipeFinder.Models;

public class Product
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    // Рецепты, где используется этот продукт
    public List<Recipe> Recipes { get; set; } = [];
}
