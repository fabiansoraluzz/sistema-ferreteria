"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Users, ChevronRight, Lock } from "lucide-react";

export default function ConfiguracionPage() {
    const router = useRouter();
    const [nombre, setNombre] = useState("");

    useEffect(() => {
        const userData = localStorage.getItem("usuario");
        if (userData) {
            const u = JSON.parse(userData);
            setNombre(u.nombreCompleto);
        }
    }, []);

    return (
        <div className="space-y-5">

            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Configuración</h1>
                    <p className="text-base text-slate-500">{nombre}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">

                <Link
                    href="/auditoria"
                    className="flex items-center justify-between px-4 py-5 hover:bg-slate-50 transition-colors border-b border-slate-100"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                            <ShieldCheck size={24} className="text-purple-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-800">Auditoría</p>
                            <p className="text-sm text-slate-400">Historial de acciones del sistema</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                </Link>

                <Link
                    href="/usuarios"
                    className="flex items-center justify-between px-4 py-5 hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                            <Users size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-800">Usuarios</p>
                            <p className="text-sm text-slate-400">Gestionar acceso al sistema</p>
                        </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                </Link>

            </div>

        </div>
    );
}