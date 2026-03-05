using Microsoft.EntityFrameworkCore;
using FerreteriAPI.Data;
using FerreteriAPI.DTOs.Pagos;
using FerreteriAPI.Models;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Services;

public class PagoService : IPagoService
{
    private readonly AppDbContext _db;

    public PagoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<PagoResponse>> ObtenerPorClienteAsync(int clienteId)
    {
        return await _db.Pagos
            .Include(p => p.Cliente)
            .Where(p => p.ClienteId == clienteId && p.EstaActivo)
            .OrderByDescending(p => p.FechaPago)
            .Select(p => ToResponse(p))
            .ToListAsync();
    }

    public async Task<List<PagoResponse>> ObtenerPorPedidoAsync(int pedidoId)
    {
        return await _db.Pagos
            .Include(p => p.Cliente)
            .Where(p => p.PedidoId == pedidoId && p.EstaActivo)
            .OrderByDescending(p => p.FechaPago)
            .Select(p => ToResponse(p))
            .ToListAsync();
    }

    public async Task<List<CuentaPorCobrarResponse>> ObtenerCuentasPorCobrarAsync()
    {
        var hoy = DateTime.UtcNow;

        return await _db.Pedidos
            .Include(p => p.Cliente)
            .Where(p => p.EstaActivo
                     && p.EstadoPedido != "Cancelado"
                     && p.Total > p.MontoPagado)
            .OrderBy(p => p.FechaEntrega)
            .Select(p => new CuentaPorCobrarResponse(
                p.Id,
                p.ClienteId,
                p.Cliente.NombreCompleto,
                p.Cliente.Telefono,
                p.FechaPedido,
                p.FechaEntrega,
                p.EstadoPedido,
                p.Total,
                p.MontoPagado,
                p.Total - p.MontoPagado,
                p.FechaEntrega.HasValue && p.FechaEntrega.Value < hoy
                    && p.EstadoPedido != "Entregado"
            ))
            .ToListAsync();
    }

    public async Task<ResumenCobranzaResponse> ObtenerResumenCobranzaAsync()
    {
        var inicioMes = new DateTime(
            DateTime.UtcNow.Year,
            DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        decimal totalFacturado = await _db.Pedidos
            .Where(p => p.EstaActivo
                     && p.EstadoPedido != "Cancelado"
                     && p.FechaPedido >= inicioMes)
            .SumAsync(p => p.Total);

        decimal totalCobrado = await _db.Pagos
            .Where(p => p.EstaActivo && p.FechaPago >= inicioMes)
            .SumAsync(p => p.Monto);

        int pendientesPago = await _db.Pedidos
            .CountAsync(p => p.EstaActivo
                          && p.EstadoPedido != "Cancelado"
                          && p.Total > p.MontoPagado);

        var cuentas = await ObtenerCuentasPorCobrarAsync();

        return new ResumenCobranzaResponse(
            totalFacturado,
            totalCobrado,
            totalFacturado - totalCobrado,
            pendientesPago,
            cuentas
        );
    }

    public async Task<PagoResponse> RegistrarPagoAsync(
        RegistrarPagoRequest request, int usuarioId)
    {
        // Valida método de pago
        var metodosValidos = new[] { "Efectivo", "Transferencia", "Yape", "Plin", "Cheque" };
        if (!metodosValidos.Contains(request.MetodoPago))
            throw new InvalidOperationException(
                "Método de pago inválido. Use: Efectivo, Transferencia, Yape, Plin o Cheque.");

        var pedido = await _db.Pedidos
            .Include(p => p.Cliente)
            .FirstOrDefaultAsync(p => p.Id == request.PedidoId && p.EstaActivo)
            ?? throw new KeyNotFoundException($"Pedido {request.PedidoId} no encontrado.");

        if (pedido.EstadoPedido == "Cancelado")
            throw new InvalidOperationException(
                "No se puede registrar un pago en un pedido cancelado.");

        if (request.Monto <= 0)
            throw new InvalidOperationException("El monto del pago debe ser mayor a cero.");

        decimal saldoPendiente = pedido.Total - pedido.MontoPagado;

        if (request.Monto > saldoPendiente)
            throw new InvalidOperationException(
                $"El monto ingresado (S/ {request.Monto}) supera el saldo pendiente (S/ {saldoPendiente}).");

        // Registra el pago
        var pago = new Pago
        {
            PedidoId = request.PedidoId,
            ClienteId = pedido.ClienteId,
            Monto = request.Monto,
            FechaPago = DateTime.UtcNow,
            MetodoPago = request.MetodoPago,
            NumeroReferencia = request.NumeroReferencia?.Trim(),
            Observaciones = request.Observaciones?.Trim(),
            CreadoPor = usuarioId,
            CreadoEn = DateTime.UtcNow,
            EstaActivo = true
        };

        _db.Pagos.Add(pago);

        // Actualiza el monto pagado en el pedido
        pedido.MontoPagado += request.Monto;
        pedido.ModificadoPor = usuarioId;
        pedido.ModificadoEn = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        // Recarga cliente para el response
        await _db.Entry(pago).Reference(p => p.Cliente).LoadAsync();

        return ToResponse(pago);
    }

    private static PagoResponse ToResponse(Pago p) => new(
        p.Id,
        p.PedidoId,
        p.ClienteId,
        p.Cliente?.NombreCompleto ?? "",
        p.Monto,
        p.FechaPago,
        p.MetodoPago,
        p.NumeroReferencia,
        p.Observaciones,
        p.EstaActivo,
        p.CreadoEn);
}