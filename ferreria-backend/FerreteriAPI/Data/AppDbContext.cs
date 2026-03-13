using Microsoft.EntityFrameworkCore;
using FerreteriAPI.Models;

namespace FerreteriAPI.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Producto> Productos => Set<Producto>();
    public DbSet<Cliente> Clientes => Set<Cliente>();
    public DbSet<Pedido> Pedidos => Set<Pedido>();
    public DbSet<DetallePedido> DetallesPedido => Set<DetallePedido>();
    public DbSet<MovimientoStock> MovimientosStock => Set<MovimientoStock>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<Despacho> Despachos => Set<Despacho>();
    public DbSet<LogAuditoria> LogsAuditoria => Set<LogAuditoria>();
    public DbSet<Proveedor> Proveedores => Set<Proveedor>();
    public DbSet<Compra> Compras => Set<Compra>();
    public DbSet<DetalleCompra> DetallesCompra => Set<DetalleCompra>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Usuarios ──────────────────────────────────────────────────────
        modelBuilder.Entity<Usuario>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.CorreoElectronico).IsUnique();
            e.Property(u => u.NombreCompleto).HasMaxLength(150).IsRequired();
            e.Property(u => u.CorreoElectronico).HasMaxLength(100).IsRequired();
            e.Property(u => u.ContrasenaHash).HasMaxLength(255).IsRequired();
            e.Property(u => u.Rol).HasMaxLength(30).IsRequired();
            e.HasMany(u => u.LogsCreados)
             .WithOne(l => l.Usuario)
             .HasForeignKey(l => l.UsuarioId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Categorias ────────────────────────────────────────────────────
        modelBuilder.Entity<Categoria>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Nombre).HasMaxLength(100).IsRequired();
            e.Property(c => c.Descripcion).HasMaxLength(255);
        });

        // ── Productos ─────────────────────────────────────────────────────
        modelBuilder.Entity<Producto>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Nombre).HasMaxLength(200).IsRequired();
            e.Property(p => p.UnidadMedida).HasMaxLength(30).IsRequired();
            e.Property(p => p.StockActual).HasColumnType("decimal(10,2)");
            e.Property(p => p.StockMinimo).HasColumnType("decimal(10,2)");
            e.Property(p => p.PrecioCompra).HasColumnType("decimal(10,2)");
            e.Property(p => p.PrecioVenta).HasColumnType("decimal(10,2)");
            e.HasOne(p => p.Categoria)
             .WithMany(c => c.Productos)
             .HasForeignKey(p => p.CategoriaId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Clientes ──────────────────────────────────────────────────────
        modelBuilder.Entity<Cliente>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.NombreCompleto).HasMaxLength(150).IsRequired();
            e.Property(c => c.Telefono).HasMaxLength(20).IsRequired();
            e.Property(c => c.CorreoElectronico).HasMaxLength(100);
            e.Property(c => c.Direccion).HasMaxLength(255);
            e.Property(c => c.Distrito).HasMaxLength(100);
            e.Property(c => c.TipoDocumento).HasMaxLength(10);
            e.Property(c => c.NumeroDocumento).HasMaxLength(20);
        });

        // ── Pedidos ───────────────────────────────────────────────────────
        modelBuilder.Entity<Pedido>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.EstadoPedido).HasMaxLength(30).IsRequired();
            e.Property(p => p.TipoDocumentoFiscal).HasMaxLength(20).IsRequired();
            e.Property(p => p.Subtotal).HasColumnType("decimal(10,2)");
            e.Property(p => p.MontoImpuesto).HasColumnType("decimal(10,2)");
            e.Property(p => p.Total).HasColumnType("decimal(10,2)");
            e.Property(p => p.MontoPagado).HasColumnType("decimal(10,2)");
            e.HasOne(p => p.Cliente)
             .WithMany(c => c.Pedidos)
             .HasForeignKey(p => p.ClienteId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── DetallePedido ─────────────────────────────────────────────────
        modelBuilder.Entity<DetallePedido>(e =>
        {
            e.HasKey(d => d.Id);
            e.Property(d => d.Cantidad).HasColumnType("decimal(10,2)");
            e.Property(d => d.PrecioUnitario).HasColumnType("decimal(10,2)");
            e.Property(d => d.Subtotal).HasColumnType("decimal(10,2)");
            e.HasOne(d => d.Pedido)
             .WithMany(p => p.Detalles)
             .HasForeignKey(d => d.PedidoId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(d => d.Producto)
             .WithMany(p => p.DetallesPedido)
             .HasForeignKey(d => d.ProductoId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── MovimientoStock ───────────────────────────────────────────────
        modelBuilder.Entity<MovimientoStock>(e =>
        {
            e.HasKey(m => m.Id);
            e.Property(m => m.TipoMovimiento).HasMaxLength(20).IsRequired();
            e.Property(m => m.Cantidad).HasColumnType("decimal(10,2)");
            e.Property(m => m.StockAnterior).HasColumnType("decimal(10,2)");
            e.Property(m => m.StockResultante).HasColumnType("decimal(10,2)");
            e.Property(m => m.Motivo).HasMaxLength(255);
            e.HasOne(m => m.Producto)
             .WithMany(p => p.Movimientos)
             .HasForeignKey(m => m.ProductoId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(m => m.Pedido)
             .WithMany(p => p.MovimientosStock)
             .HasForeignKey(m => m.PedidoId)
             .IsRequired(false)
             .OnDelete(DeleteBehavior.SetNull);
            e.HasOne(m => m.Compra)
             .WithMany(c => c.MovimientosStock)
             .HasForeignKey(m => m.CompraId)
             .IsRequired(false)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // ── Pagos ─────────────────────────────────────────────────────────
        modelBuilder.Entity<Pago>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Monto).HasColumnType("decimal(10,2)");
            e.Property(p => p.MetodoPago).HasMaxLength(30).IsRequired();
            e.Property(p => p.NumeroReferencia).HasMaxLength(100);
            e.HasOne(p => p.Pedido)
             .WithMany(p => p.Pagos)
             .HasForeignKey(p => p.PedidoId)
             .OnDelete(DeleteBehavior.Restrict);
            e.HasOne(p => p.Cliente)
             .WithMany(c => c.Pagos)
             .HasForeignKey(p => p.ClienteId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Despacho ──────────────────────────────────────────────────────
        modelBuilder.Entity<Despacho>(e =>
        {
            e.HasKey(d => d.Id);
            e.Property(d => d.TipoDespacho).HasMaxLength(20).IsRequired();
            e.Property(d => d.NombreTransportista).HasMaxLength(150);
            e.Property(d => d.TelefonoTransportista).HasMaxLength(20);
            e.Property(d => d.EstadoDespacho).HasMaxLength(30).IsRequired();
            e.HasOne(d => d.Pedido)
             .WithOne(p => p.Despacho)
             .HasForeignKey<Despacho>(d => d.PedidoId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── LogAuditoria ──────────────────────────────────────────────────
        modelBuilder.Entity<LogAuditoria>(e =>
        {
            e.HasKey(l => l.Id);
            e.Property(l => l.RolUsuario).HasMaxLength(30).IsRequired();
            e.Property(l => l.Accion).HasMaxLength(50).IsRequired();
            e.Property(l => l.Modulo).HasMaxLength(50).IsRequired();
            e.Property(l => l.DireccionIP).HasMaxLength(45);
        });

        // ── Proveedor ─────────────────────────────────────────────────────
        modelBuilder.Entity<Proveedor>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Nombre).HasMaxLength(150).IsRequired();
            e.Property(p => p.Ruc).HasMaxLength(20);
            e.Property(p => p.Telefono).HasMaxLength(20);
            e.Property(p => p.Direccion).HasMaxLength(255);
        });

        // ── Compra ────────────────────────────────────────────────────────
        modelBuilder.Entity<Compra>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.NumeroFactura).HasMaxLength(50).IsRequired();
            e.Property(c => c.Total).HasColumnType("decimal(10,2)");
            e.Property(c => c.Observaciones).HasMaxLength(255);
            e.HasIndex(c => new { c.ProveedorId, c.NumeroFactura }).IsUnique();
            e.HasOne(c => c.Proveedor)
             .WithMany(p => p.Compras)
             .HasForeignKey(c => c.ProveedorId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── DetalleCompra ─────────────────────────────────────────────────
        modelBuilder.Entity<DetalleCompra>(e =>
        {
            e.HasKey(d => d.Id);
            e.Property(d => d.Cantidad).HasColumnType("decimal(10,2)");
            e.HasOne(d => d.Compra)
             .WithMany(c => c.Detalles)
             .HasForeignKey(d => d.CompraId)
             .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(d => d.Producto)
             .WithMany(p => p.DetallesCompra)
             .HasForeignKey(d => d.ProductoId)
             .OnDelete(DeleteBehavior.Restrict);
        });
    }
}