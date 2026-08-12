using Microsoft.EntityFrameworkCore;
using RecipeFinder.Models;

namespace RecipeFinder.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Product> Products => Set<Product>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // У одного пользователя — много избранных рецептов.
        // EF создаст join-таблицу UserFavorites (UserId + RecipeId).
        modelBuilder.Entity<User>()
            .HasMany(user => user.Favorites)
            .WithMany();
    }
}
