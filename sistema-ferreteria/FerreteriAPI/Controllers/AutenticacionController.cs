using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FerreteriAPI.Data;
using FerreteriAPI.DTOs.Auth;
using FerreteriAPI.Helpers;

namespace FerreteriAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AutenticacionController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtHelper _jwt;

    public AutenticacionController(AppDbContext db, JwtHelper jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    /// <summary>POST /api/autenticacion/login</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u =>
                u.CorreoElectronico == request.CorreoElectronico
                && u.EstaActivo);

        if (usuario is null)
            return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });

        bool valida = BCrypt.Net.BCrypt.Verify(
            request.Contrasena, usuario.ContrasenaHash);

        if (!valida)
            return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });

        return Ok(new LoginResponse(
            _jwt.GenerarToken(usuario),
            usuario.NombreCompleto,
            usuario.Rol,
            usuario.Id
        ));
    }
}