using Microsoft.EntityFrameworkCore;
using FerreteriAPI.Data;
using FerreteriAPI.DTOs.Clientes;
using FerreteriAPI.Models;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Services;

public class ClienteService : IClienteService
{
    private readonly AppDbContext _db;

    public ClienteService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<ClienteResponse>> ObtenerTodosAsync(string? busqueda)
    {
        var query = _db.Clientes.Where(c => c.EstaActivo);

        if (!string.IsNullOrWhiteSpace(busqueda))
            query = query.Where(c =>
                c.NombreCompleto.ToLower().Contains(busqueda.ToLower()) ||
                c.Telefono.Contains(busqueda));

        var clientes = await query.OrderBy(c => c.NombreCompleto).ToListAsync();

        var resultado = new List<ClienteResponse>();
        foreach (var c in clientes)
        {
            decimal deuda = await CalcularDeudaAsync(c.Id);
            resultado.Add(ToResponse(c, deuda));
        }

        return resultado.OrderByDescending(c => c.DeudaTotal).ToList();
    }

    public async Task<ClienteResponse> ObtenerPorIdAsync(int id)
    {
        var cliente = await _db.Clientes
            .FirstOrDefaultAsync(c => c.Id == id && c.EstaActivo)
            ?? throw new KeyNotFoundException($"Cliente {id} no encontrado.");

        decimal deuda = await CalcularDeudaAsync(id);
        return ToResponse(cliente, deuda);
    }

    public async Task<ClienteResponse> CrearAsync(
        CrearClienteRequest request, int usuarioId)
    {
        var cliente = new Cliente
        {
            NombreCompleto = request.NombreCompleto.Trim(),
            Telefono = request.Telefono?.Trim() ?? "",
            CorreoElectronico = request.CorreoElectronico?.Trim(),
            Direccion = request.Direccion?.Trim(),
            Distrito = request.Distrito?.Trim(),
            TipoDocumento = request.TipoDocumento?.Trim(),
            NumeroDocumento = request.NumeroDocumento?.Trim(),
            CreadoPor = usuarioId,
            CreadoEn = DateTime.UtcNow,
            EstaActivo = true
        };

        _db.Clientes.Add(cliente);
        await _db.SaveChangesAsync();

        return ToResponse(cliente, 0);
    }

    public async Task<ClienteResponse> ActualizarAsync(
        int id, ActualizarClienteRequest request, int usuarioId)
    {
        var cliente = await _db.Clientes
            .FirstOrDefaultAsync(c => c.Id == id && c.EstaActivo)
            ?? throw new KeyNotFoundException($"Cliente {id} no encontrado.");

        cliente.NombreCompleto = request.NombreCompleto.Trim();
        cliente.Telefono = request.Telefono?.Trim() ?? "";
        cliente.CorreoElectronico = request.CorreoElectronico?.Trim();
        cliente.Direccion = request.Direccion?.Trim();
        cliente.Distrito = request.Distrito?.Trim();
        cliente.TipoDocumento = request.TipoDocumento?.Trim();
        cliente.NumeroDocumento = request.NumeroDocumento?.Trim();
        cliente.ModificadoPor = usuarioId;
        cliente.ModificadoEn = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        decimal deuda = await CalcularDeudaAsync(id);
        return ToResponse(cliente, deuda);
    }

    public async Task DesactivarAsync(int id, int usuarioId)
    {
        var cliente = await _db.Clientes
            .FirstOrDefaultAsync(c => c.Id == id && c.EstaActivo)
            ?? throw new KeyNotFoundException($"Cliente {id} no encontrado.");

        cliente.EstaActivo = false;
        cliente.ModificadoPor = usuarioId;
        cliente.ModificadoEn = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    public async Task<ClienteDetalleResponse> ObtenerDetalleConDeudaAsync(int id)
    {
        var cliente = await _db.Clientes
            .FirstOrDefaultAsync(c => c.Id == id && c.EstaActivo)
            ?? throw new KeyNotFoundException($"Cliente {id} no encontrado.");

        var pedidos = await _db.Pedidos
            .Where(p => p.ClienteId == id
                     && p.EstaActivo
                     && p.EstadoPedido != "Cancelado")
            .OrderByDescending(p => p.FechaPedido)
            .ToListAsync();

        var detallePedidos = pedidos.Select(p => new DeudaPedidoDetalle(
            p.Id,
            p.FechaPedido,
            p.FechaEntrega,
            p.EstadoPedido,
            p.Total,
            p.MontoPagado,
            p.Total - p.MontoPagado
        )).ToList();

        decimal deudaTotal = detallePedidos.Sum(p => p.SaldoPendiente);
        int pedidosPendientes = detallePedidos.Count(p => p.EstadoPedido == "Pendiente");

        return new ClienteDetalleResponse(
            cliente.Id,
            cliente.NombreCompleto,
            cliente.Telefono,
            cliente.CorreoElectronico,
            cliente.Direccion,
            cliente.Distrito,
            cliente.TipoDocumento,
            cliente.NumeroDocumento,
            deudaTotal,
            detallePedidos.Count,
            pedidosPendientes,
            detallePedidos,
            cliente.EstaActivo,
            cliente.CreadoEn
        );
    }

    private async Task<decimal> CalcularDeudaAsync(int clienteId)
    {
        return await _db.Pedidos
            .Where(p => p.ClienteId == clienteId
                     && p.EstaActivo
                     && p.EstadoPedido != "Cancelado")
            .SumAsync(p => p.Total - p.MontoPagado);
    }

    private static ClienteResponse ToResponse(Cliente c, decimal deuda) => new(
        c.Id, c.NombreCompleto, c.Telefono,
        c.CorreoElectronico, c.Direccion, c.Distrito,
        c.TipoDocumento, c.NumeroDocumento,
        deuda, c.EstaActivo, c.CreadoEn);
}