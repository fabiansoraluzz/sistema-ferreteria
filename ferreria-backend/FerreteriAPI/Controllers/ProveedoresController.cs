using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FerreteriAPI.DTOs.Proveedores;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Proveedores")]
public class ProveedoresController : ControllerBase
{
    private readonly IProveedorService _service;

    public ProveedoresController(IProveedorService service)
    {
        _service = service;
    }

    /// <summary>ObtenerProveedores — Lista todos los proveedores activos.</summary>
    [HttpGet("ObtenerProveedores")]
    public async Task<IActionResult> ObtenerProveedores()
    {
        var proveedores = await _service.ObtenerTodosAsync();
        return Ok(proveedores);
    }

    /// <summary>ObtenerDetalleProveedor — Devuelve el detalle de un proveedor.</summary>
    [HttpGet("ObtenerDetalleProveedor/{id}")]
    public async Task<IActionResult> ObtenerDetalleProveedor(int id)
    {
        var proveedor = await _service.ObtenerPorIdAsync(id);
        return Ok(proveedor);
    }

    /// <summary>CrearProveedor — Registra un nuevo proveedor.</summary>
    [HttpPost("CrearProveedor")]
    public async Task<IActionResult> CrearProveedor([FromBody] CrearProveedorRequest request)
    {
        var proveedor = await _service.CrearAsync(request, ObtenerUsuarioId());
        return CreatedAtAction(nameof(ObtenerDetalleProveedor),
            new { id = proveedor.Id }, proveedor);
    }

    /// <summary>ActualizarProveedor — Actualiza los datos de un proveedor.</summary>
    [HttpPut("ActualizarProveedor/{id}")]
    public async Task<IActionResult> ActualizarProveedor(
        int id, [FromBody] ActualizarProveedorRequest request)
    {
        var proveedor = await _service.ActualizarAsync(id, request, ObtenerUsuarioId());
        return Ok(proveedor);
    }

    /// <summary>EliminarProveedor — Elimina lógicamente un proveedor sin compras. Solo Administrador.</summary>
    [HttpDelete("EliminarProveedor/{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> EliminarProveedor(int id)
    {
        await _service.EliminarAsync(id, ObtenerUsuarioId());
        return NoContent();
    }

    private int ObtenerUsuarioId()
    {
        var claim = User.FindFirst("id")?.Value
            ?? throw new UnauthorizedAccessException("Token inválido.");
        return int.Parse(claim);
    }
}