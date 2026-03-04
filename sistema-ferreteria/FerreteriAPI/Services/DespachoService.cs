using Microsoft.EntityFrameworkCore;
using FerreteriAPI.Data;
using FerreteriAPI.DTOs.Despachos;
using FerreteriAPI.Models;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Services;

public class DespachoService : IDespachoService
{
    private readonly AppDbContext _db;

    private static readonly Dictionary<string, string> _siguienteEstado = new()
    {
        { "Pendiente",   "Despachado" },
        { "Despachado",  "EnTransito" },
        { "EnTransito",  "Entregado"  }
    };

    public DespachoService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<DespachoResponse>> ObtenerTodosAsync(string? estado)
    {
        var query = _db.Despachos
            .Include(d => d.Pedido)
                .ThenInclude(p => p.Cliente)
            .Where(d => d.EstaActivo);

        if (!string.IsNullOrWhiteSpace(estado))
            query = query.Where(d => d.EstadoDespacho == estado);

        return await query
            .OrderByDescending(d => d.CreadoEn)
            .Select(d => ToResponse(d))
            .ToListAsync();
    }

    public async Task<DespachoResponse> ObtenerPorIdAsync(int id)
    {
        var despacho = await _db.Despachos
            .Include(d => d.Pedido)
                .ThenInclude(p => p.Cliente)
            .FirstOrDefaultAsync(d => d.Id == id && d.EstaActivo)
            ?? throw new KeyNotFoundException($"Despacho {id} no encontrado.");

        return ToResponse(despacho);
    }

    public async Task<DespachoResponse> CrearAsync(
        CrearDespachoRequest request, int usuarioId)
    {
        // Valida tipo de despacho
        if (request.TipoDespacho != "Lima" && request.TipoDespacho != "Provincia")
            throw new InvalidOperationException(
                "TipoDespacho debe ser 'Lima' o 'Provincia'.");

        // Provincia requiere transportista
        if (request.TipoDespacho == "Provincia" &&
            string.IsNullOrWhiteSpace(request.NombreTransportista))
            throw new InvalidOperationException(
                "El despacho a Provincia requiere el nombre del transportista.");

        var pedido = await _db.Pedidos
            .Include(p => p.Cliente)
            .FirstOrDefaultAsync(p => p.Id == request.PedidoId && p.EstaActivo)
            ?? throw new KeyNotFoundException($"Pedido {request.PedidoId} no encontrado.");

        if (pedido.EstadoPedido == "Cancelado")
            throw new InvalidOperationException(
                "No se puede crear un despacho para un pedido cancelado.");

        if (pedido.EstadoPedido == "Pendiente")
            throw new InvalidOperationException(
                "El pedido debe estar Confirmado antes de crear el despacho.");

        // Verifica que no tenga ya un despacho activo
        bool yaExiste = await _db.Despachos
            .AnyAsync(d => d.PedidoId == request.PedidoId && d.EstaActivo);

        if (yaExiste)
            throw new InvalidOperationException(
                "Este pedido ya tiene un despacho registrado.");

        var despacho = new Despacho
        {
            PedidoId = request.PedidoId,
            TipoDespacho = request.TipoDespacho,
            NombreTransportista = request.NombreTransportista?.Trim(),
            TelefonoTransportista = request.TelefonoTransportista?.Trim(),
            NotaSeguimiento = request.NotaSeguimiento?.Trim(),
            FechaDespacho = request.FechaDespacho,
            EstadoDespacho = "Pendiente",
            CreadoPor = usuarioId,
            CreadoEn = DateTime.UtcNow,
            EstaActivo = true
        };

        _db.Despachos.Add(despacho);
        await _db.SaveChangesAsync();

        await _db.Entry(despacho).Reference(d => d.Pedido).LoadAsync();
        await _db.Entry(despacho.Pedido).Reference(p => p.Cliente).LoadAsync();

        return ToResponse(despacho);
    }

    public async Task<DespachoResponse> ActualizarEstadoAsync(
        int id, ActualizarEstadoDespachoRequest request, int usuarioId)
    {
        var despacho = await _db.Despachos
            .Include(d => d.Pedido)
                .ThenInclude(p => p.Cliente)
            .FirstOrDefaultAsync(d => d.Id == id && d.EstaActivo)
            ?? throw new KeyNotFoundException($"Despacho {id} no encontrado.");

        if (despacho.EstadoDespacho == "Entregado")
            throw new InvalidOperationException(
                "El despacho ya fue entregado y no puede cambiar de estado.");

        if (!_siguienteEstado.TryGetValue(
                despacho.EstadoDespacho, out var estadoEsperado)
            || estadoEsperado != request.NuevoEstado)
        {
            throw new InvalidOperationException(
                $"El estado '{request.NuevoEstado}' no es válido. " +
                $"El siguiente estado debe ser '{estadoEsperado}'.");
        }

        despacho.EstadoDespacho = request.NuevoEstado;
        despacho.ModificadoPor = usuarioId;
        despacho.ModificadoEn = DateTime.UtcNow;

        // Si el despacho llega a Entregado, actualiza también el pedido
        if (request.NuevoEstado == "Entregado")
        {
            despacho.Pedido.EstadoPedido = "Entregado";
            despacho.Pedido.ModificadoPor = usuarioId;
            despacho.Pedido.ModificadoEn = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return ToResponse(despacho);
    }

    private static DespachoResponse ToResponse(Despacho d) => new(
        d.Id,
        d.PedidoId,
        d.Pedido?.Cliente?.NombreCompleto ?? "",
        d.Pedido?.Cliente?.Telefono ?? "",
        d.TipoDespacho,
        d.NombreTransportista,
        d.TelefonoTransportista,
        d.NotaSeguimiento,
        d.FechaDespacho,
        d.EstadoDespacho,
        d.EstaActivo,
        d.CreadoEn);
}