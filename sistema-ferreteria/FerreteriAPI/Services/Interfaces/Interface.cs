using FerreteriAPI.DTOs.Pagos;

namespace FerreteriAPI.Services.Interfaces;

public interface IPagoService
{
    Task<List<PagoResponse>> ObtenerPorClienteAsync(int clienteId);
    Task<List<PagoResponse>> ObtenerPorPedidoAsync(int pedidoId);
    Task<ResumenCobranzaResponse> ObtenerResumenCobranzaAsync();
    Task<List<CuentaPorCobrarResponse>> ObtenerCuentasPorCobrarAsync();
    Task<PagoResponse> RegistrarPagoAsync(RegistrarPagoRequest request, int usuarioId);
}