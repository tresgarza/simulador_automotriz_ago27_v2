"use client";
import { useMemo, useState } from "react";
import { brand } from "@/styles/theme";
import { QuoteForm, type FormData } from "@/components/form/QuoteForm";
import { SummaryCard } from "@/components/summary/SummaryCard";

type ApiResult = {
  summary: {
    pmt_total_month2: number;
    principal_total: number;
    initial_outlay: number;
    first_payment_date: string;
    last_payment_date: string;
    pmt_base: number;
    opening_fee: number;
    opening_fee_iva: number;
    gps: number;
    gps_iva: number;
  };
  schedule: {
    k: number;
    date: string;
    saldo_ini: number;
    interes: number;
    iva_interes: number;
    capital: number;
    pmt: number;
    gps_rent: number;
    gps_rent_iva: number;
    pago_total: number;
    saldo_fin: number;
  }[];
};

type ComparativeResult = {
  A: ApiResult;
  B: ApiResult;
  C: ApiResult;
};

export default function Home() {
  const [result, setResult] = useState<ApiResult | ComparativeResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRateForTier = (tier: string): number => {
    switch (tier) {
      case "A": return 0.36;
      case "B": return 0.40;
      case "C": return 0.45;
      default: return 0.45;
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      if (data.compare_all) {
        // Fetch all three tiers in parallel
        const promises = ["A", "B", "C"].map(async (tier) => {
          const body = {
            vehicle_value: data.vehicle_value,
            down_payment_amount: data.down_payment_amount,
            term_months: data.term_months,
            insurance: { mode: data.insurance_mode, amount: data.insurance_amount },
            settings: {
              annual_nominal_rate: getRateForTier(tier),
              iva: 0.16,
              opening_fee_rate: 0.03,
              gps_initial: 0, // No installation fee for now
              gps_monthly: 400,
              first_payment_rule: "next_quincena" as const,
              day_count: "A360" as const,
              finance_insurance_mode: "add_to_principal" as const,
            },
            as_of: new Date().toISOString().slice(0, 10),
          };

          const res = await fetch("/api/quotes/compute", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
          });
          const json = await res.json();
          return [tier, json] as const;
        });

        const results = await Promise.all(promises);
        const comparativeResult = results.reduce((acc, [tier, result]) => {
          acc[tier as keyof ComparativeResult] = result;
          return acc;
        }, {} as ComparativeResult);

        setResult(comparativeResult);
      } else {
        // Single calculation
        const body = {
          vehicle_value: data.vehicle_value,
          down_payment_amount: data.down_payment_amount,
          term_months: data.term_months,
          insurance: { mode: data.insurance_mode, amount: data.insurance_amount },
          settings: {
            annual_nominal_rate: getRateForTier(data.rate_tier),
            iva: 0.16,
            opening_fee_rate: 0.03,
            gps_initial: 0, // No installation fee for now
            gps_monthly: 400,
            first_payment_rule: "next_quincena" as const,
            day_count: "A360" as const,
            finance_insurance_mode: "add_to_principal" as const,
          },
          as_of: new Date().toISOString().slice(0, 10),
        };

        const res = await fetch("/api/quotes/compute", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        setResult(json);
      }
    } catch (error) {
      console.error("Error calculating quote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const gradient = useMemo(() => ({ background: brand.gradient }), []);
  const isComparative = Boolean(result && "A" in result);

  return (
    <div className="min-h-screen" style={gradient}>
      <div className="mx-auto max-w-7xl p-6 sm:p-10">
        <header className="text-white mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-2">
            Simula tu Crédito Automotriz
          </h1>
          <p className="text-lg opacity-90">
            Ajusta los valores para encontrar el plan perfecto para ti.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <QuoteForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
          </div>

          <div>
            <SummaryCard result={result} isComparative={isComparative} />
          </div>
        </div>
      </div>
    </div>
  );
}
