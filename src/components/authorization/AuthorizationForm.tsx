"use client";
import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X, User, Car, DollarSign, Building2, FileCheck, Plus, Minus,
  Calculator, TrendingUp, TrendingDown, Banknote, CreditCard, PiggyBank
} from "lucide-react";
import { formatMXN, cn } from "../../lib/utils";
import { supabase } from "../../../lib/supabase";
import type { AuthorizationRequest } from "../../../lib/supabase";

// Función para calcular el progreso de completado del formulario
export const calculateFormProgress = (data: any): { percentage: number; completedFields: number; totalFields: number; isComplete: boolean } => {
  if (!data) {
    return { percentage: 0, completedFields: 0, totalFields: 31, isComplete: false };
  }

  const requiredFields = [
    'company', 'applicant_name', 'position', 'age', 'marital_status', 
    'seniority', 'monthly_salary', 'requested_amount', 'term_months', 
    'interest_rate', 'opening_fee', 'monthly_capacity', 'monthly_discount'
  ];
  
  // Verificar campos de ingresos (arrays anidados)
  const hasIncomeData = data.incomes && Array.isArray(data.incomes) && data.incomes.length >= 3;
  
  // Verificar campos de gastos (arrays anidados)  
  const hasExpenseData = (data.commitments && Array.isArray(data.commitments) && data.commitments.length >= 3) ||
                         (data.personal_expenses && Array.isArray(data.personal_expenses) && data.personal_expenses.length >= 3);
  
  // Verificar datos del vehículo
  const vehicleFields = ['dealership', 'vehicle_brand', 'vehicle_model', 'vehicle_year', 'sale_value', 'book_value'];
  
  // Verificar competidores
  const hasCompetitors = data.competitors && Array.isArray(data.competitors) && 
                        data.competitors.some(c => c.name && c.price);
  
  let completedFields = 0;
  const totalSections = 6; // Datos básicos, ingresos, gastos, vehículo, competidores, comentarios
  
  // Contar campos básicos completados
  let basicFieldsCompleted = 0;
  requiredFields.forEach(field => {
    const value = data[field];
    if (value !== undefined && value !== null && value !== '' && value !== 0) {
      basicFieldsCompleted++;
    }
  });
  
  // Calcular progreso por secciones
  if (basicFieldsCompleted >= 10) completedFields += 2; // Datos básicos valen 2 puntos
  if (hasIncomeData) completedFields += 2; // Ingresos valen 2 puntos
  if (hasExpenseData) completedFields += 1; // Gastos valen 1 punto
  
  // Verificar datos del vehículo
  let vehicleFieldsCompleted = 0;
  vehicleFields.forEach(field => {
    const value = data[field];
    if (value !== undefined && value !== null && value !== '' && value !== 0) {
      vehicleFieldsCompleted++;
    }
  });
  if (vehicleFieldsCompleted >= 4) completedFields += 1; // Vehículo vale 1 punto
  
  if (hasCompetitors) completedFields += 1; // Competidores valen 1 punto
  if (data.comments && data.comments.trim().length > 10) completedFields += 1; // Comentarios valen 1 punto
  
  const totalFields = 8; // Total de puntos posibles
  const percentage = Math.round((completedFields / totalFields) * 100);
  const isComplete = percentage >= 75; // Consideramos completo si tiene al menos 75% de los puntos
  
  return { percentage, completedFields, totalFields, isComplete };
};

