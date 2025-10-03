import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../lib/supabase'

// Función para generar folio automático
async function generateFolioNumber(): Promise<string> {
  const currentYear = new Date().getFullYear()
  
  // Obtener el último folio del año actual
  const { data: lastApplication } = await supabaseClient
    .from('z_auto_credit_applications')
    .select('folio_number')
    .like('folio_number', `SOL-${currentYear}-%`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let nextNumber = 1
  if (lastApplication?.folio_number) {
    const lastNumber = parseInt(lastApplication.folio_number.split('-')[2])
    nextNumber = lastNumber + 1
  }

  return `SOL-${currentYear}-${nextNumber.toString().padStart(4, '0')}`
}

// POST - Crear nueva solicitud de crédito
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 [DEBUG] Credit application request body:', JSON.stringify(body, null, 2))
    
    const {
      // Relación opcional con cotización
      quote_id,
      simulation_id,
      session_token, // Para sesiones de invitado
      
      // A) Datos del crédito
      product_type = 'Auto',
      requested_amount,
      term_months,
      payment_frequency,
      resource_usage,
      
      // Información adicional
      branch_office,
      collecting_advisor_name,
      
      // B) Datos del solicitante - Identidad
      paternal_surname,
      maternal_surname,
      first_names,
      marital_status,
      curp,
      rfc_with_homoclave,
      rfc_homoclave,
      nss,
      birth_date,
      birth_country,
      gender,
      nationality,
      birth_state,
      education_level,
      electronic_signature_series,
      dependents_count,
      
      // B) Contacto
      personal_email,
      work_email,
      mobile_phone,
      landline_phone,
      emergency_phone,
      
      // B) Domicilio
      street_and_number,
      interior_number,
      between_streets,
      neighborhood,
      municipality,
      state,
      postal_code,
      housing_type,
      residence_years,
      country,
      
      // C) Empleo e ingresos
      company_name,
      job_position,
      occupation,
      immediate_supervisor,
      job_seniority_years,
      job_seniority_months,
      monthly_income,
      work_phone,
      work_extension,
      work_address,
      
      // D) Referencias personales
      reference_1_name,
      reference_1_relationship,
      reference_1_phone1,
      reference_1_phone2,
      reference_1_mobile,
      
      reference_2_name,
      reference_2_relationship,
      reference_2_phone1,
      reference_2_phone2,
      reference_2_mobile,
      
      reference_3_name,
      reference_3_relationship,
      reference_3_phone1,
      reference_3_phone2,
      reference_3_mobile,
      
      // E) Identificaciones
      ine_folio,
      passport_folio,
      professional_license_folio,
      
      // F) Declaraciones AML/PEP
      is_pep = false,
      pep_position,
      pep_period,
      has_pep_relative = false,
      pep_relative_name,
      pep_relative_position,
      pep_relative_relationship,
      acts_for_self = true,
      resources_are_legal = true,
      
      // G) Autorización SIC
      sic_authorization = false,
      sic_authorization_date,
      sic_authorization_place,
      
      // H) Aviso de Privacidad
      privacy_notice_accepted = false,
      privacy_notice_date,
      
      // I) Consentimiento marketing
      marketing_consent = false,
      
      // J) Uso interno
      internal_folio,
      executive_name,
      
      // Checklist
      has_ine = false,
      has_address_proof = false,
      has_payroll_receipts = false,
      has_bank_statements = false,
      has_discount_mandate = false,
      
      // Resultado entrevista
      interview_result,
      
      // Metadatos
      created_by_user_id,
      status = 'draft',
      
      // Firmas
      client_signature_date,
      advisor_signature_date
    } = body

    // Validaciones básicas
    if (!first_names || !paternal_surname) {
      console.error('❌ [ERROR] Faltan campos requeridos: nombre y apellido paterno')
      return NextResponse.json(
        { error: 'Se requiere nombre y apellido paterno' },
        { status: 400 }
      )
    }

    // Obtener IP y User Agent
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1'
    const user_agent = request.headers.get('user-agent') || ''

    // Validar UUIDs si se proporcionan
    const isValidUUID = (uuid: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      return uuidRegex.test(uuid)
    }

    // Limpiar UUIDs inválidos
    const cleanQuoteId = quote_id && isValidUUID(quote_id) ? quote_id : null
    const cleanSimulationId = simulation_id && isValidUUID(simulation_id) ? simulation_id : null

    // Manejar sesión de invitado si no hay usuario registrado
    let guestSessionId = null
    if (!created_by_user_id && session_token) {
      // Verificar que la sesión de invitado existe y es válida
      const { data: guestSession, error: sessionError } = await supabaseClient
        .from('z_auto_guest_sessions')
        .select('id')
        .eq('session_token', session_token)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (sessionError) {
        console.error('❌ Invalid guest session:', sessionError)
        return NextResponse.json(
          { error: 'Sesión de invitado inválida o expirada' },
          { status: 400 }
        )
      }

      guestSessionId = guestSession.id
      console.log('✅ Using guest session:', guestSessionId)
    }

    // Preparar datos para inserción
    const applicationData = {
      quote_id: cleanQuoteId,
      simulation_id: cleanSimulationId,
      guest_session_id: guestSessionId,
      session_token: session_token,
      product_type,
      requested_amount,
      term_months,
      payment_frequency: payment_frequency || 'mensual',
      resource_usage,
      branch_office,
      collecting_advisor_name,
      paternal_surname,
      maternal_surname,
      first_names,
      marital_status,
      curp,
      rfc_with_homoclave,
      rfc_homoclave,
      nss,
      birth_date,
      birth_country,
      gender,
      nationality,
      birth_state,
      education_level,
      electronic_signature_series,
      dependents_count,
      personal_email,
      work_email,
      mobile_phone,
      landline_phone,
      emergency_phone,
      street_and_number,
      interior_number,
      between_streets,
      neighborhood,
      municipality,
      state,
      postal_code,
      housing_type,
      residence_years,
      country,
      company_name,
      job_position,
      occupation,
      immediate_supervisor,
      job_seniority_years,
      job_seniority_months,
      monthly_income,
      work_phone,
      work_extension,
      work_address,
      reference_1_name,
      reference_1_relationship,
      reference_1_phone1,
      reference_1_phone2,
      reference_1_mobile,
      reference_2_name,
      reference_2_relationship,
      reference_2_phone1,
      reference_2_phone2,
      reference_2_mobile,
      reference_3_name,
      reference_3_relationship,
      reference_3_phone1,
      reference_3_phone2,
      reference_3_mobile,
      ine_folio,
      passport_folio,
      professional_license_folio,
      is_pep,
      pep_position,
      pep_period,
      has_pep_relative,
      pep_relative_name,
      pep_relative_position,
      pep_relative_relationship,
      acts_for_self,
      resources_are_legal,
      sic_authorization,
      sic_authorization_date,
      sic_authorization_place,
      privacy_notice_accepted,
      privacy_notice_date,
      marketing_consent,
      internal_folio,
      executive_name,
      branch_office,
      has_ine,
      has_address_proof,
      has_payroll_receipts,
      has_bank_statements,
      has_discount_mandate,
      interview_result,
      status,
      created_by_user_id,
      ip_address,
      user_agent,
      client_signature_date,
      advisor_signature_date
    }

    // Generar folio automático
    const folioNumber = await generateFolioNumber()
    const finalApplicationData = {
      ...applicationData,
      folio_number: folioNumber
    }

    console.log('📝 [DEBUG] applicationData BEFORE INSERT:', JSON.stringify(finalApplicationData, null, 2))

    // Insertar solicitud de crédito
    const { data: application, error: applicationError } = await supabaseClient
      .from('z_auto_credit_applications')
      .insert(finalApplicationData)
      .select()
      .single()

    if (applicationError) {
      console.error('Error al crear solicitud de crédito:', applicationError)
      return NextResponse.json(
        { error: 'Error al crear la solicitud de crédito' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      credit_application: application
    })

  } catch (error) {
    console.error('💥 Exception in credit application creation:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// GET - Obtener solicitudes de crédito con filtros
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parámetros de filtrado
    const status = searchParams.get('status')
    const created_by = searchParams.get('created_by')
    const guest_session_id = searchParams.get('guest_session_id')
    const session_token = searchParams.get('session_token')
    const quote_id = searchParams.get('quote_id')
    const folio_number = searchParams.get('folio_number')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabaseClient
      .from('z_auto_credit_applications')
      .select(`
        *,
        z_auto_quotes!quote_id (
          id,
          client_name,
          client_email,
          client_phone,
          vehicle_brand,
          vehicle_model,
          vehicle_year,
          vehicle_value
        ),
        z_auto_simulations!simulation_id (
          id,
          tier_code,
          term_months,
          monthly_payment,
          total_to_finance
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }
    
    // Buscar por usuario O por sesión de invitado
    if (created_by) {
      if (guest_session_id) {
        // Buscar por usuario O sesión de invitado
        query = query.or(`created_by_user_id.eq.${created_by},guest_session_id.eq.${guest_session_id}`)
      } else {
        query = query.eq('created_by_user_id', created_by)
      }
    } else if (guest_session_id) {
      query = query.eq('guest_session_id', guest_session_id)
    } else if (session_token) {
      query = query.eq('session_token', session_token)
    }
    
    if (quote_id) {
      query = query.eq('quote_id', quote_id)
    }
    if (folio_number) {
      query = query.eq('folio_number', folio_number)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('Error al obtener solicitudes de crédito:', error)
      return NextResponse.json(
        { error: 'Error al obtener solicitudes de crédito' },
        { status: 500 }
      )
    }

    // Obtener total de registros para paginación
    let countQuery = supabaseClient
      .from('z_auto_credit_applications')
      .select('*', { count: 'exact', head: true })

    if (status) countQuery = countQuery.eq('status', status)
    if (created_by) countQuery = countQuery.eq('created_by_user_id', created_by)
    if (quote_id) countQuery = countQuery.eq('quote_id', quote_id)
    if (folio_number) countQuery = countQuery.eq('folio_number', folio_number)

    const { count } = await countQuery

    // Si no hay filtros específicos, devolver array simple para el dashboard
    if (!status && !created_by && !quote_id && !folio_number && offset === 0) {
      return NextResponse.json(applications || [])
    }

    // Devolver formato completo con metadatos para filtros avanzados
    return NextResponse.json({
      success: true,
      credit_applications: applications || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('💥 Exception in GET credit applications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
