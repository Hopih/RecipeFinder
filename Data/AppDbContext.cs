using Microsoft.EntityFrameworkCore;
using RecipeFinder.Models;

namespace RecipeFinder.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    // Таблицы в базе данных
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Recipe> Recipes => Set<Recipe>();
}
