namespace RecipeFinder.Models;

// Тело запроса поиска с фронта
public class RecipeSearchRequest
{
    public List<string> Products { get; set; } = [];

    public string Difficulty { get; set; } = "easy";
}
