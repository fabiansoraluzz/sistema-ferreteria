using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FerreteriAPI.DTOs.Auditoria;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrador")]
[Tags("Auditoria")]
public class AuditoriaController : ControllerBase
{
    private readonly IAuditoriaService _service;

    public AuditoriaController(IAuditoriaService service)
    {
        _service = service;
    }

    /// <summary>ObtenerLogs — Lista todos los eventos de auditoría. Filtra por usuario, acción, módulo y rango de fechas. La paginación se maneja en el frontend. Solo Administrador.</summary>
    [HttpGet("ObtenerLogs")]
    public async Task<IActionResult> ObtenerLogs(
        [FromQuery] int? usuarioId,
        [FromQuery] string? accion,
        [FromQuery] string? modulo,
        [FromQuery] DateTime? fechaDesde,
        [FromQuery] DateTime? fechaHasta)
    {
        var filtro = new FiltroAuditoriaRequest(
            usuarioId, accion, modulo, fechaDesde, fechaHasta);

        var logs = await _service.ObtenerLogsAsync(filtro);
        return Ok(logs);
    }

    /// <summary>ObtenerDetalleLog — Devuelve el detalle completo de un evento incluyendo valores anteriores y nuevos en JSON. Solo Administrador.</summary>
    [HttpGet("ObtenerDetalleLog/{id}")]
    public async Task<IActionResult> ObtenerDetalleLog(int id)
    {
        var log = await _service.ObtenerDetallePorIdAsync(id);
        return Ok(log);
    }

    /// <summary>ExportarExcel — Exporta el log filtrado a Excel (.xlsx). Solo Administrador.</summary>
    [HttpGet("ExportarExcel")]
    public async Task<IActionResult> ExportarExcel(
        [FromQuery] int? usuarioId,
        [FromQuery] string? accion,
        [FromQuery] string? modulo,
        [FromQuery] DateTime? fechaDesde,
        [FromQuery] DateTime? fechaHasta)
    {
        var filtro = new FiltroAuditoriaRequest(
            usuarioId, accion, modulo, fechaDesde, fechaHasta);

        var bytes = await _service.ExportarExcelAsync(filtro);

        return File(bytes,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"auditoria_{DateTime.UtcNow:yyyyMMdd_HHmmss}.xlsx");
    }

    /// <summary>ExportarCsv — Exporta el log filtrado a CSV. Solo Administrador.</summary>
    [HttpGet("ExportarCsv")]
    public async Task<IActionResult> ExportarCsv(
        [FromQuery] int? usuarioId,
        [FromQuery] string? accion,
        [FromQuery] string? modulo,
        [FromQuery] DateTime? fechaDesde,
        [FromQuery] DateTime? fechaHasta)
    {
        var filtro = new FiltroAuditoriaRequest(
            usuarioId, accion, modulo, fechaDesde, fechaHasta);

        var bytes = await _service.ExportarCsvAsync(filtro);

        return File(bytes,
            "text/csv",
            $"auditoria_{DateTime.UtcNow:yyyyMMdd_HHmmss}.csv");
    }
}