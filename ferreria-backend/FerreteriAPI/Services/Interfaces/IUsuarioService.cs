using FerreteriAPI.DTOs.Usuarios;

namespace FerreteriAPI.Services.Interfaces;

public interface IUsuarioService
{
    Task<List<UsuarioResponse>> ObtenerTodosAsync();
    Task<UsuarioResponse> CrearAsync(CrearUsuarioRequest request, int usuarioId);
    Task<UsuarioResponse> ActualizarAsync(int id, ActualizarUsuarioRequest request, int usuarioId);
    Task DesactivarAsync(int id, int usuarioId);
}