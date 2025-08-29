import { NextRequest } from "next/server";
import { z } from "zod";
import { computeQuote, type Inputs, type ComputeSettings } from "@/lib/math/finance";

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

    // Usar el sistema original que funcionaba correctamente
    const inputs: Inputs = {
      vehicle_value: data.vehicle_value,
      down_payment_amount: data.down_payment_amount,
      term_months: data.term_months,
      insurance: { mode: data.insurance.mode, amount: data.insurance.amount },
      as_of: data.as_of
    };

    const settings: ComputeSettings = {
      annual_nominal_rate: data.settings.annual_nominal_rate,
      iva: data.settings.iva,
      opening_fee_rate: data.settings.opening_fee_rate,
      gps_initial: data.settings.gps_initial,
      gps_monthly: data.settings.gps_monthly,
      first_payment_rule: "next_quincena",
      day_count: data.settings.day_count,
      finance_insurance_mode: data.settings.finance_insurance_mode
    };

    const result = computeQuote(inputs, settings);

    // El resultado ya está en el formato correcto
    return Response.json(result);
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


