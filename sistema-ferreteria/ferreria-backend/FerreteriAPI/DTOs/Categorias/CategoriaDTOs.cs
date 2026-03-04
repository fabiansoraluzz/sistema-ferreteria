namespace FerreteriAPI.DTOs.Categorias;

// ── Entrada ───────────────────────────────────────────────────────────────────
public record CrearCategoriaRequest(
    string Nombre,
    string? Descripcion
);

public record ActualizarCategoriaRequest(
    string Nombre,
    string? Descripcion
);

// ── Salida ────────────────────────────────────────────────────────────────────
public record CategoriaResponse(
    int Id,
    string Nombre,
    string? Descripcion,
    bool EstaActivo,
    int CreadoPor,
    DateTime CreadoEn
);