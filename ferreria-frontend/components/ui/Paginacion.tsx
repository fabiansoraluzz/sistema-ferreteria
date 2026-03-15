// components/ui/Paginacion.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginacionProps {
    paginaActual: number;
    totalPaginas: number;
    totalRegistros: number;
    porPagina: number;
    onCambiarPagina: (pagina: number) => void;
    onCambiarPorPagina: (cantidad: number) => void;
}

const OPCIONES_POR_PAGINA = [5, 10, 20, 50, 100];

function generarPaginas(actual: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const paginas: (number | "...")[] = [];

    // Siempre: primera y segunda
    paginas.push(1);
    if (total > 1) paginas.push(2);

    const izqMin = actual - 1;
    const izqMax = actual + 1;

    // Elipsis izquierda
    if (izqMin > 3) paginas.push("...");

    // Páginas alrededor del actual
    for (let p = Math.max(3, izqMin); p <= Math.min(total - 2, izqMax); p++) {
        paginas.push(p);
    }

    // Elipsis derecha
    if (izqMax < total - 2) paginas.push("...");

    // Siempre: penúltima y última
    if (total > 2) paginas.push(total - 1);
    paginas.push(total);

    // Deduplicar manteniendo orden
    return paginas.filter((p, i, arr) => arr.indexOf(p) === i);
}

export function Paginacion({
    paginaActual,
    totalPaginas,
    totalRegistros,
    porPagina,
    onCambiarPagina,
    onCambiarPorPagina,
}: PaginacionProps) {
    if (totalPaginas <= 1 && totalRegistros <= OPCIONES_POR_PAGINA[0]) return null;

    const desde = (paginaActual - 1) * porPagina + 1;
    const hasta = Math.min(paginaActual * porPagina, totalRegistros);
    const paginas = generarPaginas(paginaActual, totalPaginas);

    return (
        <div className="flex flex-col gap-3 px-4 py-3 border-t border-slate-100">

            {/* Fila única: selector izq + paginación der */}
            <div className="flex items-center justify-between gap-2">

                {/* Selector de registros por página */}
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm text-slate-500 hidden sm:inline">Mostrar</span>
                    <select
                        value={porPagina}
                        onChange={e => { onCambiarPorPagina(Number(e.target.value)); onCambiarPagina(1); }}
                        className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:border-blue-400 transition-colors cursor-pointer"
                    >
                        {OPCIONES_POR_PAGINA.map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                    <span className="text-sm text-slate-500 hidden sm:inline">por página</span>
                </div>

                {/* DESKTOP / TABLET: números de página */}
                <div className="hidden sm:flex items-center gap-1">
                    <button
                        onClick={() => onCambiarPagina(paginaActual - 1)}
                        disabled={paginaActual === 1}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    {paginas.map((p, i) =>
                        p === "..." ? (
                            <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">
                                ···
                            </span>
                        ) : (
                            <button
                                key={p}
                                onClick={() => onCambiarPagina(p as number)}
                                className={`w-9 h-9 flex items-center justify-center rounded-xl border-2 text-sm font-semibold transition-colors ${p === paginaActual
                                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                        : "border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                                    }`}
                            >
                                {p}
                            </button>
                        )
                    )}

                    <button
                        onClick={() => onCambiarPagina(paginaActual + 1)}
                        disabled={paginaActual === totalPaginas}
                        className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* MÓVIL: dropdown de página + anterior/siguiente */}
                <div className="flex sm:hidden items-center gap-2">
                    <button
                        onClick={() => onCambiarPagina(paginaActual - 1)}
                        disabled={paginaActual === 1}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <select
                        value={paginaActual}
                        onChange={e => onCambiarPagina(Number(e.target.value))}
                        className="border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 bg-white focus:outline-none focus:border-blue-400 transition-colors cursor-pointer"
                    >
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(p => (
                            <option key={p} value={p}>Pág. {p} de {totalPaginas}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => onCambiarPagina(paginaActual + 1)}
                        disabled={paginaActual === totalPaginas}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Contador de registros */}
            <p className="text-xs text-slate-400 text-center">
                Mostrando {desde}–{hasta} de {totalRegistros} registros
            </p>

        </div>
    );
}