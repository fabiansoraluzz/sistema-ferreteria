using Microsoft.EntityFrameworkCore;
using FerreteriAPI.Data;
using FerreteriAPI.DTOs.Productos;
using FerreteriAPI.Models;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Services;

public class ProductoService : IProductoService
{
    private readonly AppDbContext _db;

    public ProductoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ProductoResponse>> ObtenerTodosAsync(string? busqueda)
    {
        var query = _db.Productos
            .Include(p => p.Categoria)
            .Where(p => p.EstaActivo);

        if (!string.IsNullOrWhiteSpace(busqueda))
            query = query.Where(p =>
                p.Nombre.ToLower().Contains(busqueda.ToLower()));

        return await query
            .OrderBy(p => p.Nombre)
            .Select(p => ToResponse(p))
            .ToListAsync();
    }

    public async Task<List<ProductoResumenResponse>> ObtenerAlertasStockAsync()
    {
        return await _db.Productos
            .Where(p => p.EstaActivo && p.StockActual <= p.StockMinimo)
            .OrderBy(p => p.StockActual)
            .Select(p => new ProductoResumenResponse(
                p.Id, p.Nombre, p.UnidadMedida,
                p.StockActual, p.StockMinimo, true))
            .ToListAsync();
    }

    public async Task<ProductoResponse> ObtenerPorIdAsync(int id)
    {
        var producto = await _db.Productos
            .Include(p => p.Categoria)
            .FirstOrDefaultAsync(p => p.Id == id && p.EstaActivo)
            ?? throw new KeyNotFoundException($"Producto {id} no encontrado.");

        return ToResponse(producto);
    }

    public async Task<ProductoResponse> CrearAsync(
        CrearProductoRequest request, int usuarioId)
    {
        bool categoriaExiste = await _db.Categorias
            .AnyAsync(c => c.Id == request.CategoriaId && c.EstaActivo);

        if (!categoriaExiste)
            throw new InvalidOperationException("La categoría seleccionada no existe.");

        var producto = new Producto
        {
            Nombre = request.Nombre.Trim(),
            Descripcion = request.Descripcion?.Trim(),
            CategoriaId = request.CategoriaId,
            UnidadMedida = request.UnidadMedida.Trim(),
            StockActual = request.StockInicial,
            StockMinimo = request.StockMinimo,
            PrecioCompra = request.PrecioCompra,
            PrecioVenta = request.PrecioVenta,
            CreadoPor = usuarioId,
            CreadoEn = DateTime.UtcNow,
            EstaActivo = true
        };

        _db.Productos.Add(producto);
        await _db.SaveChangesAsync(); // ← Primero guarda para obtener el Id

        // Ahora que el producto tiene Id registramos el movimiento
        if (request.StockInicial > 0)
        {
            _db.MovimientosStock.Add(new MovimientoStock
            {
                ProductoId = producto.Id, // ← Ahora sí tiene Id real
                TipoMovimiento = "Entrada",
                Cantidad = request.StockInicial,
                StockAnterior = 0,
                StockResultante = request.StockInicial,
                Motivo = "Stock inicial al crear producto",
                CreadoPor = usuarioId,
                CreadoEn = DateTime.UtcNow,
                EstaActivo = true
            });

            await _db.SaveChangesAsync(); // ← Guarda el movimiento
        }

        await _db.Entry(producto).Reference(p => p.Categoria).LoadAsync();
        return ToResponse(producto);
    }

    public async Task<ProductoResponse> ActualizarAsync(
        int id, ActualizarProductoRequest request, int usuarioId)
    {
        var producto = await _db.Productos
            .Include(p => p.Categoria)
            .FirstOrDefaultAsync(p => p.Id == id && p.EstaActivo)
            ?? throw new KeyNotFoundException($"Producto {id} no encontrado.");

        bool categoriaExiste = await _db.Categorias
            .AnyAsync(c => c.Id == request.CategoriaId && c.EstaActivo);

        if (!categoriaExiste)
            throw new InvalidOperationException("La categoría seleccionada no existe.");

        producto.Nombre = request.Nombre.Trim();
        producto.Descripcion = request.Descripcion?.Trim();
        producto.CategoriaId = request.CategoriaId;
        producto.UnidadMedida = request.UnidadMedida.Trim();
        producto.StockMinimo = request.StockMinimo;
        producto.PrecioCompra = request.PrecioCompra;
        producto.PrecioVenta = request.PrecioVenta;
        producto.ModificadoPor = usuarioId;
        producto.ModificadoEn = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ToResponse(producto);
    }

    public async Task<ProductoResponse> RegistrarEntradaStockAsync(
        int id, EntradaStockRequest request, int usuarioId)
    {
        if (request.Cantidad <= 0)
            throw new InvalidOperationException("La cantidad debe ser mayor a cero.");

        var producto = await _db.Productos
            .Include(p => p.Categoria)
            .FirstOrDefaultAsync(p => p.Id == id && p.EstaActivo)
            ?? throw new KeyNotFoundException($"Producto {id} no encontrado.");

        decimal stockAnterior = producto.StockActual;
        producto.StockActual += request.Cantidad;
        producto.ModificadoPor = usuarioId;
        producto.ModificadoEn = DateTime.UtcNow;

        _db.MovimientosStock.Add(new MovimientoStock
        {
            ProductoId = id,
            TipoMovimiento = "Entrada",
            Cantidad = request.Cantidad,
            StockAnterior = stockAnterior,
            StockResultante = producto.StockActual,
            Motivo = request.Motivo ?? "Entrada de mercadería",
            CreadoPor = usuarioId,
            CreadoEn = DateTime.UtcNow,
            EstaActivo = true
        });

        await _db.SaveChangesAsync();
        return ToResponse(producto);
    }

    public async Task DesactivarAsync(int id, int usuarioId)
    {
        var producto = await _db.Productos
            .FirstOrDefaultAsync(p => p.Id == id && p.EstaActivo)
            ?? throw new KeyNotFoundException($"Producto {id} no encontrado.");

        producto.EstaActivo = false;
        producto.ModificadoPor = usuarioId;
        producto.ModificadoEn = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    private static ProductoResponse ToResponse(Producto p) => new(
        p.Id, p.Nombre, p.Descripcion,
        p.CategoriaId, p.Categoria?.Nombre ?? "",
        p.UnidadMedida, p.StockActual, p.StockMinimo,
        p.PrecioCompra, p.PrecioVenta,
        p.StockActual <= p.StockMinimo,
        p.EstaActivo, p.CreadoEn);
}