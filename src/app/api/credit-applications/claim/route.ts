import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../lib/supabase'

/**
 * POST /api/credit-applications/claim
 * Permite a un usuario registrado reclamar solicitudes de crédito que puedan pertenecerle
 * basándose en email, nombre, o sesiones de invitado previas
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, user_email, user_name } = body

    if (!user_id || !user_email) {
      return NextResponse.json(
        { error: 'user_id y user_email son requeridos' },
        { status: 400 }
      )
    }

    console.log('🔍 Intentando reclamar solicitudes para usuario:', {
      user_id,
      user_email,
      user_name
    })

    // VERIFICACIÓN PREVIA: Si el usuario ya tiene solicitudes, NO reclamar
    const { data: existingApps, error: checkError } = await supabaseClient
      .from('z_auto_credit_applications')
      .select('id')
      .eq('created_by_user_id', user_id)
      .limit(1)

    if (checkError) {
      console.error('❌ Error verificando solicitudes existentes:', checkError)
    } else if (existingApps && existingApps.length > 0) {
      console.log('🚫 Usuario ya tiene solicitudes asignadas - saltando reclamación')
      
      // Obtener las solicitudes actualizadas del usuario sin reclamar
      const { data: userApplications, error: fetchError } = await supabaseClient
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
        .eq('created_by_user_id', user_id)
        .order('created_at', { ascending: false })

      return NextResponse.json({
        success: true,
        claimed_count: 0, // No se reclamó nada
        claimed_details: [],
        user_applications: userApplications || [],
        message: 'Usuario ya tiene solicitudes asignadas - no se reclamó nada'
      })
    }

    // Paso 1: Intentar reclamar por email exacto o similar
    const { data: claimedByEmail, error: claimError } = await supabaseClient
      .rpc('claim_user_applications', {
        p_user_id: user_id,
        p_user_email: user_email,
        p_user_name: user_name
      })

    if (claimError) {
      console.error('❌ Error reclamando por email:', claimError)
    } else {
      console.log('✅ Solicitudes reclamadas por email:', claimedByEmail?.length || 0)
    }

    // Paso 2: Intentar asociar sesiones de invitado
    const { data: associatedGuest, error: guestError } = await supabaseClient
      .rpc('associate_guest_sessions_with_user', {
        p_user_id: user_id,
        p_user_email: user_email,
        p_user_name: user_name
      })

    if (guestError) {
      console.error('❌ Error asociando sesiones de invitado:', guestError)
    } else {
      console.log('✅ Solicitudes asociadas de sesiones de invitado:', associatedGuest?.length || 0)
    }

    // Combinar resultados
    const allClaimed = [
      ...(claimedByEmail || []),
      ...(associatedGuest || [])
    ]

    console.log('📊 Total de solicitudes reclamadas:', allClaimed.length)

    // Paso 3: Obtener las solicitudes actualizadas del usuario
    const { data: userApplications, error: fetchError } = await supabaseClient
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
      .eq('created_by_user_id', user_id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('❌ Error obteniendo solicitudes del usuario:', fetchError)
      return NextResponse.json(
        { error: 'Error al obtener solicitudes actualizadas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      claimed_count: allClaimed.length,
      claimed_details: allClaimed,
      user_applications: userApplications || [],
      message: allClaimed.length > 0 
        ? `Se reclamaron ${allClaimed.length} solicitudes exitosamente`
        : 'No se encontraron solicitudes para reclamar'
    })

  } catch (error) {
    console.error('💥 Exception en claim applications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/credit-applications/claim?user_id=xxx
 * Obtiene información sobre solicitudes potencialmente reclamables por un usuario
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id es requerido' },
        { status: 400 }
      )
    }

    // Obtener información del usuario
    const { data: user, error: userError } = await supabaseClient
      .from('z_auto_users')
      .select('id, email, name')
      .eq('id', user_id)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Buscar solicitudes potencialmente reclamables
    const { data: potentialClaims, error: searchError } = await supabaseClient
      .from('z_auto_credit_applications')
      .select(`
        id,
        folio_number,
        personal_email,
        first_names,
        paternal_surname,
        maternal_surname,
        status,
        created_at,
        created_by_user_id,
        guest_session_id,
        z_auto_guest_sessions!guest_session_id (
          email,
          name
        )
      `)
      .is('created_by_user_id', null)
      .order('created_at', { ascending: false })

    if (searchError) {
      console.error('❌ Error buscando solicitudes reclamables:', searchError)
      return NextResponse.json(
        { error: 'Error al buscar solicitudes' },
        { status: 500 }
      )
    }

    // Filtrar solicitudes que podrían pertenecer al usuario
    const claimable = potentialClaims?.filter(app => {
      // Por email exacto
      if (app.personal_email === user.email) return true
      
      // Por email similar
      if (app.personal_email && user.email) {
        const appEmailUser = app.personal_email.split('@')[0]
        const userEmailUser = user.email.split('@')[0]
        if (appEmailUser === userEmailUser) return true
      }
      
      // Por sesión de invitado con email
      if (app.z_auto_guest_sessions?.email === user.email) return true
      
      // Por sesión de invitado con nombre similar
      if (app.z_auto_guest_sessions?.name && user.name) {
        const guestName = app.z_auto_guest_sessions.name.toLowerCase()
        const userName = user.name.toLowerCase()
        if (guestName.includes(userName.split(' ')[0]) || userName.includes(guestName)) {
          return true
        }
      }
      
      return false
    }) || []

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      claimable_applications: claimable,
      claimable_count: claimable.length
    })

  } catch (error) {
    console.error('💥 Exception en GET claim applications:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
