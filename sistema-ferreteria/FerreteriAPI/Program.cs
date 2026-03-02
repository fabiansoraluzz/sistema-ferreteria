using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FerreteriAPI.Data;
using FerreteriAPI.Helpers;
using FerreteriAPI.Middleware;

var builder = WebApplication.CreateBuilder(args);

// ── 1. HttpContextAccessor e Interceptor de Auditoría ─────────────────────────
builder.Services.AddHttpContextAccessor();
builder.Services.AddSingleton<AuditoriaInterceptor>();

// ── 2. Base de datos PostgreSQL (Supabase) ────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
{
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("PostgreSQL"),
        o => o.CommandTimeout(30)
    )
    .AddInterceptors(sp.GetRequiredService<AuditoriaInterceptor>());
});

// ── 3. Autenticación JWT ──────────────────────────────────────────────────────
var claveJwt = builder.Configuration["Jwt:Clave"]
    ?? throw new InvalidOperationException("Jwt:Clave no está configurado.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Emisor"],
            ValidAudience = builder.Configuration["Jwt:Audiencia"],
            IssuerSigningKey = new SymmetricSecurityKey(
                                           Encoding.UTF8.GetBytes(claveJwt))
        };
    });

builder.Services.AddAuthorization();

// ── 4. Helpers ────────────────────────────────────────────────────────────────
builder.Services.AddScoped<JwtHelper>();

// ── 5. CORS ───────────────────────────────────────────────────────────────────
var origenes = builder.Configuration["Cors:OrigenesPermitidos"]
    ?.Split(",", StringSplitOptions.RemoveEmptyEntries)
    ?? ["http://localhost:3000"];

builder.Services.AddCors(opt =>
    opt.AddPolicy("PoliticaPrincipal", p =>
        p.WithOrigins(origenes)
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()));

// ── 6. Controladores ──────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);

// ─────────────────────────────────────────────────────────────────────────────
var app = builder.Build();

app.UseMiddleware<ManejoErroresMiddleware>();
app.UseCors("PoliticaPrincipal");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Migración automática solo en desarrollo
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    scope.ServiceProvider
         .GetRequiredService<AppDbContext>()
         .Database.Migrate();
}

app.Run();