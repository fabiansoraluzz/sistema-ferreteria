using FerreteriAPI.DTOs.Compras;

namespace FerreteriAPI.Services.Interfaces;

public interface ICompraService
{
    Task<List<CompraResumenResponse>> ObtenerTodosAsync(int? proveedorId);
    Task<CompraResponse> ObtenerPorIdAsync(int id);
    Task<CompraResponse> CrearAsync(CrearCompraRequest request, int usuarioId);
}