import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../lib/supabase'

// POST - Crear nueva solicitud de autorización
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
      // Datos adicionales del formulario de autorización
      authorization_data
    } = body

    // Validaciones básicas
    if (!simulation_id && !quote_id && !client_name && !vehicle_brand) {
      console.error('❌ [ERROR] Faltan campos requeridos para autorización')
      return NextResponse.json(
        { error: 'Se requiere al menos simulation_id/quote_id O información básica del cliente/vehículo' },
        { status: 400 }
      )
    }

    // Preparar datos para inserción básica
    const authRequestData = {
      simulation_id: simulation_id || null,
      quote_id: quote_id || null,
      status: 'pending',
      priority,
      client_name: client_name || 'Cliente no especificado',
      client_email: client_email || null,
      client_phone: client_phone || null,
      vehicle_brand: vehicle_brand || null,
      vehicle_model: vehicle_model || null,
      vehicle_year: vehicle_year || null,
      vehicle_value: vehicle_value || null,
      requested_amount: requested_amount || null,
      monthly_payment: monthly_payment || null,
      term_months: term_months || null,
      agency_name: agency_name || null,
      dealer_name: dealer_name || null,
      promoter_code: promoter_code || null,
      created_by_user_id: created_by_user_id || null,
      assigned_to_user_id: assigned_to_user_id || null,
      client_comments: client_comments || null,
      internal_notes: internal_notes || null,
      risk_level,
      ip_address: ip_address || null,
      user_agent: user_agent || null,
      authorization_data: authorization_data || null
    }

    console.log('📝 [DEBUG] Inserting authorization request:', authRequestData)

    // Insertar solicitud de autorización
    const { data: authRequest, error: authError } = await supabaseClient
      .from('z_auto_authorization_requests')
      .insert(authRequestData)
      .select()
      .single()

    if (authError) {
      console.error('❌ [ERROR] Error al crear solicitud de autorización:', authError)
      return NextResponse.json(
        { error: 'Error al crear la solicitud de autorización: ' + authError.message },
        { status: 500 }
      )
    }

    console.log('✅ [SUCCESS] Authorization request created:', authRequest)

    return NextResponse.json({
      success: true,
      authorization_request: authRequest
    })

  } catch (error) {
    console.error('❌ [ERROR] Error en API de solicitudes de autorización:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

// GET - Obtener solicitudes de autorización
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Consulta con JOIN para obtener toda la información relacionada
    const { data: requests, error } = await supabaseClient
      .from('z_auto_authorization_requests')
      .select(`
        *,
        z_auto_simulations (
          id,
          tier_code,
          term_months,
          monthly_payment,
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
