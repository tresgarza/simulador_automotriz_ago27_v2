"use client";
import { useState, useEffect } from "react";
import { Download, FileText, Share2, TrendingUp, Clock, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportScheduleXLSX } from "@/csv/export";
import { formatMXN } from "@/lib/utils";
import { generateProfessionalPDF } from "@/components/pdf/ProfessionalPDFGenerator";
import { useAuth } from "../../../lib/auth";

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
  schedule: Array<{
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
  }>;
};

type Term = 24 | 36 | 48 | 60;
type MatrixResult = {
  A: Record<Term, ApiResult>;
  B: Record<Term, ApiResult>;
  C: Record<Term, ApiResult>;
};

interface PlansMatrixProps {
  result: MatrixResult;
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
}

const tierConfig = [
  { 
    key: "A" as const, 
    label: "36%", 
    rate: "36%", 
    color: "#10B981",
    gradient: "from-emerald-500 to-emerald-600",
    description: "",
    icon: Star
  },
  { 
    key: "B" as const, 
    label: "40%", 
    rate: "40%", 
    color: "#F59E0B",
    gradient: "from-amber-500 to-orange-500",
    description: "",
    icon: TrendingUp
  },
  { 
    key: "C" as const, 
    label: "45%", 
    rate: "45%", 
    color: "#EF4444",
    gradient: "from-red-500 to-pink-500",
    description: "",
    icon: Clock
  },
];

const termLabels: Record<Term, string> = {
  24: "24 meses",
  36: "36 meses", 
  48: "48 meses",
  60: "60 meses"
};

// Animated Counter Component with smooth count-up animation
const AnimatedNumber = ({ value, format = true }: { value: number; format?: boolean }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    // Reset to 0 first
    setDisplayValue(0);
    
    // Start animation after a brief delay
    const startTimer = setTimeout(() => {
      let startTime: number;
      const duration = 1200; // 1.2 seconds for smoother animation
      
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-out cubic function for smooth deceleration
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentValue = Number((value * easeOutCubic).toFixed(2)); // Mantener 2 decimales sin redondear
        
        setDisplayValue(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, 100);

    return () => clearTimeout(startTimer);
  }, [value]);

  return (
    <span className="tabular-nums transition-all duration-200 ease-out">
      {format ? formatMXN(displayValue) : displayValue.toLocaleString()}
    </span>
  );
};

