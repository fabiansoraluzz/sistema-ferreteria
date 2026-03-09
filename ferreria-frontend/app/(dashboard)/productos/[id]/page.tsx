"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Package, Tag, TrendingUp, TrendingDown,
    AlertTriangle, CheckCircle, XCircle, Trash2, Pencil, X,
    ChevronDown,
} from "lucide-react";
import api from "@/lib/api";
import { Producto, Categoria } from "@/types";
import { Alerta } from "@/components/ui/Alerta";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { useAlerta } from "@/hooks/useAlerta";

const UNIDADES = ["unidad", "docena", "kilogramo", "millar", "juego"];

interface FormEditar {
    nombre: string;
    categoriaId: string;
    unidadMedida: string;
    precioCompra: string;
    precioVenta: string;
    stockMinimo: string;
}

export default function DetalleProductoPage() {
    const params = useParams();
    const router = useRouter();
    const alerta = useAlerta();

    const [producto, setProducto] = useState<Producto | null>(null);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [cargando, setCargando] = useState(true);
    const [cantidad, setCantidad] = useState("");
    const [motivo, setMotivo] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(false);
    const [confirmarEntrada, setConfirmarEntrada] = useState(false);
    const [confirmarEliminar, setConfirmarEliminar] = useState(false);
    const [errores, setErrores] = useState<Partial<FormEditar>>({});
    const [form, setForm] = useState<FormEditar>({
        nombre: "", categoriaId: "", unidadMedida: "",
        precioCompra: "", precioVenta: "", stockMinimo: "",
    });

    useEffect(() => { cargarProducto(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    async function cargarProducto() {
        if (!params.id) return;
        try {
            const [{ data: prod }, { data: cats }] = await Promise.all([
                api.get<Producto>(`/Productos/ObtenerDetalleProducto/${params.id}`),
                api.get<Categoria[]>("/Categorias/ObtenerCategorias"),
            ]);
            setProducto(prod);
            setCategorias(cats.filter(c => c.estaActivo));
        } catch {
            router.push("/productos");
        } finally {
            setCargando(false);
        }
    }

    function abrirEditar() {
        if (!producto) return;
        setForm({
            nombre: producto.nombre,
            categoriaId: String(producto.categoriaId),
            unidadMedida: producto.unidadMedida,
            precioCompra: String(producto.precioCompra),
            precioVenta: String(producto.precioVenta),
            stockMinimo: String(producto.stockMinimo),
        });
        setErrores({});
        setEditando(true);
        setMostrarForm(false);
    }

    function actualizar(campo: keyof FormEditar, valor: string) {
        const camposNumericos = ["precioCompra", "precioVenta", "stockMinimo"];
        if (camposNumericos.includes(campo))
            valor = valor.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
        setForm(prev => ({ ...prev, [campo]: valor }));
        setErrores(prev => ({ ...prev, [campo]: "" }));
    }

    function validarEditar(): boolean {
        const e: Partial<FormEditar> = {};
        if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio";
        if (!form.categoriaId) e.categoriaId = "Selecciona una categoría";
        if (!form.unidadMedida) e.unidadMedida = "Selecciona una unidad";
        if (!form.precioCompra || parseFloat(form.precioCompra) <= 0)
            e.precioCompra = "Ingresa un precio de compra válido";
        if (!form.precioVenta || parseFloat(form.precioVenta) <= 0)
            e.precioVenta = "Ingresa un precio de venta válido";
        if (!form.stockMinimo || parseFloat(form.stockMinimo) < 0)
            e.stockMinimo = "Ingresa un stock mínimo válido";
        setErrores(e);
        return Object.keys(e).length === 0;
    }

    async function guardarEdicion() {
        if (!validarEditar()) return;
        setGuardando(true);
        try {
            await api.put(`/Productos/ActualizarProducto/${params.id}`, {
                nombre: form.nombre.trim(),
                categoriaId: parseInt(form.categoriaId),
                unidadMedida: form.unidadMedida,
                precioCompra: parseFloat(form.precioCompra),
                precioVenta: parseFloat(form.precioVenta),
                stockMinimo: parseFloat(form.stockMinimo),
            });
            alerta.mostrar("Producto actualizado correctamente", "ok");
            setEditando(false);
            cargarProducto();
        } catch {
            alerta.mostrar("Error al actualizar el producto", "error");
        } finally {
            setGuardando(false);
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

    async function eliminarProducto() {
        setGuardando(true);
        try {
            await api.delete(`/Productos/EliminarProducto/${params.id}`);
            router.push("/productos");
        } catch {
            alerta.mostrar("Hubo un error al eliminar el producto", "error");
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

    // Cálculo ganancia para el formulario de edición
    const calcEdit = (() => {
        const compra = parseFloat(form.precioCompra);
        const venta = parseFloat(form.precioVenta);
        if (!isNaN(compra) && !isNaN(venta) && compra > 0) {
            const diff = venta - compra;
            const pct = (diff / compra) * 100;
            return { pct: pct.toFixed(1), diff: diff.toFixed(2) };
        }
        return null;
    })();

    return (
        <>
            <div className="space-y-5">

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/productos")}
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

                {/* Card stock */}
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

                {/* Botón entrada mercadería */}
                {!mostrarForm && !editando && (
                    <button
                        onClick={() => setMostrarForm(true)}
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl py-5 text-lg shadow-sm transition-colors"
                    >
                        <Package size={24} className="shrink-0" />
                        <span className="sm:hidden">Registrar cantidad</span>
                        <span className="hidden sm:inline">Entró mercadería — registrar cantidad</span>
                    </button>
                )}

                {/* Formulario entrada */}
                {mostrarForm && (
                    <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 space-y-4 shadow-sm">
                        <p className="text-lg font-bold text-slate-800">¿Cuántas unidades entraron?</p>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={cantidad}
                            onChange={e => setCantidad(e.target.value.replace(/[^0-9.]/g, ""))}
                            placeholder="0"
                            autoFocus
                            className="w-full border-2 border-slate-200 rounded-2xl px-4 py-4 text-5xl text-center font-bold text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                        />
                        <input
                            type="text"
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
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

                {/* Información del producto */}
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
                            <div className="flex-1">
                                <p className="text-sm text-slate-400">Precio de venta</p>
                                <p className="text-xl font-bold text-green-600">S/ {producto.precioVenta.toFixed(2)}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xs text-slate-400">Con IGV (18%)</p>
                                <p className="text-base font-semibold text-slate-600">
                                    S/ {(producto.precioVenta * 1.18).toFixed(7)}
                                </p>
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

                {/* Botones editar / eliminar */}
                <div className="flex gap-3">
                    <button
                        onClick={() => editando ? setEditando(false) : abrirEditar()}
                        className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-blue-600 font-bold rounded-2xl py-4 text-base border-2 border-blue-200 transition-colors"
                    >
                        {editando ? <X size={20} /> : <Pencil size={20} />}
                        {editando ? "Cancelar" : "Editar producto"}
                    </button>
                    <button
                        onClick={() => setConfirmarEliminar(true)}
                        disabled={guardando}
                        className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 font-bold rounded-2xl py-4 text-base border-2 border-red-200 transition-colors disabled:opacity-50"
                    >
                        <Trash2 size={20} />
                        Eliminar
                    </button>
                </div>

                {/* Formulario edición inline */}
                {editando && (
                    <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 space-y-4 shadow-sm">
                        <p className="text-lg font-bold text-slate-800">Editar producto</p>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Package size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-600">Nombre del producto</p>
                            </div>
                            <input
                                type="text"
                                value={form.nombre}
                                onChange={e => actualizar("nombre", e.target.value)}
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none transition-all ${errores.nombre ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.nombre && <p className="text-sm text-red-500 mt-1">{errores.nombre}</p>}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Tag size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-600">Categoría</p>
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
                            {errores.categoriaId && <p className="text-sm text-red-500 mt-1">{errores.categoriaId}</p>}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Package size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-600">Unidad de medida</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {UNIDADES.map(u => (
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
                            {errores.unidadMedida && <p className="text-sm text-red-500 mt-2">{errores.unidadMedida}</p>}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingDown size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-600">Precio de compra (S/)</p>
                            </div>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={form.precioCompra}
                                onChange={e => actualizar("precioCompra", e.target.value)}
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none transition-all ${errores.precioCompra ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.precioCompra && <p className="text-sm text-red-500 mt-1">{errores.precioCompra}</p>}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-600">Precio de venta (S/)</p>
                            </div>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={form.precioVenta}
                                onChange={e => actualizar("precioVenta", e.target.value)}
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none transition-all ${errores.precioVenta ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.precioVenta && <p className="text-sm text-red-500 mt-1">{errores.precioVenta}</p>}
                        </div>

                        {/* Ganancia en tiempo real */}
                        {calcEdit !== null && (
                            <div className={`px-4 py-3 rounded-xl ${parseFloat(calcEdit.pct) >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                                <p className={`text-base font-bold ${parseFloat(calcEdit.pct) >= 0 ? "text-green-700" : "text-red-700"}`}>
                                    {parseFloat(calcEdit.pct) >= 0 ? "Ganancia" : "Pérdida"}: {calcEdit.pct}%
                                </p>
                                <p className={`text-sm ${parseFloat(calcEdit.pct) >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    S/ {calcEdit.diff} por {form.unidadMedida || producto.unidadMedida}
                                </p>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Package size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-600">Stock mínimo</p>
                            </div>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={form.stockMinimo}
                                onChange={e => actualizar("stockMinimo", e.target.value)}
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none transition-all ${errores.stockMinimo ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.stockMinimo && <p className="text-sm text-red-500 mt-1">{errores.stockMinimo}</p>}
                        </div>

                        <button
                            onClick={guardarEdicion}
                            disabled={guardando}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl py-4 text-base transition-colors"
                        >
                            {guardando ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                )}

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

            <ModalConfirmacion
                visible={confirmarEliminar}
                titulo="¿Eliminar este producto?"
                descripcion={`Se eliminará "${producto.nombre}".`}
                textoConfirmar="Sí, eliminar"
                colorConfirmar="rojo"
                cargando={guardando}
                onCancelar={() => setConfirmarEliminar(false)}
                onConfirmar={() => { setConfirmarEliminar(false); eliminarProducto(); }}
            />
        </>
    );
}