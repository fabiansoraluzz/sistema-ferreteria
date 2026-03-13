namespace FerreteriAPI.DTOs.Compras;

public record CompraResumenResponse(
    int Id,
    string NombreProveedor,
    string NumeroFactura,
    DateTime FechaCompra,
    int CantidadProductos,
    decimal Total,
    DateTime CreadoEn);

public record CompraResponse(
    int Id,
    int ProveedorId,
    string NombreProveedor,
    string NumeroFactura,
    DateTime FechaCompra,
    string? Observaciones,
    decimal Total,
    List<DetalleCompraItemResponse> Detalles,
    DateTime CreadoEn);

public record DetalleCompraItemResponse(
    int Id,
    int ProductoId,
    string NombreProducto,
    string UnidadMedida,
    decimal Cantidad);

public record CrearCompraRequest(
    int ProveedorId,
    string NumeroFactura,
    DateTime FechaCompra,
    string? Observaciones,
    List<DetalleCompraRequest> Detalles);

public record DetalleCompraRequest(
    int ProductoId,
    decimal Cantidad);