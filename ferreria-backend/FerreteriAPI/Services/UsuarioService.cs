using Microsoft.EntityFrameworkCore;
using FerreteriAPI.Data;
using FerreteriAPI.DTOs.Usuarios;
using FerreteriAPI.Models;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Services;

public class UsuarioService : IUsuarioService
{
    private readonly AppDbContext _db;

    public UsuarioService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<UsuarioResponse>> ObtenerTodosAsync()
    {
        var usuarios = await _db.Usuarios
            .OrderBy(u => u.NombreCompleto)
            .ToListAsync();

        return usuarios.Select(ToResponse).ToList();
    }

    public async Task<UsuarioResponse> CrearAsync(CrearUsuarioRequest request, int usuarioId)
    {
        var existe = await _db.Usuarios
            .AnyAsync(u => u.CorreoElectronico == request.CorreoElectronico.Trim().ToLower());

        if (existe)
            throw new InvalidOperationException("Ya existe un usuario con ese correo electrónico.");

        var usuario = new Usuario
        {
            NombreCompleto = request.NombreCompleto.Trim(),
            CorreoElectronico = request.CorreoElectronico.Trim().ToLower(),
            ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(request.Contrasena),
            Rol = request.Rol.Trim(),
            CreadoPor = usuarioId,
            CreadoEn = DateTime.UtcNow,
            EstaActivo = true,
        };

        _db.Usuarios.Add(usuario);
        await _db.SaveChangesAsync();

        return ToResponse(usuario);
    }

    public async Task<UsuarioResponse> ActualizarAsync(int id, ActualizarUsuarioRequest request, int usuarioId)
    {
        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id && u.EstaActivo)
            ?? throw new KeyNotFoundException($"Usuario {id} no encontrado.");

        var correoEnUso = await _db.Usuarios
            .AnyAsync(u => u.CorreoElectronico == request.CorreoElectronico.Trim().ToLower()
                        && u.Id != id);

        if (correoEnUso)
            throw new InvalidOperationException("Ya existe otro usuario con ese correo electrónico.");

        usuario.NombreCompleto = request.NombreCompleto.Trim();
        usuario.CorreoElectronico = request.CorreoElectronico.Trim().ToLower();
        usuario.Rol = request.Rol.Trim();
        usuario.ModificadoPor = usuarioId;
        usuario.ModificadoEn = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.NuevaContrasena))
            usuario.ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(request.NuevaContrasena);

        await _db.SaveChangesAsync();

        return ToResponse(usuario);
    }

    public async Task DesactivarAsync(int id, int usuarioId)
    {
        var usuario = await _db.Usuarios
            .FirstOrDefaultAsync(u => u.Id == id && u.EstaActivo)
            ?? throw new KeyNotFoundException($"Usuario {id} no encontrado.");

        if (usuario.Id == usuarioId)
            throw new InvalidOperationException("No puedes desactivar tu propio usuario.");

        usuario.EstaActivo = false;
        usuario.ModificadoPor = usuarioId;
        usuario.ModificadoEn = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    private static UsuarioResponse ToResponse(Usuario u) => new(
        u.Id,
        u.NombreCompleto,
        u.CorreoElectronico,
        u.Rol,
        u.EstaActivo,
        u.CreadoEn
    );
}