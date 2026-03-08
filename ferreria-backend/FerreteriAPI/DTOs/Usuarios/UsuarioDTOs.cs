namespace FerreteriAPI.DTOs.Usuarios;

public record CrearUsuarioRequest(
    string NombreCompleto,
    string CorreoElectronico,
    string Contrasena,
    string Rol
);

public record ActualizarUsuarioRequest(
    string NombreCompleto,
    string CorreoElectronico,
    string Rol,
    string? NuevaContrasena
);

public record UsuarioResponse(
    int Id,
    string NombreCompleto,
    string CorreoElectronico,
    string Rol,
    bool EstaActivo,
    DateTime CreadoEn
);