using Microsoft.EntityFrameworkCore;
using FerreteriAPI.Data;
using FerreteriAPI.DTOs.Pedidos;
using FerreteriAPI.Models;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Services;

public class PedidoService : IPedidoService
{
    private readonly AppDbContext _db;
    private const decimal IGV = 0.18m;

    // Flujo de estados permitido — no se puede saltear ningún estado
    private static readonly Dictionary<string, string> _siguienteEstado = new()
    {
        { "Pendiente",  "Confirmado" },
        { "Confirmado", "EnReparto"  },
        { "EnReparto",  "Entregado"  }
    };

    public PedidoService(AppDbContext db)
    {
        _db = db;
    }

    // ── Listar ────────────────────────────────────────────────────────────────
    public async Task<List<PedidoResumenResponse>> ObtenerTodosAsync(
        string? estado, int? clienteId)
    {
        var query = _db.Pedidos
            .Include(p => p.Cliente)
            .Where(p => p.EstaActivo);

        if (!string.IsNullOrWhiteSpace(estado))
            query = query.Where(p => p.EstadoPedido == estado);

        if (clienteId.HasValue)
            query = query.Where(p => p.ClienteId == clienteId.Value);

        return await query
            .OrderByDescending(p => p.FechaPedido)
            .Select(p => new PedidoResumenResponse(
                p.Id,
                p.Cliente.NombreCompleto,
                p.EstadoPedido,
                p.Total,
                p.Total - p.MontoPagado,
                p.FechaPedido,
                p.FechaEntrega))
            .ToListAsync();
    }

    // ── Obtener por Id ────────────────────────────────────────────────────────
    public async Task<PedidoResponse> ObtenerPorIdAsync(int id)
    {
        var pedido = await _db.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(p => p.Id == id && p.EstaActivo)
            ?? throw new KeyNotFoundException($"Pedido {id} no encontrado.");

        return ToResponse(pedido);
    }

    // ── Crear ─────────────────────────────────────────────────────────────────
    public async Task<PedidoResponse> CrearAsync(
        CrearPedidoRequest request, int usuarioId)
    {
        // Valida que exista el cliente
        var cliente = await _db.Clientes
            .FirstOrDefaultAsync(c => c.Id == request.ClienteId && c.EstaActivo)
            ?? throw new InvalidOperationException("El cliente seleccionado no existe.");

        // Valida que venga al menos un producto
        if (request.Detalles == null || request.Detalles.Count == 0)
            throw new InvalidOperationException("El pedido debe tener al menos un producto.");

        // Valida productos y calcula subtotal
        var detalles = new List<DetallePedido>();
        decimal subtotal = 0;

        foreach (var item in request.Detalles)
        {
            var producto = await _db.Productos
                .FirstOrDefaultAsync(p => p.Id == item.ProductoId && p.EstaActivo)
                ?? throw new InvalidOperationException(
                    $"El producto {item.ProductoId} no existe o está inactivo.");

            if (item.Cantidad <= 0)
                throw new InvalidOperationException(
                    $"La cantidad del producto '{producto.Nombre}' debe ser mayor a cero.");

            decimal subtotalItem = item.Cantidad * producto.PrecioVenta;
            subtotal += subtotalItem;

            detalles.Add(new DetallePedido
            {
                ProductoId = producto.Id,
                Cantidad = item.Cantidad,
                PrecioUnitario = producto.PrecioVenta, // snapshot del precio actual
                Subtotal = subtotalItem,
                CreadoPor = usuarioId,
                CreadoEn = DateTime.UtcNow,
                EstaActivo = true
            });
        }

        decimal montoIgv = Math.Round(subtotal * IGV, 2);
        decimal total = subtotal + montoIgv;

        var pedido = new Pedido
        {
            ClienteId = request.ClienteId,
            EstadoPedido = "Pendiente",
            FechaPedido = DateTime.UtcNow,
            FechaEntrega = request.FechaEntrega,
            Observaciones = request.Observaciones?.Trim(),
            Subtotal = Math.Round(subtotal, 2),
            MontoImpuesto = montoIgv,
            Total = Math.Round(total, 2),
            MontoPagado = 0,
            Detalles = detalles,
            CreadoPor = usuarioId,
            CreadoEn = DateTime.UtcNow,
            EstaActivo = true
        };

        _db.Pedidos.Add(pedido);
        await _db.SaveChangesAsync();

        // Recarga con todas las relaciones para devolver la respuesta completa
        return await ObtenerPorIdAsync(pedido.Id);
    }

