"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FileCheck, Users, Search, Filter, Eye, CheckCircle, XCircle, Clock, ChevronRight, Grid, List, Trash2, UserCheck, AlertTriangle, Calendar, User, Home, LogOut, Building2, TrendingUp, Activity } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../../lib/auth";
import { SimulationService, SimulationWithQuote } from "../../../lib/simulation-service";
import { AuthorizationService, AuthorizationRequest as ServiceAuthorizationRequest } from "../../../lib/authorization-service";
import { AuthorizationRequest as SupabaseAuthorizationRequest } from "../../../lib/supabase";
import { formatMXN, cn } from "@/lib/utils";
import { AuthorizationForm, calculateFormProgress } from "../../components/authorization/AuthorizationFormFullscreen";
import { generateProfessionalAuthorizationPDF, ProfessionalAuthorizationData } from "../../lib/professional-authorization-pdf";
import { generateClientCreditAuthorizationPDF, ClientCreditAuthorizationData } from "../../lib/client-credit-authorization-pdf";

interface ExtendedAuthorizationRequest extends ServiceAuthorizationRequest {
  simulation?: SimulationWithQuote | null;
  createdAt?: string;
  updatedAt?: string;
  reviewerId?: string;
  reviewerName?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  clientComments?: string;
  internalNotes?: string;
  approvalNotes?: string;
  competitors_data?: Array<{ name: string; price: number }>;
}

