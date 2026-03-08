"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Package, Tag, TrendingUp, TrendingDown,
    CheckCircle, ChevronDown,
} from "lucide-react";
import api from "@/lib/api";
import { Categoria } from "@/types";
import { Alerta } from "@/components/ui/Alerta";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { useAlerta } from "@/hooks/useAlerta";

interface FormProducto {
    nombre: string;
    categoriaId: string;
    unidadMedida: string;
    precioCompra: string;
    precioVenta: string;
    stockInicial: string;
    stockMinimo: string;
}

export default function NuevoProductoPage() {
    const router = useRouter();
    const alerta = useAlerta();

    const [form, setForm] = useState<FormProducto>({
        nombre: "",
        categoriaId: "",
        unidadMedida: "",
        precioCompra: "",
        precioVenta: "",
        stockInicial: "",
        stockMinimo: "",
    });

    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [guardando, setGuardando] = useState(false);
    const [errores, setErrores] = useState<Partial<FormProducto>>({});
    const [confirmarSalir, setConfirmarSalir] = useState(false);

    useEffect(() => {
        api.get<Categoria[]>("/Categorias/ObtenerCategorias").then(({ data }) => {
            setCategorias(data.filter(c => c.estaActivo));
        });
        const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    function actualizar(campo: keyof FormProducto, valor: string) {
        setForm(prev => ({ ...prev, [campo]: valor }));
        setErrores(prev => ({ ...prev, [campo]: "" }));
    }

    const ganancia = () => {
        const compra = parseFloat(form.precioCompra);
        const venta = parseFloat(form.precioVenta);
        if (!isNaN(compra) && !isNaN(venta) && compra > 0) {
            const pct = ((venta - compra) / compra) * 100;
            return pct.toFixed(1);
        }
        return null;
    };

    function validar(): boolean {
        const e: Partial<FormProducto> = {};
        if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
        if (!form.categoriaId) e.categoriaId = "Selecciona una categoría";
        if (!form.unidadMedida) e.unidadMedida = "Selecciona una unidad";
        if (!form.precioCompra || parseFloat(form.precioCompra) <= 0)
            e.precioCompra = "Ingresa un precio de compra válido";
        if (!form.precioVenta || parseFloat(form.precioVenta) <= 0)
            e.precioVenta = "Ingresa un precio de venta válido";
        if (form.stockInicial && parseFloat(form.stockInicial) < 0)
            e.stockInicial = "El stock no puede ser negativo";
        if (!form.stockMinimo || parseFloat(form.stockMinimo) < 0)
            e.stockMinimo = "Ingresa un stock mínimo válido";
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
                stockInicial: parseFloat(form.stockInicial || "0"),
                stockMinimo: parseFloat(form.stockMinimo),
            });
            router.push(`/productos/${data.id}`);
        } catch {
            alerta.mostrar("Hubo un error al guardar el producto. Intenta de nuevo.", "error");
            setGuardando(false);
        }
    }

    const pct = ganancia();

    return (
        <>
            <div className="space-y-5">

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setConfirmarSalir(true)}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                        <p className="text-sm text-slate-500">Inventario</p>
                        <h1 className="text-xl font-bold text-slate-800">Nuevo producto</h1>
                    </div>
                </div>

                <Alerta mensaje={alerta.mensaje} tipo={alerta.tipo} visible={alerta.visible} />

                {/* Información básica */}
                <div>
                    <p className="text-lg font-bold text-slate-700 mb-3">Información básica</p>
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">

                        <div className="px-4 py-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Package size={18} className="text-blue-600" />
                                </div>
                                <p className="text-base font-semibold text-slate-700">Nombre del producto</p>
                            </div>
                            <input
                                type="text"
                                value={form.nombre}
                                onChange={e => actualizar("nombre", e.target.value)}
                                placeholder="Ej: Cemento Portland bolsa 42kg"
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.nombre ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.nombre && <p className="text-sm text-red-500 mt-1 font-medium">{errores.nombre}</p>}
                        </div>

                        <div className="px-4 py-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Tag size={18} className="text-purple-600" />
                                </div>
                                <p className="text-base font-semibold text-slate-700">Categoría</p>
                            </div>
                            <div className="relative">
                                <select
                                    value={form.categoriaId}
                                    onChange={e => actualizar("categoriaId", e.target.value)}
                                    className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none transition-all appearance-none bg-white ${errores.categoriaId ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                        }`}
                                >
                                    <option value="">Seleccionar categoría</option>
                                    {categorias.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                            {errores.categoriaId && <p className="text-sm text-red-500 mt-1 font-medium">{errores.categoriaId}</p>}
                        </div>

                        <div className="px-4 py-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Package size={18} className="text-orange-600" />
                                </div>
                                <p className="text-base font-semibold text-slate-700">Unidad de medida</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {["unidad", "docena", "kilogramo"].map(u => (
                                    <button
                                        key={u}
                                        onClick={() => actualizar("unidadMedida", u)}
                                        className={`py-3 rounded-xl text-base font-semibold border-2 transition-all capitalize ${form.unidadMedida === u
                                                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                                : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300"
                                            }`}
                                    >
                                        {u}
                                    </button>
                                ))}
                            </div>
                            {errores.unidadMedida && <p className="text-sm text-red-500 mt-2 font-medium">{errores.unidadMedida}</p>}
                        </div>

                    </div>
                </div>

                {/* Precios */}
                <div>
                    <p className="text-lg font-bold text-slate-700 mb-3">Precios</p>
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">

                        <div className="px-4 py-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                    <TrendingDown size={18} className="text-orange-600" />
                                </div>
                                <p className="text-base font-semibold text-slate-700">Precio de compra (S/)</p>
                            </div>
                            <input
                                type="number"
                                value={form.precioCompra}
                                onChange={e => actualizar("precioCompra", e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.precioCompra ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.precioCompra && <p className="text-sm text-red-500 mt-1 font-medium">{errores.precioCompra}</p>}
                        </div>

                        <div className="px-4 py-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                                    <TrendingUp size={18} className="text-green-600" />
                                </div>
                                <p className="text-base font-semibold text-slate-700">Precio de venta (S/)</p>
                            </div>
                            <input
                                type="number"
                                value={form.precioVenta}
                                onChange={e => actualizar("precioVenta", e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.precioVenta ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.precioVenta && <p className="text-sm text-red-500 mt-1 font-medium">{errores.precioVenta}</p>}
                        </div>

                        {pct !== null && (
                            <div className={`px-4 py-4 ${parseFloat(pct) >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                                <p className={`text-base font-bold ${parseFloat(pct) >= 0 ? "text-green-700" : "text-red-700"}`}>
                                    {parseFloat(pct) >= 0 ? "Ganancia" : "Pérdida"}: {pct}%
                                </p>
                                <p className={`text-sm ${parseFloat(pct) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    S/ {(parseFloat(form.precioVenta) - parseFloat(form.precioCompra)).toFixed(2)} por {form.unidadMedida || "unidad"}
                                </p>
                            </div>
                        )}

                    </div>
                </div>

                {/* Stock */}
                <div>
                    <p className="text-lg font-bold text-slate-700 mb-3">Stock</p>
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">

                        <div className="px-4 py-4">
                            <p className="text-base font-semibold text-slate-700 mb-2">Stock inicial</p>
                            <input
                                type="number"
                                value={form.stockInicial}
                                onChange={e => actualizar("stockInicial", e.target.value)}
                                placeholder="0"
                                min="0"
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.stockInicial ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.stockInicial && <p className="text-sm text-red-500 mt-1 font-medium">{errores.stockInicial}</p>}
                        </div>

                        <div className="px-4 py-4">
                            <p className="text-base font-semibold text-slate-700 mb-1">Stock mínimo</p>
                            <p className="text-sm text-slate-400 mb-2">Se alertará cuando baje de este número</p>
                            <input
                                type="number"
                                value={form.stockMinimo}
                                onChange={e => actualizar("stockMinimo", e.target.value)}
                                placeholder="5"
                                min="0"
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.stockMinimo ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.stockMinimo && <p className="text-sm text-red-500 mt-1 font-medium">{errores.stockMinimo}</p>}
                        </div>

                    </div>
                </div>

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

            <ModalConfirmacion
                visible={confirmarSalir}
                titulo="¿Salir sin guardar?"
                descripcion="Los datos ingresados se perderán si sales ahora."
                textoCancelar="Quedarme"
                textoConfirmar="Sí, salir"
                colorConfirmar="rojo"
                cargando={false}
                onCancelar={() => setConfirmarSalir(false)}
                onConfirmar={() => { setConfirmarSalir(false); router.back(); }}
            />
        </>
    );
}