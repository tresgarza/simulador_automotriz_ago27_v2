import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userType, email } = body

    if (!userId || !userType) {
      return NextResponse.json(
        { error: 'ID de usuario y tipo son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el usuario existe y está activo
    const { data: user, error } = await supabaseClient
      .from('z_auto_users')
      .select('*')
      .eq('id', userId)
      .eq('user_type', userType)
      .eq('is_active', true)
      .single()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado o inactivo' },
        { status: 401 }
      )
    }

    // Verificar email si se proporciona
    if (email && user.email !== email) {
      return NextResponse.json(
        { error: 'Email no coincide' },
        { status: 401 }
      )
    }

    // Agregar permisos según el tipo de usuario
    let permissions: string[] = []
    switch (user.user_type) {
      case 'asesor':
        permissions = ['view_all_rates', 'manage_users', 'view_all_quotes', 'manage_system']
        break
      case 'agency':
        permissions = ['view_rate_c', 'create_quotes', 'view_own_quotes']
        break
      default:
        permissions = []
    }

    const verifiedUser = {
      ...user,
      permissions
    }

    return NextResponse.json({
      valid: true,
      user: verifiedUser
    })

  } catch (error) {
    console.error('Error en verificación de sesión:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}


