namespace FerreteriAPI.Models
{
    public class LogAuditoria
    {
        public int Id { get; set; }
        public int UsuarioId { get; set; }
        public string RolUsuario { get; set; } = string.Empty;
        public string Accion { get; set; } = string.Empty;
        public string Modulo { get; set; } = string.Empty;
        public int? EntidadId { get; set; }
        public string? ValoresAnteriores { get; set; }
        public string? ValoresNuevos { get; set; }
        public string? Descripcion { get; set; }
        public string? DireccionIP { get; set; }
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

        public Usuario Usuario { get; set; } = null!;
    }
}
