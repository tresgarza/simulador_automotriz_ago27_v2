import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userType, email, phone, agencyCode } = body

    if (userType === 'asesor') {
      // Login para asesores
      if (!email) {
        return NextResponse.json(
          { error: 'Email es requerido para asesores' },
          { status: 400 }
        )
      }

      const { data, error } = await supabaseClient
        .from('z_auto_users')
        .select('*')
        .eq('email', email)
        .eq('user_type', 'asesor')
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: 'Asesor no encontrado o inactivo' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        user: {
          ...data,
          permissions: ['view_all_rates', 'manage_users', 'view_all_quotes', 'manage_system']
        }
      })

    } else if (userType === 'agency') {
      // Login para agencias
      if (!agencyCode || !phone) {
        return NextResponse.json(
          { error: 'Código de agencia y teléfono son requeridos' },
          { status: 400 }
        )
      }

      const { data, error } = await supabaseClient
        .from('z_auto_users')
        .select('*')
        .eq('agency_code', agencyCode)
        .eq('phone', phone)
        .eq('user_type', 'agency')
        .eq('is_active', true)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: 'Agencia no encontrada o credenciales incorrectas' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        user: {
          ...data,
          permissions: ['view_rate_c', 'create_quotes', 'view_own_quotes']
        }
      })

    } else {
      return NextResponse.json(
        { error: 'Tipo de usuario no válido' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

