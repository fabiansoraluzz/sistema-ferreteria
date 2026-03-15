import { useState, useEffect } from "react";

export function usePorPagina(): [number, (n: number) => void] {
    const [porPagina, setPorPagina] = useState<number>(10);
    const [modificadoManual, setModificadoManual] = useState(false);

    useEffect(() => {
        function ajustar() {
            if (modificadoManual) return;
            setPorPagina(window.innerWidth < 640 ? 5 : 10);
        }

        ajustar(); // valor inicial
        window.addEventListener("resize", ajustar);
        return () => window.removeEventListener("resize", ajustar);
    }, [modificadoManual]);

    function setPorPaginaManual(n: number) {
        setModificadoManual(true);
        setPorPagina(n);
    }

    return [porPagina, setPorPaginaManual];
}