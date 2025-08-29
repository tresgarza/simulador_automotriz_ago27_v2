"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { brand } from "@/styles/theme";
import { EnhancedQuoteForm, type EnhancedFormData } from "@/components/form/EnhancedQuoteForm";
import { SummaryCard } from "@/components/summary/SummaryCard";
import { LoginModal } from "@/components/auth/LoginModal";
import { UserMenu } from "@/components/auth/UserMenu";
import { AsesorDashboard } from "@/components/dashboard/AsesorDashboard";
import { useAuth } from "../../lib/auth";
import { LogIn, User, BarChart3 } from "lucide-react";

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

type Term = 24 | 36 | 48 | 60;
type MatrixResult = {
  A: Record<Term, ApiResult>;
  B: Record<Term, ApiResult>;
  C: Record<Term, ApiResult>;
};

export default function Home() {
  const [result, setResult] = useState<MatrixResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [formData, setFormData] = useState<EnhancedFormData | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const { user, isLoggedIn, isAsesor, isClient: authIsClient, getAvailableRates } = useAuth();

  // Evitar problemas de hidratación
  useEffect(() => {
    setIsClient(true);
  }, []);

  const getRateForTier = (tier: string): number => {
    switch (tier) {
      case "A": return 0.36;
      case "B": return 0.40;
      case "C": return 0.45;
      default: return 0.45;
    }
  };

  // Generar session ID para clientes anónimos
  const getSessionId = () => {
    if (typeof window !== 'undefined') {
      let sessionId = localStorage.getItem('session_id');
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('session_id', sessionId);
      }
      return sessionId;
    }
    return null;
  };

  const saveQuoteToDatabase = async (data: EnhancedFormData): Promise<string | null> => {
    try {
      const quoteData = {
        // Datos del usuario
        userId: user?.id || null,
        sessionId: !user ? getSessionId() : null,
        clientName: data.client_name,
        clientEmail: data.client_email,
        clientPhone: data.client_phone,
        agencyId: null, // Por ahora null, necesitamos obtener el agency_id real
        promoterCode: data.promoter_code,
        vendorName: data.vendor_name,
        originProcedencia: data.origin_procedencia,
        
        // Datos del vehículo
        vehicleBrand: data.vehicle_brand,
        vehicleModel: data.vehicle_model,
        vehicleYear: data.vehicle_year,
        vehicleType: data.vehicle_type,
        vehicleUsage: data.vehicle_usage,
        vehicleOrigin: data.vehicle_origin,
        serialNumber: data.serial_number,
        vehicleValue: data.vehicle_value,
        
        // Datos del crédito
        downPaymentAmount: data.down_payment_amount,
        insuranceMode: data.insurance_mode,
        insuranceAmount: data.insurance_amount,
        commissionMode: data.commission_mode,
        
        // Metadata
        ipAddress: null,
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : null
      };

      const response = await fetch('/api/quotes/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      if (response.ok) {
        const result = await response.json();
        return result.quote.id;
      }
    } catch (error) {
      console.error('Error saving quote:', error);
    }
    return null;
  };

  const saveSimulationsToDatabase = async (quoteId: string, results: MatrixResult) => {
    const availableRates = getAvailableRates();
    
    for (const tierCode of availableRates) {
      const tierResults = results[tierCode as keyof MatrixResult];
      
      for (const [termStr, apiResult] of Object.entries(tierResults)) {
        const termMonths = parseInt(termStr) as Term;
        
        try {
          const simulationData = {
            quoteId,
            tierCode,
            termMonths,
            
            // Resultados del resumen
            financedAmount: apiResult.summary.principal_total,
            openingFee: apiResult.summary.opening_fee,
            openingFeeIva: apiResult.summary.opening_fee_iva,
            totalToFinance: apiResult.summary.principal_total,
            monthlyPayment: apiResult.summary.pmt_base,
            initialOutlay: apiResult.summary.initial_outlay,
            pmtBase: apiResult.summary.pmt_base,
            pmtTotalMonth2: apiResult.summary.pmt_total_month2,
            
            // Fechas calculadas
            firstPaymentDate: apiResult.summary.first_payment_date,
            lastPaymentDate: apiResult.summary.last_payment_date,
            
            // Tabla de amortización
            amortizationSchedule: apiResult.schedule,
          };

          const response = await fetch('/api/simulations/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(simulationData),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error saving simulation:', errorData);
            console.error('📊 Simulation data that failed:', simulationData);
          } else {
            const result = await response.json();
            console.log('✅ Simulation saved successfully:', result);
          }
        } catch (error) {
          console.error('❌ Network error saving simulation:', error);
        }
      }
    }
  };

  const onSubmit = async (data: EnhancedFormData) => {
    setIsSubmitting(true);
    setShowResults(false);
    setFormData(data);
    
    try {
      // Guardar cotización en base de datos
      const quoteId = await saveQuoteToDatabase(data);
      if (quoteId) {
        setCurrentQuoteId(quoteId);
      }

      // Obtener tasas disponibles según el tipo de usuario
      const availableRates = getAvailableRates();
      const terms: Term[] = [24, 36, 48, 60];
      
      const tierPromises = availableRates.map(async (tier) => {
        const termResults = await Promise.all(
          terms.map(async (term) => {
            const body = {
              vehicle_value: data.vehicle_value,
              down_payment_amount: data.down_payment_amount,
              term_months: term,
              insurance: { mode: data.insurance_mode, amount: data.insurance_amount },
              commission: { mode: data.commission_mode },
              settings: {
                annual_nominal_rate: getRateForTier(tier),
                iva: 0.16,
                opening_fee_rate: 0.03,
                gps_initial: 0,
                gps_monthly: 400,
                first_payment_rule: "next_quincena" as const,
                day_count: "A360" as const,
                finance_insurance_mode: "add_to_principal" as const,
              },
              as_of: new Date().toISOString().slice(0, 10),
            };
            const res = await fetch("/api/quotes/compute", { 
              method: "POST", 
              headers: { "content-type": "application/json" }, 
              body: JSON.stringify(body) 
            });
            const json = await res.json();
            return [term, json] as const;
          })
        );
        const byTerm = termResults.reduce((acc, [term, r]) => {
          acc[term as Term] = r as ApiResult;
          return acc;
        }, {} as Record<Term, ApiResult>);
        return [tier, byTerm] as const;
      });
      
      const matrixEntries = await Promise.all(tierPromises);
      const matrix = matrixEntries.reduce((acc, [tier, map]) => {
        const key = tier as keyof MatrixResult;
        acc[key] = map as MatrixResult[typeof key];
        return acc;
      }, { 
        A: {} as Record<Term, ApiResult>, 
        B: {} as Record<Term, ApiResult>, 
        C: {} as Record<Term, ApiResult> 
      } as MatrixResult);
      
      setResult(matrix);
      setShowResults(true);

      // Guardar simulaciones en base de datos
      if (quoteId) {
        await saveSimulationsToDatabase(quoteId, matrix);
      }

    } catch (error) {
      console.error("Error calculating quote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginSuccess = () => {
    // Refresh para actualizar el estado de autenticación
    window.location.reload();
  };

  const gradient = useMemo(() => ({ background: brand.gradient }), []);

  // Mostrar dashboard si es asesor y está en modo dashboard
  if (showDashboard && isAsesor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setShowDashboard(false)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              ← Volver al Simulador
            </button>
            <UserMenu />
          </div>
        </div>
        <AsesorDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={gradient}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl p-6 sm:p-10">
        {/* Header con autenticación */}
        <header className="text-center text-white mb-12">
          {/* Top Bar con Login/User Menu */}
          <div className="flex justify-between items-center mb-8">
            <div></div> {/* Spacer */}
            <div className="flex items-center space-x-4">
              {isClient && isLoggedIn ? (
                <div className="flex items-center space-x-4">
                  {isAsesor && (
                    <button
                      onClick={() => setShowDashboard(true)}
                      className="flex items-center space-x-2 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-2 text-white hover:bg-white/20 transition-all"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                  )}
                  <UserMenu />
                </div>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center space-x-2 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-2 text-white hover:bg-white/20 transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </button>
              )}
            </div>
          </div>

          {/* Logo de Financiera Incentiva */}
          <div className="mb-8 flex justify-center">
            <Image
              src="/logo_fincentiva_letra_blanca_flecha_verde.png"
              alt="Financiera Incentiva"
              width={160}
              height={160}
              className="h-32 sm:h-40 w-auto object-contain"
            />
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Simula tu Crédito Automotriz
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            {!isClient || authIsClient 
              ? "Encuentra el plan perfecto para ti con las mejores tasas del mercado"
              : `Panel ${isAsesor ? "de Asesor" : "de Agencia"} - Gestiona cotizaciones profesionales`
            }
          </p>

          {/* Indicador de usuario actual */}
          {isClient && isLoggedIn && (
            <div className="mt-4 inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-2xl text-white">
              <User className="w-4 h-4 mr-2" />
              <span className="text-sm">
                Sesión activa como {isAsesor ? "Asesor" : "Agencia"}
              </span>
            </div>
          )}
        </header>

        <div className={`transition-all duration-1000 ease-in-out ${
          showResults ? 'grid grid-cols-1 lg:grid-cols-2 gap-8' : 'max-w-2xl mx-auto'
        }`}>
          {/* Form Section */}
          <div className={`transition-all duration-700 ${
            showResults ? 'transform scale-95' : 'transform scale-100'
          }`}>
            <EnhancedQuoteForm onSubmit={onSubmit} isSubmitting={isSubmitting} hasResults={showResults} />
          </div>

          {/* Results Section - Slides in from right */}
          <div className={`transition-all duration-700 ${
            showResults 
              ? 'opacity-100 transform translate-x-0' 
              : 'opacity-0 transform translate-x-full lg:hidden'
          }`}>
            <SummaryCard 
              result={result} 
              isComparative={true}
              vehicleValue={formData?.vehicle_value}
              downPayment={formData?.down_payment_amount}
              insuranceAmount={formData?.insurance_amount}
              insuranceMode={formData?.insurance_mode}
              commissionMode={formData?.commission_mode}
              clientName={formData?.client_name}
              clientPhone={formData?.client_phone}
              clientEmail={formData?.client_email}
              vehicleBrand={formData?.vehicle_brand}
              vehicleModel={formData?.vehicle_model}
              vehicleYear={formData?.vehicle_year}
              vendorName={formData?.vendor_name}
              dealerAgency={formData?.dealer_agency}
            />
          </div>
        </div>

        {/* Bottom CTA for mobile when no results */}
        {!showResults && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur border border-white/20 rounded-2xl text-white">
              <span className="text-sm">
                ✨ Calcula automáticamente A, B, C × 24, 36, 48, 60 meses
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}