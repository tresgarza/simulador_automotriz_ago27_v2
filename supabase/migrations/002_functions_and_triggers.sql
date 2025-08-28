-- =========================================
-- FUNCIONES Y TRIGGERS
-- Proyecto: ydnygntfkrleiseuciwq
-- Fecha: 2025-01-26
-- =========================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger de updated_at a las tablas que lo necesitan
DROP TRIGGER IF EXISTS update_z_auto_users_updated_at ON z_auto_users;
CREATE TRIGGER update_z_auto_users_updated_at
    BEFORE UPDATE ON z_auto_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_z_auto_agencies_updated_at ON z_auto_agencies;
CREATE TRIGGER update_z_auto_agencies_updated_at
    BEFORE UPDATE ON z_auto_agencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_z_auto_quotes_updated_at ON z_auto_quotes;
CREATE TRIGGER update_z_auto_quotes_updated_at
    BEFORE UPDATE ON z_auto_quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_z_auto_system_config_updated_at ON z_auto_system_config;
CREATE TRIGGER update_z_auto_system_config_updated_at
    BEFORE UPDATE ON z_auto_system_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función de auditoría
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_row JSONB;
    new_row JSONB;
    action_type VARCHAR(20);
BEGIN
    IF TG_OP = 'DELETE' THEN
        old_row := row_to_json(OLD)::JSONB;
        new_row := NULL;
        action_type := 'DELETE';
    ELSIF TG_OP = 'UPDATE' THEN
        old_row := row_to_json(OLD)::JSONB;
        new_row := row_to_json(NEW)::JSONB;
        action_type := 'UPDATE';
    ELSIF TG_OP = 'INSERT' THEN
        old_row := NULL;
        new_row := row_to_json(NEW)::JSONB;
        action_type := 'INSERT';
    END IF;

    INSERT INTO z_auto_audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        user_id
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        action_type,
        old_row,
        new_row,
        NULL -- TODO: Obtener del contexto de sesión
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de auditoría a tablas importantes
DROP TRIGGER IF EXISTS audit_z_auto_users ON z_auto_users;
CREATE TRIGGER audit_z_auto_users
    AFTER INSERT OR UPDATE OR DELETE ON z_auto_users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_z_auto_quotes ON z_auto_quotes;
CREATE TRIGGER audit_z_auto_quotes
    AFTER INSERT OR UPDATE OR DELETE ON z_auto_quotes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_z_auto_simulations ON z_auto_simulations;
CREATE TRIGGER audit_z_auto_simulations
    AFTER INSERT OR UPDATE OR DELETE ON z_auto_simulations
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =========================================
-- VISTAS ÚTILES
-- =========================================

-- Vista de estadísticas de uso
CREATE OR REPLACE VIEW z_auto_usage_stats AS
SELECT
    DATE_TRUNC('day', q.created_at) as date,
    u.user_type,
    COUNT(*) as quotes_count,
    COUNT(DISTINCT q.user_id) as unique_users
FROM z_auto_quotes q
LEFT JOIN z_auto_users u ON q.user_id = u.id
GROUP BY DATE_TRUNC('day', q.created_at), u.user_type
ORDER BY date DESC;

-- Vista de cotizaciones con información completa
CREATE OR REPLACE VIEW z_auto_quotes_complete AS
SELECT
    q.*,
    u.name as user_name,
    u.email as user_email,
    u.phone as user_phone,
    u.agency_code,
    u.agency_name,
    a.name as agency_official_name,
    a.contact_email as agency_email,
    a.contact_phone as agency_phone,
    a.city as agency_city,
    a.state as agency_state
FROM z_auto_quotes q
LEFT JOIN z_auto_users u ON q.user_id = u.id
LEFT JOIN z_auto_agencies a ON q.agency_id = a.id;

-- Vista de simulaciones con información de cotización
CREATE OR REPLACE VIEW z_auto_simulations_complete AS
SELECT
    s.*,
    q.*,
    r.tier_name,
    r.annual_rate,
    r.annual_rate_with_iva
FROM z_auto_simulations s
JOIN z_auto_quotes q ON s.quote_id = q.id
JOIN z_auto_rate_tiers r ON s.tier_code = r.tier_code;

-- =========================================
-- TRIGGERS ADICIONALES PARA NUEVAS TABLAS
-- =========================================

-- Trigger de auditoría para z_auto_exports_generated
DROP TRIGGER IF EXISTS audit_z_auto_exports_generated ON z_auto_exports_generated;
CREATE TRIGGER audit_z_auto_exports_generated
    AFTER INSERT OR UPDATE OR DELETE ON z_auto_exports_generated
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger de auditoría para z_auto_pdfs_generated
DROP TRIGGER IF EXISTS audit_z_auto_pdfs_generated ON z_auto_pdfs_generated;
CREATE TRIGGER audit_z_auto_pdfs_generated
    AFTER INSERT OR UPDATE OR DELETE ON z_auto_pdfs_generated
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Trigger de auditoría para z_auto_authorization_requests
DROP TRIGGER IF EXISTS audit_z_auto_authorization_requests ON z_auto_authorization_requests;
CREATE TRIGGER audit_z_auto_authorization_requests
    AFTER INSERT OR UPDATE OR DELETE ON z_auto_authorization_requests
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
