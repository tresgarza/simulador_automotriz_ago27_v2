import { createBrowserClient } from '@supabase/ssr'

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sibiwavhwnxtrszjgqti.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYml3YXZod254dHJzempncXRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzMzEwOTksImV4cCI6MjA1NjkwNzA5OX0.KMBg5d_2NR5T-YMet9zSM5_ajEctEFu0j2ytaxq9uzA'

// Cliente único para todas las operaciones
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Alias para compatibilidad
export const supabaseClient = supabase

// Tipos de datos para TypeScript
export interface User {
  id: string
  name: string
  email?: string
  phone: string
  user_type: 'client' | 'agency' | 'asesor'
  agency_code?: string
  agency_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Agency {
  id: string
  agency_code: string
  name: string
  contact_email?: string
  contact_phone: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  user_id?: string
  session_id?: string
  client_name?: string
  client_email?: string
  client_phone?: string
  agency_id?: string
  promoter_code?: string
  vendor_name?: string
  origin_procedencia?: string
  
  // Datos del vehículo
  vehicle_brand?: string
  vehicle_model?: string
  vehicle_year?: number
  vehicle_type?: string
  vehicle_usage?: string
  vehicle_origin?: string
  serial_number?: string
  vehicle_value: number
  
  // Datos del crédito
  down_payment_amount: number
  insurance_mode: 'cash' | 'financed'
  insurance_amount: number
  commission_mode: 'cash' | 'financed'
  
  // Parámetros de cálculo
  opening_fee_percentage: number
  gps_monthly: number
  life_insurance_monthly: number
  iva_rate: number
  
  // Metadata
  ip_address?: string
  user_agent?: string
  created_at: string
  updated_at: string
}

export interface Simulation {
  id: string
  quote_id: string
  tier_code: 'A' | 'B' | 'C'
  term_months: 24 | 36 | 48 | 60
  
  // Resultados del resumen
  financed_amount: number
  opening_fee: number
  opening_fee_iva: number
  total_to_finance: number
  monthly_payment: number
  initial_outlay: number
  pmt_base: number
  pmt_total_month2: number
  
  // Fechas calculadas
  first_payment_date: string
  last_payment_date: string
  
  // JSON con la tabla completa de amortización
  amortization_schedule: Record<string, unknown>
  
  // Metadata
  calculated_at: string
  calculation_version: string
}

export interface RateTier {
  id: string
  tier_code: 'A' | 'B' | 'C'
  tier_name: string
  annual_rate: number
  annual_rate_with_iva: number
  is_active: boolean
  created_at: string
  updated_at: string
}
