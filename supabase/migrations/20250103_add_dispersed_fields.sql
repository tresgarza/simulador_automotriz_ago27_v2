-- Agregar campos para estado DISPERSADO en authorization_requests
-- Fecha: 2025-01-03
-- Descripción: Añade columnas para registrar cuando un crédito es dispersado

-- Agregar columnas para tracking de dispersión
ALTER TABLE z_auto_authorization_requests
ADD COLUMN IF NOT EXISTS dispersed_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS dispersed_by UUID NULL;

-- Agregar índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_authorization_requests_dispersed_at 
ON z_auto_authorization_requests(dispersed_at);

CREATE INDEX IF NOT EXISTS idx_authorization_requests_dispersed_by 
ON z_auto_authorization_requests(dispersed_by);

-- Agregar foreign key para dispersed_by
ALTER TABLE z_auto_authorization_requests
ADD CONSTRAINT fk_authorization_requests_dispersed_by 
FOREIGN KEY (dispersed_by) REFERENCES z_auto_users(id) ON DELETE SET NULL;

-- Actualizar comentario de la tabla
COMMENT ON COLUMN z_auto_authorization_requests.dispersed_at IS 'Fecha y hora en que el crédito fue dispersado';
COMMENT ON COLUMN z_auto_authorization_requests.dispersed_by IS 'ID del usuario que marcó el crédito como dispersado';

-- Actualizar comentario del campo status para incluir el nuevo estado
COMMENT ON COLUMN z_auto_authorization_requests.status IS 'Estados posibles: pending, in_review, advisor_approved, internal_committee, partners_committee, approved, dispersed, rejected, cancelled';

