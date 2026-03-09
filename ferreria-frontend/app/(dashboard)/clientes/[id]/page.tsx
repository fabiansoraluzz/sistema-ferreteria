"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Phone, MapPin, CreditCard,
    CheckCircle, XCircle, ClipboardList, ChevronRight,
    Trash2, Pencil, User, X,
} from "lucide-react";
import api from "@/lib/api";
import { ClienteDetalle } from "@/types";
import { Alerta } from "@/components/ui/Alerta";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { useAlerta } from "@/hooks/useAlerta";

const PROVINCIAS_PERU = [
    "Callao",
    "Chachapoyas", "Bagua", "Bongará", "Condorcanqui", "Luya", "Rodríguez de Mendoza", "Utcubamba",
    "Huaraz", "Aija", "Antonio Raymondi", "Asunción", "Bolognesi", "Carhuaz", "Carlos Fermín Fitzcarrald",
    "Casma", "Corongo", "Huari", "Huarmey", "Huaylas", "Mariscal Luzuriaga", "Ocros", "Pallasca",
    "Pomabamba", "Recuay", "Santa", "Sihuas", "Yungay",
    "Abancay", "Andahuaylas", "Antabamba", "Aymaraes", "Cotabambas", "Chincheros", "Grau",
    "Arequipa", "Camaná", "Caravelí", "Castilla", "Caylloma", "Condesuyos", "Islay", "La Unión",
    "Huamanga", "Cangallo", "Huanca Sancos", "Huanta", "La Mar", "Lucanas", "Parinacochas",
    "Páucar del Sara Sara", "Sucre", "Víctor Fajardo", "Vilcas Huamán",
    "Cajamarca", "Cajabamba", "Celendín", "Chota", "Contumazá", "Cutervo", "Hualgayoc",
    "Jaén", "San Ignacio", "San Marcos", "San Miguel", "San Pablo", "Santa Cruz",
    "Cusco", "Acomayo", "Anta", "Calca", "Canas", "Canchis", "Chumbivilcas", "Espinar",
    "La Convención", "Paruro", "Paucartambo", "Quispicanchi", "Urubamba",
    "Huancavelica", "Acobamba", "Angaraes", "Castrovirreyna", "Churcampa", "Huaytará", "Tayacaja",
    "Huánuco", "Ambo", "Dos de Mayo", "Huacaybamba", "Huamalíes", "Leoncio Prado",
    "Marañón", "Pachitea", "Puerto Inca", "Lauricocha", "Yarowilca",
    "Ica", "Chincha", "Nasca", "Palpa", "Pisco",
    "Huancayo", "Chanchamayo", "Chupaca", "Concepción", "Junín", "Satipo", "Tarma", "Yauli",
    "Trujillo", "Ascope", "Bolívar", "Chepén", "Julcán", "Otuzco", "Pacasmayo",
    "Pataz", "Sánchez Carrión", "Santiago de Chuco", "Gran Chimú", "Virú",
    "Chiclayo", "Ferreñafe", "Lambayeque",
    "Lima", "Barranca", "Cajatambo", "Canta", "Cañete", "Huaral", "Huarochirí", "Huaura", "Oyón", "Yauyos",
    "Maynas", "Alto Amazonas", "Datem del Marañón", "Loreto", "Mariscal Ramón Castilla",
    "Putumayo", "Requena", "Ucayali",
    "Tambopata", "Manu", "Tahuamanu",
    "Mariscal Nieto", "General Sánchez Cerro", "Ilo",
    "Pasco", "Daniel Alcides Carrión", "Oxapampa",
    "Piura", "Ayabaca", "Huancabamba", "Morropón", "Paita", "Sullana", "Talara", "Sechura",
    "Puno", "Azángaro", "Carabaya", "Chucuito", "El Collao", "Huancané", "Lampa",
    "Melgar", "Moho", "San Antonio de Putina", "San Román", "Sandia", "Yunguyo",
    "Moyobamba", "Bellavista", "El Dorado", "Huallaga", "Lamas", "Mariscal Cáceres",
    "Picota", "Rioja", "San Martín", "Tocache",
    "Tacna", "Candarave", "Jorge Basadre", "Tarata",
    "Tumbes", "Contralmirante Villar", "Zarumilla",
    "Coronel Portillo", "Atalaya", "Padre Abad", "Purús",
];

