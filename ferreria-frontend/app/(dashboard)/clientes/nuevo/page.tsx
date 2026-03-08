"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    User,
    Phone,
    MapPin,
    CreditCard,
    CheckCircle,
} from "lucide-react";
import api from "@/lib/api";
import { Alerta } from "@/components/ui/Alerta";
import { ModalConfirmacion } from "@/components/ui/ModalConfirmacion";
import { useAlerta } from "@/hooks/useAlerta";

interface FormCliente {
    nombreCompleto: string;
    telefono: string;
    distrito: string;
    tipoDocumento: string;
    numeroDocumento: string;
}

const DISTRITOS_LIMA = [
    "Ate", "Barranco", "Breña", "Carabayllo", "Chaclacayo",
    "Chorrillos", "Cieneguilla", "Comas", "El Agustino", "Independencia",
    "Jesús María", "La Molina", "La Victoria", "Lince", "Los Olivos",
    "Lurigancho", "Lurín", "Magdalena del Mar", "Miraflores", "Pachacámac",
    "Pucusana", "Pueblo Libre", "Puente Piedra", "Punta Hermosa",
    "Punta Negra", "Rímac", "San Bartolo", "San Borja", "San Isidro",
    "San Juan de Lurigancho", "San Juan de Miraflores", "San Luis",
    "San Martín de Porres", "San Miguel", "Santa Anita", "Santa María del Mar",
    "Santa Rosa", "Santiago de Surco", "Surquillo", "Villa El Salvador",
    "Villa María del Triunfo",
];

export default function NuevoClientePage() {
    const router = useRouter();

    const [form, setForm] = useState<FormCliente>({
        nombreCompleto: "",
        telefono: "",
        distrito: "",
        tipoDocumento: "",
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

    function handleVolver() {
        setConfirmarSalir(true);
    }

    function actualizar(campo: keyof FormCliente, valor: string) {
        setForm((prev) => ({ ...prev, [campo]: valor }));
        setErrores((prev) => ({ ...prev, [campo]: "" }));
    }

    function validar(): boolean {
        const nuevosErrores: Partial<FormCliente> = {};
        if (!form.nombreCompleto.trim())
            nuevosErrores.nombreCompleto = "El nombre es obligatorio";
        if (!form.telefono.trim())
            nuevosErrores.telefono = "El teléfono es obligatorio";
        else if (!/^\d{9}$/.test(form.telefono.trim()))
            nuevosErrores.telefono = "El teléfono debe tener 9 dígitos";
        if (form.tipoDocumento && !form.numeroDocumento.trim())
            nuevosErrores.numeroDocumento = "Ingresa el número de documento";
        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    }

    async function guardar() {
        if (!validar()) return;
        setGuardando(true);
        try {
            const { data } = await api.post("/Clientes/CrearCliente", {
                nombreCompleto: form.nombreCompleto.trim(),
                telefono: form.telefono.trim(),
                distrito: form.distrito || null,
                tipoDocumento: form.tipoDocumento || null,
                numeroDocumento: form.numeroDocumento.trim() || null,
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

                {/* Header */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleVolver}
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
                                onChange={(e) => actualizar("nombreCompleto", e.target.value)}
                                placeholder="Ej: García Torres Juan"
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.nombreCompleto
                                    ? "border-red-300 bg-red-50 focus:border-red-400"
                                    : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.nombreCompleto ? (
                                <p className="text-sm text-red-500 mt-1 font-medium">{errores.nombreCompleto}</p>
                            ) : null}
                        </div>

                        <div className="px-4 py-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Phone size={18} className="text-green-600" />
                                </div>
                                <p className="text-base font-semibold text-slate-700">Teléfono celular</p>
                            </div>
                            <input
                                type="tel"
                                value={form.telefono}
                                onChange={(e) => actualizar("telefono", e.target.value.replace(/\D/g, ""))}
                                placeholder="Ej: 987654321"
                                maxLength={9}
                                className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.telefono
                                    ? "border-red-300 bg-red-50 focus:border-red-400"
                                    : "border-slate-200 focus:border-blue-400"
                                    }`}
                            />
                            {errores.telefono ? (
                                <p className="text-sm text-red-500 mt-1 font-medium">{errores.telefono}</p>
                            ) : null}
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
                                <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                    <MapPin size={18} className="text-orange-600" />
                                </div>
                                <p className="text-base font-semibold text-slate-700">Distrito</p>
                            </div>
                            <select
                                value={form.distrito}
                                onChange={(e) => actualizar("distrito", e.target.value)}
                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none focus:border-blue-400 transition-all bg-white"
                            >
                                <option value="">Sin distrito</option>
                                {DISTRITOS_LIMA.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>

                        <div className="px-4 py-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
                                    <CreditCard size={18} className="text-purple-600" />
                                </div>
                                <p className="text-base font-semibold text-slate-700">Tipo de documento</p>
                            </div>
                            <select
                                value={form.tipoDocumento}
                                onChange={(e) => actualizar("tipoDocumento", e.target.value)}
                                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base text-slate-800 focus:outline-none focus:border-blue-400 transition-all bg-white"
                            >
                                <option value="">Sin documento</option>
                                <option value="DNI">DNI</option>
                                <option value="RUC">RUC</option>
                                <option value="CE">Carnet de Extranjería</option>
                            </select>
                        </div>

                        {form.tipoDocumento ? (
                            <div className="px-4 py-4">
                                <p className="text-base font-semibold text-slate-700 mb-2">
                                    Número de {form.tipoDocumento}
                                </p>
                                <input
                                    type="text"
                                    value={form.numeroDocumento}
                                    onChange={(e) => actualizar("numeroDocumento", e.target.value.replace(/\D/g, ""))}
                                    placeholder={
                                        form.tipoDocumento === "DNI" ? "8 dígitos" :
                                            form.tipoDocumento === "RUC" ? "11 dígitos" :
                                                "Número de documento"
                                    }
                                    maxLength={form.tipoDocumento === "DNI" ? 8 : 11}
                                    className={`w-full border-2 rounded-xl px-4 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none transition-all ${errores.numeroDocumento
                                        ? "border-red-300 bg-red-50 focus:border-red-400"
                                        : "border-slate-200 focus:border-blue-400"
                                        }`}
                                />
                                {errores.numeroDocumento ? (
                                    <p className="text-sm text-red-500 mt-1 font-medium">{errores.numeroDocumento}</p>
                                ) : null}
                            </div>
                        ) : null}

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