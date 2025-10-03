import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { guestSessionId, userId } = body

    if (!guestSessionId || !userId) {
      return NextResponse.json(
        { error: 'guestSessionId y userId son requeridos' },
        { status: 400 }
      )
    }

    console.log('🔗 Vinculando sesión:', guestSessionId, 'al usuario:', userId)

    // Actualizar todas las cotizaciones del invitado
    const { error: quotesError } = await supabaseClient
      .from('z_auto_quotes')
      .update({ created_by_user_id: userId })
      .eq('guest_session_id', guestSessionId)

    if (quotesError) {
      console.error('Error actualizando cotizaciones:', quotesError)
    }

    // Actualizar todas las simulaciones del invitado
    const { error: simsError } = await supabaseClient
      .from('z_auto_simulations')
      .update({ created_by_user_id: userId })
      .eq('guest_session_id', guestSessionId)

    if (simsError) {
      console.error('Error actualizando simulaciones:', simsError)
    }

    // Actualizar todas las solicitudes del invitado
    const { error: appsError } = await supabaseClient
      .from('z_auto_credit_applications')
      .update({ created_by_user_id: userId })
      .eq('guest_session_id', guestSessionId)

    if (appsError) {
      console.error('Error actualizando solicitudes:', appsError)
    }

    // Actualizar todas las solicitudes de autorización del invitado
    const { error: authReqError } = await supabaseClient
      .from('z_auto_authorization_requests')
      .update({ created_by_user_id: userId })
      .eq('guest_session_id', guestSessionId)

    if (authReqError) {
      console.error('Error actualizando solicitudes de autorización:', authReqError)
    }

    console.log('✅ Sesión vinculada exitosamente')

    return NextResponse.json({
      success: true,
      message: 'Sesión vinculada exitosamente'
    })

  } catch (error) {
    console.error('💥 Error vinculando sesión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}




