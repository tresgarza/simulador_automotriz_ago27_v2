import { NextRequest, NextResponse } from 'next/server'
import { supabaseClient } from '../../../../lib/supabase'

export async function POST(_request: NextRequest) {
  try {
    // Ejecutar las políticas RLS una por una
    const policies = [
      // Eliminar políticas existentes
      `DROP POLICY IF EXISTS "Public read access to users for login" ON z_auto_users`,
      `DROP POLICY IF EXISTS "Enable read access for all users" ON z_auto_users`,
      `DROP POLICY IF EXISTS "Users can view own data" ON z_auto_users`,
      
      // Crear política que permita acceso público para login
      `CREATE POLICY "Public read access for login" ON z_auto_users FOR SELECT USING (true)`,
      
      // Políticas para cotizaciones
      `DROP POLICY IF EXISTS "Public insert quotes" ON z_auto_quotes`,
      `CREATE POLICY "Public insert quotes" ON z_auto_quotes FOR INSERT WITH CHECK (true)`,
      `DROP POLICY IF EXISTS "Public read quotes by session" ON z_auto_quotes`,
      `CREATE POLICY "Public read quotes by session" ON z_auto_quotes FOR SELECT USING (true)`,
      
      // Políticas para simulaciones
      `DROP POLICY IF EXISTS "Public insert simulations" ON z_auto_simulations`,
      `CREATE POLICY "Public insert simulations" ON z_auto_simulations FOR INSERT WITH CHECK (true)`,
      `DROP POLICY IF EXISTS "Public read simulations" ON z_auto_simulations`,
      `CREATE POLICY "Public read simulations" ON z_auto_simulations FOR SELECT USING (true)`,
      
      // Políticas para agencias
      `DROP POLICY IF EXISTS "Public read agencies" ON z_auto_agencies`,
      `CREATE POLICY "Public read agencies" ON z_auto_agencies FOR SELECT USING (true)`,
      
      // Políticas para tasas
      `DROP POLICY IF EXISTS "Public read access to rate tiers" ON z_auto_rate_tiers`,
      `CREATE POLICY "Public read access to rate tiers" ON z_auto_rate_tiers FOR SELECT USING (true)`
    ]

    const results = []
    
    for (const policy of policies) {
      try {
        const { error } = await supabaseClient.rpc('exec_sql', { sql: policy })
        if (error) {
          console.log(`Policy execution warning: ${error.message}`)
        }
        results.push({ policy, success: !error, error: error?.message })
      } catch (err) {
        console.log(`Policy execution error: ${err}`)
        results.push({ policy, success: false, error: String(err) })
      }
    }

    // Verificar usuarios
    const { data: users, error: usersError } = await supabaseClient
      .from('z_auto_users')
      .select('name, email, phone, user_type, agency_code, is_active')
      .order('user_type')

    return NextResponse.json({
      success: true,
      message: 'RLS policies updated',
      results,
      users: users || [],
      usersError: usersError?.message
    })

  } catch (error) {
    console.error('Error fixing RLS policies:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    )
  }
}

