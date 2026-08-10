using Microsoft.EntityFrameworkCore;
using RecipeFinder.Data;

var builder = WebApplication.CreateBuilder(args);

// Подключаем PostgreSQL через AppDbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Подключаем контроллеры — классы, которые принимают HTTP-запросы
builder.Services.AddControllers();

// Swagger: страница в браузере для ручного тестирования API
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// При старте заполняем БД тестовыми данными (если пусто)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    DbSeeder.Seed(db);
}

// Раздаём фронтенд из папки wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

// В режиме разработки включаем Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapControllers();

app.Run();
