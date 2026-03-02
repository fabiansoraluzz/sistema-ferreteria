namespace FerreteriAPI.Models
{
    public class Pago : EntidadBase
    {
        public int Id { get; set; }
        public int PedidoId { get; set; }
        public int ClienteId { get; set; }
        public decimal Monto { get; set; }
        public DateTime FechaPago { get; set; } = DateTime.UtcNow;
        public string MetodoPago { get; set; } = string.Empty;
        public string? NumeroReferencia { get; set; }
        public string? Observaciones { get; set; }

        public Pedido Pedido { get; set; } = null!;
        public Cliente Cliente { get; set; } = null!;
    }
}
