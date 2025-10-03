-- Agregar campos del vehículo y crédito a la tabla z_auto_credit_applications
-- Estos campos permiten que las solicitudes sean independientes de las cotizaciones

-- Campos del vehículo
ALTER TABLE z_auto_credit_applications 
ADD COLUMN vehicle_brand VARCHAR(100),
ADD COLUMN vehicle_model VARCHAR(100),
ADD COLUMN vehicle_year INTEGER,
ADD COLUMN vehicle_value DECIMAL(12,2);

-- Campos del crédito
ALTER TABLE z_auto_credit_applications 
ADD COLUMN down_payment_amount DECIMAL(12,2),
ADD COLUMN insurance_amount DECIMAL(12,2),
ADD COLUMN insurance_mode VARCHAR(10) CHECK (insurance_mode IN ('cash', 'financed')),
ADD COLUMN monthly_payment DECIMAL(12,2);

-- Comentarios para documentar los campos
COMMENT ON COLUMN z_auto_credit_applications.vehicle_brand IS 'Marca del vehículo';
COMMENT ON COLUMN z_auto_credit_applications.vehicle_model IS 'Modelo del vehículo';
COMMENT ON COLUMN z_auto_credit_applications.vehicle_year IS 'Año del vehículo';
COMMENT ON COLUMN z_auto_credit_applications.vehicle_value IS 'Valor/precio del vehículo';
COMMENT ON COLUMN z_auto_credit_applications.down_payment_amount IS 'Monto del enganche';
COMMENT ON COLUMN z_auto_credit_applications.insurance_amount IS 'Monto del seguro';
COMMENT ON COLUMN z_auto_credit_applications.insurance_mode IS 'Modo de pago del seguro: cash (contado) o financed (financiado)';
COMMENT ON COLUMN z_auto_credit_applications.monthly_payment IS 'Pago mensual calculado';





