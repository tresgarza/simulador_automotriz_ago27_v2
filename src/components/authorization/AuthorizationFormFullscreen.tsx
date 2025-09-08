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
import type { AuthorizationRequest } from "../../../lib/supabase";

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
      totalFields: 18, 
      isComplete: false,
      sectionProgress: {
        personalData: { completed: 0, total: 7, percentage: 0 },
        financialData: { completed: 0, total: 6, percentage: 0 },
        vehicleData: { completed: 0, total: 5, percentage: 0 }
      },
      missingFields: []
    };
  }

  const missingFields: string[] = [];
  
  // Datos personales
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
  
  // Datos financieros básicos (solo los esenciales)
  const financialBasicFields = [
    { key: 'requested_amount', name: 'Monto solicitado' },
    { key: 'term_months', name: 'Plazo en meses' },
    { key: 'interest_rate', name: 'Tasa de interés' },
    { key: 'opening_fee', name: 'Comisión de apertura' }
    // monthly_capacity y monthly_discount son calculados automáticamente
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
  
  // Verificar ingresos
  const incomeFields = [
    data.mes1_nomina, data.mes1_comisiones, data.mes1_negocio, data.mes1_efectivo,
    data.mes2_nomina, data.mes2_comisiones, data.mes2_negocio, data.mes2_efectivo,
    data.mes3_nomina, data.mes3_comisiones, data.mes3_negocio, data.mes3_efectivo
  ].filter(value => value !== undefined && value !== null && value !== '' && value !== 0);
  
  const hasIncomeData = incomeFields.length >= 3; // Reducido a 3 campos mínimo
  let financialCompleted = financialBasicCompleted;
  if (hasIncomeData) financialCompleted += 2;
  if (!hasIncomeData) missingFields.push('Datos de ingresos (mínimo 3 campos)');
  
  // Datos del vehículo (solo campos esenciales)
  const vehicleFields = [
    { key: 'dealership', name: 'Agencia' },
    { key: 'vehicle_brand', name: 'Marca del vehículo' },
    { key: 'vehicle_model', name: 'Modelo del vehículo' },
    { key: 'vehicle_year', name: 'Año del vehículo' },
    { key: 'sale_value', name: 'Valor de venta' }
    // book_value es opcional
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
  
  const totalCompleted = personalCompleted + Math.min(financialCompleted, 6) + Math.min(vehicleCompleted, 5);
  const totalFields = 18; // 7 + 6 + 5
  const percentage = Math.round((totalCompleted / totalFields) * 100);
  const isComplete = percentage >= 85; // Volver a 85% pero con menos campos requeridos
  
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
        completed: Math.min(financialCompleted, 6), 
        total: 6, 
        percentage: Math.round((Math.min(financialCompleted, 6) / 6) * 100) 
      },
      vehicleData: { 
        completed: Math.min(vehicleCompleted, 5), 
        total: 5, 
        percentage: Math.round((Math.min(vehicleCompleted, 5) / 5) * 100) 
      }
    },
    missingFields: missingFields.slice(0, 5)
  };
};

