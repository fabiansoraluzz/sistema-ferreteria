"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Package } from "lucide-react";
import api from "@/lib/api";
import { Proveedor, Producto } from "@/types";
import { Alerta } from "@/components/ui/Alerta";
import { useAlerta } from "@/hooks/useAlerta";

interface ItemCompra {
    productoId: number;
    nombreProducto: string;
    unidadMedida: string;
    cantidad: string;
}

export default function NuevaCompraPage() {
    const router = useRouter();
    const alerta = useAlerta();

    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [guardando, setGuardando] = useState(false);

    const [proveedorId, setProveedorId] = useState("");
    const [numeroFactura, setNumeroFactura] = useState("");
    const [fechaCompra, setFechaCompra] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [observaciones, setObservaciones] = useState("");
    const [items, setItems] = useState<ItemCompra[]>([]);

    // Para el selector de producto
    const [productoSelId, setProductoSelId] = useState("");

    useEffect(() => {
        async function cargar() {
            try {
                const [resP, resProd] = await Promise.all([
                    api.get<Proveedor[]>("/Proveedores/ObtenerProveedores"),
                    api.get<Producto[]>("/Productos/ObtenerProductos"),
                ]);
                setProveedores(resP.data);
                setProductos(resProd.data.filter(p => p.estaActivo));
            } catch {
                alerta.mostrar("Error cargando datos", "error");
            }
        }
        cargar();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    function agregarProducto() {
        if (!productoSelId) return;
        const ya = items.find(i => i.productoId === Number(productoSelId));
        if (ya) {
            alerta.mostrar("Ese producto ya está en la lista", "error");
            return;
        }
        const prod = productos.find(p => p.id === Number(productoSelId))!;
        setItems(prev => [...prev, {
            productoId: prod.id,
            nombreProducto: prod.nombre,
            unidadMedida: prod.unidadMedida,
            cantidad: "1",
        }]);
        setProductoSelId("");
    }

    function quitarProducto(productoId: number) {
        setItems(prev => prev.filter(i => i.productoId !== productoId));
    }

    function cambiarCantidad(productoId: number, valor: string) {
        setItems(prev => prev.map(i =>
            i.productoId === productoId ? { ...i, cantidad: valor } : i
        ));
    }

    async function guardar() {
        if (!proveedorId) { alerta.mostrar("Selecciona un proveedor", "error"); return; }
        if (!numeroFactura.trim()) { alerta.mostrar("Ingresa el número de factura", "error"); return; }
        if (items.length === 0) { alerta.mostrar("Agrega al menos un producto", "error"); return; }

        const cantidadesInvalidas = items.some(i => !i.cantidad || Number(i.cantidad) <= 0);
        if (cantidadesInvalidas) { alerta.mostrar("Todas las cantidades deben ser mayores a cero", "error"); return; }

        setGuardando(true);
        try {
            await api.post("/Compras/RegistrarCompra", {
                proveedorId: Number(proveedorId),
                numeroFactura: numeroFactura.trim(),
                fechaCompra: new Date(fechaCompra).toISOString(),
                observaciones: observaciones.trim() || null,
                detalles: items.map(i => ({
                    productoId: i.productoId,
                    cantidad: Number(i.cantidad),
                })),
            });
            router.push("/compras");
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { message?: string } } })
                ?.response?.data?.message;
            alerta.mostrar(msg ?? "Error al registrar la compra", "error");
        } finally {
            setGuardando(false);
        }
    }

    const productosDisponibles = productos.filter(
        p => !items.find(i => i.productoId === p.id)
    );

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
                <div>
                    <p className="text-sm text-slate-500">Compras</p>
                    <h1 className="text-xl font-bold text-slate-800">Registrar compra</h1>
                </div>
            </div>

            <Alerta mensaje={alerta.mensaje} tipo={alerta.tipo} visible={alerta.visible} />

            {/* Proveedor */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Proveedor</p>
                </div>
                <div className="px-4 py-4 space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2 block">
                            Proveedor <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={proveedorId}
                            onChange={e => setProveedorId(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                        >
                            <option value="">Selecciona un proveedor...</option>
                            {proveedores.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                        {proveedores.length === 0 && (
                            <p className="text-sm text-amber-600 mt-2">
                                No hay proveedores. <a href="/proveedores/nuevo" className="underline font-semibold">Crear uno</a>
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2 block">
                            Número de factura <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={numeroFactura}
                            onChange={e => setNumeroFactura(e.target.value)}
                            placeholder="Ej: F001-00123456"
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2 block">
                            Fecha de compra
                        </label>
                        <input
                            type="date"
                            value={fechaCompra}
                            onChange={e => setFechaCompra(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-slate-600 mb-2 block">
                            Observaciones
                        </label>
                        <textarea
                            value={observaciones}
                            onChange={e => setObservaciones(e.target.value)}
                            placeholder="Opcional..."
                            rows={2}
                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Productos */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                        Productos recibidos
                    </p>
                </div>
                <div className="px-4 py-4 space-y-4">

                    {/* Selector */}
                    <div className="flex gap-2">
                        <select
                            value={productoSelId}
                            onChange={e => setProductoSelId(e.target.value)}
                            className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                        >
                            <option value="">Selecciona un producto...</option>
                            {productosDisponibles.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre} ({p.unidadMedida})
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={agregarProducto}
                            disabled={!productoSelId}
                            className="w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-colors shrink-0"
                        >
                            <Plus size={22} />
                        </button>
                    </div>

                    {/* Lista de items */}
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <Package size={36} className="text-slate-300" />
                            <p className="text-sm text-slate-400">Agrega productos a la compra</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {items.map(item => (
                                <div
                                    key={item.productoId}
                                    className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-3"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-semibold text-slate-800 truncate">
                                            {item.nombreProducto}
                                        </p>
                                        <p className="text-sm text-slate-400">{item.unidadMedida}</p>
                                    </div>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={item.cantidad}
                                        onChange={e => cambiarCantidad(item.productoId, e.target.value)}
                                        className="w-24 bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-base text-center font-bold text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                                    />
                                    <button
                                        onClick={() => quitarProducto(item.productoId)}
                                        className="w-9 h-9 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Botón guardar */}
            <button
                onClick={guardar}
                disabled={guardando}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl py-5 text-lg shadow-sm transition-colors disabled:opacity-50"
            >
                {guardando ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <Plus size={22} />
                )}
                {guardando ? "Registrando..." : "Registrar compra"}
            </button>

        </div>
    );
}