-- =========================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- Proyecto: ydnygntfkrleiseuciwq
-- Fecha: 2025-01-26
-- =========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE z_auto_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE z_auto_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE z_auto_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE z_auto_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE z_auto_pdfs_generated ENABLE ROW LEVEL SECURITY;
ALTER TABLE z_auto_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE z_auto_system_config ENABLE ROW LEVEL SECURITY;

-- Políticas para z_auto_users
CREATE POLICY "Users can view their own data" ON z_auto_users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON z_auto_users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data" ON z_auto_users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Asesores can view all users" ON z_auto_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );

CREATE POLICY "Asesores can manage users" ON z_auto_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );

-- Políticas para z_auto_agencies
CREATE POLICY "Agencies can view their own data" ON z_auto_agencies
    FOR SELECT USING (
        agency_code IN (
            SELECT agency_code FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'agency'
        )
    );

CREATE POLICY "Agencies can update their own data" ON z_auto_agencies
    FOR UPDATE USING (
        agency_code IN (
            SELECT agency_code FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'agency'
        )
    );

CREATE POLICY "Asesores can view all agencies" ON z_auto_agencies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );

CREATE POLICY "Asesores can manage agencies" ON z_auto_agencies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );

-- Políticas para z_auto_quotes
CREATE POLICY "Users can view their own quotes" ON z_auto_quotes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own quotes" ON z_auto_quotes
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own quotes" ON z_auto_quotes
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Agencies can view quotes from their agency" ON z_auto_quotes
    FOR SELECT USING (
        agency_id IN (
            SELECT id FROM z_auto_agencies
            WHERE agency_code IN (
                SELECT agency_code FROM z_auto_users
                WHERE id = auth.uid() AND user_type = 'agency'
            )
        )
    );

CREATE POLICY "Agencies can create quotes for their agency" ON z_auto_quotes
    FOR INSERT WITH CHECK (
        agency_id IN (
            SELECT id FROM z_auto_agencies
            WHERE agency_code IN (
                SELECT agency_code FROM z_auto_users
                WHERE id = auth.uid() AND user_type = 'agency'
            )
        )
    );

CREATE POLICY "Asesores can view all quotes" ON z_auto_quotes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );

CREATE POLICY "Asesores can manage all quotes" ON z_auto_quotes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );

-- Políticas para z_auto_simulations
CREATE POLICY "Users can view simulations of their quotes" ON z_auto_simulations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM z_auto_quotes
            WHERE id = quote_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create simulations for their quotes" ON z_auto_simulations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM z_auto_quotes
            WHERE id = quote_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Agencies can view simulations for their agency quotes" ON z_auto_simulations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM z_auto_quotes
            WHERE id = quote_id AND agency_id IN (
                SELECT id FROM z_auto_agencies
                WHERE agency_code IN (
                    SELECT agency_code FROM z_auto_users
                    WHERE id = auth.uid() AND user_type = 'agency'
                )
            )
        )
    );

CREATE POLICY "Asesores can view all simulations" ON z_auto_simulations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );

CREATE POLICY "Asesores can manage all simulations" ON z_auto_simulations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );

-- Políticas para z_auto_pdfs_generated
CREATE POLICY "Users can view their own PDFs" ON z_auto_pdfs_generated
    FOR SELECT USING (
        generated_by_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM z_auto_quotes
            WHERE id = quote_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create PDFs for their quotes" ON z_auto_pdfs_generated
    FOR INSERT WITH CHECK (
        generated_by_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM z_auto_quotes
            WHERE id = quote_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Asesores can view all PDFs" ON z_auto_pdfs_generated
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );

-- Políticas para z_auto_audit_logs (solo asesores)
CREATE POLICY "Only asesores can view audit logs" ON z_auto_audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );

CREATE POLICY "System can insert audit logs" ON z_auto_audit_logs
    FOR INSERT WITH CHECK (true);

-- Políticas para z_auto_system_config (solo asesores)
CREATE POLICY "Only asesores can view system config" ON z_auto_system_config
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );

CREATE POLICY "Only asesores can manage system config" ON z_auto_system_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );

-- Políticas para z_auto_rate_tiers (solo lectura para todos, escritura para asesores)
CREATE POLICY "Everyone can view rate tiers" ON z_auto_rate_tiers
    FOR SELECT USING (true);

CREATE POLICY "Only asesores can manage rate tiers" ON z_auto_rate_tiers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );

-- =========================================
-- POLÍTICAS PARA NUEVAS TABLAS
-- =========================================

-- Políticas para z_auto_exports_generated
ALTER TABLE z_auto_exports_generated ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view exports of their quotes" ON z_auto_exports_generated
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM z_auto_quotes
            WHERE id = quote_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create exports for their quotes" ON z_auto_exports_generated
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM z_auto_quotes
            WHERE id = quote_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Agencies can view exports from their agency quotes" ON z_auto_exports_generated
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM z_auto_quotes q
            JOIN z_auto_agencies a ON q.agency_id = a.id
            WHERE q.id = quote_id AND a.agency_code IN (
                SELECT agency_code FROM z_auto_users
                WHERE id = auth.uid() AND user_type = 'agency'
            )
        )
    );

CREATE POLICY "Agencies can create exports for their agency quotes" ON z_auto_exports_generated
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM z_auto_quotes q
            JOIN z_auto_agencies a ON q.agency_id = a.id
            WHERE q.id = quote_id AND a.agency_code IN (
                SELECT agency_code FROM z_auto_users
                WHERE id = auth.uid() AND user_type = 'agency'
            )
        )
    );

CREATE POLICY "Asesores can view all exports" ON z_auto_exports_generated
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );

CREATE POLICY "Asesores can manage all exports" ON z_auto_exports_generated
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM z_auto_users
            WHERE id = auth.uid() AND user_type = 'asesor'
        )
    );
