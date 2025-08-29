import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../lib/supabase'

// GET - Obtener tasas disponibles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userType = searchParams.get('userType')

    const { data: rates, error } = await supabaseClient
      .from('z_auto_rate_tiers')
      .select('*')
      .eq('is_active', true)
      .order('tier_code')

    if (error) {
      console.error('Error al obtener tasas:', error)
      return NextResponse.json(
        { error: 'Error al obtener tasas' },
        { status: 500 }
      )
    }

    // Filtrar tasas según el tipo de usuario
    let availableRates = rates

    if (userType === 'client' || userType === 'agency') {
      // Solo tasa C para clientes y agencias
      availableRates = rates.filter(rate => rate.tier_code === 'C')
    }
    // Los asesores pueden ver todas las tasas

    return NextResponse.json({
      success: true,
      rates: availableRates
    })

  } catch (error) {
    console.error('Error en API de tasas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST - Actualizar tasas (solo asesores)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userType, userId, rates } = body

    // Verificar que sea asesor
    if (userType !== 'asesor') {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar tasas' },
        { status: 403 }
      )
    }

    // Verificar que el usuario existe y es asesor
    const { data: user, error: userError } = await supabaseClient
      .from('z_auto_users')
      .select('id, user_type')
      .eq('id', userId)
      .eq('user_type', 'asesor')
      .eq('is_active', true)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autorizado' },
        { status: 401 }
      )
    }

    // Actualizar tasas
    const updatePromises = rates.map((rate: Record<string, unknown>) => 
      supabaseClient
        .from('z_auto_rate_tiers')
        .update({
          annual_rate: rate.annual_rate,
          annual_rate_with_iva: rate.annual_rate_with_iva,
          tier_name: rate.tier_name,
          is_active: rate.is_active
        })
        .eq('tier_code', rate.tier_code)
    )

    const results = await Promise.all(updatePromises)
    
    // Verificar errores
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      console.error('Errores al actualizar tasas:', errors)
      return NextResponse.json(
        { error: 'Error al actualizar algunas tasas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tasas actualizadas correctamente'
    })

  } catch (error) {
    console.error('Error en POST tasas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

