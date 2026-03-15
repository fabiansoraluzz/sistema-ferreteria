"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, User, Phone, MapPin, CreditCard, CheckCircle,
} from "lucide-react";
import api from "@/lib/api";
import { Alerta } from "@/components/ui/Alerta";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { useAlerta } from "@/hooks/useAlerta";

interface FormCliente {
    nombreCompleto: string;
    telefono: string;
    provincia: string;
    tipoDocumento: string;
    numeroDocumento: string;
}

const PROVINCIAS_PERU = [
    "Callao",
    // Amazonas
    "Chachapoyas", "Bagua", "Bongará", "Condorcanqui", "Luya", "Rodríguez de Mendoza", "Utcubamba",
    // Áncash
    "Huaraz", "Aija", "Antonio Raymondi", "Asunción", "Bolognesi", "Carhuaz", "Carlos Fermín Fitzcarrald",
    "Casma", "Corongo", "Huari", "Huarmey", "Huaylas", "Mariscal Luzuriaga", "Ocros", "Pallasca",
    "Pomabamba", "Recuay", "Santa", "Sihuas", "Yungay",
    // Apurímac
    "Abancay", "Andahuaylas", "Antabamba", "Aymaraes", "Cotabambas", "Chincheros", "Grau",
    // Arequipa
    "Arequipa", "Camaná", "Caravelí", "Castilla", "Caylloma", "Condesuyos", "Islay", "La Unión",
    // Ayacucho
    "Huamanga", "Cangallo", "Huanca Sancos", "Huanta", "La Mar", "Lucanas", "Parinacochas",
    "Páucar del Sara Sara", "Sucre", "Víctor Fajardo", "Vilcas Huamán",
    // Cajamarca
    "Cajamarca", "Cajabamba", "Celendín", "Chota", "Contumazá", "Cutervo", "Hualgayoc",
    "Jaén", "San Ignacio", "San Marcos", "San Miguel", "San Pablo", "Santa Cruz",
    // Cusco
    "Cusco", "Acomayo", "Anta", "Calca", "Canas", "Canchis", "Chumbivilcas", "Espinar",
    "La Convención", "Paruro", "Paucartambo", "Quispicanchi", "Urubamba",
    // Huancavelica
    "Huancavelica", "Acobamba", "Angaraes", "Castrovirreyna", "Churcampa", "Huaytará", "Tayacaja",
    // Huánuco
    "Huánuco", "Ambo", "Dos de Mayo", "Huacaybamba", "Huamalíes", "Leoncio Prado",
    "Marañón", "Pachitea", "Puerto Inca", "Lauricocha", "Yarowilca",
    // Ica
    "Ica", "Chincha", "Nasca", "Palpa", "Pisco",
    // Junín
    "Huancayo", "Chanchamayo", "Chupaca", "Concepción", "Junín", "Satipo", "Tarma", "Yauli",
    // La Libertad
    "Trujillo", "Ascope", "Bolívar", "Chepén", "Julcán", "Otuzco", "Pacasmayo",
    "Pataz", "Sánchez Carrión", "Santiago de Chuco", "Gran Chimú", "Virú",
    // Lambayeque
    "Chiclayo", "Ferreñafe", "Lambayeque",
    // Lima
    "Lima", "Barranca", "Cajatambo", "Canta", "Cañete", "Huaral", "Huarochirí",
    "Huaura", "Oyón", "Yauyos",
    // Loreto
    "Maynas", "Alto Amazonas", "Datem del Marañón", "Loreto", "Mariscal Ramón Castilla",
    "Putumayo", "Requena", "Ucayali",
    // Madre de Dios
    "Tambopata", "Manu", "Tahuamanu",
    // Moquegua
    "Mariscal Nieto", "General Sánchez Cerro", "Ilo",
    // Pasco
    "Pasco", "Daniel Alcides Carrión", "Oxapampa",
    // Piura
    "Piura", "Ayabaca", "Huancabamba", "Morropón", "Paita", "Sullana", "Talara", "Sechura",
    // Puno
    "Puno", "Azángaro", "Carabaya", "Chucuito", "El Collao", "Huancané", "Lampa",
    "Melgar", "Moho", "San Antonio de Putina", "San Román", "Sandia", "Yunguyo",
    // San Martín
    "Moyobamba", "Bellavista", "El Dorado", "Huallaga", "Lamas", "Mariscal Cáceres",
    "Picota", "Rioja", "San Martín", "Tocache",
    // Tacna
    "Tacna", "Candarave", "Jorge Basadre", "Tarata",
    // Tumbes
    "Tumbes", "Contralmirante Villar", "Zarumilla",
    // Ucayali
    "Coronel Portillo", "Atalaya", "Padre Abad", "Purús",
];

