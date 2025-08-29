// Cálculo de amortización basado en lógica de Excel

import { PMT, roundTo2 } from './financial-utils';

export interface AmortizationInputs {
  vehiclePrice: number; // Precio del vehículo
  downPayment: number; // Enganche
  insuranceAmount: number; // Monto del seguro
  insuranceMode: 'financed' | 'cash'; // Si el seguro está financiado o se paga en efectivo
  commissionMode: 'financed' | 'cash'; // Si la comisión está financiada o se paga en efectivo
  termMonths: number; // Plazo en meses
  annualRate: number; // Tasa anual sin IVA (0.45 = 45%)
  annualRateWithIVA: number; // Tasa anual con IVA (0.522 = 52.2%)
  ivaRate: number; // Tasa de IVA (0.16 = 16%)
  gpsMonthly: number; // Renta mensual GPS
  lifeInsuranceMonthly: number; // Seguro de vida mensual
  openingFeePercentage: number; // Porcentaje de comisión por apertura (0.03 = 3%)
}

export interface AmortizationSchedule {
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
  insurance_monthly: number;
  life_insurance_monthly: number;
}

export interface AmortizationResult {
  summary: {
    financedAmount: number; // Monto financiado (vehiclePrice / 0.97)
    openingFee: number; // Comisión por apertura
    openingFeeIVA: number; // IVA de la comisión
    totalToFinance: number; // Total a financiar
    monthlyPayment: number; // Pago mensual constante
    initialOutlay: number; // Desembolso inicial
    pmt_base: number; // Pago base (sin extras)
    pmt_total_month2: number; // Pago total del mes 2
  };
  schedule: AmortizationSchedule[];
}

/**
 * Calcula la tabla de amortización completa usando la lógica de Excel
 */
export function calculateAmortization(inputs: AmortizationInputs): AmortizationResult {
  const {
    vehiclePrice,
    downPayment,
    insuranceAmount,
    insuranceMode,
    commissionMode,
    termMonths,
    annualRate,
    annualRateWithIVA,
    ivaRate,
    gpsMonthly,
    lifeInsuranceMonthly,
    openingFeePercentage
  } = inputs;

  // 1. Cálculo del monto a financiar según el modo de comisión
  const amountToFinance = vehiclePrice - downPayment; // 300,000 - 100,000 = 200,000
  
  // Calcular comisión
  const openingFee = roundTo2(amountToFinance * openingFeePercentage); // 3% del monto financiado
  const openingFeeIVA = roundTo2(openingFee * ivaRate); // IVA de la comisión
  
  // Monto financiado según el modo de comisión
  let financedAmount: number;
  if (commissionMode === 'financed') {
    // Si la comisión se financia, se incluye en el monto del crédito
    financedAmount = roundTo2(amountToFinance + openingFee); // 200,000 + 6,185.57 = 206,185.57
  } else {
    // Si la comisión se paga de contado, solo se financia el saldo del vehículo
    financedAmount = roundTo2(amountToFinance); // 200,000
  }

  // 2. Seguro de auto - SOLO el monto base se financia (sin factor ni IVA)
  const insuranceFinanced = insuranceMode === 'financed' ? insuranceAmount : 0;
  
  // 3. GPS con IVA
  const gpsIVA = roundTo2(gpsMonthly * ivaRate);

  // 4. Total a financiar = Monto financiado + Seguro base
  const totalToFinance = roundTo2(financedAmount + insuranceFinanced);
  
  // 5. Seguro mensual con factor (SOLO para el pago mensual)
  const insuranceMonthly = (insuranceFinanced * 1.3047) / 12; // 25,000 * 1.3047 / 12 = 2,718.125

  // 6. Pago mensual constante usando PMT (como Excel) - sobre el monto financiado SIN seguros
  const monthlyRateWithoutIVA = annualRate / 12;
  const monthlyPayment = roundTo2(Math.abs(PMT(monthlyRateWithoutIVA, termMonths, -financedAmount)));

  // IMPORTANTE: El PMT se calcula solo sobre el financedAmount (206,185.57)
  // Los seguros se agregan por separado al pago total, pero NO al flujo de efectivo para TIR

  // 7. Pago base (sin extras) - usando solo el monto financiado sin seguros
  const pmtBase = roundTo2(Math.abs(PMT(monthlyRateWithoutIVA, termMonths, -financedAmount)));

  // 7. Desembolso inicial
  const insuranceCash = insuranceMode === 'cash' ? insuranceAmount : 0;
  const commissionCash = commissionMode === 'cash' ? openingFee + openingFeeIVA : 0;
  const initialOutlay = roundTo2(downPayment + insuranceCash + commissionCash);

  // 8. Generar tabla de amortización
  const schedule: AmortizationSchedule[] = [];
  let currentBalance = financedAmount; // SOLO el monto financiado, no el total
  const startDate = new Date();

  // Calcular el pago del mes 2 para el resumen
  let _pmtTotalMonth2 = 0;

  for (let month = 1; month <= termMonths; month++) {
    // Fecha del pago (mes actual)
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(startDate.getMonth() + month - 1);

    // Interés del mes (sin IVA)
    const interest = roundTo2(currentBalance * monthlyRateWithoutIVA);

    // IVA del interés
    const interestIVA = roundTo2(interest * ivaRate);

    // Capital = lo que queda después de pagar intereses (del saldo del crédito)
    const capital = roundTo2(monthlyPayment - interest - interestIVA);

    // Saldo final
    const saldoFin = roundTo2(currentBalance - capital);

    // Pago total = PMT del crédito + seguros + GPS (sin IVA GPS para coincidir con imagen)
    const pagoTotal = roundTo2(
      monthlyPayment + // PMT del crédito (capital + interés + IVA)
      insuranceMonthly + // Seguro auto
      lifeInsuranceMonthly + // Seguro de vida
      gpsMonthly // GPS sin IVA para coincidir con los datos de la imagen
    );

    // Guardar el pago del mes 2 para el resumen
    if (month === 2) {
      _pmtTotalMonth2 = pagoTotal;
    }

    const scheduleItem: AmortizationSchedule = {
      k: month,
      date: paymentDate.toISOString().split('T')[0],
      saldo_ini: roundTo2(currentBalance),
      interes: interest,
      iva_interes: interestIVA,
      capital: capital,
      pmt: roundTo2(monthlyPayment),
      gps_rent: gpsMonthly,
      gps_rent_iva: gpsIVA,
      pago_total: pagoTotal,
      saldo_fin: saldoFin,
      insurance_monthly: insuranceMonthly,
      life_insurance_monthly: lifeInsuranceMonthly
    };

    schedule.push(scheduleItem);

    // Actualizar balance para el siguiente mes
    currentBalance = saldoFin;

    // Si el capital calculado es mayor que el saldo, ajustar
    if (saldoFin < 0.01) {
      scheduleItem.capital = roundTo2(scheduleItem.capital + saldoFin);
      scheduleItem.saldo_fin = 0;
      currentBalance = 0;
    }
  }

  // Los indicadores financieros (CAT, TIR) han sido removidos del PDF

  return {
    summary: {
      financedAmount,
      openingFee,
      openingFeeIVA,
      totalToFinance,
      monthlyPayment,
      initialOutlay,
      pmt_base: pmtBase,
      pmt_total_month2: _pmtTotalMonth2
    },
    schedule
  };
}
