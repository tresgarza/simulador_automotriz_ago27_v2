"use client";
import { Calculator } from "lucide-react";
import { PlansMatrix } from "./PlansMatrix";

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

type Term = 24 | 36 | 48;
type MatrixResult = {
  A: Record<Term, ApiResult>;
  B: Record<Term, ApiResult>;
  C: Record<Term, ApiResult>;
};

interface SummaryCardProps {
  result: ApiResult | ComparativeResult | MatrixResult | null;
  isComparative?: boolean;
  vehicleValue?: number;
  downPayment?: number;
  insuranceAmount?: number;
  insuranceMode?: string;
  commissionMode?: string;
  // Datos del cliente
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  // Datos del vehículo
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  // Datos del vendedor/agencia
  vendorName?: string;
  dealerAgency?: string;
  // IDs para tracking
  currentQuoteId?: string | null;
  selectedSimulationId?: string | null;
}

export function SummaryCard({
  result,
  isComparative = false,
  vehicleValue,
  downPayment,
  insuranceAmount,
  insuranceMode,
  commissionMode,
  clientName,
  clientPhone,
  clientEmail,
  vehicleBrand,
  vehicleModel,
  vehicleYear,
  vendorName,
  dealerAgency,
  currentQuoteId,
  selectedSimulationId
}: SummaryCardProps) {
  if (!result) {
    return (
      <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl p-8 shadow-2xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-2xl mb-4 shadow-lg">
            <Calculator className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Tus Planes</h2>
          <p className="text-white/80">Completa el formulario para ver todos los planes disponibles</p>
        </div>
      </div>
    );
  }

  // Always show matrix now - we compute all plans by default
  return (
    <PlansMatrix
      result={result as MatrixResult}
      vehicleValue={vehicleValue}
      downPayment={downPayment}
      insuranceAmount={insuranceAmount}
      insuranceMode={insuranceMode}
      commissionMode={commissionMode}
      clientName={clientName}
      clientPhone={clientPhone}
      clientEmail={clientEmail}
      vehicleBrand={vehicleBrand}
      vehicleModel={vehicleModel}
      vehicleYear={vehicleYear}
      vendorName={vendorName}
      dealerAgency={dealerAgency}
      currentQuoteId={currentQuoteId}
      selectedSimulationId={selectedSimulationId}
    />
  );
}
