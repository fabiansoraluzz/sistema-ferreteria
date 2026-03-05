"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Dashboard, ProductoResumen } from "@/types";

export default function InicioPage() {
    const router = useRouter();
    const [dashboard, setDashboard] = useState<Dashboard | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [productos, setProductos] = useState<ProductoResumen[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarDashboard();
    }, []);

    async function cargarDashboard() {
        try {
            const { data } = await api.get<Dashboard>("/Dashboard/ObtenerResumenDia");
            setDashboard(data);
        } catch {
            console.error("Error cargando dashboard");
        } finally {
            setCargando(false);
        }
    }

    async function buscarProducto(valor: string) {
        setBusqueda(valor);
        if (valor.trim().length < 2) {
            setProductos([]);
            return;
        }
        setBuscando(true);
        try {
            const { data } = await api.get<ProductoResumen[]>(
                `/Productos/ObtenerProductos?busqueda=${valor}`
            );
            setProductos(data);
        } catch {
            console.error("Error buscando producto");
        } finally {
            setBuscando(false);
        }
    }

    function colorEstado(estado: string) {
        const colores: Record<string, string> = {
            Pendiente: "bg-yellow-100 text-yellow-700",
            Confirmado: "bg-blue-100 text-blue-700",
            EnReparto: "bg-orange-100 text-orange-700",
            Entregado: "bg-green-100 text-green-700",
            Cancelado: "bg-red-100 text-red-700",
        };
        return colores[estado] ?? "bg-gray-100 text-gray-700";
    }

    function colorStock(producto: ProductoResumen) {
        if (producto.stockActual === 0) return "text-red-600 font-bold";
        if (producto.tieneStockBajo) return "text-orange-500 font-bold";
        return "text-green-600 font-bold";
    }

    if (cargando) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">

            {/* Buscador de productos */}
            <div className="relative">
                <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => buscarProducto(e.target.value)}
                    placeholder="🔍 Busca un producto para ver su stock..."
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {busqueda.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 z-20 max-h-60 overflow-y-auto">
                        {buscando ? (
                            <p className="text-sm text-gray-500 px-4 py-3">Buscando...</p>
                        ) : productos.length === 0 ? (
                            <p className="text-sm text-gray-500 px-4 py-3">Sin resultados</p>
                        ) : (
                            productos.map((p) => (
                                <div key={p.id} className="px-4 py-3 border-b border-gray-100 last:border-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-800">{p.nombre}</span>
                                        <span className={`text-sm ${colorStock(p)}`}>
                                            {p.stockActual} {p.unidadMedida}
                                        </span>
                                    </div>
                                    {p.tieneStockBajo && (
                                        <span className="text-xs text-orange-500">⚠️ Stock bajo</span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Botón Nuevo Pedido */}
            <Link
                href="/pedidos/nuevo"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-4 text-center text-lg transition-colors"
            >
                + Nuevo Pedido
            </Link>

            {/* Tarjetas KPI */}
            <div className="grid grid-cols-3 gap-3">
                <Link href="/productos?filtro=stockBajo">
                    <div className={`rounded-xl p-4 text-center cursor-pointer ${(dashboard?.productosConStockBajo ?? 0) > 0
                            ? "bg-red-500 text-white"
                            : "bg-green-500 text-white"
                        }`}>
                        <p className="text-2xl font-bold">
                            {dashboard?.productosConStockBajo ?? 0}
                        </p>
                        <p className="text-xs mt-1 leading-tight">
                            {(dashboard?.productosConStockBajo ?? 0) > 0
                                ? "Por acabarse"
                                : "Todo en orden"}
                        </p>
                    </div>
                </Link>

                <Link href="/pedidos?estado=Pendiente">
                    <div className="bg-blue-500 text-white rounded-xl p-4 text-center cursor-pointer">
                        <p className="text-2xl font-bold">
                            {dashboard?.pedidosPendientesHoy ?? 0}
                        </p>
                        <p className="text-xs mt-1 leading-tight">Pedidos hoy</p>
                    </div>
                </Link>

                <Link href="/clientes">
                    <div className="bg-orange-500 text-white rounded-xl p-4 text-center cursor-pointer">
                        <p className="text-2xl font-bold">
                            S/{((dashboard?.deudaTotalClientes ?? 0)).toFixed(0)}
                        </p>
                        <p className="text-xs mt-1 leading-tight">Clientes deben</p>
                    </div>
                </Link>
            </div>

            {/* Ventas del mes */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-500">Ventas del mes</p>
                <p className="text-2xl font-bold text-gray-900">
                    S/ {(dashboard?.ventasDelMes ?? 0).toFixed(2)}
                </p>
            </div>

            {/* Últimos pedidos */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-800">Últimos movimientos</h2>
                </div>
                {(dashboard?.ultimosPedidos ?? []).length === 0 ? (
                    <p className="text-sm text-gray-500 px-4 py-4">Sin pedidos aún.</p>
                ) : (
                    dashboard?.ultimosPedidos.map((pedido) => (
                        <Link
                            key={pedido.id}
                            href={`/pedidos/${pedido.id}`}
                            className="flex items-center justify-between px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-800">
                                    {pedido.nombreCliente}
                                </p>
                                <p className="text-xs text-gray-500">
                                    S/ {pedido.total.toFixed(2)}
                                </p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${colorEstado(pedido.estadoPedido)}`}>
                                {pedido.estadoPedido}
                            </span>
                        </Link>
                    ))
                )}
            </div>

        </div>
    );
}