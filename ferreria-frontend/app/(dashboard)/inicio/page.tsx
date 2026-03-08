"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
    Search,
    Package,
    AlertTriangle,
    CheckCircle,
    Users,
    ClipboardList,
    TrendingUp,
    ChevronRight,
    Plus,
    Truck,
} from "lucide-react";
import api from "@/lib/api";
import { Dashboard, ProductoResumen, CuentaPorCobrar } from "@/types";
import { normalizar } from "@/lib/utils";

export default function InicioPage() {
    const [dashboard, setDashboard] = useState<Dashboard | null>(null);
    const [todosProductos, setTodosProductos] = useState<ProductoResumen[]>([]);
    const [deudores, setDeudores] = useState<CuentaPorCobrar[]>([]);
    const [busqueda, setBusqueda] = useState("");
    const [resultados, setResultados] = useState<ProductoResumen[]>([]);
    const [mostrarDropdown, setMostrarDropdown] = useState(false);
    const [cargando, setCargando] = useState(true);
    const contenedorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        cargarDatos();
        function handleClickFuera(e: MouseEvent) {
            if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
                setMostrarDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickFuera);
        return () => document.removeEventListener("mousedown", handleClickFuera);
    }, []);

    async function cargarDatos() {
        try {
            const [resDashboard, resProductos, resDeudores] = await Promise.all([
                api.get<Dashboard>("/Dashboard/ObtenerResumenDia"),
                api.get<ProductoResumen[]>("/Productos/ObtenerProductos"),
                api.get<CuentaPorCobrar[]>("/Pagos/ObtenerCuentasPorCobrar"),
            ]);
            setDashboard(resDashboard.data);
            setTodosProductos(resProductos.data);
            setDeudores(resDeudores.data);
        } catch {
            console.error("Error cargando datos");
        } finally {
            setCargando(false);
        }
    }

    function buscar(valor: string) {
        setBusqueda(valor);
        setMostrarDropdown(true);
        if (valor.trim().length < 2) {
            setResultados([]);
            return;
        }
        setResultados(
            todosProductos.filter((p) =>
                normalizar(p.nombre).includes(normalizar(valor))
            )
        );
    }

    const agotados = todosProductos.filter(p => p.stockActual === 0);
    const bajos = todosProductos.filter(p => p.tieneStockBajo && p.stockActual > 0);

    const totalDeuda = deudores.reduce((acc, d) => acc + d.saldoPendiente, 0);

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-base">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Buscador de productos */}
            <div>
                <p className="text-base font-semibold text-slate-500 mb-2">
                    Consulta rápida de stock
                </p>
                <div className="relative" ref={contenedorRef}>
                    <div className="relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => buscar(e.target.value)}
                            onFocus={() => busqueda.length >= 2 && setMostrarDropdown(true)}
                            placeholder="¿Cuánto hay de un producto?"
                            className="w-full bg-white border-2 border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 shadow-sm transition-all"
                        />
                    </div>
                    {mostrarDropdown && busqueda.length >= 2 && (
                        <div className="absolute top-full left-0 right-0 bg-white border-2 border-slate-200 rounded-2xl shadow-xl mt-2 z-20 overflow-hidden">
                            {resultados.length === 0 ? (
                                <div className="px-4 py-6 text-center">
                                    <Package size={36} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-slate-500 text-base">
                                        No se encontró ningún producto con ese nombre
                                    </p>
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                                    {resultados.map((p) => (
                                        <Link
                                            key={p.id}
                                            href={`/productos/${p.id}`}
                                            onClick={() => setMostrarDropdown(false)}
                                            className="flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors"
                                        >
                                            <div>
                                                <p className="text-lg font-semibold text-slate-800">{p.nombre}</p>
                                                <p className="text-sm text-slate-400">{p.unidadMedida}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-3xl font-bold ${p.stockActual === 0
                                                    ? "text-red-600"
                                                    : p.tieneStockBajo
                                                        ? "text-orange-500"
                                                        : "text-green-600"
                                                    }`}>
                                                    {p.stockActual}
                                                </p>
                                                <p className={`text-sm font-semibold ${p.stockActual === 0
                                                    ? "text-red-500"
                                                    : p.tieneStockBajo
                                                        ? "text-orange-500"
                                                        : "text-green-500"
                                                    }`}>
                                                    {p.stockActual === 0
                                                        ? "Sin stock"
                                                        : p.tieneStockBajo
                                                            ? "Poco stock"
                                                            : "Hay suficiente"}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* SECCIÓN 1 — Productos que necesitan atención */}
            <div>
                <p className="text-lg font-bold text-slate-700 mb-3">
                    Estado del inventario
                </p>

                {agotados.length === 0 && bajos.length === 0 ? (
                    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
                            <CheckCircle size={30} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-green-700">
                                Todo el inventario está bien
                            </p>
                            <p className="text-base text-green-600">
                                Todos los {todosProductos.length} productos tienen stock suficiente
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">

                        {/* Productos sin stock */}
                        {agotados.length > 0 && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-2xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-4 bg-red-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
                                            <Package size={22} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-red-700">
                                                {agotados.length === 1
                                                    ? "1 producto sin stock"
                                                    : `${agotados.length} productos sin stock`}
                                            </p>
                                            <p className="text-sm text-red-500">
                                                Necesitan reabastecerse urgente
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="divide-y divide-red-100">
                                    {agotados.slice(0, 4).map((p) => (
                                        <Link
                                            key={p.id}
                                            href={`/productos/${p.id}`}
                                            className="flex items-center justify-between px-4 py-4 hover:bg-red-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                                                <p className="text-base font-semibold text-slate-700">{p.nombre}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-bold text-red-600 bg-red-100 px-3 py-1 rounded-xl">
                                                    Sin stock
                                                </span>
                                                <ChevronRight size={16} className="text-red-400" />
                                            </div>
                                        </Link>
                                    ))}
                                    {agotados.length > 4 && (
                                        <Link
                                            href="/productos"
                                            className="flex items-center justify-center gap-2 px-4 py-3 text-base font-semibold text-red-600 hover:bg-red-50"
                                        >
                                            Ver los {agotados.length - 4} restantes
                                            <ChevronRight size={16} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Productos con poco stock */}
                        {bajos.length > 0 && (
                            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-4 bg-orange-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 bg-orange-400 rounded-xl flex items-center justify-center shrink-0">
                                            <AlertTriangle size={22} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-base font-bold text-orange-700">
                                                {bajos.length === 1
                                                    ? "1 producto con poco stock"
                                                    : `${bajos.length} productos con poco stock`}
                                            </p>
                                            <p className="text-sm text-orange-500">
                                                Hay poca cantidad, conviene reabastecer pronto
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="divide-y divide-orange-100">
                                    {bajos.slice(0, 4).map((p) => (
                                        <Link
                                            key={p.id}
                                            href={`/productos/${p.id}`}
                                            className="flex items-center justify-between px-4 py-4 hover:bg-orange-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 bg-orange-400 rounded-full shrink-0" />
                                                <p className="text-base font-semibold text-slate-700">{p.nombre}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-base font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-xl">
                                                    Quedan {p.stockActual} {p.unidadMedida}
                                                </span>
                                                <ChevronRight size={16} className="text-orange-400" />
                                            </div>
                                        </Link>
                                    ))}
                                    {bajos.length > 4 && (
                                        <Link
                                            href="/productos"
                                            className="flex items-center justify-center gap-2 px-4 py-3 text-base font-semibold text-orange-600 hover:bg-orange-50"
                                        >
                                            Ver los {bajos.length - 4} restantes
                                            <ChevronRight size={16} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                )}
            </div>

            {/* SECCIÓN 2 — Clientes que deben dinero */}
            <div>
                <p className="text-lg font-bold text-slate-700 mb-3">
                    Clientes que deben dinero
                </p>

                {deudores.length === 0 ? (
                    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
                            <CheckCircle size={30} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-green-700">
                                Ningún cliente debe dinero
                            </p>
                            <p className="text-base text-green-600">
                                Todas las cuentas están al día
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="flex items-center justify-between px-4 py-4 bg-slate-50 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                    <Users size={22} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-base font-bold text-slate-700">
                                        {deudores.length} {deudores.length === 1 ? "cliente debe" : "clientes deben"} en total
                                    </p>
                                    <p className="text-lg font-bold text-red-600">
                                        S/ {totalDeuda.toFixed(2)} pendientes de cobro
                                    </p>
                                </div>
                            </div>
                            <Link
                                href="/clientes"
                                className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors"
                            >
                                Ver todos
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {deudores.slice(0, 4).map((d) => (
                                <Link
                                    key={d.pedidoId}
                                    href={`/clientes/${d.clienteId}`}
                                    className="flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors"
                                >
                                    <div>
                                        <p className="text-base font-semibold text-slate-800">
                                            {d.nombreCliente}
                                        </p>
                                        <p className="text-sm text-slate-400">
                                            {d.telefonoCliente}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-base font-bold text-red-600">
                                            S/ {d.saldoPendiente.toFixed(2)}
                                        </span>
                                        <ChevronRight size={16} className="text-slate-300" />
                                    </div>
                                </Link>
                            ))}
                            {deudores.length > 4 && (
                                <Link
                                    href="/clientes"
                                    className="flex items-center justify-center gap-2 px-4 py-3 text-base font-semibold text-blue-600 hover:bg-slate-50"
                                >
                                    Ver los {deudores.length - 4} clientes restantes
                                    <ChevronRight size={16} />
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* SECCIÓN 3 — Pedidos del día */}
            <div>
                <p className="text-lg font-bold text-slate-700 mb-3">
                    Pedidos de hoy
                </p>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <Link href="/pedidos?estado=Pendiente">
                        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 hover:border-blue-300 hover:shadow-md transition-all">
                            <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                                <ClipboardList size={22} className="text-amber-600" />
                            </div>
                            <p className="text-3xl font-bold text-slate-800">
                                {dashboard?.pedidosPendientesHoy ?? 0}
                            </p>
                            <p className="text-base text-slate-500 mt-1">
                                Esperando atención
                            </p>
                        </div>
                    </Link>

                    <Link href="/pedidos">
                        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 hover:border-blue-300 hover:shadow-md transition-all">
                            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                                <Truck size={22} className="text-blue-600" />
                            </div>
                            <p className="text-3xl font-bold text-slate-800">
                                {dashboard?.ultimosPedidos?.length ?? 0}
                            </p>
                            <p className="text-base text-slate-500 mt-1">
                                Recientes
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Últimos pedidos */}
                {(dashboard?.ultimosPedidos ?? []).length > 0 && (
                    <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-slate-100">
                            {dashboard?.ultimosPedidos.slice(0, 4).map((pedido) => (
                                <Link
                                    key={pedido.id}
                                    href={`/pedidos/${pedido.id}`}
                                    className="flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors"
                                >
                                    <div>
                                        <p className="text-base font-semibold text-slate-800">
                                            {pedido.nombreCliente}
                                        </p>
                                        <p className="text-sm text-slate-400">
                                            S/ {pedido.total.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-sm px-3 py-1 rounded-full font-semibold ${pedido.estadoPedido === "Pendiente" ? "bg-amber-100 text-amber-700" :
                                            pedido.estadoPedido === "Confirmado" ? "bg-blue-100 text-blue-700" :
                                                pedido.estadoPedido === "EnReparto" ? "bg-orange-100 text-orange-700" :
                                                    pedido.estadoPedido === "Entregado" ? "bg-green-100 text-green-700" :
                                                        "bg-red-100 text-red-700"
                                            }`}>
                                            {pedido.estadoPedido === "EnReparto" ? "En Reparto" : pedido.estadoPedido}
                                        </span>
                                        <ChevronRight size={16} className="text-slate-300" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="border-t border-slate-100">
                            <Link
                                href="/pedidos"
                                className="flex items-center justify-center gap-2 px-4 py-4 text-base font-semibold text-blue-600 hover:bg-slate-50 transition-colors"
                            >
                                Ver todos los pedidos
                                <ChevronRight size={16} />
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* SECCIÓN 4 — Ventas del mes */}
            <div>
                <p className="text-lg font-bold text-slate-700 mb-3">
                    Ventas de este mes
                </p>
                <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center shrink-0">
                            <TrendingUp size={28} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total vendido este mes</p>
                            <p className="text-4xl font-bold text-green-600">
                                S/ {(dashboard?.ventasDelMes ?? 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 5 — Acciones rápidas */}
            <div>
                <p className="text-lg font-bold text-slate-700 mb-3">
                    Acciones rápidas
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <Link
                        href="/pedidos/nuevo"
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-5 flex flex-col items-center gap-3 shadow-sm transition-colors"
                    >
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Plus size={26} />
                        </div>
                        <p className="text-base font-bold text-center">Registrar nuevo pedido</p>
                    </Link>
                    <Link
                        href="/productos"
                        className="bg-slate-700 hover:bg-slate-800 text-white rounded-2xl p-5 flex flex-col items-center gap-3 shadow-sm transition-colors"
                    >
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <Package size={26} />
                        </div>
                        <p className="text-base font-bold text-center">Ver inventario completo</p>
                    </Link>
                </div>
            </div>

        </div>
    );
}