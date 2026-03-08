"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tag, Plus, Trash2, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { Categoria } from "@/types";
import { Alerta } from "@/components/ui/Alerta";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { useAlerta } from "@/hooks/useAlerta";

export default function CategoriasPage() {
    const alerta = useAlerta();
    const router = useRouter();
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [nombre, setNombre] = useState("");
    const [errorNombre, setErrorNombre] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [categoriaAEliminar, setCategoriaAEliminar] = useState<Categoria | null>(null);

    useEffect(() => { cargarCategorias(); }, []);

    async function cargarCategorias() {
        try {
            const { data } = await api.get<Categoria[]>("/Categorias/ObtenerCategorias");
            setCategorias(data);
        } catch {
            alerta.mostrar("Error al cargar las categorías", "error");
        } finally {
            setCargando(false);
        }
    }

    async function crearCategoria() {
        if (!nombre.trim()) { setErrorNombre("El nombre es obligatorio"); return; }
        setGuardando(true);
        try {
            await api.post("/Categorias/CrearCategoria", {
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || null,
            });
            alerta.mostrar("Categoría creada correctamente", "ok");
            setNombre("");
            setDescripcion("");
            setMostrarForm(false);
            cargarCategorias();
        } catch {
            alerta.mostrar("Hubo un error al crear la categoría", "error");
        } finally {
            setGuardando(false);
        }
    }

    async function eliminarCategoria() {
        if (!categoriaAEliminar) return;
        setGuardando(true);
        try {
            await api.delete(`/Categorias/EliminarCategoria/${categoriaAEliminar.id}`);
            alerta.mostrar("Categoría eliminada correctamente", "ok");
            setCategoriaAEliminar(null);
            cargarCategorias();
        } catch {
            alerta.mostrar("Hubo un error al eliminar la categoría", "error");
            setCategoriaAEliminar(null);
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-base">Cargando categorías...</p>
            </div>
        );
    }

    const activas = categorias.filter(c => c.estaActivo);
    const inactivas = categorias.filter(c => !c.estaActivo);

    return (
        <>
            <div className="space-y-5">

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-800">Categorías</h1>
                        <p className="text-base text-slate-500">{activas.length} categorías activas</p>
                    </div>
                    <button
                        onClick={() => { setMostrarForm(!mostrarForm); setNombre(""); setDescripcion(""); setErrorNombre(""); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-xl shadow-sm transition-colors"
                    >
                        <Plus size={20} />
                        <span className="text-base">Nueva</span>
                    </button>
                </div>

                <Alerta mensaje={alerta.mensaje} tipo={alerta.tipo} visible={alerta.visible} />

                {mostrarForm && (
                    <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 space-y-3 shadow-sm">
                        <p className="text-lg font-bold text-slate-800">Nueva categoría</p>
                        <input
                            type="text"
                            value={nombre}
                            onChange={e => { setNombre(e.target.value); setErrorNombre(""); }}
                            placeholder="Nombre — ej: Tornillos"
                            autoFocus
                            className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errorNombre ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                }`}
                        />
                        {errorNombre && <p className="text-sm text-red-500 font-medium">{errorNombre}</p>}
                        <input
                            type="text"
                            value={descripcion}
                            onChange={e => setDescripcion(e.target.value)}
                            placeholder="Descripción (opcional)"
                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setMostrarForm(false); setNombre(""); setDescripcion(""); setErrorNombre(""); }}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl py-3 text-base transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={crearCategoria}
                                disabled={guardando}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl py-3 text-base transition-colors"
                            >
                                {guardando ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                    {activas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Tag size={48} className="text-slate-300" />
                            <p className="text-base text-slate-500">No hay categorías aún</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {activas.map((c) => (
                                <div key={c.id} className="flex items-center justify-between px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                                            <Tag size={18} className="text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-base font-semibold text-slate-800">{c.nombre}</p>
                                            {c.descripcion && (
                                                <p className="text-sm text-slate-400">{c.descripcion}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setCategoriaAEliminar(c)}
                                        className="w-10 h-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {inactivas.length > 0 && (
                    <div>
                        <p className="text-base font-semibold text-slate-400 mb-3">Inactivas ({inactivas.length})</p>
                        <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 overflow-hidden">
                            <div className="divide-y divide-slate-100">
                                {inactivas.map((c) => (
                                    <div key={c.id} className="flex items-center gap-3 px-4 py-4 opacity-50">
                                        <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center shrink-0">
                                            <Tag size={18} className="text-slate-500" />
                                        </div>
                                        <p className="text-base font-semibold text-slate-500 line-through">{c.nombre}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            <ModalConfirmacion
                visible={categoriaAEliminar !== null}
                titulo="¿Eliminar esta categoría?"
                descripcion={`Se eliminará "${categoriaAEliminar?.nombre}". Los productos en esta categoría quedarán sin categoría.`}
                textoConfirmar="Sí, eliminar"
                colorConfirmar="rojo"
                cargando={guardando}
                onCancelar={() => setCategoriaAEliminar(null)}
                onConfirmar={() => eliminarCategoria()}
            />
        </>
    );
}