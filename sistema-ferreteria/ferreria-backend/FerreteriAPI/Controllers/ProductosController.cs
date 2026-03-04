using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FerreteriAPI.DTOs.Productos;
using FerreteriAPI.Services.Interfaces;

namespace FerreteriAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
[Tags("Productos")]
public class ProductosController : ControllerBase
{
    private readonly IProductoService _service;

    public ProductosController(IProductoService service)
    {
        _service = service;
    }

    /// <summary>ObtenerProductos — Lista todos los productos activos. Acepta búsqueda por nombre.</summary>
    [HttpGet("ObtenerProductos")]
    public async Task<IActionResult> ObtenerProductos([FromQuery] string? busqueda)
    {
        var productos = await _service.ObtenerTodosAsync(busqueda);
        return Ok(productos);
    }

    /// <summary>ObtenerProductosStockBajo — Lista productos cuyo stock actual es menor o igual al stock mínimo.</summary>
    [HttpGet("ObtenerProductosStockBajo")]
    public async Task<IActionResult> ObtenerProductosStockBajo()
    {
        var alertas = await _service.ObtenerAlertasStockAsync();
        return Ok(alertas);
    }

    /// <summary>ObtenerDetalleProducto — Devuelve el detalle completo de un producto por su Id.</summary>
    [HttpGet("ObtenerDetalleProducto/{id}")]
    public async Task<IActionResult> ObtenerDetalleProducto(int id)
    {
        var producto = await _service.ObtenerPorIdAsync(id);
        return Ok(producto);
    }

    /// <summary>CrearProducto — Registra un nuevo producto con su stock inicial y precios.</summary>
    [HttpPost("CrearProducto")]
    public async Task<IActionResult> CrearProducto([FromBody] CrearProductoRequest request)
    {
        var producto = await _service.CrearAsync(request, ObtenerUsuarioId());
        return CreatedAtAction(nameof(ObtenerDetalleProducto),
            new { id = producto.Id }, producto);
    }

    /// <summary>ActualizarProducto — Modifica los datos del producto. No modifica el stock directamente.</summary>
    [HttpPut("ActualizarProducto/{id}")]
    public async Task<IActionResult> ActualizarProducto(
        int id, [FromBody] ActualizarProductoRequest request)
    {
        var producto = await _service.ActualizarAsync(id, request, ObtenerUsuarioId());
        return Ok(producto);
    }

    /// <summary>RegistrarEntradaMercaderia — Incrementa el stock de un producto y registra el movimiento de entrada.</summary>
    [HttpPost("RegistrarEntradaMercaderia/{id}")]
    public async Task<IActionResult> RegistrarEntradaMercaderia(
        int id, [FromBody] EntradaStockRequest request)
    {
        var producto = await _service
            .RegistrarEntradaStockAsync(id, request, ObtenerUsuarioId());
        return Ok(producto);
    }

    /// <summary>EliminarProducto — Desactiva un producto (soft delete). Solo Administrador.</summary>
    [HttpDelete("EliminarProducto/{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> EliminarProducto(int id)
    {
        await _service.DesactivarAsync(id, ObtenerUsuarioId());
        return NoContent();
    }

    private int ObtenerUsuarioId()
    {
        var claim = User.FindFirst("id")?.Value
            ?? throw new UnauthorizedAccessException("Token inválido.");
        return int.Parse(claim);
    }
}