namespace RecipeFinder.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";

    // Stored and compared as plain text for now — acceptable for a learning project,
    // but must be hashed (e.g. via ASP.NET Core's PasswordHasher) before production use.
    public string Password { get; set; } = "";
    public bool IsAdmin { get; set; }
    public List<Recipe> Favorites { get; set; } = [];
}
