namespace FerreteriAPI.Models
{
    public class MovimientoStock : EntidadBase
    {
        public int Id { get; set; }
        public int ProductoId { get; set; }
        public string TipoMovimiento { get; set; } = string.Empty;
        public decimal Cantidad { get; set; }
        public decimal StockAnterior { get; set; }
        public decimal StockResultante { get; set; }
        public string? Motivo { get; set; }
        public int? PedidoId { get; set; }

        public Producto Producto { get; set; } = null!;
        public Pedido? Pedido { get; set; }
    }
}
