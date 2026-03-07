"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

interface AlertaProps {
    mensaje: string;
    tipo: "ok" | "error" | "advertencia" | "info";
    visible: boolean;
}

const CONFIG = {
    ok: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icono: CheckCircle },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icono: XCircle },
    advertencia: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icono: AlertTriangle },
    info: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icono: Info },
};

export function Alerta({ mensaje, tipo, visible }: AlertaProps) {
    if (!visible || !mensaje) return null;

    const { bg, border, text, icono: Icono } = CONFIG[tipo];

    return (
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-base font-semibold border-2 ${bg} ${border} ${text}`}>
            <Icono size={22} className="shrink-0" />
            <span>{mensaje}</span>
        </div>
    );
}