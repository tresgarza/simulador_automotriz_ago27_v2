"use client";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  X, User, Car, DollarSign, Building2, FileCheck, Plus, Minus,
  Calculator, TrendingUp, TrendingDown, Banknote, CreditCard, PiggyBank
} from "lucide-react";
import { formatMXN, cn } from "@/lib/utils";
import { supabase } from "../../../../lib/supabase";

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

  // Ingresos Mensuales Comprobables
  incomes: z.array(z.object({
    type: z.enum(["nomina", "comisiones", "negocio"]),
    period: z.string().optional(),
    amount: z.coerce.number().min(0, "El monto no puede ser negativo")
  })).min(1, "Debe agregar al menos un ingreso"),

  // Compromisos y Gastos
  commitments: z.coerce.number().min(0, "Los compromisos no pueden ser negativos"),
  personal_expenses: z.coerce.number().min(0, "Los gastos personales no pueden ser negativos"),
  business_expenses: z.coerce.number().min(0, "Los gastos de negocio no pueden ser negativos"),

  // Datos del Carro
  dealership: z.string().min(1, "La agencia es requerida"),
  vehicle_brand: z.string().min(1, "La marca es requerida"),
  vehicle_model: z.string().min(1, "El modelo es requerido"),
  vehicle_year: z.coerce.number().min(2000, "El año debe ser mayor a 2000"),
  sale_value: z.coerce.number().min(0, "El valor de venta no puede ser negativo"),
  book_value: z.coerce.number().min(0, "El valor de libro azul no puede ser negativo"),
  competitor_1: z.coerce.number().min(0, "El precio del competidor 1 no puede ser negativo"),
  competitor_2: z.coerce.number().min(0, "El precio del competidor 2 no puede ser negativo"),
  competitor_3: z.coerce.number().min(0, "El precio del competidor 3 no puede ser negativo")
});

type AuthorizationFormData = z.infer<typeof AuthorizationSchema>;

interface AuthorizationRequest {
  id: string;
  simulation: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  reviewerId?: string;
  reviewerName?: string;
}

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
      // Pre-llenar con datos de la simulación
      applicant_name: request.simulation.quote.client_name || "",
      requested_amount: request.simulation.quote.vehicle_value || 0,
      term_months: request.simulation.term_months || 48,
      interest_rate: request.simulation.annual_rate * 100 || 45,
      opening_fee: 3, // 3% por defecto
      vehicle_brand: request.simulation.quote.vehicle_brand || "",
      vehicle_model: request.simulation.quote.vehicle_model || "",
      vehicle_year: request.simulation.quote.vehicle_year || new Date().getFullYear(),
      sale_value: request.simulation.quote.vehicle_value || 0,
      incomes: [{ type: "nomina", period: "", amount: 0 }],
      commitments: 0,
      personal_expenses: 0,
      business_expenses: 0,
      competitor_1: 0,
      competitor_2: 0,
      competitor_3: 0
    }
  });

  const { fields: incomeFields, append: appendIncome, remove: removeIncome } = useFieldArray({
    control,
    name: "incomes"
  });

  const watchedIncomes = watch("incomes");
  const watchedCommitments = watch("commitments");
  const watchedPersonalExpenses = watch("personal_expenses");
  const watchedBusinessExpenses = watch("business_expenses");
  const watchedMonthlySalary = watch("monthly_salary");
  const watchedMonthlyCapacity = watch("monthly_capacity");

  // Calcular total de ingresos
  const totalIncome = watchedIncomes?.reduce((sum, income) => sum + (income.amount || 0), 0) || 0;
  const totalExpenses = (watchedCommitments || 0) + (watchedPersonalExpenses || 0) + (watchedBusinessExpenses || 0);
  const availableIncome = totalIncome - totalExpenses;
  const capacityPercentage = availableIncome > 0 ? (watchedMonthlyCapacity / availableIncome) * 100 : 0;

  const onSubmit = async (data: AuthorizationFormData) => {
    setIsSubmitting(true);
    try {
      // Aquí iría la lógica para guardar la autorización
      // Por ahora solo mostramos los datos
      console.log("Authorization Data:", data);

      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Cerrar el modal
      onClose();
    } catch (error) {
      console.error("Error submitting authorization:", error);
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
                Solicitud de {request.simulation.quote.client_name || 'Cliente Anónimo'}
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Oscar Alberto Saucedo Jimenez"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="345000"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="48"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="45.00"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="3.00"
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
                      Capacidad de Pago Mensual *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="24250.88"
                      {...register("monthly_capacity")}
                    />
                    {errors.monthly_capacity && (
                      <p className="text-red-600 text-sm mt-1">{errors.monthly_capacity.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descuento Mensual *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="15597.93"
                      {...register("monthly_discount")}
                    />
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

                  {incomeFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 bg-white rounded-lg border">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo *
                        </label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          {...register(`incomes.${index}.type`)}
                        >
                          {Object.entries(incomeTypes).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Período
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="5/25"
                          {...register(`incomes.${index}.period`)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Monto *
                        </label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="59996.11"
                          {...register(`incomes.${index}.amount`)}
                        />
                      </div>

                      <div className="flex items-end space-x-2">
                        {incomeFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeIncome(index)}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                        {index === incomeFields.length - 1 && (
                          <button
                            type="button"
                            onClick={() => appendIncome({ type: "nomina", period: "", amount: 0 })}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 p-4 bg-blue-100 rounded-lg">
                    <div className="text-center">
                      <p className="text-sm text-blue-700 font-medium">Total Ingresos</p>
                      <p className="text-xl font-bold text-blue-800">{formatMXN(totalIncome)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-700 font-medium">Meses</p>
                      <p className="text-xl font-bold text-blue-800">{watchedIncomes?.length || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-700 font-medium">Promedio</p>
                      <p className="text-xl font-bold text-blue-800">{formatMXN(totalIncome / Math.max(watchedIncomes?.length || 1, 1))}</p>
                    </div>
                  </div>
                </div>

                {/* Compromisos y Gastos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-red-600" />
                      Compromisos en Buro
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="0"
                      {...register("commitments")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <PiggyBank className="w-4 h-4 mr-2 text-orange-600" />
                      Gasto Personal
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0"
                      {...register("personal_expenses")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Building2 className="w-4 h-4 mr-2 text-purple-600" />
                      Gasto Negocio
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="0"
                      {...register("business_expenses")}
                    />
                  </div>
                </div>

                {/* Resumen Financiero */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Resumen Financiero</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Total Ingresos:</span>
                        <span className="font-semibold text-green-600">{formatMXN(totalIncome)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Total Egresos:</span>
                        <span className="font-semibold text-red-600">{formatMXN(totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-700 font-medium">Disponible:</span>
                        <span className="font-bold text-blue-600">{formatMXN(availableIncome)}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700">Capacidad de Pago:</span>
                        <span className="font-semibold">{formatMXN(watchedMonthlyCapacity || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Capacidad 40%:</span>
                        <span className="font-semibold">{formatMXN(availableIncome * 0.4)}</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-gray-700 font-medium">Porcentaje:</span>
                        <span className={cn(
                          "font-bold",
                          capacityPercentage > 40 ? "text-red-600" : "text-green-600"
                        )}>
                          {capacityPercentage.toFixed(1)}%
                        </span>
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

                {/* Competidores */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Precios de Competidores</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Competidor 1
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="489000"
                        {...register("competitor_1")}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Competidor 2
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="455000"
                        {...register("competitor_2")}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Competidor 3
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                        placeholder="500000"
                        {...register("competitor_3")}
                      />
                    </div>
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
