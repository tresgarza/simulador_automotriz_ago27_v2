"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X, User, Car, DollarSign, Building2, FileCheck, Plus, Minus,
  Calculator, TrendingUp, TrendingDown, Banknote, CreditCard, PiggyBank,
  Save, CheckCircle, AlertCircle
} from "lucide-react";
import { formatMXN, cn } from "../../lib/utils";
import { supabase } from "../../../lib/supabase";
import type { AuthorizationRequest } from "../../../lib/supabase";
import { AuthorizationService } from "../../../lib/authorization-service";

// Función mejorada para calcular el progreso de completado del formulario
export const calculateFormProgress = (data: any): { 
  percentage: number; 
  completedFields: number; 
  totalFields: number; 
  isComplete: boolean;
  sectionProgress: {
    personalData: { completed: number; total: number; percentage: number };
    financialData: { completed: number; total: number; percentage: number };
    vehicleData: { completed: number; total: number; percentage: number };
  };
  missingFields: string[];
} => {
  if (!data) {
    return { 
      percentage: 0, 
      completedFields: 0, 
      totalFields: 20, 
      isComplete: false,
      sectionProgress: {
        personalData: { completed: 0, total: 7, percentage: 0 },
        financialData: { completed: 0, total: 9, percentage: 0 },
        vehicleData: { completed: 0, total: 4, percentage: 0 }
      },
      missingFields: []
    };
  }

  const missingFields: string[] = [];
  
  // =========================================
  // SECCIÓN 1: DATOS PERSONALES (7 campos)
  // =========================================
  const personalFields = [
    { key: 'company', name: 'Empresa' },
    { key: 'applicant_name', name: 'Nombre del solicitante' },
    { key: 'position', name: 'Puesto' },
    { key: 'age', name: 'Edad' },
    { key: 'marital_status', name: 'Estado civil' },
    { key: 'seniority', name: 'Antigüedad' },
    { key: 'monthly_salary', name: 'Sueldo mensual' }
  ];
  
  let personalCompleted = 0;
  personalFields.forEach(field => {
    const value = data[field.key];
    if (value !== undefined && value !== null && value !== '' && value !== 0) {
      personalCompleted++;
    } else {
      missingFields.push(field.name);
    }
  });
  
  // =========================================
  // SECCIÓN 2: DATOS FINANCIEROS (9 campos)
  // =========================================
  
  // Verificar ingresos (al menos 6 campos de los 12 posibles)
  const incomeFields = [
    data.mes1_nomina, data.mes1_comisiones, data.mes1_negocio, data.mes1_efectivo,
    data.mes2_nomina, data.mes2_comisiones, data.mes2_negocio, data.mes2_efectivo,
    data.mes3_nomina, data.mes3_comisiones, data.mes3_negocio, data.mes3_efectivo
  ].filter(value => value !== undefined && value !== null && value !== '' && value !== 0);
  
  const hasIncomeData = incomeFields.length >= 6; // Al menos 6 campos de ingresos
  
  // Verificar gastos (al menos 4 campos de los 9 posibles)
  const expenseFields = [
    data.mes1_compromisos, data.mes1_gastos_personales, data.mes1_gastos_negocio,
    data.mes2_compromisos, data.mes2_gastos_personales, data.mes2_gastos_negocio,
    data.mes3_compromisos, data.mes3_gastos_personales, data.mes3_gastos_negocio
  ].filter(value => value !== undefined && value !== null && value !== '' && value !== 0);
  
  const hasExpenseData = expenseFields.length >= 4; // Al menos 4 campos de gastos
  
  // Verificar datos financieros básicos
  const financialBasicFields = [
    { key: 'requested_amount', name: 'Monto solicitado' },
    { key: 'term_months', name: 'Plazo en meses' },
    { key: 'interest_rate', name: 'Tasa de interés' },
    { key: 'opening_fee', name: 'Comisión de apertura' },
    { key: 'monthly_capacity', name: 'Capacidad de pago' },
    { key: 'monthly_discount', name: 'Descuento mensual' }
  ];
  
  let financialBasicCompleted = 0;
  financialBasicFields.forEach(field => {
    const value = data[field.key];
    if (value !== undefined && value !== null && value !== '' && value !== 0) {
      financialBasicCompleted++;
    } else {
      missingFields.push(field.name);
    }
  });
  
  // Calcular progreso financiero total
  let financialCompleted = financialBasicCompleted; // 6 campos básicos
  if (hasIncomeData) financialCompleted += 2; // Ingresos completos = 2 puntos extra
  if (hasExpenseData) financialCompleted += 1; // Gastos completos = 1 punto extra
  
  if (!hasIncomeData) missingFields.push('Datos de ingresos (mínimo 6 campos)');
  if (!hasExpenseData) missingFields.push('Datos de gastos (mínimo 4 campos)');
  
  // =========================================
  // SECCIÓN 3: DATOS DEL VEHÍCULO (4 campos)
  // =========================================
  const vehicleFields = [
    { key: 'dealership', name: 'Agencia' },
    { key: 'vehicle_brand', name: 'Marca del vehículo' },
    { key: 'vehicle_model', name: 'Modelo del vehículo' },
    { key: 'vehicle_year', name: 'Año del vehículo' },
    { key: 'sale_value', name: 'Valor de venta' },
    { key: 'book_value', name: 'Valor libro azul' }
  ];
  
  let vehicleCompleted = 0;
  vehicleFields.forEach(field => {
    const value = data[field.key];
    if (value !== undefined && value !== null && value !== '' && value !== 0) {
      vehicleCompleted++;
    } else {
      missingFields.push(field.name);
    }
  });
  
  // =========================================
  // CÁLCULO FINAL
  // =========================================
  const totalCompleted = personalCompleted + Math.min(financialCompleted, 9) + Math.min(vehicleCompleted, 6);
  const totalFields = 22; // 7 + 9 + 6
  const percentage = Math.round((totalCompleted / totalFields) * 100);
  const isComplete = percentage >= 85; // Más estricto: 85% para estar completo
  
  return { 
    percentage, 
    completedFields: totalCompleted, 
    totalFields, 
    isComplete,
    sectionProgress: {
      personalData: { 
        completed: personalCompleted, 
        total: 7, 
        percentage: Math.round((personalCompleted / 7) * 100) 
      },
      financialData: { 
        completed: Math.min(financialCompleted, 9), 
        total: 9, 
        percentage: Math.round((Math.min(financialCompleted, 9) / 9) * 100) 
      },
      vehicleData: { 
        completed: Math.min(vehicleCompleted, 6), 
        total: 6, 
        percentage: Math.round((Math.min(vehicleCompleted, 6) / 6) * 100) 
      }
    },
    missingFields: missingFields.slice(0, 5) // Solo mostrar los primeros 5 campos faltantes
  };
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
  
  // Calcular los 3 meses anteriores dinámicamente
  const getCurrentMonths = () => {
    const now = new Date();
    const months = [];
    const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    for (let i = 3; i >= 1; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2);
      months.push(`${monthName} ${year}`);
    }
    return months;
  };
  
  // Usar meses estáticos basados en la fecha de creación de la solicitud
  const getStaticMonths = () => {
    if ((request as any).authorization_data?.month_labels) {
      return (request as any).authorization_data.month_labels;
    }
    
    const createdAt = new Date(request.created_at || new Date());
    const months = [];
    const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    for (let i = 3; i >= 1; i--) {
      const date = new Date(createdAt.getFullYear(), createdAt.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2);
      months.push(`${monthName} ${year}`);
    }
    return months;
  };

  const monthLabels = getStaticMonths();
  
  // Estados para auto-guardado
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Referencias para auto-guardado
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveDataRef = useRef<string>('');

  // Helper function para convertir valores de Supabase a numbers
  const getNumericValue = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    return 0;
  };

  // Extraer valores numéricos correctos - Usar monthly_payment de la simulación como fallback
  const monthlyPaymentValue = getNumericValue(request.simulation?.pmt_total_month2) || 
                             getNumericValue(request.simulation?.monthly_payment) ||
                             getNumericValue(request.monthly_payment) || 0;
  const vehicleValueValue = getNumericValue(request.vehicle_value);
  const requestedAmountValue = getNumericValue(request.requested_amount);

  // Debug: Log de los datos recibidos
  console.log('🔍 AuthorizationForm received data:', {
    request_id: request.id,
    monthly_payment_raw: request.monthly_payment,
    monthly_payment_converted: monthlyPaymentValue,
    simulation_exists: !!request.simulation,
    simulation_pmt_total_month2: request.simulation?.pmt_total_month2,
    simulation_monthly_payment: request.simulation?.monthly_payment,
    authorization_data_exists: !!request.authorization_data,
    authorization_data: request.authorization_data,
    pmt_calculation_priority: {
      first: request.simulation?.pmt_total_month2,
      second: request.simulation?.monthly_payment,
      third: request.monthly_payment,
      final: monthlyPaymentValue
    }
  });

  // Alert removido - debugging completado

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isDirty }
  } = useForm({
    resolver: zodResolver(AuthorizationSchema),
    defaultValues: {
      // Cargar datos guardados si existen, sino usar valores por defecto
      // Paso 1: Datos del solicitante (usar authorization_data si existe)
      company: request.authorization_data?.company || "",
      applicant_name: request.authorization_data?.applicant_name || request.simulation?.quote?.client_name || request.client_name || "",
      position: request.authorization_data?.position || "",
      age: request.authorization_data?.age || undefined,
      marital_status: request.authorization_data?.marital_status || "soltero",
      seniority: request.authorization_data?.seniority || undefined,
      monthly_salary: request.authorization_data?.monthly_salary || undefined,
      
      // Paso 2: Datos financieros
      requested_amount: request.authorization_data?.requested_amount || requestedAmountValue || vehicleValueValue || 0,
      term_months: request.authorization_data?.term_months || request.simulation?.term_months || request.term_months || 48,
      interest_rate: request.authorization_data?.interest_rate || (request.simulation?.tier_code === 'A' ? 36 : request.simulation?.tier_code === 'B' ? 42 : 45),
      opening_fee: request.authorization_data?.opening_fee || 3.0928,
      monthly_capacity: request.authorization_data?.monthly_capacity || monthlyPaymentValue,
      monthly_discount: request.authorization_data?.monthly_discount || monthlyPaymentValue,
      comments: request.authorization_data?.comments || "",
      
      // Paso 3: Datos del vehículo (usar authorization_data si existe)
      dealership: request.authorization_data?.dealership || request.agency_name || "Agencia no especificada",
      vehicle_brand: request.authorization_data?.vehicle_brand || request.simulation?.quote?.vehicle_brand || request.vehicle_brand || "",
      vehicle_model: request.authorization_data?.vehicle_model || request.simulation?.quote?.vehicle_model || request.vehicle_model || "",
      vehicle_year: request.authorization_data?.vehicle_year || request.simulation?.quote?.vehicle_year || request.vehicle_year || new Date().getFullYear(),
      sale_value: request.authorization_data?.sale_value || vehicleValueValue || 0,
      book_value: request.authorization_data?.book_value || vehicleValueValue || 0,
      
      // Valores para ingresos (cargar desde authorization_data si existe)
      mes1_nomina: request.authorization_data?.mes1_nomina || undefined,
      mes1_comisiones: request.authorization_data?.mes1_comisiones || undefined,
      mes1_negocio: request.authorization_data?.mes1_negocio || undefined,
      mes1_efectivo: request.authorization_data?.mes1_efectivo || undefined,
      mes2_nomina: request.authorization_data?.mes2_nomina || undefined,
      mes2_comisiones: request.authorization_data?.mes2_comisiones || undefined,
      mes2_negocio: request.authorization_data?.mes2_negocio || undefined,
      mes2_efectivo: request.authorization_data?.mes2_efectivo || undefined,
      mes3_nomina: request.authorization_data?.mes3_nomina || undefined,
      mes3_comisiones: request.authorization_data?.mes3_comisiones || undefined,
      mes3_negocio: request.authorization_data?.mes3_negocio || undefined,
      mes3_efectivo: request.authorization_data?.mes3_efectivo || undefined,

      // Valores para gastos (cargar desde authorization_data si existe)
      mes1_compromisos: request.authorization_data?.mes1_compromisos || undefined,
      mes1_gastos_personales: request.authorization_data?.mes1_gastos_personales || undefined,
      mes1_gastos_negocio: request.authorization_data?.mes1_gastos_negocio || undefined,
      mes2_compromisos: request.authorization_data?.mes2_compromisos || undefined,
      mes2_gastos_personales: request.authorization_data?.mes2_gastos_personales || undefined,
      mes2_gastos_negocio: request.authorization_data?.mes2_gastos_negocio || undefined,
      mes3_compromisos: request.authorization_data?.mes3_compromisos || undefined,
      mes3_gastos_personales: request.authorization_data?.mes3_gastos_personales || undefined,
      mes3_gastos_negocio: request.authorization_data?.mes3_gastos_negocio || undefined,
      
      // Competidores (cargar desde authorization_data si existe)
      competitors: request.authorization_data?.competitors || [
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
  const watchedData = watch();
  const mes1Income = Number(watchedData.mes1_nomina || 0) + Number(watchedData.mes1_comisiones || 0) + Number(watchedData.mes1_negocio || 0) + Number(watchedData.mes1_efectivo || 0);
  const mes2Income = Number(watchedData.mes2_nomina || 0) + Number(watchedData.mes2_comisiones || 0) + Number(watchedData.mes2_negocio || 0) + Number(watchedData.mes2_efectivo || 0);
  const mes3Income = Number(watchedData.mes3_nomina || 0) + Number(watchedData.mes3_comisiones || 0) + Number(watchedData.mes3_negocio || 0) + Number(watchedData.mes3_efectivo || 0);
  const averageIncome = (mes1Income + mes2Income + mes3Income) / 3;

  // Calcular gastos por mes usando estructura simple (convertir explícitamente a números)
  const mes1Expenses = Number(watchedData.mes1_compromisos || 0) + Number(watchedData.mes1_gastos_personales || 0) + Number(watchedData.mes1_gastos_negocio || 0);
  const mes2Expenses = Number(watchedData.mes2_compromisos || 0) + Number(watchedData.mes2_gastos_personales || 0) + Number(watchedData.mes2_gastos_negocio || 0);
  const mes3Expenses = Number(watchedData.mes3_compromisos || 0) + Number(watchedData.mes3_gastos_personales || 0) + Number(watchedData.mes3_gastos_negocio || 0);
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

  // Usar los nombres de meses personalizados por el usuario
  const lastThreeMonths = monthLabels;

  // =========================================
  // FUNCIONES DE AUTO-GUARDADO
  // =========================================

  /**
   * Función para auto-guardar el formulario (versión simplificada)
   */
  const autoSaveForm = useCallback(async (data: any, showStatus: boolean = true) => {
    try {
      if (showStatus) {
        setIsAutoSaving(true);
        setSaveStatus('saving');
        setSaveError(null);
      }

      console.log('💾 Auto-guardando formulario...', { request_id: request.id });

      // Preparar datos básicos para actualización
      const authorizationUpdate = {
        id: request.id,
        client_name: data.applicant_name || '',
        vehicle_brand: data.vehicle_brand || '',
        vehicle_model: data.vehicle_model || '',
        vehicle_year: data.vehicle_year || new Date().getFullYear(),
        vehicle_value: data.sale_value || 0,
        requested_amount: data.requested_amount || 0,
        monthly_payment: monthlyPaymentValue,
        term_months: data.term_months || 48,
        agency_name: data.dealership || '',
        dealer_name: data.dealership || '',
        client_comments: data.comments || '',
        competitors_data: data.competitors || [],
        authorization_data: {
          ...data,
          month_labels: data.month_labels || monthLabels, // Usar los meses del parámetro si existen, sino los del estado
          auto_saved_at: new Date().toISOString()
        }
      };

      // Usar el API directamente
      const response = await fetch('/api/authorization-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authorizationUpdate)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al actualizar solicitud de autorización');
      }

      if (showStatus) {
        setSaveStatus('saved');
        setLastSaved(new Date());
        console.log('✅ Auto-guardado exitoso');
      }

      return true;
    } catch (error) {
      console.error('❌ Error en auto-guardado:', error);
      if (showStatus) {
        setSaveStatus('error');
        setSaveError((error as Error).message);
      }
      return false;
    } finally {
      if (showStatus) {
        setIsAutoSaving(false);
      }
    }
  }, [request.id, monthlyPaymentValue]);

  // Nota: Auto-guardado se maneja directamente en los onChange de los selectores

  /**
   * Función para manejar cambios en el formulario y programar auto-guardado
   */
  const handleFormChange = useCallback((data: any) => {
    // Convertir datos a string para comparar
    const dataString = JSON.stringify(data);
    
    // Solo auto-guardar si los datos han cambiado
    if (dataString === lastSaveDataRef.current) {
      return;
    }
    
    lastSaveDataRef.current = dataString;
    
    // Cancelar auto-guardado anterior si existe
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Programar auto-guardado después de 3 segundos de inactividad
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSaveForm(data, true);
    }, 3000);
  }, [autoSaveForm]);

  // Observar cambios en el formulario
  useEffect(() => {
    handleFormChange(watchedData);
  }, [watchedData, handleFormChange]);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Soporte para Ctrl+S
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        autoSaveForm(watchedData, true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [watchedData, autoSaveForm]);

  // =========================================
  // FUNCIÓN DE ENVÍO PRINCIPAL
  // =========================================

  const onSubmit = async (data: AuthorizationFormData) => {
    setIsSubmitting(true);
    try {
      console.log('📤 Iniciando envío de autorización:', {
        request_id: request.id,
        has_simulation: !!request.simulation,
        form_data: data,
        form_keys: Object.keys(data),
        form_values_sample: {
          company: data.company,
          applicant_name: data.applicant_name,
          monthly_salary: data.monthly_salary,
          mes1_nomina: data.mes1_nomina,
          mes1_compromisos: data.mes1_compromisos,
          competitors: data.competitors
        }
      });

      // Preparar datos para actualizar la solicitud existente
      const authorizationUpdate = {
        id: request.id, // ID para la actualización
        // Actualizar campos básicos
        client_name: data.applicant_name,
        vehicle_brand: data.vehicle_brand,
        vehicle_model: data.vehicle_model,
        vehicle_year: data.vehicle_year,
        vehicle_value: data.sale_value,
        requested_amount: data.requested_amount,
        monthly_payment: request.simulation?.monthly_payment || monthlyPaymentValue,
        term_months: data.term_months,
        agency_name: data.dealership,
        dealer_name: data.dealership,
        client_comments: data.comments,
        // Actualizar datos de competidores
        competitors_data: data.competitors || [],
        // Guardar/actualizar todos los datos del formulario como JSONB
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
          
          // Nombres de meses personalizados por el usuario
          month_labels: data.month_labels || monthLabels,
          
          // Ingresos mensuales (estructura simple)
          mes1_nomina: data.mes1_nomina,
          mes1_comisiones: data.mes1_comisiones,
          mes1_negocio: data.mes1_negocio,
          mes1_efectivo: data.mes1_efectivo,
          mes2_nomina: data.mes2_nomina,
          mes2_comisiones: data.mes2_comisiones,
          mes2_negocio: data.mes2_negocio,
          mes2_efectivo: data.mes2_efectivo,
          mes3_nomina: data.mes3_nomina,
          mes3_comisiones: data.mes3_comisiones,
          mes3_negocio: data.mes3_negocio,
          mes3_efectivo: data.mes3_efectivo,
          
          // Gastos mensuales (estructura simple)
          mes1_compromisos: data.mes1_compromisos,
          mes1_gastos_personales: data.mes1_gastos_personales,
          mes1_gastos_negocio: data.mes1_gastos_negocio,
          mes2_compromisos: data.mes2_compromisos,
          mes2_gastos_personales: data.mes2_gastos_personales,
          mes2_gastos_negocio: data.mes2_gastos_negocio,
          mes3_compromisos: data.mes3_compromisos,
          mes3_gastos_personales: data.mes3_gastos_personales,
          mes3_gastos_negocio: data.mes3_gastos_negocio,
          
          // Análisis financiero (arrays y totales)
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
          viability_ratio: viabilityRatio,
          
          // Timestamp de actualización
          updated_at: new Date().toISOString()
        }
      };

      console.log('📦 Datos preparados para actualización:', authorizationUpdate);

      // Actualizar la solicitud existente
      console.log('🔄 Actualizando solicitud existente con ID:', request.id);
      const response = await fetch('/api/authorization-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authorizationUpdate)
      });

      console.log('📡 Respuesta recibida:', response.status);

      const result = await response.json();
      console.log('📋 Contenido de respuesta:', result);

      if (!response.ok) {
        console.error('❌ Error en la respuesta:', result);
        throw new Error(result.error || 'Error al actualizar solicitud de autorización');
      }

      console.log('✅ Solicitud de autorización actualizada:', result.authorization_request);
      
      // Mostrar mensaje de éxito más elegante
      setSaveStatus('saved');
      setLastSaved(new Date());
      
      // Esperar un momento para mostrar el éxito antes de cerrar
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error("💥 Error submitting authorization:", error);
      setSaveStatus('error');
      setSaveError((error as Error).message);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col">
      <div className="bg-white w-full h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 px-8 py-6 text-white flex-shrink-0">
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
            
            {/* Indicador de Guardado */}
            <div className="flex items-center space-x-4">
              {/* Estado de guardado */}
              <div className="flex items-center space-x-2">
                {saveStatus === 'saving' && (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span className="text-sm text-emerald-100">Guardando...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-300" />
                    <span className="text-sm text-emerald-100">
                      Guardado {lastSaved && new Intl.DateTimeFormat('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }).format(lastSaved)}
                    </span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-300" />
                    <span className="text-sm text-red-200">Error al guardar</span>
                  </>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
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
          
          {/* Indicador de Progreso Detallado */}
          {(() => {
            const progress = calculateFormProgress(watchedData);
            return (
              <div className="mt-4 p-3 bg-white/10 rounded-lg border border-white/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Progreso del Formulario</span>
                  <span className="text-sm text-emerald-100">
                    {progress.percentage}% ({progress.completedFields}/{progress.totalFields})
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${progress.percentage}%` }}
                  ></div>
                </div>
                
                {/* Progreso por Sección */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-emerald-100">Personal</div>
                    <div className="text-white font-medium">{progress.sectionProgress.personalData.percentage}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-emerald-100">Financiero</div>
                    <div className="text-white font-medium">{progress.sectionProgress.financialData.percentage}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-emerald-100">Vehículo</div>
                    <div className="text-white font-medium">{progress.sectionProgress.vehicleData.percentage}%</div>
                  </div>
                </div>
                
                {/* Campos Faltantes */}
                {progress.missingFields.length > 0 && (
                  <div className="mt-2 text-xs text-red-200">
                    <div className="font-medium mb-1">Campos faltantes:</div>
                    <div className="text-red-100">
                      {progress.missingFields.slice(0, 3).join(', ')}
                      {progress.missingFields.length > 3 && ` y ${progress.missingFields.length - 3} más...`}
                    </div>
                  </div>
                )}
                
                {/* Estado de Completado */}
                {progress.isComplete && (
                  <div className="mt-2 flex items-center text-xs text-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Formulario completado - Listo para enviar
                  </div>
                )}
              </div>
            );
          })()}
          
          {/* Error de guardado */}
          {saveError && (
            <div className="mt-3 p-2 bg-red-500/20 border border-red-400/30 rounded-lg">
              <div className="flex items-center text-sm text-red-100">
                <AlertCircle className="w-4 h-4 mr-2" />
                Error: {saveError}
              </div>
            </div>
          )}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit(onSubmit as any)} className="h-full flex flex-col">
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-6xl mx-auto space-y-8">
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
                    Ingresos Mensuales Comprobables (Últimos 3 Meses)
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
                          
                          const nominaValue = Number(watchedData[nominaField] || 0);
                          const comisionesValue = Number(watchedData[comisionesField] || 0);
                          const negocioValue = Number(watchedData[negocioField] || 0);
                          const efectivoValue = Number(watchedData[efectivoField] || 0);
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
                            {formatMXN((Number(watchedData.mes1_nomina || 0) + Number(watchedData.mes2_nomina || 0) + Number(watchedData.mes3_nomina || 0)) / 3)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-blue-700">
                            {formatMXN((Number(watchedData.mes1_comisiones || 0) + Number(watchedData.mes2_comisiones || 0) + Number(watchedData.mes3_comisiones || 0)) / 3)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-purple-700">
                            {formatMXN((Number(watchedData.mes1_negocio || 0) + Number(watchedData.mes2_negocio || 0) + Number(watchedData.mes3_negocio || 0)) / 3)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-orange-700">
                            {formatMXN((Number(watchedData.mes1_efectivo || 0) + Number(watchedData.mes2_efectivo || 0) + Number(watchedData.mes3_efectivo || 0)) / 3)}
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
                          
                          const compromisosValue = Number(watchedData[compromisosField] || 0);
                          const personalValue = Number(watchedData[personalField] || 0);
                          const negocioValue = Number(watchedData[negocioField] || 0);
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
                            {formatMXN((Number(watchedData.mes1_compromisos || 0) + Number(watchedData.mes2_compromisos || 0) + Number(watchedData.mes3_compromisos || 0)) / 3)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-orange-700">
                            {formatMXN((Number(watchedData.mes1_gastos_personales || 0) + Number(watchedData.mes2_gastos_personales || 0) + Number(watchedData.mes3_gastos_personales || 0)) / 3)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-purple-700">
                            {formatMXN((Number(watchedData.mes1_gastos_negocio || 0) + Number(watchedData.mes2_gastos_negocio || 0) + Number(watchedData.mes3_gastos_negocio || 0)) / 3)}
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

            {/* Navigation Buttons - Dentro del formulario */}
            <div className="flex justify-between pt-6 border-t mt-8">
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
                  {/* Botón de guardado manual */}
                  <button
                    type="button"
                    onClick={() => autoSaveForm(watchedData, true)}
                    disabled={isAutoSaving}
                    className={cn(
                      "px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center",
                      isAutoSaving && "opacity-50 cursor-not-allowed"
                    )}
                    title="Guardar cambios ahora (Ctrl+S)"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isAutoSaving ? "Guardando..." : "Guardar"}
                  </button>
                  
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
                        "px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors flex items-center",
                        isSubmitting && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Finalizando...
                        </>
                      ) : (
                        <>
                          <FileCheck className="w-4 h-4 mr-2" />
                          Finalizar Autorización
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
      </div>
    </div>
  );
}
