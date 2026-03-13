using Microsoft.EntityFrameworkCore;
using FerreteriAPI.Data;
using FerreteriAPI.DTOs.Compras;
using FerreteriAPI.Models;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Services;

public class CompraService : ICompraService
{
    private readonly AppDbContext _db;

    public CompraService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<CompraResumenResponse>> ObtenerTodosAsync(int? proveedorId)
    {
        var query = _db.Compras
            .Include(c => c.Proveedor)
            .Include(c => c.Detalles)
            .Where(c => c.EstaActivo);

        if (proveedorId.HasValue)
            query = query.Where(c => c.ProveedorId == proveedorId.Value);

        return await query
            .OrderByDescending(c => c.FechaCompra)
            .Select(c => new CompraResumenResponse(
                c.Id,
                c.Proveedor.Nombre,
                c.NumeroFactura,
                c.FechaCompra,
                c.Detalles.Count(d => d.EstaActivo),
                c.Total,
                c.CreadoEn))
            .ToListAsync();
    }

    public async Task<CompraResponse> ObtenerPorIdAsync(int id)
    {
        var compra = await _db.Compras
            .Include(c => c.Proveedor)
            .Include(c => c.Detalles)
                .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(c => c.Id == id && c.EstaActivo)
            ?? throw new KeyNotFoundException($"Compra {id} no encontrada.");

        return ToResponse(compra);
    }

    public async Task<CompraResponse> CrearAsync(CrearCompraRequest request, int usuarioId)
    {
        // Validar proveedor
        var proveedor = await _db.Proveedores
            .FirstOrDefaultAsync(p => p.Id == request.ProveedorId && p.EstaActivo)
            ?? throw new InvalidOperationException("El proveedor seleccionado no existe.");

        // Validar detalles
        if (request.Detalles == null || request.Detalles.Count == 0)
            throw new InvalidOperationException("La compra debe tener al menos un producto.");

        // Validar duplicado de factura
        var duplicado = await _db.Compras.AnyAsync(c =>
            c.ProveedorId == request.ProveedorId &&
            c.NumeroFactura == request.NumeroFactura.Trim() &&
            c.EstaActivo);

        if (duplicado)
            throw new InvalidOperationException(
                $"Ya existe una compra con la factura '{request.NumeroFactura}' del proveedor '{proveedor.Nombre}'.");

        // Construir detalles y sumar stock
        var detalles = new List<DetalleCompra>();

        foreach (var item in request.Detalles)
        {
            var producto = await _db.Productos
                .FirstOrDefaultAsync(p => p.Id == item.ProductoId && p.EstaActivo)
                ?? throw new InvalidOperationException(
                    $"El producto {item.ProductoId} no existe o está inactivo.");

            if (item.Cantidad <= 0)
                throw new InvalidOperationException(
                    $"La cantidad del producto '{producto.Nombre}' debe ser mayor a cero.");

            detalles.Add(new DetalleCompra
            {
                ProductoId = producto.Id,
                Cantidad = item.Cantidad,
                CreadoPor = usuarioId,
                CreadoEn = DateTime.UtcNow,
                EstaActivo = true,
            });
        }

        var compra = new Compra
        {
            ProveedorId = request.ProveedorId,
            NumeroFactura = request.NumeroFactura.Trim(),
            FechaCompra = request.FechaCompra,
            Observaciones = request.Observaciones?.Trim(),
            Total = 0,
            Detalles = detalles,
            CreadoPor = usuarioId,
            CreadoEn = DateTime.UtcNow,
            EstaActivo = true,
        };

        _db.Compras.Add(compra);
        await _db.SaveChangesAsync();

        // Sumar stock y registrar movimientos
        foreach (var detalle in compra.Detalles)
        {
            var producto = await _db.Productos.FindAsync(detalle.ProductoId)!;
            decimal stockAnterior = producto!.StockActual;
            producto.StockActual += detalle.Cantidad;
            producto.ModificadoPor = usuarioId;
            producto.ModificadoEn = DateTime.UtcNow;

            _db.MovimientosStock.Add(new MovimientoStock
            {
                ProductoId = producto.Id,
                TipoMovimiento = "Entrada",
                Cantidad = detalle.Cantidad,
                StockAnterior = stockAnterior,
                StockResultante = producto.StockActual,
                Motivo = $"Compra — Factura {compra.NumeroFactura} — {proveedor.Nombre}",
                CompraId = compra.Id,
                CreadoPor = usuarioId,
                CreadoEn = DateTime.UtcNow,
                EstaActivo = true,
            });
        }

        await _db.SaveChangesAsync();

        return await ObtenerPorIdAsync(compra.Id);
    }

    private static CompraResponse ToResponse(Compra c) => new(
        c.Id,
        c.ProveedorId,
        c.Proveedor?.Nombre ?? "",
        c.NumeroFactura,
        c.FechaCompra,
        c.Observaciones,
        c.Total,
        c.Detalles?.Select(d => new DetalleCompraItemResponse(
            d.Id,
            d.ProductoId,
            d.Producto?.Nombre ?? "",
            d.Producto?.UnidadMedida ?? "",
            d.Cantidad
        )).ToList() ?? [],
        c.CreadoEn);
}