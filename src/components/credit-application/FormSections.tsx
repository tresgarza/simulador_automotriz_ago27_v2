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
    ) : type === 'checkbox' ? (
      <div className="flex items-center">
        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
        <span className="ml-2 text-sm text-gray-700">{placeholder}</span>
      </div>
    ) : (
      <input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
      />
    )}
    
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
)

// A) Datos del Crédito
export const CreditSection = ({ formData, onChange, errors }: SectionProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <FormInput
      label="Producto"
      name="product_type"
      type="select"
      value={formData.product_type}
      onChange={(value) => onChange('product_type', value)}
      error={errors.product_type}
      required
      options={[
        { value: 'Auto', label: 'Crédito Automotriz' },
        { value: 'Personal', label: 'Crédito Personal' },
        { value: 'Credinómina', label: 'Credinómina' }
      ]}
    />

    <FormInput
      label="Monto Solicitado"
      name="requested_amount"
      type="number"
      value={formData.requested_amount}
      onChange={(value) => onChange('requested_amount', value)}
      error={errors.requested_amount}
      required
      placeholder="Ej: 250000"
    />

    <FormInput
      label="Plazo (meses)"
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
      label="Periodicidad de Pago"
      name="payment_frequency"
      type="select"
      value={formData.payment_frequency}
      onChange={(value) => onChange('payment_frequency', value)}
      error={errors.payment_frequency}
      required
      options={[
        { value: 'semanal', label: 'Semanal' },
        { value: 'quincenal', label: 'Quincenal' },
        { value: 'mensual', label: 'Mensual' }
      ]}
    />

    <div className="md:col-span-2">
      <FormInput
        label="Uso de Recursos"
        name="resource_usage"
        type="textarea"
        value={formData.resource_usage}
        onChange={(value) => onChange('resource_usage', value)}
        error={errors.resource_usage}
        required
        placeholder="Describa el destino de los recursos del crédito"
      />
    </div>
  </div>
)

