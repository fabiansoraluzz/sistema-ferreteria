"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Truck, Phone, MapPin,
    Hash, ShoppingCart, ChevronRight, Pencil, X,
} from "lucide-react";
import api from "@/lib/api";
import { Proveedor, CompraResumen } from "@/types";
import { Alerta } from "@/components/ui/Alerta";
import { useAlerta } from "@/hooks/useAlerta";
import Link from "next/link";

export default function DetalleProveedorPage() {
    const params = useParams();
    const router = useRouter();
    const alerta = useAlerta();

    const [proveedor, setProveedor] = useState<Proveedor | null>(null);
    const [compras, setCompras] = useState<CompraResumen[]>([]);
    const [cargando, setCargando] = useState(true);
    const [editando, setEditando] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [usuario, setUsuario] = useState<{ rol: string } | null>(null);

    const [nombre, setNombre] = useState("");
    const [ruc, setRuc] = useState("");
    const [telefono, setTelefono] = useState("");
    const [direccion, setDireccion] = useState("");

    useEffect(() => {
        const u = localStorage.getItem("usuario");
        if (u) setUsuario(JSON.parse(u));
        cargar();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    async function cargar() {
        try {
            const [resProv, resCompras] = await Promise.all([
                api.get<Proveedor>(`/Proveedores/ObtenerDetalleProveedor/${params.id}`),
                api.get<CompraResumen[]>(`/Compras/ObtenerCompras?proveedorId=${params.id}`),
            ]);
            setProveedor(resProv.data);
            setCompras(resCompras.data);
            setNombre(resProv.data.nombre);
            setRuc(resProv.data.ruc ?? "");
            setTelefono(resProv.data.telefono ?? "");
            setDireccion(resProv.data.direccion ?? "");
        } catch {
            router.push("/compras");
        } finally {
            setCargando(false);
        }
    }

    async function guardarEdicion() {
        if (!nombre.trim()) { alerta.mostrar("El nombre es obligatorio", "error"); return; }
        setGuardando(true);
        try {
            await api.put(`/Proveedores/ActualizarProveedor/${params.id}`, {
                nombre: nombre.trim(),
                ruc: ruc.trim() || null,
                telefono: telefono.trim() || null,
                direccion: direccion.trim() || null,
            });
            alerta.mostrar("Proveedor actualizado", "ok");
            setEditando(false);
            cargar();
        } catch {
            alerta.mostrar("Error al actualizar el proveedor", "error");
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-base">Cargando proveedor...</p>
            </div>
        );
    }

    if (!proveedor) return null;

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
                <div className="flex-1">
                    <p className="text-sm text-slate-500">Compras · Proveedores</p>
                    <h1 className="text-xl font-bold text-slate-800">{proveedor.nombre}</h1>
                </div>
                {!editando && (
                    <button
                        onClick={() => setEditando(true)}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        <Pencil size={18} className="text-slate-600" />
                    </button>
                )}
                {editando && (
                    <button
                        onClick={() => setEditando(false)}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        <X size={18} className="text-slate-600" />
                    </button>
                )}
            </div>

            <Alerta mensaje={alerta.mensaje} tipo={alerta.tipo} visible={alerta.visible} />

            {/* Datos / Edición */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                        Datos del proveedor
                    </p>
                </div>

                {editando ? (
                    <div className="px-4 py-4 space-y-4">
                        <div>
                            <label className="text-sm font-semibold text-slate-600 mb-2 block">
                                Nombre <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-600 mb-2 block">
                                RUC <span className="text-slate-400 font-normal">(opcional)</span>
                            </label>
                            <input
                                type="text"
                                value={ruc}
                                onChange={e => setRuc(e.target.value)}
                                maxLength={11}
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-600 mb-2 block">
                                Teléfono <span className="text-slate-400 font-normal">(opcional)</span>
                            </label>
                            <input
                                type="tel"
                                value={telefono}
                                onChange={e => setTelefono(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-semibold text-slate-600 mb-2 block">
                                Dirección <span className="text-slate-400 font-normal">(opcional)</span>
                            </label>
                            <input
                                type="text"
                                value={direccion}
                                onChange={e => setDireccion(e.target.value)}
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none focus:border-blue-400 transition-all"
                            />
                        </div>
                        <button
                            onClick={guardarEdicion}
                            disabled={guardando}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-4 text-base transition-colors disabled:opacity-50"
                        >
                            {guardando ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        <div className="flex items-center gap-3 px-4 py-4">
                            <Truck size={18} className="text-slate-400 shrink-0" />
                            <span className="text-base text-slate-800 font-semibold">{proveedor.nombre}</span>
                        </div>
                        {proveedor.ruc && (
                            <div className="flex items-center gap-3 px-4 py-4">
                                <Hash size={18} className="text-slate-400 shrink-0" />
                                <span className="text-base text-slate-700">RUC {proveedor.ruc}</span>
                            </div>
                        )}
                        {proveedor.telefono && (
                            <div className="flex items-center gap-3 px-4 py-4">
                                <Phone size={18} className="text-slate-400 shrink-0" />
                                <a href={`tel:${proveedor.telefono}`} className="text-base text-blue-600 font-semibold">
                                    {proveedor.telefono}
                                </a>
                            </div>
                        )}
                        {proveedor.direccion && (
                            <div className="flex items-center gap-3 px-4 py-4">
                                <MapPin size={18} className="text-slate-400 shrink-0" />
                                <span className="text-base text-slate-700">{proveedor.direccion}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Compras del proveedor */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                        Compras registradas ({compras.length})
                    </p>
                </div>
                {compras.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <ShoppingCart size={36} className="text-slate-300" />
                        <p className="text-sm text-slate-400">Sin compras aún</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {compras.map(c => (
                            <Link
                                key={c.id}
                                href={`/compras/${c.id}`}
                                className="flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-semibold text-slate-800">
                                        Factura {c.numeroFactura}
                                    </p>
                                    <p className="text-sm text-slate-400">
                                        {new Date(c.fechaCompra).toLocaleDateString("es-PE", {
                                            day: "numeric", month: "short", year: "numeric",
                                        })} · {c.cantidadProductos} {c.cantidadProductos === 1 ? "producto" : "productos"}
                                    </p>
                                </div>
                                <ChevronRight size={18} className="text-slate-300 shrink-0" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}