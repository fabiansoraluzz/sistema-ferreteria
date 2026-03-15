"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Users, Plus, Trash2,
    ShieldCheck, User, Mail, Lock, Pencil, X,
} from "lucide-react";
import api from "@/lib/api";
import { UsuarioSistema } from "@/types";
import { Alerta } from "@/components/ui/Alerta";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { useAlerta } from "@/hooks/useAlerta";
import { Paginacion } from "@/components/ui/Paginacion";
import { usePorPagina } from "@/hooks/usePorPagina";

interface FormUsuario {
    nombreCompleto: string;
    correoElectronico: string;
    contrasena: string;
    rol: string;
}

interface FormEditar {
    nombreCompleto: string;
    correoElectronico: string;
    nuevaContrasena: string;
    rol: string;
}

export default function UsuariosPage() {
    const router = useRouter();
    const alerta = useAlerta();

    const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [usuarioAEliminar, setUsuarioAEliminar] = useState<UsuarioSistema | null>(null);
    const [usuarioEditando, setUsuarioEditando] = useState<number | null>(null);
    const [errores, setErrores] = useState<Partial<FormUsuario>>({});
    const [erroresEditar, setErroresEditar] = useState<Partial<FormEditar>>({});
    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = usePorPagina();

    const [form, setForm] = useState<FormUsuario>({
        nombreCompleto: "", correoElectronico: "", contrasena: "", rol: "Vendedor",
    });

    const [formEditar, setFormEditar] = useState<FormEditar>({
        nombreCompleto: "", correoElectronico: "", nuevaContrasena: "", rol: "Vendedor",
    });

    useEffect(() => { cargarUsuarios(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => { setPagina(1); }, [porPagina]);

    async function cargarUsuarios() {
        try {
            const { data } = await api.get<UsuarioSistema[]>("/Usuarios/ObtenerUsuarios");
            setUsuarios(data);
        } catch {
            alerta.mostrar("Error al cargar los usuarios", "error");
        } finally {
            setCargando(false);
        }
    }

    function actualizar(campo: keyof FormUsuario, valor: string) {
        setForm(prev => ({ ...prev, [campo]: valor }));
        setErrores(prev => ({ ...prev, [campo]: "" }));
    }

    function actualizarEditar(campo: keyof FormEditar, valor: string) {
        setFormEditar(prev => ({ ...prev, [campo]: valor }));
        setErroresEditar(prev => ({ ...prev, [campo]: "" }));
    }

    function abrirEditar(u: UsuarioSistema) {
        setUsuarioEditando(u.id);
        setFormEditar({ nombreCompleto: u.nombreCompleto, correoElectronico: u.correoElectronico, nuevaContrasena: "", rol: u.rol });
        setErroresEditar({});
        setMostrarForm(false);
    }

    function cerrarEditar() {
        setUsuarioEditando(null);
        setErroresEditar({});
    }

    function validarNuevo(): boolean {
        const e: Partial<FormUsuario> = {};
        if (!form.nombreCompleto.trim()) e.nombreCompleto = "El nombre es obligatorio";
        if (!form.correoElectronico.trim()) e.correoElectronico = "El correo es obligatorio";
        else if (!/\S+@\S+\.\S+/.test(form.correoElectronico)) e.correoElectronico = "El correo no es válido";
        if (!form.contrasena.trim()) e.contrasena = "La contraseña es obligatoria";
        else if (form.contrasena.length < 6) e.contrasena = "Mínimo 6 caracteres";
        setErrores(e);
        return Object.keys(e).length === 0;
    }

    function validarEditar(): boolean {
        const e: Partial<FormEditar> = {};
        if (!formEditar.nombreCompleto.trim()) e.nombreCompleto = "El nombre es obligatorio";
        if (!formEditar.correoElectronico.trim()) e.correoElectronico = "El correo es obligatorio";
        else if (!/\S+@\S+\.\S+/.test(formEditar.correoElectronico)) e.correoElectronico = "El correo no es válido";
        if (formEditar.nuevaContrasena && formEditar.nuevaContrasena.length < 6) e.nuevaContrasena = "Mínimo 6 caracteres";
        setErroresEditar(e);
        return Object.keys(e).length === 0;
    }

    async function crearUsuario() {
        if (!validarNuevo()) return;
        setGuardando(true);
        try {
            await api.post("/Usuarios/CrearUsuario", {
                nombreCompleto: form.nombreCompleto.trim(),
                correoElectronico: form.correoElectronico.trim(),
                contrasena: form.contrasena,
                rol: form.rol,
            });
            alerta.mostrar("Usuario creado correctamente", "ok");
            setForm({ nombreCompleto: "", correoElectronico: "", contrasena: "", rol: "Vendedor" });
            setMostrarForm(false);
            cargarUsuarios();
        } catch {
            alerta.mostrar("Error al crear el usuario. El correo puede estar en uso.", "error");
        } finally {
            setGuardando(false);
        }
    }

    async function actualizarUsuario() {
        if (!validarEditar() || !usuarioEditando) return;
        setGuardando(true);
        try {
            await api.put(`/Usuarios/ActualizarUsuario/${usuarioEditando}`, {
                nombreCompleto: formEditar.nombreCompleto.trim(),
                correoElectronico: formEditar.correoElectronico.trim(),
                rol: formEditar.rol,
                nuevaContrasena: formEditar.nuevaContrasena.trim() || null,
            });
            alerta.mostrar("Usuario actualizado correctamente", "ok");
            cerrarEditar();
            cargarUsuarios();
        } catch {
            alerta.mostrar("Error al actualizar el usuario. El correo puede estar en uso.", "error");
        } finally {
            setGuardando(false);
        }
    }

    async function eliminarUsuario() {
        if (!usuarioAEliminar) return;
        setGuardando(true);
        try {
            await api.delete(`/Usuarios/EliminarUsuario/${usuarioAEliminar.id}`);
            alerta.mostrar("Usuario eliminado correctamente", "ok");
            setUsuarioAEliminar(null);
            cargarUsuarios();
        } catch {
            alerta.mostrar("No se puede eliminar este usuario", "error");
            setUsuarioAEliminar(null);
        } finally {
            setGuardando(false);
        }
    }

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-base">Cargando usuarios...</p>
            </div>
        );
    }

    const totalPaginas = Math.ceil(usuarios.length / porPagina);
    const usuariosPagina = usuarios.slice((pagina - 1) * porPagina, pagina * porPagina);

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
                        <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
                        <p className="text-base text-slate-500">{usuarios.length} usuarios registrados</p>
                    </div>
                    <button
                        onClick={() => { setMostrarForm(!mostrarForm); setErrores({}); cerrarEditar(); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-3 rounded-xl shadow-sm transition-colors"
                    >
                        <Plus size={20} />
                        <span className="text-base">Nuevo</span>
                    </button>
                </div>

                <Alerta mensaje={alerta.mensaje} tipo={alerta.tipo} visible={alerta.visible} />

                {mostrarForm && (
                    <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 space-y-4 shadow-sm">
                        <p className="text-lg font-bold text-slate-800">Nuevo usuario</p>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <User size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-600">Nombre completo</p>
                            </div>
                            <input
                                type="text"
                                value={form.nombreCompleto}
                                onChange={e => actualizar("nombreCompleto", e.target.value)}
                                placeholder="Ej: Juan García"
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.nombreCompleto ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.nombreCompleto && <p className="text-sm text-red-500 mt-1">{errores.nombreCompleto}</p>}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Mail size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-600">Correo electrónico</p>
                            </div>
                            <input
                                type="email"
                                value={form.correoElectronico}
                                onChange={e => actualizar("correoElectronico", e.target.value)}
                                placeholder="correo@ejemplo.com"
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.correoElectronico ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.correoElectronico && <p className="text-sm text-red-500 mt-1">{errores.correoElectronico}</p>}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Lock size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-600">Contraseña</p>
                            </div>
                            <input
                                type="password"
                                value={form.contrasena}
                                onChange={e => actualizar("contrasena", e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.contrasena ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.contrasena && <p className="text-sm text-red-500 mt-1">{errores.contrasena}</p>}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-600">Rol</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {["Vendedor", "Administrador"].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => actualizar("rol", r)}
                                        className={`py-3 rounded-xl text-base font-semibold border-2 transition-all ${form.rol === r
                                            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300"
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={() => { setMostrarForm(false); setErrores({}); }}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl py-4 text-base transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={crearUsuario}
                                disabled={guardando}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl py-4 text-base transition-colors"
                            >
                                {guardando ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                    {usuarios.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Users size={48} className="text-slate-300" />
                            <p className="text-base text-slate-500">No hay usuarios registrados</p>
                        </div>
                    ) : (
                        <>
                            <div className="divide-y divide-slate-100">
                                {usuariosPagina.map((u) => (
                                    <div key={u.id}>
                                        <div className="flex items-center justify-between px-4 py-4">
                                            <button
                                                onClick={() => usuarioEditando === u.id ? cerrarEditar() : abrirEditar(u)}
                                                className="flex items-center gap-3 flex-1 min-w-0 text-left"
                                            >
                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${u.rol === "Administrador" ? "bg-purple-100" : "bg-blue-100"
                                                    }`}>
                                                    {u.rol === "Administrador"
                                                        ? <ShieldCheck size={20} className="text-purple-600" />
                                                        : <User size={20} className="text-blue-600" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-base font-semibold text-slate-800 truncate">{u.nombreCompleto}</p>
                                                    <p className="text-sm text-slate-400 truncate">{u.correoElectronico}</p>
                                                </div>
                                            </button>
                                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                                <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${u.rol === "Administrador" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                                    }`}>
                                                    {u.rol}
                                                </span>
                                                <button
                                                    onClick={() => usuarioEditando === u.id ? cerrarEditar() : abrirEditar(u)}
                                                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                >
                                                    {usuarioEditando === u.id ? <X size={17} /> : <Pencil size={17} />}
                                                </button>
                                                <button
                                                    onClick={() => setUsuarioAEliminar(u)}
                                                    className="w-9 h-9 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            </div>
                                        </div>

                                        {usuarioEditando === u.id && (
                                            <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-4 bg-slate-50">
                                                <p className="text-base font-bold text-slate-700">Editar usuario</p>

                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <User size={16} className="text-slate-400" />
                                                        <p className="text-sm font-semibold text-slate-600">Nombre completo</p>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={formEditar.nombreCompleto}
                                                        onChange={e => actualizarEditar("nombreCompleto", e.target.value)}
                                                        className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none transition-all bg-white ${erroresEditar.nombreCompleto ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                                            }`}
                                                    />
                                                    {erroresEditar.nombreCompleto && <p className="text-sm text-red-500 mt-1">{erroresEditar.nombreCompleto}</p>}
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Mail size={16} className="text-slate-400" />
                                                        <p className="text-sm font-semibold text-slate-600">Correo electrónico</p>
                                                    </div>
                                                    <input
                                                        type="email"
                                                        value={formEditar.correoElectronico}
                                                        onChange={e => actualizarEditar("correoElectronico", e.target.value)}
                                                        className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none transition-all bg-white ${erroresEditar.correoElectronico ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                                            }`}
                                                    />
                                                    {erroresEditar.correoElectronico && <p className="text-sm text-red-500 mt-1">{erroresEditar.correoElectronico}</p>}
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Lock size={16} className="text-slate-400" />
                                                        <p className="text-sm font-semibold text-slate-600">
                                                            Nueva contraseña <span className="text-slate-400 font-normal">(dejar vacío para no cambiar)</span>
                                                        </p>
                                                    </div>
                                                    <input
                                                        type="password"
                                                        value={formEditar.nuevaContrasena}
                                                        onChange={e => actualizarEditar("nuevaContrasena", e.target.value)}
                                                        placeholder="Mínimo 6 caracteres"
                                                        className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all bg-white ${erroresEditar.nuevaContrasena ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                                            }`}
                                                    />
                                                    {erroresEditar.nuevaContrasena && <p className="text-sm text-red-500 mt-1">{erroresEditar.nuevaContrasena}</p>}
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <ShieldCheck size={16} className="text-slate-400" />
                                                        <p className="text-sm font-semibold text-slate-600">Rol</p>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {["Vendedor", "Administrador"].map(r => (
                                                            <button
                                                                key={r}
                                                                onClick={() => actualizarEditar("rol", r)}
                                                                className={`py-3 rounded-xl text-base font-semibold border-2 transition-all ${formEditar.rol === r
                                                                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                                                    : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                                                                    }`}
                                                            >
                                                                {r}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-1">
                                                    <button
                                                        onClick={cerrarEditar}
                                                        className="flex-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl py-4 text-base border-2 border-slate-200 transition-colors"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={actualizarUsuario}
                                                        disabled={guardando}
                                                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl py-4 text-base transition-colors"
                                                    >
                                                        {guardando ? "Guardando..." : "Guardar cambios"}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Paginacion
                                paginaActual={pagina}
                                totalPaginas={totalPaginas}
                                totalRegistros={usuarios.length}
                                porPagina={porPagina}
                                onCambiarPagina={setPagina}
                                onCambiarPorPagina={setPorPagina}
                            />
                        </>
                    )}
                </div>

            </div>

            <ModalConfirmacion
                visible={usuarioAEliminar !== null}
                titulo="¿Eliminar este usuario?"
                descripcion={`Se desactivará a "${usuarioAEliminar?.nombreCompleto}". Ya no podrá ingresar al sistema.`}
                textoConfirmar="Sí, eliminar"
                colorConfirmar="rojo"
                cargando={guardando}
                onCancelar={() => setUsuarioAEliminar(null)}
                onConfirmar={() => eliminarUsuario()}
            />
        </>
    );
}