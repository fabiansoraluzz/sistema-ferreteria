"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import api from "@/lib/api";
import { Alerta } from "@/components/ui/Alerta";
import { useAlerta } from "@/hooks/useAlerta";

export default function NuevoProveedorPage() {
    const router = useRouter();
    const alerta = useAlerta();

    const [nombre, setNombre] = useState("");
    const [ruc, setRuc] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");
    const [guardando, setGuardando] = useState(false);

    async function guardar() {
        if (!nombre.trim()) { alerta.mostrar("El nombre es obligatorio", "error"); return; }

        setGuardando(true);
        try {
            await api.post("/Proveedores/CrearProveedor", {
                nombre: nombre.trim(),
                ruc: ruc.trim() || null,
                telefono: telefono.trim() || null,
                direccion: direccion.trim() || null,
            });
            router.push("/compras?tab=proveedores");
        } catch {
            alerta.mostrar("Error al crear el proveedor", "error");
        } finally {
            setGuardando(false);
        }
    }

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div>
                    <p className="text-sm text-slate-500">Compras · Proveedores</p>
                    <h1 className="text-xl font-bold text-slate-800">Nuevo proveedor</h1>
                </div>
            </div>

            <Alerta mensaje={alerta.mensaje} tipo={alerta.tipo} visible={alerta.visible} />

            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                        Datos del proveedor
                    </p>
                </div>
                <div className="px-4 py-4 space-y-4">

                    <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2 block">
                            Nombre <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            placeholder="Ej: Distribuidora San Martín"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2 block">
                            RUC <span className="text-slate-400 font-normal">(opcional)</span>
                        </label>
                        <input
                            type="text"
                            value={ruc}
                            onChange={e => setRuc(e.target.value)}
                            placeholder="Ej: 20512345678"
                            maxLength={11}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2 block">
                            Teléfono <span className="text-slate-400 font-normal">(opcional)</span>
                        </label>
                        <input
                            type="tel"
                            value={telefono}
                            onChange={e => setTelefono(e.target.value)}
                            placeholder="Ej: 987654321"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2 block">
                            Dirección <span className="text-slate-400 font-normal">(opcional)</span>
                        </label>
                        <input
                            type="text"
                            value={direccion}
                            onChange={e => setDireccion(e.target.value)}
                            placeholder="Ej: Av. Industrial 123, Lima"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
                        />
                    </div>

                </div>
            </div>

            <button
                onClick={guardar}
                disabled={guardando}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl py-5 text-lg shadow-sm transition-colors disabled:opacity-50"
            >
                {guardando ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Plus size={22} />
                )}
                {guardando ? "Guardando..." : "Crear proveedor"}
            </button>

        </div>
    );
}