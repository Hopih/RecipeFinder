using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RecipeFinder.Data.Migrations
{
    /// <inheritdoc />
    public partial class UserFavorites : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsFavorite",
                table: "Recipes");

            migrationBuilder.CreateTable(
                name: "RecipeUser",
                columns: table => new
                {
                    FavoritesId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RecipeUser", x => new { x.FavoritesId, x.UserId });
                    table.ForeignKey(
                        name: "FK_RecipeUser_Recipes_FavoritesId",
                        column: x => x.FavoritesId,
                        principalTable: "Recipes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RecipeUser_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RecipeUser_UserId",
                table: "RecipeUser",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RecipeUser");

            migrationBuilder.AddColumn<bool>(
                name: "IsFavorite",
                table: "Recipes",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
