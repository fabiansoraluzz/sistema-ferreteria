"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, ShieldCheck, Search,
    Plus, Pencil, Trash2, LogIn, RefreshCw,
} from "lucide-react";
import api from "@/lib/api";
import { LogAuditoria } from "@/types";
import { normalizar } from "@/lib/utils";
import { Paginacion } from "@/components/ui/Paginacion";
import { usePorPagina } from "@/hooks/usePorPagina";

function iconoAccion(accion: string) {
    if (accion === "CREAR") return <Plus size={16} className="text-green-600" />;
    if (accion === "MODIFICAR") return <Pencil size={16} className="text-blue-600" />;
    if (accion === "ELIMINAR") return <Trash2 size={16} className="text-red-600" />;
    if (accion === "LOGIN") return <LogIn size={16} className="text-purple-600" />;
    return <RefreshCw size={16} className="text-slate-500" />;
}

function colorAccion(accion: string) {
    if (accion === "CREAR") return "bg-green-100";
    if (accion === "MODIFICAR") return "bg-blue-100";
    if (accion === "ELIMINAR") return "bg-red-100";
    if (accion === "LOGIN") return "bg-purple-100";
    return "bg-slate-100";
}

function etiquetaAccion(accion: string) {
    if (accion === "CREAR") return "Creó";
    if (accion === "MODIFICAR") return "Modificó";
    if (accion === "ELIMINAR") return "Eliminó";
    if (accion === "LOGIN") return "Ingresó";
    return accion;
}

function etiquetaModulo(modulo: string) {
    const mapa: Record<string, string> = {
        Producto: "un producto",
        Categoria: "una categoría",
        Cliente: "un cliente",
        Pedido: "un pedido",
        DetallePedido: "detalle de pedido",
        Pago: "un pago",
        Usuario: "un usuario",
    };
    return mapa[modulo] ?? modulo;
}

export default function AuditoriaPage() {
    const router = useRouter();
    const [logs, setLogs] = useState<LogAuditoria[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = usePorPagina();

    useEffect(() => { cargarLogs(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { setPagina(1); }, [busqueda, porPagina]);

    async function cargarLogs() {
        try {
            const { data } = await api.get<LogAuditoria[]>("/Auditoria/ObtenerLogs");
            setLogs(data);
        } catch {
            console.error("Error cargando logs");
        } finally {
            setCargando(false);
        }
    }

    const logsFiltrados = logs.filter(l =>
        normalizar(l.nombreUsuario).includes(normalizar(busqueda)) ||
        normalizar(l.modulo).includes(normalizar(busqueda)) ||
        normalizar(l.accion).includes(normalizar(busqueda)) ||
        (l.descripcion && normalizar(l.descripcion).includes(normalizar(busqueda)))
    );

    const totalPaginas = Math.ceil(logsFiltrados.length / porPagina);
    const logsPagina = logsFiltrados.slice((pagina - 1) * porPagina, pagina * porPagina);

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-base">Cargando historial...</p>
            </div>
        );
    }

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
                    <h1 className="text-2xl font-bold text-slate-800">Auditoría</h1>
                    <p className="text-base text-slate-500">{logs.length} acciones registradas</p>
                </div>
            </div>

            <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    placeholder="Buscar por usuario, módulo o acción..."
                    className="w-full bg-white border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 shadow-sm transition-all"
                />
            </div>

            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                {logsFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <ShieldCheck size={48} className="text-slate-300" />
                        <p className="text-base text-slate-500">No se encontraron registros</p>
                    </div>
                ) : (
                    <>
                        <div className="divide-y divide-slate-100">
                            {logsPagina.map((log) => (
                                <div key={log.id} className="flex items-start gap-3 px-4 py-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${colorAccion(log.accion)}`}>
                                        {iconoAccion(log.accion)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-semibold text-slate-800">
                                            {log.nombreUsuario}{" "}
                                            <span className="font-normal text-slate-600">
                                                {etiquetaAccion(log.accion)} {etiquetaModulo(log.modulo)}
                                            </span>
                                        </p>
                                        {log.descripcion && (
                                            <p className="text-sm text-slate-400 mt-0.5 truncate">{log.descripcion}</p>
                                        )}
                                        <p className="text-xs text-slate-300 mt-1">
                                            {new Date(log.creadoEn).toLocaleDateString("es-PE", {
                                                day: "numeric", month: "short", year: "numeric",
                                            })}{" "}
                                            {new Date(log.creadoEn).toLocaleTimeString("es-PE", {
                                                hour: "2-digit", minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Paginacion
                            paginaActual={pagina}
                            totalPaginas={totalPaginas}
                            totalRegistros={logsFiltrados.length}
                            porPagina={porPagina}
                            onCambiarPagina={setPagina}
                            onCambiarPorPagina={setPorPagina}
                        />
                    </>
                )}
            </div>

        </div>
    );
}