namespace FerreteriAPI.DTOs.Productos;

public record CrearProductoRequest(
    string Nombre,
    string? Descripcion,
    int CategoriaId,
    string UnidadMedida,
    decimal StockInicial,
    decimal StockMinimo,
    decimal PrecioCompra,
    decimal PrecioVenta
);

public record ActualizarProductoRequest(
    string Nombre,
    string? Descripcion,
    int CategoriaId,
    string UnidadMedida,
    decimal StockMinimo,
    decimal PrecioCompra,
    decimal PrecioVenta
);

public record EntradaStockRequest(
    decimal Cantidad,
    string? Motivo
);

public record ProductoResponse(
    int Id,
    string Nombre,
    string? Descripcion,
    int CategoriaId,
    string NombreCategoria,
    string UnidadMedida,
    decimal StockActual,
    decimal StockMinimo,
    decimal PrecioCompra,
    decimal PrecioVenta,
    bool TieneStockBajo,
    bool EstaActivo,
    DateTime CreadoEn
);

public record ProductoResumenResponse(
    int Id,
    string Nombre,
    string UnidadMedida,
    decimal StockActual,
    decimal StockMinimo,
    bool TieneStockBajo
);