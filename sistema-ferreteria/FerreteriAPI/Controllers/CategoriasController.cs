using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using FerreteriAPI.DTOs.Categorias;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Todos los endpoints requieren JWT
public class CategoriasController : ControllerBase
{
    private readonly ICategoriaService _service;

    public CategoriasController(ICategoriaService service)
    {
        _service = service;
    }

    // GET /api/categorias
    [HttpGet]
    public async Task<IActionResult> ObtenerTodas()
    {
        var categorias = await _service.ObtenerTodasAsync();
        return Ok(categorias);
    }

    // GET /api/categorias/5
    [HttpGet("{id}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var categoria = await _service.ObtenerPorIdAsync(id);
        return Ok(categoria);
    }

    // POST /api/categorias
    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearCategoriaRequest request)
    {
        var categoria = await _service.CrearAsync(request, ObtenerUsuarioId());
        return CreatedAtAction(nameof(ObtenerPorId),
            new { id = categoria.Id }, categoria);
    }

    // PUT /api/categorias/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Actualizar(
        int id, [FromBody] ActualizarCategoriaRequest request)
    {
        var categoria = await _service.ActualizarAsync(id, request, ObtenerUsuarioId());
        return Ok(categoria);
    }

    // DELETE /api/categorias/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Desactivar(int id)
    {
        await _service.DesactivarAsync(id, ObtenerUsuarioId());
        return NoContent();
    }

    // Helper privado para obtener el Id del usuario desde el JWT
    private int ObtenerUsuarioId()
    {
        var claim = User.FindFirst("id")?.Value
            ?? throw new UnauthorizedAccessException("Token inválido.");
        return int.Parse(claim);
    }
}