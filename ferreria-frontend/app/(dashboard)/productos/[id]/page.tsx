"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Package,
    Tag,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Plus,
} from "lucide-react";
import api from "@/lib/api";
import { Producto } from "@/types";

export default function DetalleProductoPage() {
    const params = useParams();
    const router = useRouter();
    const [producto, setProducto] = useState<Producto | null>(null);
    const [cargando, setCargando] = useState(true);
    const [cantidad, setCantidad] = useState("");
    const [motivo, setMotivo] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState<"ok" | "error">("ok");
    const [mostrarForm, setMostrarForm] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        cargarProducto();
    }, []);

    async function cargarProducto() {
        try {
            const { data } = await api.get<Producto>(
                `/Productos/ObtenerDetalleProducto/${params.id}`
            );
            setProducto(data);
        } catch {
            router.push("/productos");
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

    async function registrarEntrada() {
        if (!cantidad || parseFloat(cantidad) <= 0) return;
        setGuardando(true);
        try {
            await api.post(`/Productos/RegistrarEntradaMercaderia/${params.id}`, {
                cantidad: parseFloat(cantidad),
                motivo: motivo || "Entrada de mercadería",
            });
            mostrarMensajeTemp("El stock se actualizó correctamente", "ok");
            setCantidad("");
            setMotivo("");
            setMostrarForm(false);
            cargarProducto();
        } catch {
            mostrarMensajeTemp("Hubo un error al registrar la entrada", "error");
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-base">Cargando producto...</p>
            </div>
        );
    }

    if (!producto) return null;

    const estadoStock = producto.stockActual === 0
        ? "sinStock"
        : producto.tieneStockBajo
            ? "pocoStock"
            : "ok";

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
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-500">Inventario</p>
                    <h1 className="text-xl font-bold text-slate-800 truncate">{producto.nombre}</h1>
                </div>
            </div>

            {/* Mensaje */}
            {mensaje && (
                <div className={`flex items-center gap-3 rounded-2xl px-4 py-4 text-base font-semibold ${tipoMensaje === "ok"
                        ? "bg-green-50 border-2 border-green-200 text-green-700"
                        : "bg-red-50 border-2 border-red-200 text-red-700"
                    }`}>
                    {tipoMensaje === "ok"
                        ? <CheckCircle size={22} />
                        : <XCircle size={22} />
                    }
                    {mensaje}
                </div>
            )}

            {/* Card de stock actual */}
            <div className={`rounded-2xl p-6 text-white shadow-sm ${estadoStock === "sinStock" ? "bg-red-500" :
                    estadoStock === "pocoStock" ? "bg-orange-400" :
                        "bg-green-500"
                }`}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        {estadoStock === "sinStock" && <XCircle size={22} />}
                        {estadoStock === "pocoStock" && <AlertTriangle size={22} />}
                        {estadoStock === "ok" && <CheckCircle size={22} />}
                        <p className="text-base font-semibold">
                            {estadoStock === "sinStock" ? "Sin stock — necesita reabastecerse" :
                                estadoStock === "pocoStock" ? "Poco stock — conviene reabastecer" :
                                    "Stock suficiente"}
                        </p>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-8xl font-bold">{producto.stockActual}</p>
                    <p className="text-xl mt-2 opacity-90">{producto.unidadMedida} disponibles</p>
                    {estadoStock !== "ok" && (
                        <p className="text-base mt-2 opacity-80">
                            Mínimo requerido: {producto.stockMinimo} {producto.unidadMedida}
                        </p>
                    )}
                </div>
            </div>

            {/* Botón entró mercadería */}
            {!mostrarForm ? (
                <button
                    onClick={() => setMostrarForm(true)}
                    className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl py-5 text-lg shadow-sm transition-colors"
                >
                    <Plus size={24} />
                    Entró mercadería — registrar cantidad
                </button>
            ) : (
                <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 space-y-4 shadow-sm">
                    <p className="text-lg font-bold text-slate-800">
                        ¿Cuántas unidades entraron?
                    </p>
                    <input
                        type="number"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        placeholder="0"
                        min="0"
                        autoFocus
                        className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 text-5xl text-center font-bold text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                    />
                    <input
                        type="text"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Motivo (opcional) — ej: compra a proveedor"
                        className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setMostrarForm(false);
                                setCantidad("");
                                setMotivo("");
                            }}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl py-4 text-base transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={registrarEntrada}
                            disabled={guardando || !cantidad || parseFloat(cantidad) <= 0}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-2xl py-4 text-base transition-colors"
                        >
                            {guardando ? "Guardando..." : "Guardar"}
                        </button>
                    </div>
                </div>
            )}

            {/* Datos del producto */}
            <div>
                <p className="text-lg font-bold text-slate-700 mb-3">Información del producto</p>
                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                    <div className="flex items-center gap-4 px-4 py-4 border-b border-slate-100">
                        <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                            <Tag size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Categoría</p>
                            <p className="text-base font-semibold text-slate-800">{producto.nombreCategoria}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-4 border-b border-slate-100">
                        <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                            <TrendingDown size={20} className="text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Precio de compra</p>
                            <p className="text-base font-semibold text-slate-800">S/ {producto.precioCompra.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-4 border-b border-slate-100">
                        <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                            <TrendingUp size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Precio de venta</p>
                            <p className="text-xl font-bold text-green-600">S/ {producto.precioVenta.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 px-4 py-4">
                        <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                            <Package size={20} className="text-slate-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Stock mínimo requerido</p>
                            <p className="text-base font-semibold text-slate-800">
                                {producto.stockMinimo} {producto.unidadMedida}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}