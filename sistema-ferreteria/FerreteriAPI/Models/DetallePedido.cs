namespace FerreteriAPI.Models
{
    public class DetallePedido : EntidadBase
    {
        public int Id { get; set; }
        public int PedidoId { get; set; }
        public int ProductoId { get; set; }
        public decimal Cantidad { get; set; }
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }

        public Pedido Pedido { get; set; } = null!;
        public Producto Producto { get; set; } = null!;
    }
}
