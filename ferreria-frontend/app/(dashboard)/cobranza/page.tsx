"use client";

import { useEffect, useRef, useState } from "react";
import {
    Users,
    CheckCircle,
    XCircle,
    ChevronRight,
    Phone,
    Search,
} from "lucide-react";
import api from "@/lib/api";
import { CuentaPorCobrar } from "@/types";
import { normalizar } from "@/lib/utils";

const METODOS_PAGO = ["Efectivo", "Yape", "Plin", "Transferencia", "BCP", "Interbank"];

export default function CobranzaPage() {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [cuentas, setCuentas] = useState<CuentaPorCobrar[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [cuentaActiva, setCuentaActiva] = useState<CuentaPorCobrar | null>(null);
    const [monto, setMonto] = useState("");
    const [metodoPago, setMetodoPago] = useState("Efectivo");
    const [referencia, setReferencia] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState<"ok" | "error">("ok");

    useEffect(() => {
        cargarCuentas();
    }, []);

    async function cargarCuentas() {
        setCargando(true);
        try {
            const { data } = await api.get<CuentaPorCobrar[]>("/Pagos/ObtenerCuentasPorCobrar");
            setCuentas(data);
        } catch {
            console.error("Error cargando cuentas");
        } finally {
            setCargando(false);
        }
    }

    function mostrarMensaje(texto: string, tipo: "ok" | "error") {
        setMensaje(texto);
        setTipoMensaje(tipo);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setMensaje(""), 5000);
    }

    function abrirPago(cuenta: CuentaPorCobrar) {
        setCuentaActiva(cuenta);
        setMonto(cuenta.saldoPendiente.toFixed(2));
        setMetodoPago("Efectivo");
        setReferencia("");
        setObservaciones("");
    }

    function cerrarPago() {
        setCuentaActiva(null);
        setMonto("");
    }

    async function registrarPago() {
        if (!cuentaActiva) return;
        const montoNum = parseFloat(monto);
        if (!monto || montoNum <= 0) {
            mostrarMensaje("Ingresa un monto válido mayor a cero", "error");
            return;
        }
        if (montoNum > cuentaActiva.saldoPendiente) {
            mostrarMensaje("El monto no puede ser mayor al saldo pendiente", "error");
            return;
        }
        setGuardando(true);
        try {
            await api.post("/Pagos/RegistrarPago", {
                pedidoId: cuentaActiva.pedidoId,
                monto: montoNum,
                metodoPago: metodoPago,
                numeroReferencia: referencia.trim() || null,
                observaciones: observaciones.trim() || null,
            });
            mostrarMensaje(
                `Pago de S/ ${montoNum.toFixed(2)} registrado correctamente`,
                "ok"
            );
            cerrarPago();
            cargarCuentas();
        } catch {
            mostrarMensaje("Hubo un error al registrar el pago. Intenta de nuevo.", "error");
        } finally {
            setGuardando(false);
        }
    }

    const cuentasFiltradas = cuentas.filter((c) =>
        normalizar(c.nombreCliente).includes(normalizar(busqueda)) ||
        c.telefonoCliente.includes(busqueda)
    );

    const totalPendiente = cuentas.reduce((acc, c) => acc + c.saldoPendiente, 0);

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-base">Cargando cobranza...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Cobranza</h1>
                <p className="text-base text-slate-500">
                    {cuentas.length} {cuentas.length === 1 ? "deuda pendiente" : "deudas pendientes"}
                </p>
            </div>

            {/* Mensaje */}
            {mensaje ? (
                <div className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-base font-semibold border-2 ${tipoMensaje === "ok"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
                    }`}>
                    {tipoMensaje === "ok" ? <CheckCircle size={22} /> : <XCircle size={22} />}
                    {mensaje}
                </div>
            ) : null}

            {/* Resumen total */}
            {cuentas.length > 0 ? (
                <div className="bg-red-500 rounded-2xl p-5 text-white shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                            <Users size={22} />
                        </div>
                        <p className="text-base font-semibold opacity-90">
                            Total pendiente de cobro
                        </p>
                    </div>
                    <p className="text-5xl font-bold">S/ {totalPendiente.toFixed(2)}</p>
                    <p className="text-base opacity-80 mt-2">
                        de {cuentas.length} {cuentas.length === 1 ? "pedido" : "pedidos"} sin cobrar
                    </p>
                </div>
            ) : (
                <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
                        <CheckCircle size={30} className="text-green-600" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-green-700">Todo cobrado</p>
                        <p className="text-base text-green-600">No hay deudas pendientes</p>
                    </div>
                </div>
            )}

            {/* Buscador */}
            {cuentas.length > 0 ? (
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
            ) : null}

            {/* Lista de cuentas por cobrar */}
            {cuentasFiltradas.length > 0 ? (
                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                            Pendientes de cobro
                        </p>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {cuentasFiltradas.map((c) => (
                            <div key={c.pedidoId} className="px-4 py-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-bold text-slate-800 truncate">
                                            {c.nombreCliente}
                                        </p>
                                        <a
                                            href={`tel:${c.telefonoCliente}`}
                                            className="flex items-center gap-1 text-sm text-blue-600 font-medium mt-0.5"
                                        >
                                            <Phone size={13} />
                                            {c.telefonoCliente}
                                        </a>
                                    </div>
                                    <div className="text-right ml-3 shrink-0">
                                        <p className="text-2xl font-bold text-red-600">
                                            S/ {c.saldoPendiente.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-slate-400">pendiente</p>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-xl px-3 py-2 mb-3">
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Pedido #{c.pedidoId}</span>
                                        <span className={`font-semibold ${c.estadoPedido === "Entregado" ? "text-green-600" : "text-amber-600"
                                            }`}>
                                            {c.estadoPedido}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-500 mt-1">
                                        <span>Total: S/ {c.total.toFixed(2)}</span>
                                        <span>Pagado: S/ {c.montoPagado.toFixed(2)}</span>
                                    </div>
                                    {c.fechaEntrega ? (
                                        <p className="text-xs text-slate-400 mt-1">
                                            Entrega: {new Date(c.fechaEntrega).toLocaleDateString("es-PE", {
                                                day: "numeric", month: "long", year: "numeric",
                                            })}
                                        </p>
                                    ) : null}
                                </div>

                                <button
                                    onClick={() => abrirPago(c)}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3 text-base transition-colors"
                                >
                                    <CheckCircle size={18} />
                                    Registrar pago
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}

            {/* Modal de pago */}
            {cuentaActiva ? (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0">
                    <div className="bg-white w-full max-w-2xl rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">

                        {/* Header modal */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Registrar pago de</p>
                                <p className="text-xl font-bold text-slate-800">
                                    {cuentaActiva.nombreCliente}
                                </p>
                            </div>
                            <button
                                onClick={cerrarPago}
                                className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                <XCircle size={20} className="text-slate-600" />
                            </button>
                        </div>

                        {/* Saldo pendiente */}
                        <div className="bg-red-50 border-2 border-red-200 rounded-2xl px-4 py-3">
                            <p className="text-sm text-red-600 font-semibold">
                                Saldo pendiente del Pedido #{cuentaActiva.pedidoId}
                            </p>
                            <p className="text-3xl font-bold text-red-600">
                                S/ {cuentaActiva.saldoPendiente.toFixed(2)}
                            </p>
                        </div>

                        {/* Monto a pagar */}
                        <div>
                            <p className="text-base font-bold text-slate-700 mb-2">
                                ¿Cuánto está pagando ahora?
                            </p>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-500">
                                    S/
                                </span>
                                <input
                                    type="number"
                                    value={monto}
                                    onChange={(e) => setMonto(e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                    className="w-full border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-3xl font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-400 transition-all"
                                />
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => setMonto(cuentaActiva.saldoPendiente.toFixed(2))}
                                    className="flex-1 bg-green-50 border-2 border-green-200 text-green-700 font-bold rounded-xl py-2.5 text-sm hover:bg-green-100 transition-colors"
                                >
                                    Paga todo (S/ {cuentaActiva.saldoPendiente.toFixed(2)})
                                </button>
                                <button
                                    onClick={() => setMonto((cuentaActiva.saldoPendiente / 2).toFixed(2))}
                                    className="flex-1 bg-blue-50 border-2 border-blue-200 text-blue-700 font-bold rounded-xl py-2.5 text-sm hover:bg-blue-100 transition-colors"
                                >
                                    Paga la mitad
                                </button>
                            </div>
                        </div>

                        {/* Método de pago */}
                        <div>
                            <p className="text-base font-bold text-slate-700 mb-2">
                                ¿Cómo paga?
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {METODOS_PAGO.map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setMetodoPago(m)}
                                        className={`px-4 py-2.5 rounded-xl text-base font-bold border-2 transition-all ${metodoPago === m
                                                ? "bg-blue-600 border-blue-600 text-white"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                                            }`}
                                    >
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Referencia — solo si no es efectivo */}
                        {metodoPago !== "Efectivo" ? (
                            <div>
                                <p className="text-base font-bold text-slate-700 mb-2">
                                    Número de operación (opcional)
                                </p>
                                <input
                                    type="text"
                                    value={referencia}
                                    onChange={(e) => setReferencia(e.target.value)}
                                    placeholder="Ej: YAP-123456"
                                    className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
                                />
                            </div>
                        ) : null}

                        {/* Observaciones */}
                        <div>
                            <p className="text-base font-bold text-slate-700 mb-2">
                                Observaciones (opcional)
                            </p>
                            <input
                                type="text"
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                placeholder="Ej: Abono parcial, queda debiendo..."
                                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex gap-3 pb-2">
                            <button
                                onClick={cerrarPago}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl py-4 text-base transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={registrarPago}
                                disabled={guardando || !monto || parseFloat(monto) <= 0}
                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-2xl py-4 text-base transition-colors"
                            >
                                {guardando ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle size={20} />
                                )}
                                {guardando ? "Guardando..." : "Confirmar pago"}
                            </button>
                        </div>

                    </div>
                </div>
            ) : null}

        </div>
    );
}