// Schema para el formulario de autorización
const AuthorizationSchema = z.object({
  // Datos del Solicitante
  company: z.string().min(1, "La empresa es requerida"),
  applicant_name: z.string().min(1, "El nombre es requerido"),
  position: z.string().min(1, "El puesto es requerido"),
  age: z.coerce.number().min(18, "Debe ser mayor de edad").max(100, "Edad no válida"),
  marital_status: z.enum(["soltero", "casado", "divorciado", "viudo"]),
  seniority: z.coerce.number().min(0, "La antigüedad no puede ser negativa"),
  monthly_salary: z.coerce.number().min(0, "El sueldo no puede ser negativo"),
  requested_amount: z.coerce.number().min(0, "El monto solicitado no puede ser negativo"),
  term_months: z.coerce.number().min(1, "El plazo debe ser mayor a 0"),
  interest_rate: z.coerce.number().min(0, "La tasa no puede ser negativa").max(100, "La tasa no puede ser mayor al 100%"),
  opening_fee: z.coerce.number().min(0, "La comisión no puede ser negativa").max(100, "La comisión no puede ser mayor al 100%"),
  monthly_capacity: z.coerce.number().min(0, "La capacidad de pago no puede ser negativa"),
  monthly_discount: z.coerce.number().min(0, "El descuento mensual no puede ser negativo"),
  comments: z.string().optional(),

  // Ingresos por mes (estructura simple)
  mes1_nomina: z.coerce.number().min(0).optional(),
  mes1_comisiones: z.coerce.number().min(0).optional(),
  mes1_negocio: z.coerce.number().min(0).optional(),
  mes1_efectivo: z.coerce.number().min(0).optional(),
  
  mes2_nomina: z.coerce.number().min(0).optional(),
  mes2_comisiones: z.coerce.number().min(0).optional(),
  mes2_negocio: z.coerce.number().min(0).optional(),
  mes2_efectivo: z.coerce.number().min(0).optional(),
  
  mes3_nomina: z.coerce.number().min(0).optional(),
  mes3_comisiones: z.coerce.number().min(0).optional(),
  mes3_negocio: z.coerce.number().min(0).optional(),
  mes3_efectivo: z.coerce.number().min(0).optional(),

  // Gastos por mes (estructura simple)
  mes1_compromisos: z.coerce.number().min(0).optional(),
  mes1_gastos_personales: z.coerce.number().min(0).optional(),
  mes1_gastos_negocio: z.coerce.number().min(0).optional(),
  
  mes2_compromisos: z.coerce.number().min(0).optional(),
  mes2_gastos_personales: z.coerce.number().min(0).optional(),
  mes2_gastos_negocio: z.coerce.number().min(0).optional(),
  
  mes3_compromisos: z.coerce.number().min(0).optional(),
  mes3_gastos_personales: z.coerce.number().min(0).optional(),
  mes3_gastos_negocio: z.coerce.number().min(0).optional(),

  // Campos legacy para compatibilidad
  incomes: z.array(z.object({
    type: z.enum(["nomina", "comisiones", "negocio", "efectivo"]),
    period: z.string().optional(),
    amount: z.coerce.number().min(0, "El monto no puede ser negativo").optional()
  })).optional(),

  expenses: z.array(z.object({
    type: z.enum(["compromisos", "personal", "negocio"]),
    period: z.string().optional(),
    amount: z.coerce.number().min(0, "El monto no puede ser negativo").optional()
  })).optional(),

  // Campos legacy para compatibilidad
  commitments: z.coerce.number().min(0, "Los compromisos no pueden ser negativos").optional(),
  personal_expenses: z.coerce.number().min(0, "Los gastos personales no pueden ser negativos").optional(),
  business_expenses: z.coerce.number().min(0, "Los gastos de negocio no pueden ser negativos").optional(),

  // Datos del Carro
  dealership: z.string().min(1, "La agencia es requerida"),
  vehicle_brand: z.string().min(1, "La marca es requerida"),
  vehicle_model: z.string().min(1, "El modelo es requerido"),
  vehicle_year: z.coerce.number().min(2000, "El año debe ser mayor a 2000"),
  sale_value: z.coerce.number().min(0, "El valor de venta no puede ser negativo"),
  book_value: z.coerce.number().min(0, "El valor de libro azul no puede ser negativo"),
  
  // Competidores flexibles
  competitors: z.array(z.object({
    name: z.string().min(1, "El nombre del competidor es requerido"),
    price: z.coerce.number().min(0, "El precio no puede ser negativo")
  })).optional()
});

type AuthorizationFormData = z.infer<typeof AuthorizationSchema>;

interface AuthorizationFormProps {
  request: AuthorizationRequest;
  onClose: () => void;
}

const incomeTypes = {
  nomina: "Nómina",
  comisiones: "Comisiones",
  negocio: "Ingresos Negocio"
};

const maritalStatuses = {
  soltero: "Soltero",
  casado: "Casado",
  divorciado: "Divorciado",
  viudo: "Viudo"
};