    // ── Cambiar Estado ────────────────────────────────────────────────────────
    public async Task<PedidoResponse> CambiarEstadoAsync(
        int id, CambiarEstadoPedidoRequest request, int usuarioId)
    {
        var pedido = await _db.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(p => p.Id == id && p.EstaActivo)
            ?? throw new KeyNotFoundException($"Pedido {id} no encontrado.");

        if (pedido.EstadoPedido == "Cancelado")
            throw new InvalidOperationException(
                "No se puede cambiar el estado de un pedido cancelado.");

        if (pedido.EstadoPedido == "Entregado")
            throw new InvalidOperationException(
                "El pedido ya fue entregado y no puede cambiar de estado.");

        // Valida que el nuevo estado sea el siguiente correcto en el flujo
        if (!_siguienteEstado.TryGetValue(pedido.EstadoPedido, out var estadoEsperado)
            || estadoEsperado != request.NuevoEstado)
        {
            throw new InvalidOperationException(
                $"El estado '{request.NuevoEstado}' no es válido. " +
                $"El siguiente estado debe ser '{estadoEsperado}'.");
        }

        // Al confirmar: descuenta el stock automáticamente
        if (request.NuevoEstado == "Confirmado")
            await DescontarStockAsync(pedido, usuarioId);

        pedido.EstadoPedido = request.NuevoEstado;
        pedido.ModificadoPor = usuarioId;
        pedido.ModificadoEn = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return ToResponse(pedido);
    }

    // ── Cancelar ──────────────────────────────────────────────────────────────
    public async Task<PedidoResponse> CancelarAsync(
        int id, CancelarPedidoRequest request, int usuarioId)
    {
        var pedido = await _db.Pedidos
            .Include(p => p.Cliente)
            .Include(p => p.Detalles)
                .ThenInclude(d => d.Producto)
            .FirstOrDefaultAsync(p => p.Id == id && p.EstaActivo)
            ?? throw new KeyNotFoundException($"Pedido {id} no encontrado.");

        if (pedido.EstadoPedido == "Cancelado")
            throw new InvalidOperationException("El pedido ya está cancelado.");

        if (pedido.EstadoPedido == "Entregado")
            throw new InvalidOperationException(
                "No se puede cancelar un pedido que ya fue entregado.");

        // Si el pedido ya fue confirmado, repone el stock
        if (pedido.EstadoPedido == "Confirmado" ||
            pedido.EstadoPedido == "EnReparto")
            await ReponerStockAsync(pedido, request.Motivo, usuarioId);

        pedido.EstadoPedido = "Cancelado";
        pedido.Observaciones = $"{pedido.Observaciones} | CANCELADO: {request.Motivo}".Trim(' ', '|');
        pedido.ModificadoPor = usuarioId;
        pedido.ModificadoEn = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return ToResponse(pedido);
    }

