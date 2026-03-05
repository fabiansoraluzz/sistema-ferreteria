using FerreteriAPI.Data;
using FerreteriAPI.DTOs.Auth;
using FerreteriAPI.Helpers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

    /// <summary>IniciarSesion — Valida credenciales y devuelve un token JWT.</summary>
    [HttpPost("IniciarSesion")]
    public async Task<IActionResult> IniciarSesion([FromBody] LoginRequest request)
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

    // TEMPORAL — solo para generar hash, eliminar después
    [HttpGet("generar-hash")]
    [AllowAnonymous]
    public IActionResult GenerarHash([FromQuery] string contrasena)
    {
        var hash = BCrypt.Net.BCrypt.HashPassword(contrasena);
        return Ok(new { hash });
    }
}