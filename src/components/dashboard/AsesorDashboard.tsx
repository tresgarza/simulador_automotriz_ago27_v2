"use client";
import { useState, useEffect } from "react";
import { BarChart3, Users, Calculator, FileText, TrendingUp, Download, Search, Filter } from "lucide-react";
import { SimulationService, SimulationWithQuote } from "../../../lib/simulation-service";
import { useAuth } from "../../../lib/auth";
import { formatMXN } from "@/lib/utils";

interface DashboardStats {
  totalSimulations: number;
  simulationsToday: number;
  simulationsThisMonth: number;
  topTiers: Array<{ tier: string; count: number }>;
  topTerms: Array<{ term: number; count: number }>;
}

export function AsesorDashboard() {
  const { user, isAsesor } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalSimulations: 0,
    simulationsToday: 0,
    simulationsThisMonth: 0,
    topTiers: [],
    topTerms: []
  });
  const [recentSimulations, setRecentSimulations] = useState<SimulationWithQuote[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'simulations' | 'reports'>('overview');

  useEffect(() => {
    if (isAsesor && user) {
      loadDashboardData();
    }
  }, [isAsesor, user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Cargar estadísticas
      const statsData = await SimulationService.getSimulationStats();
      setStats(statsData);

      // Cargar simulaciones recientes
      const simulations = await SimulationService.getUserSimulations(user!.id, 'asesor');
      setRecentSimulations(simulations.slice(0, 10)); // Solo las 10 más recientes
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadDashboardData();
      return;
    }

    try {
      const results = await SimulationService.searchSimulations(searchTerm);
      setRecentSimulations(results);
    } catch (error) {
      console.error('Error searching simulations:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvContent = await SimulationService.exportSimulationsToCSV();
      
      // Crear y descargar archivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `simulaciones_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  if (!isAsesor) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
        <p className="text-gray-600">Solo los asesores pueden acceder al dashboard.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Asesor</h1>
        <p className="text-gray-600">Bienvenido, {user?.name}</p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Resumen', icon: BarChart3 },
              { id: 'simulations', name: 'Simulaciones', icon: Calculator },
              { id: 'reports', name: 'Reportes', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'simulations' | 'reports')}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Calculator className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Simulaciones</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalSimulations}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Hoy</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.simulationsToday}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Este Mes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.simulationsThisMonth}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tasa Más Usada</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.topTiers[0]?.tier || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Tiers */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasas Más Utilizadas</h3>
              <div className="space-y-3">
                {stats.topTiers.map((tier, index) => (
                  <div key={tier.tier} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        index === 0 ? 'bg-emerald-500' : 
                        index === 1 ? 'bg-blue-500' : 'bg-gray-400'
                      }`}></div>
                      <span className="font-medium">Tasa {tier.tier}</span>
                    </div>
                    <span className="text-gray-600">{tier.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Terms */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plazos Más Solicitados</h3>
              <div className="space-y-3">
                {stats.topTerms.map((term, index) => (
                  <div key={term.term} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        index === 0 ? 'bg-emerald-500' : 
                        index === 1 ? 'bg-blue-500' : 'bg-gray-400'
                      }`}></div>
                      <span className="font-medium">{term.term} meses</span>
                    </div>
                    <span className="text-gray-600">{term.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simulations Tab */}
      {activeTab === 'simulations' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente, email, teléfono, vehículo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Buscar
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>

          {/* Simulations Table */}
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
                      Tasa/Plazo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pago Mensual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSimulations.map((simulation) => (
                    <tr key={simulation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {simulation.quote.client_name || 'Cliente Anónimo'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {simulation.quote.client_email || simulation.quote.client_phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {simulation.quote.vehicle_brand} {simulation.quote.vehicle_model}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatMXN(simulation.quote.vehicle_value)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            simulation.tier_code === 'A' ? 'bg-green-100 text-green-800' :
                            simulation.tier_code === 'B' ? 'bg-blue-100 text-blue-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {simulation.tier_code}
                          </span>
                          <span className="ml-2 text-sm text-gray-600">
                            {simulation.term_months}m
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatMXN(simulation.monthly_payment)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(simulation.calculated_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Reportes Avanzados</h3>
          <p className="text-gray-600 mb-6">
            Los reportes avanzados estarán disponibles próximamente.
          </p>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Exportar Datos Actuales
          </button>
        </div>
      )}
    </div>
  );
}

