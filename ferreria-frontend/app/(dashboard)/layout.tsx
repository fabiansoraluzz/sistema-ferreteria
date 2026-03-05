"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface Usuario {
    id: number;
    nombreCompleto: string;
    rol: string;
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [usuario, setUsuario] = useState<Usuario | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("usuario");

        if (!token || !userData) {
            router.push("/login");
            return;
        }

        setUsuario(JSON.parse(userData));
    }, [router]);

    function cerrarSesion() {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        router.push("/login");
    }

    const navItems = [
        { href: "/inicio", label: "Inicio", icono: "🏠" },
        { href: "/pedidos", label: "Pedidos", icono: "📋" },
        { href: "/productos", label: "Mis Productos", icono: "📦" },
        { href: "/clientes", label: "Clientes", icono: "👤" },
    ];

    if (!usuario) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
                <h1 className="text-lg font-bold text-gray-900">🔧 Ferretería</h1>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 hidden sm:block">
                        {usuario.nombreCompleto}
                    </span>
                    {usuario.rol === "Administrador" && (
                        <Link
                            href="/auditoria"
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium"
                        >
                            Admin
                        </Link>
                    )}
                    <button
                        onClick={cerrarSesion}
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                    >
                        Salir
                    </button>
                </div>
            </header>

            {/* Contenido */}
            <main className="flex-1 pb-20 px-4 py-4 max-w-2xl mx-auto w-full">
                {children}
            </main>

            {/* Barra de navegación inferior estilo WhatsApp */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
                <div className="max-w-2xl mx-auto flex">
                    {navItems.map((item) => {
                        const activo = pathname === item.href ||
                            pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex-1 flex flex-col items-center py-2 gap-1 transition-colors ${activo
                                        ? "text-blue-600"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                <span className="text-xl">{item.icono}</span>
                                <span className="text-xs font-medium">{item.label}</span>
                                {activo && (
                                    <div className="w-1 h-1 bg-blue-600 rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

        </div>
    );
}