"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileCheck, Users, Search, Filter, RefreshCw, BarChart3,
  Clock, CheckCircle, XCircle, AlertTriangle, User, Building, Handshake
} from "lucide-react";
import { useAuth } from "../../../../lib/auth";
import { AuthorizationService } from "../../../../lib/authorization-service";
import { AuthorizationWorkflowCard } from "../../../components/authorization/AuthorizationWorkflowCard";

export default function AuthorizationWorkflowPage() {
  const { user, isAsesor } = useAuth();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [filteredWorkflows, setFilteredWorkflows] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [isHydrated, setIsHydrated] = useState(false);

  // Debug logging
  console.log('AuthorizationWorkflowPage: Renderizado', { 
    user: !!user, 
    userType: user?.user_type,
    isAsesor, 
    isHydrated,
    workflowsLength: workflows.length,
    isLoading 
  });
  
  // Estadísticas del workflow
  const [stats, setStats] = useState({
    pending: 0,
    claimed: 0,
    under_advisor_review: 0,
    advisor_approved: 0,
    under_internal_committee: 0,
    internal_committee_approved: 0,
    under_partners_committee: 0,
    approved: 0,
    rejected: 0,
    total: 0
  });

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const loadWorkflowData = useCallback(async () => {
    if (!user || !isAsesor || !isHydrated) {
      console.log('loadWorkflowData: Condiciones no cumplidas', { user: !!user, isAsesor, isHydrated });
      return;
    }

    console.log('loadWorkflowData: Iniciando carga...');
    setIsLoading(true);
    try {
      const { workflows: data, error } = await AuthorizationService.getAuthorizationWorkflowView();

      console.log('loadWorkflowData: Respuesta recibida', { dataLength: data?.length, error });

      if (error) {
        console.error('Error loading workflow data:', error);
        setWorkflows([]);
        setStats({
          pending: 0,
          claimed: 0,
          under_advisor_review: 0,
          advisor_approved: 0,
          under_internal_committee: 0,
          internal_committee_approved: 0,
          under_partners_committee: 0,
          approved: 0,
          rejected: 0,
          total: 0
        });
      } else {
        console.log('loadWorkflowData: Datos procesados', data);
        setWorkflows(data || []);
        
        // Calcular estadísticas
        const newStats = (data || []).reduce((acc, workflow) => {
          acc[workflow.status] = (acc[workflow.status] || 0) + 1;
          acc.total += 1;
          return acc;
        }, {
          pending: 0,
          claimed: 0,
          under_advisor_review: 0,
          advisor_approved: 0,
          under_internal_committee: 0,
          internal_committee_approved: 0,
          under_partners_committee: 0,
          approved: 0,
          rejected: 0,
          total: 0
        });
        
        console.log('loadWorkflowData: Estadísticas calculadas', newStats);
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error in loadWorkflowData:', error);
      setWorkflows([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // Remover dependencias para evitar loop infinito

  useEffect(() => {
    console.log('useEffect: Estado actual', { isHydrated, isAsesor, user: !!user, userType: user?.user_type });
    if (isHydrated && isAsesor && user) {
      console.log('useEffect: Llamando loadWorkflowData...');
      loadWorkflowData();
    } else {
      console.log('useEffect: No se cumplieron las condiciones para cargar datos');
    }
  }, [isHydrated, isAsesor, user]); // Agregar dependencias necesarias

  useEffect(() => {
    if (!isHydrated || workflows.length === 0) return;

    let filtered = workflows;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(workflow => workflow.status === statusFilter);
    }

    // Filter by assignee
    if (assigneeFilter === 'mine') {
      filtered = filtered.filter(workflow => 
        workflow.claimed_by_user_id === user?.id ||
        workflow.advisor_reviewed_by === user?.id ||
        workflow.internal_committee_reviewed_by === user?.id ||
        workflow.partners_committee_reviewed_by === user?.id
      );
    } else if (assigneeFilter === 'unassigned') {
      filtered = filtered.filter(workflow => workflow.status === 'pending');
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(workflow =>
        workflow.client_name?.toLowerCase().includes(searchLower) ||
        workflow.vehicle_brand?.toLowerCase().includes(searchLower) ||
        workflow.vehicle_model?.toLowerCase().includes(searchLower) ||
        workflow.claimed_by_name?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredWorkflows(filtered);
  }, [workflows, searchTerm, statusFilter, assigneeFilter, isHydrated, user?.id]); // Dependencias específicas sin callbacks

  // Show loading during hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2EB872] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Access control
  if (!isAsesor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-8 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-red-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600">
            Solo los asesores tienen acceso al sistema de workflow de autorizaciones.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileCheck className="w-8 h-8 mr-3 text-[#2EB872]" />
                Workflow de Autorizaciones
              </h1>
              <p className="text-gray-600 mt-2">
                Sistema transparente de seguimiento y aprobación de solicitudes de crédito
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadWorkflowData}
                className="inline-flex items-center px-4 py-2 bg-[#2EB872] text-white text-sm font-medium rounded-lg hover:bg-[#25a066] transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-600">Pendientes</p>
                <p className="text-lg font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-600">Con Asesor</p>
                <p className="text-lg font-bold text-gray-900">{stats.claimed + stats.under_advisor_review}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-600">Comité Int.</p>
                <p className="text-lg font-bold text-gray-900">{stats.advisor_approved + stats.under_internal_committee}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Handshake className="w-4 h-4 text-pink-600" />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-600">Comité Soc.</p>
                <p className="text-lg font-bold text-gray-900">{stats.internal_committee_approved + stats.under_partners_committee}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-600">Aprobadas</p>
                <p className="text-lg font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-gray-600">Rechazadas</p>
                <p className="text-lg font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, vehículo, asesor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2EB872] focus:border-[#2EB872]"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-2">
                <span className="text-sm font-medium text-gray-700 self-center mr-2">Estado:</span>
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'pending', label: 'Pendientes' },
                  { value: 'claimed', label: 'Reclamados' },
                  { value: 'advisor_approved', label: 'Asesor OK' },
                  { value: 'under_internal_committee', label: 'Comité Int.' },
                  { value: 'under_partners_committee', label: 'Comité Soc.' },
                  { value: 'approved', label: 'Aprobados' },
                  { value: 'rejected', label: 'Rechazados' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`px-3 py-2 rounded-xl font-medium transition-colors text-xs ${
                      statusFilter === filter.value
                        ? 'bg-[#2EB872] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <span className="text-sm font-medium text-gray-700 self-center mr-2">Asignación:</span>
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'mine', label: 'Míos' },
                  { value: 'unassigned', label: 'Sin Asignar' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setAssigneeFilter(filter.value)}
                    className={`px-3 py-2 rounded-xl font-medium transition-colors text-xs ${
                      assigneeFilter === filter.value
                        ? 'bg-[#36A3E0] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Cards */}
        <div className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-[#2EB872] mr-3" />
              <span className="text-gray-600">Cargando workflow...</span>
            </div>
          )}

          {!isLoading && filteredWorkflows.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gray-100">
                <FileCheck className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No hay solicitudes</h3>
              <p className="mt-2 text-gray-500 max-w-md mx-auto">
                No se encontraron solicitudes que coincidan con los filtros aplicados.
              </p>
            </div>
          )}

          {!isLoading && filteredWorkflows.map((workflow) => (
            <AuthorizationWorkflowCard
              key={workflow.id}
              request={workflow}
              onRefresh={loadWorkflowData}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