export default function NuevoClientePage() {
    const router = useRouter();

    const [form, setForm] = useState<FormCliente>({
        nombreCompleto: "",
        telefono: "",
        provincia: "",
        tipoDocumento: "DNI",
        numeroDocumento: "",
    });

    const [guardando, setGuardando] = useState(false);
    const [errores, setErrores] = useState<Partial<FormCliente>>({});
    const [confirmarSalir, setConfirmarSalir] = useState(false);
    const alerta = useAlerta();

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    function actualizar(campo: keyof FormCliente, valor: string) {
        setForm(prev => ({ ...prev, [campo]: valor }));
        setErrores(prev => ({ ...prev, [campo]: "" }));
    }

    function validar(): boolean {
        const e: Partial<FormCliente> = {};
        if (!form.nombreCompleto.trim())
            e.nombreCompleto = "El nombre es obligatorio";
        if (form.telefono && !/^\d{9}$/.test(form.telefono.trim()))
            e.telefono = "El teléfono debe tener 9 dígitos";
        if (!form.tipoDocumento)
            e.tipoDocumento = "El tipo de documento es obligatorio";
        if (!form.numeroDocumento.trim())
            e.numeroDocumento = "El número de documento es obligatorio";
        else if (form.tipoDocumento === "DNI" && !/^\d{8}$/.test(form.numeroDocumento))
            e.numeroDocumento = "El DNI debe tener 8 dígitos";
        else if (form.tipoDocumento === "RUC" && !/^\d{11}$/.test(form.numeroDocumento))
            e.numeroDocumento = "El RUC debe tener 11 dígitos";
        setErrores(e);
        return Object.keys(e).length === 0;
    }

    async function guardar() {
        if (!validar()) return;
        setGuardando(true);
        try {
            const { data } = await api.post("/Clientes/CrearCliente", {
                nombreCompleto: form.nombreCompleto.trim(),
                telefono: form.telefono.trim() || null,
                distrito: form.provincia || null,
                tipoDocumento: form.tipoDocumento,
                numeroDocumento: form.numeroDocumento.trim(),
            });
            router.push(`/clientes/${data.id}`);
        } catch {
            alerta.mostrar("Hubo un error al guardar el cliente. Intenta de nuevo.", "error");
            setGuardando(false);
        }
    }

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
                        <p className="text-sm text-slate-500">Clientes</p>
                        <h1 className="text-xl font-bold text-slate-800">Nuevo cliente</h1>
                    </div>
                </div>

                <Alerta mensaje={alerta.mensaje} tipo={alerta.tipo} visible={alerta.visible} />

                {/* Datos obligatorios */}
                <div>
                    <p className="text-lg font-bold text-slate-700 mb-3">Datos obligatorios</p>
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">

                        <div className="px-4 py-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                    <User size={18} className="text-blue-600" />
                                </div>
                                <p className="text-base font-semibold text-slate-700">Nombre completo</p>
                            </div>
                            <input
                                type="text"
                                value={form.nombreCompleto}
                                onChange={e => actualizar("nombreCompleto", e.target.value)}
                                placeholder="Ej: García Torres Juan"
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.nombreCompleto ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.nombreCompleto && <p className="text-sm text-red-500 mt-1 font-medium">{errores.nombreCompleto}</p>}
                        </div>

                        <div className="px-4 py-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                                    <CreditCard size={18} className="text-purple-600" />
                                </div>
                                <p className="text-base font-semibold text-slate-700">Tipo de documento</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {["DNI", "RUC", "CE"].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => { actualizar("tipoDocumento", t); actualizar("numeroDocumento", ""); }}
                                        className={`py-3 rounded-xl text-base font-semibold border-2 transition-all ${form.tipoDocumento === t
                                            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300"
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                            {errores.tipoDocumento && <p className="text-sm text-red-500 mt-2 font-medium">{errores.tipoDocumento}</p>}
                        </div>

                        <div className="px-4 py-4">
                            <p className="text-base font-semibold text-slate-700 mb-2">
                                Número de {form.tipoDocumento}
                            </p>
                            <input
                                type="text"
                                value={form.numeroDocumento}
                                onChange={e => actualizar("numeroDocumento", e.target.value.replace(/\D/g, ""))}
                                placeholder={
                                    form.tipoDocumento === "DNI" ? "8 dígitos" :
                                        form.tipoDocumento === "RUC" ? "11 dígitos" : "Número de documento"
                                }
                                maxLength={form.tipoDocumento === "DNI" ? 8 : 11}
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.numeroDocumento ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.numeroDocumento && <p className="text-sm text-red-500 mt-1 font-medium">{errores.numeroDocumento}</p>}
                        </div>

                    </div>
                </div>

                {/* Datos opcionales */}
                <div>
                    <p className="text-lg font-bold text-slate-700 mb-1">Datos adicionales</p>
                    <p className="text-sm text-slate-400 mb-3">Estos datos son opcionales</p>
                    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">

                        <div className="px-4 py-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Phone size={18} className="text-green-600" />
                                </div>
                                <p className="text-base font-semibold text-slate-700">Teléfono celular</p>
                            </div>
                            <input
                                type="text"
                                value={form.telefono}
                                onChange={e => actualizar("telefono", e.target.value.replace(/\D/g, ""))}
                                placeholder="Ej: 987654321"
                                maxLength={9}
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.telefono ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.telefono && <p className="text-sm text-red-500 mt-1 font-medium">{errores.telefono}</p>}
                        </div>

                        <div className="px-4 py-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                    <MapPin size={18} className="text-orange-600" />
                                </div>
                                <p className="text-base font-semibold text-slate-700">Provincia</p>
                            </div>
                            <select
                                value={form.provincia}
                                onChange={e => actualizar("provincia", e.target.value)}
                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none focus:border-blue-400 transition-all bg-white"
                            >
                                <option value="">Sin provincia</option>
                                {PROVINCIAS_PERU.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
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
                    {guardando ? "Guardando..." : "Guardar cliente"}
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