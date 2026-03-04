using FerreteriAPI.DTOs.Productos;

namespace FerreteriAPI.Services.Interfaces;

public interface IProductoService
{
    Task<List<ProductoResponse>> ObtenerTodosAsync(string? busqueda);
    Task<List<ProductoResumenResponse>> ObtenerAlertasStockAsync();
    Task<ProductoResponse> ObtenerPorIdAsync(int id);
    Task<ProductoResponse> CrearAsync(CrearProductoRequest request, int usuarioId);
    Task<ProductoResponse> ActualizarAsync(int id, ActualizarProductoRequest request, int usuarioId);
    Task<ProductoResponse> RegistrarEntradaStockAsync(int id, EntradaStockRequest request, int usuarioId);
    Task DesactivarAsync(int id, int usuarioId);
}