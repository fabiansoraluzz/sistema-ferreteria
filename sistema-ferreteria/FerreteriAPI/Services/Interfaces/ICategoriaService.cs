using FerreteriAPI.DTOs.Categorias;

namespace FerreteriAPI.Services.Interfaces;

public interface ICategoriaService
{
    Task<List<CategoriaResponse>> ObtenerTodasAsync();
    Task<CategoriaResponse> ObtenerPorIdAsync(int id);
    Task<CategoriaResponse> CrearAsync(CrearCategoriaRequest request, int usuarioId);
    Task<CategoriaResponse> ActualizarAsync(int id, ActualizarCategoriaRequest request, int usuarioId);
    Task DesactivarAsync(int id, int usuarioId);
}