interface FormEditar {
    nombreCompleto: string;
    telefono: string;
    provincia: string;
    tipoDocumento: string;
    numeroDocumento: string;
}

export default function DetalleClientePage() {
    const params = useParams();
    const router = useRouter();
    const alerta = useAlerta();
    const [cliente, setCliente] = useState<ClienteDetalle | null>(null);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [pestana, setPestana] = useState<"deuda" | "pedidos">("deuda");
    const [confirmarEliminar, setConfirmarEliminar] = useState(false);
    const [editando, setEditando] = useState(false);
    const [errores, setErrores] = useState<Partial<FormEditar>>({});
    const [form, setForm] = useState<FormEditar>({
        nombreCompleto: "", telefono: "", provincia: "",
        tipoDocumento: "DNI", numeroDocumento: "",
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { cargarCliente(); }, []);

    async function cargarCliente() {
        try {
            const { data } = await api.get<ClienteDetalle>(`/Clientes/ObtenerDetalleCliente/${params.id}`);
            setCliente(data);
        } catch {
            router.push("/clientes");
        } finally {
            setCargando(false);
        }
    }

    function abrirEditar() {
        if (!cliente) return;
        setForm({
            nombreCompleto: cliente.nombreCompleto,
            telefono: cliente.telefono ?? "",
            provincia: cliente.distrito ?? "",
            tipoDocumento: cliente.tipoDocumento ?? "DNI",
            numeroDocumento: cliente.numeroDocumento ?? "",
        });
        setErrores({});
        setEditando(true);
    }

    function actualizar(campo: keyof FormEditar, valor: string) {
        setForm(prev => ({ ...prev, [campo]: valor }));
        setErrores(prev => ({ ...prev, [campo]: "" }));
    }

    function validar(): boolean {
        const e: Partial<FormEditar> = {};
        if (!form.nombreCompleto.trim()) e.nombreCompleto = "El nombre es obligatorio";
        if (form.telefono && !/^\d{9}$/.test(form.telefono.trim()))
            e.telefono = "El teléfono debe tener 9 dígitos";
        if (!form.tipoDocumento) e.tipoDocumento = "El tipo de documento es obligatorio";
        if (!form.numeroDocumento.trim()) e.numeroDocumento = "El número de documento es obligatorio";
        else if (form.tipoDocumento === "DNI" && !/^\d{8}$/.test(form.numeroDocumento))
            e.numeroDocumento = "El DNI debe tener 8 dígitos";
        else if (form.tipoDocumento === "RUC" && !/^\d{11}$/.test(form.numeroDocumento))
            e.numeroDocumento = "El RUC debe tener 11 dígitos";
        setErrores(e);
        return Object.keys(e).length === 0;
    }

    async function guardarEdicion() {
        if (!validar()) return;
        setGuardando(true);
        try {
            await api.put(`/Clientes/ActualizarCliente/${params.id}`, {
                nombreCompleto: form.nombreCompleto.trim(),
                telefono: form.telefono.trim() || null,
                distrito: form.provincia || null,
                tipoDocumento: form.tipoDocumento,
                numeroDocumento: form.numeroDocumento.trim(),
            });
            alerta.mostrar("Cliente actualizado correctamente", "ok");
            setEditando(false);
            cargarCliente();
        } catch {
            alerta.mostrar("Error al actualizar el cliente", "error");
        } finally {
            setGuardando(false);
        }
    }

    async function eliminarCliente() {
        setGuardando(true);
        try {
            await api.delete(`/Clientes/EliminarCliente/${params.id}`);
            router.push("/clientes");
        } catch {
            alerta.mostrar("Hubo un error al eliminar el cliente", "error");
            setGuardando(false);
        }
    }

    if (cargando) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-base">Cargando cliente...</p>
            </div>
        );
    }

    if (!cliente) return null;

    const pedidosConDeuda = cliente.detallePedidos.filter(p => p.saldoPendiente > 0);

    function colorEstadoBadge(estado: string) {
        if (estado === "Pendiente") return "bg-amber-100 text-amber-700";
        if (estado === "Confirmado") return "bg-blue-100 text-blue-700";
        if (estado === "EnReparto") return "bg-orange-100 text-orange-700";
        if (estado === "Entregado") return "bg-green-100 text-green-700";
        if (estado === "Cancelado") return "bg-slate-100 text-slate-600";
        return "bg-slate-100 text-slate-600";
    }

    function etiquetaEstado(estado: string) {
        return estado === "EnReparto" ? "En Reparto" : estado;
    }

    return (
        <>
            <div className="space-y-5">

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/clientes")}
                        className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-500">Clientes</p>
                        <h1 className="text-xl font-bold text-slate-800 truncate">{cliente.nombreCompleto}</h1>
                    </div>
                    <Link
                        href="/pedidos/nuevo"
                        className="flex items-center gap-2 bg-blue-600 text-white text-sm font-bold px-3 py-2 rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        <ClipboardList size={16} />
                        Pedido
                    </Link>
                </div>

                <Alerta mensaje={alerta.mensaje} tipo={alerta.tipo} visible={alerta.visible} />

                <div className={`rounded-2xl p-6 text-white shadow-sm ${cliente.deudaTotal > 0 ? "bg-red-500" : "bg-green-500"}`}>
                    <div className="flex items-center gap-2 mb-3">
                        {cliente.deudaTotal > 0 ? <XCircle size={22} /> : <CheckCircle size={22} />}
                        <p className="text-base font-semibold">
                            {cliente.deudaTotal > 0 ? "Este cliente tiene deuda pendiente" : "Este cliente no debe nada"}
                        </p>
                    </div>
                    <p className="text-5xl font-bold">S/ {cliente.deudaTotal.toFixed(2)}</p>
                    <div className="flex gap-5 mt-4 text-base opacity-90">
                        <span>{cliente.totalPedidos} pedidos en total</span>
                        <span>{cliente.pedidosPendientes} pendientes</span>
                    </div>
                </div>

                {/* Datos del cliente + botones editar/eliminar */}
                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                    {cliente.telefono && (
                        <a
                            href={`tel:${cliente.telefono}`}
                            className="flex items-center gap-4 px-4 py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <Phone size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Teléfono — tocar para llamar</p>
                                <p className="text-lg font-bold text-blue-600">{cliente.telefono}</p>
                            </div>
                        </a>
                    )}
                    {cliente.distrito && (
                        <div className="flex items-center gap-4 px-4 py-4 border-b border-slate-100">
                            <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                <MapPin size={20} className="text-slate-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Provincia</p>
                                <p className="text-base font-semibold text-slate-800">{cliente.distrito}</p>
                            </div>
                        </div>
                    )}
                    {cliente.tipoDocumento && (
                        <div className="flex items-center gap-4 px-4 py-4">
                            <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                <CreditCard size={20} className="text-slate-600" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">{cliente.tipoDocumento}</p>
                                <p className="text-base font-semibold text-slate-800">{cliente.numeroDocumento}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Botones acción */}
                <div className="flex gap-3">
                    <button
                        onClick={() => editando ? setEditando(false) : abrirEditar()}
                        className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-blue-50 text-blue-600 font-bold rounded-2xl py-4 text-base border-2 border-blue-200 transition-colors"
                    >
                        {editando ? <X size={20} /> : <Pencil size={20} />}
                        {editando ? "Cancelar" : "Editar cliente"}
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
                        <p className="text-lg font-bold text-slate-800">Editar cliente</p>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <User size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-600">Nombre completo</p>
                            </div>
                            <input
                                type="text"
                                value={form.nombreCompleto}
                                onChange={e => actualizar("nombreCompleto", e.target.value)}
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none transition-all ${errores.nombreCompleto ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.nombreCompleto && <p className="text-sm text-red-500 mt-1">{errores.nombreCompleto}</p>}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <CreditCard size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-600">Tipo de documento</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {["DNI", "RUC", "CE"].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => { actualizar("tipoDocumento", t); actualizar("numeroDocumento", ""); }}
                                        className={`py-3 rounded-xl text-base font-semibold border-2 transition-all ${form.tipoDocumento === t
                                            ? "bg-blue-600 border-blue-600 text-white"
                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300"
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-slate-600 mb-2">Número de {form.tipoDocumento}</p>
                            <input
                                type="text"
                                value={form.numeroDocumento}
                                onChange={e => actualizar("numeroDocumento", e.target.value.replace(/\D/g, ""))}
                                maxLength={form.tipoDocumento === "DNI" ? 8 : 11}
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none transition-all ${errores.numeroDocumento ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.numeroDocumento && <p className="text-sm text-red-500 mt-1">{errores.numeroDocumento}</p>}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Phone size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-600">Teléfono <span className="font-normal text-slate-400">(opcional)</span></p>
                            </div>
                            <input
                                type="text"
                                value={form.telefono}
                                onChange={e => actualizar("telefono", e.target.value.replace(/\D/g, ""))}
                                maxLength={9}
                                placeholder="9 dígitos"
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none transition-all ${errores.telefono ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.telefono && <p className="text-sm text-red-500 mt-1">{errores.telefono}</p>}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin size={16} className="text-slate-400" />
                                <p className="text-sm font-semibold text-slate-600">Provincia <span className="font-normal text-slate-400">(opcional)</span></p>
                            </div>
                            <select
                                value={form.provincia}
                                onChange={e => actualizar("provincia", e.target.value)}
                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none focus:border-blue-400 bg-white"
                            >
                                <option value="">Sin provincia</option>
                                {PROVINCIAS_PERU.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
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

                {/* Pestañas deuda/pedidos */}
                <div className="flex bg-slate-100 rounded-2xl p-1.5 gap-1">
                    <button
                        onClick={() => setPestana("deuda")}
                        className={`flex-1 py-3 text-base font-bold rounded-xl transition-all ${pestana === "deuda" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Lo que debe
                    </button>
                    <button
                        onClick={() => setPestana("pedidos")}
                        className={`flex-1 py-3 text-base font-bold rounded-xl transition-all ${pestana === "pedidos" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            }`}
                    >
                        Sus pedidos
                    </button>
                </div>

                <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
                    {pestana === "deuda" && pedidosConDeuda.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <CheckCircle size={48} className="text-green-400" />
                            <p className="text-lg font-semibold text-slate-500">No tiene deudas pendientes</p>
                        </div>
                    )}
                    {pestana === "deuda" && pedidosConDeuda.length > 0 && (
                        <div className="divide-y divide-slate-100">
                            {pedidosConDeuda.map(p => (
                                <div key={p.pedidoId} className="px-4 py-5">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-base font-bold text-slate-700">Pedido #{p.pedidoId}</p>
                                        <p className="text-xl font-bold text-red-600">S/ {p.saldoPendiente.toFixed(2)}</p>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-400">
                                        <span>Total: S/ {p.total.toFixed(2)}</span>
                                        <span>Pagó: S/ {p.montoPagado.toFixed(2)}</span>
                                    </div>
                                    <p className="text-sm text-slate-400 mt-1">
                                        {new Date(p.fechaPedido).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                    {pestana === "pedidos" && cliente.detallePedidos.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <ClipboardList size={48} className="text-slate-300" />
                            <p className="text-base text-slate-500">Este cliente no tiene pedidos aún</p>
                        </div>
                    )}
                    {pestana === "pedidos" && cliente.detallePedidos.length > 0 && (
                        <div className="divide-y divide-slate-100">
                            {cliente.detallePedidos.map(p => (
                                <Link
                                    key={p.pedidoId}
                                    href={`/pedidos/${p.pedidoId}`}
                                    className="flex items-center justify-between px-4 py-4 hover:bg-slate-50 transition-colors"
                                >
                                    <div>
                                        <p className="text-base font-semibold text-slate-800">Pedido #{p.pedidoId}</p>
                                        <p className="text-sm text-slate-400">
                                            {new Date(p.fechaPedido).toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-right">
                                            <p className="text-base font-bold text-slate-800">S/ {p.total.toFixed(2)}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colorEstadoBadge(p.estadoPedido)}`}>
                                                {etiquetaEstado(p.estadoPedido)}
                                            </span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            <ModalConfirmacion
                visible={confirmarEliminar}
                titulo="¿Eliminar este cliente?"
                descripcion={`Se eliminará a "${cliente.nombreCompleto}".`}
                textoConfirmar="Sí, eliminar"
                colorConfirmar="rojo"
                cargando={guardando}
                onCancelar={() => setConfirmarEliminar(false)}
                onConfirmar={() => { setConfirmarEliminar(false); eliminarCliente(); }}
            />
        </>
    );
}