-- =========================================
-- MIGRACIÓN: SIMULADOR AUTOMOTRIZ
-- Proyecto: ydnygntfkrleiseuciwq
-- Prefijo de tablas: z_auto_
-- Fecha: 2025-01-26
-- =========================================

-- 1. TABLA DE USUARIOS Y ROLES
CREATE TABLE IF NOT EXISTS z_auto_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    name VARCHAR(255),
    user_type VARCHAR(20) CHECK (user_type IN ('client', 'agency', 'asesor')),
    agency_code VARCHAR(50), -- Solo para agencias
    agency_name VARCHAR(255), -- Solo para agencias
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA DE AGENCIAS
CREATE TABLE IF NOT EXISTS z_auto_agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA DE TASAS DE INTERÉS
CREATE TABLE IF NOT EXISTS z_auto_rate_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_code VARCHAR(5) UNIQUE NOT NULL, -- A, B, C
    tier_name VARCHAR(100) NOT NULL,
    annual_rate DECIMAL(5,4) NOT NULL, -- 0.3600 = 36%
    annual_rate_with_iva DECIMAL(5,4) NOT NULL, -- 0.4176 = 41.76%
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA DE COTIZACIONES
CREATE TABLE IF NOT EXISTS z_auto_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES z_auto_users(id),
    session_id VARCHAR(255), -- Para clientes sin login
    client_name VARCHAR(255),
    client_email VARCHAR(255),
    client_phone VARCHAR(20),
    agency_id UUID REFERENCES z_auto_agencies(id),
    promoter_code VARCHAR(50),
    vendor_name VARCHAR(255),
    origin_procedencia VARCHAR(255),

    -- Datos del vehículo
    vehicle_brand VARCHAR(100),
    vehicle_model VARCHAR(100),
    vehicle_year INTEGER,
    vehicle_type VARCHAR(50),
    vehicle_usage VARCHAR(50),
    vehicle_origin VARCHAR(50),
    serial_number VARCHAR(100),
    vehicle_value DECIMAL(12,2) NOT NULL,

    -- Datos del crédito
    down_payment_amount DECIMAL(12,2) NOT NULL,
    insurance_mode VARCHAR(10) CHECK (insurance_mode IN ('cash', 'financed')),
    insurance_amount DECIMAL(12,2) NOT NULL,
    commission_mode VARCHAR(10) CHECK (commission_mode IN ('cash', 'financed')),

    -- Parámetros de cálculo
    opening_fee_percentage DECIMAL(5,4) DEFAULT 0.03, -- 3%
    gps_monthly DECIMAL(8,2) DEFAULT 400.00,
    life_insurance_monthly DECIMAL(8,2) DEFAULT 300.00,
    iva_rate DECIMAL(5,4) DEFAULT 0.16, -- 16%

    -- Metadata
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA DE SIMULACIONES COMPLETAS
CREATE TABLE IF NOT EXISTS z_auto_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES z_auto_quotes(id) ON DELETE CASCADE,
    tier_code VARCHAR(5) NOT NULL, -- A, B, C
    term_months INTEGER NOT NULL CHECK (term_months IN (24, 36, 48, 60)),

    -- Resultados del resumen
    financed_amount DECIMAL(12,2) NOT NULL,
    opening_fee DECIMAL(12,2) NOT NULL,
    opening_fee_iva DECIMAL(12,2) NOT NULL,
    total_to_finance DECIMAL(12,2) NOT NULL,
    monthly_payment DECIMAL(12,2) NOT NULL,
    initial_outlay DECIMAL(12,2) NOT NULL,
    pmt_base DECIMAL(12,2) NOT NULL,
    pmt_total_month2 DECIMAL(12,2) NOT NULL,

    -- Fechas calculadas
    first_payment_date DATE NOT NULL,
    last_payment_date DATE NOT NULL,

    -- JSON con la tabla completa de amortización
    amortization_schedule JSONB,

    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    calculation_version VARCHAR(20) DEFAULT '1.0'
);

-- 6. TABLA DE PDFs GENERADOS
CREATE TABLE IF NOT EXISTS z_auto_pdfs_generated (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id UUID REFERENCES z_auto_simulations(id) ON DELETE CASCADE,
    quote_id UUID REFERENCES z_auto_quotes(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT,
    file_size_bytes INTEGER,
    generated_by_user_id UUID REFERENCES z_auto_users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA DE AUDITORÍA
CREATE TABLE IF NOT EXISTS z_auto_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES z_auto_users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLA DE CONFIGURACIÓN DEL SISTEMA
CREATE TABLE IF NOT EXISTS z_auto_system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =========================================

-- Índices para z_auto_users
CREATE INDEX IF NOT EXISTS idx_z_auto_users_email ON z_auto_users(email);
CREATE INDEX IF NOT EXISTS idx_z_auto_users_phone ON z_auto_users(phone);
CREATE INDEX IF NOT EXISTS idx_z_auto_users_agency_code ON z_auto_users(agency_code);
CREATE INDEX IF NOT EXISTS idx_z_auto_users_type ON z_auto_users(user_type);

-- Índices para z_auto_quotes
CREATE INDEX IF NOT EXISTS idx_z_auto_quotes_user_id ON z_auto_quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_z_auto_quotes_session_id ON z_auto_quotes(session_id);
CREATE INDEX IF NOT EXISTS idx_z_auto_quotes_agency_id ON z_auto_quotes(agency_id);
CREATE INDEX IF NOT EXISTS idx_z_auto_quotes_created_at ON z_auto_quotes(created_at);

-- Índices para z_auto_simulations
CREATE INDEX IF NOT EXISTS idx_z_auto_simulations_quote_id ON z_auto_simulations(quote_id);
CREATE INDEX IF NOT EXISTS idx_z_auto_simulations_tier_term ON z_auto_simulations(tier_code, term_months);

-- Índices para z_auto_audit_logs
CREATE INDEX IF NOT EXISTS idx_z_auto_audit_logs_table_record ON z_auto_audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_z_auto_audit_logs_created_at ON z_auto_audit_logs(created_at);

-- =========================================
-- DATOS INICIALES
-- =========================================

-- Insertar tasas de interés
INSERT INTO z_auto_rate_tiers (tier_code, tier_name, annual_rate, annual_rate_with_iva)
VALUES
    ('A', 'Tasa A - 36%', 0.3600, 0.4176),
    ('B', 'Tasa B - 40%', 0.4000, 0.4640),
    ('C', 'Tasa C - 45%', 0.4500, 0.5220)
ON CONFLICT (tier_code) DO NOTHING;

-- Configuración del sistema
INSERT INTO z_auto_system_config (config_key, config_value, description)
VALUES
    ('default_opening_fee_percentage', '0.03', 'Porcentaje de comisión por apertura (3%)'),
    ('default_gps_monthly', '400.00', 'Costo mensual GPS por defecto'),
    ('default_life_insurance_monthly', '300.00', 'Costo mensual seguro de vida por defecto'),
    ('default_iva_rate', '0.16', 'Tasa de IVA por defecto (16%)'),
    ('min_down_payment_percentage', '0.30', 'Enganche mínimo (30%)'),
    ('available_terms', '[24, 36, 48, 60]', 'Plazos disponibles en meses')
ON CONFLICT (config_key) DO NOTHING;
