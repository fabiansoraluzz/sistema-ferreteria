"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    Home, ClipboardList, Package, Users,
    LogOut, DollarSign, Settings,
} from "lucide-react";

interface Usuario {
    id: number;
    nombreCompleto: string;
    rol: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [usuario, setUsuario] = useState<Usuario | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("usuario");
        if (!token || !userData) { router.push("/login"); return; }
        setUsuario(JSON.parse(userData));
    }, [router]);

    function cerrarSesion() {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        router.push("/login");
    }

    const navItems = [
        { href: "/inicio", label: "Inicio", icon: Home },
        { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
        { href: "/productos", label: "Inventario", icon: Package },
        { href: "/clientes", label: "Clientes", icon: Users },
        { href: "/cobranza", label: "Cobranza", icon: DollarSign },
    ];

    if (!usuario) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">

            <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Package size={16} className="text-white" />
                    </div>
                    <span className="text-base font-bold text-slate-800">Ferretería</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden sm:block text-sm text-slate-500 font-medium">
                        {usuario.nombreCompleto.split(" ")[0]}
                    </div>
                    {usuario.rol === "Administrador" && (
                        <Link
                            href="/configuracion"
                            className={`p-1.5 rounded-lg transition-colors ${pathname.startsWith("/configuracion") || pathname.startsWith("/auditoria")
                                    ? "text-blue-600 bg-blue-50"
                                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            <Settings size={20} />
                        </Link>
                    )}
                    <button
                        onClick={cerrarSesion}
                        className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <main className="flex-1 pb-24 px-4 py-5 max-w-2xl mx-auto w-full">
                {children}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-10 shadow-lg">
                <div className="max-w-2xl mx-auto flex">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const activo = pathname === item.href ||
                            (item.href !== "/inicio" && pathname.startsWith(item.href + "/"));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${activo ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                <Icon size={22} strokeWidth={activo ? 2.5 : 1.8} />
                                <span className={`text-xs font-medium ${activo ? "text-blue-600" : "text-slate-400"}`}>
                                    {item.label}
                                </span>
                                {activo && (
                                    <div className="absolute bottom-0 w-8 h-0.5 bg-blue-600 rounded-t-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

        </div>
    );
}