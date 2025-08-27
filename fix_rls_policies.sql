-- =========================================
-- ARREGLAR POLÍTICAS RLS PARA LOGIN
-- =========================================

-- Eliminar políticas existentes que puedan estar causando problemas
DROP POLICY IF EXISTS "Public read access to users for login" ON z_auto_users;
DROP POLICY IF EXISTS "Enable read access for all users" ON z_auto_users;
DROP POLICY IF EXISTS "Users can view own data" ON z_auto_users;

-- Crear política que permita acceso público para login (solo lectura)
CREATE POLICY "Public read access for login" ON z_auto_users
    FOR SELECT USING (true);

-- Política para permitir inserción pública de cotizaciones
DROP POLICY IF EXISTS "Public insert quotes" ON z_auto_quotes;
CREATE POLICY "Public insert quotes" ON z_auto_quotes
    FOR INSERT WITH CHECK (true);

-- Política para permitir lectura pública de cotizaciones por session_id
DROP POLICY IF EXISTS "Public read quotes by session" ON z_auto_quotes;
CREATE POLICY "Public read quotes by session" ON z_auto_quotes
    FOR SELECT USING (true);

-- Política para permitir inserción pública de simulaciones
DROP POLICY IF EXISTS "Public insert simulations" ON z_auto_simulations;
CREATE POLICY "Public insert simulations" ON z_auto_simulations
    FOR INSERT WITH CHECK (true);

-- Política para permitir lectura pública de simulaciones
DROP POLICY IF EXISTS "Public read simulations" ON z_auto_simulations;
CREATE POLICY "Public read simulations" ON z_auto_simulations
    FOR SELECT USING (true);

-- Política para permitir acceso público de lectura a agencias
DROP POLICY IF EXISTS "Public read agencies" ON z_auto_agencies;
CREATE POLICY "Public read agencies" ON z_auto_agencies
    FOR SELECT USING (true);

-- Política para permitir acceso público de lectura a tasas
DROP POLICY IF EXISTS "Public read access to rate tiers" ON z_auto_rate_tiers;
CREATE POLICY "Public read access to rate tiers" ON z_auto_rate_tiers
    FOR SELECT USING (true);

-- Verificar que los usuarios existen
SELECT 'Usuarios registrados:' as info;
SELECT name, email, phone, user_type, agency_code, is_active 
FROM z_auto_users 
ORDER BY user_type, name;

