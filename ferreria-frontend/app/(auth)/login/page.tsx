"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { LoginResponse } from "@/types";

export default function LoginPage() {
    const router = useRouter();
    const [correoElectronico, setCorreo] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setCargando(true);
        setError("");

        try {
            const { data } = await api.post<LoginResponse>(
                "/Autenticacion/IniciarSesion",
                { correoElectronico, contrasena }
            );

            localStorage.setItem("token", data.token);
            localStorage.setItem("usuario", JSON.stringify({
                id: data.usuarioId,
                nombreCompleto: data.nombreCompleto,
                rol: data.rol,
            }));

            router.push("/inicio");
        } catch {
            setError("Correo o contraseña incorrectos.");
        } finally {
            setCargando(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <span className="text-white text-2xl">🔧</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Sistema Ferretería</h1>
                    <p className="text-gray-500 mt-1">Ingresa con tu cuenta</p>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-6 text-sm">
                        {error}
                    </div>
                )}

                {/* Formulario */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Correo electrónico
                        </label>
                        <input
                            type="email"
                            value={correoElectronico}
                            onChange={(e) => setCorreo(e.target.value)}
                            placeholder="admin@ferreteria.com"
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg py-3 text-sm transition-colors"
                    >
                        {cargando ? "Ingresando..." : "Ingresar"}
                    </button>
                </form>

            </div>
        </div>
    );
}