namespace FerreteriAPI.Models
{
    public class Proveedor : EntidadBase
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = "";
        public string? Ruc { get; set; }
        public string? Telefono { get; set; }
        public string? Direccion { get; set; }

        public ICollection<Compra> Compras { get; set; } = [];
    }
}
