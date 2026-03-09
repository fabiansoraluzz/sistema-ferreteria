interface Props {
    paginaActual: number;
    totalPaginas: number;
    onCambiar: (pagina: number) => void;
}

export function Paginacion({ paginaActual, totalPaginas, onCambiar }: Props) {
    if (totalPaginas <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-2 py-2">
            <button
                onClick={() => onCambiar(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-slate-200 text-slate-600 font-bold disabled:opacity-30 hover:bg-slate-100 transition-colors text-lg"
            >
                ‹
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
                <button
                    key={n}
                    onClick={() => onCambiar(n)}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 font-bold text-base transition-all ${n === paginaActual
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                            : "border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                >
                    {n}
                </button>
            ))}

            <button
                onClick={() => onCambiar(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-slate-200 text-slate-600 font-bold disabled:opacity-30 hover:bg-slate-100 transition-colors text-lg"
            >
                ›
            </button>
        </div>
    );
}