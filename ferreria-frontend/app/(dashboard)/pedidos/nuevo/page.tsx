"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Cliente, Producto } from "@/types";
import { normalizar } from "@/lib/utils";

interface ItemPedido {
    producto: Producto;
    cantidad: number;
}

export default function NuevoPedidoPage() {
    const router = useRouter();

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
    const [mensaje, setMensaje] = useState("");
    const [paso, setPaso] = useState<1 | 2 | 3>(1);
    const timerMensaje = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        cargarDatos();

        // Alerta al intentar salir
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

            // Extrae categorías únicas
            const cats = Array.from(
                new Set(resProductos.data.map((p) => p.nombreCategoria))
            ).sort();
            setCategorias(["Todas", ...cats]);
        } catch {
            console.error("Error cargando datos");
        }
    }

    function mostrarMensaje(texto: string) {
        setMensaje(texto);
        if (timerMensaje.current) clearTimeout(timerMensaje.current);
        timerMensaje.current = setTimeout(() => setMensaje(""), 5000);
    }

    function handleVolver() {
        const confirmar = window.confirm(
            "¿Estás seguro de que quieres salir? El pedido que estás creando se perderá."
        );
        if (confirmar) router.back();
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

    async function confirmarPedido() {
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
            mostrarMensaje("❌ Error al registrar el pedido. Verifica el stock disponible.");
            setGuardando(false);
        }
    }

    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleVolver}
                    className="text-gray-500 hover:text-gray-700 text-base"
                >
                    ← Volver
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Nuevo Pedido</h1>
            </div>

            {/* Pasos */}
            <div className="flex gap-2">
                {[1, 2, 3].map((p) => (
                    <div
                        key={p}
                        className={`flex-1 h-2 rounded-full ${paso >= p ? "bg-blue-600" : "bg-gray-200"}`}
                    />
                ))}
            </div>

            {/* Mensaje error */}
            {mensaje && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-base">
                    {mensaje}
                </div>
            )}

            {/* PASO 1 — Seleccionar cliente */}
            {paso === 1 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-gray-800">¿Quién hace el pedido?</h2>
                    <input
                        type="text"
                        value={busquedaCliente}
                        onChange={(e) => setBusquedaCliente(e.target.value)}
                        placeholder="Busca por nombre o teléfono..."
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-h-72 overflow-y-auto">
                        {clientesFiltrados.length === 0 ? (
                            <p className="text-base text-gray-500 px-4 py-4 text-center">Sin resultados.</p>
                        ) : (
                            clientesFiltrados.map((c) => (
                                <button
                                    key={c.id}
                                    onClick={() => seleccionarCliente(c)}
                                    className="w-full flex items-center justify-between px-4 py-4 border-b border-gray-100 last:border-0 hover:bg-blue-50 text-left"
                                >
                                    <div>
                                        <p className="text-base font-semibold text-gray-800">{c.nombreCompleto}</p>
                                        <p className="text-sm text-gray-500">{c.telefono}</p>
                                    </div>
                                    {c.deudaTotal > 0 && (
                                        <span className="text-sm text-red-500 font-medium">
                                            Debe S/ {c.deudaTotal.toFixed(2)}
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                    <button
                        onClick={() => router.push("/clientes/nuevo")}
                        className="w-full border border-blue-300 text-blue-600 font-semibold rounded-xl py-3 text-base hover:bg-blue-50"
                    >
                        + Registrar cliente nuevo
                    </button>
                </div>
            )}

            {/* PASO 2 — Agregar productos */}
            {paso === 2 && (
                <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                        <p className="text-sm text-blue-600">Cliente seleccionado</p>
                        <p className="text-base font-semibold text-blue-800">
                            {clienteSeleccionado?.nombreCompleto}
                        </p>
                    </div>

                    <h2 className="text-lg font-semibold text-gray-800">¿Qué pide?</h2>

                    {/* Buscador */}
                    <input
                        type="text"
                        value={busquedaProducto}
                        onChange={(e) => setBusquedaProducto(e.target.value)}
                        placeholder="Busca lo que pide..."
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* Filtro de categorías */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {categorias.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoriaFiltro(cat)}
                                className={`shrink-0 text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${categoriaFiltro === cat
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Lista de productos */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-h-60 overflow-y-auto">
                        {productosFiltrados.length === 0 ? (
                            <p className="text-base text-gray-500 px-4 py-4 text-center">Sin resultados.</p>
                        ) : (
                            productosFiltrados.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => agregarProducto(p)}
                                    className="w-full flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-blue-50 text-left"
                                >
                                    <div>
                                        <p className="text-base font-semibold text-gray-800">{p.nombre}</p>
                                        <p className="text-sm text-gray-500">
                                            Stock: {p.stockActual} {p.unidadMedida}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base font-bold text-blue-600">
                                            S/ {p.precioVenta.toFixed(2)}
                                        </p>
                                        {p.tieneStockBajo && (
                                            <p className="text-xs text-orange-500">⚠️ Stock bajo</p>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>

                    {/* Items agregados */}
                    {items.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                                <p className="text-sm font-semibold text-gray-600">Productos agregados</p>
                            </div>
                            {items.map((item) => (
                                <div
                                    key={item.producto.id}
                                    className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 last:border-0"
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-semibold text-gray-800 truncate">
                                            {item.producto.nombre}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            S/ {item.producto.precioVenta.toFixed(2)} c/u
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)}
                                            className="w-10 h-10 bg-gray-100 rounded-full text-gray-700 text-xl font-bold hover:bg-gray-200 flex items-center justify-center"
                                        >
                                            −
                                        </button>
                                        <span className="text-lg font-bold w-8 text-center">{item.cantidad}</span>
                                        <button
                                            onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)}
                                            className="w-10 h-10 bg-gray-100 rounded-full text-gray-700 text-xl font-bold hover:bg-gray-200 flex items-center justify-center"
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => eliminarItem(item.producto.id)}
                                            className="w-10 h-10 text-red-400 hover:text-red-600 text-2xl font-bold flex items-center justify-center"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Total parcial */}
                    {items.length > 0 && (
                        <div className="bg-blue-600 text-white rounded-xl px-4 py-3 flex justify-between items-center">
                            <span className="text-base">{items.length} producto(s)</span>
                            <span className="text-xl font-bold">S/ {total.toFixed(2)}</span>
                        </div>
                    )}

                    <button
                        onClick={() => setPaso(3)}
                        disabled={items.length === 0}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white font-bold rounded-xl py-4 text-lg transition-colors"
                    >
                        Continuar →
                    </button>
                </div>
            )}

            {/* PASO 3 — Confirmar */}
            {paso === 3 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800">Confirmar pedido</h2>

                    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                        <div className="px-4 py-3">
                            <p className="text-sm text-gray-500">Cliente</p>
                            <p className="text-base font-semibold text-gray-800">
                                {clienteSeleccionado?.nombreCompleto}
                            </p>
                        </div>
                        {items.map((item) => (
                            <div key={item.producto.id} className="flex justify-between px-4 py-3">
                                <div>
                                    <p className="text-base font-semibold text-gray-800">{item.producto.nombre}</p>
                                    <p className="text-sm text-gray-500">
                                        {item.cantidad} × S/ {item.producto.precioVenta.toFixed(2)}
                                    </p>
                                </div>
                                <p className="text-base font-bold">
                                    S/ {(item.cantidad * item.producto.precioVenta).toFixed(2)}
                                </p>
                            </div>
                        ))}
                        <div className="flex justify-between px-4 py-3">
                            <span className="text-base text-gray-500">Subtotal</span>
                            <span className="text-base">S/ {subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3">
                            <span className="text-base text-gray-500">IGV (18%)</span>
                            <span className="text-base">S/ {igv.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3">
                            <span className="text-lg font-bold text-gray-800">Total</span>
                            <span className="text-2xl font-bold text-blue-600">S/ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">
                            Fecha de entrega (opcional)
                        </label>
                        <input
                            type="date"
                            value={fechaEntrega}
                            onChange={(e) => setFechaEntrega(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-base font-medium text-gray-700 mb-1">
                            Observaciones (opcional)
                        </label>
                        <textarea
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Instrucciones especiales..."
                            rows={3}
                            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setPaso(2)}
                            className="flex-1 bg-gray-100 text-gray-700 font-semibold rounded-xl py-4 text-base"
                        >
                            ← Volver
                        </button>
                        <button
                            onClick={confirmarPedido}
                            disabled={guardando}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold rounded-xl py-4 text-base transition-colors"
                        >
                            {guardando ? "Registrando..." : "✅ Confirmar Pedido"}
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}