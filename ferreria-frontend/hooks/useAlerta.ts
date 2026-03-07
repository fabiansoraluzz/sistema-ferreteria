import { useRef, useState } from "react";

type TipoAlerta = "ok" | "error" | "advertencia" | "info";

export function useAlerta(duracion = 5000) {
    const [mensaje, setMensaje] = useState("");
    const [tipo, setTipo] = useState<TipoAlerta>("ok");
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    function mostrar(texto: string, tipoAlerta: TipoAlerta = "ok") {
        setMensaje(texto);
        setTipo(tipoAlerta);
        setVisible(true);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setVisible(false), duracion);
    }

    function ocultar() {
        setVisible(false);
    }

    return { mensaje, tipo, visible, mostrar, ocultar };
}