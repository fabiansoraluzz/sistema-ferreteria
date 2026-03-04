using FerreteriAPI.DTOs.Auditoria;

namespace FerreteriAPI.Services.Interfaces;

public interface IAuditoriaService
{
    Task<List<LogAuditoriaResponse>> ObtenerLogsAsync(FiltroAuditoriaRequest filtro);
    Task<LogAuditoriaResponse> ObtenerDetallePorIdAsync(int id);
    Task<byte[]> ExportarExcelAsync(FiltroAuditoriaRequest filtro);
    Task<byte[]> ExportarCsvAsync(FiltroAuditoriaRequest filtro);
}