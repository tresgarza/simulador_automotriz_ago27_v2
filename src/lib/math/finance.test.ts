import { describe, test, expect } from 'vitest';
import { computeQuote, pmtFixed, type Inputs, type ComputeSettings } from './finance';
import { nextQuincena } from '../dates/quincena';

describe('Finance Engine', () => {
  const baseSettings: ComputeSettings = {
    annual_nominal_rate: 0.45,
    iva: 0.16,
    opening_fee_rate: 0.03,
    gps_initial: 0,
    gps_monthly: 400,
    first_payment_rule: "next_quincena",
    day_count: "A360",
    finance_insurance_mode: "add_to_principal",
  };

  describe('PMT calculation', () => {
    test('should calculate PMT correctly for base case', () => {
      const principal = 284130;
      const rate = 0.45 / 12; // 3.75% monthly
      const periods = 48;
      
      const pmt = pmtFixed(principal, rate, periods);
      
      // Expected: ~12,850.09 based on PRD example
      expect(pmt).toBeCloseTo(12850.09, 2);
    });
  });

  describe('nextQuincena', () => {
    test('should return 15th when day <= 15', () => {
      const date = new Date('2025-08-11'); // PRD example
      const result = nextQuincena(date);
      expect(result.toISOString().slice(0, 10)).toBe('2025-08-15');
    });

    test('should return last day of month when day > 15', () => {
      const date = new Date('2025-08-20');
      const result = nextQuincena(date);
      expect(result.toISOString().slice(0, 10)).toBe('2025-08-31');
    });
  });

  describe('Complete quote calculation', () => {
    test('PRD example case (§8): $405,900 vehicle, 30% down, 48 months, cash insurance', () => {
      const inputs: Inputs = {
        vehicle_value: 405900,
        down_payment_amount: 121770, // 30%
        term_months: 48,
        insurance: { mode: "cash", amount: 19000 },
        as_of: "2025-08-11",
      };

      const result = computeQuote(inputs, baseSettings);

      // Principal calculations
      expect(result.summary.principal_financed).toBe(284130); // 405900 - 121770
      expect(result.summary.principal_total).toBe(284130); // No financed insurance

      // Opening fee: 3% of 284130 = 8523.90
      expect(result.summary.opening_fee).toBeCloseTo(8523.90, 2);
      expect(result.summary.opening_fee_iva).toBeCloseTo(1363.82, 2); // 8523.90 * 0.16

      // PMT calculation
      expect(result.summary.pmt_base).toBeCloseTo(12850.09, 2);

      // First payment date should be 2025-08-15 (4 days from 2025-08-11)
      expect(result.summary.first_payment_date).toBe('2025-08-15');

      // Check first period calculations
      const period1 = result.schedule[0];
      expect(period1.k).toBe(1);
      expect(period1.saldo_ini).toBe(284130);
      
      // Interest proration: 284130 * (0.45/360) * 5 = 1775.8125
      expect(period1.interes).toBeCloseTo(1775.81, 2);
      expect(period1.iva_interes).toBeCloseTo(284.13, 2); // 1775.81 * 0.16
      
      // Capital: PMT - Interest = 12850.09 - 1775.81 = 11074.28
      expect(period1.capital).toBeCloseTo(11074.28, 2);
      
      // GPS monthly: 400 + IVA = 464
      expect(period1.gps_rent).toBe(400);
      expect(period1.gps_rent_iva).toBe(64); // 400 * 0.16
      
      // Total payment includes GPS: PMT + IVA_interest + GPS_total
      expect(period1.pago_total).toBeCloseTo(13598.22, 2); // Actual computed value

      // Remaining balance: 284130 - 11074.28 = 273055.72
      expect(period1.saldo_fin).toBeCloseTo(273055.72, 2);

      // Check second period
      const period2 = result.schedule[1];
      expect(period2.k).toBe(2);
      expect(period2.saldo_ini).toBeCloseTo(273055.72, 2);
      
      // Normal monthly interest: 273055.72 * 0.0375 = 10239.59
      expect(period2.interes).toBeCloseTo(10239.59, 2);
      expect(period2.iva_interes).toBeCloseTo(1638.33, 2);
      
      // Total should include GPS: PMT + IVA_interest + GPS_total
      expect(period2.pago_total).toBeCloseTo(14952.42, 2); // Actual computed value
    });

    test('Different rate tiers should produce different PMTs', () => {
      const inputs: Inputs = {
        vehicle_value: 405900,
        down_payment_amount: 121770,
        term_months: 48,
        insurance: { mode: "cash", amount: 0 },
        as_of: "2025-08-11",
      };

      const tierA = computeQuote(inputs, { ...baseSettings, annual_nominal_rate: 0.36 });
      const tierB = computeQuote(inputs, { ...baseSettings, annual_nominal_rate: 0.40 });
      const tierC = computeQuote(inputs, { ...baseSettings, annual_nominal_rate: 0.45 });

      // Higher rates should produce higher PMTs
      expect(tierA.summary.pmt_base).toBeLessThan(tierB.summary.pmt_base);
      expect(tierB.summary.pmt_base).toBeLessThan(tierC.summary.pmt_base);

      // Approximate expected values from PRD v1.1 example
      expect(tierA.summary.pmt_base).toBeCloseTo(11245.23, 2);
      expect(tierB.summary.pmt_base).toBeCloseTo(11946.76, 2);
      expect(tierC.summary.pmt_base).toBeCloseTo(12850.09, 2);
    });

    test('Financed insurance should increase principal', () => {
      const inputs: Inputs = {
        vehicle_value: 405900,
        down_payment_amount: 121770,
        term_months: 48,
        insurance: { mode: "financed", amount: 18000 },
        as_of: "2025-08-11",
      };

      const result = computeQuote(inputs, baseSettings);

      // Principal should include financed insurance
      expect(result.summary.principal_total).toBe(302130); // 284130 + 18000
      
      // Opening fee should be calculated on total principal
      const expectedOpeningFee = 302130 * 0.03;
      expect(result.summary.opening_fee).toBeCloseTo(expectedOpeningFee, 2);

      // PMT should be higher than base case
      expect(result.summary.pmt_base).toBeGreaterThan(12850.09);
    });

    test('Final balance should be zero or near zero', () => {
      const inputs: Inputs = {
        vehicle_value: 405900,
        down_payment_amount: 121770,
        term_months: 48,
        insurance: { mode: "cash", amount: 0 },
        as_of: "2025-08-11",
      };

      const result = computeQuote(inputs, baseSettings);
      const lastPeriod = result.schedule[result.schedule.length - 1];
      
      // Final balance should be zero (or very close due to rounding)
      expect(Math.abs(lastPeriod.saldo_fin)).toBeLessThan(0.01);
    });
  });
});
