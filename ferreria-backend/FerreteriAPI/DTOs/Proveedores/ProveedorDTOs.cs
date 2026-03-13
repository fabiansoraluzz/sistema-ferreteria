namespace FerreteriAPI.DTOs.Proveedores;

public record ProveedorResponse(
    int Id,
    string Nombre,
    string? Ruc,
    string? Telefono,
    string? Direccion,
    int TotalCompras,
    bool EstaActivo,
    DateTime CreadoEn);

public record CrearProveedorRequest(
    string Nombre,
    string? Ruc,
    string? Telefono,
    string? Direccion);

public record ActualizarProveedorRequest(
    string Nombre,
    string? Ruc,
    string? Telefono,
    string? Direccion);