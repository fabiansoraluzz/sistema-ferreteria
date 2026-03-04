using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FerreteriAPI.DTOs.Categorias;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Categorias")]
public class CategoriasController : ControllerBase
{
    private readonly ICategoriaService _service;

    public CategoriasController(ICategoriaService service)
    {
        _service = service;
    }

    /// <summary>ObtenerCategorias — Lista todas las categorías activas ordenadas por nombre.</summary>
    [HttpGet("ObtenerCategorias")]
    public async Task<IActionResult> ObtenerCategorias()
    {
        var categorias = await _service.ObtenerTodasAsync();
        return Ok(categorias);
    }

    /// <summary>ObtenerDetalleCategoria — Devuelve el detalle de una categoría por su Id.</summary>
    [HttpGet("ObtenerDetalleCategoria/{id}")]
    public async Task<IActionResult> ObtenerDetalleCategoria(int id)
    {
        var categoria = await _service.ObtenerPorIdAsync(id);
        return Ok(categoria);
    }

    /// <summary>CrearCategoria — Registra una nueva categoría. El nombre debe ser único.</summary>
    [HttpPost("CrearCategoria")]
    public async Task<IActionResult> CrearCategoria([FromBody] CrearCategoriaRequest request)
    {
        var categoria = await _service.CrearAsync(request, ObtenerUsuarioId());
        return CreatedAtAction(nameof(ObtenerDetalleCategoria),
            new { id = categoria.Id }, categoria);
    }

    /// <summary>ActualizarCategoria — Modifica el nombre y descripción de una categoría existente.</summary>
    [HttpPut("ActualizarCategoria/{id}")]
    public async Task<IActionResult> ActualizarCategoria(
        int id, [FromBody] ActualizarCategoriaRequest request)
    {
        var categoria = await _service.ActualizarAsync(id, request, ObtenerUsuarioId());
        return Ok(categoria);
    }

    /// <summary>EliminarCategoria — Desactiva una categoría (soft delete). Solo si no tiene productos activos. Solo Administrador.</summary>
    [HttpDelete("EliminarCategoria/{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> EliminarCategoria(int id)
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