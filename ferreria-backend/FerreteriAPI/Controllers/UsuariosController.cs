using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FerreteriAPI.DTOs.Usuarios;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
[Tags("Usuarios")]
public class UsuariosController : ControllerBase
{
    private readonly IUsuarioService _service;

    public UsuariosController(IUsuarioService service)
    {
        _service = service;
    }

    /// <summary>ObtenerUsuarios — Lista todos los usuarios del sistema.</summary>
    [HttpGet("ObtenerUsuarios")]
    public async Task<IActionResult> ObtenerUsuarios()
    {
        var usuarios = await _service.ObtenerTodosAsync();
        return Ok(usuarios);
    }

    /// <summary>CrearUsuario — Crea un nuevo usuario con rol Administrador o Vendedor.</summary>
    [HttpPost("CrearUsuario")]
    public async Task<IActionResult> CrearUsuario([FromBody] CrearUsuarioRequest request)
    {
        var usuario = await _service.CrearAsync(request, ObtenerUsuarioId());
        return Ok(usuario);
    }

    /// <summary>ActualizarUsuario — Actualiza nombre, correo, rol y opcionalmente la contraseña.</summary>
    [HttpPut("ActualizarUsuario/{id}")]
    public async Task<IActionResult> ActualizarUsuario(int id, [FromBody] ActualizarUsuarioRequest request)
    {
        var usuario = await _service.ActualizarAsync(id, request, ObtenerUsuarioId());
        return Ok(usuario);
    }

    /// <summary>EliminarUsuario — Desactiva un usuario del sistema.</summary>
    [HttpDelete("EliminarUsuario/{id}")]
    public async Task<IActionResult> EliminarUsuario(int id)
    {
        await _service.DesactivarAsync(id, ObtenerUsuarioId());
        return NoContent();
    }

    private int ObtenerUsuarioId()
    {
        var claim = User.FindFirst("id")?.Value
            ?? throw new UnauthorizedAccessException("Token inválido.");
        return int.Parse(claim);
    }
}