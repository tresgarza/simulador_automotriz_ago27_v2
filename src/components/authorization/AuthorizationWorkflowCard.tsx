"use client";

import React, { useState } from "react";
import {
  User, Clock, CheckCircle, XCircle, AlertTriangle, 
  Users, Building, Handshake, Eye, MessageSquare,
  ChevronRight, Calendar, Timer
} from "lucide-react";
import { formatMXN } from "@/lib/utils";
import { AuthorizationService } from "../../../lib/authorization-service";
import { useAuth } from "../../../lib/auth";

interface AuthorizationWorkflowCardProps {
  request: any; // Datos de authorization_workflow_view
  onRefresh: () => void;
}

export function AuthorizationWorkflowCard({ request, onRefresh }: AuthorizationWorkflowCardProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');

  // Verificar permisos del usuario actual
  const canClaim = user?.user_type === 'asesor' && request.status === 'pending';
  const canAdvisorReview = user?.id === request.claimed_by_user_id && request.status === 'claimed';
  const canInternalCommittee = (user?.email === 'amedina@fincentiva.com.mx' || user?.email === 'dgarza@fincentiva.com.mx') 
    && request.status === 'advisor_approved';
  const canPartnersCommittee = (user?.email === 'amedina@fincentiva.com.mx' || user?.email === 'dgarza@fincentiva.com.mx') 
    && request.status === 'internal_committee_approved';

  const handleClaim = async () => {
    if (!user?.id) return;
    
    setIsProcessing(true);
    try {
      const { success, error } = await AuthorizationService.claimAuthorizationRequest(request.id, user.id);
      
      if (success) {
        onRefresh();
      } else {
        alert('Error al reclamar solicitud: ' + error);
      }
    } catch (error) {
      console.error('Error claiming request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdvisorApprove = async () => {
    if (!user?.id) return;
    
    setIsProcessing(true);
    try {
      const { success, error } = await AuthorizationService.markAdvisorReviewed(request.id, user.id, notes);
      
      if (success) {
        alert('✅ Solicitud aprobada y enviada al Comité Interno');
        onRefresh();
      } else {
        alert('Error al aprobar solicitud: ' + error);
      }
    } catch (error) {
      console.error('Error approving request:', error);
    } finally {
      setIsProcessing(false);
      setShowNotes(false);
      setNotes('');
    }
  };

  const handleInternalCommitteeApprove = async () => {
    if (!user?.id) return;
    
    setIsProcessing(true);
    try {
      const { success, error } = await AuthorizationService.approveByInternalCommittee(request.id, user.id, notes);
      
      if (success) {
        alert('✅ Solicitud aprobada por Comité Interno y enviada al Comité de Socios');
        onRefresh();
      } else {
        alert('Error al aprobar por comité interno: ' + error);
      }
    } catch (error) {
      console.error('Error approving by internal committee:', error);
    } finally {
      setIsProcessing(false);
      setShowNotes(false);
      setNotes('');
    }
  };

  const handlePartnersCommitteeApprove = async () => {
    if (!user?.id) return;
    
    setIsProcessing(true);
    try {
      const { success, error } = await AuthorizationService.approveByPartnersCommittee(request.id, user.id, notes);
      
      if (success) {
        alert('✅ Solicitud APROBADA FINAL por Comité de Socios');
        onRefresh();
      } else {
        alert('Error al aprobar por comité de socios: ' + error);
      }
    } catch (error) {
      console.error('Error approving by partners committee:', error);
    } finally {
      setIsProcessing(false);
      setShowNotes(false);
      setNotes('');
    }
  };

  const handleReject = async (stage: string) => {
    if (!user?.id || !notes.trim()) {
      alert('Por favor agrega una nota explicando el motivo del rechazo');
      return;
    }
    
    setIsProcessing(true);
    try {
      const { success, error } = await AuthorizationService.rejectAuthorizationRequest(request.id, user.id, notes, stage);
      
      if (success) {
        alert('❌ Solicitud rechazada');
        onRefresh();
      } else {
        alert('Error al rechazar solicitud: ' + error);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setIsProcessing(false);
      setShowNotes(false);
      setNotes('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'claimed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'under_advisor_review': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'advisor_approved': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'under_internal_committee': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'internal_committee_approved': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'under_partners_committee': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'claimed': return <User className="w-4 h-4" />;
      case 'under_advisor_review': return <Eye className="w-4 h-4" />;
      case 'advisor_approved': return <CheckCircle className="w-4 h-4" />;
      case 'under_internal_committee': return <Users className="w-4 h-4" />;
      case 'internal_committee_approved': return <Building className="w-4 h-4" />;
      case 'under_partners_committee': return <Handshake className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-4">
      {/* Header con información básica */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{request.client_name}</h3>
          <p className="text-sm text-gray-600">
            {request.vehicle_brand} {request.vehicle_model} {request.vehicle_year} • {formatMXN(request.requested_amount)}
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
            {getStatusIcon(request.status)}
            <span className="ml-2">{request.status_display}</span>
          </span>
          <p className="text-xs text-gray-500 mt-1">{formatMXN(request.monthly_payment)}/mes</p>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {/* Etapa 1: Asesor */}
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            ['pending', 'claimed', 'under_advisor_review'].includes(request.status) 
              ? 'bg-blue-50 border-2 border-blue-200' 
              : request.advisor_reviewed_at 
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-gray-50 border-2 border-gray-200'
          }`}>
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">Asesor</span>
            {request.claimed_by_name && (
              <span className="text-xs text-gray-600">({request.claimed_by_name})</span>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-gray-400" />

          {/* Etapa 2: Comité Interno */}
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            ['advisor_approved', 'under_internal_committee'].includes(request.status)
              ? 'bg-orange-50 border-2 border-orange-200'
              : request.internal_committee_reviewed_at
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-gray-50 border-2 border-gray-200'
          }`}>
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Comité Interno</span>
            {request.internal_committee_name && (
              <span className="text-xs text-gray-600">({request.internal_committee_name})</span>
            )}
          </div>

          <ChevronRight className="w-4 h-4 text-gray-400" />

          {/* Etapa 3: Comité de Socios */}
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
            ['internal_committee_approved', 'under_partners_committee'].includes(request.status)
              ? 'bg-pink-50 border-2 border-pink-200'
              : request.status === 'approved'
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-gray-50 border-2 border-gray-200'
          }`}>
            <Handshake className="w-4 h-4" />
            <span className="text-sm font-medium">Comité de Socios</span>
            {request.partners_committee_name && (
              <span className="text-xs text-gray-600">({request.partners_committee_name})</span>
            )}
          </div>
        </div>
      </div>

      {/* Información de tiempos */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <Timer className="w-3 h-3 text-blue-600" />
            <span className="text-gray-600">Asesor</span>
          </div>
          <p className="font-medium">{request.hours_in_advisor_review?.toFixed(1) || 0}h</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <Timer className="w-3 h-3 text-orange-600" />
            <span className="text-gray-600">Comité Int.</span>
          </div>
          <p className="font-medium">{request.hours_in_internal_committee?.toFixed(1) || 0}h</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <Timer className="w-3 h-3 text-pink-600" />
            <span className="text-gray-600">Comité Soc.</span>
          </div>
          <p className="font-medium">{request.hours_in_partners_committee?.toFixed(1) || 0}h</p>
        </div>
      </div>

      {/* Próxima acción requerida */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span className="text-sm font-medium text-gray-900">Próxima Acción:</span>
        </div>
        <p className="text-sm text-gray-700">{request.next_action}</p>
      </div>

      {/* Botones de acción según el estado y permisos */}
      <div className="flex flex-wrap gap-2">
        {canClaim && (
          <button
            onClick={handleClaim}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <User className="w-4 h-4" />
            <span>Reclamar Caso</span>
          </button>
        )}

        {canAdvisorReview && (
          <button
            onClick={() => setShowNotes(true)}
            disabled={isProcessing}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Revisado por Asesor</span>
          </button>
        )}

        {canInternalCommittee && (
          <button
            onClick={() => setShowNotes(true)}
            disabled={isProcessing}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>Aprobar - Comité Interno</span>
          </button>
        )}

        {canPartnersCommittee && (
          <button
            onClick={() => setShowNotes(true)}
            disabled={isProcessing}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <Handshake className="w-4 h-4" />
            <span>Aprobar - Comité de Socios</span>
          </button>
        )}

        {/* Botón de rechazar (disponible en varias etapas) */}
        {(canAdvisorReview || canInternalCommittee || canPartnersCommittee) && (
          <button
            onClick={() => {
              setShowNotes(true);
              // Marcar como rechazo
            }}
            disabled={isProcessing}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <XCircle className="w-4 h-4" />
            <span>Rechazar</span>
          </button>
        )}
      </div>

      {/* Modal de notas */}
      {showNotes && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {canAdvisorReview && 'Notas de Revisión del Asesor'}
              {canInternalCommittee && 'Notas del Comité Interno'}
              {canPartnersCommittee && 'Notas del Comité de Socios'}
            </h3>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agregar comentarios sobre la decisión..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
            
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowNotes(false);
                  setNotes('');
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancelar
              </button>
              
              <button
                onClick={() => {
                  if (canAdvisorReview) handleAdvisorApprove();
                  else if (canInternalCommittee) handleInternalCommitteeApprove();
                  else if (canPartnersCommittee) handlePartnersCommitteeApprove();
                }}
                disabled={!notes.trim()}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Aprobar
              </button>
              
              <button
                onClick={() => handleReject(
                  canAdvisorReview ? 'advisor' : 
                  canInternalCommittee ? 'internal_committee' : 
                  canPartnersCommittee ? 'partners_committee' : 'general'
                )}
                disabled={!notes.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

