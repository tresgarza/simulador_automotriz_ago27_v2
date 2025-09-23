"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Share2, TrendingUp, Clock, Star, CheckCircle, Check, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportScheduleXLSX } from "@/csv/export";
import { formatMXN } from "@/lib/utils";
import { generateProfessionalPDF } from "@/components/pdf/ProfessionalPDFGenerator";
import { useAuth, AuthService } from "../../../lib/auth";
import { AuthorizationService } from "../../../lib/authorization-service";
import { AuthorizationForm } from "../authorization/AuthorizationFormFullscreen";
import { CreditApplicationForm } from "../credit-application/CreditApplicationForm";

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
  // IDs para tracking
  currentQuoteId?: string | null;
  selectedSimulationId?: string | null;
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
  dealerAgency,
  currentQuoteId,
  selectedSimulationId
}: PlansMatrixProps) {
  const { isAsesor, isAgency, user } = useAuth();
  const router = useRouter();

  // Estado para controlar la confirmación de selección
  const [isSelectionConfirmed, setIsSelectionConfirmed] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Estado para el modal de autorización
  const [showAuthorizationForm, setShowAuthorizationForm] = useState(false);
  const [isRequestingAuthorization, setIsRequestingAuthorization] = useState(false);
  const [isAuthorizationSent, setIsAuthorizationSent] = useState(false);
  
  // Estado para el formulario de solicitud de crédito
  const [showCreditApplicationForm, setShowCreditApplicationForm] = useState(false);

  // Función para confirmar la selección
  const handleConfirmSelection = async () => {
    setIsConfirming(true);
    try {
      // Simular un pequeño delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSelectionConfirmed(true);
    } catch (error) {
      console.error('Error confirming selection:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  // Función para redirigir a la página de solicitud de crédito
  const handleRedirectToCreditApplication = () => {
    console.log('🔄 Redirigiendo a solicitud de crédito con parámetros:', {
      quoteId: currentQuoteId,
      simulationId: selectedSimulationId
    });
    
    // Construir URL con parámetros para pre-llenar
    const params = new URLSearchParams();
    if (currentQuoteId) {
      params.append('quote_id', currentQuoteId);
    }
    if (selectedSimulationId) {
      params.append('simulation_id', selectedSimulationId);
    }
    
    const url = `/solicitud-credito${params.toString() ? `?${params.toString()}` : ''}`;
    console.log('🔗 URL de redirección:', url);
    
    router.push(url);
  };
  
  // Determinar el primer tier disponible basado en los datos
  const availableTiers = Object.keys(result).filter(tier => 
    Object.keys(result[tier as keyof MatrixResult] || {}).length > 0
  ) as ("A" | "B" | "C")[];
  
  // Función para obtener el tier por defecto según el tipo de usuario
  const getDefaultTier = (currentTier?: "A" | "B" | "C"): "A" | "B" | "C" => {
    if (availableTiers.length === 0) return "A";
    
    // Para asesores, default a Tasa C (45%) solo en la inicialización
    if (user?.user_type === 'asesor' && availableTiers.includes("C") && !currentTier) {
      return "C";
    }
    
    // Si hay un tier actual y está disponible, mantenerlo
    if (currentTier && availableTiers.includes(currentTier)) {
      return currentTier;
    }
    
    // Para otros usuarios, usar el primer tier disponible
    return availableTiers[0];
  };

  const [selectedTier, setSelectedTier] = useState<"A" | "B" | "C">(() => {
    // Inicialización lazy para evitar problemas de dependencias circulares
    const initialTiers = Object.keys(result).filter(tier => 
      Object.keys(result[tier as keyof MatrixResult] || {}).length > 0
    ) as ("A" | "B" | "C")[];
    
    if (initialTiers.length === 0) return "A";
    // Siempre usar tasa C (45%) por defecto para todos los usuarios
    if (initialTiers.includes("C")) return "C";
    return initialTiers[0];
  });
  const [selectedTerm, setSelectedTerm] = useState<Term>(48);

  // Asegurarse de que se está utilizando un tier disponible
  // Para usuarios no asesores, siempre usar tasa C (45%)
  const effectiveTier = !isAsesor && availableTiers.includes("C") 
    ? "C" 
    : (availableTiers.includes(selectedTier) ? selectedTier : getDefaultTier());
  const currentResult = result[effectiveTier]?.[selectedTerm];

  // Solo actualizar tier si el tier actual no está disponible
  useEffect(() => {
    if (availableTiers.length > 0 && !availableTiers.includes(selectedTier)) {
      const defaultTier = getDefaultTier(selectedTier);
      console.log('🔄 Tier not available, switching from', selectedTier, 'to', defaultTier);
      setSelectedTier(defaultTier);
    }
  }, [availableTiers, selectedTier]);

  // Reset del estado solo cuando cambian los parámetros de simulación (no cuando cambia tier para asesores)
  useEffect(() => {
    // Solo resetear si cambian los datos de resultado (nueva simulación)
    setIsSelectionConfirmed(false);
    setIsAuthorizationSent(false);
    
    // Debug para verificar el cambio de tier
    console.log('🔄 Result data changed:', { 
      selectedTier, 
      selectedTerm, 
      effectiveTier,
      hasResult: !!result[selectedTier]?.[selectedTerm],
      availableTiers,
      resultKeys: Object.keys(result)
    });
  }, [result]); // Solo depender de 'result', no de selectedTier/selectedTerm
  
  // Filtrar configuración de tiers para mostrar solo los disponibles
  const availableTierConfig = tierConfig.filter(tier => 
    availableTiers.includes(tier.key)
  );

  const handleExportXLSX = async () => {
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

    const fileName = `amortizacion_${selectedTier}_${selectedTerm}meses.xlsx`;

    // Exportar Excel
    exportScheduleXLSX(rows);

    // Tracking de la exportación (si tenemos IDs)
    if (selectedSimulationId && currentQuoteId) {
      try {
        const trackingData = {
          simulation_id: selectedSimulationId,
          quote_id: currentQuoteId,
          export_type: 'excel',
          file_name: fileName,
          generated_by_user_id: user?.id || null,
          ip_address: null,
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : null
        };

        // Enviar a API de tracking (no bloquear la exportación si falla)
        fetch('/api/exports/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trackingData)
        }).catch(error => {
          console.warn('Error tracking Excel export:', error);
        });

      } catch (error) {
        console.warn('Error preparing Excel export tracking:', error);
      }
    }
  };

  const handleCopyJSON = async () => {
    const jsonData = JSON.stringify(currentResult, null, 2);
    const fileName = `simulacion_${selectedTier}_${selectedTerm}meses.json`;

    // Copiar al portapapeles
    await navigator.clipboard.writeText(jsonData);

    // Tracking de la exportación (si tenemos IDs)
    if (selectedSimulationId && currentQuoteId) {
      try {
        const trackingData = {
          simulation_id: selectedSimulationId,
          quote_id: currentQuoteId,
          export_type: 'json',
          file_name: fileName,
          generated_by_user_id: user?.id || null,
          ip_address: null,
          user_agent: typeof window !== 'undefined' ? navigator.userAgent : null
        };

        // Enviar a API de tracking (no bloquear la copia si falla)
        fetch('/api/exports/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(trackingData)
        }).catch(error => {
          console.warn('Error tracking JSON export:', error);
        });

      } catch (error) {
        console.warn('Error preparing JSON export tracking:', error);
      }
    }
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
        // IDs para tracking
        simulationId: selectedSimulationId || undefined,
        quoteId: currentQuoteId || undefined,
        generatedByUserId: user?.id
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

  // Función para solicitar autorización
  const handleRequestAuthorization = async () => {
    setIsRequestingAuthorization(true);
    try {
      console.log('🔍 IDs disponibles:', { selectedSimulationId, currentQuoteId });
      
      // Intentar encontrar los IDs correctos basados en la selección actual
      let finalSimulationId = selectedSimulationId;
      let finalQuoteId = currentQuoteId;
      
      // Si no tenemos IDs, intentar buscarlos en base al cliente y selección
      if (!finalSimulationId || !finalQuoteId) {
        console.log('🔍 Buscando IDs de simulación para:', { 
          clientName, 
          selectedTier, 
          selectedTerm, 
          vehicleBrand, 
          vehicleModel 
        });
        
        // Buscar la simulación más reciente que coincida
        try {
          const searchResponse = await fetch(`/api/simulations/find?client_name=${encodeURIComponent(clientName || '')}&tier=${selectedTier}&term=${selectedTerm}&vehicle_brand=${encodeURIComponent(vehicleBrand || '')}`);
          
          if (searchResponse.ok) {
            const searchResult = await searchResponse.json();
            if (searchResult.simulation_id) {
              finalSimulationId = searchResult.simulation_id;
              finalQuoteId = searchResult.quote_id;
              console.log('✅ IDs encontrados via API:', { finalSimulationId, finalQuoteId });
            }
          }
        } catch (error) {
          console.warn('⚠️ Error buscando IDs:', error);
        }
      }
      
      // Crear solicitud con IDs reales o básica como fallback
      const authRequest = {
        simulation_id: finalSimulationId,
        quote_id: finalQuoteId,
        priority: finalSimulationId ? 'medium' : 'high', // Alta prioridad si no hay simulación
        client_comments: `Solicitud de autorización para ${selectedTier}-${selectedTerm} meses. Datos del vehículo: ${vehicleBrand} ${vehicleModel} ${vehicleYear}. Valor: $${vehicleValue?.toLocaleString()}`,
        risk_level: 'medium',
        created_by_user_id: user?.id,
        // Datos básicos disponibles
        client_name: clientName || 'Cliente no especificado',
        client_email: clientEmail,
        client_phone: clientPhone,
        vehicle_brand: vehicleBrand,
        vehicle_model: vehicleModel,
        vehicle_year: vehicleYear,
        vehicle_value: vehicleValue,
        requested_amount: currentResult?.summary?.principal_total || vehicleValue,
        monthly_payment: currentResult?.summary?.pmt_total_month2 || 0,
        term_months: selectedTerm,
        agency_name: dealerAgency || vendorName,
        dealer_name: vendorName,
        internal_notes: finalSimulationId 
          ? `Solicitud conectada a simulación ${finalSimulationId}`
          : 'Solicitud creada sin simulación guardada - requiere revisión manual'
      };

      console.log('📤 Enviando solicitud con datos:', authRequest);

      const response = await fetch('/api/authorization-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authRequest)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al crear solicitud de autorización');
      }

      console.log('✅ Solicitud de autorización creada:', result.authorization_request);
      setIsAuthorizationSent(true);
      
      if (finalSimulationId) {
        alert(`✅ Solicitud de autorización enviada exitosamente!
        
ID: ${result.authorization_request?.id}
Simulación: ${finalSimulationId}
Cotización: ${finalQuoteId}
        
Será revisada por un asesor.`);
      } else {
        alert('✅ Solicitud de autorización enviada exitosamente! Será revisada por un asesor.');
      }
      
    } catch (error) {
      console.error('❌ Error creating authorization request:', error);
      alert('Error al crear la solicitud de autorización: ' + (error as Error).message);
    } finally {
      setIsRequestingAuthorization(false);
    }
  };

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
          const isSelected = effectiveTier === tier.key;
          return (
            <button
              key={tier.key}
              onClick={() => {
                console.log(`🖱️ Clicking tier ${tier.key} (current: ${selectedTier}, available: ${availableTiers.join(', ')})`);
                console.log(`📊 Has data for ${tier.key}:`, !!result[tier.key]?.[selectedTerm]);
                setSelectedTier(tier.key);
                
                // Forzar actualización del estado
                setTimeout(() => {
                  console.log(`✅ Tier after click: ${tier.key}, state should be:`, tier.key);
                }, 100);
              }}
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
        {(AuthService.getAvailableTerms() as Term[]).map((term) => (
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
              {formatMXN(result[effectiveTier]?.[term]?.summary?.pmt_total_month2 || 0)}
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

                     {/* Sección de Resumen Financiero eliminada - no corresponde al simulador */}

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
          <div className="space-y-4">
            {!isSelectionConfirmed ? (
              /* Botón de confirmación */
              <div className="text-center">
                <Button
                  onClick={handleConfirmSelection}
                  disabled={isConfirming}
                  className="w-full py-4 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isConfirming ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Confirmando...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 mr-3" />
                      CONFIRMAR SELECCIÓN
                    </div>
                  )}
                </Button>
                <p className="text-white/60 text-sm mt-2">
                  Confirma para guardar los datos y acceder a las opciones de descarga
                </p>
              </div>
            ) : !isAuthorizationSent ? (
              /* Botón de Solicitar Autorización después de confirmar */
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 bg-green-500/20 border border-green-400 rounded-xl text-green-100 mb-4">
                  <Check className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Selección confirmada - Datos guardados en Supabase</span>
                </div>
                
                <Button
                  onClick={handleRequestAuthorization}
                  disabled={isRequestingAuthorization}
                  className="w-full py-4 px-8 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
                >
                  {isRequestingAuthorization ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Enviando solicitud...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FileCheck className="w-6 h-6 mr-3" />
                      SOLICITAR AUTORIZACIÓN
                    </div>
                  )}
                </Button>
                <p className="text-white/60 text-sm mb-6">
                  Envía tu solicitud para revisión por un asesor especializado
                </p>

                {/* Botón de Solicitud de Crédito */}
                <div className="mb-6">
                  <Button
                    onClick={handleRedirectToCreditApplication}
                    className="w-full py-4 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-center justify-center">
                      <FileText className="w-6 h-6 mr-3" />
                      LLENAR SOLICITUD DE CRÉDITO
                    </div>
                  </Button>
                  <p className="text-white/60 text-sm mt-2 text-center">
                    Completa tu solicitud digital y descarga el PDF
                  </p>
                </div>

                {/* Botones de descarga disponibles también */}
                <div className="border-t border-white/10 pt-6">
                  <p className="text-white/60 text-sm mb-4 text-center">
                    O también puedes descargar tu cotización:
                  </p>
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
            ) : (
              /* Estado final - Autorización enviada */
              <>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center px-4 py-2 bg-green-500/20 border border-green-400 rounded-xl text-green-100 mb-2">
                    <Check className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Selección confirmada - Datos guardados en Supabase</span>
                  </div>
                  <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 border border-blue-400 rounded-xl text-blue-100">
                    <FileCheck className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">¡Solicitud de autorización enviada exitosamente!</span>
                  </div>
                  <p className="text-white/70 text-sm mt-4">
                    Tu solicitud será revisada por un asesor. Te contactaremos pronto.
                  </p>
                </div>

                {/* Botón de Solicitud de Crédito - MANTENER VISIBLE */}
                <div className="mb-6">
                  <Button
                    onClick={handleRedirectToCreditApplication}
                    className="w-full py-4 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-lg rounded-2xl shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-center justify-center">
                      <FileText className="w-6 h-6 mr-3" />
                      LLENAR SOLICITUD DE CRÉDITO
                    </div>
                  </Button>
                  <p className="text-white/60 text-sm mt-2 text-center">
                    Completa tu solicitud digital con los datos ya guardados
                  </p>
                </div>

                {/* Botones de descarga después de enviar autorización */}
                <div className="border-t border-white/10 pt-6">
                  <p className="text-white/60 text-sm mb-4 text-center">
                    También puedes descargar tu cotización:
                  </p>
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Formulario de Solicitud de Crédito */}
      {showCreditApplicationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Solicitud de Crédito Digital</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowCreditApplicationForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              <CreditApplicationForm
                quoteId={currentQuoteId || undefined}
                simulationId={selectedSimulationId || undefined}
                onSuccess={(application) => {
                  setShowCreditApplicationForm(false)
                  alert(`Solicitud enviada exitosamente. Folio: ${application.folio_number}`)
                }}
                onCancel={() => setShowCreditApplicationForm(false)}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
