"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package, ShoppingCart } from "lucide-react";
import api from "@/lib/api";
import { Compra } from "@/types";

export default function DetalleCompraPage() {
    const params = useParams();
    const router = useRouter();
    const [compra, setCompra] = useState<Compra | null>(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        async function cargar() {
            try {
                const { data } = await api.get<Compra>(`/Compras/ObtenerDetalleCompra/${params.id}`);
                setCompra(data);
            } catch {
                router.push("/compras");
            } finally {
                setCargando(false);
            }
        }
        cargar();
    }, [params.id, router]);

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-base">Cargando compra...</p>
            </div>
        );
    }

    if (!compra) return null;

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
                    <p className="text-sm text-slate-500">Compras</p>
                    <h1 className="text-xl font-bold text-slate-800">Compra #{compra.id}</h1>
                </div>
            </div>

            {/* Info principal */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Información</p>
                </div>
                <div className="divide-y divide-slate-100">
                    <div className="flex justify-between px-4 py-4">
                        <span className="text-base text-slate-500">Proveedor</span>
                        <span className="text-base font-bold text-slate-800">{compra.nombreProveedor}</span>
                    </div>
                    <div className="flex justify-between px-4 py-4">
                        <span className="text-base text-slate-500">Factura</span>
                        <span className="text-base font-semibold text-slate-800">{compra.numeroFactura}</span>
                    </div>
                    <div className="flex justify-between px-4 py-4">
                        <span className="text-base text-slate-500">Fecha</span>
                        <span className="text-base font-semibold text-slate-800">
                            {new Date(compra.fechaCompra).toLocaleDateString("es-PE", {
                                day: "numeric", month: "long", year: "numeric",
                            })}
                        </span>
                    </div>
                    {compra.observaciones && (
                        <div className="flex justify-between px-4 py-4">
                            <span className="text-base text-slate-500">Observaciones</span>
                            <span className="text-base text-slate-700 text-right max-w-[60%]">
                                {compra.observaciones}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Productos */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                        Productos recibidos
                    </p>
                </div>
                <div className="divide-y divide-slate-100">
                    {compra.detalles.map(d => (
                        <div key={d.id} className="flex items-center gap-3 px-4 py-4">
                            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <Package size={20} className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-slate-800 truncate">
                                    {d.nombreProducto}
                                </p>
                                <p className="text-sm text-slate-400">{d.unidadMedida}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-base font-bold text-slate-800">
                                    {d.cantidad % 1 === 0
                                        ? d.cantidad.toFixed(0)
                                        : d.cantidad.toFixed(2)}
                                </p>
                                <p className="text-sm text-slate-400">{d.unidadMedida}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Registrado */}
            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-4 flex items-center gap-3">
                <ShoppingCart size={20} className="text-slate-400 shrink-0" />
                <p className="text-sm text-slate-500">
                    Registrado el {new Date(compra.creadoEn).toLocaleDateString("es-PE", {
                        day: "numeric", month: "long", year: "numeric",
                    })}
                </p>
            </div>

        </div>
    );
}