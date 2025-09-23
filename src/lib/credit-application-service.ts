import { supabaseClient } from './supabase'
import { GuestSessionService } from './guest-session-service'

// =========================================
// TIPOS E INTERFACES
// =========================================

export interface CreditApplication {
  id: string
  folio_number: string
  quote_id?: string
  simulation_id?: string
  
  // A) Datos del crédito
  product_type: string
  requested_amount?: number
  term_months?: number
  payment_frequency?: string
  resource_usage?: string
  
  // B) Datos del solicitante - Identidad
  paternal_surname?: string
  maternal_surname?: string
  first_names?: string
  marital_status?: string
  curp?: string
  rfc_with_homoclave?: string
  nss?: string
  birth_date?: string
  gender?: string
  nationality?: string
  birth_state?: string
  education_level?: string
  
  // B) Contacto
  personal_email?: string
  work_email?: string
  mobile_phone?: string
  landline_phone?: string
  
  // B) Domicilio
  street_and_number?: string
  interior_number?: string
  between_streets?: string
  neighborhood?: string
  municipality?: string
  state?: string
  postal_code?: string
  housing_type?: string
  residence_years?: number
  
  // C) Empleo e ingresos
  company_name?: string
  job_position?: string
  job_seniority_years?: number
  job_seniority_months?: number
  monthly_income?: number
  work_phone?: string
  work_extension?: string
  work_address?: string
  
  // D) Referencias personales
  reference_1_name?: string
  reference_1_relationship?: string
  reference_1_phone1?: string
  reference_1_phone2?: string
  reference_1_mobile?: string
  
  reference_2_name?: string
  reference_2_relationship?: string
  reference_2_phone1?: string
  reference_2_phone2?: string
  reference_2_mobile?: string
  
  reference_3_name?: string
  reference_3_relationship?: string
  reference_3_phone1?: string
  reference_3_phone2?: string
  reference_3_mobile?: string
  
  // E) Identificaciones
  ine_folio?: string
  passport_folio?: string
  professional_license_folio?: string
  
  // F) Declaraciones AML/PEP
  is_pep?: boolean
  pep_position?: string
  pep_period?: string
  has_pep_relative?: boolean
  pep_relative_name?: string
  pep_relative_position?: string
  pep_relative_relationship?: string
  acts_for_self?: boolean
  resources_are_legal?: boolean
  
  // G) Autorización SIC
  sic_authorization?: boolean
  sic_authorization_date?: string
  sic_authorization_place?: string
  collecting_advisor_name?: string
  
  // H) Aviso de Privacidad
  privacy_notice_accepted?: boolean
  privacy_notice_date?: string
  
  // I) Consentimiento marketing
  marketing_consent?: boolean
  
  // J) Uso interno
  internal_folio?: string
  executive_name?: string
  branch_office?: string
  
  // Checklist
  has_ine?: boolean
  has_address_proof?: boolean
  has_payroll_receipts?: boolean
  has_bank_statements?: boolean
  has_discount_mandate?: boolean
  
  // Resultado entrevista
  interview_result?: string
  
  // Metadatos
  status: string
  created_at: string
  updated_at: string
  created_by_user_id?: string
  ip_address?: string
  user_agent?: string
  
  // Firmas
  client_signature_date?: string
  advisor_signature_date?: string
  
  // PDF
  pdf_generated?: boolean
  pdf_generated_at?: string
  pdf_file_name?: string
  
  // Relaciones
  z_auto_quotes?: any
  z_auto_simulations?: any
}