// B) Datos del Solicitante
export const IdentitySection = ({ formData, onChange, errors }: SectionProps) => (
  <div className="space-y-6">
    {/* Identidad */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Identidad</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormInput
          label="Apellido Paterno"
          name="paternal_surname"
          value={formData.paternal_surname}
          onChange={(value) => onChange('paternal_surname', value)}
          error={errors.paternal_surname}
          required
        />

        <FormInput
          label="Apellido Materno"
          name="maternal_surname"
          value={formData.maternal_surname}
          onChange={(value) => onChange('maternal_surname', value)}
          error={errors.maternal_surname}
        />

        <FormInput
          label="Nombre(s)"
          name="first_names"
          value={formData.first_names}
          onChange={(value) => onChange('first_names', value)}
          error={errors.first_names}
          required
        />

        <FormInput
          label="Estado Civil"
          name="marital_status"
          type="select"
          value={formData.marital_status}
          onChange={(value) => onChange('marital_status', value)}
          error={errors.marital_status}
          options={[
            { value: 'Soltero(a)', label: 'Soltero(a)' },
            { value: 'Casado(a)', label: 'Casado(a)' },
            { value: 'Divorciado(a)', label: 'Divorciado(a)' },
            { value: 'Viudo(a)', label: 'Viudo(a)' },
            { value: 'Unión Libre', label: 'Unión Libre' }
          ]}
        />

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
          label="RFC con Homoclave"
          name="rfc_with_homoclave"
          value={formData.rfc_with_homoclave}
          onChange={(value) => onChange('rfc_with_homoclave', value.toUpperCase())}
          error={errors.rfc_with_homoclave}
          placeholder="13 caracteres"
        />

        <FormInput
          label="Homoclave (separada)"
          name="rfc_homoclave"
          value={formData.rfc_homoclave}
          onChange={(value) => onChange('rfc_homoclave', value.toUpperCase())}
          error={errors.rfc_homoclave}
          placeholder="3 caracteres"
        />

        <FormInput
          label="NSS"
          name="nss"
          value={formData.nss}
          onChange={(value) => onChange('nss', value)}
          error={errors.nss}
          placeholder="Número de Seguro Social"
        />

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
          label="Género"
          name="gender"
          type="select"
          value={formData.gender}
          onChange={(value) => onChange('gender', value)}
          error={errors.gender}
          options={[
            { value: 'Masculino', label: 'Masculino' },
            { value: 'Femenino', label: 'Femenino' },
            { value: 'Otro', label: 'Otro' }
          ]}
        />

        <FormInput
          label="País de Nacimiento"
          name="birth_country"
          value={formData.birth_country}
          onChange={(value) => onChange('birth_country', value)}
          error={errors.birth_country}
          placeholder="Ej: México"
        />

        <FormInput
          label="Nacionalidad"
          name="nationality"
          value={formData.nationality}
          onChange={(value) => onChange('nationality', value)}
          error={errors.nationality}
        />

        <FormInput
          label="Entidad de Nacimiento"
          name="birth_state"
          value={formData.birth_state}
          onChange={(value) => onChange('birth_state', value)}
          error={errors.birth_state}
        />

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
          label="Serie de Firma Electrónica Avanzada"
          name="electronic_signature_series"
          value={formData.electronic_signature_series}
          onChange={(value) => onChange('electronic_signature_series', value.toUpperCase())}
          error={errors.electronic_signature_series}
          placeholder="Serie FIEL"
        />

        <FormInput
          label="Número de Dependientes Económicos"
          name="dependents_count"
          type="number"
          value={formData.dependents_count?.toString() || ''}
          onChange={(value) => onChange('dependents_count', value ? parseInt(value) : undefined)}
          error={errors.dependents_count}
          placeholder="0"
        />
      </div>
    </div>

    {/* Contacto */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Contacto</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Email Personal"
          name="personal_email"
          type="email"
          value={formData.personal_email}
          onChange={(value) => onChange('personal_email', value)}
          error={errors.personal_email}
          required
        />

        <FormInput
          label="Email Laboral"
          name="work_email"
          type="email"
          value={formData.work_email}
          onChange={(value) => onChange('work_email', value)}
          error={errors.work_email}
        />

        <FormInput
          label="Teléfono Móvil"
          name="mobile_phone"
          type="tel"
          value={formData.mobile_phone}
          onChange={(value) => onChange('mobile_phone', value)}
          error={errors.mobile_phone}
          required
          placeholder="Con LADA (ej: 5512345678)"
        />

        <FormInput
          label="Teléfono Fijo"
          name="landline_phone"
          type="tel"
          value={formData.landline_phone}
          onChange={(value) => onChange('landline_phone', value)}
          error={errors.landline_phone}
          placeholder="Con LADA (ej: 5512345678)"
        />

        <FormInput
          label="Teléfono de Recados con Clave LADA"
          name="emergency_phone"
          type="tel"
          value={formData.emergency_phone}
          onChange={(value) => onChange('emergency_phone', value)}
          error={errors.emergency_phone}
          placeholder="Con LADA (ej: 5512345678)"
        />
      </div>
    </div>

    {/* Domicilio */}
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Domicilio</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Calle y Número"
          name="street_and_number"
          value={formData.street_and_number}
          onChange={(value) => onChange('street_and_number', value)}
          error={errors.street_and_number}
          required
        />

        <FormInput
          label="No. Interior"
          name="interior_number"
          value={formData.interior_number}
          onChange={(value) => onChange('interior_number', value)}
          error={errors.interior_number}
        />

        <div className="md:col-span-2">
          <FormInput
            label="Entre Calles"
            name="between_streets"
            value={formData.between_streets}
            onChange={(value) => onChange('between_streets', value)}
            error={errors.between_streets}
          />
        </div>

        <FormInput
          label="Colonia"
          name="neighborhood"
          value={formData.neighborhood}
          onChange={(value) => onChange('neighborhood', value)}
          error={errors.neighborhood}
          required
        />

        <FormInput
          label="Municipio/Alcaldía"
          name="municipality"
          value={formData.municipality}
          onChange={(value) => onChange('municipality', value)}
          error={errors.municipality}
          required
        />

        <FormInput
          label="Estado"
          name="state"
          value={formData.state}
          onChange={(value) => onChange('state', value)}
          error={errors.state}
          required
        />

        <FormInput
          label="Código Postal"
          name="postal_code"
          value={formData.postal_code}
          onChange={(value) => onChange('postal_code', value)}
          error={errors.postal_code}
          required
          placeholder="5 dígitos"
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
            { value: 'Otro', label: 'Otro' }
          ]}
        />

        <FormInput
          label="Años de Residencia"
          name="residence_years"
          type="number"
          value={formData.residence_years}
          onChange={(value) => onChange('residence_years', value)}
          error={errors.residence_years}
          placeholder="Años viviendo en esta dirección"
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
    </div>
  </div>
)

