"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Package,
    Tag,
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
} from "lucide-react";
import api from "@/lib/api";

interface Categoria {
    id: number;
    nombre: string;
}

interface FormProducto {
    nombre: string;
    categoriaId: string;
    unidadMedida: string;
    precioCompra: string;
    precioVenta: string;
    stockInicial: string;
    stockMinimo: string;
}

const UNIDADES = ["unidad", "docena", "kilogramo"];

export default function NuevoProductoPage() {
    const router = useRouter();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [form, setForm] = useState<FormProducto>({
        nombre: "",
        categoriaId: "",
        unidadMedida: "unidad",
        precioCompra: "",
        precioVenta: "",
        stockInicial: "",
        stockMinimo: "",
    });
    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState("");
    const [tipoMensaje, setTipoMensaje] = useState<"ok" | "error">("ok");
    const [errores, setErrores] = useState<Partial<FormProducto>>({});

    useEffect(() => {
        cargarCategorias();
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    async function cargarCategorias() {
        try {
            const { data } = await api.get<Categoria[]>("/Categorias/ObtenerCategorias");
            setCategorias(data);
        } catch {
            console.error("Error cargando categorías");
        }
    }

    function handleVolver() {
        const confirmar = window.confirm(
            "¿Estás seguro de que quieres salir? Los datos ingresados se perderán."
        );
        if (confirmar) router.back();
    }

    function actualizar(campo: keyof FormProducto, valor: string) {
        setForm((prev) => ({ ...prev, [campo]: valor }));
        setErrores((prev) => ({ ...prev, [campo]: "" }));
    }

    function actualizarDecimal(campo: keyof FormProducto, valor: string) {
        const limpio = valor.replace(/[^0-9.]/g, "");
        actualizar(campo, limpio);
    }

    function actualizarEntero(campo: keyof FormProducto, valor: string) {
        const limpio = valor.replace(/\D/g, "");
        actualizar(campo, limpio);
    }

    function mostrarMensaje(texto: string, tipo: "ok" | "error") {
        setMensaje(texto);
        setTipoMensaje(tipo);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setMensaje(""), 5000);
    }

    function validar(): boolean {
        const e: Partial<FormProducto> = {};
        if (!form.nombre.trim())
            e.nombre = "El nombre del producto es obligatorio";
        if (!form.categoriaId)
            e.categoriaId = "Selecciona una categoría";
        if (!form.precioCompra || parseFloat(form.precioCompra) <= 0)
            e.precioCompra = "Ingresa el precio de compra";
        if (!form.precioVenta || parseFloat(form.precioVenta) <= 0)
            e.precioVenta = "Ingresa el precio de venta";
        if (form.precioCompra && form.precioVenta &&
            parseFloat(form.precioVenta) <= parseFloat(form.precioCompra))
            e.precioVenta = "El precio de venta debe ser mayor al precio de compra";
        if (!form.stockMinimo || parseInt(form.stockMinimo) < 0)
            e.stockMinimo = "Ingresa el stock mínimo";
        setErrores(e);
        return Object.keys(e).length === 0;
    }

    async function guardar() {
        if (!validar()) return;
        setGuardando(true);
        try {
            const { data } = await api.post("/Productos/CrearProducto", {
                nombre: form.nombre.trim(),
                categoriaId: parseInt(form.categoriaId),
                unidadMedida: form.unidadMedida,
                precioCompra: parseFloat(form.precioCompra),
                precioVenta: parseFloat(form.precioVenta),
                stockInicial: form.stockInicial ? parseInt(form.stockInicial) : 0,
                stockMinimo: parseInt(form.stockMinimo),
            });
            router.push(`/productos/${data.id}`);
        } catch {
            mostrarMensaje("Hubo un error al guardar el producto. Intenta de nuevo.", "error");
            setGuardando(false);
        }
    }

    const ganancia = form.precioCompra && form.precioVenta
        ? parseFloat(form.precioVenta) - parseFloat(form.precioCompra)
        : null;

    const margen = ganancia && form.precioVenta
        ? (ganancia / parseFloat(form.precioVenta)) * 100
        : null;

    return (
        <div className="space-y-5">

            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleVolver}
                    className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-600" />
                </button>
                <div>
                    <p className="text-sm text-slate-500">Inventario</p>
                    <h1 className="text-xl font-bold text-slate-800">Nuevo producto</h1>
                </div>
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

            {/* Información básica */}
            <div>
                <p className="text-lg font-bold text-slate-700 mb-3">Información básica</p>
                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">

                    {/* Nombre */}
                    <div className="px-4 py-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <Package size={18} className="text-blue-600" />
                            </div>
                            <p className="text-base font-semibold text-slate-700">
                                Nombre del producto
                            </p>
                        </div>
                        <input
                            type="text"
                            value={form.nombre}
                            onChange={(e) => actualizar("nombre", e.target.value)}
                            placeholder="Ej: Tubería PVC 4 pulgadas"
                            className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.nombre
                                ? "border-red-300 bg-red-50"
                                : "border-slate-200 focus:border-blue-400"
                                }`}
                        />
                        {errores.nombre ? (
                            <p className="text-sm text-red-500 mt-1 font-medium">{errores.nombre}</p>
                        ) : null}
                    </div>

                    {/* Categoría */}
                    <div className="px-4 py-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                                <Tag size={18} className="text-purple-600" />
                            </div>
                            <p className="text-base font-semibold text-slate-700">Categoría</p>
                        </div>
                        <select
                            value={form.categoriaId}
                            onChange={(e) => actualizar("categoriaId", e.target.value)}
                            className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none transition-all bg-white ${errores.categoriaId
                                ? "border-red-300 bg-red-50"
                                : "border-slate-200 focus:border-blue-400"
                                }`}
                        >
                            <option value="">Selecciona una categoría</option>
                            {categorias.map((c) => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                        {errores.categoriaId ? (
                            <p className="text-sm text-red-500 mt-1 font-medium">{errores.categoriaId}</p>
                        ) : null}
                    </div>

                    {/* Unidad de medida */}
                    <div className="px-4 py-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                <Package size={18} className="text-slate-600" />
                            </div>
                            <p className="text-base font-semibold text-slate-700">
                                Unidad de medida
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {UNIDADES.map((u) => (
                                <button
                                    key={u}
                                    onClick={() => actualizar("unidadMedida", u)}
                                    className={`px-4 py-2 rounded-xl text-base font-semibold border-2 transition-all ${form.unidadMedida === u
                                        ? "bg-blue-600 border-blue-600 text-white"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-blue-300"
                                        }`}
                                >
                                    {u}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Precios */}
            <div>
                <p className="text-lg font-bold text-slate-700 mb-3">Precios</p>
                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">

                    {/* Precio de compra */}
                    <div className="px-4 py-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                <TrendingDown size={18} className="text-orange-600" />
                            </div>
                            <p className="text-base font-semibold text-slate-700">
                                Precio de compra (lo que pagas al proveedor)
                            </p>
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-500">
                                S/
                            </span>
                            <input
                                type="number"
                                value={form.precioCompra}
                                onChange={(e) => actualizarDecimal("precioCompra", e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className={`w-full border-2 rounded-xl pl-10 pr-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.precioCompra
                                    ? "border-red-300 bg-red-50"
                                    : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                        </div>
                        {errores.precioCompra ? (
                            <p className="text-sm text-red-500 mt-1 font-medium">{errores.precioCompra}</p>
                        ) : null}
                    </div>

                    {/* Precio de venta */}
                    <div className="px-4 py-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                                <TrendingUp size={18} className="text-green-600" />
                            </div>
                            <p className="text-base font-semibold text-slate-700">
                                Precio de venta (lo que cobras al cliente)
                            </p>
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-500">
                                S/
                            </span>
                            <input
                                type="number"
                                value={form.precioVenta}
                                onChange={(e) => actualizarDecimal("precioVenta", e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className={`w-full border-2 rounded-xl pl-10 pr-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.precioVenta
                                    ? "border-red-300 bg-red-50"
                                    : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                        </div>
                        {errores.precioVenta ? (
                            <p className="text-sm text-red-500 mt-1 font-medium">{errores.precioVenta}</p>
                        ) : null}
                    </div>

                    {/* Ganancia calculada */}
                    {ganancia !== null && margen !== null && ganancia > 0 ? (
                        <div className="px-4 py-4 bg-green-50">
                            <p className="text-sm text-green-600 font-semibold">Ganancia por unidad</p>
                            <p className="text-2xl font-bold text-green-700">
                                S/ {ganancia.toFixed(2)}
                                <span className="text-base font-semibold ml-2 text-green-600">
                                    ({margen.toFixed(1)}% de margen)
                                </span>
                            </p>
                        </div>
                    ) : null}

                    {ganancia !== null && ganancia <= 0 ? (
                        <div className="px-4 py-4 bg-red-50">
                            <p className="text-sm text-red-600 font-semibold">
                                El precio de venta debe ser mayor al precio de compra
                            </p>
                        </div>
                    ) : null}

                </div>
            </div>

            {/* Stock */}
            <div>
                <p className="text-lg font-bold text-slate-700 mb-3">Stock</p>
                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">

                    {/* Stock inicial */}
                    <div className="px-4 py-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <Package size={18} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-slate-700">
                                    Cantidad inicial en almacén
                                </p>
                                <p className="text-sm text-slate-400">
                                    ¿Cuántas unidades tienes ahora mismo?
                                </p>
                            </div>
                        </div>
                        <input
                            type="number"
                            value={form.stockInicial}
                            onChange={(e) => actualizarEntero("stockInicial", e.target.value)}
                            placeholder="0"
                            min="0"
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-2xl text-center font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:border-blue-400 transition-all"
                        />
                    </div>

                    {/* Stock mínimo */}
                    <div className="px-4 py-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                                <AlertTriangle size={18} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-slate-700">
                                    Stock mínimo de alerta
                                </p>
                                <p className="text-sm text-slate-400">
                                    El sistema te avisará cuando baje de esta cantidad
                                </p>
                            </div>
                        </div>
                        <input
                            type="number"
                            value={form.stockMinimo}
                            onChange={(e) => actualizarEntero("stockMinimo", e.target.value)}
                            placeholder="0"
                            min="0"
                            className={`w-full border-2 rounded-xl px-4 py-3 text-2xl text-center font-bold text-slate-800 placeholder-slate-300 focus:outline-none transition-all ${errores.stockMinimo
                                ? "border-red-300 bg-red-50"
                                : "border-slate-200 focus:border-blue-400"
                                }`}
                        />
                        {errores.stockMinimo ? (
                            <p className="text-sm text-red-500 mt-1 font-medium">{errores.stockMinimo}</p>
                        ) : null}
                    </div>

                </div>
            </div>

            {/* Botón guardar */}
            <button
                onClick={guardar}
                disabled={guardando}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl py-5 text-lg shadow-sm transition-colors"
            >
                {guardando ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                    <CheckCircle size={24} />
                )}
                {guardando ? "Guardando..." : "Guardar producto"}
            </button>

        </div>
    );
}