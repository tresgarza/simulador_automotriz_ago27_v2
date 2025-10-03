'use client'

import React from 'react'
import { CreateCreditApplicationData } from '../../lib/credit-application-service'

interface SectionProps {
  formData: CreateCreditApplicationData
  onChange: (field: keyof CreateCreditApplicationData, value: any) => void
  errors: Record<string, string>
}

// Componente de Input reutilizable
const FormInput = ({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  error, 
  required = false,
  placeholder,
  options,
  className = ''
}: {
  label: string
  name: string
  type?: string
  value: any
  onChange: (value: any) => void
  error?: string
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  className?: string
}) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    
    {type === 'select' ? (
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <option value="">Seleccionar...</option>
        {options?.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ) : type === 'textarea' ? (
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
    ) : (
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
    )}
    
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
)

// A) DATOS DEL CRÉDITO - Orden igual al PDF
export const CreditSection = ({ formData, onChange, errors }: SectionProps) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-green-600 border-b-2 border-green-200 pb-2">A) DATOS DEL CRÉDITO</h3>
    
    {/* Primera fila: Información del vehículo */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <FormInput
        label="Marca/Modelo"
        name="vehicle_brand_model"
        value={`${formData.vehicle_brand || ''} ${formData.vehicle_model || ''}`.trim()}
        onChange={(value) => {
          const parts = value.split(' ')
          onChange('vehicle_brand', parts[0] || '')
          onChange('vehicle_model', parts.slice(1).join(' ') || '')
        }}
        error={errors.vehicle_brand}
        placeholder="Ej: Toyota Corolla"
      />
      
      <FormInput
        label="Año"
        name="vehicle_year"
        type="number"
        value={formData.vehicle_year}
        onChange={(value) => onChange('vehicle_year', parseInt(value))}
        error={errors.vehicle_year}
        placeholder="2024"
      />
      
      <FormInput
        label="Precio Vehículo"
        name="vehicle_value"
        type="number"
        value={formData.vehicle_value}
        onChange={(value) => onChange('vehicle_value', parseFloat(value))}
        error={errors.vehicle_value}
        required
        placeholder="350000"
      />
      
      <FormInput
        label="Enganche"
        name="down_payment_amount"
        type="number"
        value={formData.down_payment_amount}
        onChange={(value) => onChange('down_payment_amount', parseFloat(value))}
        error={errors.down_payment_amount}
        placeholder="70000"
      />
    </div>

    {/* Segunda fila: Información del crédito */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <FormInput
        label="Importe del Crédito"
        name="requested_amount"
        type="number"
        value={formData.requested_amount}
        onChange={(value) => onChange('requested_amount', parseFloat(value))}
        error={errors.requested_amount}
        required
        placeholder="280000"
      />
      
      <FormInput
        label="Plazo (Meses)"
        name="term_months"
        type="select"
        value={formData.term_months}
        onChange={(value) => onChange('term_months', parseInt(value))}
        error={errors.term_months}
        required
        options={[
          { value: '24', label: '24 meses' },
          { value: '36', label: '36 meses' },
          { value: '48', label: '48 meses' },
          { value: '60', label: '60 meses' }
        ]}
      />
      
      <FormInput
        label="Pago Mensual"
        name="monthly_payment"
        type="number"
        value={formData.monthly_payment}
        onChange={(value) => onChange('monthly_payment', parseFloat(value))}
        error={errors.monthly_payment}
        placeholder="7500"
      />
      
      <FormInput
        label="Agencia"
        name="branch"
        value={formData.branch}
        onChange={(value) => onChange('branch', value)}
        error={errors.branch}
        placeholder="Sucursal principal"
      />
    </div>

    {/* Tercera fila: Seguro y plan */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <FormInput
        label="Monto del Seguro"
        name="insurance_amount"
        type="number"
        value={formData.insurance_amount}
        onChange={(value) => onChange('insurance_amount', parseFloat(value))}
        error={errors.insurance_amount}
        placeholder="15000"
      />
      
      <FormInput
        label="Seguro Financiado"
        name="insurance_mode"
        type="select"
        value={formData.insurance_mode}
        onChange={(value) => onChange('insurance_mode', value)}
        error={errors.insurance_mode}
        options={[
          { value: 'financed', label: 'Sí' },
          { value: 'cash', label: 'No' }
        ]}
      />
      
      
      <FormInput
        label="Asesor"
        name="collecting_advisor_name"
        value={formData.collecting_advisor_name}
        onChange={(value) => onChange('collecting_advisor_name', value)}
        error={errors.collecting_advisor_name}
        placeholder="Nombre del asesor"
      />
    </div>
  </div>
)

// B) INFORMACIÓN PERSONAL - Orden igual al PDF
export const PersonalSection = ({ formData, onChange, errors }: SectionProps) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-green-600 border-b-2 border-green-200 pb-2">B) INFORMACIÓN PERSONAL</h3>
    
    {/* Primera fila: Nombres */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <FormInput
        label="Apellido Paterno"
        name="paternal_surname"
        value={formData.paternal_surname}
        onChange={(value) => onChange('paternal_surname', value)}
        error={errors.paternal_surname}
        required
        placeholder="Apellido paterno"
      />
      
      <FormInput
        label="Apellido Materno"
        name="maternal_surname"
        value={formData.maternal_surname}
        onChange={(value) => onChange('maternal_surname', value)}
        error={errors.maternal_surname}
        required
        placeholder="Apellido materno"
      />
      
      <FormInput
        label="Nombre(s)"
        name="first_names"
        value={formData.first_names}
        onChange={(value) => onChange('first_names', value)}
        error={errors.first_names}
        required
        placeholder="Nombres"
      />
      
      <FormInput
        label="Estado Civil"
        name="marital_status"
        type="select"
        value={formData.marital_status}
        onChange={(value) => onChange('marital_status', value)}
        error={errors.marital_status}
        options={[
          { value: 'Soltero', label: 'Soltero(a)' },
          { value: 'Casado', label: 'Casado(a)' },
          { value: 'Divorciado', label: 'Divorciado(a)' },
          { value: 'Viudo', label: 'Viudo(a)' },
          { value: 'Unión libre', label: 'Unión libre' }
        ]}
      />
    </div>

    {/* Segunda fila: Documentos */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <FormInput
        label="CURP"
        name="curp"
        value={formData.curp}
        onChange={(value) => onChange('curp', value.toUpperCase())}
        error={errors.curp}
        required
        placeholder="18 caracteres"
      />
      
      <FormInput
        label="RFC"
        name="rfc_with_homoclave"
        value={formData.rfc_with_homoclave}
        onChange={(value) => onChange('rfc_with_homoclave', value.toUpperCase())}
        error={errors.rfc_with_homoclave}
        placeholder="13 caracteres"
      />
      
      <FormInput
        label="NSS (dejar en blanco si desconoce)"
        name="nss"
        value={formData.nss}
        onChange={(value) => onChange('nss', value)}
        error={errors.nss}
        placeholder="Número de Seguro Social"
      />
      
      <FormInput
        label="Homoclave"
        name="rfc_homoclave"
        value={formData.rfc_homoclave}
        onChange={(value) => onChange('rfc_homoclave', value.toUpperCase())}
        error={errors.rfc_homoclave}
        placeholder="3 caracteres"
      />
    </div>

    {/* Tercera fila: Información personal */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <FormInput
        label="Fecha de Nacimiento"
        name="birth_date"
        type="date"
        value={formData.birth_date}
        onChange={(value) => onChange('birth_date', value)}
        error={errors.birth_date}
        required
      />
      
      <FormInput
        label="Género (F/M)"
        name="gender"
        type="select"
        value={formData.gender}
        onChange={(value) => onChange('gender', value)}
        error={errors.gender}
        options={[
          { value: 'Masculino', label: 'Masculino' },
          { value: 'Femenino', label: 'Femenino' }
        ]}
      />
      
      <FormInput
        label="País de Nacimiento"
        name="birth_country"
        value={formData.birth_country || 'México'}
        onChange={(value) => onChange('birth_country', value)}
        error={errors.birth_country}
        placeholder="México"
      />
      
      <FormInput
        label="Nacionalidad"
        name="nationality"
        value={formData.nationality}
        onChange={(value) => onChange('nationality', value)}
        error={errors.nationality}
        placeholder="Mexicana"
      />
    </div>

    {/* Cuarta fila: Educación y otros */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <FormInput
        label="Nivel de Estudios"
        name="education_level"
        type="select"
        value={formData.education_level}
        onChange={(value) => onChange('education_level', value)}
        error={errors.education_level}
        options={[
          { value: 'Primaria', label: 'Primaria' },
          { value: 'Secundaria', label: 'Secundaria' },
          { value: 'Bachillerato', label: 'Bachillerato' },
          { value: 'Técnico', label: 'Técnico' },
          { value: 'Licenciatura', label: 'Licenciatura' },
          { value: 'Posgrado', label: 'Posgrado' }
        ]}
      />
      
      <FormInput
        label="Entidad Federativa de Nacimiento"
        name="birth_state"
        value={formData.birth_state}
        onChange={(value) => onChange('birth_state', value)}
        error={errors.birth_state}
        placeholder="Estado de nacimiento"
      />
      
      <FormInput
        label="Serie de Firma Electrónica (dejar en blanco si desconoce)"
        name="electronic_signature_series"
        value={formData.electronic_signature_series}
        onChange={(value) => onChange('electronic_signature_series', value.toUpperCase())}
        error={errors.electronic_signature_series}
        placeholder="Serie FIEL"
      />
      
      <FormInput
        label="Núm. de Dependientes"
        name="dependents_count"
        type="number"
        value={formData.dependents_count}
        onChange={(value) => onChange('dependents_count', parseInt(value))}
        error={errors.dependents_count}
        placeholder="0"
      />
    </div>

    {/* Quinta fila: Dirección */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <FormInput
        label="Calle y Número"
        name="street_and_number"
        value={formData.street_and_number}
        onChange={(value) => onChange('street_and_number', value)}
        error={errors.street_and_number}
        placeholder="Calle y número exterior/interior"
      />
      
      <FormInput
        label="Colonia"
        name="neighborhood"
        value={formData.neighborhood}
        onChange={(value) => onChange('neighborhood', value)}
        error={errors.neighborhood}
        placeholder="Colonia"
      />
      
      <FormInput
        label="Delegación/Municipio"
        name="municipality"
        value={formData.municipality}
        onChange={(value) => onChange('municipality', value)}
        error={errors.municipality}
        placeholder="Municipio"
      />
      
      <FormInput
        label="Estado"
        name="state"
        value={formData.state}
        onChange={(value) => onChange('state', value)}
        error={errors.state}
        placeholder="Estado"
      />
    </div>

    {/* Sexta fila: Detalles domicilio */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <FormInput
        label="C.P."
        name="postal_code"
        value={formData.postal_code}
        onChange={(value) => onChange('postal_code', value)}
        error={errors.postal_code}
        placeholder="Código postal"
      />
      
      <FormInput
        label="Entre Calles"
        name="between_streets"
        value={formData.between_streets}
        onChange={(value) => onChange('between_streets', value)}
        error={errors.between_streets}
        placeholder="Referencias de ubicación"
      />
      
      <FormInput
        label="Tipo de Vivienda"
        name="housing_type"
        type="select"
        value={formData.housing_type}
        onChange={(value) => onChange('housing_type', value)}
        error={errors.housing_type}
        options={[
          { value: 'Propia', label: 'Propia' },
          { value: 'Rentada', label: 'Rentada' },
          { value: 'Familiar', label: 'Familiar' },
          { value: 'Hipotecada', label: 'Hipotecada' },
          { value: 'Otro', label: 'Otro' }
        ]}
      />
      
      <FormInput
        label="Años de Residencia"
        name="residence_years"
        type="number"
        value={formData.residence_years}
        onChange={(value) => onChange('residence_years', parseInt(value))}
        error={errors.residence_years}
        placeholder="Años"
      />
    </div>

    {/* Séptima fila: Contacto */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <FormInput
        label="Teléfono con Clave LADA"
        name="landline_phone"
        type="tel"
        value={formData.landline_phone}
        onChange={(value) => onChange('landline_phone', value)}
        error={errors.landline_phone}
        placeholder="Con LADA (ej: 5512345678)"
      />
      
      <FormInput
        label="Teléfono de Recados c/LADA"
        name="emergency_phone"
        type="tel"
        value={formData.emergency_phone}
        onChange={(value) => onChange('emergency_phone', value)}
        error={errors.emergency_phone}
        placeholder="Con LADA (ej: 5512345678)"
      />
      
      <FormInput
        label="Teléfono Celular"
        name="mobile_phone"
        type="tel"
        value={formData.mobile_phone}
        onChange={(value) => onChange('mobile_phone', value)}
        error={errors.mobile_phone}
        required
        placeholder="Con LADA (ej: 5512345678)"
      />
      
      <FormInput
        label="País"
        name="country"
        value={formData.country}
        onChange={(value) => onChange('country', value)}
        error={errors.country}
        placeholder="México"
      />
    </div>

    {/* Octava fila: Emails */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormInput
        label="E-mail Personal"
        name="personal_email"
        type="email"
        value={formData.personal_email}
        onChange={(value) => onChange('personal_email', value)}
        error={errors.personal_email}
        placeholder="correo@personal.com"
      />
      
      <FormInput
        label="E-mail Laboral"
        name="work_email"
        type="email"
        value={formData.work_email}
        onChange={(value) => onChange('work_email', value)}
        error={errors.work_email}
        placeholder="correo@trabajo.com"
      />
    </div>
  </div>
)

// C) INFORMACIÓN DEL EMPLEO - Orden igual al PDF
export const EmploymentSection = ({ formData, onChange, errors }: SectionProps) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-green-600 border-b-2 border-green-200 pb-2">C) INFORMACIÓN DEL EMPLEO</h3>
    
    {/* Primera fila: Información básica del empleo */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      <FormInput
        label="Ocupación"
        name="occupation"
        value={formData.occupation}
        onChange={(value) => onChange('occupation', value)}
        error={errors.occupation}
        placeholder="Ej: Contador, Ingeniero"
      />
      
      <FormInput
        label="Empresa o Dependencia"
        name="company_name"
        value={formData.company_name}
        onChange={(value) => onChange('company_name', value)}
        error={errors.company_name}
        required
        placeholder="Nombre de la empresa"
      />
      
      <FormInput
        label="Jefe Inmediato"
        name="immediate_supervisor"
        value={formData.immediate_supervisor}
        onChange={(value) => onChange('immediate_supervisor', value)}
        error={errors.immediate_supervisor}
        placeholder="Nombre del jefe directo"
      />
    </div>

    {/* Segunda fila: Detalles del empleo */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <FormInput
        label="Puesto"
        name="job_position"
        value={formData.job_position}
        onChange={(value) => onChange('job_position', value)}
        error={errors.job_position}
        required
        placeholder="Puesto que desempeña"
      />
      
      <FormInput
        label="Teléfono con LADA"
        name="work_phone"
        type="tel"
        value={formData.work_phone}
        onChange={(value) => onChange('work_phone', value)}
        error={errors.work_phone}
        placeholder="Teléfono del trabajo"
      />
      
      <FormInput
        label="Extensión"
        name="work_extension"
        value={formData.work_extension}
        onChange={(value) => onChange('work_extension', value)}
        error={errors.work_extension}
        placeholder="Ext. telefónica"
      />
      
      <FormInput
        label="Ingreso Mensual"
        name="monthly_income"
        type="number"
        value={formData.monthly_income}
        onChange={(value) => onChange('monthly_income', parseFloat(value))}
        error={errors.monthly_income}
        required
        placeholder="Ingreso mensual neto"
      />
    </div>

    {/* Tercera fila: Antigüedad detallada */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <FormInput
        label="Antigüedad (Años)"
        name="job_seniority_years"
        type="number"
        value={formData.job_seniority_years}
        onChange={(value) => onChange('job_seniority_years', parseInt(value))}
        error={errors.job_seniority_years}
        placeholder="Años"
      />
      
      <FormInput
        label="Antigüedad (Meses)"
        name="job_seniority_months"
        type="number"
        value={formData.job_seniority_months}
        onChange={(value) => onChange('job_seniority_months', parseInt(value))}
        error={errors.job_seniority_months}
        placeholder="Meses adicionales"
      />
      
      <FormInput
        label="Domicilio Laboral"
        name="work_address"
        value={formData.work_address}
        onChange={(value) => onChange('work_address', value)}
        error={errors.work_address}
        placeholder="Dirección completa del trabajo"
      />
    </div>
  </div>
)

// D) REFERENCIAS PERSONALES - Orden igual al PDF
export const ReferencesSection = ({ formData, onChange, errors }: SectionProps) => (
  <div className="space-y-6">
    <h3 className="text-lg font-semibold text-green-600 border-b-2 border-green-200 pb-2">D) REFERENCIAS PERSONALES</h3>
    
    {/* Referencia 1 */}
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium text-gray-700 mb-3">Referencia 1</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormInput
          label="Nombre"
          name="reference_1_name"
          value={formData.reference_1_name}
          onChange={(value) => onChange('reference_1_name', value)}
          error={errors.reference_1_name}
          placeholder="Nombre completo"
        />
        
        <FormInput
          label="Teléfono con Clave LADA"
          name="reference_1_phone1"
          type="tel"
          value={formData.reference_1_phone1}
          onChange={(value) => onChange('reference_1_phone1', value)}
          error={errors.reference_1_phone1}
          placeholder="Teléfono principal"
        />
        
        <FormInput
          label="Teléfono 2"
          name="reference_1_phone2"
          type="tel"
          value={formData.reference_1_phone2}
          onChange={(value) => onChange('reference_1_phone2', value)}
          error={errors.reference_1_phone2}
          placeholder="Teléfono alternativo"
        />
        
        <FormInput
          label="Parentesco"
          name="reference_1_relationship"
          type="select"
          value={formData.reference_1_relationship}
          onChange={(value) => onChange('reference_1_relationship', value)}
          error={errors.reference_1_relationship}
          options={[
            { value: 'Familiar', label: 'Familiar' },
            { value: 'Amigo', label: 'Amigo' }
          ]}
        />
      </div>
    </div>

    {/* Referencia 2 */}
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium text-gray-700 mb-3">Referencia 2</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormInput
          label="Nombre"
          name="reference_2_name"
          value={formData.reference_2_name}
          onChange={(value) => onChange('reference_2_name', value)}
          error={errors.reference_2_name}
          placeholder="Nombre completo"
        />
        
        <FormInput
          label="Teléfono con Clave LADA"
          name="reference_2_phone1"
          type="tel"
          value={formData.reference_2_phone1}
          onChange={(value) => onChange('reference_2_phone1', value)}
          error={errors.reference_2_phone1}
          placeholder="Teléfono principal"
        />
        
        <FormInput
          label="Teléfono 2"
          name="reference_2_phone2"
          type="tel"
          value={formData.reference_2_phone2}
          onChange={(value) => onChange('reference_2_phone2', value)}
          error={errors.reference_2_phone2}
          placeholder="Teléfono alternativo"
        />
        
        <FormInput
          label="Parentesco"
          name="reference_2_relationship"
          type="select"
          value={formData.reference_2_relationship}
          onChange={(value) => onChange('reference_2_relationship', value)}
          error={errors.reference_2_relationship}
          options={[
            { value: 'Familiar', label: 'Familiar' },
            { value: 'Amigo', label: 'Amigo' }
          ]}
        />
      </div>
    </div>

    {/* Referencia 3 */}
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium text-gray-700 mb-3">Referencia 3</h4>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <FormInput
          label="Nombre"
          name="reference_3_name"
          value={formData.reference_3_name}
          onChange={(value) => onChange('reference_3_name', value)}
          error={errors.reference_3_name}
          placeholder="Nombre completo"
        />
        
        <FormInput
          label="Teléfono con Clave LADA"
          name="reference_3_phone1"
          type="tel"
          value={formData.reference_3_phone1}
          onChange={(value) => onChange('reference_3_phone1', value)}
          error={errors.reference_3_phone1}
          placeholder="Teléfono principal"
        />
        
        <FormInput
          label="Teléfono Celular"
          name="reference_3_mobile"
          type="tel"
          value={formData.reference_3_mobile}
          onChange={(value) => onChange('reference_3_mobile', value)}
          error={errors.reference_3_mobile}
          placeholder="Teléfono celular"
        />
        
        <FormInput
          label="Parentesco"
          name="reference_3_relationship"
          type="select"
          value={formData.reference_3_relationship}
          onChange={(value) => onChange('reference_3_relationship', value)}
          error={errors.reference_3_relationship}
          options={[
            { value: 'Familiar', label: 'Familiar' },
            { value: 'Amigo', label: 'Amigo' }
          ]}
        />
      </div>
    </div>
  </div>
)
