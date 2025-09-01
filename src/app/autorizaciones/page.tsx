"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FileCheck, Users, Search, Filter, Eye, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";
import { useAuth } from "../../../lib/auth";
import { SimulationService, SimulationWithQuote } from "../../../lib/simulation-service";
import { AuthorizationService } from "../../../lib/authorization-service";
import { formatMXN } from "@/lib/utils";
import { AuthorizationForm } from "../../components/authorization/AuthorizationForm";

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
  const { user, isAsesor } = useAuth();
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <FileCheck className="w-8 h-8 mr-3 text-emerald-600" />
            Sistema de Autorizaciones
          </h1>
          <p className="text-gray-600">Gestión de solicitudes de crédito automotriz</p>
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
          </div>
        </div>

        {/* Requests List */}
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
