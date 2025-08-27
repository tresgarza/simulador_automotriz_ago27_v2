import { NextRequest } from "next/server";
import { z } from "zod";
import { calculateAmortization, type AmortizationInputs } from "@/lib/amortization-calculator";

const InsuranceSchema = z.object({
  mode: z.enum(["cash", "financed"]),
  amount: z.number().nonnegative(),
});

const CommissionSchema = z.object({
  mode: z.enum(["cash", "financed"]),
});

const SettingsSchema = z.object({
  annual_nominal_rate: z.number().positive(),
  iva: z.number().min(0).max(1),
  opening_fee_rate: z.number().min(0),
  gps_initial: z.number().min(0),
  gps_monthly: z.number().min(0).default(400),
  first_payment_rule: z.literal("next_quincena"),
  day_count: z.enum(["A360", "ACT360"]).default("A360"),
  finance_insurance_mode: z.enum(["add_to_principal", "12m_subloan"]).default("add_to_principal"),
});

const BodySchema = z.object({
  vehicle_value: z.number().positive(),
  down_payment_amount: z.number().min(0),
  term_months: z.number().int().min(1),
  insurance: InsuranceSchema,
  commission: CommissionSchema,
  settings: SettingsSchema,
  as_of: z.string(),
});

function hasIssues(err: unknown): err is { issues: unknown } {
  return typeof err === "object" && err !== null && "issues" in err;
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = BodySchema.parse(json);

    // Convertir los datos al formato que espera calculateAmortization
    const amortizationInputs: AmortizationInputs = {
      vehiclePrice: data.vehicle_value,
      downPayment: data.down_payment_amount,
      insuranceAmount: data.insurance.amount,
      insuranceMode: data.insurance.mode,
      commissionMode: data.commission.mode,
      termMonths: data.term_months,
      annualRate: data.settings.annual_nominal_rate,
      annualRateWithIVA: data.settings.annual_nominal_rate * (1 + data.settings.iva),
      ivaRate: data.settings.iva,
      gpsMonthly: data.settings.gps_monthly,
      lifeInsuranceMonthly: 300, // Valor fijo por defecto
      openingFeePercentage: data.settings.opening_fee_rate
    };

    const result = calculateAmortization(amortizationInputs);

    // Convertir el resultado al formato esperado por el frontend
    const apiResult = {
      summary: {
        pmt_total_month2: result.summary.pmt_total_month2,
        principal_total: result.summary.totalToFinance,
        initial_outlay: result.summary.initialOutlay,
        first_payment_date: new Date(data.as_of).toISOString().split('T')[0],
        last_payment_date: result.schedule[result.schedule.length - 1]?.date || data.as_of,
        pmt_base: result.summary.pmt_base,
        opening_fee: result.summary.openingFee,
        opening_fee_iva: result.summary.openingFeeIVA,
        gps: data.settings.gps_monthly,
        gps_iva: data.settings.gps_monthly * data.settings.iva
      },
      schedule: result.schedule.map(item => ({
        k: item.k,
        date: item.date,
        saldo_ini: item.saldo_ini,
        interes: item.interes,
        iva_interes: item.iva_interes,
        capital: item.capital,
        pmt: item.pmt,
        gps_rent: item.gps_rent,
        gps_rent_iva: item.gps_rent_iva,
        insurance_monthly: item.insurance_monthly,
        life_insurance_monthly: item.life_insurance_monthly,
        pago_total: item.pago_total,
        saldo_fin: item.saldo_fin
      }))
    };

    return Response.json(apiResult);
  } catch (err) {
    console.error('API Error:', err);
    if (hasIssues(err)) {
      return new Response(JSON.stringify({ error: { code: "VALIDATION", message: "invalid body", issues: err.issues } }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: { code: "INTERNAL", message: "unexpected error" } }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}


