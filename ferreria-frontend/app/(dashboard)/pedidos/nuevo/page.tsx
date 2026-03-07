"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle,
    Package,
    Users,
    ChevronRight,
} from "lucide-react";
import api from "@/lib/api";
import { Cliente, Producto } from "@/types";
import { normalizar } from "@/lib/utils";
import { Alerta } from "@/components/ui/Alerta";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { useAlerta } from "@/hooks/useAlerta";

interface ItemPedido {
    producto: Producto;
    cantidad: number;
}

export default function NuevoPedidoPage() {
    const router = useRouter();
    const alerta = useAlerta();

    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [categorias, setCategorias] = useState<string[]>([]);
    const [categoriaFiltro, setCategoriaFiltro] = useState("Todas");
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [busquedaCliente, setBusquedaCliente] = useState("");
    const [busquedaProducto, setBusquedaProducto] = useState("");
    const [items, setItems] = useState<ItemPedido[]>([]);
    const [fechaEntrega, setFechaEntrega] = useState("");
    const [observaciones, setObservaciones] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [paso, setPaso] = useState<1 | 2 | 3>(1);
    const [confirmarSalir, setConfirmarSalir] = useState(false);
    const [confirmarPedido, setConfirmarPedido] = useState(false);

    useEffect(() => {
        cargarDatos();
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    async function cargarDatos() {
        try {
            const [resClientes, resProductos] = await Promise.all([
                api.get<Cliente[]>("/Clientes/ObtenerClientes"),
                api.get<Producto[]>("/Productos/ObtenerProductos"),
            ]);
            setClientes(resClientes.data);
            setProductos(resProductos.data);
            const cats = Array.from(
                new Set(resProductos.data.map((p) => p.nombreCategoria))
            ).sort();
            setCategorias(["Todas", ...cats]);
        } catch {
            console.error("Error cargando datos");
        }
    }

    function seleccionarCliente(cliente: Cliente) {
        setClienteSeleccionado(cliente);
        setBusquedaCliente(cliente.nombreCompleto);
        setPaso(2);
    }

    function agregarProducto(producto: Producto) {
        const existente = items.find((i) => i.producto.id === producto.id);
        if (existente) {
            setItems(items.map((i) =>
                i.producto.id === producto.id
                    ? { ...i, cantidad: i.cantidad + 1 }
                    : i
            ));
        } else {
            setItems([...items, { producto, cantidad: 1 }]);
        }
        setBusquedaProducto("");
    }

    function actualizarCantidad(productoId: number, cantidad: number) {
        if (cantidad <= 0) {
            setItems(items.filter((i) => i.producto.id !== productoId));
        } else {
            setItems(items.map((i) =>
                i.producto.id === productoId ? { ...i, cantidad } : i
            ));
        }
    }

    function eliminarItem(productoId: number) {
        setItems(items.filter((i) => i.producto.id !== productoId));
    }

    const subtotal = items.reduce(
        (acc, i) => acc + i.producto.precioVenta * i.cantidad, 0
    );
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    const clientesFiltrados = clientes.filter((c) =>
        normalizar(c.nombreCompleto).includes(normalizar(busquedaCliente)) ||
        c.telefono.includes(busquedaCliente)
    );

    const productosFiltrados = productos.filter((p) => {
        const coincideCategoria =
            categoriaFiltro === "Todas" || p.nombreCategoria === categoriaFiltro;
        const coincideBusqueda =
            busquedaProducto === "" ||
            normalizar(p.nombre).includes(normalizar(busquedaProducto));
        return coincideCategoria && coincideBusqueda;
    });

    async function registrarPedido() {
        if (!clienteSeleccionado || items.length === 0) return;
        setGuardando(true);
        try {
            const { data } = await api.post("/Pedidos/CrearPedido", {
                clienteId: clienteSeleccionado.id,
                fechaEntrega: fechaEntrega
                    ? new Date(fechaEntrega + "T00:00:00Z").toISOString()
                    : null,
                observaciones: observaciones || null,
                detalles: items.map((i) => ({
                    productoId: i.producto.id,
                    cantidad: i.cantidad,
                })),
            });
            router.push(`/pedidos/${data.id}`);
        } catch {
            alerta.mostrar("Error al registrar el pedido. Verifica el stock disponible.", "error");
            setGuardando(false);
        }
    }

    return (
        <>
            <div className="space-y-5">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setConfirmarSalir(true)}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <p className="text-sm text-slate-500">Pedidos</p>
                        <h1 className="text-xl font-bold text-slate-800">Nuevo pedido</h1>
                    </div>
                </div>

                {/* Barra de pasos */}
                <div className="flex gap-2">
                    {[1, 2, 3].map((p) => (
                        <div
                            key={p}
                            className={`flex-1 h-2 rounded-full transition-all ${paso >= p ? "bg-blue-600" : "bg-slate-200"}`}
                        />
                    ))}
                </div>

                <Alerta mensaje={alerta.mensaje} tipo={alerta.tipo} visible={alerta.visible} />

                {/* PASO 1 — Seleccionar cliente */}
                {paso === 1 ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <Users size={20} className="text-blue-600" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Quien hace el pedido?</h2>
                        </div>

                        <input
                            type="text"
                            value={busquedaCliente}
                            onChange={(e) => setBusquedaCliente(e.target.value)}
                            placeholder="Busca por nombre o telefono..."
                            className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
                            autoFocus
                        />

                        <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden max-h-72 overflow-y-auto shadow-sm">
                            {clientesFiltrados.length === 0 ? (
                                <p className="text-base text-slate-500 px-4 py-6 text-center">Sin resultados</p>
                            ) : (
                                clientesFiltrados.map((c) => (
                                    <button
                                        key={c.id}
                                        onClick={() => seleccionarCliente(c)}
                                        className="w-full flex items-center justify-between px-4 py-4 border-b border-slate-100 last:border-0 hover:bg-blue-50 text-left transition-colors"
                                    >
                                        <div>
                                            <p className="text-base font-semibold text-slate-800">{c.nombreCompleto}</p>
                                            <p className="text-sm text-slate-500">{c.telefono}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {c.deudaTotal > 0 ? (
                                                <span className="text-sm text-red-500 font-semibold">
                                                    Debe S/ {c.deudaTotal.toFixed(2)}
                                                </span>
                                            ) : null}
                                            <ChevronRight size={16} className="text-slate-300" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => router.push("/clientes/nuevo")}
                            className="w-full border-2 border-blue-300 text-blue-600 font-bold rounded-2xl py-4 text-base hover:bg-blue-50 transition-colors"
                        >
                            + Registrar cliente nuevo
                        </button>
                    </div>
                ) : null}

                {/* PASO 2 — Agregar productos */}
                {paso === 2 ? (
                    <div className="space-y-4">

                        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl px-4 py-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600 font-medium">Cliente seleccionado</p>
                                <p className="text-base font-bold text-blue-800">
                                    {clienteSeleccionado?.nombreCompleto}
                                </p>
                            </div>
                            <button
                                onClick={() => { setClienteSeleccionado(null); setBusquedaCliente(""); setPaso(1); }}
                                className="text-sm text-blue-500 hover:text-blue-700 font-semibold"
                            >
                                Cambiar
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <Package size={20} className="text-blue-600" />
                            </div>
                            <h2 className="text-lg font-bold text-slate-800">Que pide?</h2>
                        </div>

                        <input
                            type="text"
                            value={busquedaProducto}
                            onChange={(e) => setBusquedaProducto(e.target.value)}
                            placeholder="Busca el producto..."
                            className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
                        />

                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {categorias.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoriaFiltro(cat)}
                                    className={`shrink-0 text-sm px-4 py-2 rounded-xl font-semibold transition-colors border-2 ${categoriaFiltro === cat
                                            ? "bg-blue-600 border-blue-600 text-white"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden max-h-60 overflow-y-auto shadow-sm">
                            {productosFiltrados.length === 0 ? (
                                <p className="text-base text-slate-500 px-4 py-6 text-center">Sin resultados</p>
                            ) : (
                                productosFiltrados.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => agregarProducto(p)}
                                        className="w-full flex items-center justify-between px-4 py-4 border-b border-slate-100 last:border-0 hover:bg-blue-50 text-left transition-colors"
                                    >
                                        <div>
                                            <p className="text-base font-semibold text-slate-800">{p.nombre}</p>
                                            <p className="text-sm text-slate-500">
                                                Stock: {p.stockActual} {p.unidadMedida}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-bold text-blue-600">
                                                S/ {p.precioVenta.toFixed(2)}
                                            </p>
                                            {p.tieneStockBajo ? (
                                                <p className="text-xs text-orange-500 font-semibold">Poco stock</p>
                                            ) : null}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {items.length > 0 ? (
                            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                                        Productos agregados
                                    </p>
                                </div>
                                {items.map((item) => (
                                    <div
                                        key={item.producto.id}
                                        className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 last:border-0"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-base font-semibold text-slate-800 truncate">
                                                {item.producto.nombre}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                S/ {item.producto.precioVenta.toFixed(2)} c/u
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                                                className="w-10 h-10 bg-slate-100 rounded-xl text-slate-700 text-xl font-bold hover:bg-slate-200 flex items-center justify-center transition-colors"
                                            >
                                                −
                                            </button>
                                            <span className="text-lg font-bold w-8 text-center">{item.cantidad}</span>
                                            <button
                                                onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                                                className="w-10 h-10 bg-slate-100 rounded-xl text-slate-700 text-xl font-bold hover:bg-slate-200 flex items-center justify-center transition-colors"
                                            >
                                                +
                                            </button>
                                            <button
                                                onClick={() => eliminarItem(item.producto.id)}
                                                className="w-10 h-10 text-red-400 hover:text-red-600 text-2xl font-bold flex items-center justify-center transition-colors"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : null}

                        {items.length > 0 ? (
                            <div className="bg-blue-600 text-white rounded-2xl px-4 py-3 flex justify-between items-center">
                                <span className="text-base font-semibold">
                                    {items.length} {items.length === 1 ? "producto" : "productos"}
                                </span>
                                <span className="text-2xl font-bold">S/ {total.toFixed(2)}</span>
                            </div>
                        ) : null}

                        <button
                            onClick={() => setPaso(3)}
                            disabled={items.length === 0}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl py-5 text-lg transition-colors"
                        >
                            Continuar
                            <ChevronRight size={22} />
                        </button>
                    </div>
                ) : null}

                {/* PASO 3 — Confirmar */}
                {paso === 3 ? (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-800">Confirmar pedido</h2>

                        <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
                            <div className="px-4 py-3">
                                <p className="text-sm text-slate-500">Cliente</p>
                                <p className="text-base font-bold text-slate-800">
                                    {clienteSeleccionado?.nombreCompleto}
                                </p>
                            </div>
                            {items.map((item) => (
                                <div key={item.producto.id} className="flex justify-between px-4 py-3">
                                    <div>
                                        <p className="text-base font-semibold text-slate-800">{item.producto.nombre}</p>
                                        <p className="text-sm text-slate-500">
                                            {item.cantidad} x S/ {item.producto.precioVenta.toFixed(2)}
                                        </p>
                                    </div>
                                    <p className="text-base font-bold text-slate-800">
                                        S/ {(item.cantidad * item.producto.precioVenta).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-base text-slate-500">Subtotal</span>
                                <span className="text-base font-semibold text-slate-800">S/ {subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-3">
                                <span className="text-base text-slate-500">IGV (18%)</span>
                                <span className="text-base font-semibold text-slate-800">S/ {igv.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between px-4 py-4">
                                <span className="text-lg font-bold text-slate-800">Total</span>
                                <span className="text-2xl font-bold text-blue-600">S/ {total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-base font-semibold text-slate-700 mb-2">
                                Fecha de entrega (opcional)
                            </p>
                            <input
                                type="date"
                                value={fechaEntrega}
                                onChange={(e) => setFechaEntrega(e.target.value)}
                                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 text-base text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                            />
                        </div>

                        <div>
                            <p className="text-base font-semibold text-slate-700 mb-2">
                                Observaciones (opcional)
                            </p>
                            <textarea
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.target.value)}
                                placeholder="Instrucciones especiales..."
                                rows={3}
                                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all resize-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setPaso(2)}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl py-4 text-base transition-colors"
                            >
                                Volver
                            </button>
                            <button
                                onClick={() => setConfirmarPedido(true)}
                                disabled={guardando}
                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded-2xl py-4 text-base transition-colors"
                            >
                                <CheckCircle size={20} />
                                Confirmar pedido
                            </button>
                        </div>
                    </div>
                ) : null}

            </div>

            <ModalConfirmacion
                visible={confirmarSalir}
                titulo="Salir sin guardar?"
                descripcion="El pedido que estas creando se perdera. Esta accion no se puede deshacer."
                textoConfirmar="Si, salir"
                colorConfirmar="rojo"
                onCancelar={() => setConfirmarSalir(false)}
                onConfirmar={() => router.back()}
            />

            <ModalConfirmacion
                visible={confirmarPedido}
                titulo="Confirmar pedido?"
                descripcion={`Se creara un pedido de S/ ${total.toFixed(2)} para ${clienteSeleccionado?.nombreCompleto ?? ""}`}
                textoConfirmar="Si, crear pedido"
                colorConfirmar="verde"
                cargando={guardando}
                onCancelar={() => setConfirmarPedido(false)}
                onConfirmar={() => { setConfirmarPedido(false); registrarPedido(); }}
            />
        </>
    );
}