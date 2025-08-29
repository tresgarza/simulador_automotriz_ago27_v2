"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatMXN, formatPercent, cn } from "@/lib/utils";
import { Calculator, Car, DollarSign, Shield, Info, HelpCircle, CreditCard, User, Phone, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "../../../lib/auth";

// Schema base sin refinamientos para poder extenderlo
const BaseFormSchemaCore = z.object({
  vehicle_value: z.coerce.number()
    .min(50000, "El valor del vehículo debe ser mayor a $50,000")
    .max(5000000, "El valor del vehículo no puede exceder $5,000,000"),
  down_payment_amount: z.coerce.number()
    .min(0, "El enganche no puede ser negativo")
    .max(5000000, "El enganche no puede exceder $5,000,000"),
  insurance_mode: z.enum(["cash", "financed"]),
  insurance_amount: z.coerce.number()
    .min(0, "El monto del seguro no puede ser negativo")
    .max(500000, "El monto del seguro no puede exceder $500,000"),
  commission_mode: z.enum(["cash", "financed"]),
});

const ClientFormSchemaBase = BaseFormSchemaCore.extend({
  client_name: z.string()
    .min(2, "El nombre es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "El nombre solo puede contener letras y espacios"),
  client_phone: z.string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .regex(/^[\d\s\-\+\(\)]+$/, "El teléfono solo puede contener números, espacios, guiones, paréntesis y el símbolo +"),
  client_email: z.string()
    .email("Email inválido")
    .max(100, "El email no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),

  // Datos del vehículo para clientes
  vehicle_brand: z.string()
    .max(50, "La marca no puede exceder 50 caracteres")
    .optional(),
  vehicle_model: z.string()
    .max(50, "El modelo no puede exceder 50 caracteres")
    .optional(),
  vehicle_year: z.coerce.number()
    .min(1900, "El año debe ser posterior a 1900")
    .max(new Date().getFullYear() + 1, "El año no puede ser muy futuro")
    .optional(),

  // Agencia donde compra el vehículo
  dealer_agency: z.string().optional(),

  // Checkboxes
  no_vehicle_yet: z.boolean().optional(),
  privacy_consent: z.boolean(),
});

// Aplicar refinamientos después de la extensión
const ClientFormSchema = ClientFormSchemaBase.refine((data) => {
  // Validar que el enganche sea al menos 30% del valor del vehículo
  const minDownPayment = data.vehicle_value * 0.30;
  return data.down_payment_amount >= minDownPayment;
}, {
  message: "El enganche debe ser al menos 30% del valor del vehículo",
  path: ["down_payment_amount"]
}).refine((data) => {
  // Validar que el enganche no exceda el valor del vehículo
  return data.down_payment_amount < data.vehicle_value;
}, {
  message: "El enganche no puede ser mayor o igual al valor del vehículo",
  path: ["down_payment_amount"]
}).refine((data) => {
  // Validar privacidad consent
  return data.privacy_consent === true;
}, {
  message: "Debes autorizar el uso de tu información personal",
  path: ["privacy_consent"]
});

const AgencyFormSchemaBase = BaseFormSchemaCore.extend({
  client_name: z.string()
    .min(2, "El nombre del cliente es requerido")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "El nombre solo puede contener letras y espacios"),
  client_phone: z.string()
    .min(10, "El teléfono debe tener al menos 10 dígitos")
    .max(20, "El teléfono no puede exceder 20 caracteres")
    .regex(/^[\d\s\-\+\(\)]+$/, "El teléfono solo puede contener números, espacios, guiones, paréntesis y el símbolo +"),
  client_email: z.string()
    .email("Email inválido")
    .max(100, "El email no puede exceder 100 caracteres")
    .optional()
    .or(z.literal("")),

  // Campo de vendedor para agencias
  vendor_name: z.string().optional(),

  // Datos del vehículo para agencias (similar a clientes)
  vehicle_brand: z.string()
    .max(50, "La marca no puede exceder 50 caracteres")
    .optional(),
  vehicle_model: z.string()
    .max(50, "El modelo no puede exceder 50 caracteres")
    .optional(),
  vehicle_year: z.coerce.number()
    .min(1900, "El año debe ser posterior a 1900")
    .max(new Date().getFullYear() + 1, "El año no puede ser muy futuro")
    .optional(),

  // Checkboxes
  no_vehicle_yet: z.boolean().optional(),
});

// Aplicar refinamientos después de la extensión
const AgencyFormSchema = AgencyFormSchemaBase.refine((data) => {
  // Validar que el enganche sea al menos 30% del valor del vehículo
  const minDownPayment = data.vehicle_value * 0.30;
  return data.down_payment_amount >= minDownPayment;
}, {
  message: "El enganche debe ser al menos 30% del valor del vehículo",
  path: ["down_payment_amount"]
}).refine((data) => {
  // Validar que el enganche no exceda el valor del vehículo
  return data.down_payment_amount < data.vehicle_value;
}, {
  message: "El enganche no puede ser mayor o igual al valor del vehículo",
  path: ["down_payment_amount"]
});

const AsesorFormSchemaBase = BaseFormSchemaCore.extend({
  client_name: z.string().min(2, "El nombre del cliente es requerido"),
  client_phone: z.string().min(10, "El teléfono debe tener al menos 10 dígitos"),
  client_email: z.string().email("Email inválido").optional().or(z.literal("")),
  promoter_code: z.string().optional(),
  vendor_name: z.string().optional(),
  dealer_agency: z.string().optional(),
  origin_procedencia: z.string().optional(),
  // Datos adicionales del vehículo
  vehicle_brand: z.string().optional(),
  vehicle_model: z.string().optional(),
  vehicle_year: z.coerce.number().optional(),
  vehicle_type: z.string().optional(),
  vehicle_usage: z.string().optional(),
  vehicle_origin: z.string().optional(),
  serial_number: z.string().optional(),
});

// Aplicar refinamientos después de la extensión
const AsesorFormSchema = AsesorFormSchemaBase.refine((data) => {
  // Validar que el enganche sea al menos 30% del valor del vehículo
  const minDownPayment = data.vehicle_value * 0.30;
  return data.down_payment_amount >= minDownPayment;
}, {
  message: "El enganche debe ser al menos 30% del valor del vehículo",
  path: ["down_payment_amount"]
}).refine((data) => {
  // Validar que el enganche no exceda el valor del vehículo
  return data.down_payment_amount < data.vehicle_value;
}, {
  message: "El enganche no puede ser mayor o igual al valor del vehículo",
  path: ["down_payment_amount"]
});

// Tipo unión que incluye todos los campos posibles
export type EnhancedFormData = z.output<typeof ClientFormSchema> & 
                              z.output<typeof AgencyFormSchema> & 
                              z.output<typeof AsesorFormSchema>;

interface EnhancedQuoteFormProps {
  onSubmit: (data: EnhancedFormData) => Promise<void>;
  isSubmitting: boolean;
  hasResults?: boolean;
}

const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap max-w-xs">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export function EnhancedQuoteForm({ onSubmit, isSubmitting, hasResults = false }: EnhancedQuoteFormProps) {
  const { user, isAsesor, isAgency, isClient } = useAuth();
  const [noVehicleYet, setNoVehicleYet] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  
  // Determinar el schema según el tipo de usuario
  const getFormSchema = () => {
    if (isAsesor) return AsesorFormSchema;
    if (isAgency) return AgencyFormSchema;
    return ClientFormSchema;
  };

  type FormData = z.infer<typeof ClientFormSchema> | z.infer<typeof AgencyFormSchema> | z.infer<typeof AsesorFormSchema>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(getFormSchema()),
    defaultValues: {
      vehicle_value: 405900,
      down_payment_amount: Math.round(405900 * 0.3),
      insurance_mode: "cash",
      insurance_amount: 19500,
      commission_mode: "cash",
      // NO pre-llenar datos del usuario para agencias - ellas capturan datos del cliente
      client_name: "",
      client_phone: "",
      client_email: "",
    },
  });

  const insuranceMode = watch("insurance_mode") as string;
  const commissionMode = watch("commission_mode") as string;
  const vehicleValue = watch("vehicle_value") as number;
  const downPayment = watch("down_payment_amount") as number;

  const downPaymentPercent = vehicleValue > 0 ? downPayment / vehicleValue : 0;
  const minDownPayment = vehicleValue * 0.3;
  const isDownPaymentLow = downPayment < minDownPayment;

  const handleDownPaymentBlur = () => {
    if (isDownPaymentLow && vehicleValue > 0) {
      setValue("down_payment_amount", Math.round(minDownPayment));
    }
  };

  // Efecto para manejar la hidratación
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // NO auto-completar datos del cliente para ASESORES ni AGENCIAS
  // Ambos tipos de usuario deben capturar datos del cliente real
  useEffect(() => {
    // Auto-completado deshabilitado para mantener consistencia
    // Tanto asesores como agencias capturan datos del cliente real
  }, [user, setValue, isAsesor, isAgency]);

  return (
    <div className="relative">
      {/* Card mejorada */}
      <div className="bg-white/95 backdrop-blur-lg border border-gray-200/60 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 to-white/60 rounded-3xl"></div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-6 md:space-y-8">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl mb-4 shadow-lg">
              <Calculator className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
              {!isHydrated ? "Calcula tu Crédito" : (isClient ? "Calcula tu Crédito" : "Nueva Cotización")}
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              {!isHydrated 
                ? "Ingresa los datos de tu vehículo"
                : (isClient 
                  ? "Ingresa los datos de tu vehículo" 
                  : `Cotización como ${isAsesor ? "Asesor" : "Agencia"}`
                )
              }
            </p>
          </div>

          {/* Datos del Cliente - Solo si no es cliente anónimo */}
          {isHydrated && !isClient && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Datos del Cliente
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400"
                    placeholder="Juan Pérez"
                    {...register("client_name")}
                  />
                  {errors.client_name && (
                    <p className="text-red-600 text-sm mt-1">{String(errors.client_name.message)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400"
                      placeholder="81XXXXXXXX"
                      {...register("client_phone")}
                    />
                  </div>
                  {errors.client_phone && (
                    <p className="text-red-600 text-sm mt-1">{String(errors.client_phone.message)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400"
                      placeholder="cliente@email.com"
                      {...register("client_email")}
                    />
                  </div>
                  {errors.client_email && (
                    <p className="text-red-600 text-sm mt-1">{String(errors.client_email.message)}</p>
                  )}
                </div>


              </div>

              {/* Campos específicos por tipo de usuario */}
              {isAgency && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendedor
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400"
                    placeholder="Nombre del vendedor"
                    {...register("vendor_name")}
                  />
                </div>
              )}

              {isAsesor && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agencia
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400"
                      placeholder="Honda Tec, Carpat, Facebook..."
                      {...register("dealer_agency")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendedor
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400"
                      placeholder="Nombre del vendedor"
                      {...register("vendor_name")}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Datos del Cliente General */}
          {isHydrated && isClient && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-emerald-800 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Tus Datos Personales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-emerald-300/50 focus:border-emerald-400"
                    placeholder="Tu nombre completo"
                    {...register("client_name")}
                  />
                  {errors.client_name && (
                    <p className="text-red-600 text-sm mt-1">{String(errors.client_name.message)}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-emerald-300/50 focus:border-emerald-400"
                      placeholder="81XXXXXXXX"
                      {...register("client_phone")}
                    />
                  </div>
                  {errors.client_phone && (
                    <p className="text-red-600 text-sm mt-1">{String(errors.client_phone.message)}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-emerald-300/50 focus:border-emerald-400"
                      placeholder="tu@email.com"
                      {...register("client_email")}
                    />
                  </div>
                  {errors.client_email && (
                    <p className="text-red-600 text-sm mt-1">{String(errors.client_email.message)}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Información del Vehículo para Clientes */}
          {isHydrated && isClient && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                  <Car className="w-5 h-5 mr-2" />
                  Información del Vehículo
                </h3>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={noVehicleYet}
                    onChange={(e) => {
                      setNoVehicleYet(e.target.checked);
                      setValue("no_vehicle_yet", e.target.checked);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-600">No aplica</span>
                </label>
              </div>
              
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${noVehicleYet ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    disabled={noVehicleYet}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400 disabled:bg-gray-100"
                    placeholder="Toyota, Honda, Nissan..."
                    {...register("vehicle_brand")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo
                  </label>
                  <input
                    type="text"
                    disabled={noVehicleYet}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400 disabled:bg-gray-100"
                    placeholder="Corolla, Civic, Sentra..."
                    {...register("vehicle_model")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Año
                  </label>
                  <input
                    type="number"
                    min="2000"
                    max="2025"
                    disabled={noVehicleYet}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400 disabled:bg-gray-100"
                    placeholder="2024"
                    {...register("vehicle_year")}
                  />
                </div>
              </div>

              {/* Campo de agencia para clientes generales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agencia donde comprarás el vehículo
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400"
                  placeholder="Honda Tec, Carpat, Facebook..."
                  {...register("dealer_agency")}
                />
              </div>

              {noVehicleYet && (
                <div className="bg-blue-100 border border-blue-300 rounded-xl p-4">
                  <p className="text-blue-800 text-sm">
                    💡 No te preocupes, puedes hacer la simulación sin tener el vehículo específico. 
                    Los datos del vehículo son opcionales para obtener tu cotización.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Información del Vehículo para Agencias */}
          {isHydrated && isAgency && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-blue-800 flex items-center">
                  <Car className="w-5 h-5 mr-2" />
                  Información del Vehículo
                </h3>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={noVehicleYet}
                    onChange={(e) => {
                      setNoVehicleYet(e.target.checked);
                      setValue("no_vehicle_yet", e.target.checked);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-600">No tiene vehículo aún</span>
                </label>
              </div>
              
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${noVehicleYet ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    disabled={noVehicleYet}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400 disabled:bg-gray-100"
                    placeholder="Toyota, Honda, Nissan..."
                    {...register("vehicle_brand")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo
                  </label>
                  <input
                    type="text"
                    disabled={noVehicleYet}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400 disabled:bg-gray-100"
                    placeholder="Corolla, Civic, Sentra..."
                    {...register("vehicle_model")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Año
                  </label>
                  <input
                    type="number"
                    disabled={noVehicleYet}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400 disabled:bg-gray-100"
                    placeholder="2024"
                    {...register("vehicle_year")}
                  />
                </div>
              </div>

              {noVehicleYet && (
                <div className="bg-blue-100 border border-blue-300 rounded-xl p-4">
                  <p className="text-blue-800 text-sm">
                    💡 El cliente puede hacer la simulación sin tener el vehículo específico. 
                    Los datos del vehículo son opcionales para obtener la cotización.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Información del Vehículo para Asesores */}
          {isHydrated && isAsesor && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-emerald-800 flex items-center">
                  <Car className="w-5 h-5 mr-2" />
                  Información del Vehículo
                </h3>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={noVehicleYet}
                    onChange={(e) => {
                      setNoVehicleYet(e.target.checked);
                      setValue("no_vehicle_yet", e.target.checked);
                    }}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-gray-600">No tiene vehículo aún</span>
                </label>
              </div>

              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${noVehicleYet ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    disabled={noVehicleYet}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-emerald-300/50 focus:border-emerald-400 disabled:bg-gray-100"
                    placeholder="Toyota, Honda, Nissan..."
                    {...register("vehicle_brand")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo
                  </label>
                  <input
                    type="text"
                    disabled={noVehicleYet}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-emerald-300/50 focus:border-emerald-400 disabled:bg-gray-100"
                    placeholder="Corolla, Civic, Sentra..."
                    {...register("vehicle_model")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Año
                  </label>
                  <input
                    type="number"
                    disabled={noVehicleYet}
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-emerald-300/50 focus:border-emerald-400 disabled:bg-gray-100"
                    placeholder="2024"
                    {...register("vehicle_year")}
                  />
                </div>
              </div>

              {noVehicleYet && (
                <div className="bg-emerald-100 border border-emerald-300 rounded-xl p-4">
                  <p className="text-emerald-800 text-sm">
                    💡 No te preocupes, puedes hacer la simulación sin tener el vehículo específico.
                    Los datos del vehículo son opcionales para obtener la cotización.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Valor del Vehículo */}
          <div className="space-y-3">
            <label className="flex items-center text-gray-800 font-medium text-sm md:text-base">
              <Car className="w-4 h-4 md:w-5 md:h-5 mr-2 text-emerald-600" />
              Valor del Vehículo
              <Tooltip text="Precio total del vehículo según factura o cotización">
                <HelpCircle className="w-4 h-4 ml-2 text-gray-500 hover:text-gray-700" />
              </Tooltip>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                type="number"
                className={cn(
                  "w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-white border rounded-2xl text-base md:text-lg font-medium shadow-sm",
                  "focus:ring-4 focus:ring-emerald-300/50 focus:border-emerald-400 transition-all duration-200",
                  "hover:shadow-md",
                  errors.vehicle_value ? "border-red-400 ring-2 ring-red-400/20" : "border-gray-300"
                )}
                placeholder="405,900"
                {...register("vehicle_value")}
              />
            </div>
            {errors.vehicle_value && (
              <p className="text-red-600 text-sm flex items-center">
                <Info className="w-4 h-4 mr-1" />
                {String(errors.vehicle_value.message)}
              </p>
            )}
          </div>

          {/* Enganche */}
          <div className="space-y-3">
            <label className="flex items-center text-gray-800 font-medium text-sm md:text-base">
              <DollarSign className="w-4 h-4 md:w-5 md:h-5 mr-2 text-emerald-600" />
              Enganche 
              <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs md:text-sm font-medium">
                {formatPercent(downPaymentPercent)}
              </span>
              <Tooltip text="Mínimo 30% del valor del vehículo. A mayor enganche, menor pago mensual">
                <HelpCircle className="w-4 h-4 ml-2 text-gray-500 hover:text-gray-700" />
              </Tooltip>
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                type="number"
                className={cn(
                  "w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-white border rounded-2xl text-base md:text-lg font-medium shadow-sm",
                  "focus:ring-4 focus:ring-emerald-300/50 focus:border-emerald-400 transition-all duration-200",
                  "hover:shadow-md",
                  errors.down_payment_amount || isDownPaymentLow ? "border-red-400 ring-2 ring-red-400/20" : "border-gray-300"
                )}
                placeholder={formatMXN(minDownPayment)}
                {...register("down_payment_amount", {
                  onBlur: handleDownPaymentBlur
                })}
              />
            </div>
            {isDownPaymentLow && (
              <p className="text-red-600 text-sm flex items-center">
                <Info className="w-4 h-4 mr-1" />
                El enganche mínimo es 30% ({formatMXN(minDownPayment)})
              </p>
            )}
          </div>

          {/* Seguro */}
          <div className="space-y-4">
            <label className="flex items-center text-gray-800 font-medium text-sm md:text-base">
              <Shield className="w-4 h-4 md:w-5 md:h-5 mr-2 text-emerald-600" />
              Seguro del Vehículo
              <Tooltip text="CONTADO: Pagas el seguro por separado ahora. FINANCIADO: Se suma al crédito y lo pagas en mensualidades con intereses">
                <HelpCircle className="w-4 h-4 ml-2 text-gray-500 hover:text-gray-700" />
              </Tooltip>
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <input
                  type="radio"
                  value="cash"
                  className="sr-only peer"
                  {...register("insurance_mode")}
                />
                <div className={cn(
                  "flex items-center justify-center py-3 px-4 border-2 rounded-2xl cursor-pointer transition-all duration-200",
                  "hover:shadow-md transform hover:scale-[1.02]",
                  insuranceMode === "cash" 
                    ? "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-md" 
                    : "bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400"
                )}>
                  <span className="font-medium text-sm md:text-base">De Contado</span>
                </div>
              </label>
              <label className="relative">
                <input
                  type="radio"
                  value="financed"
                  className="sr-only peer"
                  {...register("insurance_mode")}
                />
                <div className={cn(
                  "flex items-center justify-center py-3 px-4 border-2 rounded-2xl cursor-pointer transition-all duration-200",
                  "hover:shadow-md transform hover:scale-[1.02]",
                  insuranceMode === "financed" 
                    ? "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-md" 
                    : "bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400"
                )}>
                  <span className="font-medium text-sm md:text-base">Financiado</span>
                </div>
              </label>
            </div>

            <div className="relative">
              <DollarSign className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
              <input
                type="number"
                placeholder="19,500"
                className={cn(
                  "w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 bg-white border rounded-2xl text-base md:text-lg font-medium shadow-sm",
                  "focus:ring-4 focus:ring-emerald-300/50 focus:border-emerald-400 transition-all duration-200",
                  "hover:shadow-md",
                  errors.insurance_amount ? "border-red-400 ring-2 ring-red-400/20" : "border-gray-300"
                )}
                {...register("insurance_amount")}
              />
            </div>
          </div>

          {/* Comisión */}
          <div className="space-y-4">
            <label className="flex items-center text-gray-800 font-medium text-sm md:text-base">
              <CreditCard className="w-4 h-4 md:w-5 md:h-5 mr-2 text-emerald-600" />
              Comisión de Apertura (3%)
              <Tooltip text="CONTADO: Pagas la comisión por separado ahora. FINANCIADO: Se incluye en el crédito y lo pagas en mensualidades con intereses">
                <HelpCircle className="w-4 h-4 ml-2 text-gray-500 hover:text-gray-700" />
              </Tooltip>
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <input
                  type="radio"
                  value="cash"
                  className="sr-only peer"
                  {...register("commission_mode")}
                />
                <div className={cn(
                  "flex items-center justify-center py-3 px-4 border-2 rounded-2xl cursor-pointer transition-all duration-200",
                  "hover:shadow-md transform hover:scale-[1.02]",
                  commissionMode === "cash" 
                    ? "bg-blue-50 border-blue-400 text-blue-700 shadow-md" 
                    : "bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400"
                )}>
                  <span className="font-medium text-sm md:text-base">De Contado</span>
                </div>
              </label>
              <label className="relative">
                <input
                  type="radio"
                  value="financed"
                  className="sr-only peer"
                  {...register("commission_mode")}
                />
                <div className={cn(
                  "flex items-center justify-center py-3 px-4 border-2 rounded-2xl cursor-pointer transition-all duration-200",
                  "hover:shadow-md transform hover:scale-[1.02]",
                  commissionMode === "financed" 
                    ? "bg-blue-50 border-blue-400 text-blue-700 shadow-md" 
                    : "bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400"
                )}>
                  <span className="font-medium text-sm md:text-base">Financiado</span>
                </div>
              </label>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Monto de la comisión:</span>
                <span className="font-bold text-gray-800">
                  {formatMXN(vehicleValue > 0 ? (vehicleValue - downPayment) * 0.03 / 0.97 : 0)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">IVA incluido:</span>
                <span className="text-sm font-medium text-gray-700">
                  {formatMXN(vehicleValue > 0 ? (vehicleValue - downPayment) * 0.03 / 0.97 * 1.16 : 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Checkbox de Autorización de Privacidad - Solo para clientes */}
          {isHydrated && isClient && (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  {...register("privacy_consent")}
                />
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Autorizo a Fincentiva</span> a recopilar y utilizar mi información personal de acuerdo con su{" "}
                  <a 
                    href="/politica-privacidad" 
                    target="_blank" 
                    className="text-emerald-600 hover:text-emerald-700 underline"
                  >
                    política de privacidad
                  </a>
                  . *
                </div>
              </label>
              {errors.privacy_consent && (
                <p className="text-red-600 text-sm mt-2 ml-6">{String(errors.privacy_consent.message)}</p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-4 md:py-5 px-6 md:px-8 rounded-2xl font-bold text-base md:text-lg text-white",
              "bg-gradient-to-r from-emerald-500 via-emerald-600 to-cyan-600",
              "shadow-xl hover:shadow-emerald-500/25 hover:shadow-2xl",
              "transform transition-all duration-300",
              "hover:scale-[1.02] hover:-translate-y-1",
              "active:scale-[0.98] active:translate-y-0",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
              "relative overflow-hidden"
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl"></div>
            <div className="relative flex items-center justify-center">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 h-5 md:h-6 md:w-6 border-b-2 border-white mr-3"></div>
                  Calculando tu crédito...
                </>
              ) : (
                <>
                  {hasResults ? (
                    <>
                      <Calculator className="w-5 h-5 md:w-6 md:h-6 mr-3" />
                      Recalcular Planes
                    </>
                  ) : (
                    <>
                      <Calculator className="w-5 h-5 md:w-6 md:h-6 mr-3" />
                      Ver Todos los Planes
                    </>
                  )}
                </>
              )}
            </div>
          </button>
        </form>
      </div>
    </div>
  );
}
