import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../../lib/supabase'

// VERSIÓN DE EMERGENCIA - MINIMALISTA SIN RELACIONES
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

    console.log('🔧 [BACKUP] Updating credit application:', id)
    console.log('🔧 [BACKUP] Body keys received:', Object.keys(body))
    console.log('🔧 [BACKUP] Sample body data:', {
      product_type: body.product_type,
      requested_amount: body.requested_amount,
      payment_frequency: body.payment_frequency,
      resource_usage: body.resource_usage,
      first_names: body.first_names,
      nationality: body.nationality
    })

    // Campos expandidos para capturar más información del formulario
    const basicFields = {
      // Campos básicos del solicitante
      first_names: body.first_names,
      paternal_surname: body.paternal_surname,
      maternal_surname: body.maternal_surname,
      personal_email: body.personal_email,
      mobile_phone: body.mobile_phone,
      landline_phone: body.landline_phone,
      work_email: body.work_email,
      
      // Información del crédito
      product_type: body.product_type,
      requested_amount: body.requested_amount,
      term_months: body.term_months,
      payment_frequency: body.payment_frequency,
      resource_usage: body.resource_usage,
      
      // Datos personales
      nationality: body.nationality,
      gender: body.gender,
      birth_date: body.birth_date,
      marital_status: body.marital_status,
      curp: body.curp,
      rfc_with_homoclave: body.rfc_with_homoclave,
      nss: body.nss,
      birth_state: body.birth_state,
      education_level: body.education_level,
      
      // Dirección
      street_and_number: body.street_and_number,
      interior_number: body.interior_number,
      between_streets: body.between_streets,
      neighborhood: body.neighborhood,
      municipality: body.municipality,
      state: body.state,
      postal_code: body.postal_code,
      housing_type: body.housing_type,
      residence_years: body.residence_years,
      
      // Información laboral
      company_name: body.company_name,
      job_position: body.job_position,
      job_seniority_years: body.job_seniority_years,
      job_seniority_months: body.job_seniority_months,
      monthly_income: body.monthly_income,
      work_phone: body.work_phone,
      work_extension: body.work_extension,
      work_address: body.work_address,
      
      // Referencias
      reference_1_name: body.reference_1_name,
      reference_1_relationship: body.reference_1_relationship,
      reference_1_phone1: body.reference_1_phone1,
      reference_1_phone2: body.reference_1_phone2,
      reference_1_mobile: body.reference_1_mobile,
      reference_2_name: body.reference_2_name,
      reference_2_relationship: body.reference_2_relationship,
      reference_2_phone1: body.reference_2_phone1,
      reference_2_phone2: body.reference_2_phone2,
      reference_2_mobile: body.reference_2_mobile,
      reference_3_name: body.reference_3_name,
      reference_3_relationship: body.reference_3_relationship,
      reference_3_phone1: body.reference_3_phone1,
      reference_3_phone2: body.reference_3_phone2,
      reference_3_mobile: body.reference_3_mobile,
      
      // Estado y metadatos
      status: body.status,
      updated_at: new Date().toISOString()
    }

    // Filtrar valores undefined/null
    const cleanFields = {}
    for (const [key, value] of Object.entries(basicFields)) {
      if (value !== undefined && value !== null) {
        cleanFields[key] = value
      }
    }

    console.log('🔧 [BACKUP] Clean fields count:', Object.keys(cleanFields).length)
    console.log('🔧 [BACKUP] Clean fields keys:', Object.keys(cleanFields))
    console.log('🔧 [BACKUP] Clean fields sample:', {
      product_type: cleanFields.product_type,
      requested_amount: cleanFields.requested_amount,
      payment_frequency: cleanFields.payment_frequency,
      resource_usage: cleanFields.resource_usage,
      first_names: cleanFields.first_names,
      nationality: cleanFields.nationality
    })

    // Actualización simple
    const { error } = await supabaseClient
      .from('z_auto_credit_applications')
      .update(cleanFields)
      .eq('id', id)

    if (error) {
      console.error('❌ [BACKUP] Error:', error)
      return NextResponse.json(
        { 
          error: 'Error al actualizar la solicitud de crédito',
          details: error.message
        },
        { status: 500 }
      )
    }

    console.log('✅ [BACKUP] Actualización exitosa:', id)

    return NextResponse.json({
      success: true,
      message: 'Solicitud actualizada exitosamente',
      credit_application: { id, ...cleanFields }
    })

  } catch (error) {
    console.error('💥 [BACKUP] Exception:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

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

    return NextResponse.json({
      success: true,
      credit_application: application
    })

  } catch (error) {
    console.error('💥 Exception in GET credit application:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
