using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FerreteriAPI.DTOs.Clientes;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Clientes")]
public class ClientesController : ControllerBase
{
    private readonly IClienteService _service;

    public ClientesController(IClienteService service)
    {
        _service = service;
    }

    /// <summary>ObtenerClientes — Lista todos los clientes activos ordenados por deuda descendente. Acepta búsqueda por nombre o teléfono.</summary>
    [HttpGet("ObtenerClientes")]
    public async Task<IActionResult> ObtenerClientes([FromQuery] string? busqueda)
    {
        var clientes = await _service.ObtenerTodosAsync(busqueda);
        return Ok(clientes);
    }

    /// <summary>ObtenerDetalleCliente — Devuelve la ficha completa del cliente con desglose de deuda por pedido, total de pedidos y pedidos pendientes.</summary>
    [HttpGet("ObtenerDetalleCliente/{id}")]
    public async Task<IActionResult> ObtenerDetalleCliente(int id)
    {
        var cliente = await _service.ObtenerDetalleConDeudaAsync(id);
        return Ok(cliente);
    }

    /// <summary>CrearCliente — Registra un nuevo cliente con su información de contacto.</summary>
    [HttpPost("CrearCliente")]
    public async Task<IActionResult> CrearCliente([FromBody] CrearClienteRequest request)
    {
        var cliente = await _service.CrearAsync(request, ObtenerUsuarioId());
        return CreatedAtAction(nameof(ObtenerDetalleCliente),
            new { id = cliente.Id }, cliente);
    }

    /// <summary>ActualizarCliente — Modifica los datos de contacto y dirección de un cliente existente.</summary>
    [HttpPut("ActualizarCliente/{id}")]
    public async Task<IActionResult> ActualizarCliente(
        int id, [FromBody] ActualizarClienteRequest request)
    {
        var cliente = await _service.ActualizarAsync(id, request, ObtenerUsuarioId());
        return Ok(cliente);
    }

    /// <summary>EliminarCliente — Desactiva un cliente (soft delete). Solo Administrador.</summary>
    [HttpDelete("EliminarCliente/{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> EliminarCliente(int id)
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