export interface CreateCreditApplicationData {
  quote_id?: string
  simulation_id?: string
  product_type?: string
  requested_amount?: number
  term_months?: number
  payment_frequency?: string
  resource_usage?: string
  paternal_surname?: string
  maternal_surname?: string
  first_names?: string
  marital_status?: string
  curp?: string
  rfc_with_homoclave?: string
  nss?: string
  birth_date?: string
  gender?: string
  nationality?: string
  birth_state?: string
  education_level?: string
  personal_email?: string
  work_email?: string
  mobile_phone?: string
  landline_phone?: string
  street_and_number?: string
  interior_number?: string
  between_streets?: string
  neighborhood?: string
  municipality?: string
  state?: string
  postal_code?: string
  housing_type?: string
  residence_years?: number
  company_name?: string
  job_position?: string
  job_seniority_years?: number
  job_seniority_months?: number
  monthly_income?: number
  work_phone?: string
  work_extension?: string
  work_address?: string
  reference_1_name?: string
  reference_1_relationship?: string
  reference_1_phone1?: string
  reference_1_phone2?: string
  reference_1_mobile?: string
  reference_2_name?: string
  reference_2_relationship?: string
  reference_2_phone1?: string
  reference_2_phone2?: string
  reference_2_mobile?: string
  reference_3_name?: string
  reference_3_relationship?: string
  reference_3_phone1?: string
  reference_3_phone2?: string
  reference_3_mobile?: string
  ine_folio?: string
  passport_folio?: string
  professional_license_folio?: string
  is_pep?: boolean
  pep_position?: string
  pep_period?: string
  has_pep_relative?: boolean
  pep_relative_name?: string
  pep_relative_position?: string
  pep_relative_relationship?: string
  acts_for_self?: boolean
  resources_are_legal?: boolean
  sic_authorization?: boolean
  sic_authorization_date?: string
  sic_authorization_place?: string
  collecting_advisor_name?: string
  privacy_notice_accepted?: boolean
  privacy_notice_date?: string
  marketing_consent?: boolean
  internal_folio?: string
  executive_name?: string
  branch_office?: string
  has_ine?: boolean
  has_address_proof?: boolean
  has_payroll_receipts?: boolean
  has_bank_statements?: boolean
  has_discount_mandate?: boolean
  interview_result?: string
  status?: string
  created_by_user_id?: string
  client_signature_date?: string
  advisor_signature_date?: string
}

// =========================================
// SERVICIO PRINCIPAL
// =========================================

export class CreditApplicationService {
  
