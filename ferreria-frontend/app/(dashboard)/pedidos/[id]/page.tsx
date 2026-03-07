"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Phone,
    Package,
    CheckCircle,
    Truck,
    XCircle,
    AlertTriangle,
    ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import { Pedido } from "@/types";

export default function DetallePedidoPage() {
    const params = useParams();
    const router = useRouter();
    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState<"ok" | "error">("ok");
    const [usuario, setUsuario] = useState<{ rol: string } | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const u = localStorage.getItem("usuario");
        if (u) setUsuario(JSON.parse(u));
        cargarPedido();
    }, []);

    async function cargarPedido() {
        try {
            const { data } = await api.get<Pedido>(
                `/Pedidos/ObtenerDetallePedido/${params.id}`
            );
            setPedido(data);
        } catch {
            router.push("/pedidos");
        } finally {
            setCargando(false);
        }
    }

    function mostrarMensajeTemp(texto: string, tipo: "ok" | "error") {
        setMensaje(texto);
        setTipoMensaje(tipo);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setMensaje(""), 5000);
    }

    async function avanzarEstado() {
        if (!pedido) return;
        const mapa: Record<string, string> = {
            Pendiente: "Confirmado",
            Confirmado: "EnReparto",
            EnReparto: "Entregado",
        };
        const nuevoEstado = mapa[pedido.estadoPedido];
        if (!nuevoEstado) return;
        setGuardando(true);
        try {
            await api.patch(`/Pedidos/AvanzarEstadoPedido/${params.id}`, { nuevoEstado });
            mostrarMensajeTemp(
                `El pedido ahora está: ${nuevoEstado === "EnReparto" ? "En Reparto" : nuevoEstado}`,
                "ok"
            );
            cargarPedido();
        } catch {
            mostrarMensajeTemp("Hubo un error al actualizar el estado del pedido", "error");
        } finally {
            setGuardando(false);
        }
    }

    async function cancelarPedido() {
        if (!confirm("¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.")) return;
        setGuardando(true);
        try {
            await api.patch(`/Pedidos/CancelarPedido/${params.id}`, {
                motivo: "Cancelado desde el sistema",
            });
            mostrarMensajeTemp("El pedido fue cancelado correctamente", "ok");
            cargarPedido();
        } catch {
            mostrarMensajeTemp("Hubo un error al cancelar el pedido", "error");
        } finally {
            setGuardando(false);
        }
    }

    function textoBoton(estado: string) {
        if (estado === "Pendiente") return "Confirmar este pedido";
        if (estado === "Confirmado") return "Marcar como enviado al cliente";
        if (estado === "EnReparto") return "Marcar como entregado";
        return "";
    }

    function colorBoton(estado: string) {
        if (estado === "Pendiente") return "bg-blue-600 hover:bg-blue-700";
        if (estado === "Confirmado") return "bg-orange-50 hover:bg-orange-600";
        if (estado === "EnReparto") return "bg-green-600 hover:bg-green-700";
        return "";
    }

    function iconoBoton(estado: string) {
        if (estado === "Pendiente") return <CheckCircle size={22} />;
        if (estado === "Confirmado") return <Truck size={22} />;
        if (estado === "EnReparto") return <CheckCircle size={22} />;
        return null;
    }

    function colorTarjetaEstado(estado: string) {
        if (estado === "Pendiente") return "bg-amber-50 border-amber-300 text-amber-700";
        if (estado === "Confirmado") return "bg-blue-50 border-blue-300 text-blue-700";
        if (estado === "EnReparto") return "bg-orange-50 border-orange-300 text-orange-700";
        if (estado === "Entregado") return "bg-green-50 border-green-300 text-green-700";
        if (estado === "Cancelado") return "bg-slate-50 border-slate-300 text-slate-600";
        return "bg-slate-50 border-slate-300 text-slate-600";
    }

    function descripcionEstado(estado: string) {
        if (estado === "Pendiente") return "Esperando confirmación";
        if (estado === "Confirmado") return "Listo para despachar";
        if (estado === "EnReparto") return "En camino al cliente";
        if (estado === "Entregado") return "Entregado al cliente";
        if (estado === "Cancelado") return "Este pedido fue cancelado";
        return "";
    }

    function etiquetaEstado(estado: string) {
        if (estado === "EnReparto") return "En Reparto";
        return estado;
    }

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-base">Cargando pedido...</p>
            </div>
        );
    }

    if (!pedido) return null;

    const hayBotonAvanzar = ["Pendiente", "Confirmado", "EnReparto"].includes(pedido.estadoPedido);

    const puedeCancel =
        usuario?.rol === "Administrador" &&
        pedido.estadoPedido !== "Cancelado" &&
        pedido.estadoPedido !== "Entregado";

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div className="flex-1">
                    <p className="text-sm text-slate-500">Pedidos</p>
                    <h1 className="text-xl font-bold text-slate-800">Pedido #{pedido.id}</h1>
                </div>
            </div>

            {/* Mensaje */}
            {mensaje && (
                <div className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-base font-semibold border-2 ${tipoMensaje === "ok"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
                    }`}>
                    {tipoMensaje === "ok"
                        ? <CheckCircle size={22} />
                        : <XCircle size={22} />
                    }
                    {mensaje}
                </div>
            )}

            {/* Estado actual */}
            <div className={`rounded-2xl px-4 py-4 border-2 flex items-center gap-3 ${colorTarjetaEstado(pedido.estadoPedido)}`}>
                {pedido.estadoPedido === "Pendiente" && <AlertTriangle size={24} />}
                {pedido.estadoPedido === "Confirmado" && <CheckCircle size={24} />}
                {pedido.estadoPedido === "EnReparto" && <Truck size={24} />}
                {pedido.estadoPedido === "Entregado" && <CheckCircle size={24} />}
                {pedido.estadoPedido === "Cancelado" && <XCircle size={24} />}
                <div>
                    <p className="text-base font-bold">
                        Estado: {etiquetaEstado(pedido.estadoPedido)}
                    </p>
                    <p className="text-sm opacity-80">
                        {descripcionEstado(pedido.estadoPedido)}
                    </p>
                </div>
            </div>

            {/* Botón acción principal */}
            {hayBotonAvanzar && (
                <button
                    onClick={avanzarEstado}
                    disabled={guardando}
                    className={`w-full flex items-center justify-center gap-3 text-white font-bold rounded-2xl py-5 text-lg shadow-sm transition-colors disabled:opacity-50 ${colorBoton(pedido.estadoPedido)}`}
                >
                    {guardando
                        ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : iconoBoton(pedido.estadoPedido)
                    }
                    {guardando ? "Procesando..." : textoBoton(pedido.estadoPedido)}
                </button>
            )}

            {/* Datos del cliente */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                        Cliente
                    </p>
                </div>
                <div className="px-4 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-lg font-bold text-slate-800">{pedido.nombreCliente}</p>
                        <a
                            href={`tel:${pedido.telefonoCliente}`}
                            className="flex items-center gap-2 text-blue-600 font-semibold mt-1"
                        >
                            <Phone size={16} />
                            {pedido.telefonoCliente}
                        </a>
                    </div>
                    <ChevronRight size={20} className="text-slate-300" />
                </div>
            </div>

            {/* Productos del pedido */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                        Productos pedidos
                    </p>
                </div>
                <div className="divide-y divide-slate-100">
                    {pedido.detalles.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 px-4 py-4">
                            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <Package size={20} className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-slate-800 truncate">
                                    {d.nombreProducto}
                                </p>
                                <p className="text-sm text-slate-400">
                                    {d.cantidad} {d.unidadMedida} × S/ {d.precioUnitario.toFixed(2)}
                                </p>
                            </div>
                            <p className="text-base font-bold text-slate-800 shrink-0">
                                S/ {d.subtotal.toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Totales */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                        Resumen de cobro
                    </p>
                </div>
                <div className="divide-y divide-slate-100">
                    <div className="flex justify-between px-4 py-4">
                        <span className="text-base text-slate-500">Subtotal</span>
                        <span className="text-base font-semibold text-slate-800">
                            S/ {pedido.subtotal.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between px-4 py-4">
                        <span className="text-base text-slate-500">IGV 18%</span>
                        <span className="text-base font-semibold text-slate-800">
                            S/ {pedido.montoImpuesto.toFixed(2)}
                        </span>
                    </div>
                    <div className="flex justify-between px-4 py-5">
                        <span className="text-lg font-bold text-slate-800">Total a cobrar</span>
                        <span className="text-2xl font-bold text-blue-600">
                            S/ {pedido.total.toFixed(2)}
                        </span>
                    </div>
                    {pedido.montoPagado > 0 && (
                        <div className="flex justify-between px-4 py-4 bg-green-50">
                            <span className="text-base font-semibold text-green-700">Ya pagó</span>
                            <span className="text-xl font-bold text-green-600">
                                S/ {pedido.montoPagado.toFixed(2)}
                            </span>
                        </div>
                    )}
                    {pedido.saldoPendiente > 0 && (
                        <div className="flex justify-between px-4 py-4 bg-red-50">
                            <span className="text-base font-semibold text-red-700">Falta cobrar</span>
                            <span className="text-xl font-bold text-red-600">
                                S/ {pedido.saldoPendiente.toFixed(2)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Observaciones */}
            {pedido.observaciones && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-4">
                    <p className="text-sm font-bold text-amber-700 uppercase tracking-wide mb-1">
                        Observaciones
                    </p>
                    <p className="text-base text-amber-800">{pedido.observaciones}</p>
                </div>
            )}

            {/* Fechas */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="flex justify-between px-4 py-4 border-b border-slate-100">
                    <span className="text-base text-slate-500">Fecha del pedido</span>
                    <span className="text-base font-semibold text-slate-800">
                        {new Date(pedido.fechaPedido).toLocaleDateString("es-PE", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </span>
                </div>
                {pedido.fechaEntrega && (
                    <div className="flex justify-between px-4 py-4">
                        <span className="text-base text-slate-500">Fecha de entrega</span>
                        <span className="text-base font-bold text-blue-600">
                            {new Date(pedido.fechaEntrega).toLocaleDateString("es-PE", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                            })}
                        </span>
                    </div>
                )}
            </div>

            {/* Cancelar pedido */}
            {puedeCancel && (
                <button
                    onClick={cancelarPedido}
                    disabled={guardando}
                    className="w-full flex items-center justify-center gap-3 bg-white hover:bg-red-50 text-red-600 font-bold rounded-2xl py-4 text-base border-2 border-red-200 transition-colors disabled:opacity-50"
                >
                    <XCircle size={20} />
                    Cancelar este pedido
                </button>
            )}

        </div>
    );
}
