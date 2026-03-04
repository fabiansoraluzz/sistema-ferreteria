using Microsoft.EntityFrameworkCore;
using FerreteriAPI.Data;
using FerreteriAPI.DTOs.Categorias;
using FerreteriAPI.Models;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Services;

public class CategoriaService : ICategoriaService
{
    private readonly AppDbContext _db;

    public CategoriaService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<CategoriaResponse>> ObtenerTodasAsync()
    {
        return await _db.Categorias
            .Where(c => c.EstaActivo)
            .OrderBy(c => c.Nombre)
            .Select(c => ToResponse(c))
            .ToListAsync();
    }

    public async Task<CategoriaResponse> ObtenerPorIdAsync(int id)
    {
        var categoria = await _db.Categorias
            .FirstOrDefaultAsync(c => c.Id == id && c.EstaActivo)
            ?? throw new KeyNotFoundException($"Categoría {id} no encontrada.");

        return ToResponse(categoria);
    }

    public async Task<CategoriaResponse> CrearAsync(
        CrearCategoriaRequest request, int usuarioId)
    {
        // Verifica que no exista una categoría con el mismo nombre
        bool existe = await _db.Categorias
            .AnyAsync(c => c.Nombre == request.Nombre && c.EstaActivo);

        if (existe)
            throw new InvalidOperationException(
                $"Ya existe una categoría con el nombre '{request.Nombre}'.");

        var categoria = new Categoria
        {
            Nombre = request.Nombre.Trim(),
            Descripcion = request.Descripcion?.Trim(),
            CreadoPor = usuarioId,
            CreadoEn = DateTime.UtcNow,
            EstaActivo = true
        };

        _db.Categorias.Add(categoria);
        await _db.SaveChangesAsync();

        return ToResponse(categoria);
    }

    public async Task<CategoriaResponse> ActualizarAsync(
        int id, ActualizarCategoriaRequest request, int usuarioId)
    {
        var categoria = await _db.Categorias
            .FirstOrDefaultAsync(c => c.Id == id && c.EstaActivo)
            ?? throw new KeyNotFoundException($"Categoría {id} no encontrada.");

        // Verifica que no exista otra categoría con el mismo nombre
        bool nombreDuplicado = await _db.Categorias
            .AnyAsync(c => c.Nombre == request.Nombre
                        && c.Id != id
                        && c.EstaActivo);

        if (nombreDuplicado)
            throw new InvalidOperationException(
                $"Ya existe otra categoría con el nombre '{request.Nombre}'.");

        categoria.Nombre = request.Nombre.Trim();
        categoria.Descripcion = request.Descripcion?.Trim();
        categoria.ModificadoPor = usuarioId;
        categoria.ModificadoEn = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return ToResponse(categoria);
    }

    public async Task DesactivarAsync(int id, int usuarioId)
    {
        var categoria = await _db.Categorias
            .FirstOrDefaultAsync(c => c.Id == id && c.EstaActivo)
            ?? throw new KeyNotFoundException($"Categoría {id} no encontrada.");

        // Verifica que no tenga productos activos asociados
        bool tieneProductos = await _db.Productos
            .AnyAsync(p => p.CategoriaId == id && p.EstaActivo);

        if (tieneProductos)
            throw new InvalidOperationException(
                "No se puede desactivar una categoría que tiene productos activos.");

        categoria.EstaActivo = false;
        categoria.ModificadoPor = usuarioId;
        categoria.ModificadoEn = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    private static CategoriaResponse ToResponse(Categoria c) => new(
        c.Id, c.Nombre, c.Descripcion, c.EstaActivo, c.CreadoPor, c.CreadoEn);
}