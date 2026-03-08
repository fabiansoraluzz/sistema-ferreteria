"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipboardList, Plus, ChevronRight, Search } from "lucide-react";
import api from "@/lib/api";
import { PedidoResumen } from "@/types";
import { normalizar } from "@/lib/utils";

const ESTADOS = [
    { valor: "Todos", label: "Todos", color: "bg-blue-600 text-white", inactivo: "bg-blue-50 border-blue-200 text-blue-700" },
    { valor: "Pendiente", label: "Pendiente", color: "bg-amber-500 text-white", inactivo: "bg-amber-50 border-amber-200 text-amber-700" },
    { valor: "Confirmado", label: "Confirmados", color: "bg-blue-500 text-white", inactivo: "bg-blue-50 border-blue-200 text-blue-700" },
    { valor: "EnReparto", label: "En camino", color: "bg-orange-500 text-white", inactivo: "bg-orange-50 border-orange-200 text-orange-700" },
    { valor: "Entregado", label: "Entregados", color: "bg-green-500 text-white", inactivo: "bg-green-50 border-green-200 text-green-700" },
    { valor: "Cancelado", label: "Cancelados", color: "bg-slate-500 text-white", inactivo: "bg-slate-50 border-slate-200 text-slate-700" },
];

export default function PedidosPage() {
    const searchParams = useSearchParams();
    const estadoInicial = searchParams.get("estado") ?? "Todos";

    const [pedidos, setPedidos] = useState<PedidoResumen[]>([]);
    const [estado, setEstado] = useState(estadoInicial);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarPedidos(estado);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estado]);

    async function cargarPedidos(estadoActual: string) {
        setCargando(true);
        try {
            const url = estadoActual === "Todos"
                ? "/Pedidos/ObtenerPedidos"
                : `/Pedidos/ObtenerPedidos?estado=${estadoActual}`;
            const { data } = await api.get<PedidoResumen[]>(url);
            setPedidos(data);
        } catch {
            console.error("Error cargando pedidos");
        } finally {
            setCargando(false);
        }
    }

    function cambiarEstado(nuevoEstado: string) {
        setEstado(nuevoEstado);
        setBusqueda("");
    }

    const pedidosFiltrados = pedidos.filter((p) =>
        normalizar(p.nombreCliente).includes(normalizar(busqueda))
    );

    function colorBadge(est: string) {
        const colores: Record<string, string> = {
            Pendiente: "bg-amber-100 text-amber-700",
            Confirmado: "bg-blue-100 text-blue-700",
            EnReparto: "bg-orange-100 text-orange-700",
            Entregado: "bg-green-100 text-green-700",
            Cancelado: "bg-slate-100 text-slate-600",
        };
        return colores[est] ?? "bg-slate-100 text-slate-600";
    }

    function etiquetaEstado(est: string) {
        return est === "EnReparto" ? "En Reparto" : est;
    }

    return (
        <div className="space-y-5">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Pedidos</h1>
                    <p className="text-base text-slate-500">
                        {pedidos.length} {pedidos.length === 1 ? "pedido" : "pedidos"} encontrados
                    </p>
                </div>
                <Link
                    href="/pedidos/nuevo"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-xl shadow-sm transition-colors"
                >
                    <Plus size={20} />
                    <span className="text-base">Nuevo</span>
                </Link>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {ESTADOS.map((e) => (
                    <button
                        key={e.valor}
                        onClick={() => cambiarEstado(e.valor)}
                        className={`shrink-0 px-4 py-2.5 rounded-2xl text-base font-bold border-2 transition-all ${estado === e.valor
                            ? e.color + " border-transparent shadow-sm"
                            : e.inactivo
                            }`}
                    >
                        {e.label}
                    </button>
                ))}
            </div>

            <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre del cliente..."
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 shadow-sm transition-all"
                />
            </div>

            {cargando ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 text-base">Cargando pedidos...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                    {pedidosFiltrados.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <ClipboardList size={48} className="text-slate-300" />
                            <p className="text-base text-slate-500">
                                No hay pedidos {estado !== "Todos" ? "en esta categoria" : ""}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {pedidosFiltrados.map((p) => (
                                <Link
                                    key={p.id}
                                    href={`/pedidos/${p.id}`}
                                    className="flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${p.estadoPedido === "Pendiente" ? "bg-amber-100" :
                                            p.estadoPedido === "Confirmado" ? "bg-blue-100" :
                                                p.estadoPedido === "EnReparto" ? "bg-orange-100" :
                                                    p.estadoPedido === "Entregado" ? "bg-green-100" :
                                                        "bg-slate-100"
                                            }`}>
                                            <ClipboardList size={20} className={`${p.estadoPedido === "Pendiente" ? "text-amber-600" :
                                                p.estadoPedido === "Confirmado" ? "text-blue-600" :
                                                    p.estadoPedido === "EnReparto" ? "text-orange-600" :
                                                        p.estadoPedido === "Entregado" ? "text-green-600" :
                                                            "text-slate-500"
                                                }`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-base font-semibold text-slate-800 truncate">
                                                {p.nombreCliente}
                                            </p>
                                            <p className="text-sm text-slate-400">
                                                {new Date(p.fechaPedido).toLocaleDateString("es-PE", {
                                                    day: "numeric", month: "short", year: "numeric",
                                                })}
                                                {p.fechaEntrega
                                                    ? ` · Entrega ${new Date(p.fechaEntrega).toLocaleDateString("es-PE", {
                                                        day: "numeric", month: "short",
                                                    })}`
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                        <div className="text-right">
                                            <p className="text-base font-bold text-slate-800">
                                                S/ {p.total.toFixed(2)}
                                            </p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colorBadge(p.estadoPedido)}`}>
                                                {etiquetaEstado(p.estadoPedido)}
                                            </span>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-300" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}

        </div>
    );
}