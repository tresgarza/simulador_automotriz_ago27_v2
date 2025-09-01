"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FileCheck, Users, Search, Filter, Eye, CheckCircle, XCircle, Clock, ChevronRight, Grid, List, Trash2, UserCheck, AlertTriangle, Calendar, User, Home, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../../lib/auth";
import { SimulationService, SimulationWithQuote } from "../../../lib/simulation-service";
import { AuthorizationService } from "../../../lib/authorization-service";
import { formatMXN } from "@/lib/utils";
import { AuthorizationForm, calculateFormProgress } from "../../components/authorization/AuthorizationForm";

interface AuthorizationRequest {
  id: string;
  simulation: SimulationWithQuote | null;
  status: 'pending' | 'approved' | 'rejected' | 'in_review' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
  reviewerId?: string;
  reviewerName?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  riskLevel?: 'low' | 'medium' | 'high';
  clientComments?: string;
  internalNotes?: string;
  approvalNotes?: string;
  // Campos directos de la solicitud (cuando no hay simulación)
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_value?: number;
}

export default function AutorizacionesPage() {
  const { user, isAsesor, logout } = useAuth();
  const [requests, setRequests] = useState<AuthorizationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AuthorizationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'cancelled'>('all');
  const [selectedRequest, setSelectedRequest] = useState<AuthorizationRequest | null>(null);
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

      // Transformar los datos para que coincidan con la interfaz AuthorizationRequest
      const authorizationRequests: AuthorizationRequest[] = result.authorization_requests.map((authReq: any) => ({
        id: authReq.id,
        simulation: authReq.z_auto_simulations ? {
          id: authReq.z_auto_simulations.id,
          tier_code: authReq.z_auto_simulations.tier_code,
          term_months: authReq.z_auto_simulations.term_months,
          monthly_payment: authReq.z_auto_simulations.monthly_payment,
          total_to_finance: authReq.z_auto_simulations.total_to_finance,
          calculated_at: authReq.created_at,
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
        vehicle_value: authReq.vehicle_value
      }));

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

  const handleAuthorizeRequest = (request: AuthorizationRequest) => {
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
      await AuthorizationService.claimAuthorizationRequest(requestId);
      loadAuthorizationRequests(); // Recargar datos
    } catch (error) {
      console.error('Error al reclamar solicitud:', error);
      alert('Error al reclamar la solicitud');
    }
  };

  const handleApproveAsAdvisor = async (requestId: string) => {
    try {
      await AuthorizationService.markAdvisorReviewed(requestId);
      loadAuthorizationRequests(); // Recargar datos
    } catch (error) {
      console.error('Error al aprobar como asesor:', error);
      alert('Error al aprobar como asesor');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt('¿Motivo del rechazo?');
    if (!reason) return;
    
    try {
      await AuthorizationService.rejectAuthorizationRequest(requestId, reason);
      loadAuthorizationRequests(); // Recargar datos
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      alert('Error al rechazar la solicitud');
    }
  };

  const handleDiscardRequest = async (requestId: string) => {
    if (!confirm('¿Estás seguro de que deseas descartar esta solicitud?')) return;
    
    try {
      // Usar el endpoint de reject pero con estado cancelled
      await AuthorizationService.rejectAuthorizationRequest(requestId, 'Solicitud descartada por el asesor');
      loadAuthorizationRequests(); // Recargar datos
    } catch (error) {
      console.error('Error al descartar solicitud:', error);
      alert('Error al descartar la solicitud');
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/'; // Redirigir al inicio
  };

  const handleSendToInternalCommittee = async (requestId: string) => {
    if (!confirm('¿Está seguro de enviar esta solicitud al Comité Interno? Una vez enviada, no podrá modificar el formulario.')) return;
    
    try {
      await AuthorizationService.approveByInternalCommittee(requestId);
      loadAuthorizationRequests(); // Recargar datos
      alert('Solicitud enviada al Comité Interno exitosamente');
    } catch (error) {
      console.error('Error al enviar a comité interno:', error);
      alert('Error al enviar la solicitud al comité interno');
    }
  };

  const handleDownloadPDF = async (request: AuthorizationRequest) => {
    try {
      // TODO: Implementar generación de PDF profesional
      alert('Funcionalidad de PDF en desarrollo. Se generará un reporte profesional con toda la información de la autorización.');
      console.log('Datos para PDF:', request);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_review': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_review': return <Users className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Memoize stats calculations to prevent unnecessary re-renders
  const stats = useMemo(() => {
    if (!isHydrated || requests.length === 0) {
      return {
        pending: 0,
        in_review: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        total: 0
      };
    }

    return {
      pending: requests.filter(r => r.status === 'pending').length,
      in_review: requests.filter(r => r.status === 'in_review').length,
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Pendientes</p>
                <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
                </div>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
                </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">En Revisión</p>
                <p className="text-xl font-bold text-gray-900">{stats.in_review}</p>
              </div>
            </div>
                </div>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Aprobadas</p>
                <p className="text-xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
                </div>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
                </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Rechazadas</p>
                <p className="text-xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
                </div>

          <div className="bg-white p-4 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileCheck className="w-5 h-5 text-gray-600" />
                </div>
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
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
                  { value: 'approved', label: 'Aprobadas' },
                  { value: 'rejected', label: 'Rechazadas' },
                  { value: 'cancelled', label: 'Canceladas' }
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
                      {new Date(request.createdAt).toLocaleDateString()}
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
                    
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                      {getStatusIcon(request.status)}
                      <span className="ml-2">
                        {request.status === 'pending' ? 'Pendiente' : 
                         request.status === 'in_review' ? 'En Revisión' :
                         request.status === 'approved' ? 'Aprobada' : 
                         request.status === 'rejected' ? 'Rechazada' :
                         request.status === 'cancelled' ? 'Cancelada' : request.status}
                      </span>
                    </span>
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
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(request.createdAt).toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Advisor Info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center mb-2">
                        <UserCheck className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Estado del Asesor</span>
                      </div>
                      {request.status === 'pending' ? (
                        <p className="text-sm font-medium text-gray-500">Sin asignar</p>
                      ) : request.status === 'in_review' ? (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.reviewerName || 'Asesor asignado'}
                          </p>
                          <p className="text-xs text-emerald-600 font-medium">Reclamado por este asesor</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.reviewerName || 'Procesado'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.status === 'approved' ? 'Aprobado' : 
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
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-900">Progreso del Formulario</span>
                        <span className="text-xs text-blue-700">
                          {request.authorization_data ? 
                            `${calculateFormProgress(request.authorization_data).percentage}% completado` : 
                            '0% completado'}
                        </span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ 
                            width: `${request.authorization_data ? 
                              calculateFormProgress(request.authorization_data).percentage : 0}%` 
                          }}
                        ></div>
                      </div>
                      {request.authorization_data && calculateFormProgress(request.authorization_data).isComplete ? (
                        <div className="mt-2 flex items-center text-sm text-green-700">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Formulario completado - Listo para enviar a comité interno
                        </div>
                      ) : (
                        <div className="mt-2 text-sm text-blue-700">
                          Complete el formulario para poder enviar a revisión interna
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {/* Revisar - Solo si no está asignado o está asignado al usuario actual */}
                    {(request.status === 'pending' || 
                      (request.status === 'in_review' && request.reviewerId === user?.id) ||
                      (request.status !== 'pending' && request.status !== 'in_review')) && (
                      <button
                        onClick={() => handleAuthorizeRequest(request)}
                        className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Revisar
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
                    {request.status === 'in_review' && 
                     request.reviewerId === user?.id && 
                     request.authorization_data && 
                     calculateFormProgress(request.authorization_data).isComplete && (
                      <button
                        onClick={() => handleSendToInternalCommittee(request.id)}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Building2 className="w-4 h-4 mr-2" />
                        Enviar a Comité Interno
                      </button>
                    )}

                    {/* Descargar PDF - Solo si hay datos del formulario */}
                    {request.status === 'in_review' && 
                     request.reviewerId === user?.id && 
                     request.authorization_data && (
                      <button
                        onClick={() => handleDownloadPDF(request)}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        <FileCheck className="w-4 h-4 mr-2" />
                        Descargar PDF
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
          request={selectedRequest}
          onClose={handleCloseAuthorizationForm}
        />
      )}
    </div>
  );
}