// C) Empleo e Ingresos
export const EmploymentSection = ({ formData, onChange, errors }: SectionProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <FormInput
      label="Empresa/Dependencia"
      name="company_name"
      value={formData.company_name}
      onChange={(value) => onChange('company_name', value)}
      error={errors.company_name}
      required
    />

    <FormInput
      label="Puesto"
      name="job_position"
      value={formData.job_position}
      onChange={(value) => onChange('job_position', value)}
      error={errors.job_position}
      required
    />

    <FormInput
      label="Ocupación"
      name="occupation"
      value={formData.occupation}
      onChange={(value) => onChange('occupation', value)}
      error={errors.occupation}
      placeholder="Ej: Contador, Ingeniero, etc."
    />

    <FormInput
      label="Jefe Inmediato"
      name="immediate_supervisor"
      value={formData.immediate_supervisor}
      onChange={(value) => onChange('immediate_supervisor', value)}
      error={errors.immediate_supervisor}
      placeholder="Nombre del jefe directo"
    />

    <FormInput
      label="Antigüedad (Años)"
      name="job_seniority_years"
      type="number"
      value={formData.job_seniority_years}
      onChange={(value) => onChange('job_seniority_years', value)}
      error={errors.job_seniority_years}
    />

    <FormInput
      label="Antigüedad (Meses)"
      name="job_seniority_months"
      type="number"
      value={formData.job_seniority_months}
      onChange={(value) => onChange('job_seniority_months', value)}
      error={errors.job_seniority_months}
    />

    <FormInput
      label="Ingreso Mensual"
      name="monthly_income"
      type="number"
      value={formData.monthly_income}
      onChange={(value) => onChange('monthly_income', value)}
      error={errors.monthly_income}
      required
      placeholder="Ingreso mensual neto"
    />

    <FormInput
      label="Teléfono Laboral"
      name="work_phone"
      type="tel"
      value={formData.work_phone}
      onChange={(value) => onChange('work_phone', value)}
      error={errors.work_phone}
      placeholder="Con LADA"
    />

    <FormInput
      label="Extensión"
      name="work_extension"
      value={formData.work_extension}
      onChange={(value) => onChange('work_extension', value)}
      error={errors.work_extension}
    />

    <div className="md:col-span-2">
      <FormInput
        label="Domicilio Laboral"
        name="work_address"
        type="textarea"
        value={formData.work_address}
        onChange={(value) => onChange('work_address', value)}
        error={errors.work_address}
        placeholder="Dirección completa del trabajo"
      />
    </div>
  </div>
)

