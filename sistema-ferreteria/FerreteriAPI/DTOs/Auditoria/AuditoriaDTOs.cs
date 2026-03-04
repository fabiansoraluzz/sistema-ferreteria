namespace FerreteriAPI.DTOs.Auditoria;

// ── Filtros de búsqueda ───────────────────────────────────────────────────────
public record FiltroAuditoriaRequest(
    int? UsuarioId,
    string? Accion,
    string? Modulo,
    DateTime? FechaDesde,
    DateTime? FechaHasta,
    int Pagina = 1,
    int TamanoPagina = 50
);

// ── Salida ────────────────────────────────────────────────────────────────────
public record LogAuditoriaResponse(
    int Id,
    int UsuarioId,
    string NombreUsuario,
    string RolUsuario,
    string Accion,
    string Modulo,
    int? EntidadId,
    string? ValoresAnteriores,
    string? ValoresNuevos,
    string? Descripcion,
    string? DireccionIP,
    DateTime CreadoEn
);

public record PaginadoResponse<T>(
    List<T> Items,
    int TotalRegistros,
    int Pagina,
    int TamanoPagina,
    int TotalPaginas
);