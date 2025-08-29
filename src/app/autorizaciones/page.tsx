"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FileCheck, Users, Search, Eye, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";
import { useAuth } from "../../../lib/auth";
import { SimulationService, SimulationWithQuote } from "../../../lib/simulation-service";
import { formatMXN } from "@/lib/utils";
import { AuthorizationForm } from "../../components/authorization/AuthorizationForm";

interface AuthorizationRequest {
  id: string;
  simulation: SimulationWithQuote;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  reviewerId?: string;
  reviewerName?: string;
}

export default function AutorizacionesPage() {
  const { user, isAsesor } = useAuth();
  const [requests, setRequests] = useState<AuthorizationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AuthorizationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
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
        return (
          quote?.client_name?.toLowerCase().includes(searchLower) ||
          quote?.client_email?.toLowerCase().includes(searchLower) ||
          quote?.client_phone?.includes(searchTerm) ||
          quote?.vehicle_brand?.toLowerCase().includes(searchLower) ||
          quote?.vehicle_model?.toLowerCase().includes(searchLower)
        );
      });
    }

    setFilteredRequests(filtered);
  }, [requests, searchTerm, statusFilter, isHydrated, isLoading]);

  const loadAuthorizationRequests = useCallback(async () => {
    if (!user || !isAsesor || !isHydrated || isLoadingData) return;

    setIsLoadingData(true);
    setIsLoading(true);
    try {
      // Por ahora cargamos todas las simulaciones como solicitudes pendientes
      // En el futuro esto debería ser una tabla específica de solicitudes de autorización
      const simulations = await SimulationService.getUserSimulations(user.id, 'asesor');

      const authorizationRequests: AuthorizationRequest[] = simulations.map(simulation => ({
        id: simulation.id,
        simulation,
        status: 'pending' as const,
        createdAt: simulation.calculated_at
      }));

      setRequests(authorizationRequests);
    } catch (error) {
      console.error('Error loading authorization requests:', error);
      setRequests([]); // Set empty array on error to prevent infinite loading
    } finally {
      setIsLoading(false);
      setIsLoadingData(false);
    }
  }, [user, isAsesor, isHydrated, isLoadingData]);

  useEffect(() => {
    if (isHydrated) {
      setAuthDetermined(true);

      // Immediately set loading to false if user is not an asesor
      if (!isAsesor) {
        setIsLoading(false);
        return;
      }

      // If user is asesor and we haven't initiated loading yet, load requests
      if (isAsesor && user && !hasInitiatedLoading.current) {
        hasInitiatedLoading.current = true;
        loadAuthorizationRequests();
      }
    }
  }, [isAsesor, user, isHydrated, loadAuthorizationRequests]); // Include loadAuthorizationRequests dependency

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Memoize stats calculations to prevent unnecessary re-renders
  const stats = useMemo(() => {
    if (!isHydrated || requests.length === 0) {
      return {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0
      };
    }

    return {
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
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

  if (!isAsesor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">Solo los asesores pueden acceder al sistema de autorizaciones.</p>
        </div>
      </div>
    );
  }

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.approved}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Solicitudes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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

            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Todas' },
                { value: 'pending', label: 'Pendientes' },
                { value: 'approved', label: 'Aprobadas' },
                { value: 'rejected', label: 'Rechazadas' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value as 'pending' | 'approved' | 'rejected')}
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
                          {request.simulation?.quote?.client_name || 'Cliente Anónimo'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.simulation?.quote?.client_email || request.simulation?.quote?.client_phone || 'Sin contacto'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {request.simulation?.quote?.vehicle_brand || 'N/A'} {request.simulation?.quote?.vehicle_model || ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.simulation?.quote?.vehicle_year || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatMXN(request.simulation?.quote?.vehicle_value || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1 capitalize">{request.status === 'pending' ? 'Pendiente' : request.status === 'approved' ? 'Aprobada' : 'Rechazada'}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleAuthorizeRequest(request)}
                        className="inline-flex items-center px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Revisar
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </button>
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
