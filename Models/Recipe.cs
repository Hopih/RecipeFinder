namespace RecipeFinder.Models;

public class Recipe
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Instructions { get; set; } = string.Empty;

    public string ImageUrl { get; set; } = string.Empty;

    public string Difficulty { get; set; } = "all";

    public List<Product> Products { get; set; } = [];
}
