using Microsoft.EntityFrameworkCore;
using FerreteriAPI.Data;
using FerreteriAPI.DTOs.Proveedores;
using FerreteriAPI.Models;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Services;

public class ProveedorService : IProveedorService
{
    private readonly AppDbContext _db;

    public ProveedorService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ProveedorResponse>> ObtenerTodosAsync()
    {
        return await _db.Proveedores
            .Where(p => p.EstaActivo)
            .OrderBy(p => p.Nombre)
            .Select(p => new ProveedorResponse(
                p.Id,
                p.Nombre,
                p.Ruc,
                p.Telefono,
                p.Direccion,
                p.Compras.Count(c => c.EstaActivo),
                p.EstaActivo,
                p.CreadoEn))
            .ToListAsync();
    }

    public async Task<ProveedorResponse> ObtenerPorIdAsync(int id)
    {
        var p = await _db.Proveedores
            .Include(p => p.Compras)
            .FirstOrDefaultAsync(p => p.Id == id && p.EstaActivo)
            ?? throw new KeyNotFoundException($"Proveedor {id} no encontrado.");

        return new ProveedorResponse(
            p.Id, p.Nombre, p.Ruc, p.Telefono, p.Direccion,
            p.Compras.Count(c => c.EstaActivo), p.EstaActivo, p.CreadoEn);
    }

    public async Task<ProveedorResponse> CrearAsync(CrearProveedorRequest request, int usuarioId)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            throw new InvalidOperationException("El nombre del proveedor es obligatorio.");

        var proveedor = new Proveedor
        {
            Nombre = request.Nombre.Trim(),
            Ruc = request.Ruc?.Trim(),
            Telefono = request.Telefono?.Trim(),
            Direccion = request.Direccion?.Trim(),
            CreadoPor = usuarioId,
            CreadoEn = DateTime.UtcNow,
            EstaActivo = true,
        };

        _db.Proveedores.Add(proveedor);
        await _db.SaveChangesAsync();

        return await ObtenerPorIdAsync(proveedor.Id);
    }

    public async Task<ProveedorResponse> ActualizarAsync(int id, ActualizarProveedorRequest request, int usuarioId)
    {
        var proveedor = await _db.Proveedores
            .FirstOrDefaultAsync(p => p.Id == id && p.EstaActivo)
            ?? throw new KeyNotFoundException($"Proveedor {id} no encontrado.");

        if (string.IsNullOrWhiteSpace(request.Nombre))
            throw new InvalidOperationException("El nombre del proveedor es obligatorio.");

        proveedor.Nombre = request.Nombre.Trim();
        proveedor.Ruc = request.Ruc?.Trim();
        proveedor.Telefono = request.Telefono?.Trim();
        proveedor.Direccion = request.Direccion?.Trim();
        proveedor.ModificadoPor = usuarioId;
        proveedor.ModificadoEn = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return await ObtenerPorIdAsync(proveedor.Id);
    }

    public async Task EliminarAsync(int id, int usuarioId)
    {
        var proveedor = await _db.Proveedores
            .FirstOrDefaultAsync(p => p.Id == id && p.EstaActivo)
            ?? throw new KeyNotFoundException($"Proveedor {id} no encontrado.");

        var tieneCompras = await _db.Compras.AnyAsync(c => c.ProveedorId == id && c.EstaActivo);
        if (tieneCompras)
            throw new InvalidOperationException(
                "No se puede eliminar un proveedor que tiene compras registradas.");

        proveedor.EstaActivo = false;
        proveedor.ModificadoPor = usuarioId;
        proveedor.ModificadoEn = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }
}