  /**
   * Crear una nueva solicitud de crédito (soporta usuarios registrados y sesiones de invitado)
   */
  static async createCreditApplication(data: CreateCreditApplicationData): Promise<{
    application: CreditApplication | null
    error: string | null
  }> {
    try {
      console.log('🔧 CreditApplicationService.createCreditApplication:', data)

      // Si no hay usuario logueado, crear/usar sesión de invitado
      let sessionToken = null
      if (!data.created_by_user_id) {
        sessionToken = GuestSessionService.getCurrentSessionToken()
        
        if (!sessionToken) {
          // Crear nueva sesión de invitado con datos básicos
          const { session, error: sessionError } = await GuestSessionService.createGuestSession({
            email: data.personal_email,
            phone: data.mobile_phone,
            name: `${data.first_names || ''} ${data.paternal_surname || ''}`.trim()
          })
          
          if (sessionError || !session) {
            console.error('❌ Error creating guest session:', sessionError)
            return { application: null, error: 'Error al crear sesión temporal' }
          }
          
          sessionToken = session.session_token
        }
      }

      const requestData = {
        ...data,
        session_token: sessionToken
      }

      const response = await fetch('/api/credit-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Error creating credit application:', result.error)
        return { application: null, error: result.error || 'Error al crear solicitud de crédito' }
      }

      console.log('✅ Credit application created:', result.credit_application?.folio_number)
      return { application: result.credit_application, error: null }
    } catch (error) {
      console.error('💥 Exception in createCreditApplication:', error)
      return { application: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Obtener solicitudes del usuario actual (registrado o invitado)
   * Para usuarios registrados, intenta reclamar solicitudes huérfanas automáticamente
   */
  static async getCurrentUserApplications(userId?: string, userEmail?: string, userName?: string): Promise<{
    applications: CreditApplication[]
    error: string | null
    claimed_count?: number
  }> {
    try {
      if (userId) {
        // Usuario registrado - intentar reclamar solicitudes huérfanas primero
        if (userEmail) {
          try {
            console.log('🔍 Intentando reclamar solicitudes huérfanas para usuario:', userId)
            await this.claimUserApplications(userId, userEmail, userName)
          } catch (claimError) {
            console.warn('⚠️ Error reclamando solicitudes (continuando):', claimError)
          }
        }
        
        // Obtener solicitudes del usuario
        return this.getCreditApplications({ created_by: userId })
      } else {
        // Usuario invitado - usar sesión
        const sessionToken = GuestSessionService.getCurrentSessionToken()
        if (!sessionToken) {
          return { applications: [], error: null }
        }

        const { applications, error } = await GuestSessionService.getGuestCreditApplications(sessionToken)
        if (error) {
          return { applications: [], error }
        }

        return { applications, error: null }
      }
    } catch (error) {
      console.error('💥 Exception getting current user applications:', error)
      return { applications: [], error: 'Error interno del servidor' }
    }
  }

  /**
   * Reclamar solicitudes huérfanas para un usuario registrado
   */
  static async claimUserApplications(userId: string, userEmail: string, userName?: string): Promise<{
    claimed_count: number
    claimed_details: any[]
    error: string | null
  }> {
    try {
      const response = await fetch('/api/credit-applications/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          user_email: userEmail,
          user_name: userName
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { claimed_count: 0, claimed_details: [], error: errorData.error || 'Error reclamando solicitudes' }
      }

      const data = await response.json()
      return {
        claimed_count: data.claimed_count || 0,
        claimed_details: data.claimed_details || [],
        error: null
      }
    } catch (error) {
      console.error('💥 Exception claiming applications:', error)
      return { claimed_count: 0, claimed_details: [], error: 'Error interno del servidor' }
    }
  }

  /**
   * Obtener todas las solicitudes de crédito con filtros
   */
  static async getCreditApplications(filters?: {
    status?: string
    created_by?: string
    quote_id?: string
    folio_number?: string
    limit?: number
    offset?: number
  }): Promise<{
    applications: CreditApplication[]
    total: number
    error: string | null
  }> {
    try {
      console.log('🔧 CreditApplicationService.getCreditApplications:', filters)

      const params = new URLSearchParams()
      if (filters?.status) params.append('status', filters.status)
      if (filters?.created_by) params.append('created_by', filters.created_by)
      if (filters?.quote_id) params.append('quote_id', filters.quote_id)
      if (filters?.folio_number) params.append('folio_number', filters.folio_number)
      if (filters?.limit) params.append('limit', filters.limit.toString())
      if (filters?.offset) params.append('offset', filters.offset.toString())

      const response = await fetch(`/api/credit-applications?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Error fetching credit applications:', result.error)
        return { applications: [], total: 0, error: result.error || 'Error al obtener solicitudes de crédito' }
      }

      console.log('✅ Fetched credit applications:', result.credit_applications?.length || 0)
      return {
        applications: result.credit_applications || [],
        total: result.total || 0,
        error: null
      }
    } catch (error) {
      console.error('💥 Exception in getCreditApplications:', error)
      return { applications: [], total: 0, error: 'Error interno del servidor' }
    }
  }

  /**
   * Obtener una solicitud específica de crédito
   */
  static async getCreditApplication(id: string): Promise<{
    application: CreditApplication | null
    error: string | null
  }> {
    try {
      console.log('🔧 CreditApplicationService.getCreditApplication:', id)

      const response = await fetch(`/api/credit-applications/${id}`)
      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Error fetching credit application:', result.error)
        return { application: null, error: result.error || 'Error al obtener solicitud de crédito' }
      }

      console.log('✅ Fetched credit application:', result.credit_application?.folio_number)
      return { application: result.credit_application, error: null }
    } catch (error) {
      console.error('💥 Exception in getCreditApplication:', error)
      return { application: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Actualizar una solicitud de crédito
   */
  static async updateCreditApplication(id: string, data: Partial<CreateCreditApplicationData>): Promise<{
    application: CreditApplication | null
    error: string | null
  }> {
    try {
      console.log('🔧 CreditApplicationService.updateCreditApplication:', id, data)
      console.log('🔧 Making PUT request to:', `/api/credit-applications/${id}`)

      const response = await fetch(`/api/credit-applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      console.log('🔧 Response received:', response.status, response.statusText)

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Error updating credit application:', result.error)
        console.error('❌ Response status:', response.status)
        console.error('❌ Response details:', result)
        return { 
          application: null, 
          error: result.error || `Error ${response.status}: Error al actualizar solicitud de crédito` 
        }
      }

      console.log('✅ Credit application updated:', result.credit_application?.folio_number)
      return { application: result.credit_application, error: null }
    } catch (error) {
      console.error('💥 Exception in updateCreditApplication:', error)
      return { application: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Cancelar una solicitud de crédito
   */
  static async cancelCreditApplication(id: string): Promise<{
    application: CreditApplication | null
    error: string | null
  }> {
    try {
      console.log('🔧 CreditApplicationService.cancelCreditApplication:', id)

      const response = await fetch(`/api/credit-applications/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ Error cancelling credit application:', result.error)
        return { application: null, error: result.error || 'Error al cancelar solicitud de crédito' }
      }

      console.log('✅ Credit application cancelled:', result.credit_application?.folio_number)
      return { application: result.credit_application, error: null }
    } catch (error) {
      console.error('💥 Exception in cancelCreditApplication:', error)
      return { application: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Pre-llenar solicitud desde cotización y simulación
   */
  static async prefillFromQuote(quoteId: string, simulationId?: string): Promise<{
    data: Partial<CreateCreditApplicationData> | null
    error: string | null
  }> {
    try {
      console.log('🔧 CreditApplicationService.prefillFromQuote:', quoteId, 'simulationId:', simulationId)

      // Validar que sea un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(quoteId)) {
        console.warn('⚠️ Invalid UUID for quote_id:', quoteId)
        return { data: null, error: 'ID de cotización inválido' }
      }

      // Obtener datos de la cotización directamente de Supabase
      const { data: quote, error } = await supabaseClient
        .from('z_auto_quotes')
        .select('*')
        .eq('id', quoteId)
        .single()

      if (error || !quote) {
        console.error('❌ Quote not found:', error)
        return { data: null, error: 'Cotización no encontrada' }
      }

      // Obtener datos de la simulación si se proporciona simulationId
      let simulation = null
      if (simulationId && uuidRegex.test(simulationId)) {
        console.log('🔄 Obteniendo datos de simulación:', simulationId)
        const { data: simData, error: simError } = await supabaseClient
          .from('z_auto_simulations')
          .select('*')
          .eq('id', simulationId)
          .single()

        if (simData && !simError) {
          simulation = simData
          console.log('✅ Datos de simulación obtenidos:', simulation)
        } else {
          console.warn('⚠️ No se pudo obtener simulación:', simError)
        }
      }

      // Extraer solo la primera palabra del nombre
      const firstName = quote.client_name?.split(' ')[0] || ''
      
      // Calcular monto solicitado desde simulación o cotización
      const requestedAmount = simulation?.financed_amount || (quote.vehicle_value - quote.down_payment_amount)
      
      // Obtener meses desde simulación o usar default
      const termMonths = simulation?.term_months || 48 // Default 48 meses
      
      // Mapear datos de cotización y simulación a solicitud
      const prefillData: Partial<CreateCreditApplicationData> = {
        quote_id: quote.id,
        simulation_id: simulationId || undefined,
        
        // Datos básicos - SIEMPRE AUTOMOTRIZ Y MENSUAL
        product_type: 'Auto',
        payment_frequency: 'mensual', // Cambiar a mensual como solicitas
        
        // Datos financieros desde simulación
        requested_amount: requestedAmount,
        term_months: termMonths,
        
        // Datos personales - SOLO LO BÁSICO
        first_names: firstName, // Solo primera palabra del nombre
        personal_email: quote.client_email,
        mobile_phone: quote.client_phone,
        
        // Descripción del vehículo
        resource_usage: `Compra de ${quote.vehicle_brand} ${quote.vehicle_model} ${quote.vehicle_year}`,
        
        // Nacionalidad por defecto
        nationality: 'Mexicana'
      }

      console.log('✅ Prefill data generated:', prefillData)
      return { data: prefillData, error: null }
    } catch (error) {
      console.error('💥 Exception in prefillFromQuote:', error)
      return { data: null, error: 'Error interno del servidor' }
    }
  }

  /**
   * Obtener todas las solicitudes (método simplificado para dashboard)
   */
  static async getAllCreditApplications(): Promise<CreditApplication[]> {
    try {
      const response = await fetch('/api/credit-applications')
      if (!response.ok) {
        throw new Error('Error al obtener las solicitudes')
      }
      return await response.json()
    } catch (error) {
      console.error('Error:', error)
      throw error
    }
  }

  /**
   * Validar completitud de solicitud
   */
  static validateCompleteness(application: Partial<CreateCreditApplicationData>): {
    isComplete: boolean
    missingFields: string[]
    completionPercentage: number
  } {
    const requiredFields = [
      'first_names',
      'paternal_surname',
      'personal_email',
      'mobile_phone',
      'curp',
      'rfc_with_homoclave',
      'birth_date',
      'street_and_number',
      'neighborhood',
      'municipality',
      'state',
      'postal_code',
      'company_name',
      'job_position',
      'monthly_income',
      'reference_1_name',
      'reference_1_relationship',
      'reference_1_phone1',
      'privacy_notice_accepted',
      'sic_authorization'
    ]

    const missingFields = requiredFields.filter(field => {
      const value = application[field as keyof CreateCreditApplicationData]
      return !value || (typeof value === 'string' && value.trim() === '')
    })

    const completionPercentage = Math.round(
      ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
    )

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      completionPercentage
    }
  }
}
