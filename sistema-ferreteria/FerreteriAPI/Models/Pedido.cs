using Microsoft.AspNetCore.Mvc.RazorPages;

namespace FerreteriAPI.Models
{
    public class Pedido : EntidadBase
    {
        public int Id { get; set; }
        public int ClienteId { get; set; }
        public string EstadoPedido { get; set; } = "Pendiente";
        public DateTime FechaPedido { get; set; } = DateTime.UtcNow;
        public DateTime? FechaEntrega { get; set; }
        public string? Observaciones { get; set; }
        public decimal Subtotal { get; set; }
        public decimal MontoImpuesto { get; set; }
        public decimal Total { get; set; }
        public decimal MontoPagado { get; set; }

        public Cliente Cliente { get; set; } = null!;
        public ICollection<DetallePedido> Detalles { get; set; } = [];
        public ICollection<Pago> Pagos { get; set; } = [];
        public Despacho? Despacho { get; set; }
        public ICollection<MovimientoStock> MovimientosStock { get; set; } = [];
    }
}
