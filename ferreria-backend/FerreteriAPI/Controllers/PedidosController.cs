using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FerreteriAPI.DTOs.Pedidos;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Pedidos")]
public class PedidosController : ControllerBase
{
    private readonly IPedidoService _service;

    public PedidosController(IPedidoService service)
    {
        _service = service;
    }

    /// <summary>ObtenerPedidos — Lista todos los pedidos activos. Filtra por estado o por cliente.</summary>
    [HttpGet("ObtenerPedidos")]
    public async Task<IActionResult> ObtenerPedidos(
        [FromQuery] string? estado,
        [FromQuery] int? clienteId)
    {
        var pedidos = await _service.ObtenerTodosAsync(estado, clienteId);
        return Ok(pedidos);
    }

    /// <summary>ObtenerDetallePedido — Devuelve el detalle completo de un pedido con sus items, totales y estado actual.</summary>
    [HttpGet("ObtenerDetallePedido/{id}")]
    public async Task<IActionResult> ObtenerDetallePedido(int id)
    {
        var pedido = await _service.ObtenerPorIdAsync(id);
        return Ok(pedido);
    }

    /// <summary>CrearPedido — Registra un nuevo pedido con cliente, productos y calcula subtotal e IGV automáticamente. Estado inicial: Pendiente.</summary>
    [HttpPost("CrearPedido")]
    public async Task<IActionResult> CrearPedido([FromBody] CrearPedidoRequest request)
    {
        var pedido = await _service.CrearAsync(request, ObtenerUsuarioId());
        return CreatedAtAction(nameof(ObtenerDetallePedido),
            new { id = pedido.Id }, pedido);
    }

    /// <summary>AvanzarEstadoPedido — Avanza el pedido al siguiente estado del flujo: Pendiente → Confirmado → EnReparto → Entregado. No se puede saltear estados. Al confirmar descuenta stock automáticamente.</summary>
    [HttpPatch("AvanzarEstadoPedido/{id}")]
    public async Task<IActionResult> AvanzarEstadoPedido(
        int id, [FromBody] CambiarEstadoPedidoRequest request)
    {
        var pedido = await _service.CambiarEstadoAsync(id, request, ObtenerUsuarioId());
        return Ok(pedido);
    }

    /// <summary>CancelarPedido — Cancela un pedido y repone el stock automáticamente si ya estaba confirmado. Solo Administrador.</summary>
    [HttpPatch("CancelarPedido/{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> CancelarPedido(
        int id, [FromBody] CancelarPedidoRequest request)
    {
        var pedido = await _service.CancelarAsync(id, request, ObtenerUsuarioId());
        return Ok(pedido);
    }

    private int ObtenerUsuarioId()
    {
        var claim = User.FindFirst("id")?.Value
            ?? throw new UnauthorizedAccessException("Token inválido.");
        return int.Parse(claim);
    }

    /// <summary>ActualizarDocumentoFiscal — Actualiza el tipo de documento fiscal del pedido: SinDocumento, SoloFactura o GuiaFactura.</summary>
    [HttpPatch("ActualizarDocumentoFiscal/{id}")]
    public async Task<IActionResult> ActualizarDocumentoFiscal(
        int id, [FromBody] ActualizarDocumentoFiscalRequest request)
    {
        var pedido = await _service.ActualizarDocumentoFiscalAsync(id, request, ObtenerUsuarioId());
        return Ok(pedido);
    }
}