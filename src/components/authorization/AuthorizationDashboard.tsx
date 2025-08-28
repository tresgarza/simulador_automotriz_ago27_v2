"use client";
import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Users,
  TrendingUp,
  Activity
} from "lucide-react";
import { AuthorizationService } from "../../lib/authorization-service";

interface Metrics {
  total: number;
  pending: number;
  in_review: number;
  approved: number;
  rejected: number;
  cancelled: number;
  by_priority: Record<string, number>;
  by_risk_level: Record<string, number>;
  avg_processing_time_hours: number;
}

interface AuthorizationDashboardProps {
  className?: string;
}

export function AuthorizationDashboard({ className = "" }: AuthorizationDashboardProps) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await AuthorizationService.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Error loading metrics:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar métricas');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
        <div className="text-center text-red-600">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
          <button 
            onClick={loadMetrics}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const statusCards = [
    {
      title: "Pendientes",
      value: metrics.pending,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200"
    },
    {
      title: "En Revisión",
      value: metrics.in_review,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Aprobadas",
      value: metrics.approved,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      title: "Rechazadas",
      value: metrics.rejected,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    }
  ];

  const priorityColors: Record<string, string> = {
    low: "bg-gray-400",
    medium: "bg-yellow-400",
    high: "bg-orange-500",
    urgent: "bg-red-600"
  };

  const riskColors: Record<string, string> = {
    low: "bg-green-400",
    medium: "bg-yellow-400",
    high: "bg-red-500"
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BarChart3 className="w-6 h-6 text-emerald-600 mr-3" />
          <h3 className="text-xl font-bold text-gray-900">Dashboard de Autorizaciones</h3>
        </div>
        <button 
          onClick={loadMetrics}
          className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statusCards.map((card, index) => (
          <div 
            key={index}
            className={`${card.bgColor} ${card.borderColor} border rounded-xl p-4`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <card.icon className={`w-8 h-8 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Requests */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Solicitudes</p>
              <p className="text-3xl font-bold text-gray-900">{metrics.total}</p>
            </div>
            <Users className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        {/* Average Processing Time */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
              <p className="text-3xl font-bold text-gray-900">
                {metrics.avg_processing_time_hours.toFixed(1)}h
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-gray-600" />
          </div>
        </div>

        {/* Approval Rate */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasa de Aprobación</p>
              <p className="text-3xl font-bold text-gray-900">
                {metrics.total > 0 ? ((metrics.approved / (metrics.approved + metrics.rejected)) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Priority and Risk Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Por Prioridad</h4>
          <div className="space-y-3">
            {Object.entries(metrics.by_priority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${priorityColors[priority]} mr-3`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{priority}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Level Distribution */}
        <div className="bg-gray-50 rounded-xl p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Por Nivel de Riesgo</h4>
          <div className="space-y-3">
            {Object.entries(metrics.by_risk_level).map(([risk, count]) => (
              <div key={risk} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${riskColors[risk]} mr-3`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{risk}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
