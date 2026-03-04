using FerreteriAPI.Data;
using FerreteriAPI.Helpers;
using FerreteriAPI.Middleware;
using FerreteriAPI.Services;
using FerreteriAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Puerto dinámico para Railway
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// ── 1. HttpContextAccessor e Interceptor de Auditoría ────────────────────────
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

// ── 5. Servicios ──────────────────────────────────────────────────────────────
builder.Services.AddScoped<ICategoriaService, CategoriaService>();
builder.Services.AddScoped<IProductoService, ProductoService>();
builder.Services.AddScoped<IClienteService, ClienteService>();
builder.Services.AddScoped<IPedidoService, PedidoService>();
builder.Services.AddScoped<IPagoService, PagoService>();
builder.Services.AddScoped<IDespachoService, DespachoService>();
builder.Services.AddScoped<IAuditoriaService, AuditoriaService>();

// ── 6. CORS ───────────────────────────────────────────────────────────────────
var origenes = builder.Configuration["Cors:OrigenesPermitidos"]
    ?.Split(",", StringSplitOptions.RemoveEmptyEntries)
    ?? ["http://localhost:3000"];

builder.Services.AddCors(opt =>
    opt.AddPolicy("PoliticaPrincipal", p =>
        p.WithOrigins(origenes)
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials()));

// ── 7. Controladores ──────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);

// ── 8. Swagger ────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Ferretería API",
        Version = "v1",
        Description = "API del Sistema de Gestión para Distribuidora Ferretera"
    });

    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Ingresa tu token JWT. Ejemplo: eyJhbGci..."
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Ferretería API v1");
    options.RoutePrefix = string.Empty;
});

// ── Middleware y pipeline ─────────────────────────────────────────────────────
app.UseMiddleware<ManejoErroresMiddleware>();
app.UseCors("PoliticaPrincipal");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ── Migración automática solo en desarrollo ───────────────────────────────────
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    scope.ServiceProvider
         .GetRequiredService<AppDbContext>()
         .Database.Migrate();
}

app.Run();