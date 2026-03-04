using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FerreteriAPI.DTOs.Despachos;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Despachos")]
public class DespachosController : ControllerBase
{
    private readonly IDespachoService _service;

    public DespachosController(IDespachoService service)
    {
        _service = service;
    }

    /// <summary>ObtenerDespachos — Lista todos los despachos activos. Filtra por estado: Pendiente, Despachado, EnTransito, Entregado.</summary>
    [HttpGet("ObtenerDespachos")]
    public async Task<IActionResult> ObtenerDespachos([FromQuery] string? estado)
    {
        var despachos = await _service.ObtenerTodosAsync(estado);
        return Ok(despachos);
    }

    /// <summary>ObtenerDetalleDespacho — Devuelve el detalle completo de un despacho por su Id.</summary>
    [HttpGet("ObtenerDetalleDespacho/{id}")]
    public async Task<IActionResult> ObtenerDetalleDespacho(int id)
    {
        var despacho = await _service.ObtenerPorIdAsync(id);
        return Ok(despacho);
    }

    /// <summary>CrearDespacho — Registra un nuevo despacho para un pedido confirmado. TipoDespacho: Lima o Provincia. Provincia requiere nombre del transportista.</summary>
    [HttpPost("CrearDespacho")]
    public async Task<IActionResult> CrearDespacho([FromBody] CrearDespachoRequest request)
    {
        var despacho = await _service.CrearAsync(request, ObtenerUsuarioId());
        return Ok(despacho);
    }

    /// <summary>AvanzarEstadoDespacho — Avanza el despacho al siguiente estado: Pendiente → Despachado → EnTransito → Entregado. Al llegar a Entregado actualiza también el pedido.</summary>
    [HttpPatch("AvanzarEstadoDespacho/{id}")]
    public async Task<IActionResult> AvanzarEstadoDespacho(
        int id, [FromBody] ActualizarEstadoDespachoRequest request)
    {
        var despacho = await _service.ActualizarEstadoAsync(id, request, ObtenerUsuarioId());
        return Ok(despacho);
    }

    private int ObtenerUsuarioId()
    {
        var claim = User.FindFirst("id")?.Value
            ?? throw new UnauthorizedAccessException("Token inválido.");
        return int.Parse(claim);
    }
}