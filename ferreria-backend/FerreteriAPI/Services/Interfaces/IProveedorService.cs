using FerreteriAPI.DTOs.Proveedores;

namespace FerreteriAPI.Services.Interfaces;

public interface IProveedorService
{
    Task<List<ProveedorResponse>> ObtenerTodosAsync();
    Task<ProveedorResponse> ObtenerPorIdAsync(int id);
    Task<ProveedorResponse> CrearAsync(CrearProveedorRequest request, int usuarioId);
    Task<ProveedorResponse> ActualizarAsync(int id, ActualizarProveedorRequest request, int usuarioId);
    Task EliminarAsync(int id, int usuarioId);
}