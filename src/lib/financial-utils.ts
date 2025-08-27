// Funciones financieras para cálculos de amortización

/**
 * Calcula el pago mensual constante usando la fórmula PMT de Excel
 * PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
 * @param rate - Tasa de interés mensual
 * @param nper - Número de periodos
 * @param pv - Valor presente (monto a financiar, negativo)
 * @returns Pago mensual
 */
export function PMT(rate: number, nper: number, pv: number): number {
  if (rate === 0) return -pv / nper;

  const pvif = Math.pow(1 + rate, nper);
  return (pv * rate * pvif) / (pvif - 1);
}

/**
 * Calcula la Tasa Interna de Retorno usando el método de Newton-Raphson
 * @param cashFlow - Array de flujos de efectivo (negativo para salidas, positivo para entradas)
 * @param guess - Estimación inicial (opcional, default 0.1)
 * @returns TIR
 */
export function IRR(cashFlow: number[], guess: number = 0.1): number {
  const MAX_ITER = 2000; // Aún más iteraciones para mayor precisión
  const PRECISION = 1e-12; // Mayor precisión para coincidir con Excel

  let rate = guess;

  for (let i = 0; i < MAX_ITER; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let j = 0; j < cashFlow.length; j++) {
      const factor = Math.pow(1 + rate, j);
      npv += cashFlow[j] / factor;
      if (j > 0) {
        dnpv -= j * cashFlow[j] / Math.pow(1 + rate, j + 1);
      }
    }

    if (Math.abs(dnpv) < PRECISION) {
      break; // Evitar división por cero
    }

    const newRate = rate - npv / dnpv;

    if (Math.abs(newRate - rate) < PRECISION) {
      return newRate;
    }

    rate = newRate;

    // Evitar valores negativos extremos
    if (rate < -0.99) {
      rate = -0.99;
    }
  }

  return rate;
}

/**
 * Calcula los días entre dos fechas usando el método 30/360 de Excel
 * @param startDate - Fecha inicial
 * @param endDate - Fecha final
 * @returns Número de días
 */
export function calculateDays360(startDate: Date, endDate: Date): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  let startDay = start.getDate();
  const startMonth = start.getMonth() + 1;
  const startYear = start.getFullYear();

  let endDay = end.getDate();
  const endMonth = end.getMonth() + 1;
  const endYear = end.getFullYear();

  // Ajuste del método 30/360
  if (startDay === 31) startDay = 30;
  if (endDay === 31 && startDay >= 30) endDay = 30;

  return (endYear - startYear) * 360 + (endMonth - startMonth) * 30 + (endDay - startDay);
}

/**
 * Calcula el interés usando días exactos y tasa anual
 * @param principal - Capital
 * @param annualRate - Tasa anual
 * @param startDate - Fecha inicial
 * @param endDate - Fecha final
 * @returns Interés calculado
 */
export function calculateInterest(principal: number, annualRate: number, startDate: Date, endDate: Date): number {
  const days = calculateDays360(startDate, endDate);
  return principal * annualRate * days / 360;
}

/**
 * Redondea a 2 decimales
 * @param value - Valor a redondear
 * @returns Valor redondeado
 */
export function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calcula el Costo Anual Total (CAT)
 * @param irr - Tasa Interna de Retorno
 * @returns CAT efectivo anual
 */
export function calculateCAT(irr: number): number {
  return Math.pow(1 + irr, 12) - 1;
}
