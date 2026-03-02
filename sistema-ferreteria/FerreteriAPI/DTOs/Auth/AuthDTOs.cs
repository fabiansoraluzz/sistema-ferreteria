namespace FerreteriAPI.DTOs.Auth;

public record LoginRequest(string CorreoElectronico, string Contrasena);

public record LoginResponse(
    string Token,
    string NombreCompleto,
    string Rol,
    int UsuarioId
);