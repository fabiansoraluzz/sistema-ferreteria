using FerreteriAPI.DTOs.Clientes;

namespace FerreteriAPI.Services.Interfaces;

public interface IClienteService
{
    Task<List<ClienteResponse>> ObtenerTodosAsync(string? busqueda);
    Task<ClienteResponse> ObtenerPorIdAsync(int id);
    Task<ClienteDetalleResponse> ObtenerDetalleConDeudaAsync(int id);
    Task<ClienteResponse> CrearAsync(CrearClienteRequest request, int usuarioId);
    Task<ClienteResponse> ActualizarAsync(int id, ActualizarClienteRequest request, int usuarioId);
    Task DesactivarAsync(int id, int usuarioId);
}