using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IPedidoService _service;

    public DashboardController(IPedidoService service)
    {
        _service = service;
    }

    /// <summary>ObtenerResumenDia — Devuelve los KPIs del día: productos con stock bajo, pedidos pendientes, deuda total de clientes, ventas del mes y los últimos 5 pedidos.</summary>
    [HttpGet("ObtenerResumenDia")]
    public async Task<IActionResult> ObtenerResumenDia()
    {
        var resumen = await _service.ObtenerDashboardAsync();
        return Ok(resumen);
    }
}