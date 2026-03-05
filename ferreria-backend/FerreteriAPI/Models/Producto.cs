namespace FerreteriAPI.Models
{
    public class Producto : EntidadBase
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public int CategoriaId { get; set; }
        public string UnidadMedida { get; set; } = string.Empty;
        public decimal StockActual { get; set; }
        public decimal StockMinimo { get; set; }
        public decimal PrecioCompra { get; set; }
        public decimal PrecioVenta { get; set; }

        public Categoria Categoria { get; set; } = null!;
        public ICollection<MovimientoStock> Movimientos { get; set; } = [];
        public ICollection<DetallePedido> DetallesPedido { get; set; } = [];
    }

}
