namespace FerreteriAPI.Models
{
    public class Despacho : EntidadBase
    {
        public int Id { get; set; }
        public int PedidoId { get; set; }
        public string TipoDespacho { get; set; } = string.Empty;
        public string? NombreTransportista { get; set; }
        public string? TelefonoTransportista { get; set; }
        public string? NotaSeguimiento { get; set; }
        public DateTime? FechaDespacho { get; set; }
        public string EstadoDespacho { get; set; } = "Pendiente";

        public Pedido Pedido { get; set; } = null!;
    }
}