// D) Referencias Personales
export const ReferencesSection = ({ formData, onChange, errors }: SectionProps) => (
  <div className="space-y-8">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-blue-800 text-sm">
        <strong>Importante:</strong> Proporcione al menos 3 referencias personales que NO sean convivientes. 
        Incluya 2 teléfonos fijos con LADA y 1 celular por referencia.
      </p>
    </div>

    {/* Referencia 1 */}
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Referencia Personal 1</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Nombre Completo"
          name="reference_1_name"
          value={formData.reference_1_name}
          onChange={(value) => onChange('reference_1_name', value)}
          error={errors.reference_1_name}
          required
        />

        <FormInput
          label="Parentesco"
          name="reference_1_relationship"
          type="select"
          value={formData.reference_1_relationship}
          onChange={(value) => onChange('reference_1_relationship', value)}
          error={errors.reference_1_relationship}
          required
          options={[
            { value: 'Familiar', label: 'Familiar' },
            { value: 'Amigo', label: 'Amigo' }
          ]}
        />

        <FormInput
          label="Teléfono 1 (con LADA)"
          name="reference_1_phone1"
          type="tel"
          value={formData.reference_1_phone1}
          onChange={(value) => onChange('reference_1_phone1', value)}
          error={errors.reference_1_phone1}
          required
          placeholder="No celular"
        />

        <FormInput
          label="Teléfono 2 (con LADA)"
          name="reference_1_phone2"
          type="tel"
          value={formData.reference_1_phone2}
          onChange={(value) => onChange('reference_1_phone2', value)}
          error={errors.reference_1_phone2}
          placeholder="No celular"
        />

        <FormInput
          label="Celular"
          name="reference_1_mobile"
          type="tel"
          value={formData.reference_1_mobile}
          onChange={(value) => onChange('reference_1_mobile', value)}
          error={errors.reference_1_mobile}
        />
      </div>
    </div>

    {/* Referencia 2 */}
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Referencia Personal 2</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Nombre Completo"
          name="reference_2_name"
          value={formData.reference_2_name}
          onChange={(value) => onChange('reference_2_name', value)}
          error={errors.reference_2_name}
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

        <FormInput
          label="Teléfono 1 (con LADA)"
          name="reference_2_phone1"
          type="tel"
          value={formData.reference_2_phone1}
          onChange={(value) => onChange('reference_2_phone1', value)}
          error={errors.reference_2_phone1}
        />

        <FormInput
          label="Teléfono 2 (con LADA)"
          name="reference_2_phone2"
          type="tel"
          value={formData.reference_2_phone2}
          onChange={(value) => onChange('reference_2_phone2', value)}
          error={errors.reference_2_phone2}
        />

        <FormInput
          label="Celular"
          name="reference_2_mobile"
          type="tel"
          value={formData.reference_2_mobile}
          onChange={(value) => onChange('reference_2_mobile', value)}
          error={errors.reference_2_mobile}
        />
      </div>
    </div>

    {/* Referencia 3 */}
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Referencia Personal 3</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label="Nombre Completo"
          name="reference_3_name"
          value={formData.reference_3_name}
          onChange={(value) => onChange('reference_3_name', value)}
          error={errors.reference_3_name}
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

        <FormInput
          label="Teléfono 1 (con LADA)"
          name="reference_3_phone1"
          type="tel"
          value={formData.reference_3_phone1}
          onChange={(value) => onChange('reference_3_phone1', value)}
          error={errors.reference_3_phone1}
        />

        <FormInput
          label="Teléfono 2 (con LADA)"
          name="reference_3_phone2"
          type="tel"
          value={formData.reference_3_phone2}
          onChange={(value) => onChange('reference_3_phone2', value)}
          error={errors.reference_3_phone2}
        />

        <FormInput
          label="Celular"
          name="reference_3_mobile"
          type="tel"
          value={formData.reference_3_mobile}
          onChange={(value) => onChange('reference_3_mobile', value)}
          error={errors.reference_3_mobile}
        />
      </div>
    </div>
  </div>
)
