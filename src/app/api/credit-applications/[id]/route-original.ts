import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../../lib/supabase'

// GET - Obtener una solicitud específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    // Obtener la solicitud principal
    const { data: application, error } = await supabaseClient
      .from('z_auto_credit_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error al obtener solicitud de crédito:', error)
      return NextResponse.json(
        { error: 'Solicitud de crédito no encontrada' },
        { status: 404 }
      )
    }

    // Obtener relaciones opcionales si existen
    let quote = null
    let simulation = null

    if (application.quote_id) {
      const { data: quoteData } = await supabaseClient
        .from('z_auto_quotes')
        .select(`
          id,
          client_name,
          client_email,
          client_phone,
          vehicle_brand,
          vehicle_model,
          vehicle_year,
          vehicle_value,
          down_payment_amount,
          insurance_mode,
          insurance_amount,
          commission_mode
        `)
        .eq('id', application.quote_id)
        .single()
      quote = quoteData
    }

    if (application.simulation_id) {
      const { data: simulationData } = await supabaseClient
        .from('z_auto_simulations')
        .select(`
          id,
          tier_code,
          term_months,
          monthly_payment,
          total_to_finance,
          pmt_total_month2,
          first_payment_date,
          last_payment_date
        `)
        .eq('id', application.simulation_id)
        .single()
      simulation = simulationData
    }

    // Combinar datos
    const applicationWithRelations = {
      ...application,
      z_auto_quotes: quote,
      z_auto_simulations: simulation
    }

    return NextResponse.json({
      success: true,
      credit_application: applicationWithRelations
    })

  } catch (error) {
    console.error('💥 Exception in GET credit application:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar una solicitud específica
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    console.log('🔍 [DEBUG] Updating credit application:', id)
    console.log('🔍 [DEBUG] Body keys:', Object.keys(body))
    console.log('🔍 [DEBUG] Body sample:', {
      first_names: body.first_names,
      paternal_surname: body.paternal_surname,
      status: body.status,
      product_type: body.product_type
    })

    // Obtener IP y User Agent
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1'
    const user_agent = request.headers.get('user-agent') || ''

    // Preparar datos de actualización (excluir campos que no se pueden actualizar)
    const { 
      id: _, 
      folio_number: __, 
      created_at: ___,
      z_auto_quotes: ____,
      z_auto_simulations: _____,
      ...updateData 
    } = body

    // Filtrar solo campos válidos para evitar errores
    const allowedFields = [
      'quote_id', 'simulation_id', 'product_type', 'requested_amount', 'term_months',
      'payment_frequency', 'resource_usage', 'paternal_surname', 'maternal_surname',
      'first_names', 'marital_status', 'curp', 'rfc_with_homoclave', 'nss',
      'birth_date', 'gender', 'nationality', 'birth_state', 'education_level',
      'personal_email', 'work_email', 'mobile_phone', 'landline_phone',
      'street_and_number', 'interior_number', 'between_streets', 'neighborhood',
      'municipality', 'state', 'postal_code', 'housing_type', 'residence_years',
      'company_name', 'job_position', 'job_seniority_years', 'job_seniority_months',
      'monthly_income', 'work_phone', 'work_extension', 'work_address',
      'reference_1_name', 'reference_1_relationship', 'reference_1_phone1',
      'reference_1_phone2', 'reference_1_mobile', 'reference_2_name',
      'reference_2_relationship', 'reference_2_phone1', 'reference_2_phone2',
      'reference_2_mobile', 'reference_3_name', 'reference_3_relationship',
      'reference_3_phone1', 'reference_3_phone2', 'reference_3_mobile',
      'ine_folio', 'passport_folio', 'professional_license_folio',
      'is_pep', 'pep_position', 'pep_period', 'has_pep_relative',
      'pep_relative_name', 'pep_relative_position', 'pep_relative_relationship',
      'acts_for_self', 'resources_are_legal', 'sic_authorization',
      'sic_authorization_date', 'sic_authorization_place', 'collecting_advisor_name',
      'privacy_notice_accepted', 'privacy_notice_date', 'marketing_consent',
      'internal_folio', 'executive_name', 'branch_office', 'has_ine',
      'has_address_proof', 'has_payroll_receipts', 'has_bank_statements',
      'has_discount_mandate', 'interview_result', 'status'
    ]

    const filteredUpdateData = {}
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        filteredUpdateData[key] = value
      }
    }

    // Agregar metadatos de actualización
    filteredUpdateData.updated_at = new Date().toISOString()
    filteredUpdateData.ip_address = ip_address
    filteredUpdateData.user_agent = user_agent

    console.log('🔍 [DEBUG] Final filteredUpdateData keys:', Object.keys(filteredUpdateData))
    console.log('🔍 [DEBUG] FilteredUpdateData sample:', {
      first_names: filteredUpdateData.first_names,
      paternal_surname: filteredUpdateData.paternal_surname,
      status: filteredUpdateData.status,
      updated_at: filteredUpdateData.updated_at
    })

    // Actualizar sin select para evitar problemas de schema cache
    const { error: updateError } = await supabaseClient
      .from('z_auto_credit_applications')
      .update(filteredUpdateData)
      .eq('id', id)

    if (updateError) {
      console.error('❌ Error al actualizar solicitud de crédito:', updateError)
      console.error('❌ Error details:', {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      })
      return NextResponse.json(
        { 
          error: 'Error al actualizar la solicitud de crédito',
          details: updateError.message,
          code: updateError.code
        },
        { status: 500 }
      )
    }

    console.log('✅ Solicitud actualizada exitosamente:', id)

    // Obtener los datos actualizados en una consulta separada
    const { data: application, error: fetchError } = await supabaseClient
      .from('z_auto_credit_applications')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError) {
      console.warn('⚠️ Error al obtener datos actualizados (pero la actualización fue exitosa):', fetchError)
      // Devolver éxito aunque no podamos obtener los datos actualizados
      return NextResponse.json({
        success: true,
        credit_application: { id, ...filteredUpdateData },
        message: 'Solicitud actualizada exitosamente'
      })
    }

    return NextResponse.json({
      success: true,
      credit_application: application,
      message: 'Solicitud actualizada exitosamente'
    })

  } catch (error) {
    console.error('💥 Exception in PUT credit application:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar una solicitud (cambiar estado a cancelled)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'ID de solicitud requerido' },
        { status: 400 }
      )
    }

    // No eliminamos físicamente, solo cambiamos el estado
    const { data: application, error } = await supabaseClient
      .from('z_auto_credit_applications')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error al cancelar solicitud de crédito:', error)
      return NextResponse.json(
        { error: 'Error al cancelar la solicitud de crédito' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      credit_application: application
    })

  } catch (error) {
    console.error('💥 Exception in DELETE credit application:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
