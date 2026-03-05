using FerreteriAPI.DTOs.Despachos;

namespace FerreteriAPI.Services.Interfaces;

public interface IDespachoService
{
    Task<List<DespachoResponse>> ObtenerTodosAsync(string? estado);
    Task<DespachoResponse> ObtenerPorIdAsync(int id);
    Task<DespachoResponse> CrearAsync(CrearDespachoRequest request, int usuarioId);
    Task<DespachoResponse> ActualizarEstadoAsync(int id, ActualizarEstadoDespachoRequest request, int usuarioId);
}