-- Add vehicle-related fields to z_auto_credit_applications table
ALTER TABLE z_auto_credit_applications 
ADD COLUMN IF NOT EXISTS vehicle_brand VARCHAR(100),
ADD COLUMN IF NOT EXISTS vehicle_model VARCHAR(100), 
ADD COLUMN IF NOT EXISTS vehicle_year INTEGER,
ADD COLUMN IF NOT EXISTS vehicle_value DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS down_payment_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS insurance_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS insurance_mode VARCHAR(10) CHECK (insurance_mode IN ('cash', 'financed')),
ADD COLUMN IF NOT EXISTS monthly_payment DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS branch VARCHAR(255);





