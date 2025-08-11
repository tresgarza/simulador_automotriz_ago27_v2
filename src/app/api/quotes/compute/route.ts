import { NextRequest } from "next/server";
import { z } from "zod";
import { computeQuote, type ComputeSettings, type Inputs } from "@/lib/math/finance";

const InsuranceSchema = z.object({
  mode: z.enum(["cash", "financed"]),
  amount: z.number().nonnegative(),
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
    const result = computeQuote(
      {
        vehicle_value: data.vehicle_value,
        down_payment_amount: data.down_payment_amount,
        term_months: data.term_months,
        insurance: data.insurance as Inputs["insurance"],
        as_of: data.as_of,
      },
      data.settings as ComputeSettings,
    );
    return Response.json(result);
  } catch (err) {
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


