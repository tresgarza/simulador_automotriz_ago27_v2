export type InsuranceMode = "cash" | "financed";

export interface ComputeSettings {
  annual_nominal_rate: number; // TAN eg 0.45
  iva: number; // 0.16
  opening_fee_rate: number; // 0.03
  gps_initial: number; // 400 (installation fee)
  gps_monthly: number; // 400 (monthly rent)
  first_payment_rule: "next_quincena";
  day_count: "A360" | "ACT360"; // We will treat both as 360 base using real days for proration
  finance_insurance_mode: "add_to_principal" | "12m_subloan";
}

export interface Inputs {
  vehicle_value: number;
  down_payment_amount: number;
  term_months: number;
  insurance: { mode: InsuranceMode; amount: number };
  as_of: string; // ISO date
}

export interface PeriodRow {
  k: number;
  date: string; // ISO yyyy-mm-dd
  saldo_ini: number;
  interes: number;
  iva_interes: number;
  capital: number;
  pmt: number;
  gps_rent: number;
  gps_rent_iva: number;
  pago_total: number;
  saldo_fin: number;
}

export interface Summary {
  pmt_base: number;
  pmt_total_month2: number;
  first_payment_date: string;
  last_payment_date: string;
  principal_financed: number;
  principal_total: number;
  opening_fee: number;
  opening_fee_iva: number;
  gps: number;
  gps_iva: number;
  initial_outlay: number;
}

export interface ComputeResult {
  summary: Summary;
  schedule: PeriodRow[];
  inputs: Inputs & { settings: ComputeSettings };
}

import { formatISO, addMonths } from "date-fns";
import { nextQuincena, daysBetweenInclusiveStartExclusiveEnd, stripTime } from "../dates/quincena";

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function pmtFixed(principal: number, rMonthly: number, n: number): number {
  const num = principal * rMonthly;
  const den = 1 - Math.pow(1 + rMonthly, -n);
  return num / den;
}

export function computeQuote(inputs: Inputs, settings: ComputeSettings): ComputeResult {
  const { vehicle_value, down_payment_amount, term_months, insurance, as_of } = inputs;
  const { annual_nominal_rate, iva, opening_fee_rate, gps_initial, gps_monthly } = settings;

  const S0 = vehicle_value - down_payment_amount;
  const seg_fin = insurance.mode === "financed" ? insurance.amount : 0;
  const seg_cont = insurance.mode === "cash" ? insurance.amount : 0;
  const S0_total = S0 + seg_fin;

  const com_ap = round2(opening_fee_rate * S0_total);
  const com_ap_total = round2(com_ap * (1 + iva));
  const gps_inst_total = round2(gps_initial * (1 + iva));
  const initial_outlay = round2(down_payment_amount + com_ap_total + gps_inst_total + seg_cont);

  const r = annual_nominal_rate / 12;
  const PMT = round2(pmtFixed(S0_total, r, term_months));

  const t0 = stripTime(new Date(as_of));
  const t1 = nextQuincena(t0);
  const d = daysBetweenInclusiveStartExclusiveEnd(t0, t1);

  // GPS monthly amounts
  const gps_rent = round2(gps_monthly);
  const gps_rent_iva = round2(gps_monthly * iva);

  // Period 1 (prorrateo por días TAN/360)
  const interes1 = round2(S0_total * (annual_nominal_rate / 360) * d);
  const iva1 = round2(interes1 * iva);
  const capital1 = round2(PMT - interes1);
  const saldo1 = round2(S0_total - capital1);
  const pago_total1 = round2(PMT + iva1 + gps_rent + gps_rent_iva);

  const schedule: PeriodRow[] = [];
  schedule.push({
    k: 1,
    date: formatISO(t1, { representation: "date" }),
    saldo_ini: round2(S0_total),
    interes: interes1,
    iva_interes: iva1,
    capital: capital1,
    pmt: PMT,
    gps_rent,
    gps_rent_iva,
    pago_total: pago_total1,
    saldo_fin: saldo1,
  });

  let saldoPrev = saldo1;
  let datePrev = t1;
  for (let k = 2; k <= term_months; k++) {
    const interes = round2(saldoPrev * r);
    const iva_interes = round2(interes * iva);
    const capital = round2(PMT - interes);
    const saldo_fin = round2(saldoPrev - capital);
    const pago_total = round2(PMT + iva_interes + gps_rent + gps_rent_iva);
    const date = addMonths(datePrev, 1);
    schedule.push({
      k,
      date: formatISO(date, { representation: "date" }),
      saldo_ini: saldoPrev,
      interes,
      iva_interes,
      capital,
      pmt: PMT,
      gps_rent,
      gps_rent_iva,
      pago_total,
      saldo_fin,
    });
    saldoPrev = saldo_fin;
    datePrev = date;
  }

  // Ajuste final para cerrar saldo en cero (±0.05)
  const last = schedule[schedule.length - 1];
  const residual = round2(last.saldo_fin);
  if (Math.abs(residual) > 0.01) {
    const adjustedCapital = round2(last.capital + residual);
    const adjustedSaldoFin = round2(last.saldo_ini - adjustedCapital);
    last.capital = adjustedCapital;
    last.saldo_fin = adjustedSaldoFin;
  }

  const pmt_total_month2 = schedule[1] ? schedule[1].pago_total : schedule[0].pago_total;

  const summary: Summary = {
    pmt_base: PMT,
    pmt_total_month2: pmt_total_month2,
    first_payment_date: schedule[0].date,
    last_payment_date: schedule[schedule.length - 1].date,
    principal_financed: round2(S0),
    principal_total: round2(S0_total),
    opening_fee: com_ap,
    opening_fee_iva: round2(com_ap * iva),
    gps: settings.gps_initial,
    gps_iva: round2(settings.gps_initial * iva),
    initial_outlay,
  };

  return {
    summary,
    schedule,
    inputs: { ...inputs, settings },
  };
}