// Schema completo con todos los campos
const AuthorizationSchema = z.object({
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
  
  // Ingresos por mes
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

  // Gastos por mes
  mes1_compromisos: z.coerce.number().min(0).optional(),
  mes1_gastos_personales: z.coerce.number().min(0).optional(),
  mes1_gastos_negocio: z.coerce.number().min(0).optional(),
  mes2_compromisos: z.coerce.number().min(0).optional(),
  mes2_gastos_personales: z.coerce.number().min(0).optional(),
  mes2_gastos_negocio: z.coerce.number().min(0).optional(),
  mes3_compromisos: z.coerce.number().min(0).optional(),
  mes3_gastos_personales: z.coerce.number().min(0).optional(),
  mes3_gastos_negocio: z.coerce.number().min(0).optional(),
  
  // Datos del vehículo
  dealership: z.string().min(1, "La agencia es requerida"),
  vehicle_brand: z.string().min(1, "La marca es requerida"),
  vehicle_model: z.string().min(1, "El modelo es requerido"),
  vehicle_year: z.coerce.number().min(2000, "El año debe ser mayor a 2000"),
  sale_value: z.coerce.number().min(0, "El valor de venta no puede ser negativo"),
  book_value: z.coerce.number().min(0, "El valor de libro azul no puede ser negativo"),
  
  // Competidores
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
  
  // SOLUCIÓN HÍBRIDA: Editable en frontend, estable en backend
  const getInitialMonths = () => {
    // Cargar meses guardados o usar valores por defecto
    if ((request as any).authorization_data?.month_labels) {
      return (request as any).authorization_data.month_labels;
    }
    
    // Valores por defecto basados en fecha de creación
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

  // Estado editable para el frontend
  const [monthLabels, setMonthLabels] = useState(getInitialMonths());
  
  // Generar opciones para selectores
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    
    for (let i = 23; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2);
      options.push(`${monthName} ${year}`);
    }
    return options;
  };

  const monthOptions = generateMonthOptions();
  
  console.log('📅 Meses inicializados:', {
    request_id: request.id,
    initial_months: monthLabels,
    from_saved: (request as any).authorization_data?.month_labels
  });

  // Los meses son editables y se guardan al finalizar
  
  // Estados para auto-guardado
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  
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
                             getNumericValue((request as any).monthly_payment) || 0;

  // Debug: Log de los datos recibidos
  console.log('🔍 AuthorizationFormFullscreen received data:', {
    request_id: request.id,
    monthly_payment_raw: (request as any).monthly_payment,
    monthly_payment_converted: monthlyPaymentValue,
    simulation_exists: !!request.simulation,
    simulation_pmt_total_month2: request.simulation?.pmt_total_month2,
    simulation_monthly_payment: request.simulation?.monthly_payment,
    pmt_calculation_priority: {
      first: request.simulation?.pmt_total_month2,
      second: request.simulation?.monthly_payment,
      third: (request as any).monthly_payment,
      final: monthlyPaymentValue
    }
  });

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
      company: (request as any).authorization_data?.company || "",
      applicant_name: (request as any).authorization_data?.applicant_name || request.simulation?.quote?.client_name || (request as any).client_name || "",
      position: (request as any).authorization_data?.position || "",
      age: (request as any).authorization_data?.age || undefined,
      marital_status: (request as any).authorization_data?.marital_status || "soltero",
      seniority: (request as any).authorization_data?.seniority || undefined,
      monthly_salary: (request as any).authorization_data?.monthly_salary || undefined,
      requested_amount: (request as any).authorization_data?.requested_amount || (request as any).requested_amount || 0,
      term_months: (request as any).authorization_data?.term_months || request.simulation?.term_months || (request as any).term_months || 48,
      interest_rate: (request as any).authorization_data?.interest_rate || 45,
      opening_fee: (request as any).authorization_data?.opening_fee || 3.0928,
      monthly_capacity: (request as any).authorization_data?.monthly_capacity || monthlyPaymentValue,
      monthly_discount: (request as any).authorization_data?.monthly_discount || monthlyPaymentValue,
      comments: (request as any).authorization_data?.comments || "",
      
      // Ingresos por mes
      mes1_nomina: (request as any).authorization_data?.mes1_nomina || undefined,
      mes1_comisiones: (request as any).authorization_data?.mes1_comisiones || undefined,
      mes1_negocio: (request as any).authorization_data?.mes1_negocio || undefined,
      mes1_efectivo: (request as any).authorization_data?.mes1_efectivo || undefined,
      mes2_nomina: (request as any).authorization_data?.mes2_nomina || undefined,
      mes2_comisiones: (request as any).authorization_data?.mes2_comisiones || undefined,
      mes2_negocio: (request as any).authorization_data?.mes2_negocio || undefined,
      mes2_efectivo: (request as any).authorization_data?.mes2_efectivo || undefined,
      mes3_nomina: (request as any).authorization_data?.mes3_nomina || undefined,
      mes3_comisiones: (request as any).authorization_data?.mes3_comisiones || undefined,
      mes3_negocio: (request as any).authorization_data?.mes3_negocio || undefined,
      mes3_efectivo: (request as any).authorization_data?.mes3_efectivo || undefined,

      // Gastos por mes
      mes1_compromisos: (request as any).authorization_data?.mes1_compromisos || undefined,
      mes1_gastos_personales: (request as any).authorization_data?.mes1_gastos_personales || undefined,
      mes1_gastos_negocio: (request as any).authorization_data?.mes1_gastos_negocio || undefined,
      mes2_compromisos: (request as any).authorization_data?.mes2_compromisos || undefined,
      mes2_gastos_personales: (request as any).authorization_data?.mes2_gastos_personales || undefined,
      mes2_gastos_negocio: (request as any).authorization_data?.mes2_gastos_negocio || undefined,
      mes3_compromisos: (request as any).authorization_data?.mes3_compromisos || undefined,
      mes3_gastos_personales: (request as any).authorization_data?.mes3_gastos_personales || undefined,
      mes3_gastos_negocio: (request as any).authorization_data?.mes3_gastos_negocio || undefined,
      
      dealership: (request as any).authorization_data?.dealership || (request as any).agency_name || "Agencia no especificada",
      vehicle_brand: (request as any).authorization_data?.vehicle_brand || request.simulation?.quote?.vehicle_brand || (request as any).vehicle_brand || "",
      vehicle_model: (request as any).authorization_data?.vehicle_model || request.simulation?.quote?.vehicle_model || (request as any).vehicle_model || "",
      vehicle_year: (request as any).authorization_data?.vehicle_year || request.simulation?.quote?.vehicle_year || (request as any).vehicle_year || new Date().getFullYear(),
      sale_value: (request as any).authorization_data?.sale_value || (request as any).vehicle_value || 0,
      book_value: (request as any).authorization_data?.book_value || (request as any).vehicle_value || 0,
      competitors: (request as any).authorization_data?.competitors || [
        { name: "", price: 0 },
        { name: "", price: 0 },
        { name: "", price: 0 }
      ]
    }
  });

  const { fields: competitorFields, append: appendCompetitor, remove: removeCompetitor } = useFieldArray({
    control,
    name: "competitors"
  });

  const watchedData = watch();

  // Auto-guardado simplificado
  const autoSaveForm = useCallback(async (data: any, showStatus: boolean = true) => {
    try {
      if (showStatus) {
        setIsAutoSaving(true);
        setSaveStatus('saving');
        setSaveError(null);
      }

      // Si la solicitud está en partners_committee y el asesor la edita, regresarla a in_review
      let statusUpdate = {};
      if (request.status === 'partners_committee') {
        statusUpdate = {
          status: 'in_review',
          internal_notes: `${request.internal_notes || ''}\n\n⚠️ SOLICITUD EDITADA POR ASESOR - Regresada a revisión desde Comité de Socios el ${new Date().toLocaleString()}`,
          partners_committee_reviewed_by: null,
          partners_committee_reviewed_at: null
        };
      }

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
          month_labels: monthLabels, // Guardar los meses estáticos calculados
          auto_saved_at: new Date().toISOString()
        },
        ...statusUpdate // Aplicar cambio de estado si es necesario
      };

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
      }

      return true;
    } catch (error) {
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
  }, [request.id]);

  // Función de cierre simplificada
  const handleClose = () => {
    onClose();
  };
  
  // Nota: Auto-guardado se maneja directamente en los onChange de los selectores

  // Auto-guardado deshabilitado - solo guardado manual

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Sin auto-guardado - solo guardado manual

  const onSubmit = async (data: AuthorizationFormData) => {
    setIsSubmitting(true);
    try {
      const success = await autoSaveForm(data, false);
      if (success) {
        setSaveStatus('saved');
        setLastSaved(new Date());
        
        // Autorización completada exitosamente
        
        // Mostrar mensaje de éxito y cerrar después de un breve delay
        console.log('✅ Autorización finalizada exitosamente');
        alert('✅ Autorización finalizada y guardada exitosamente');
        
        setTimeout(() => {
          handleClose();
        }, 500);
      }
    } catch (error) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div className="bg-white w-full h-full flex flex-col">
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
                onClick={handleClose}
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
                
                {progress.isComplete && (
                  <div className="mt-2 flex items-center text-xs text-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Formulario completado - Listo para enviar
                  </div>
                )}
              </div>
            );
          })()}
          
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
          <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
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
                          placeholder="Cargado automáticamente"
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
                          <option value="soltero">Soltero</option>
                          <option value="casado">Casado</option>
                          <option value="divorciado">Divorciado</option>
                          <option value="viudo">Viudo</option>
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
                          placeholder="Monto automático"
                          {...register("requested_amount")}
                        />
                        {errors.requested_amount && (
                          <p className="text-red-600 text-sm mt-1">{errors.requested_amount.message}</p>
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

                {/* Step 2: Análisis Financiero COMPLETO */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <Calculator className="w-5 h-5 mr-2 text-emerald-600" />
                      Análisis Financiero
                    </h3>

                    {/* Información Financiera Básica */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Información Básica del Crédito</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Plazo (Meses) *
                          </label>
                          <input
                            type="number"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-green-50"
                            placeholder="48"
                            {...register("term_months")}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tasa Anual (%) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-green-50"
                            placeholder="45.00"
                            {...register("interest_rate")}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comisión de Apertura (%) *
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-green-50"
                            placeholder="3.0928"
                            {...register("opening_fee")}
                          />
                        </div>
                        
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
                            value={monthlyPaymentValue}
                            readOnly
                            onFocus={() => console.log('📝 Input focused, current value:', monthlyPaymentValue)}
                          />
                          <p className="text-xs text-emerald-600 mt-1">
                            Este valor viene directamente del simulador e incluye: capital + interés + IVA + GPS + seguros
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ingresos Mensuales Comprobables */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-blue-800 flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2" />
                          Ingresos Mensuales Comprobables (Últimos 3 Meses)
                        </h4>
                      </div>

                      <div className="bg-white rounded-lg border overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-blue-100">
                            <tr>
                              <th className="text-left py-3 px-4 font-semibold text-blue-800">Mes</th>
                              <th className="text-right py-3 px-4 font-semibold text-green-700">Nómina</th>
                              <th className="text-right py-3 px-4 font-semibold text-blue-700">Comisiones</th>
                              <th className="text-right py-3 px-4 font-semibold text-purple-700">Negocio</th>
                              <th className="text-right py-3 px-4 font-semibold text-orange-700">Otros</th>
                              <th className="text-right py-3 px-4 font-semibold text-gray-900">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monthLabels.map((month, index) => {
                              const mesNum = index + 1;
                              const nominaValue = Number(watchedData[`mes${mesNum}_nomina`] || 0);
                              const comisionesValue = Number(watchedData[`mes${mesNum}_comisiones`] || 0);
                              const negocioValue = Number(watchedData[`mes${mesNum}_negocio`] || 0);
                              const otrosValue = Number(watchedData[`mes${mesNum}_efectivo`] || 0);
                              const total = nominaValue + comisionesValue + negocioValue + otrosValue;

                              return (
                                <tr key={month} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                  <td className="py-3 px-4">
                                    <select
                                      value={month}
                                      onChange={(e) => {
                                        const newMonths = [...monthLabels];
                                        newMonths[index] = e.target.value;
                                        setMonthLabels(newMonths);
                                        console.log('📅 Mes cambiado (ingresos):', { index, from: month, to: e.target.value });
                                      }}
                                      className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500"
                                    >
                                      {monthOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="number"
                                      placeholder="50,000"
                                      className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                      {...register(`mes${mesNum}_nomina` as any)}
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="number"
                                      placeholder="10,000"
                                      className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                      {...register(`mes${mesNum}_comisiones` as any)}
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="number"
                                      placeholder="5,000"
                                      className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                      {...register(`mes${mesNum}_negocio` as any)}
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="number"
                                      placeholder="2,000"
                                      className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                      {...register(`mes${mesNum}_efectivo` as any)}
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
                                {formatMXN(((Number(watchedData.mes1_nomina || 0) + Number(watchedData.mes1_comisiones || 0) + Number(watchedData.mes1_negocio || 0) + Number(watchedData.mes1_efectivo || 0)) + 
                                           (Number(watchedData.mes2_nomina || 0) + Number(watchedData.mes2_comisiones || 0) + Number(watchedData.mes2_negocio || 0) + Number(watchedData.mes2_efectivo || 0)) + 
                                           (Number(watchedData.mes3_nomina || 0) + Number(watchedData.mes3_comisiones || 0) + Number(watchedData.mes3_negocio || 0) + Number(watchedData.mes3_efectivo || 0))) / 3)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Gastos Mensuales Comprobables */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-semibold text-red-800 flex items-center">
                          <TrendingDown className="w-5 h-5 mr-2" />
                          Gastos Mensuales Comprobables
                        </h4>
                      </div>

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
                            {monthLabels.map((month, index) => {
                              const mesNum = index + 1;
                              const compromisosValue = Number(watchedData[`mes${mesNum}_compromisos`] || 0);
                              const personalValue = Number(watchedData[`mes${mesNum}_gastos_personales`] || 0);
                              const negocioValue = Number(watchedData[`mes${mesNum}_gastos_negocio`] || 0);
                              const total = compromisosValue + personalValue + negocioValue;

                              return (
                                <tr key={month} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                  <td className="py-3 px-4">
                                    <select
                                      value={month}
                                      onChange={(e) => {
                                        const newMonths = [...monthLabels];
                                        newMonths[index] = e.target.value;
                                        setMonthLabels(newMonths);
                                        console.log('📅 Mes cambiado (gastos):', { index, from: month, to: e.target.value });
                                      }}
                                      className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-red-500"
                                    >
                                      {monthOptions.map(option => (
                                        <option key={option} value={option}>{option}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="number"
                                      placeholder="8,000"
                                      className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-red-500 focus:border-red-500"
                                      {...register(`mes${mesNum}_compromisos` as any)}
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="number"
                                      placeholder="15,000"
                                      className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                                      {...register(`mes${mesNum}_gastos_personales` as any)}
                                    />
                                  </td>
                                  <td className="py-3 px-4">
                                    <input
                                      type="number"
                                      placeholder="5,000"
                                      className="w-full text-right px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                      {...register(`mes${mesNum}_gastos_negocio` as any)}
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
                                {formatMXN(((Number(watchedData.mes1_compromisos || 0) + Number(watchedData.mes1_gastos_personales || 0) + Number(watchedData.mes1_gastos_negocio || 0)) + 
                                           (Number(watchedData.mes2_compromisos || 0) + Number(watchedData.mes2_gastos_personales || 0) + Number(watchedData.mes2_gastos_negocio || 0)) + 
                                           (Number(watchedData.mes3_compromisos || 0) + Number(watchedData.mes3_gastos_personales || 0) + Number(watchedData.mes3_gastos_negocio || 0))) / 3)}
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
                            <span className="font-semibold text-green-600">
                              {formatMXN(((Number(watchedData.mes1_nomina || 0) + Number(watchedData.mes1_comisiones || 0) + Number(watchedData.mes1_negocio || 0) + Number(watchedData.mes1_efectivo || 0)) + 
                                         (Number(watchedData.mes2_nomina || 0) + Number(watchedData.mes2_comisiones || 0) + Number(watchedData.mes2_negocio || 0) + Number(watchedData.mes2_efectivo || 0)) + 
                                         (Number(watchedData.mes3_nomina || 0) + Number(watchedData.mes3_comisiones || 0) + Number(watchedData.mes3_negocio || 0) + Number(watchedData.mes3_efectivo || 0))) / 3)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Total Egresos (Promedio):</span>
                            <span className="font-semibold text-red-600">
                              {formatMXN(((Number(watchedData.mes1_compromisos || 0) + Number(watchedData.mes1_gastos_personales || 0) + Number(watchedData.mes1_gastos_negocio || 0)) + 
                                         (Number(watchedData.mes2_compromisos || 0) + Number(watchedData.mes2_gastos_personales || 0) + Number(watchedData.mes2_gastos_negocio || 0)) + 
                                         (Number(watchedData.mes3_compromisos || 0) + Number(watchedData.mes3_gastos_personales || 0) + Number(watchedData.mes3_gastos_negocio || 0))) / 3)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-700 font-medium">Disponible:</span>
                            <span className="font-bold text-blue-600">
                              {formatMXN((((Number(watchedData.mes1_nomina || 0) + Number(watchedData.mes1_comisiones || 0) + Number(watchedData.mes1_negocio || 0) + Number(watchedData.mes1_efectivo || 0)) + 
                                          (Number(watchedData.mes2_nomina || 0) + Number(watchedData.mes2_comisiones || 0) + Number(watchedData.mes2_negocio || 0) + Number(watchedData.mes2_efectivo || 0)) + 
                                          (Number(watchedData.mes3_nomina || 0) + Number(watchedData.mes3_comisiones || 0) + Number(watchedData.mes3_negocio || 0) + Number(watchedData.mes3_efectivo || 0))) / 3) - 
                                         (((Number(watchedData.mes1_compromisos || 0) + Number(watchedData.mes1_gastos_personales || 0) + Number(watchedData.mes1_gastos_negocio || 0)) + 
                                          (Number(watchedData.mes2_compromisos || 0) + Number(watchedData.mes2_gastos_personales || 0) + Number(watchedData.mes2_gastos_negocio || 0)) + 
                                          (Number(watchedData.mes3_compromisos || 0) + Number(watchedData.mes3_gastos_personales || 0) + Number(watchedData.mes3_gastos_negocio || 0))) / 3))}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Capacidad de Pago (40%):</span>
                            <span className="font-semibold text-green-600">
                              {formatMXN(((((Number(watchedData.mes1_nomina || 0) + Number(watchedData.mes1_comisiones || 0) + Number(watchedData.mes1_negocio || 0) + Number(watchedData.mes1_efectivo || 0)) + 
                                           (Number(watchedData.mes2_nomina || 0) + Number(watchedData.mes2_comisiones || 0) + Number(watchedData.mes2_negocio || 0) + Number(watchedData.mes2_efectivo || 0)) + 
                                           (Number(watchedData.mes3_nomina || 0) + Number(watchedData.mes3_comisiones || 0) + Number(watchedData.mes3_negocio || 0) + Number(watchedData.mes3_efectivo || 0))) / 3) - 
                                          (((Number(watchedData.mes1_compromisos || 0) + Number(watchedData.mes1_gastos_personales || 0) + Number(watchedData.mes1_gastos_negocio || 0)) + 
                                           (Number(watchedData.mes2_compromisos || 0) + Number(watchedData.mes2_gastos_personales || 0) + Number(watchedData.mes2_gastos_negocio || 0)) + 
                                           (Number(watchedData.mes3_compromisos || 0) + Number(watchedData.mes3_gastos_personales || 0) + Number(watchedData.mes3_gastos_negocio || 0))) / 3)) * 0.4)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Pago Mensual Total:</span>
                            <span className="font-semibold text-blue-600">{formatMXN(monthlyPaymentValue)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-700 font-medium">Proporción (Capacidad/Pago):</span>
                            <span className={cn(
                              "font-bold text-lg",
                              (() => {
                                const averageIncome = ((Number(watchedData.mes1_nomina || 0) + Number(watchedData.mes1_comisiones || 0) + Number(watchedData.mes1_negocio || 0) + Number(watchedData.mes1_efectivo || 0)) + 
                                                     (Number(watchedData.mes2_nomina || 0) + Number(watchedData.mes2_comisiones || 0) + Number(watchedData.mes2_negocio || 0) + Number(watchedData.mes2_efectivo || 0)) + 
                                                     (Number(watchedData.mes3_nomina || 0) + Number(watchedData.mes3_comisiones || 0) + Number(watchedData.mes3_negocio || 0) + Number(watchedData.mes3_efectivo || 0))) / 3;
                                const averageExpenses = ((Number(watchedData.mes1_compromisos || 0) + Number(watchedData.mes1_gastos_personales || 0) + Number(watchedData.mes1_gastos_negocio || 0)) + 
                                                        (Number(watchedData.mes2_compromisos || 0) + Number(watchedData.mes2_gastos_personales || 0) + Number(watchedData.mes2_gastos_negocio || 0)) + 
                                                        (Number(watchedData.mes3_compromisos || 0) + Number(watchedData.mes3_gastos_personales || 0) + Number(watchedData.mes3_gastos_negocio || 0))) / 3;
                                const availableIncome = averageIncome - averageExpenses;
                                const paymentCapacity = availableIncome * 0.4;
                                const viabilityRatio = monthlyPaymentValue > 0 ? paymentCapacity / monthlyPaymentValue : 0;
                                return viabilityRatio < 1 ? "text-red-600" : 
                                       viabilityRatio < 1.2 ? "text-orange-600" :
                                       viabilityRatio < 1.4 ? "text-yellow-600" :
                                       viabilityRatio < 1.8 ? "text-green-600" : "text-emerald-600";
                              })()
                            )}>
                              {(() => {
                                const averageIncome = ((Number(watchedData.mes1_nomina || 0) + Number(watchedData.mes1_comisiones || 0) + Number(watchedData.mes1_negocio || 0) + Number(watchedData.mes1_efectivo || 0)) + 
                                                     (Number(watchedData.mes2_nomina || 0) + Number(watchedData.mes2_comisiones || 0) + Number(watchedData.mes2_negocio || 0) + Number(watchedData.mes2_efectivo || 0)) + 
                                                     (Number(watchedData.mes3_nomina || 0) + Number(watchedData.mes3_comisiones || 0) + Number(watchedData.mes3_negocio || 0) + Number(watchedData.mes3_efectivo || 0))) / 3;
                                const averageExpenses = ((Number(watchedData.mes1_compromisos || 0) + Number(watchedData.mes1_gastos_personales || 0) + Number(watchedData.mes1_gastos_negocio || 0)) + 
                                                        (Number(watchedData.mes2_compromisos || 0) + Number(watchedData.mes2_gastos_personales || 0) + Number(watchedData.mes2_gastos_negocio || 0)) + 
                                                        (Number(watchedData.mes3_compromisos || 0) + Number(watchedData.mes3_gastos_personales || 0) + Number(watchedData.mes3_gastos_negocio || 0))) / 3;
                                const availableIncome = averageIncome - averageExpenses;
                                const paymentCapacity = availableIncome * 0.4;
                                const viabilityRatio = monthlyPaymentValue > 0 ? paymentCapacity / monthlyPaymentValue : 0;
                                return viabilityRatio.toFixed(2);
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Métrica de Viabilidad */}
                      <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Viabilidad</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-2">Ratio de Viabilidad</div>
                            <div className="text-3xl font-bold text-gray-900">
                              {(() => {
                                const averageIncome = ((Number(watchedData.mes1_nomina || 0) + Number(watchedData.mes1_comisiones || 0) + Number(watchedData.mes1_negocio || 0) + Number(watchedData.mes1_efectivo || 0)) + 
                                                     (Number(watchedData.mes2_nomina || 0) + Number(watchedData.mes2_comisiones || 0) + Number(watchedData.mes2_negocio || 0) + Number(watchedData.mes2_efectivo || 0)) + 
                                                     (Number(watchedData.mes3_nomina || 0) + Number(watchedData.mes3_comisiones || 0) + Number(watchedData.mes3_negocio || 0) + Number(watchedData.mes3_efectivo || 0))) / 3;
                                const averageExpenses = ((Number(watchedData.mes1_compromisos || 0) + Number(watchedData.mes1_gastos_personales || 0) + Number(watchedData.mes1_gastos_negocio || 0)) + 
                                                        (Number(watchedData.mes2_compromisos || 0) + Number(watchedData.mes2_gastos_personales || 0) + Number(watchedData.mes2_gastos_negocio || 0)) + 
                                                        (Number(watchedData.mes3_compromisos || 0) + Number(watchedData.mes3_gastos_personales || 0) + Number(watchedData.mes3_gastos_negocio || 0))) / 3;
                                const availableIncome = averageIncome - averageExpenses;
                                const paymentCapacity = availableIncome * 0.4;
                                const viabilityRatio = monthlyPaymentValue > 0 ? paymentCapacity / monthlyPaymentValue : 0;
                                return viabilityRatio.toFixed(2);
                              })()}
                            </div>
                            <div className="text-xs text-gray-500">Capacidad ÷ Pago</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-2">Estado</div>
                            <div className={cn(
                              "inline-flex px-4 py-2 rounded-full text-sm font-semibold",
                              (() => {
                                const averageIncome = ((Number(watchedData.mes1_nomina || 0) + Number(watchedData.mes1_comisiones || 0) + Number(watchedData.mes1_negocio || 0) + Number(watchedData.mes1_efectivo || 0)) + 
                                                     (Number(watchedData.mes2_nomina || 0) + Number(watchedData.mes2_comisiones || 0) + Number(watchedData.mes2_negocio || 0) + Number(watchedData.mes2_efectivo || 0)) + 
                                                     (Number(watchedData.mes3_nomina || 0) + Number(watchedData.mes3_comisiones || 0) + Number(watchedData.mes3_negocio || 0) + Number(watchedData.mes3_efectivo || 0))) / 3;
                                const averageExpenses = ((Number(watchedData.mes1_compromisos || 0) + Number(watchedData.mes1_gastos_personales || 0) + Number(watchedData.mes1_gastos_negocio || 0)) + 
                                                        (Number(watchedData.mes2_compromisos || 0) + Number(watchedData.mes2_gastos_personales || 0) + Number(watchedData.mes2_gastos_negocio || 0)) + 
                                                        (Number(watchedData.mes3_compromisos || 0) + Number(watchedData.mes3_gastos_personales || 0) + Number(watchedData.mes3_gastos_negocio || 0))) / 3;
                                const availableIncome = averageIncome - averageExpenses;
                                const paymentCapacity = availableIncome * 0.4;
                                const viabilityRatio = monthlyPaymentValue > 0 ? paymentCapacity / monthlyPaymentValue : 0;
                                if (viabilityRatio < 1) return "bg-red-100 text-red-600";
                                if (viabilityRatio >= 1 && viabilityRatio < 1.2) return "bg-orange-100 text-orange-600";
                                if (viabilityRatio >= 1.2 && viabilityRatio < 1.4) return "bg-yellow-100 text-yellow-600";
                                if (viabilityRatio >= 1.4 && viabilityRatio < 1.8) return "bg-green-100 text-green-600";
                                return "bg-emerald-100 text-emerald-600";
                              })()
                            )}>
                              {(() => {
                                const averageIncome = ((Number(watchedData.mes1_nomina || 0) + Number(watchedData.mes1_comisiones || 0) + Number(watchedData.mes1_negocio || 0) + Number(watchedData.mes1_efectivo || 0)) + 
                                                     (Number(watchedData.mes2_nomina || 0) + Number(watchedData.mes2_comisiones || 0) + Number(watchedData.mes2_negocio || 0) + Number(watchedData.mes2_efectivo || 0)) + 
                                                     (Number(watchedData.mes3_nomina || 0) + Number(watchedData.mes3_comisiones || 0) + Number(watchedData.mes3_negocio || 0) + Number(watchedData.mes3_efectivo || 0))) / 3;
                                const averageExpenses = ((Number(watchedData.mes1_compromisos || 0) + Number(watchedData.mes1_gastos_personales || 0) + Number(watchedData.mes1_gastos_negocio || 0)) + 
                                                        (Number(watchedData.mes2_compromisos || 0) + Number(watchedData.mes2_gastos_personales || 0) + Number(watchedData.mes2_gastos_negocio || 0)) + 
                                                        (Number(watchedData.mes3_compromisos || 0) + Number(watchedData.mes3_gastos_personales || 0) + Number(watchedData.mes3_gastos_negocio || 0))) / 3;
                                const availableIncome = averageIncome - averageExpenses;
                                const paymentCapacity = availableIncome * 0.4;
                                const viabilityRatio = monthlyPaymentValue > 0 ? paymentCapacity / monthlyPaymentValue : 0;
                                if (viabilityRatio < 1) return "No Viable";
                                if (viabilityRatio >= 1 && viabilityRatio < 1.2) return "Riesgoso";
                                if (viabilityRatio >= 1.2 && viabilityRatio < 1.4) return "Aceptable";
                                if (viabilityRatio >= 1.4 && viabilityRatio < 1.8) return "Óptimo";
                                return "Excelente";
                              })()}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-2">Excedente</div>
                            <div className={cn(
                              "text-2xl font-bold",
                              (() => {
                                const averageIncome = ((Number(watchedData.mes1_nomina || 0) + Number(watchedData.mes1_comisiones || 0) + Number(watchedData.mes1_negocio || 0) + Number(watchedData.mes1_efectivo || 0)) + 
                                                     (Number(watchedData.mes2_nomina || 0) + Number(watchedData.mes2_comisiones || 0) + Number(watchedData.mes2_negocio || 0) + Number(watchedData.mes2_efectivo || 0)) + 
                                                     (Number(watchedData.mes3_nomina || 0) + Number(watchedData.mes3_comisiones || 0) + Number(watchedData.mes3_negocio || 0) + Number(watchedData.mes3_efectivo || 0))) / 3;
                                const averageExpenses = ((Number(watchedData.mes1_compromisos || 0) + Number(watchedData.mes1_gastos_personales || 0) + Number(watchedData.mes1_gastos_negocio || 0)) + 
                                                        (Number(watchedData.mes2_compromisos || 0) + Number(watchedData.mes2_gastos_personales || 0) + Number(watchedData.mes2_gastos_negocio || 0)) + 
                                                        (Number(watchedData.mes3_compromisos || 0) + Number(watchedData.mes3_gastos_personales || 0) + Number(watchedData.mes3_gastos_negocio || 0))) / 3;
                                const availableIncome = averageIncome - averageExpenses;
                                const paymentCapacity = availableIncome * 0.4;
                                const excedente = paymentCapacity - monthlyPaymentValue;
                                return excedente >= 0 ? 'text-green-600' : 'text-red-600';
                              })()
                            )}>
                              {(() => {
                                const averageIncome = ((Number(watchedData.mes1_nomina || 0) + Number(watchedData.mes1_comisiones || 0) + Number(watchedData.mes1_negocio || 0) + Number(watchedData.mes1_efectivo || 0)) + 
                                                     (Number(watchedData.mes2_nomina || 0) + Number(watchedData.mes2_comisiones || 0) + Number(watchedData.mes2_negocio || 0) + Number(watchedData.mes2_efectivo || 0)) + 
                                                     (Number(watchedData.mes3_nomina || 0) + Number(watchedData.mes3_comisiones || 0) + Number(watchedData.mes3_negocio || 0) + Number(watchedData.mes3_efectivo || 0))) / 3;
                                const averageExpenses = ((Number(watchedData.mes1_compromisos || 0) + Number(watchedData.mes1_gastos_personales || 0) + Number(watchedData.mes1_gastos_negocio || 0)) + 
                                                        (Number(watchedData.mes2_compromisos || 0) + Number(watchedData.mes2_gastos_personales || 0) + Number(watchedData.mes2_gastos_negocio || 0)) + 
                                                        (Number(watchedData.mes3_compromisos || 0) + Number(watchedData.mes3_gastos_personales || 0) + Number(watchedData.mes3_gastos_negocio || 0))) / 3;
                                const availableIncome = averageIncome - averageExpenses;
                                const paymentCapacity = availableIncome * 0.4;
                                const excedente = paymentCapacity - monthlyPaymentValue;
                                return formatMXN(excedente);
                              })()}
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
                  </div>
                )}

                {/* Step 3: Datos del Vehículo */}
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

                    {/* Competidores */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <TrendingDown className="w-5 h-5 mr-2 text-blue-600" />
                        Precios de Competidores
                      </h4>
                      
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
                                placeholder="Ej: MercadoLibre, Autocosmos..."
                                {...register(`competitors.${index}.name` as const)}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Precio *
                              </label>
                              <input
                                type="number"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="489,000"
                                {...register(`competitors.${index}.price` as const)}
                              />
                            </div>

                            <div className="flex items-end space-x-2">
                              {competitorFields.length > 3 && (
                                <button
                                  type="button"
                                  onClick={() => removeCompetitor(index)}
                                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                              )}
                              {index === competitorFields.length - 1 && (
                                <button
                                  type="button"
                                  onClick={() => appendCompetitor({ name: "", price: 0 })}
                                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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

              </div>
            </div>

            {/* Navigation Buttons - Fijos en la parte inferior */}
            <div className="border-t bg-white px-8 py-6 flex-shrink-0">
              <div className="max-w-6xl mx-auto">
                <div className="flex justify-between">
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
                      onClick={handleClose}
                      className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>

                    {step < totalSteps ? (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            const currentData = watch();
                            await autoSaveForm({ ...currentData, month_labels: monthLabels }, true);
                          }}
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={nextStep}
                          className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
                        >
                          Siguiente
                        </button>
                      </>
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
          </form>
        </div>
      </div>
    </div>
  );
}
