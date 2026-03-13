namespace FerreteriAPI.Models
{
    public class DetalleCompra : EntidadBase
    {
        public int Id { get; set; }
        public int CompraId { get; set; }
        public int ProductoId { get; set; }
        public decimal Cantidad { get; set; }

        public Compra Compra { get; set; } = null!;
        public Producto Producto { get; set; } = null!;
    }
}
