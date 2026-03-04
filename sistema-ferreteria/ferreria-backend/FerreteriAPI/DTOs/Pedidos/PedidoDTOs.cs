namespace FerreteriAPI.DTOs.Pedidos;

// ── Entrada ───────────────────────────────────────────────────────────────────

public record CrearDetallePedidoRequest(
    int ProductoId,
    decimal Cantidad
);

public record CrearPedidoRequest(
    int ClienteId,
    DateTime? FechaEntrega,
    string? Observaciones,
    List<CrearDetallePedidoRequest> Detalles
);

public record CambiarEstadoPedidoRequest(
    string NuevoEstado
);

public record CancelarPedidoRequest(
    string Motivo
);

// ── Salida ────────────────────────────────────────────────────────────────────

public record DetalleItemResponse(
    int Id,
    int ProductoId,
    string NombreProducto,
    string UnidadMedida,
    decimal Cantidad,
    decimal PrecioUnitario,
    decimal Subtotal
);

public record PedidoResponse(
    int Id,
    int ClienteId,
    string NombreCliente,
    string TelefonoCliente,
    string EstadoPedido,
    DateTime FechaPedido,
    DateTime? FechaEntrega,
    string? Observaciones,
    decimal Subtotal,
    decimal MontoImpuesto,
    decimal Total,
    decimal MontoPagado,
    decimal SaldoPendiente,
    List<DetalleItemResponse> Detalles,
    bool EstaActivo,
    DateTime CreadoEn
);

public record PedidoResumenResponse(
    int Id,
    string NombreCliente,
    string EstadoPedido,
    decimal Total,
    decimal SaldoPendiente,
    DateTime FechaPedido,
    DateTime? FechaEntrega
);

// ── Dashboard ─────────────────────────────────────────────────────────────────

public record DashboardResponse(
    int ProductosConStockBajo,
    int PedidosPendientesHoy,
    decimal DeudaTotalClientes,
    decimal VentasDelMes,
    List<PedidoResumenResponse> UltimosPedidos
);