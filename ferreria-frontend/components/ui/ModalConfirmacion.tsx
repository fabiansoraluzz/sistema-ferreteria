"use client";

import { AlertTriangle } from "lucide-react";

interface ModalConfirmacionProps {
    visible: boolean;
    titulo: string;
    descripcion: string;
    textoCancelar?: string;
    textoConfirmar: string;
    colorConfirmar?: "rojo" | "azul" | "verde";
    cargando?: boolean;
    onCancelar: () => void;
    onConfirmar: () => void;
}

export function ModalConfirmacion({
    visible,
    titulo,
    descripcion,
    textoCancelar = "Cancelar",
    textoConfirmar,
    colorConfirmar = "rojo",
    cargando = false,
    onCancelar,
    onConfirmar,
}: ModalConfirmacionProps) {
    if (!visible) return null;

    const colorBoton = {
        rojo: "bg-red-600 hover:bg-red-700",
        azul: "bg-blue-600 hover:bg-blue-700",
        verde: "bg-green-600 hover:bg-green-700",
    }[colorConfirmar];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
            <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl">

                <div className="flex flex-col items-center text-center gap-3">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colorConfirmar === "rojo" ? "bg-red-100" :
                            colorConfirmar === "azul" ? "bg-blue-100" :
                                "bg-green-100"
                        }`}>
                        <AlertTriangle size={32} className={
                            colorConfirmar === "rojo" ? "text-red-600" :
                                colorConfirmar === "azul" ? "text-blue-600" :
                                    "text-green-600"
                        } />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-slate-800">{titulo}</p>
                        <p className="text-base text-slate-500 mt-1">{descripcion}</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onCancelar}
                        disabled={cargando}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl py-4 text-base transition-colors disabled:opacity-50"
                    >
                        {textoCancelar}
                    </button>
                    <button
                        onClick={onConfirmar}
                        disabled={cargando}
                        className={`flex-1 text-white font-bold rounded-2xl py-4 text-base transition-colors disabled:opacity-50 ${colorBoton}`}
                    >
                        {cargando ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Procesando...
                            </div>
                        ) : textoConfirmar}
                    </button>
                </div>

            </div>
        </div>
    );
}