namespace FerreteriAPI.DTOs.Despachos;

// ── Entrada ───────────────────────────────────────────────────────────────────
public record CrearDespachoRequest(
    int PedidoId,
    string TipoDespacho,        // Lima | Provincia
    string? NombreTransportista,
    string? TelefonoTransportista,
    string? NotaSeguimiento,
    DateTime? FechaDespacho
);

public record ActualizarEstadoDespachoRequest(
    string NuevoEstado            // Pendiente | Despachado | EnTransito | Entregado
);

// ── Salida ────────────────────────────────────────────────────────────────────
public record DespachoResponse(
    int Id,
    int PedidoId,
    string NombreCliente,
    string TelefonoCliente,
    string TipoDespacho,
    string? NombreTransportista,
    string? TelefonoTransportista,
    string? NotaSeguimiento,
    DateTime? FechaDespacho,
    string EstadoDespacho,
    bool EstaActivo,
    DateTime CreadoEn
);