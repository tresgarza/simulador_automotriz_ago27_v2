import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🔍 [DEBUG] Authorization request body:', JSON.stringify(body, null, 2))

    const {
      simulation_id,
      quote_id,
      priority = 'medium',
      client_name,
      client_email,
      client_phone,
      vehicle_brand,
      vehicle_model,
      vehicle_year,
      vehicle_value,
      requested_amount,
      monthly_payment,
      term_months,
      agency_name,
      dealer_name,
      promoter_code,
      created_by_user_id,
      assigned_to_user_id,
      client_comments,
      internal_notes,
      risk_level = 'medium',
      ip_address,
      user_agent,
      authorization_data,
      competitors
    } = body

    if (!simulation_id && !quote_id && !client_name && !vehicle_brand) {
      console.error('❌ [ERROR] Faltan campos requeridos para autorización')
      return NextResponse.json(
        { error: 'Se requiere al menos simulation_id/quote_id O información básica del cliente/vehículo' },
        { status: 400 }
      )
    }

    let finalStatus = 'pending'
    let finalAssignedUserId = assigned_to_user_id

    if (created_by_user_id && !assigned_to_user_id) {
      finalAssignedUserId = created_by_user_id
      finalStatus = 'in_review'
    }

    const { data: authRequest, error: authError } = await supabaseClient
      .from('z_auto_authorization_requests')
      .insert({
        simulation_id,
        quote_id,
        status: finalStatus,
        priority,
        client_name,
        client_email,
        client_phone,
        vehicle_brand,
        vehicle_model,
        vehicle_year,
        vehicle_value,
        requested_amount,
        monthly_payment,
        term_months,
        agency_name,
        dealer_name,
        promoter_code,
        created_by_user_id,
        assigned_to_user_id: finalAssignedUserId,
        client_comments,
        internal_notes,
        approval_notes: null,
        risk_level,
        ip_address,
        user_agent,
        authorization_data: authorization_data || {},
        competitors_data: competitors || []
      })
      .select()
      .single()

    if (authError) {
      console.error('❌ [ERROR] Error al crear solicitud de autorización:', authError)
      return NextResponse.json(
        { error: 'Error al crear la solicitud de autorización: ' + authError.message },
        { status: 500 }
      )
    }

    console.log('✅ [SUCCESS] Authorization request created:', authRequest.id)

    return NextResponse.json({
      success: true,
      authorization_request: authRequest
    })

  } catch (error) {
    console.error('❌ [ERROR] Error en API de creación de solicitudes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const { data: requests, error } = await supabaseClient
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
          financed_amount,
          calculated_at
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
          created_at
        ),
        assigned_user:z_auto_users!z_auto_authorization_requests_assigned_to_user_id_fkey (
          id,
          name,
          email
        ),
        created_user:z_auto_users!z_auto_authorization_requests_created_by_user_id_fkey (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error al obtener solicitudes de autorización:', error)
      return NextResponse.json(
        { error: 'Error al obtener las solicitudes: ' + error.message },
        { status: 500 }
      )
    }

    console.log('📋 Solicitudes obtenidas:', requests?.length || 0)
    if (requests && requests.length > 0) {
      console.log('🔍 DEBUG authorization_data en primera solicitud:', {
        id: requests[0].id,
        has_authorization_data: !!requests[0].authorization_data,
        authorization_data_type: typeof requests[0].authorization_data,
        authorization_data_keys: requests[0].authorization_data ? Object.keys(requests[0].authorization_data) : 'N/A',
        month_labels: requests[0].authorization_data?.month_labels,
        month_labels_type: typeof requests[0].authorization_data?.month_labels
      })

      const targetRequest = requests.find(r => r.id === 'fa91e671-e8be-4d4b-a7ce-e1c8048a036d')
      if (targetRequest) {
        console.log('🎯 SOLICITUD OBJETIVO ENCONTRADA:', {
          id: targetRequest.id,
          has_auth_data: !!targetRequest.authorization_data,
          month_labels: targetRequest.authorization_data?.month_labels,
          auth_data_keys: targetRequest.authorization_data ? Object.keys(targetRequest.authorization_data) : 'N/A'
        })
      }
    }

    return NextResponse.json({
      success: true,
      authorization_requests: requests || [],
      total: requests?.length || 0
    })

  } catch (error) {
    console.error('Error en API de solicitudes de autorización (GET):', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    console.log('🔄 [UPDATE] Actualizando solicitud:', id, {
      has_authorization_data: !!updateData.authorization_data,
      authorization_data_keys: updateData.authorization_data ? Object.keys(updateData.authorization_data) : 'N/A',
      month_labels_in_update: updateData.authorization_data?.month_labels,
      month_labels_type: typeof updateData.authorization_data?.month_labels
    })

    if (!id) {
      return NextResponse.json(
        { error: 'ID de solicitud requerido para actualización' },
        { status: 400 }
      )
    }

    const { data: authRequest, error: authError } = await supabaseClient
      .from('z_auto_authorization_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (authError) {
      console.error('❌ [ERROR] Error al actualizar solicitud de autorización:', authError)
      return NextResponse.json(
        { error: 'Error al actualizar la solicitud de autorización: ' + authError.message },
        { status: 500 }
      )
    }

    console.log('✅ [SUCCESS] Authorization request updated:', authRequest)

    return NextResponse.json({
      success: true,
      authorization_request: authRequest
    })

  } catch (error) {
    console.error('❌ [ERROR] Error en API de actualización de solicitudes:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    )
  }
}