export default function AutorizacionesPage() {
  const { user, isAsesor, logout } = useAuth();
  const [requests, setRequests] = useState<ExtendedAuthorizationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ExtendedAuthorizationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_review' | 'advisor_approved' | 'internal_committee' | 'partners_committee' | 'approved' | 'rejected' | 'cancelled'>('all');
  const [selectedRequest, setSelectedRequest] = useState<ExtendedAuthorizationRequest | null>(null);
  const [showAuthorizationForm, setShowAuthorizationForm] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [authDetermined, setAuthDetermined] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards'); // Default to cards view
  const hasInitiatedLoading = useRef(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const filterRequests = useCallback(() => {
    if (!isHydrated || isLoading || requests.length === 0) return; // Don't filter during hydration, loading, or if no requests

    let filtered = requests;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(request => {
        const quote = request.simulation?.quote;
        // Si hay datos de simulación, usar esos; si no, usar datos directos de la solicitud
        const clientName = quote?.client_name || request.clientComments?.split('.')[0] || 'Cliente Anónimo';
        const clientEmail = quote?.client_email || '';
        const clientPhone = quote?.client_phone || '';
        const vehicleBrand = quote?.vehicle_brand || '';
        const vehicleModel = quote?.vehicle_model || '';

        return (
          clientName.toLowerCase().includes(searchLower) ||
          clientEmail.toLowerCase().includes(searchLower) ||
          clientPhone.includes(searchTerm) ||
          vehicleBrand.toLowerCase().includes(searchLower) ||
          vehicleModel.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter, isHydrated, isLoading]);

  const loadAuthorizationRequests = useCallback(async () => {
    // Temporalmente removemos la validación de autenticación para debugging
    // if (!user || !isAsesor || !isHydrated || isLoadingData) return;

    setIsLoadingData(true);
    setIsLoading(true);
    try {
      // Cargar solicitudes de autorización reales de la base de datos
      const response = await fetch('/api/authorization-requests?limit=100');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al cargar solicitudes de autorización');
      }

      // Debug: Log de datos del API antes del mapeo
      console.log('🔍 API Response - First Request:', {
        first_request: result.authorization_requests[0],
        simulation_data: result.authorization_requests[0]?.z_auto_simulations,
        pmt_total_month2: result.authorization_requests[0]?.z_auto_simulations?.pmt_total_month2
      });

      // Transformar los datos para que coincidan con la interfaz ExtendedAuthorizationRequest
      const authorizationRequests: ExtendedAuthorizationRequest[] = result.authorization_requests.map((authReq: any) => {
        console.log('🔄 Mapping request:', {
          id: authReq.id,
          has_simulation: !!authReq.z_auto_simulations,
          pmt_total_month2_raw: authReq.z_auto_simulations?.pmt_total_month2,
          monthly_payment_raw: authReq.z_auto_simulations?.monthly_payment
        });
        
        return {
        id: authReq.id,
        simulation: authReq.z_auto_simulations ? {
          id: authReq.z_auto_simulations.id,
          tier_code: authReq.z_auto_simulations.tier_code,
          term_months: authReq.z_auto_simulations.term_months,
          monthly_payment: authReq.z_auto_simulations.monthly_payment,
          pmt_total_month2: authReq.z_auto_simulations.pmt_total_month2,
          total_to_finance: authReq.z_auto_simulations.total_to_finance,
          financed_amount: authReq.z_auto_simulations.financed_amount,
          calculated_at: authReq.z_auto_simulations.calculated_at,
          quote: authReq.z_auto_quotes ? {
            id: authReq.z_auto_quotes.id,
            client_name: authReq.z_auto_quotes.client_name,
            client_email: authReq.z_auto_quotes.client_email,
            client_phone: authReq.z_auto_quotes.client_phone,
            vehicle_brand: authReq.z_auto_quotes.vehicle_brand,
            vehicle_model: authReq.z_auto_quotes.vehicle_model,
            vehicle_year: authReq.z_auto_quotes.vehicle_year,
            vehicle_value: authReq.z_auto_quotes.vehicle_value,
            created_at: authReq.z_auto_quotes.created_at
          } : null
        } : null,
        status: authReq.status,
        createdAt: authReq.created_at,
        updatedAt: authReq.updated_at,
        reviewerId: authReq.assigned_to_user_id,
        reviewerName: authReq.assigned_user?.name,
        priority: authReq.priority,
        riskLevel: authReq.risk_level,
        clientComments: authReq.client_comments,
        internalNotes: authReq.internal_notes,
        approvalNotes: authReq.approval_notes,
        // Campos directos de la solicitud
        client_name: authReq.client_name,
        client_email: authReq.client_email,
        client_phone: authReq.client_phone,
        vehicle_brand: authReq.vehicle_brand,
        vehicle_model: authReq.vehicle_model,
        vehicle_year: authReq.vehicle_year,
        vehicle_value: authReq.vehicle_value,
        monthly_payment: authReq.monthly_payment,
        requested_amount: authReq.requested_amount,
        term_months: authReq.term_months,
        authorization_data: authReq.authorization_data
        };
      });

      setRequests(authorizationRequests);
    } catch (error) {
      console.error('Error loading authorization requests:', error);
      setRequests([]); // Set empty array on error to prevent infinite loading
    } finally {
      setIsLoading(false);
      setIsLoadingData(false);
    }
  }, []); // Removemos dependencias temporales

  useEffect(() => {
    if (isHydrated) {
      setAuthDetermined(true);

      // Load requests immediately for debugging (temporalmente sin autenticación)
      if (!hasInitiatedLoading.current) {
        hasInitiatedLoading.current = true;
        loadAuthorizationRequests();
      }
    }
  }, [isHydrated]); // Simplified dependencies

  // Reset loading ref when user changes
  useEffect(() => {
    hasInitiatedLoading.current = false;
  }, [user?.id]);

  useEffect(() => {
    if (isHydrated) {
    filterRequests();
    }
  }, [filterRequests, isHydrated]);

  const handleAuthorizeRequest = (request: ExtendedAuthorizationRequest) => {
    // Advertencia especial si la solicitud está en comité de socios
    if (request.status === 'partners_committee') {
      const confirmEdit = confirm(
        `⚠️ ADVERTENCIA: Esta solicitud está en Comité de Socios\n\n` +
        `Si realiza cualquier cambio al formulario:\n` +
        `• La solicitud regresará automáticamente a "En Revisión"\n` +
        `• Deberá pasar de nuevo por Comité Interno\n` +
        `• Y luego nuevamente por Comité de Socios\n\n` +
        `¿Está seguro que desea continuar?`
      );
      
      if (!confirmEdit) {
        return;
      }
    }
    
    setSelectedRequest(request);
    setShowAuthorizationForm(true);
  };

  const handleCloseAuthorizationForm = useCallback(() => {
    setSelectedRequest(null);
    setShowAuthorizationForm(false);
    // Only reload if we're not already loading
    if (!isLoadingData) {
    loadAuthorizationRequests();
    }
  }, [isLoadingData, loadAuthorizationRequests]);

  // Funciones de workflow
  const handleClaimRequest = async (requestId: string) => {
    try {
      if (!user?.id) {
        alert('Error: Usuario no autenticado');
        return;
      }
      
      // Confirmar reclamación
      const confirmMessage = `¿Estás seguro de reclamar esta solicitud?\n\nAl reclamarla:\n• Se asignará exclusivamente a ti\n• Otros asesores no podrán trabajar en ella\n• Serás responsable de completar el proceso`;
      
      if (!confirm(confirmMessage)) {
        return;
      }
      
      console.log('🎯 Reclamando solicitud:', { requestId, advisorId: user.id });
      
      const result = await AuthorizationService.claimAuthorizationRequest(requestId, user.id);
      
      if (result.success) {
        console.log('✅ Solicitud reclamada exitosamente');
        loadAuthorizationRequests(); // Recargar datos
        
        // Mostrar mensaje de éxito más informativo
        alert(`✅ Solicitud reclamada exitosamente!\n\n• Ahora está asignada a ti\n• Puedes completar el formulario de autorización\n• Estado cambiado a "En Revisión"`);
      } else {
        console.error('❌ Error al reclamar:', result.error);
        alert('Error al reclamar la solicitud: ' + result.error);
      }
    } catch (error) {
      console.error('💥 Exception al reclamar solicitud:', error);
      alert('Error al reclamar la solicitud: ' + (error as Error).message);
    }
  };



  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('¿Motivo del rechazo?');
    if (!reason) return;
    
    try {
      if (!user?.id) {
        alert('Error: Usuario no autenticado');
        return;
      }
      
      const result = await AuthorizationService.rejectAuthorizationRequest(requestId, user.id, reason);
      
      if (result.success) {
        loadAuthorizationRequests(); // Recargar datos
        alert('✅ Solicitud rechazada exitosamente');
      } else {
        alert('Error al rechazar la solicitud: ' + result.error);
      }
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      alert('Error al rechazar la solicitud');
    }
  };

  const handleDiscardRequest = async (requestId: string) => {
    if (!confirm('¿Estás seguro de que deseas descartar esta solicitud?')) return;
    
    try {
      if (!user?.id) {
        alert('Error: Usuario no autenticado');
        return;
      }
      
      const result = await AuthorizationService.rejectAuthorizationRequest(requestId, user.id, 'Solicitud descartada por el asesor');
      
      if (result.success) {
        loadAuthorizationRequests(); // Recargar datos
        alert('✅ Solicitud descartada exitosamente');
      } else {
        alert('Error al descartar la solicitud: ' + result.error);
      }
    } catch (error) {
      console.error('Error al descartar solicitud:', error);
      alert('Error al descartar la solicitud');
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/'; // Redirigir al inicio
  };

  const handleApproveAsAdvisor = async (requestId: string) => {
    try {
      if (!user?.id) {
        alert('Error: Usuario no autenticado');
        return;
      }
      
      // Verificar que el formulario esté completo
      const request = requests.find(r => r.id === requestId);
      if (request?.authorization_data) {
        const progress = calculateFormProgress(request.authorization_data);
        if (!progress.isComplete) {
          alert(`⚠️ No se puede aprobar y enviar a comité\n\nEl formulario está ${progress.percentage}% completo.\nDebe estar 100% completo para enviar al comité.\n\nCampos faltantes:\n${progress.missingFields.slice(0, 3).join('\n')}`);
          return;
        }
      } else {
        alert('⚠️ No se puede aprobar y enviar a comité\n\nDebe completar el formulario de autorización antes de enviar.');
        return;
      }
      
      // Solicitar comentarios adicionales
      const advisorNotes = prompt('Comentarios como asesor (opcional):');
      
      const confirmMessage = `¿Aprobar esta solicitud y enviar al Comité Interno?\n\n✅ ACCIÓN DEL ASESOR:\n• Usted aprueba la solicitud como asesor\n• Se envía automáticamente al comité interno\n• Puede seguir editando el formulario si es necesario\n• El comité tomará la decisión final`;
      
      if (!confirm(confirmMessage)) return;
      
      console.log('✅ Aprobando como asesor y enviando a comité:', { requestId, userId: user.id, advisorNotes });
      
      // Usar la API REST directamente para cambiar estado a internal_committee
      const { request: updatedRequest, error } = await AuthorizationService.updateAuthorizationRequest(requestId, {
        status: 'internal_committee',
        advisor_reviewed_by: user.id,
        advisor_reviewed_at: new Date().toISOString(),
        internal_notes: `${advisorNotes || 'Aprobado por asesor y enviado a comité interno'}\n\nAsesor: ${user.name} - Aprobado y enviado a comité interno el ${new Date().toLocaleString()}`
      });
      
      if (!error) {
        console.log('✅ Solicitud aprobada por asesor y enviada al comité interno');
        loadAuthorizationRequests(); // Recargar datos
        alert(`✅ Solicitud aprobada y enviada al Comité Interno!\n\n• Estado: "En Comité Interno"\n• Puede seguir editando si el comité solicita cambios\n• Recibirá notificación de la decisión final`);
      } else {
        console.error('❌ Error al aprobar como asesor:', error);
        alert('Error al aprobar como asesor: ' + error);
      }
    } catch (error) {
      console.error('💥 Exception al aprobar como asesor:', error);
      alert('Error al aprobar la solicitud como asesor: ' + (error as Error).message);
    }
  };


  const handleInternalCommitteeApproval = async (requestId: string, approve: boolean) => {
    try {
      if (!user?.id) {
        alert('Error: Usuario no autenticado');
        return;
      }
      
      const action = approve ? 'aprobar' : 'rechazar';
      const notes = prompt(`Comentarios del comité interno para ${action} la solicitud:`);
      
      if (!notes) {
        alert('Los comentarios son obligatorios para las decisiones del comité interno.');
        return;
      }
      
      const confirmMessage = approve 
        ? `¿Aprobar esta solicitud para enviar al Comité de Socios?\n\n✅ La solicitud pasará a la etapa final de aprobación`
        : `¿Rechazar definitivamente esta solicitud?\n\n❌ Esta acción no se puede deshacer`;
      
      if (!confirm(confirmMessage)) return;
      
      console.log(`🏛️ Comité interno ${action}:`, { requestId, userId: user.id, notes });
      
      if (approve) {
        // Aprobar y enviar a comité de socios usando API REST
        const { request: updatedRequest, error } = await AuthorizationService.updateAuthorizationRequest(requestId, {
          status: 'partners_committee',
          internal_committee_reviewed_by: user.id,
          internal_committee_reviewed_at: new Date().toISOString(),
          internal_notes: `${notes}\n\nComité Interno: ${user.name} - Aprobado el ${new Date().toLocaleString()}`
        });
        
        if (!error) {
          loadAuthorizationRequests();
          alert(`✅ Solicitud aprobada por Comité Interno!\n\n• Estado cambiado a "En Comité de Socios"\n• Última etapa antes de aprobación final`);
        } else {
          alert('Error al aprobar en comité interno: ' + error);
        }
      } else {
        // Rechazar solicitud
        const result = await AuthorizationService.rejectAuthorizationRequest(requestId, user.id, notes, 'internal_committee');
        
        if (result.success) {
          loadAuthorizationRequests();
          alert(`❌ Solicitud rechazada por Comité Interno\n\n• Proceso terminado\n• Razón: ${notes}`);
        } else {
          alert('Error al rechazar en comité interno: ' + result.error);
        }
      }
    } catch (error) {
      console.error('💥 Exception en comité interno:', error);
      alert('Error en la decisión del comité interno: ' + (error as Error).message);
    }
  };

  const handleFinalApproval = async (requestId: string, approve: boolean) => {
    try {
      if (!user?.id) {
        alert('Error: Usuario no autenticado');
        return;
      }
      
      const action = approve ? 'APROBAR FINALMENTE' : 'rechazar';
      const notes = prompt(`Comentarios del comité de socios para ${action} la solicitud:`);
      
      if (!notes) {
        alert('Los comentarios son obligatorios para las decisiones finales.');
        return;
      }
      
      const confirmMessage = approve 
        ? `¿APROBAR FINALMENTE esta solicitud?\n\n🎉 Esta es la aprobación final - el crédito será dispersado`
        : `¿RECHAZAR definitivamente esta solicitud?\n\n❌ Esta acción no se puede deshacer`;
      
      if (!confirm(confirmMessage)) return;
      
      console.log(`🏛️ Comité socios ${action}:`, { requestId, userId: user.id, notes });
      
      if (approve) {
        // Aprobación final
        const { request: updatedRequest, error } = await AuthorizationService.updateAuthorizationRequest(requestId, {
          status: 'approved',
          approval_notes: notes
        });
        
        if (!error) {
          loadAuthorizationRequests();
          alert(`🎉 ¡SOLICITUD APROBADA FINALMENTE!\n\n• Proceso completado exitosamente\n• Lista para dispersión del crédito\n• Cliente será notificado`);
        } else {
          alert('Error en aprobación final: ' + error);
        }
      } else {
        // Rechazo final
        const result = await AuthorizationService.rejectAuthorizationRequest(requestId, user.id, notes, 'partners_committee');
        
        if (result.success) {
          loadAuthorizationRequests();
          alert(`❌ Solicitud rechazada por Comité de Socios\n\n• Proceso terminado definitivamente\n• Razón: ${notes}`);
        } else {
          alert('Error al rechazar en comité de socios: ' + result.error);
        }
      }
    } catch (error) {
      console.error('💥 Exception en comité de socios:', error);
      alert('Error en la decisión final: ' + (error as Error).message);
    }
  };

  const handleDownloadPDF = async (request: ExtendedAuthorizationRequest) => {
    try {
      console.log('📄 Generando PDF para request:', request.id);
      
      // Preparar datos para el PDF profesional
      const pdfData: ProfessionalAuthorizationData = {
        id: request.id,
        client_name: request.simulation?.quote?.client_name || request.client_name || 'Cliente no especificado',
        client_email: request.simulation?.quote?.client_email || request.client_email,
        client_phone: request.simulation?.quote?.client_phone || request.client_phone,
        status: request.status,
        created_at: request.createdAt || request.created_at,
        
        // Información del vehículo
        vehicle_brand: request.simulation?.quote?.vehicle_brand || request.vehicle_brand,
        vehicle_model: request.simulation?.quote?.vehicle_model || request.vehicle_model,
        vehicle_year: request.simulation?.quote?.vehicle_year || request.vehicle_year,
        vehicle_value: request.simulation?.quote?.vehicle_value || request.vehicle_value,
        
        // Información financiera
        monthly_payment: request.simulation?.pmt_total_month2 || request.simulation?.monthly_payment || request.monthly_payment,
        requested_amount: request.requested_amount,
        term_months: request.simulation?.term_months || request.term_months,
        interest_rate: request.authorization_data?.interest_rate as number | undefined,
        opening_fee: request.authorization_data?.opening_fee as number | undefined,
        
        // Información del asesor
        reviewer_name: request.reviewerName,
        agency_name: request.agency_name || 'No especificada',
        
        // Competidores desde múltiples fuentes
        competitors_data: request.competitors_data || (request.authorization_data?.competitors as Array<{ name: string; price: number }>) || [],
        
        // Datos del formulario
        authorization_data: request.authorization_data
      };
      
      console.log('📄 Datos preparados para PDF profesional:', pdfData);
      
      // Generar y descargar PDF profesional
      await generateProfessionalAuthorizationPDF(pdfData);
      
      console.log('✅ PDF generado exitosamente');
      
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
      alert('Error al generar el PDF: ' + (error as Error).message);
    }
  };

  const handleDownloadClientLetter = async (request: ExtendedAuthorizationRequest) => {
    try {
      console.log('📄 Generando Carta de Autorización para cliente:', request.id);
      
      // Preparar datos para la carta de autorización al cliente
      const letterData: ClientCreditAuthorizationData = {
        client: {
          name: request.simulation?.quote?.client_name || request.client_name || 'Cliente',
          address: (request.authorization_data?.address as string) || '',
          city: (request.authorization_data?.city as string) || '',
          state: (request.authorization_data?.state as string) || ''
        },
        authorization: {
          id: request.id,
          date: request.created_at || new Date().toISOString()
        },
        credit: {
          requested_amount: request.requested_amount || 0,
          term_months: request.simulation?.term_months || request.term_months || 0,
          interest_rate_annual: (request.authorization_data?.interest_rate as number) || 0,
          opening_fee_pct: (request.authorization_data?.opening_fee as number) || 0,
          down_payment: (request.authorization_data?.down_payment as number) || 0
        },
        insurance: {
          mode: request.authorization_data?.insurance_mode === 'financed' ? 'financed' : 'cash',
          premium: (request.authorization_data?.insurance_premium as number) || 0,
          term_months: (request.authorization_data?.insurance_term as number) || request.term_months || 0
        },
        payments: {
          monthly_without_insurance: request.simulation?.pmt_total_month || request.monthly_payment || 0,
          monthly_total: request.monthly_payment || request.simulation?.pmt_total_month2 || 0
        },
        vehicle: {
          brand: request.simulation?.quote?.vehicle_brand || request.vehicle_brand || '',
          model: request.simulation?.quote?.vehicle_model || request.vehicle_model || '',
          year: request.simulation?.quote?.vehicle_year || request.vehicle_year || new Date().getFullYear(),
          agency_value: request.simulation?.quote?.vehicle_value || request.vehicle_value || 0
        },
        agency: {
          name: request.agency_name || 'Agencia'
        },
        valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días hábiles
      };
      
      console.log('📄 Datos preparados para carta de autorización:', letterData);
      
      // Generar y descargar carta de autorización
      await generateClientCreditAuthorizationPDF(letterData);
      
      console.log('✅ Carta de autorización generada exitosamente');
      
    } catch (error) {
      console.error('❌ Error al generar carta de autorización:', error);
      alert('Error al generar la carta de autorización: ' + (error as Error).message);
    }
  };

  // =========================================
  // FUNCIONES MEJORADAS DE ESTADO
  // =========================================

  const getStatusConfig = (status: string) => {
    const configs = {
      'pending': {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="w-4 h-4" />,
        text: 'Pendiente',
        description: 'Esperando ser reclamada por un asesor',
        nextAction: 'Reclamar solicitud',
        priority: 1
      },
      'in_review': {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Users className="w-4 h-4" />,
        text: 'En Revisión',
        description: 'Siendo revisada por asesor asignado',
        nextAction: 'Completar formulario y aprobar',
        priority: 2
      },
      'advisor_approved': {
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <UserCheck className="w-4 h-4" />,
        text: 'Aprobado por Asesor',
        description: 'Aprobada por asesor, lista para comité interno',
        nextAction: 'Enviar a comité interno',
        priority: 3
      },
      'internal_committee': {
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: <Building2 className="w-4 h-4" />,
        text: 'En Comité Interno',
        description: 'Siendo evaluada por el comité interno',
        nextAction: 'Decisión del comité interno',
        priority: 4
      },
      'partners_committee': {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: <Users className="w-4 h-4" />,
        text: 'En Comité de Socios',
        description: 'En evaluación final por comité de socios',
        nextAction: 'Decisión final del comité',
        priority: 5
      },
      'approved': {
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="w-4 h-4" />,
        text: 'Aprobado Final',
        description: 'Solicitud aprobada - Lista para dispersión',
        nextAction: 'Proceso completado',
        priority: 6
      },
      'rejected': {
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="w-4 h-4" />,
        text: 'Rechazado',
        description: 'Solicitud rechazada en alguna etapa',
        nextAction: 'Proceso terminado',
        priority: 7
      },
      'cancelled': {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: <Trash2 className="w-4 h-4" />,
        text: 'Cancelado',
        description: 'Solicitud cancelada por el cliente o sistema',
        nextAction: 'Proceso terminado',
        priority: 8
      }
    };
    
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getStatusColor = (status: string) => getStatusConfig(status).color;
  const getStatusIcon = (status: string) => getStatusConfig(status).icon;
  const getStatusText = (status: string) => getStatusConfig(status).text;

  // Memoize stats calculations to prevent unnecessary re-renders
  const stats = useMemo(() => {
    if (!isHydrated || requests.length === 0) {
      return {
        pending: 0,
        in_review: 0,
        advisor_approved: 0,
        internal_committee: 0,
        partners_committee: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        total: 0
      };
    }

    return {
      pending: requests.filter(r => r.status === 'pending').length,
      in_review: requests.filter(r => r.status === 'in_review').length,
      advisor_approved: requests.filter(r => r.status === 'advisor_approved').length,
      internal_committee: requests.filter(r => r.status === 'internal_committee').length,
      partners_committee: requests.filter(r => r.status === 'partners_committee').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length,
      total: requests.length
    };
  }, [requests, isHydrated]);

  // Show loading during hydration to prevent hydration mismatch
  if (!isHydrated || !authDetermined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  // Temporalmente removemos la validación de asesor para debugging
  // if (!isAsesor) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8 flex items-center justify-center">
  //       <div className="text-center">
  //         <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
  //         <p className="text-gray-600">Solo los asesores pueden acceder al sistema de autorizaciones.</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <FileCheck className="w-8 h-8 mr-3 text-emerald-600" />
                Sistema de Autorizaciones
              </h1>
              <p className="text-gray-600">Gestión de solicitudes de crédito automotriz</p>
              {user && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <User className="w-4 h-4 mr-2" />
                  <span>Conectado como: <strong className="text-gray-700">{user.name}</strong> ({user.user_type === 'asesor' ? 'Asesor' : 'Usuario'})</span>
                </div>
              )}
            </div>
            
            {/* Navigation Buttons */}
            <div className="flex gap-3">
              <Link href="/">
                <button className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                  <Home className="w-4 h-4 mr-2" />
                  Inicio
                </button>
              </Link>
              
              {user && (
                <button 
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards Mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Pendientes</p>
                <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-xs text-yellow-600">Esperando asesor</p>
              </div>
            </div>
                </div>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
                </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">En Revisión</p>
                <p className="text-xl font-bold text-gray-900">{stats.in_review}</p>
                <p className="text-xs text-blue-600">Con asesor</p>
              </div>
            </div>
                </div>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Comité Int.</p>
                <p className="text-xl font-bold text-gray-900">{stats.internal_committee}</p>
                <p className="text-xs text-purple-600">En evaluación</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Aprobadas</p>
                <p className="text-xl font-bold text-gray-900">{stats.approved}</p>
                <p className="text-xs text-green-600">Listas dispersión</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
                </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Rechazadas</p>
                <p className="text-xl font-bold text-gray-900">{stats.rejected}</p>
                <p className="text-xs text-red-600">Proceso terminado</p>
              </div>
            </div>
                </div>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileCheck className="w-5 h-5 text-gray-600" />
                </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-600">Todas las solicitudes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Panel de Métricas Avanzadas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Eficiencia del Workflow */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 mr-2" />
              Eficiencia del Workflow
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tasa de Aprobación</span>
                <span className="font-semibold text-green-600">
                  {stats.total > 0 ? Math.round(((stats.approved) / (stats.approved + stats.rejected)) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">En Proceso</span>
                <span className="font-semibold text-blue-600">
                  {stats.pending + stats.in_review + stats.internal_committee + stats.partners_committee}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Finalizadas</span>
                <span className="font-semibold text-gray-600">
                  {stats.approved + stats.rejected + stats.cancelled}
                </span>
              </div>
            </div>
          </div>

          {/* Estado del Pipeline */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-5 h-5 text-blue-600 mr-2" />
              Pipeline de Autorizaciones
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                  <span>Pendientes</span>
                </div>
                <span className="font-medium">{stats.pending}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
                  <span>En Revisión</span>
                </div>
                <span className="font-medium">{stats.in_review}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
                  <span>Comité Interno</span>
                </div>
                <span className="font-medium">{stats.internal_committee}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-400 rounded-full mr-2"></div>
                  <span>Comité Socios</span>
                </div>
                <span className="font-medium">{stats.partners_committee}</span>
              </div>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
              Acciones Requeridas
            </h3>
            <div className="space-y-2">
              {stats.pending > 0 && (
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                  <span className="text-sm text-yellow-800">{stats.pending} solicitudes por reclamar</span>
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              )}
              {stats.internal_committee > 0 && (
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                  <span className="text-sm text-purple-800">{stats.internal_committee} en comité interno</span>
                  <Building2 className="w-4 h-4 text-purple-600" />
                </div>
              )}
              {stats.partners_committee > 0 && (
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg">
                  <span className="text-sm text-orange-800">{stats.partners_committee} decisión final</span>
                  <Users className="w-4 h-4 text-orange-600" />
                </div>
              )}
              {(stats.pending + stats.internal_committee + stats.partners_committee) === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <span className="text-sm">¡Todo al día!</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, email, teléfono, vehículo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

                        <div className="flex gap-4 items-center">
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'Todas' },
                  { value: 'pending', label: 'Pendientes' },
                  { value: 'in_review', label: 'En Revisión' },
                  { value: 'internal_committee', label: 'Comité Interno' },
                  { value: 'partners_committee', label: 'Comité de Socios' },
                  { value: 'approved', label: 'Aprobadas' },
                  { value: 'rejected', label: 'Rechazadas' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value as any)}
                    className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                      statusFilter === filter.value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-3 flex items-center gap-2 transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                  Tarjetas
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-3 flex items-center gap-2 transition-colors ${
                    viewMode === 'table'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                  Tabla
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Requests List */}
        {viewMode === 'table' ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehículo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto Solicitado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.simulation?.quote?.client_name || request.client_name || 'Cliente Anónimo'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.simulation?.quote?.client_email || request.client_email ||
                           request.simulation?.quote?.client_phone || request.client_phone || 'Sin contacto'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.simulation?.quote?.vehicle_brand || request.vehicle_brand || 'N/A'} {request.simulation?.quote?.vehicle_model || request.vehicle_model || ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.simulation?.quote?.vehicle_year || request.vehicle_year || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatMXN(request.simulation?.quote?.vehicle_value || request.vehicle_value || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">
                          {request.status === 'pending' ? 'Pendiente' :
                           request.status === 'in_review' ? 'En Revisión' :
                           request.status === 'approved' ? 'Aprobada' :
                           request.status === 'rejected' ? 'Rechazada' :
                           request.status === 'cancelled' ? 'Cancelada' : request.status}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt || request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {/* Botón Revisar */}
                      <button
                        onClick={() => handleAuthorizeRequest(request)}
                          className="inline-flex items-center px-2 py-1 bg-emerald-600 text-white text-xs font-medium rounded hover:bg-emerald-700 transition-colors"
                      >
                          <Eye className="w-3 h-3 mr-1" />
                        Revisar
                      </button>

                        {/* Botón Reclamar (solo para pendientes) */}
                        {request.status === 'pending' && (
                          <button
                            onClick={() => handleClaimRequest(request.id)}
                            className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                          >
                            <Users className="w-3 h-3 mr-1" />
                            Reclamar
                          </button>
                        )}

                        {/* Botón Aprobar como Asesor (solo para reclamadas) */}
                        {request.status === 'in_review' && (
                          <button
                            onClick={() => handleApproveAsAdvisor(request.id)}
                            className="inline-flex items-center px-2 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Aprobar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>

            {filteredRequests.length === 0 && (
              <div className="text-center py-12">
                <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron solicitudes</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'No hay solicitudes pendientes de autorización'
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Cards View */
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-lg border border-gray-100">
                <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron solicitudes</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'No hay solicitudes pendientes de autorización'}
                </p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.simulation?.quote?.client_name || request.client_name || 'Cliente Anónimo'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {request.simulation?.quote?.client_email || request.client_email || 
                           request.simulation?.quote?.client_phone || request.client_phone || 'Sin contacto'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-2">{getStatusText(request.status)}</span>
                    </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {getStatusConfig(request.status).description}
                      </div>
                      <div className="text-xs font-medium text-emerald-600 mt-1">
                        Siguiente: {getStatusConfig(request.status).nextAction}
                      </div>
                    </div>
                  </div>

                  {/* Workflow Timeline */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                      <ChevronRight className="w-4 h-4 mr-1" />
                      Flujo de Autorización
                    </h4>
                    <div className="flex items-center justify-between">
                      {[
                        { key: 'pending', label: 'Pendiente' },
                        { key: 'in_review', label: 'Revisión' },
                        { key: 'advisor_approved', label: 'Asesor ✓' },
                        { key: 'internal_committee', label: 'Comité Int.' },
                        { key: 'partners_committee', label: 'Comité Socios' },
                        { key: 'approved', label: 'Aprobado' }
                      ].map((stage, index, array) => {
                        const currentStatusConfig = getStatusConfig(request.status);
                        const stageConfig = getStatusConfig(stage.key);
                        const isActive = request.status === stage.key;
                        const isPassed = currentStatusConfig.priority > stageConfig.priority;
                        const isCurrent = currentStatusConfig.priority === stageConfig.priority;
                        
                        return (
                          <div key={stage.key} className="flex items-center">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all",
                              isPassed ? "bg-green-500 text-white" :
                              isCurrent ? "bg-blue-500 text-white animate-pulse" :
                              "bg-gray-300 text-gray-600"
                            )}>
                              {isPassed ? <CheckCircle className="w-4 h-4" /> :
                               isCurrent ? stageConfig.icon :
                               <div className="w-2 h-2 bg-current rounded-full"></div>}
                            </div>
                            <div className="ml-2 text-xs">
                              <div className={cn(
                                "font-medium",
                                isPassed ? "text-green-700" :
                                isCurrent ? "text-blue-700" :
                                "text-gray-500"
                              )}>
                                {stage.label}
                              </div>
                            </div>
                            {index < array.length - 1 && (
                              <div className={cn(
                                "flex-1 h-0.5 mx-2",
                                isPassed ? "bg-green-500" : "bg-gray-300"
                              )}></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Información del Estado Actual */}
                    <div className="mt-3 p-2 bg-white rounded border">
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Estado actual:</span> {getStatusConfig(request.status).description}
                      </div>
                      <div className="text-xs text-emerald-600 mt-1">
                        <span className="font-medium">Siguiente acción:</span> {getStatusConfig(request.status).nextAction}
                      </div>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Vehicle Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Vehículo</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {request.simulation?.quote?.vehicle_brand || request.vehicle_brand || 'N/A'} {request.simulation?.quote?.vehicle_model || request.vehicle_model || ''}
                      </p>
                      <p className="text-xs text-gray-500">
                        {request.simulation?.quote?.vehicle_year || request.vehicle_year || 'N/A'}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <FileCheck className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatMXN(request.simulation?.quote?.vehicle_value || request.vehicle_value || 0)}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <Clock className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(request.createdAt || request.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.createdAt || request.created_at).toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Advisor Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <UserCheck className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estado del Asesor</span>
                      </div>
                      {request.status === 'pending' ? (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Sin asignar</p>
                          <p className="text-xs text-gray-400">Cualquier asesor puede reclamar</p>
                        </div>
                      ) : request.status === 'in_review' ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.reviewerName || 'Asesor asignado'}
                          </p>
                          <p className="text-xs text-emerald-600 font-medium">
                            {request.reviewerId === user?.id ? 'Reclamado por ti' : `Reclamado por este asesor`}
                          </p>
                        </div>
                      ) : request.status === 'advisor_approved' ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.reviewerName || 'Asesor'}
                          </p>
                          <p className="text-xs text-green-600 font-medium">Aprobado por asesor</p>
                        </div>
                      ) : request.status === 'internal_committee' ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">Comité Interno</p>
                          <p className="text-xs text-purple-600 font-medium">En revisión interna</p>
                        </div>
                      ) : request.status === 'partners_committee' ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">Comité Socios</p>
                          <p className="text-xs text-orange-600 font-medium">En comité de socios</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.reviewerName || 'Procesado'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.status === 'approved' ? 'Aprobado final' : 
                             request.status === 'rejected' ? 'Rechazado' : 
                             request.status === 'cancelled' ? 'Cancelado' : 'Procesado'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Form Progress - Solo para solicitudes en revisión */}
                  {request.status === 'in_review' && request.reviewerId === user?.id && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      {(() => {
                        const progress = request.authorization_data ? 
                          calculateFormProgress(request.authorization_data) : 
                          { percentage: 0, completedFields: 0, totalFields: 22, isComplete: false, sectionProgress: { personalData: { percentage: 0 }, financialData: { percentage: 0 }, vehicleData: { percentage: 0 } }, missingFields: [] };
                        
                        return (
                          <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">Progreso del Formulario</span>
                        <span className="text-xs text-blue-700">
                                {progress.percentage}% completado ({progress.completedFields}/{progress.totalFields})
                        </span>
                      </div>
                            <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${progress.percentage}%` }}
                        ></div>
                      </div>
                            
                            {/* Progreso por Sección */}
                            <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                              <div className="text-center">
                                <div className="text-blue-600">Personal</div>
                                <div className="font-medium">{progress.sectionProgress.personalData.percentage}%</div>
                              </div>
                              <div className="text-center">
                                <div className="text-blue-600">Financiero</div>
                                <div className="font-medium">{progress.sectionProgress.financialData.percentage}%</div>
                              </div>
                              <div className="text-center">
                                <div className="text-blue-600">Vehículo</div>
                                <div className="font-medium">{progress.sectionProgress.vehicleData.percentage}%</div>
                              </div>
                            </div>
                            
                            {progress.isComplete ? (
                              <div className="flex items-center text-sm text-green-700">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Formulario completado - Listo para enviar a comité interno
                        </div>
                      ) : (
                              <div className="text-sm text-blue-700">
                                {progress.missingFields.length > 0 ? (
                                  <div>
                                    Faltan: {progress.missingFields.slice(0, 2).join(', ')}
                                    {progress.missingFields.length > 2 && ` y ${progress.missingFields.length - 2} más`}
                        </div>
                                ) : (
                                  'Complete el formulario para poder enviar a revisión interna'
                      )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {/* Revisar - El asesor puede revisar/editar hasta que esté aprobado final */}
                    {(request.status === 'pending' || 
                      (request.status === 'in_review' && request.reviewerId === user?.id) ||
                      (request.status === 'internal_committee' && request.reviewerId === user?.id) ||
                      (request.status === 'partners_committee' && request.reviewerId === user?.id)) && (
                      <button
                        onClick={() => handleAuthorizeRequest(request)}
                        className={`inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                          request.status === 'partners_committee' 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {request.status === 'partners_committee' 
                          ? 'Ver/Editar (⚠️ Regresará a Revisión)' 
                          : request.status === 'internal_committee' 
                          ? 'Editar Formulario' 
                          : 'Revisar'}
                      </button>
                    )}

                    {/* Mensaje si está asignado a otro asesor */}
                    {request.status === 'in_review' && request.reviewerId !== user?.id && (
                      <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 text-sm font-medium rounded-lg">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Asignado a {request.reviewerName}
                      </div>
                    )}

                    {/* Reclamar (solo para pendientes) */}
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleClaimRequest(request.id)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Reclamar
                      </button>
                    )}

                    {/* Aprobar como Asesor (solo para reclamadas por el usuario actual) */}
                    {request.status === 'in_review' && request.reviewerId === user?.id && (
                      <button
                        onClick={() => handleApproveAsAdvisor(request.id)}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprobar como Asesor
                      </button>
                    )}

                    {/* Enviar a Comité Interno - Solo si el formulario está completo */}
                    {request.status === 'advisor_approved' && (
                      <button
                        onClick={() => handleApproveAsAdvisor(request.id)}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        Enviar a Comité Interno
                      </button>
                    )}

                    {/* Mostrar que se puede enviar a comité si está completo */}
                    {request.status === 'in_review' && 
                     request.reviewerId === user?.id && 
                     request.authorization_data && 
                     calculateFormProgress(request.authorization_data).isComplete && (
                      <button
                        onClick={() => handleApproveAsAdvisor(request.id)}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Aprobar y Enviar a Comité
                      </button>
                    )}

                    {/* Botones para Comité Interno */}
                    {request.status === 'internal_committee' && (
                      <>
                        <button
                          onClick={() => handleInternalCommitteeApproval(request.id, true)}
                          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprobar (Comité Int.)
                        </button>
                        <button
                          onClick={() => handleInternalCommitteeApproval(request.id, false)}
                          className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rechazar (Comité Int.)
                        </button>
                      </>
                    )}

                    {/* Botones para Comité de Socios */}
                    {request.status === 'partners_committee' && (
                      <>
                        <button
                          onClick={() => handleFinalApproval(request.id, true)}
                          className="inline-flex items-center px-4 py-2 bg-green-700 text-white text-sm font-medium rounded-lg hover:bg-green-800 transition-colors shadow-lg"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          🎉 APROBACIÓN FINAL
                        </button>
                        <button
                          onClick={() => handleFinalApproval(request.id, false)}
                          className="inline-flex items-center px-4 py-2 bg-red-700 text-white text-sm font-medium rounded-lg hover:bg-red-800 transition-colors"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rechazo Final
                        </button>
                      </>
                    )}

                    {/* Descargar PDF - Solo si hay datos del formulario */}
                    {(request.status === 'in_review' || 
                      request.status === 'advisor_approved' || 
                      request.status === 'internal_committee' || 
                      request.status === 'partners_committee' || 
                      request.status === 'approved') && 
                     request.authorization_data && (
                      <button
                        onClick={() => handleDownloadPDF(request)}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <FileCheck className="w-4 h-4 mr-2" />
                        Descargar PDF
                      </button>
                    )}

                    {/* Carta de Autorización de Crédito - Solo cuando está aprobado */}
                    {request.status === 'approved' && (
                      <button
                        onClick={() => handleDownloadClientLetter(request)}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FileCheck className="w-4 h-4 mr-2" />
                        Carta de Autorización de Crédito
                      </button>
                    )}

                    {/* Rechazar - Solo el asesor asignado o solicitudes pendientes */}
                    {(request.status === 'pending' || 
                      (request.status === 'in_review' && request.reviewerId === user?.id)) && (
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rechazar
                      </button>
                    )}

                    {/* Descartar - Solo el asesor asignado o solicitudes pendientes */}
                    {(request.status === 'pending' || 
                      (request.status === 'in_review' && request.reviewerId === user?.id)) && (
                      <button
                        onClick={() => handleDiscardRequest(request.id)}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Descartar
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Authorization Form Modal */}
      {showAuthorizationForm && selectedRequest && (
        <AuthorizationForm
          request={selectedRequest as SupabaseAuthorizationRequest}
          onClose={handleCloseAuthorizationForm}
        />
      )}
    </div>
  );
}
