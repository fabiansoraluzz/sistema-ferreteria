using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using System.Text.Json;
using FerreteriAPI.Models;

namespace FerreteriAPI.Helpers;

public class AuditoriaInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditoriaInterceptor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context is null)
            return await base.SavingChangesAsync(eventData, result, cancellationToken);

        var logs = GenerarLogs(eventData.Context);

        if (logs.Any())
            await eventData.Context.Set<LogAuditoria>()
                .AddRangeAsync(logs, cancellationToken);

        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private List<LogAuditoria> GenerarLogs(DbContext context)
    {
        var logs = new List<LogAuditoria>();
        var httpContext = _httpContextAccessor.HttpContext;

        var usuarioIdClaim = httpContext?.User?.FindFirst("id")?.Value;
        var rolClaim = httpContext?.User?.FindFirst("rol")?.Value ?? "Sistema";
        var ip = httpContext?.Connection?.RemoteIpAddress?.ToString()
                            ?? "desconocido";

        if (!int.TryParse(usuarioIdClaim, out int usuarioId))
            return logs;

        var tiposIgnorados = new[] { typeof(LogAuditoria) };

        foreach (var entry in context.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added
                             or EntityState.Modified
                             or EntityState.Deleted
                     && !tiposIgnorados.Contains(e.Entity.GetType())))
        {
            string accion = entry.State switch
            {
                EntityState.Added => "CREAR",
                EntityState.Modified => EsDesactivacion(entry)
                                        ? "DESACTIVAR" : "MODIFICAR",
                EntityState.Deleted => "ELIMINAR",
                _ => "MODIFICAR"
            };

            string? valoresAnteriores = null;
            if (entry.State == EntityState.Modified)
            {
                var anteriores = entry.OriginalValues.Properties
                    .ToDictionary(p => p.Name, p => entry.OriginalValues[p]);
                valoresAnteriores = JsonSerializer.Serialize(anteriores);
            }

            string? valoresNuevos = null;
            if (entry.State != EntityState.Deleted)
            {
                var nuevos = entry.CurrentValues.Properties
                    .ToDictionary(p => p.Name, p => entry.CurrentValues[p]);
                valoresNuevos = JsonSerializer.Serialize(nuevos);
            }

            int? entidadId = null;
            var idProp = entry.Properties
                .FirstOrDefault(p => p.Metadata.Name == "Id");
            if (idProp?.CurrentValue is int id)
                entidadId = id;

            logs.Add(new LogAuditoria
            {
                UsuarioId = usuarioId,
                RolUsuario = rolClaim,
                Accion = accion,
                Modulo = entry.Entity.GetType().Name,
                EntidadId = entidadId,
                ValoresAnteriores = valoresAnteriores,
                ValoresNuevos = valoresNuevos,
                Descripcion = $"{accion} en {entry.Entity.GetType().Name}" +
                                    $" (Id: {entidadId})",
                DireccionIP = ip,
                CreadoEn = DateTime.UtcNow
            });
        }

        return logs;
    }

    private static bool EsDesactivacion(
        Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
    {
        var prop = entry.Properties
            .FirstOrDefault(p => p.Metadata.Name == "EstaActivo");
        return prop is not null
            && prop.OriginalValue is true
            && prop.CurrentValue is false;
    }
}