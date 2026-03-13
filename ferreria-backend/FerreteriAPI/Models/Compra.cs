namespace FerreteriAPI.Models
{
    public class Compra : EntidadBase
    {
        public int Id { get; set; }
        public int ProveedorId { get; set; }
        public string NumeroFactura { get; set; } = "";
        public DateTime FechaCompra { get; set; } = DateTime.UtcNow;
        public string? Observaciones { get; set; }
        public decimal Total { get; set; }

        public Proveedor Proveedor { get; set; } = null!;
        public ICollection<DetalleCompra> Detalles { get; set; } = [];
        public ICollection<MovimientoStock> MovimientosStock { get; set; } = [];
    }
}
