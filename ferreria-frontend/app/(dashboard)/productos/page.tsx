"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Package, AlertTriangle, CheckCircle, Plus, ChevronRight, Tag } from "lucide-react";
import api from "@/lib/api";
import { Producto } from "@/types";
import { normalizar } from "@/lib/utils";

export default function ProductosPage() {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState<"todos" | "sinStock" | "pocoStock" | "ok">("todos");
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarProductos();
    }, []);

    async function cargarProductos() {
        try {
            const { data } = await api.get<Producto[]>("/Productos/ObtenerProductos");
            setProductos(data);
        } catch {
            console.error("Error cargando productos");
        } finally {
            setCargando(false);
        }
    }

    const productosFiltrados = productos.filter((p) => {
        const coincideBusqueda = normalizar(p.nombre).includes(normalizar(busqueda));
        if (!coincideBusqueda) return false;
        if (filtro === "sinStock") return p.stockActual === 0;
        if (filtro === "pocoStock") return p.tieneStockBajo && p.stockActual > 0;
        if (filtro === "ok") return !p.tieneStockBajo;
        return true;
    });

    const sinStock = productos.filter(p => p.stockActual === 0).length;
    const pocoStock = productos.filter(p => p.tieneStockBajo && p.stockActual > 0).length;
    const conStock = productos.filter(p => !p.tieneStockBajo).length;

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-base">Cargando inventario...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
                    <p className="text-base text-slate-500">{productos.length} productos registrados</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/categorias"
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3 rounded-xl transition-colors"
                    >
                        <Tag size={20} />
                        <span className="text-base">Categorías</span>
                    </Link>
                    <Link
                        href="/productos/nuevo"
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-xl shadow-sm transition-colors"
                    >
                        <Plus size={20} />
                        <span className="text-base">Nuevo</span>
                    </Link>
                </div>
            </div>

            {/* Buscador */}
            <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar producto por nombre..."
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 shadow-sm transition-all"
                />
            </div>

            {/* Tarjetas resumen - filtros */}
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={() => setFiltro(filtro === "sinStock" ? "todos" : "sinStock")}
                    className={`rounded-2xl p-3 text-center border-2 transition-all ${filtro === "sinStock"
                        ? "bg-red-500 border-red-500 text-white shadow-md"
                        : "bg-red-50 border-red-200 text-red-700"
                        }`}
                >
                    <p className="text-2xl font-bold">{sinStock}</p>
                    <p className="text-xs font-semibold mt-0.5 leading-tight">Sin stock</p>
                </button>
                <button
                    onClick={() => setFiltro(filtro === "pocoStock" ? "todos" : "pocoStock")}
                    className={`rounded-2xl p-3 text-center border-2 transition-all ${filtro === "pocoStock"
                        ? "bg-orange-400 border-orange-400 text-white shadow-md"
                        : "bg-orange-50 border-orange-200 text-orange-700"
                        }`}
                >
                    <p className="text-2xl font-bold">{pocoStock}</p>
                    <p className="text-xs font-semibold mt-0.5 leading-tight">Poco stock</p>
                </button>
                <button
                    onClick={() => setFiltro(filtro === "ok" ? "todos" : "ok")}
                    className={`rounded-2xl p-3 text-center border-2 transition-all ${filtro === "ok"
                        ? "bg-green-500 border-green-500 text-white shadow-md"
                        : "bg-green-50 border-green-200 text-green-700"
                        }`}
                >
                    <p className="text-2xl font-bold">{conStock}</p>
                    <p className="text-xs font-semibold mt-0.5 leading-tight">Con stock</p>
                </button>
            </div>

            {/* Lista de productos */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                {productosFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Package size={48} className="text-slate-300" />
                        <p className="text-base text-slate-500">No se encontraron productos</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {productosFiltrados.map((p) => (
                            <Link
                                key={p.id}
                                href={`/productos/${p.id}`}
                                className="flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${p.stockActual === 0
                                        ? "bg-red-100"
                                        : p.tieneStockBajo
                                            ? "bg-orange-100"
                                            : "bg-green-100"
                                        }`}>
                                        {p.stockActual === 0
                                            ? <Package size={20} className="text-red-600" />
                                            : p.tieneStockBajo
                                                ? <AlertTriangle size={20} className="text-orange-500" />
                                                : <CheckCircle size={20} className="text-green-600" />
                                        }
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base font-semibold text-slate-800 truncate">{p.nombre}</p>
                                        <p className="text-sm text-slate-400">{p.nombreCategoria}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-2">
                                    <div className="text-right">
                                        <p className={`text-xl font-bold ${p.stockActual === 0
                                            ? "text-red-600"
                                            : p.tieneStockBajo
                                                ? "text-orange-500"
                                                : "text-green-600"
                                            }`}>
                                            {p.stockActual}
                                        </p>
                                        <p className="text-xs text-slate-400">{p.unidadMedida}</p>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}