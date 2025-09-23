/**
 * SERVICIO DE AUTORIZACIONES - VERSIÓN SIMPLIFICADA
 * Para compatibilidad con las importaciones existentes
 */

import { supabaseClient } from './supabase'

export interface AuthorizationRequest {
  id: string
  simulation_id?: string | null
  quote_id?: string | null
  status: 'pending' | 'in_review' | 'advisor_approved' | 'internal_committee' | 'partners_committee' | 'approved' | 'rejected' | 'cancelled'
    priority: 'low' | 'medium' | 'high' | 'urgent'
  risk_level: 'low' | 'medium' | 'high'
  client_name?: string
      client_email?: string
      client_phone?: string
      vehicle_brand?: string
      vehicle_model?: string
      vehicle_year?: number
      vehicle_value?: number
      requested_amount?: number
      monthly_payment?: number
      term_months?: number
      agency_name?: string
      dealer_name?: string
      promoter_code?: string
  created_by_user_id?: string
  assigned_to_user_id?: string
  claimed_by_user_id?: string
  advisor_reviewed_by?: string
  internal_committee_reviewed_by?: string
  partners_committee_reviewed_by?: string
      client_comments?: string
  internal_notes?: string
  approval_notes?: string
  rejection_reason?: string
  authorization_data?: Record<string, unknown>
  competitors_data?: Array<{ name: string; price: number }>
  created_at: string
  updated_at?: string
  claimed_at?: string
  advisor_reviewed_at?: string
  internal_committee_reviewed_at?: string
  partners_committee_reviewed_at?: string
  approved_at?: string
  rejected_at?: string
  ip_address?: string
  user_agent?: string
}

export class AuthorizationService {
  
  /**
   * Actualizar una solicitud de autorización
   */
  static async updateAuthorizationRequest(id: string, data: any): Promise<{
    request: AuthorizationRequest | null
    error: string | null
  }> {
    try {
      console.log('🔄 AuthorizationService.updateAuthorizationRequest:', { id, data })

      const response = await fetch('/api/authorization-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Error updating authorization request:', result.error)
        return { request: null, error: result.error || 'Error al actualizar solicitud de autorización' }
      }

      console.log('✅ Authorization request updated:', result.authorization_request?.id)
      return { request: result.authorization_request, error: null }
    } catch (error) {
      console.error('💥 Exception in updateAuthorizationRequest:', error)
      return { request: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Reclamar una solicitud por un asesor
   */
  static async claimAuthorizationRequest(
    requestId: string,
    advisorId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('🎯 Claiming authorization request:', { requestId, advisorId })

      const { data, error } = await supabaseClient.rpc('claim_authorization_request', {
        p_request_id: requestId,
        p_advisor_id: advisorId
      })

      if (error) {
        console.error('❌ Error claiming authorization request:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Authorization request claimed successfully')
      return { success: data || true, error: null }
    } catch (error) {
      console.error('💥 Exception in claimAuthorizationRequest:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  /**
   * Marcar como revisado por asesor
   */
  static async markAdvisorReviewed(
    requestId: string,
    advisorId: string,
    notes?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('✅ Marking as advisor reviewed:', { requestId, advisorId, notes })

      const { data, error } = await supabaseClient.rpc('mark_advisor_reviewed', {
        p_request_id: requestId,
        p_advisor_id: advisorId,
        p_notes: notes
      })

      if (error) {
        console.error('❌ Error marking advisor reviewed:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Marked as advisor reviewed successfully')
      return { success: data || true, error: null }
    } catch (error) {
      console.error('💥 Exception in markAdvisorReviewed:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  /**
   * Enviar a comité interno
   */
  static async approveByInternalCommittee(
    requestId: string,
    committeeMemberId: string,
    notes?: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('🏛️ Sending to internal committee:', { requestId, committeeMemberId, notes })

      const { data, error } = await supabaseClient.rpc('approve_by_internal_committee', {
        p_request_id: requestId,
        p_committee_member_id: committeeMemberId,
        p_notes: notes
      })

      if (error) {
        console.error('❌ Error sending to internal committee:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Sent to internal committee successfully')
      return { success: data || true, error: null }
    } catch (error) {
      console.error('💥 Exception in approveByInternalCommittee:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  /**
   * Rechazar solicitud
   */
  static async rejectAuthorizationRequest(
    requestId: string,
    userId: string,
    notes: string,
    stage: string = 'general'
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      console.log('❌ Rejecting authorization request:', { requestId, userId, notes, stage })

      const { data, error } = await supabaseClient.rpc('reject_authorization_request', {
        p_request_id: requestId,
        p_user_id: userId,
        p_notes: notes,
        p_stage: stage
      })

      if (error) {
        console.error('❌ Error rejecting authorization request:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Authorization request rejected successfully')
      return { success: data || true, error: null }
    } catch (error) {
      console.error('💥 Exception in rejectAuthorizationRequest:', error)
      return { success: false, error: 'Error interno del servidor' }
    }
  }

  /**
   * Obtener métricas básicas
   */
  static async getMetrics(): Promise<any> {
    try {
      const { data: requests, error } = await supabaseClient
        .from('z_auto_authorization_requests')
        .select('*')

      if (error) throw error

      const metrics = {
        total: requests?.length || 0,
        pending: requests?.filter(r => r.status === 'pending').length || 0,
        in_review: requests?.filter(r => r.status === 'in_review').length || 0,
        advisor_approved: requests?.filter(r => r.status === 'advisor_approved').length || 0,
        internal_committee: requests?.filter(r => r.status === 'internal_committee').length || 0,
        partners_committee: requests?.filter(r => r.status === 'partners_committee').length || 0,
        approved: requests?.filter(r => r.status === 'approved').length || 0,
        rejected: requests?.filter(r => r.status === 'rejected').length || 0,
        cancelled: requests?.filter(r => r.status === 'cancelled').length || 0,
        by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
        by_risk_level: { low: 0, medium: 0, high: 0 },
        avg_processing_time_hours: 0
      }

      return metrics
    } catch (error) {
      console.error('💥 Exception in getMetrics:', error)
      return {
        total: 0,
        pending: 0,
        in_review: 0,
        advisor_approved: 0,
        internal_committee: 0,
        partners_committee: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
        by_risk_level: { low: 0, medium: 0, high: 0 },
        avg_processing_time_hours: 0
      }
    }
  }
}

export default AuthorizationService






