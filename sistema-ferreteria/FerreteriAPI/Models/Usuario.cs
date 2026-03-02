namespace FerreteriAPI.Models
{
    public class Usuario : EntidadBase
    {
        public int Id { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string CorreoElectronico { get; set; } = string.Empty;
        public string ContrasenaHash { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;

        public ICollection<LogAuditoria> LogsCreados { get; set; } = [];
    }
}
