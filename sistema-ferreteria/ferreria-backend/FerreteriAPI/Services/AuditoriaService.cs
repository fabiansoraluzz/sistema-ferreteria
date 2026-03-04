using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using System.Text;
using FerreteriAPI.Data;
using FerreteriAPI.DTOs.Auditoria;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Services;

public class AuditoriaService : IAuditoriaService
{
    private readonly AppDbContext _db;

    public AuditoriaService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<LogAuditoriaResponse>> ObtenerLogsAsync(
        FiltroAuditoriaRequest filtro)
    {
        var query = _db.LogsAuditoria
            .Include(l => l.Usuario)
            .AsQueryable();

        if (filtro.UsuarioId.HasValue)
            query = query.Where(l => l.UsuarioId == filtro.UsuarioId.Value);

        if (!string.IsNullOrWhiteSpace(filtro.Accion))
            query = query.Where(l => l.Accion == filtro.Accion);

        if (!string.IsNullOrWhiteSpace(filtro.Modulo))
            query = query.Where(l => l.Modulo == filtro.Modulo);

        if (filtro.FechaDesde.HasValue)
        {
            var desde = DateTime.SpecifyKind(filtro.FechaDesde.Value, DateTimeKind.Utc);
            query = query.Where(l => l.CreadoEn >= desde);
        }

        if (filtro.FechaHasta.HasValue)
        {
            var hasta = DateTime.SpecifyKind(
                filtro.FechaHasta.Value.Date.AddDays(1).AddSeconds(-1),
                DateTimeKind.Utc);
            query = query.Where(l => l.CreadoEn <= hasta);
        }

        return await query
            .OrderByDescending(l => l.CreadoEn)
            .Select(l => ToResponse(l))
            .ToListAsync();
    }

    public async Task<LogAuditoriaResponse> ObtenerDetallePorIdAsync(int id)
    {
        var log = await _db.LogsAuditoria
            .Include(l => l.Usuario)
            .FirstOrDefaultAsync(l => l.Id == id)
            ?? throw new KeyNotFoundException($"Log de auditoría {id} no encontrado.");

        return ToResponse(log);
    }

    public async Task<byte[]> ExportarExcelAsync(FiltroAuditoriaRequest filtro)
    {
        var items = await ObtenerLogsAsync(filtro);

        using var workbook = new XLWorkbook();
        var worksheet = workbook.Worksheets.Add("Log de Auditoría");

        var encabezados = new[]
        {
            "Id", "Usuario", "Rol", "Acción", "Módulo",
            "Id Entidad", "Descripción", "IP", "Fecha y Hora"
        };

        for (int i = 0; i < encabezados.Length; i++)
        {
            var celda = worksheet.Cell(1, i + 1);
            celda.Value = encabezados[i];
            celda.Style.Font.Bold = true;
            celda.Style.Fill.BackgroundColor = XLColor.FromHtml("#2563EB");
            celda.Style.Font.FontColor = XLColor.White;
            celda.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
        }

        int fila = 2;
        foreach (var log in items)
        {
            worksheet.Cell(fila, 1).Value = log.Id;
            worksheet.Cell(fila, 2).Value = log.NombreUsuario;
            worksheet.Cell(fila, 3).Value = log.RolUsuario;
            worksheet.Cell(fila, 4).Value = log.Accion;
            worksheet.Cell(fila, 5).Value = log.Modulo;
            worksheet.Cell(fila, 6).Value = log.EntidadId?.ToString() ?? "-";
            worksheet.Cell(fila, 7).Value = log.Descripcion ?? "-";
            worksheet.Cell(fila, 8).Value = log.DireccionIP ?? "-";
            worksheet.Cell(fila, 9).Value = log.CreadoEn.ToString("dd/MM/yyyy HH:mm:ss");

            if (fila % 2 == 0)
                worksheet.Row(fila).Style.Fill.BackgroundColor =
                    XLColor.FromHtml("#F1F5F9");

            fila++;
        }

        worksheet.Columns().AdjustToContents();

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public async Task<byte[]> ExportarCsvAsync(FiltroAuditoriaRequest filtro)
    {
        var items = await ObtenerLogsAsync(filtro);

        var sb = new StringBuilder();
        sb.AppendLine("Id,Usuario,Rol,Accion,Modulo,IdEntidad,Descripcion,IP,FechaHora");

        foreach (var log in items)
        {
            sb.AppendLine(string.Join(",",
                log.Id,
                $"\"{log.NombreUsuario}\"",
                log.RolUsuario,
                log.Accion,
                log.Modulo,
                log.EntidadId?.ToString() ?? "",
                $"\"{log.Descripcion?.Replace("\"", "'") ?? ""}\"",
                log.DireccionIP ?? "",
                log.CreadoEn.ToString("dd/MM/yyyy HH:mm:ss")
            ));
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static LogAuditoriaResponse ToResponse(Models.LogAuditoria l) => new(
        l.Id,
        l.UsuarioId,
        l.Usuario?.NombreCompleto ?? "",
        l.RolUsuario,
        l.Accion,
        l.Modulo,
        l.EntidadId,
        l.ValoresAnteriores,
        l.ValoresNuevos,
        l.Descripcion,
        l.DireccionIP,
        l.CreadoEn);
}