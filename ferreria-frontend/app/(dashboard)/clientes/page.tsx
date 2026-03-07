"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Users, ChevronRight, Plus, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { Cliente } from "@/types";
import { normalizar } from "@/lib/utils";

export default function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState<"todos" | "conDeuda" | "alDia">("todos");
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarClientes();
    }, []);

    async function cargarClientes() {
        try {
            const { data } = await api.get<Cliente[]>("/Clientes/ObtenerClientes");
            setClientes(data);
        } catch {
            console.error("Error cargando clientes");
        } finally {
            setCargando(false);
        }
    }

    const clientesFiltrados = clientes.filter((c) => {
        const coincide = normalizar(c.nombreCompleto).includes(normalizar(busqueda)) ||
            c.telefono.includes(busqueda);
        if (!coincide) return false;
        if (filtro === "conDeuda") return c.deudaTotal > 0;
        if (filtro === "alDia") return c.deudaTotal === 0;
        return true;
    });

    const conDeuda = clientes.filter(c => c.deudaTotal > 0);
    const alDia = clientes.filter(c => c.deudaTotal === 0);
    const totalDeuda = conDeuda.reduce((acc, c) => acc + c.deudaTotal, 0);

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-base">Cargando clientes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
                    <p className="text-base text-slate-500">{clientes.length} clientes registrados</p>
                </div>
                <Link
                    href="/clientes/nuevo"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-xl shadow-sm transition-colors"
                >
                    <Plus size={20} />
                    <span className="text-base">Nuevo</span>
                </Link>
            </div>

            {/* Resumen de deudas */}
            {conDeuda.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                    <p className="text-base font-bold text-red-700">
                        {conDeuda.length} {conDeuda.length === 1 ? "cliente debe" : "clientes deben"} en total
                    </p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                        S/ {totalDeuda.toFixed(2)} pendientes de cobro
                    </p>
                </div>
            )}

            {/* Buscador */}
            <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre o teléfono..."
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 shadow-sm transition-all"
                />
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-3 gap-2">
                <button
                    onClick={() => setFiltro("todos")}
                    className={`rounded-2xl p-3 text-center border-2 transition-all ${filtro === "todos"
                        ? "bg-blue-600 border-blue-600 text-white shadow-md"
                        : "bg-blue-50 border-blue-200 text-blue-700"
                        }`}
                >
                    <p className="text-2xl font-bold">{clientes.length}</p>
                    <p className="text-xs font-semibold mt-0.5">Todos</p>
                </button>
                <button
                    onClick={() => setFiltro(filtro === "conDeuda" ? "todos" : "conDeuda")}
                    className={`rounded-2xl p-3 text-center border-2 transition-all ${filtro === "conDeuda"
                        ? "bg-red-500 border-red-500 text-white shadow-md"
                        : "bg-red-50 border-red-200 text-red-700"
                        }`}
                >
                    <p className="text-2xl font-bold">{conDeuda.length}</p>
                    <p className="text-xs font-semibold mt-0.5">Con deuda</p>
                </button>
                <button
                    onClick={() => setFiltro(filtro === "alDia" ? "todos" : "alDia")}
                    className={`rounded-2xl p-3 text-center border-2 transition-all ${filtro === "alDia"
                        ? "bg-green-500 border-green-500 text-white shadow-md"
                        : "bg-green-50 border-green-200 text-green-700"
                        }`}
                >
                    <p className="text-2xl font-bold">{alDia.length}</p>
                    <p className="text-xs font-semibold mt-0.5">Al día</p>
                </button>
            </div>

            {/* Lista */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                {clientesFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Users size={48} className="text-slate-300" />
                        <p className="text-base text-slate-500">No se encontraron clientes</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {clientesFiltrados.map((c) => (
                            <Link
                                key={c.id}
                                href={`/clientes/${c.id}`}
                                className="flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${c.deudaTotal > 0 ? "bg-red-100" : "bg-green-100"
                                        }`}>
                                        {c.deudaTotal > 0
                                            ? <Users size={20} className="text-red-600" />
                                            : <CheckCircle size={20} className="text-green-600" />
                                        }
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-base font-semibold text-slate-800 truncate">
                                            {c.nombreCompleto}
                                        </p>
                                        <p className="text-sm text-slate-400">{c.telefono}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    <div className="text-right">
                                        {c.deudaTotal > 0 ? (
                                            <>
                                                <p className="text-base font-bold text-red-600">
                                                    S/ {c.deudaTotal.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-red-400">debe</p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-base font-bold text-green-600">Al día</p>
                                                <p className="text-xs text-green-400">sin deuda</p>
                                            </>
                                        )}
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