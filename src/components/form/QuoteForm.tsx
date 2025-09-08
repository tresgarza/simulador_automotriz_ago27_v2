"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatMXN, formatPercent, cn } from "@/lib/utils";
import { Calculator, Car, DollarSign, Shield, Info, HelpCircle, CreditCard } from "lucide-react";
import { useState } from "react";

const FormSchema = z.object({
  vehicle_value: z.coerce.number().min(10000, "El valor del vehículo debe ser mayor a $10,000"),
  down_payment_amount: z.coerce.number().min(0, "El enganche no puede ser negativo"),
  insurance_mode: z.enum(["cash", "financed"]),
  insurance_amount: z.coerce.number().min(0, "El monto del seguro no puede ser negativo"),
  commission_mode: z.enum(["cash", "financed"]),
});

export type FormData = z.output<typeof FormSchema>;

interface QuoteFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
  hasResults?: boolean; // Nuevo prop para saber si ya hay resultados
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

export function QuoteForm({ onSubmit, isSubmitting, hasResults = false }: QuoteFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<z.input<typeof FormSchema>, unknown, FormData>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      vehicle_value: 405900,
      down_payment_amount: Math.round(405900 * 0.3),
      insurance_mode: "financed",
      insurance_amount: 19500,
      commission_mode: "financed",
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

  return (
    <div className="relative">
      {/* Improved Card with better contrast */}
      <div className="bg-white/95 backdrop-blur-lg border border-gray-200/60 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50/80 to-white/60 rounded-3xl"></div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 space-y-6 md:space-y-8">
          {/* Header */}
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl mb-4 shadow-lg">
              <Calculator className="w-7 h-7 md:w-8 md:h-8 text-white" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Calcula tu Crédito</h2>
            <p className="text-sm md:text-base text-gray-600">Ingresa los datos de tu vehículo</p>
          </div>

          {/* Vehicle Value */}
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
                {errors.vehicle_value.message}
              </p>
            )}
          </div>

          {/* Down Payment */}
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

          {/* Insurance */}
          <div className="space-y-4">
            <label className="flex items-center text-gray-800 font-medium text-sm md:text-base">
              <Shield className="w-4 h-4 md:w-5 md:h-5 mr-2 text-emerald-600" />
              Seguro del Vehículo
              <Tooltip text="CONTADO: Pagas el seguro por separado ahora. FINANCIADO: Se suma al crédito y lo pagas en mensualidades con intereses">
                <HelpCircle className="w-4 h-4 ml-2 text-gray-500 hover:text-gray-700" />
              </Tooltip>
            </label>
            
            {/* Fixed Insurance Mode Pills */}
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

            {/* Insurance Amount */}
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

          {/* Commission Payment Mode */}
          <div className="space-y-4">
            <label className="flex items-center text-gray-800 font-medium text-sm md:text-base">
              <CreditCard className="w-4 h-4 md:w-5 md:h-5 mr-2 text-emerald-600" />
              Comisión de Apertura (3%)
              <Tooltip text="CONTADO: Pagas la comisión por separado ahora. FINANCIADO: Se incluye en el crédito y lo pagas en mensualidades con intereses">
                <HelpCircle className="w-4 h-4 ml-2 text-gray-500 hover:text-gray-700" />
              </Tooltip>
            </label>
            
            {/* Commission Mode Pills */}
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

            {/* Commission Amount Display */}
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

          {/* Info Note */}
          
        </form>
      </div>
    </div>
  );
}