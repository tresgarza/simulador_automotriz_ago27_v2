-- Agregar campos faltantes a la tabla z_auto_credit_applications
-- Estos campos fueron identificados como necesarios para completar el PDF

-- Campos de identidad adicionales
ALTER TABLE z_auto_credit_applications 
ADD COLUMN IF NOT EXISTS rfc_homoclave TEXT,
ADD COLUMN IF NOT EXISTS birth_country TEXT DEFAULT 'México',
ADD COLUMN IF NOT EXISTS electronic_signature_series TEXT,
ADD COLUMN IF NOT EXISTS dependents_count INTEGER DEFAULT 0;

-- Campos de contacto adicionales
ALTER TABLE z_auto_credit_applications 
ADD COLUMN IF NOT EXISTS emergency_phone TEXT;

-- Campos de domicilio adicionales
ALTER TABLE z_auto_credit_applications 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'México';

-- Campos de empleo adicionales
ALTER TABLE z_auto_credit_applications 
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS immediate_supervisor TEXT;

-- Comentarios para documentar los nuevos campos
COMMENT ON COLUMN z_auto_credit_applications.rfc_homoclave IS 'Homoclave del RFC separada del RFC completo';
COMMENT ON COLUMN z_auto_credit_applications.birth_country IS 'País de nacimiento del solicitante';
COMMENT ON COLUMN z_auto_credit_applications.electronic_signature_series IS 'Serie de la firma electrónica avanzada (FIEL)';
COMMENT ON COLUMN z_auto_credit_applications.dependents_count IS 'Número de dependientes económicos';
COMMENT ON COLUMN z_auto_credit_applications.emergency_phone IS 'Teléfono de recados con clave LADA';
COMMENT ON COLUMN z_auto_credit_applications.country IS 'País de residencia';
COMMENT ON COLUMN z_auto_credit_applications.occupation IS 'Ocupación del solicitante';
COMMENT ON COLUMN z_auto_credit_applications.immediate_supervisor IS 'Nombre del jefe inmediato';