    // ── Dashboard ─────────────────────────────────────────────────────────────
    public async Task<DashboardResponse> ObtenerDashboardAsync()
    {
        var hoy = DateTime.UtcNow.Date;
        var inicioMes = new DateTime(hoy.Year, hoy.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        int productosConStockBajo = await _db.Productos
            .CountAsync(p => p.EstaActivo && p.StockActual <= p.StockMinimo);

        int pedidosPendientesHoy = await _db.Pedidos
            .CountAsync(p => p.EstaActivo
                          && p.EstadoPedido == "Pendiente"
                          && p.FechaPedido.Date == hoy);

        decimal deudaTotal = await _db.Pedidos
            .Where(p => p.EstaActivo && p.EstadoPedido != "Cancelado")
            .SumAsync(p => p.Total - p.MontoPagado);

        decimal ventasDelMes = await _db.Pedidos
            .Where(p => p.EstaActivo
                     && p.EstadoPedido != "Cancelado"
                     && p.FechaPedido >= inicioMes)
            .SumAsync(p => p.Total);

        var ultimosPedidos = await _db.Pedidos
            .Include(p => p.Cliente)
            .Where(p => p.EstaActivo)
            .OrderByDescending(p => p.FechaPedido)
            .Take(5)
            .Select(p => new PedidoResumenResponse(
                p.Id,
                p.Cliente.NombreCompleto,
                p.EstadoPedido,
                p.Total,
                p.Total - p.MontoPagado,
                p.FechaPedido,
                p.FechaEntrega))
            .ToListAsync();

        return new DashboardResponse(
            productosConStockBajo,
            pedidosPendientesHoy,
            deudaTotal,
            ventasDelMes,
            ultimosPedidos);
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    private async Task DescontarStockAsync(Pedido pedido, int usuarioId)
    {
        foreach (var detalle in pedido.Detalles)
        {
            var producto = detalle.Producto
                ?? await _db.Productos.FindAsync(detalle.ProductoId)
                ?? throw new InvalidOperationException(
                    $"Producto {detalle.ProductoId} no encontrado.");

            if (producto.StockActual < detalle.Cantidad)
                throw new InvalidOperationException(
                    $"Stock insuficiente para '{producto.Nombre}'. " +
                    $"Stock disponible: {producto.StockActual} {producto.UnidadMedida}.");

            decimal stockAnterior = producto.StockActual;
            producto.StockActual -= detalle.Cantidad;
            producto.ModificadoPor = usuarioId;
            producto.ModificadoEn = DateTime.UtcNow;

            _db.MovimientosStock.Add(new MovimientoStock
            {
                ProductoId = producto.Id,
                TipoMovimiento = "Salida",
                Cantidad = detalle.Cantidad,
                StockAnterior = stockAnterior,
                StockResultante = producto.StockActual,
                Motivo = $"Venta — Pedido #{pedido.Id}",
                PedidoId = pedido.Id,
                CreadoPor = usuarioId,
                CreadoEn = DateTime.UtcNow,
                EstaActivo = true
            });
        }
    }

    private async Task ReponerStockAsync(Pedido pedido, string motivo, int usuarioId)
    {
        foreach (var detalle in pedido.Detalles)
        {
            var producto = detalle.Producto
                ?? await _db.Productos.FindAsync(detalle.ProductoId)
                ?? throw new InvalidOperationException(
                    $"Producto {detalle.ProductoId} no encontrado.");

            decimal stockAnterior = producto.StockActual;
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
                Motivo = $"Reposición por cancelación — Pedido #{pedido.Id} — {motivo}",
                PedidoId = pedido.Id,
                CreadoPor = usuarioId,
                CreadoEn = DateTime.UtcNow,
                EstaActivo = true
            });
        }
    }

    private static PedidoResponse ToResponse(Pedido p) => new(
        p.Id,
        p.ClienteId,
        p.Cliente?.NombreCompleto ?? "",
        p.Cliente?.Telefono ?? "",
        p.EstadoPedido,
        p.FechaPedido,
        p.FechaEntrega,
        p.Observaciones,
        p.Subtotal,
        p.MontoImpuesto,
        p.Total,
        p.MontoPagado,
        p.Total - p.MontoPagado,
        p.Detalles?.Select(d => new DetalleItemResponse(
            d.Id,
            d.ProductoId,
            d.Producto?.Nombre ?? "",
            d.Producto?.UnidadMedida ?? "",
            d.Cantidad,
            d.PrecioUnitario,
            d.Subtotal
        )).ToList() ?? [],
        p.EstaActivo,
        p.CreadoEn);
}