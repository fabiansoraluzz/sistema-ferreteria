using System.Net;
using System.Text.Json;

namespace FerreteriAPI.Middleware;

public class ManejoErroresMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ManejoErroresMiddleware> _logger;

    public ManejoErroresMiddleware(
        RequestDelegate next,
        ILogger<ManejoErroresMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error no controlado: {Mensaje}", ex.Message);
            await EscribirRespuestaError(context, ex);
        }
    }

    private static async Task EscribirRespuestaError(
        HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, mensaje) = ex switch
        {
            KeyNotFoundException => (HttpStatusCode.NotFound,
                                            "El recurso solicitado no fue encontrado."),
            UnauthorizedAccessException => (HttpStatusCode.Forbidden,
                                            "No tienes permiso para esta acción."),
            InvalidOperationException => (HttpStatusCode.BadRequest, ex.Message),
            _ => (HttpStatusCode.InternalServerError,
                                            "Ocurrió un error interno. Intenta de nuevo.")
        };

        context.Response.StatusCode = (int)statusCode;

        await context.Response.WriteAsync(JsonSerializer.Serialize(new
        {
            error = mensaje,
            codigo = (int)statusCode,
            fechaHora = DateTime.UtcNow
        }));
    }
}