using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FerreteriAPI.DTOs.Pagos;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Pagos")]
public class PagosController : ControllerBase
{
    private readonly IPagoService _service;

    public PagosController(IPagoService service)
    {
        _service = service;
    }

    /// <summary>ObtenerPagosPorCliente — Lista el historial completo de pagos de un cliente ordenado por fecha descendente.</summary>
    [HttpGet("ObtenerPagosPorCliente/{clienteId}")]
    public async Task<IActionResult> ObtenerPagosPorCliente(int clienteId)
    {
        var pagos = await _service.ObtenerPorClienteAsync(clienteId);
        return Ok(pagos);
    }

    /// <summary>ObtenerPagosPorPedido — Lista todos los pagos registrados para un pedido específico.</summary>
    [HttpGet("ObtenerPagosPorPedido/{pedidoId}")]
    public async Task<IActionResult> ObtenerPagosPorPedido(int pedidoId)
    {
        var pagos = await _service.ObtenerPorPedidoAsync(pedidoId);
        return Ok(pagos);
    }

    /// <summary>ObtenerCuentasPorCobrar — Lista todos los pedidos con saldo pendiente de pago ordenados por fecha de entrega.</summary>
    [HttpGet("ObtenerCuentasPorCobrar")]
    public async Task<IActionResult> ObtenerCuentasPorCobrar()
    {
        var cuentas = await _service.ObtenerCuentasPorCobrarAsync();
        return Ok(cuentas);
    }

    /// <summary>ObtenerResumenCobranza — Devuelve el resumen del mes: total facturado, cobrado, pendiente y lista de cuentas por cobrar.</summary>
    [HttpGet("ObtenerResumenCobranza")]
    public async Task<IActionResult> ObtenerResumenCobranza()
    {
        var resumen = await _service.ObtenerResumenCobranzaAsync();
        return Ok(resumen);
    }

    /// <summary>RegistrarPago — Registra un pago total o parcial para un pedido. Actualiza automáticamente el MontoPagado del pedido. Métodos válidos: Efectivo, Transferencia, Yape, Plin, Cheque.</summary>
    [HttpPost("RegistrarPago")]
    public async Task<IActionResult> RegistrarPago([FromBody] RegistrarPagoRequest request)
    {
        var pago = await _service.RegistrarPagoAsync(request, ObtenerUsuarioId());
        return Ok(pago);
    }

    private int ObtenerUsuarioId()
    {
        var claim = User.FindFirst("id")?.Value
            ?? throw new UnauthorizedAccessException("Token inválido.");
        return int.Parse(claim);
    }
}