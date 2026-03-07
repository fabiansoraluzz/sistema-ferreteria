"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Package, Tag, TrendingUp, TrendingDown,
    AlertTriangle, CheckCircle, XCircle, Plus,
} from "lucide-react";
import api from "@/lib/api";
import { Producto } from "@/types";
import { Alerta } from "@/components/ui/Alerta";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { useAlerta } from "@/hooks/useAlerta";

export default function DetalleProductoPage() {
    const params = useParams();
    const router = useRouter();
    const alerta = useAlerta();
    const [producto, setProducto] = useState<Producto | null>(null);
    const [cargando, setCargando] = useState(true);
    const [cantidad, setCantidad] = useState("");
    const [motivo, setMotivo] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [confirmarEntrada, setConfirmarEntrada] = useState(false);

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

    async function registrarEntrada() {
        if (!cantidad || parseFloat(cantidad) <= 0) return;
        setGuardando(true);
        setConfirmarEntrada(false);
        try {
            await api.post(`/Productos/RegistrarEntradaMercaderia/${params.id}`, {
                cantidad: parseFloat(cantidad),
                motivo: motivo || "Entrada de mercadería",
            });
            alerta.mostrar("El stock se actualizó correctamente", "ok");
            setCantidad("");
            setMotivo("");
            setMostrarForm(false);
            cargarProducto();
        } catch {
            alerta.mostrar("Hubo un error al registrar la entrada", "error");
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
        ? "sinStock" : producto.tieneStockBajo ? "pocoStock" : "ok";

    return (
        <div className="space-y-5">

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

            <Alerta mensaje={alerta.mensaje} tipo={alerta.tipo} visible={alerta.visible} />

            <div className={`rounded-2xl p-6 text-white shadow-sm ${estadoStock === "sinStock" ? "bg-red-500" :
                    estadoStock === "pocoStock" ? "bg-orange-400" : "bg-green-500"
                }`}>
                <div className="flex items-center gap-2 mb-4">
                    {estadoStock === "sinStock" && <XCircle size={22} />}
                    {estadoStock === "pocoStock" && <AlertTriangle size={22} />}
                    {estadoStock === "ok" && <CheckCircle size={22} />}
                    <p className="text-base font-semibold">
                        {estadoStock === "sinStock" ? "Sin stock — necesita reabastecerse" :
                            estadoStock === "pocoStock" ? "Poco stock — conviene reabastecer" :
                                "Stock suficiente"}
                    </p>
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
                    <p className="text-lg font-bold text-slate-800">¿Cuántas unidades entraron?</p>
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
                            onClick={() => { setMostrarForm(false); setCantidad(""); setMotivo(""); }}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl py-4 text-base transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => setConfirmarEntrada(true)}
                            disabled={!cantidad || parseFloat(cantidad) <= 0}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl py-4 text-base transition-colors"
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            )}

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

            <ModalConfirmacion
                visible={confirmarEntrada}
                titulo="¿Confirmas la entrada?"
                descripcion={`Se agregarán ${cantidad} ${producto.unidadMedida} al stock de "${producto.nombre}"`}
                textoConfirmar="Sí, registrar"
                colorConfirmar="azul"
                cargando={guardando}
                onCancelar={() => setConfirmarEntrada(false)}
                onConfirmar={registrarEntrada}
            />

        </div>
    );
}