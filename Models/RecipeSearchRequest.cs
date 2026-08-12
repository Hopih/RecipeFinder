namespace RecipeFinder.Models;


public class RecipeSearchRequest
{
    public List<string> Products { get; set; } = [];

    public string Difficulty { get; set; } = "all";

    public int? UserId { get; set; }
}
