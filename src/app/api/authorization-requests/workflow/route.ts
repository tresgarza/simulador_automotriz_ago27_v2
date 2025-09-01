import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../../lib/supabase'

// GET - Obtener vista de workflow de autorizaciones
export async function GET(request: NextRequest) {
  try {
    console.log('API Workflow: Iniciando consulta...')
    
    const { data, error } = await supabaseClient
      .from('z_auto_authorization_requests')
      .select(`
        *,
        z_auto_simulations (
          id,
          tier_code,
          term_months,
          monthly_payment,
          pmt_total_month2,
          total_to_finance,
          financed_amount
        ),
        z_auto_quotes (
          id,
          client_name,
          client_email,
          client_phone,
          vehicle_brand,
          vehicle_model,
          vehicle_year,
          vehicle_value,
          agency_id,
          z_auto_agencies (
            id,
            name,
            agency_code
          )
        ),
        created_by:z_auto_users!created_by_user_id (
          id,
          name,
          email
        ),
        assigned_to:z_auto_users!assigned_to_user_id (
          id,
          name,
          email
        ),
        claimed_by:z_auto_users!claimed_by_user_id (
          id,
          name,
          email
        ),
        advisor_reviewer:z_auto_users!advisor_reviewed_by (
          id,
          name,
          email
        ),
        internal_committee_reviewer:z_auto_users!internal_committee_reviewed_by (
          id,
          name,
          email
        ),
        partners_committee_reviewer:z_auto_users!partners_committee_reviewed_by (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })

    console.log('API Workflow: Consulta ejecutada', { 
      dataLength: data?.length, 
      error: error?.message,
      hasData: !!data 
    })

    if (error) {
      console.error('Error al obtener workflow de autorizaciones:', error)
      return NextResponse.json(
        { error: 'Error al obtener workflow de autorizaciones', details: error.message },
        { status: 500 }
      )
    }

    // Procesar los datos para el workflow
    const workflows = (data || []).map(request => ({
      ...request,
      // Campos adicionales para el workflow
      claimed_by_name: request.claimed_by?.name || null,
      advisor_reviewer_name: request.advisor_reviewer?.name || null,
      internal_committee_reviewer_name: request.internal_committee_reviewer?.name || null,
      partners_committee_reviewer_name: request.partners_committee_reviewer?.name || null,
      // Información del cliente y vehículo
      client_name: request.client_name || request.z_auto_quotes?.client_name || 'Sin nombre',
      vehicle_info: `${request.vehicle_brand || request.z_auto_quotes?.vehicle_brand || 'N/A'} ${request.vehicle_model || request.z_auto_quotes?.vehicle_model || 'N/A'} ${request.vehicle_year || request.z_auto_quotes?.vehicle_year || ''}`.trim(),
      agency_name: request.z_auto_quotes?.z_auto_agencies?.name || request.agency_name || 'Sin agencia'
    }))

    console.log('API Workflow: Datos procesados', { 
      workflowsLength: workflows.length,
      firstWorkflow: workflows[0] ? {
        id: workflows[0].id,
        status: workflows[0].status,
        client_name: workflows[0].client_name
      } : null
    })

    return NextResponse.json({
      success: true,
      workflows,
      total: workflows.length
    })

  } catch (error) {
    console.error('Error en API de workflow de autorizaciones:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    )
  }
}