export function PlansMatrix({ 
  result, 
  vehicleValue = 405900, 
  downPayment = 121770, 
  insuranceAmount = 19500, 
  insuranceMode = "cash",
  commissionMode = "cash",
  clientName,
  clientPhone,
  clientEmail,
  vehicleBrand,
  vehicleModel,
  vehicleYear,
  vendorName,
  dealerAgency
}: PlansMatrixProps) {
  const { isAsesor, isAgency, user } = useAuth();
  
  // Determinar el primer tier disponible basado en los datos
  const availableTiers = Object.keys(result).filter(tier => 
    Object.keys(result[tier as keyof MatrixResult] || {}).length > 0
  ) as ("A" | "B" | "C")[];
  
  const [selectedTier, setSelectedTier] = useState<"A" | "B" | "C">(
    availableTiers.length > 0 ? availableTiers[0] : "A"
  );
  const [selectedTerm, setSelectedTerm] = useState<Term>(48);

  const currentResult = result[selectedTier]?.[selectedTerm];
  
  // Filtrar configuración de tiers para mostrar solo los disponibles
  const availableTierConfig = tierConfig.filter(tier => 
    availableTiers.includes(tier.key)
  );

  const handleExportXLSX = () => {
    const rows = (currentResult?.schedule || []).map((row) => ({
      Periodo: row.k,
      Fecha: row.date,
      "Saldo Inicial": row.saldo_ini,
      "Interés": row.interes,
      "IVA Interés": row.iva_interes,
      Capital: row.capital,
      "PMT Base": row.pmt,
      "Renta GPS": row.gps_rent,
      "IVA GPS": row.gps_rent_iva,
      "Pago Total": row.pago_total,
      "Saldo Final": row.saldo_fin,
    }));
    exportScheduleXLSX(rows);
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(currentResult, null, 2));
  };

  const handleGeneratePDF = async () => {
    try {
      // Determinar vendedor y agencia según el tipo de usuario
      let finalVendorName = vendorName || "—";
      let finalDealerAgency = dealerAgency || "—";

      if (isAgency && user) {
        // Para agencias: usar el nombre completo de la agencia del usuario logueado
        finalDealerAgency = user.agency_name || user.name || "—";
        // El vendorName viene del formulario
      }

      const pdfData = {
        summary: currentResult?.summary || {},
        schedule: currentResult?.schedule || [],
        vehicleValue,
        downPayment,
        insuranceAmount,
        insuranceMode,
        commissionMode,
        termMonths: selectedTerm,
        rateTier: selectedTier,
        includeAmortizationTable: isAsesor, // Solo asesores ven la tabla
        // Datos del cliente
        clientName: clientName || "—",
        clientPhone: clientPhone || "—",
        clientEmail: clientEmail || "—",
        // Datos del vehículo
        vehicleBrand: vehicleBrand || "—",
        vehicleModel: vehicleModel || "—",
        vehicleYear: vehicleYear?.toString() || "—",
        // Datos del vendedor/agencia
        vendorName: finalVendorName,
        dealerAgency: finalDealerAgency,
      };
      await generateProfessionalPDF(pdfData);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback: mostrar mensaje de error al usuario si es necesario
    }
  };

  // Calculate additional breakdown items usando la misma lógica del PDF
  const gpsMonthly = currentResult?.schedule?.[1]?.gps_rent || 400; // Fallback a 400 si no hay datos
  const minimumIncome = Math.round((currentResult?.summary?.pmt_total_month2 || 0) / 0.265);
  
  // Calcular seguro mensual si es financiado - usar factor 1.3047 como en PDF
  const insuranceMonthly = insuranceMode === 'financed' 
    ? Number(((insuranceAmount * 1.3047) / 12).toFixed(2)) // Factor correcto del PDF
    : 0;
  
  // Seguro de vida fijo
  const lifeInsurance = 300;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Tus Planes Disponibles</h2>
        <p className="text-white/80">Elige el nivel y plazo que mejor se adapte a ti</p>
      </div>

      {/* Tier Selection - Solo para Asesores */}
      {isAsesor && (
        <div className={`grid gap-2 md:gap-3 ${availableTierConfig.length === 1 ? 'grid-cols-1' : availableTierConfig.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {availableTierConfig.map((tier) => {
          const IconComponent = tier.icon;
          const isSelected = selectedTier === tier.key;
          return (
            <button
              key={tier.key}
              onClick={() => setSelectedTier(tier.key)}
              className={`relative p-3 md:p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                isSelected 
                  ? 'border-white bg-white/25 backdrop-blur shadow-xl scale-105' 
                  : 'border-white/30 bg-white/10 backdrop-blur hover:bg-white/20'
              }`}
            >
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${tier.gradient} mb-2`}>
                  <IconComponent className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <div className="text-white font-semibold text-sm md:text-base">{tier.label}</div>
              </div>
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          );
          })}
        </div>
      )}

      {/* Term Selection */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {([24, 36, 48, 60] as Term[]).map((term) => (
          <button
            key={term}
            onClick={() => setSelectedTerm(term)}
            className={`py-2 md:py-3 px-2 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
              selectedTerm === term
                ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-lg scale-105'
                : 'border-white/30 bg-white/10 text-white/80 hover:bg-white/20 hover:border-white/50'
            }`}
          >
            <div className="text-xs md:text-sm font-medium">{termLabels[term]}</div>
            <div className="text-xs opacity-75">
              {formatMXN(result[selectedTier]?.[term]?.summary?.pmt_total_month2 || 0)}
            </div>
          </button>
        ))}
      </div>

      {/* Main Result Card */}
      <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl"></div>
        
        <div className="relative z-10">
          {/* Payment Amount */}
          <div className="text-center mb-8">
            <div className="text-4xl md:text-6xl font-bold text-white mb-2 transition-all duration-500 ease-out">
              <AnimatedNumber value={currentResult?.summary?.pmt_total_month2 || 0} />
            </div>
            <div className="text-white/80 text-lg">Pago mensual</div>

          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Desembolso Inicial */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 text-lg">Desembolso Inicial</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/80">
                  <span>Enganche</span>
                  <span>{formatMXN(downPayment || 0)}</span>
                </div>
                {commissionMode === 'cash' && (
                  <div className="flex justify-between text-white/80">
                    <span>Comisión por apertura</span>
                    <span>{formatMXN((currentResult?.summary?.opening_fee || 0) + (currentResult?.summary?.opening_fee_iva || 0))}</span>
                  </div>
                )}
                {insuranceMode === 'cash' && (
                  <div className="flex justify-between text-white/80">
                    <span>Seguro del vehículo</span>
                    <span>{formatMXN(insuranceAmount || 0)}</span>
                  </div>
                )}
                <div className="h-px bg-white/20 my-3"></div>
                <div className="flex justify-between text-white font-semibold">
                  <span>Total inicial</span>
                  <span>{formatMXN(currentResult?.summary?.initial_outlay || 0)}</span>
                </div>
              </div>
            </div>

            {/* Pago Mensual */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 text-lg">Pago Mensual</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/80">
                  <span>Financiamiento auto</span>
                  <span>{formatMXN(currentResult?.schedule?.[0]?.pmt || currentResult?.summary?.pmt_base || 0)}</span>
                </div>
                {insuranceMonthly > 0 && (
                  <div className="flex justify-between text-white/80">
                    <span>Seguro del vehículo</span>
                    <span>{formatMXN(insuranceMonthly)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/80">
                  <span>Seguro de vida</span>
                  <span>{formatMXN(lifeInsurance)}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>GPS anti robo</span>
                  <span>{formatMXN(gpsMonthly)}</span>
                </div>
                <div className="h-px bg-white/20 my-3"></div>
                <div className="flex justify-between text-white font-semibold text-lg">
                  <span>Total mensual</span>
                  <span>{formatMXN(currentResult?.summary?.pmt_total_month2 || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Info */}
          <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
            <div className="text-center p-4 bg-white/10 rounded-xl">
              <div className="text-white/60">Monto financiado</div>
              <div className="text-white font-semibold text-lg">{formatMXN(currentResult?.summary?.principal_total || 0)}</div>
            </div>
            <div className="text-center p-4 bg-white/10 rounded-xl">
              <div className="text-white/60">Ingreso mínimo requerido</div>
              <div className="text-white font-semibold text-lg">{formatMXN(minimumIncome)}</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`grid gap-4 ${isAsesor ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'}`}>
            <Button
              variant="outline"
              className="w-full py-3 bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={() => handleGeneratePDF()}
            >
              <FileText className="w-4 h-4 mr-2" />
              Descargar PDF
            </Button>

            {/* Excel y JSON solo para Asesores */}
            {isAsesor && (
              <>
                <Button
                  variant="outline"
                  className="w-full py-3 bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={handleExportXLSX}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Excel
                </Button>

                <Button
                  variant="outline"
                  className="w-full py-3 bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={handleCopyJSON}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Copiar JSON
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
