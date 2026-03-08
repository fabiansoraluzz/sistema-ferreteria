namespace FerreteriAPI.DTOs.Clientes;

public record CrearClienteRequest(
    string NombreCompleto,
    string? Telefono,
    string? CorreoElectronico,
    string? Direccion,
    string? Distrito,
    string TipoDocumento,
    string NumeroDocumento
);

public record ActualizarClienteRequest(
    string NombreCompleto,
    string? Telefono,
    string? CorreoElectronico,
    string? Direccion,
    string? Distrito,
    string TipoDocumento,
    string NumeroDocumento
);

public record ClienteResponse(
    int Id,
    string NombreCompleto,
    string? Telefono,
    string? CorreoElectronico,
    string? Direccion,
    string? Distrito,
    string? TipoDocumento,
    string? NumeroDocumento,
    decimal DeudaTotal,
    bool EstaActivo,
    DateTime CreadoEn
);

public record DeudaPedidoDetalle(
    int PedidoId,
    DateTime FechaPedido,
    DateTime? FechaEntrega,
    string EstadoPedido,
    decimal Total,
    decimal MontoPagado,
    decimal SaldoPendiente
);

public record ClienteDetalleResponse(
    int Id,
    string NombreCompleto,
    string? Telefono,
    string? CorreoElectronico,
    string? Direccion,
    string? Distrito,
    string? TipoDocumento,
    string? NumeroDocumento,
    decimal DeudaTotal,
    int TotalPedidos,
    int PedidosPendientes,
    List<DeudaPedidoDetalle> DetallePedidos,
    bool EstaActivo,
    DateTime CreadoEn
);