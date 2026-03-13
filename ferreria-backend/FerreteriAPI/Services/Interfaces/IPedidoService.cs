using FerreteriAPI.DTOs.Pedidos;

namespace FerreteriAPI.Services.Interfaces;

public interface IPedidoService
{
    Task<List<PedidoResumenResponse>> ObtenerTodosAsync(string? estado, int? clienteId);
    Task<PedidoResponse> ObtenerPorIdAsync(int id);
    Task<PedidoResponse> CrearAsync(CrearPedidoRequest request, int usuarioId);
    Task<PedidoResponse> CambiarEstadoAsync(int id, CambiarEstadoPedidoRequest request, int usuarioId);
    Task<PedidoResponse> CancelarAsync(int id, CancelarPedidoRequest request, int usuarioId);
    Task<DashboardResponse> ObtenerDashboardAsync();
    Task<PedidoResponse> ActualizarDocumentoFiscalAsync(int id, ActualizarDocumentoFiscalRequest request, int usuarioId);

}