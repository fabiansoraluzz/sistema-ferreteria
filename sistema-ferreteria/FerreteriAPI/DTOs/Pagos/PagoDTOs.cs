namespace FerreteriAPI.DTOs.Pagos;

// ── Entrada ───────────────────────────────────────────────────────────────────
public record RegistrarPagoRequest(
    int PedidoId,
    decimal Monto,
    string MetodoPago,
    string? NumeroReferencia,
    string? Observaciones
);

// ── Salida ────────────────────────────────────────────────────────────────────
public record PagoResponse(
    int Id,
    int PedidoId,
    int ClienteId,
    string NombreCliente,
    decimal Monto,
    DateTime FechaPago,
    string MetodoPago,
    string? NumeroReferencia,
    string? Observaciones,
    bool EstaActivo,
    DateTime CreadoEn
);

public record CuentaPorCobrarResponse(
    int PedidoId,
    int ClienteId,
    string NombreCliente,
    string TelefonoCliente,
    DateTime FechaPedido,
    DateTime? FechaEntrega,
    string EstadoPedido,
    decimal Total,
    decimal MontoPagado,
    decimal SaldoPendiente,
    bool EstaVencido
);

public record ResumenCobranzaResponse(
    decimal TotalFacturadoMes,
    decimal TotalCobradoMes,
    decimal TotalPendienteMes,
    int CantidadPedidosPendientesPago,
    List<CuentaPorCobrarResponse> CuentasPorCobrar
);