export function AuthorizationForm({ request, onClose }: AuthorizationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Helper function para convertir valores de Supabase a numbers
  const getNumericValue = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  };

  // Extraer valores numéricos correctos - Usar pmt_total_month2 de la simulación
  const monthlyPaymentValue = getNumericValue(request.simulation?.pmt_total_month2) || 
                             getNumericValue(request.monthly_payment) || 0;
  const vehicleValueValue = getNumericValue(request.vehicle_value);
  const requestedAmountValue = getNumericValue(request.requested_amount);

  // Debug: Log de los datos recibidos
  console.log('🔍 AuthorizationForm received data:', {
    request_id: request.id,
    full_request: request, // LOG COMPLETO DEL REQUEST
    monthly_payment_raw: request.monthly_payment,
    monthly_payment_converted: monthlyPaymentValue,
    vehicle_value_raw: request.vehicle_value,
    vehicle_value_converted: vehicleValueValue,
    simulation_exists: !!request.simulation,
    simulation_pmt_total_month2: request.simulation?.pmt_total_month2
  });

  // Alert removido - debugging completado

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(AuthorizationSchema),
    defaultValues: {
      // Paso 1: Datos automáticos de Supabase
      applicant_name: request.simulation?.quote?.client_name || request.client_name || "",
      requested_amount: requestedAmountValue || vehicleValueValue || 0,
      term_months: request.simulation?.term_months || request.term_months || 48,
      interest_rate: request.simulation?.tier_code === 'A' ? 36 : request.simulation?.tier_code === 'B' ? 42 : 45,
      opening_fee: 3.0928, // Comisión real del sistema (3% / 0.97)
      monthly_capacity: monthlyPaymentValue, // Capacidad de pago = Pago mensual de la solicitud (convertido)
      monthly_discount: monthlyPaymentValue, // Descuento mensual = Pago mensual de la solicitud (convertido)
      
      // Paso 3: Datos del vehículo de Supabase
      dealership: request.agency_name || "Agencia no especificada",
      vehicle_brand: request.simulation?.quote?.vehicle_brand || request.vehicle_brand || "",
      vehicle_model: request.simulation?.quote?.vehicle_model || request.vehicle_model || "",
      vehicle_year: request.simulation?.quote?.vehicle_year || request.vehicle_year || new Date().getFullYear(),
      sale_value: vehicleValueValue || 0,
      book_value: vehicleValueValue || 0, // Usar mismo valor como base
      // Valores por defecto para ingresos (estructura simple)
      mes1_nomina: undefined,
      mes1_comisiones: undefined,
      mes1_negocio: undefined,
      mes1_efectivo: undefined,
      mes2_nomina: undefined,
      mes2_comisiones: undefined,
      mes2_negocio: undefined,
      mes2_efectivo: undefined,
      mes3_nomina: undefined,
      mes3_comisiones: undefined,
      mes3_negocio: undefined,
      mes3_efectivo: undefined,

      // Valores por defecto para gastos (estructura simple)
      mes1_compromisos: undefined,
      mes1_gastos_personales: undefined,
      mes1_gastos_negocio: undefined,
      mes2_compromisos: undefined,
      mes2_gastos_personales: undefined,
      mes2_gastos_negocio: undefined,
      mes3_compromisos: undefined,
      mes3_gastos_personales: undefined,
      mes3_gastos_negocio: undefined,
      commitments: 0,
      personal_expenses: 0,
      business_expenses: 0,
      // Competidores flexibles - iniciar con 3 competidores por defecto
      competitors: [
        { name: "", price: 0 },
        { name: "", price: 0 },
        { name: "", price: 0 }
      ]
    }
  });

  const { fields: incomeFields, append: appendIncome, remove: removeIncome } = useFieldArray({
    control,
    name: "incomes"
  });

  const { fields: competitorFields, append: appendCompetitor, remove: removeCompetitor } = useFieldArray({
    control,
    name: "competitors"
  });

  const watchedMonthlyCapacity = watch("monthly_capacity");
  const monthlyPayment = monthlyPaymentValue; // Usar el valor convertido

  // Calcular ingresos por mes usando estructura simple (convertir explícitamente a números)
  const mes1Income = Number(watch("mes1_nomina") || 0) + Number(watch("mes1_comisiones") || 0) + Number(watch("mes1_negocio") || 0) + Number(watch("mes1_efectivo") || 0);
  const mes2Income = Number(watch("mes2_nomina") || 0) + Number(watch("mes2_comisiones") || 0) + Number(watch("mes2_negocio") || 0) + Number(watch("mes2_efectivo") || 0);
  const mes3Income = Number(watch("mes3_nomina") || 0) + Number(watch("mes3_comisiones") || 0) + Number(watch("mes3_negocio") || 0) + Number(watch("mes3_efectivo") || 0);
  const averageIncome = (mes1Income + mes2Income + mes3Income) / 3;

  // Calcular gastos por mes usando estructura simple (convertir explícitamente a números)
  const mes1Expenses = Number(watch("mes1_compromisos") || 0) + Number(watch("mes1_gastos_personales") || 0) + Number(watch("mes1_gastos_negocio") || 0);
  const mes2Expenses = Number(watch("mes2_compromisos") || 0) + Number(watch("mes2_gastos_personales") || 0) + Number(watch("mes2_gastos_negocio") || 0);
  const mes3Expenses = Number(watch("mes3_compromisos") || 0) + Number(watch("mes3_gastos_personales") || 0) + Number(watch("mes3_gastos_negocio") || 0);
  const averageExpenses = (mes1Expenses + mes2Expenses + mes3Expenses) / 3;

  // Calcular disponible
  const availableIncome = averageIncome - averageExpenses;

  // Calcular capacidad de pago (40% de ingresos disponibles)
  const paymentCapacity = availableIncome * 0.4;

  // Cálculo de proporción (Capacidad 40% ÷ Mensualidad)
  const viabilityRatio = monthlyPayment > 0 ? paymentCapacity / monthlyPayment : 0;
  
  const getViabilityStatus = (ratio: number) => {
    if (ratio < 1) return { label: "No Viable", color: "text-red-600", bg: "bg-red-100" };
    if (ratio >= 1 && ratio < 1.2) return { label: "Riesgoso", color: "text-orange-600", bg: "bg-orange-100" };
    if (ratio >= 1.2 && ratio < 1.4) return { label: "Aceptable", color: "text-yellow-600", bg: "bg-yellow-100" };
    if (ratio >= 1.4 && ratio < 1.8) return { label: "Óptimo", color: "text-green-600", bg: "bg-green-100" };
    return { label: "Excelente", color: "text-emerald-600", bg: "bg-emerald-100" };
  };

  const viabilityStatus = getViabilityStatus(viabilityRatio);

  // Generar los últimos 3 meses (sin contar el anterior)
  const generateLastThreeMonths = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = -4; i <= -2; i++) { // -4, -3, -2 para obtener 3 meses atrás sin contar el anterior
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
      const year = date.getFullYear().toString().slice(-2);
      months.push(`${monthName} ${year}`);
    }
    return months;
  };

  const lastThreeMonths = generateLastThreeMonths();

  const onSubmit = async (data: AuthorizationFormData) => {
    setIsSubmitting(true);
    try {
      console.log('📤 Iniciando envío de autorización:', {
        request_id: request.id,
        has_simulation: !!request.simulation,
        form_data: data
      });

      // Preparar datos para la API - manejar casos donde simulation puede ser null
      const authorizationRequest = {
        simulation_id: request.simulation?.id || null,
        quote_id: request.simulation?.quote_id || null,
        priority: 'medium',
        client_name: data.applicant_name,
        client_email: request.simulation?.quote?.client_email || request.client_email,
        client_phone: request.simulation?.quote?.client_phone || request.client_phone,
        vehicle_brand: data.vehicle_brand,
        vehicle_model: data.vehicle_model,
        vehicle_year: data.vehicle_year,
        vehicle_value: data.sale_value,
        requested_amount: data.requested_amount,
        monthly_payment: request.simulation?.monthly_payment || monthlyPaymentValue,
        term_months: data.term_months,
        agency_name: data.dealership,
        dealer_name: data.dealership,
        promoter_code: request.simulation?.quote?.promoter_code || null,
        client_comments: data.comments,
        risk_level: 'medium',
        // Datos de competidores flexibles
        competitors: data.competitors || [],
        // Guardar todos los datos del formulario como JSONB
        authorization_data: {
          // Datos del solicitante
          company: data.company,
          applicant_name: data.applicant_name,
          position: data.position,
          age: data.age,
          marital_status: data.marital_status,
          seniority: data.seniority,
          monthly_salary: data.monthly_salary,
          requested_amount: data.requested_amount,
          term_months: data.term_months,
          interest_rate: data.interest_rate,
          opening_fee: data.opening_fee,
          monthly_capacity: data.monthly_capacity,
          monthly_discount: data.monthly_discount,
          comments: data.comments,
          
          // Análisis financiero
          incomes: data.incomes,
          commitments: data.commitments,
          personal_expenses: data.personal_expenses,
          business_expenses: data.business_expenses,
          
          // Datos del vehículo
          dealership: data.dealership,
          vehicle_brand: data.vehicle_brand,
          vehicle_model: data.vehicle_model,
          vehicle_year: data.vehicle_year,
          sale_value: data.sale_value,
          book_value: data.book_value,
          
          // Competidores flexibles
          competitors: data.competitors || [],
          
          // Cálculos automáticos
          total_income: mes1Income + mes2Income + mes3Income,
          average_income: averageIncome,
          total_expenses: mes1Expenses + mes2Expenses + mes3Expenses,
          average_expenses: averageExpenses,
          available_income: availableIncome,
          payment_capacity: paymentCapacity,
          viability_ratio: viabilityRatio
        }
      };

      console.log('📦 Datos preparados para envío:', authorizationRequest);

      // Enviar a la API
      console.log('🚀 Enviando a /api/authorization-requests...');
      const response = await fetch('/api/authorization-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authorizationRequest)
      });

      console.log('📡 Respuesta recibida:', response.status);

      const result = await response.json();
      console.log('📋 Contenido de respuesta:', result);

      if (!response.ok) {
        console.error('❌ Error en la respuesta:', result);
        throw new Error(result.error || 'Error al crear solicitud de autorización');
      }

      console.log('✅ Solicitud de autorización creada:', result.authorization_request);
      alert('✅ Autorización enviada exitosamente! ID: ' + result.authorization_request?.id);
      
      // Cerrar el modal
      onClose();
    } catch (error) {
      console.error("💥 Error submitting authorization:", error);
      alert('❌ Error al enviar la autorización: ' + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <FileCheck className="w-6 h-6 mr-3" />
                Formulario de Autorización
              </h2>
              <p className="text-emerald-100 mt-1">
                Solicitud de {request.simulation?.quote?.client_name || 'Cliente Anónimo'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center mt-6 space-x-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full flex-1 transition-colors",
                  i + 1 <= step ? "bg-white" : "bg-white/30"
                )}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-emerald-100">
            <span>Paso {step} de {totalSteps}</span>
            <span>
              {step === 1 && "Datos del Solicitante"}
              {step === 2 && "Análisis Financiero"}
              {step === 3 && "Datos del Vehículo"}
            </span>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-8">
            {/* Step 1: Datos del Solicitante */}
            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2 text-emerald-600" />
                  Datos del Solicitante
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="MADIMA"
                      {...register("company")}
                    />
                    {errors.company && (
                      <p className="text-red-600 text-sm mt-1">{errors.company.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-green-50"
                      placeholder="Cargado automáticamente de Supabase"
                      {...register("applicant_name")}
                    />
                    {errors.applicant_name && (
                      <p className="text-red-600 text-sm mt-1">{errors.applicant_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Puesto *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Gerente"
                      {...register("position")}
                    />
                    {errors.position && (
                      <p className="text-red-600 text-sm mt-1">{errors.position.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Edad *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="43"
                      {...register("age")}
                    />
                    {errors.age && (
                      <p className="text-red-600 text-sm mt-1">{errors.age.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado Civil *
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      {...register("marital_status")}
                    >
                      {Object.entries(maritalStatuses).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    {errors.marital_status && (
                      <p className="text-red-600 text-sm mt-1">{errors.marital_status.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Antigüedad (Años) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="3"
                      {...register("seniority")}
                    />
                    {errors.seniority && (
                      <p className="text-red-600 text-sm mt-1">{errors.seniority.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sueldo Mensual (Neto) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="53208.26"
                      {...register("monthly_salary")}
                    />
                    {errors.monthly_salary && (
                      <p className="text-red-600 text-sm mt-1">{errors.monthly_salary.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monto Solicitado *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-green-50"
                      placeholder="Monto automático de Supabase"
                      {...register("requested_amount")}
                    />
                    {errors.requested_amount && (
                      <p className="text-red-600 text-sm mt-1">{errors.requested_amount.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plazo (Meses) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-green-50"
                      placeholder="Plazo de Supabase"
                      {...register("term_months")}
                    />
                    {errors.term_months && (
                      <p className="text-red-600 text-sm mt-1">{errors.term_months.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tasa Anual (%) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-green-50"
                      placeholder="Tasa automática según tier"
                      {...register("interest_rate")}
                    />
                    {errors.interest_rate && (
                      <p className="text-red-600 text-sm mt-1">{errors.interest_rate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Comisión de Apertura (%) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-green-50"
                      placeholder="Comisión del sistema"
                      {...register("opening_fee")}
                    />
                    {errors.opening_fee && (
                      <p className="text-red-600 text-sm mt-1">{errors.opening_fee.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pago Mensual Total *
                      <span className="text-xs text-emerald-600 block">
                        (Calculado automáticamente desde el simulador)
                      </span>
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50"
                      placeholder="Pago mensual del simulador"
                      {...register("monthly_discount")}
                      value={monthlyPaymentValue}
                      readOnly
                      onFocus={() => console.log('📝 Input focused, current value:', monthlyPaymentValue)}
                    />
                    <p className="text-xs text-emerald-600 mt-1">
                      Este valor viene directamente del simulador e incluye: capital + interés + IVA + GPS + seguros
                    </p>
                    {errors.monthly_discount && (
                      <p className="text-red-600 text-sm mt-1">{errors.monthly_discount.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comentarios
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Comentarios adicionales sobre el solicitante..."
                    {...register("comments")}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Análisis Financiero */}
            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Calculator className="w-5 h-5 mr-2 text-emerald-600" />
                  Análisis Financiero
                </h3>

                {/* Ingresos Mensuales Comprobables */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Ingresos Mensuales Comprobables
                  </h4>

                  <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-blue-100">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-blue-800">Mes</th>
                          <th className="text-right py-3 px-4 font-semibold text-green-700">Nómina</th>
                          <th className="text-right py-3 px-4 font-semibold text-blue-700">Comisiones</th>
                          <th className="text-right py-3 px-4 font-semibold text-purple-700">Negocio</th>
                          <th className="text-right py-3 px-4 font-semibold text-orange-700">Efectivo</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-900">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastThreeMonths.map((month, index) => {
                          // Usar campos directos para cada mes
                          const mesNum = index + 1;
                          const nominaField = `mes${mesNum}_nomina` as const;
                          const comisionesField = `mes${mesNum}_comisiones` as const;
                          const negocioField = `mes${mesNum}_negocio` as const;
                          const efectivoField = `mes${mesNum}_efectivo` as const;
                          
                          const nominaValue = Number(watch(nominaField) || 0);
                          const comisionesValue = Number(watch(comisionesField) || 0);
                          const negocioValue = Number(watch(negocioField) || 0);
                          const efectivoValue = Number(watch(efectivoField) || 0);
                          const total = nominaValue + comisionesValue + negocioValue + efectivoValue;

                          return (
                            <tr key={month} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="py-3 px-4 font-medium text-gray-900">{month}</td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  placeholder=""
                                  className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                  {...register(nominaField)}
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  placeholder=""
                                  className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                  {...register(comisionesField)}
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  placeholder=""
                                  className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                  {...register(negocioField)}
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  placeholder=""
                                  className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                  {...register(efectivoField)}
                                />
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-gray-900">
                                {formatMXN(total)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-blue-100 border-t-2">
                        <tr>
                          <td className="py-3 px-4 font-bold text-blue-800">PROMEDIO</td>
                          <td className="py-3 px-4 text-right font-bold text-green-700">
                            {formatMXN((Number(watch('mes1_nomina') || 0) + Number(watch('mes2_nomina') || 0) + Number(watch('mes3_nomina') || 0)) / 3)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-blue-700">
                            {formatMXN((Number(watch('mes1_comisiones') || 0) + Number(watch('mes2_comisiones') || 0) + Number(watch('mes3_comisiones') || 0)) / 3)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-purple-700">
                            {formatMXN((Number(watch('mes1_negocio') || 0) + Number(watch('mes2_negocio') || 0) + Number(watch('mes3_negocio') || 0)) / 3)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-orange-700">
                            {formatMXN((Number(watch('mes1_efectivo') || 0) + Number(watch('mes2_efectivo') || 0) + Number(watch('mes3_efectivo') || 0)) / 3)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-blue-800 text-lg">
                            {formatMXN(averageIncome)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 p-4 bg-blue-100 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-blue-700 font-medium">Total Ingresos (3 meses)</p>
                      <p className="text-xl font-bold text-blue-800">{formatMXN(mes1Income + mes2Income + mes3Income)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-700 font-medium">Meses</p>
                      <p className="text-xl font-bold text-blue-800">3</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-700 font-medium">Promedio</p>
                      <p className="text-xl font-bold text-blue-800">{formatMXN(averageIncome)}</p>
                    </div>
                  </div>
                </div>

                {/* Gastos Mensuales Comprobables */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
                    <TrendingDown className="w-5 h-5 mr-2" />
                    Gastos Mensuales Comprobables
                  </h4>

                  <div className="bg-white rounded-lg border overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-red-100">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-red-800">Mes</th>
                          <th className="text-right py-3 px-4 font-semibold text-red-700">Compromisos Buró</th>
                          <th className="text-right py-3 px-4 font-semibold text-orange-700">Gastos Personales</th>
                          <th className="text-right py-3 px-4 font-semibold text-purple-700">Gastos Negocio</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-900">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastThreeMonths.map((month, index) => {
                          // Usar campos directos para cada mes
                          const mesNum = index + 1;
                          const compromisosField = `mes${mesNum}_compromisos` as const;
                          const personalField = `mes${mesNum}_gastos_personales` as const;
                          const negocioField = `mes${mesNum}_gastos_negocio` as const;
                          
                          const compromisosValue = Number(watch(compromisosField) || 0);
                          const personalValue = Number(watch(personalField) || 0);
                          const negocioValue = Number(watch(negocioField) || 0);
                          const total = compromisosValue + personalValue + negocioValue;

                          return (
                            <tr key={month} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                              <td className="py-3 px-4 font-medium text-gray-900">{month}</td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  placeholder=""
                                  className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500"
                                  {...register(compromisosField)}
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  placeholder=""
                                  className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                  {...register(personalField)}
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  placeholder=""
                                  className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                  {...register(negocioField)}
                                />
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-gray-900">
                                {formatMXN(total)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-red-100 border-t-2">
                        <tr>
                          <td className="py-3 px-4 font-bold text-red-800">PROMEDIO</td>
                          <td className="py-3 px-4 text-right font-bold text-red-700">
                            {formatMXN((Number(watch('mes1_compromisos') || 0) + Number(watch('mes2_compromisos') || 0) + Number(watch('mes3_compromisos') || 0)) / 3)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-orange-700">
                            {formatMXN((Number(watch('mes1_gastos_personales') || 0) + Number(watch('mes2_gastos_personales') || 0) + Number(watch('mes3_gastos_personales') || 0)) / 3)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-purple-700">
                            {formatMXN((Number(watch('mes1_gastos_negocio') || 0) + Number(watch('mes2_gastos_negocio') || 0) + Number(watch('mes3_gastos_negocio') || 0)) / 3)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-red-800 text-lg">
                            {formatMXN(averageExpenses)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Resumen Financiero */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumen Financiero</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Total Ingresos (Promedio):</span>
                        <span className="font-semibold text-green-600">{formatMXN(averageIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Total Egresos (Promedio):</span>
                        <span className="font-semibold text-red-600">{formatMXN(averageExpenses)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-700 font-medium">Disponible:</span>
                        <span className="font-bold text-blue-600">{formatMXN(availableIncome)}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Capacidad de Pago (40%):</span>
                        <span className="font-semibold text-green-600">{formatMXN(paymentCapacity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Pago Mensual Total:</span>
                        <span className="font-semibold text-blue-600">{formatMXN(monthlyPayment)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-700 font-medium">Proporción:</span>
                        <span className={cn(
                          "font-bold text-lg",
                          viabilityRatio < 1 ? "text-red-600" : 
                          viabilityRatio < 1.2 ? "text-orange-600" :
                          viabilityRatio < 1.4 ? "text-yellow-600" :
                          viabilityRatio < 1.8 ? "text-green-600" : "text-emerald-600"
                        )}>
                          {viabilityRatio.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Métrica de Viabilidad */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Viabilidad</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Ratio de Viabilidad</div>
                      <div className="text-3xl font-bold text-gray-900">{viabilityRatio.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">Disponible / Capacidad</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Estado</div>
                      <div className={`inline-flex px-4 py-2 rounded-full text-sm font-semibold ${viabilityStatus.bg} ${viabilityStatus.color}`}>
                        {viabilityStatus.label}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Excedente</div>
                      <div className={`text-2xl font-bold ${availableIncome - (watchedMonthlyCapacity || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatMXN(availableIncome - (watchedMonthlyCapacity || 0))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Escala de Viabilidad */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Escala de Evaluación:</h5>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                      <div className="text-center">
                        <div className="bg-red-100 text-red-600 px-2 py-1 rounded">&lt; 1.0</div>
                        <div className="text-gray-600 mt-1">No Viable</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-orange-100 text-orange-600 px-2 py-1 rounded">1.0-1.2</div>
                        <div className="text-gray-600 mt-1">Riesgoso</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded">1.2-1.4</div>
                        <div className="text-gray-600 mt-1">Aceptable</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-green-100 text-green-600 px-2 py-1 rounded">1.4-1.8</div>
                        <div className="text-gray-600 mt-1">Óptimo</div>
                      </div>
                      <div className="text-center">
                        <div className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded">&gt; 1.8</div>
                        <div className="text-gray-600 mt-1">Excelente</div>
                      </div>
                    </div>
                  </div>
                </div>


              </div>
            )}

            {/* Step 3: Datos del Carro */}
            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Car className="w-5 h-5 mr-2 text-emerald-600" />
                  Datos del Vehículo
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Agencia *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Grupo Rio Automotriz"
                      {...register("dealership")}
                    />
                    {errors.dealership && (
                      <p className="text-red-600 text-sm mt-1">{errors.dealership.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marca *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="BMW"
                      {...register("vehicle_brand")}
                    />
                    {errors.vehicle_brand && (
                      <p className="text-red-600 text-sm mt-1">{errors.vehicle_brand.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Modelo *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="X1 2.0 S DRIVE"
                      {...register("vehicle_model")}
                    />
                    {errors.vehicle_model && (
                      <p className="text-red-600 text-sm mt-1">{errors.vehicle_model.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Año *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="2022"
                      {...register("vehicle_year")}
                    />
                    {errors.vehicle_year && (
                      <p className="text-red-600 text-sm mt-1">{errors.vehicle_year.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor del Auto (Venta) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="495000"
                      {...register("sale_value")}
                    />
                    {errors.sale_value && (
                      <p className="text-red-600 text-sm mt-1">{errors.sale_value.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor del Auto (Libro Azul) *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="547400"
                      {...register("book_value")}
                    />
                    {errors.book_value && (
                      <p className="text-red-600 text-sm mt-1">{errors.book_value.message}</p>
                    )}
                  </div>
                </div>

                {/* Precios de Competidores */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <TrendingDown className="w-5 h-5 mr-2 text-blue-600" />
                    Precios de Competidores
                  </h4>
                  <p className="text-sm text-gray-600 mb-6">
                    Ingresa los precios de vehículos similares en diferentes plataformas para comparación
                  </p>
                  
                  <div className="space-y-4">
                    {competitorFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre del Competidor *
                          </label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: MercadoLibre, Autocosmos, Seminuevos..."
                            {...register(`competitors.${index}.name`)}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Precio *
                          </label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: 489,000"
                            {...register(`competitors.${index}.price`)}
                          />
                        </div>

                        <div className="flex items-end space-x-2">
                          {competitorFields.length > 3 && (
                            <button
                              type="button"
                              onClick={() => removeCompetitor(index)}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                              title="Eliminar competidor"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          )}
                          {index === competitorFields.length - 1 && (
                            <button
                              type="button"
                              onClick={() => appendCompetitor({ name: "", price: 0 })}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                              title="Agregar competidor"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className={cn(
                  "px-6 py-3 rounded-xl font-medium transition-colors",
                  step === 1
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gray-600 text-white hover:bg-gray-700"
                )}
              >
                Anterior
              </button>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>

                {step < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn(
                      "px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors",
                      isSubmitting && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? "Guardando..." : "Guardar Autorización"}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
