"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ShoppingCart, Plus, ChevronRight,
    Search, Truck, Package,
} from "lucide-react";
import api from "@/lib/api";
import { CompraResumen, Proveedor } from "@/types";
import { normalizar } from "@/lib/utils";
import { Paginacion } from "@/components/ui/Paginacion";
import { usePorPagina } from "@/hooks/usePorPagina";

type Tab = "compras" | "proveedores";

export default function ComprasPage() {
    const [tab, setTab] = useState<Tab>("compras");
    const [compras, setCompras] = useState<CompraResumen[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = usePorPagina();

    useEffect(() => {
        cargarTodo();
    }, []);

    useEffect(() => { setPagina(1); }, [busqueda, tab, porPagina]);

    async function cargarTodo() {
        setCargando(true);
        try {
            const [resCompras, resProveedores] = await Promise.all([
                api.get<CompraResumen[]>("/Compras/ObtenerCompras"),
                api.get<Proveedor[]>("/Proveedores/ObtenerProveedores"),
            ]);
            setCompras(resCompras.data);
            setProveedores(resProveedores.data);
        } catch {
            console.error("Error cargando datos");
        } finally {
            setCargando(false);
        }
    }

    // ── Filtros ───────────────────────────────────────────────────────────────
    const comprasFiltradas = compras.filter(c =>
        normalizar(c.nombreProveedor).includes(normalizar(busqueda)) ||
        normalizar(c.numeroFactura).includes(normalizar(busqueda))
    );

    const proveedoresFiltrados = proveedores.filter(p =>
        normalizar(p.nombre).includes(normalizar(busqueda)) ||
        normalizar(p.ruc ?? "").includes(normalizar(busqueda))
    );

    const listaActiva = tab === "compras" ? comprasFiltradas : proveedoresFiltrados;
    const totalPaginas = Math.ceil(listaActiva.length / porPagina);
    const comprasPagina = comprasFiltradas.slice((pagina - 1) * porPagina, pagina * porPagina);
    const proveedoresPagina = proveedoresFiltrados.slice((pagina - 1) * porPagina, pagina * porPagina);

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Compras</h1>
                    <p className="text-base text-slate-500">
                        {tab === "compras"
                            ? `${compras.length} ${compras.length === 1 ? "compra" : "compras"} registradas`
                            : `${proveedores.length} ${proveedores.length === 1 ? "proveedor" : "proveedores"} registrados`}
                    </p>
                </div>
                <Link
                    href={tab === "compras" ? "/compras/nueva" : "/proveedores/nuevo"}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-xl shadow-sm transition-colors"
                >
                    <Plus size={20} />
                    <span className="text-base">Nuevo</span>
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
                <button
                    onClick={() => { setTab("compras"); setBusqueda(""); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-base transition-all ${tab === "compras"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <ShoppingCart size={18} />
                    Compras
                </button>
                <button
                    onClick={() => { setTab("proveedores"); setBusqueda(""); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-base transition-all ${tab === "proveedores"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <Truck size={18} />
                    Proveedores
                </button>
            </div>

            {/* Buscador */}
            <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder={tab === "compras" ? "Buscar por proveedor o factura..." : "Buscar por nombre o RUC..."}
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 shadow-sm transition-all"
                />
            </div>

            {/* Lista */}
            {cargando ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 text-base">Cargando...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">

                    {/* ── Tab Compras ── */}
                    {tab === "compras" && (
                        comprasFiltradas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <ShoppingCart size={48} className="text-slate-300" />
                                <p className="text-base text-slate-500">No hay compras registradas</p>
                            </div>
                        ) : (
                            <>
                                <div className="divide-y divide-slate-100">
                                    {comprasPagina.map(c => (
                                        <Link
                                            key={c.id}
                                            href={`/compras/${c.id}`}
                                            className="flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                                    <ShoppingCart size={20} className="text-blue-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-base font-semibold text-slate-800 truncate">
                                                        {c.nombreProveedor}
                                                    </p>
                                                    <p className="text-sm text-slate-400">
                                                        Factura {c.numeroFactura} · {c.cantidadProductos} {c.cantidadProductos === 1 ? "producto" : "productos"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                <div className="text-right">
                                                    <p className="text-sm text-slate-400">
                                                        {new Date(c.fechaCompra).toLocaleDateString("es-PE", {
                                                            day: "numeric", month: "short", year: "numeric",
                                                        })}
                                                    </p>
                                                </div>
                                                <ChevronRight size={18} className="text-slate-300" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <Paginacion
                                    paginaActual={pagina}
                                    totalPaginas={totalPaginas}
                                    totalRegistros={comprasFiltradas.length}
                                    porPagina={porPagina}
                                    onCambiarPagina={setPagina}
                                    onCambiarPorPagina={setPorPagina}
                                />
                            </>
                        )
                    )}

                    {/* ── Tab Proveedores ── */}
                    {tab === "proveedores" && (
                        proveedoresFiltrados.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Truck size={48} className="text-slate-300" />
                                <p className="text-base text-slate-500">No hay proveedores registrados</p>
                            </div>
                        ) : (
                            <>
                                <div className="divide-y divide-slate-100">
                                    {proveedoresPagina.map(p => (
                                        <Link
                                            key={p.id}
                                            href={`/proveedores/${p.id}`}
                                            className="flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                                    <Truck size={20} className="text-orange-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-base font-semibold text-slate-800 truncate">
                                                        {p.nombre}
                                                    </p>
                                                    <p className="text-sm text-slate-400">
                                                        {p.ruc ? `RUC ${p.ruc} · ` : ""}{p.totalCompras} {p.totalCompras === 1 ? "compra" : "compras"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                <ChevronRight size={18} className="text-slate-300" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                                <Paginacion
                                    paginaActual={pagina}
                                    totalPaginas={totalPaginas}
                                    totalRegistros={proveedoresFiltrados.length}
                                    porPagina={porPagina}
                                    onCambiarPagina={setPagina}
                                    onCambiarPorPagina={setPorPagina}
                                />
                            </>
                        )
                    )}

                </div>
            )}

        </div>
    );
}