using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FerreteriAPI.DTOs.Compras;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Compras")]
public class ComprasController : ControllerBase
{
    private readonly ICompraService _service;

    public ComprasController(ICompraService service)
    {
        _service = service;
    }

    /// <summary>ObtenerCompras — Lista todas las compras. Filtra opcionalmente por proveedor.</summary>
    [HttpGet("ObtenerCompras")]
    public async Task<IActionResult> ObtenerCompras([FromQuery] int? proveedorId)
    {
        var compras = await _service.ObtenerTodosAsync(proveedorId);
        return Ok(compras);
    }

    /// <summary>ObtenerDetalleCompra — Devuelve el detalle completo de una compra.</summary>
    [HttpGet("ObtenerDetalleCompra/{id}")]
    public async Task<IActionResult> ObtenerDetalleCompra(int id)
    {
        var compra = await _service.ObtenerPorIdAsync(id);
        return Ok(compra);
    }

    /// <summary>RegistrarCompra — Registra una nueva compra y suma el stock automáticamente. Rechaza facturas duplicadas del mismo proveedor.</summary>
    [HttpPost("RegistrarCompra")]
    public async Task<IActionResult> RegistrarCompra([FromBody] CrearCompraRequest request)
    {
        var compra = await _service.CrearAsync(request, ObtenerUsuarioId());
        return CreatedAtAction(nameof(ObtenerDetalleCompra),
            new { id = compra.Id }, compra);
    }

    private int ObtenerUsuarioId()
    {
        var claim = User.FindFirst("id")?.Value
            ?? throw new UnauthorizedAccessException("Token inválido.");
        return int.Parse(claim);
    }
}