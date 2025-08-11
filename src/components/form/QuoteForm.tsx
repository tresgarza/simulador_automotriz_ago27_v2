"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { formatMXN, formatPercent, cn } from "@/lib/utils";
import { brand } from "@/styles/theme";

const FormSchema = z.object({
  vehicle_value: z.coerce.number().min(10000, "El valor del vehículo debe ser mayor a $10,000"),
  down_payment_amount: z.coerce.number().min(0, "El enganche no puede ser negativo"),
  term_months: z.coerce.number().int().min(12).max(60),
  insurance_mode: z.enum(["cash", "financed"]),
  insurance_amount: z.coerce.number().min(0, "El monto del seguro no puede ser negativo"),
  rate_tier: z.enum(["A", "B", "C"]).default("C"),
  compare_all: z.boolean().default(false),
});

export type FormData = z.output<typeof FormSchema>;

interface QuoteFormProps {
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
}

export function QuoteForm({ onSubmit, isSubmitting }: QuoteFormProps) {
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
      term_months: 48,
      insurance_mode: "cash",
      insurance_amount: 0,
      rate_tier: "C",
      compare_all: false,
    },
  });

  const vehicleValue = watch("vehicle_value") as number;
  const downPayment = watch("down_payment_amount") as number;
  const rateTier = watch("rate_tier") as string;
  const compareAll = watch("compare_all") as boolean;

  const downPaymentPercent = vehicleValue > 0 ? downPayment / vehicleValue : 0;
  const minDownPayment = vehicleValue * 0.3;
  const isDownPaymentLow = downPayment < minDownPayment;
  // compareAll used for watch state

  const handleDownPaymentBlur = () => {
    if (isDownPaymentLow && vehicleValue > 0) {
      setValue("down_payment_amount", Math.round(minDownPayment));
    }
  };

  const rateTiers = [
    { key: "A", label: "Nivel A", rate: "36%" },
    { key: "B", label: "Nivel B", rate: "40%" },
    { key: "C", label: "Nivel C", rate: "45%" },
  ] as const;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl p-6 shadow-lg space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valor del Vehículo
            <span className="ml-1 text-xs text-gray-500" title="Precio total del vehículo según factura">ℹ️</span>
          </label>
          <input
            type="number"
            className={cn(
              "w-full rounded-md border p-3 text-lg",
              errors.vehicle_value ? "border-red-500" : "border-gray-300"
            )}
            placeholder="$500,000"
            {...register("vehicle_value")}
          />
          {errors.vehicle_value && (
            <p className="text-red-500 text-xs mt-1">{errors.vehicle_value.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enganche
            <span className="text-gray-500 ml-2">
              ({formatPercent(downPaymentPercent)})
            </span>
            <span className="ml-1 text-xs text-gray-500" title="Mínimo 30% del valor del vehículo">ℹ️</span>
          </label>
          <input
            type="number"
            className={cn(
              "w-full rounded-md border p-3 text-lg",
              errors.down_payment_amount || isDownPaymentLow ? "border-red-500" : "border-gray-300"
            )}
            placeholder={formatMXN(minDownPayment)}
            {...register("down_payment_amount", {
              onBlur: handleDownPaymentBlur
            })}
          />
          {isDownPaymentLow && (
            <p className="text-red-500 text-xs mt-1">
              El enganche mínimo es 30% ({formatMXN(minDownPayment)})
            </p>
          )}
          {errors.down_payment_amount && (
            <p className="text-red-500 text-xs mt-1">{errors.down_payment_amount.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Plazo del Crédito
          <span className="ml-1 text-xs text-gray-500" title="Período de pago en meses">ℹ️</span>
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[12, 24, 36, 48, 60].map((months) => (
            <label
              key={months}
              className="relative flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-colors hover:bg-gray-50"
            >
              <input
                type="radio"
                value={months}
                className="sr-only"
                {...register("term_months")}
              />
              <span className="text-sm font-medium">{months} meses</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Nivel de Tasa
          <span className="ml-1 text-xs text-gray-500" title="A: 36% TAN, B: 40% TAN, C: 45% TAN">ℹ️</span>
        </label>
          <div className="flex gap-2">
            {rateTiers.map((tier) => (
              <label
                key={tier.key}
                className={cn(
                  "flex-1 rounded-lg border-2 p-3 cursor-pointer transition-all text-center",
                  rateTier === tier.key
                    ? "border-primary bg-primary/10"
                    : "border-gray-200 hover:border-gray-300"
                )}
                style={{
                  borderColor: rateTier === tier.key ? brand.primary : undefined,
                  backgroundColor: rateTier === tier.key ? `${brand.primary}15` : undefined,
                }}
              >
                <input
                  type="radio"
                  value={tier.key}
                  className="sr-only"
                  {...register("rate_tier")}
                />
                <div className="text-sm font-medium">{tier.label}</div>
                <div className="text-xs text-gray-600">{tier.rate}</div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Comparar Niveles
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              {...register("compare_all")}
            />
            <span className="text-sm">Mostrar comparación A/B/C</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Seguro
        </label>
        <div className="space-y-3">
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="cash"
                className="w-4 h-4"
                {...register("insurance_mode")}
              />
              <span className="text-sm">Contado</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="financed"
                className="w-4 h-4"
                {...register("insurance_mode")}
              />
              <span className="text-sm">Financiado</span>
            </label>
          </div>
          <input
            type="number"
            placeholder="Monto del seguro"
            className={cn(
              "w-full rounded-md border p-3",
              errors.insurance_amount ? "border-red-500" : "border-gray-300"
            )}
            {...register("insurance_amount")}
          />
          {errors.insurance_amount && (
            <p className="text-red-500 text-xs mt-1">{errors.insurance_amount.message}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 text-lg font-semibold"
        style={{ backgroundColor: brand.primary }}
      >
        {isSubmitting ? "Calculando..." : "Calcular mi Crédito"}
      </Button>
    </form>
  );
}
