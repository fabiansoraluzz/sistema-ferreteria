using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using FerreteriAPI.Models;

namespace FerreteriAPI.Helpers;

public class JwtHelper
{
    private readonly IConfiguration _config;

    public JwtHelper(IConfiguration config)
    {
        _config = config;
    }

    public string GenerarToken(Usuario usuario)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["Jwt:Clave"]!));

        var credenciales = new SigningCredentials(
            key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("id",     usuario.Id.ToString()),
            new Claim("nombre", usuario.NombreCompleto),
            new Claim("email",  usuario.CorreoElectronico),
            new Claim("rol",    usuario.Rol),
            new Claim(ClaimTypes.Role, usuario.Rol),
            new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Emisor"],
            audience: _config["Jwt:Audiencia"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: credenciales
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}