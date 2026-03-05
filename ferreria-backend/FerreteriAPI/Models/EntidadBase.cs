namespace FerreteriAPI.Models
{
    public abstract class EntidadBase
    {
        public bool EstaActivo { get; set; } = true;
        public int CreadoPor { get; set; }
        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;
        public int? ModificadoPor { get; set; }
        public DateTime? ModificadoEn { get; set; }
    }
}
