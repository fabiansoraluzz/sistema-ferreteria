using Microsoft.AspNetCore.Mvc.RazorPages;

namespace FerreteriAPI.Models
{
    public class Cliente : EntidadBase
    {
        public int Id { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string? CorreoElectronico { get; set; }
        public string? Direccion { get; set; }
        public string? Distrito { get; set; }
        public string? TipoDocumento { get; set; }
        public string? NumeroDocumento { get; set; }

        public ICollection<Pedido> Pedidos { get; set; } = [];
        public ICollection<Pago> Pagos { get; set; } = [];
    }
}
