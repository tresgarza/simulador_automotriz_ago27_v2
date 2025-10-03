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
      <div className="flex items-start">
        <input
          type="checkbox"
          checked={value || false}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1 flex-shrink-0"
        />
        <span className="ml-2 text-sm text-gray-700">{placeholder}</span>
      </div>
    ) : type === 'radio' ? (
      <div className="flex gap-6">
        <label className="flex items-center">
          <input
            type="radio"
            name={name}
            value="true"
            checked={value === true}
            onChange={() => onChange(true)}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
          />
          <span className="ml-2 text-sm text-gray-700">SÍ</span>
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name={name}
            value="false"
            checked={value === false}
            onChange={() => onChange(false)}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
          />
          <span className="ml-2 text-sm text-gray-700">NO</span>
        </label>
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

// E) Identificaciones Presentadas
export const IdentificationSection = ({ formData, onChange, errors }: SectionProps) => (
  <div className="space-y-6">
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <p className="text-yellow-800 text-sm">
        <strong>Nota:</strong> Proporcione el folio de al menos una identificación oficial válida.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <FormInput
        label="INE (Folio)"
        name="ine_folio"
        value={formData.ine_folio}
        onChange={(value) => onChange('ine_folio', value)}
        error={errors.ine_folio}
        placeholder="Folio de la credencial INE"
      />

      <FormInput
        label="Pasaporte (Folio)"
        name="passport_folio"
        value={formData.passport_folio}
        onChange={(value) => onChange('passport_folio', value)}
        error={errors.passport_folio}
        placeholder="Número de pasaporte"
      />

      <FormInput
        label="Cédula Profesional (Folio)"
        name="professional_license_folio"
        value={formData.professional_license_folio}
        onChange={(value) => onChange('professional_license_folio', value)}
        error={errors.professional_license_folio}
        placeholder="Número de cédula"
      />
    </div>
  </div>
)

// F) Declaraciones AML/PEP
export const DeclarationsSection = ({ formData, onChange, errors }: SectionProps) => (
  <div className="space-y-6">
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-800 text-sm">
        <strong>Importante:</strong> Las siguientes declaraciones son requeridas por ley para prevenir el lavado de dinero.
      </p>
    </div>

    {/* PEP Declaration */}
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Declaración PEP (Persona Expuesta Políticamente)</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-700 mb-3">
          ¿Usted desempeña o ha desempeñado funciones públicas destacadas en un país extranjero o en territorio nacional, considerado entre otros, a los jefes de estado o de gobierno, líderes políticos, funcionarios gubernamentales, judiciales o militares de alta jerarquía, altos ejecutivos de empresas estatales o funcionarios o miembros importantes de partidos políticos?
        </p>
        <FormInput
          label="Respuesta:"
          name="is_pep"
          type="radio"
          value={formData.is_pep}
          onChange={(value) => onChange('is_pep', value)}
          error={errors.is_pep}
        />
      </div>

      {formData.is_pep && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Cargo Desempeñado"
            name="pep_position"
            value={formData.pep_position}
            onChange={(value) => onChange('pep_position', value)}
            error={errors.pep_position}
            required={formData.is_pep}
          />

          <FormInput
            label="Período"
            name="pep_period"
            value={formData.pep_period}
            onChange={(value) => onChange('pep_period', value)}
            error={errors.pep_period}
            required={formData.is_pep}
            placeholder="Ej: 2020-2022"
          />
        </div>
      )}

      <div className="mt-6">
        <p className="text-sm text-gray-700 mb-3">
          ¿Algún familiar de usted de hasta segundo grado de consanguinidad o afinidad (cónyuge, concubina, padre, madre, hijos, hermanos, abuelos, tíos, primos, cuñados, suegros, yernos o nueras), se encuentra en el supuesto antes mencionado?
        </p>
        <FormInput
          label="Respuesta:"
          name="has_pep_relative"
          type="radio"
          value={formData.has_pep_relative}
          onChange={(value) => onChange('has_pep_relative', value)}
          error={errors.has_pep_relative}
        />

        {formData.has_pep_relative && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput
              label="Nombre del Familiar"
              name="pep_relative_name"
              value={formData.pep_relative_name}
              onChange={(value) => onChange('pep_relative_name', value)}
              error={errors.pep_relative_name}
              required={formData.has_pep_relative}
            />

            <FormInput
              label="Cargo del Familiar"
              name="pep_relative_position"
              value={formData.pep_relative_position}
              onChange={(value) => onChange('pep_relative_position', value)}
              error={errors.pep_relative_position}
              required={formData.has_pep_relative}
            />

            <FormInput
              label="Parentesco"
              name="pep_relative_relationship"
              value={formData.pep_relative_relationship}
              onChange={(value) => onChange('pep_relative_relationship', value)}
              error={errors.pep_relative_relationship}
              required={formData.has_pep_relative}
              placeholder="Ej: Padre, Hermano, etc."
            />
          </div>
        )}
      </div>
    </div>

    {/* Legal Declarations */}
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Declaraciones Bajo Protesta</h3>
      
      <div className="space-y-4">
        <FormInput
          label=""
          name="acts_for_self"
          type="checkbox"
          value={formData.acts_for_self}
          onChange={(value) => onChange('acts_for_self', value)}
          error={errors.acts_for_self}
          placeholder="Declaro bajo protesta de decir verdad que actúo por cuenta propia"
        />

        <FormInput
          label=""
          name="resources_are_legal"
          type="checkbox"
          value={formData.resources_are_legal}
          onChange={(value) => onChange('resources_are_legal', value)}
          error={errors.resources_are_legal}
          placeholder="Declaro que mis recursos provienen de actividades lícitas"
        />
      </div>
    </div>
  </div>
)

// G) Autorización SIC
export const AuthorizationSection = ({ formData, onChange, errors }: SectionProps) => (
  <div className="space-y-6">
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p className="text-blue-800 text-sm">
        <strong>Autorización para Consulta en SIC (Buró de Crédito):</strong> Esta autorización es obligatoria 
        para procesar su solicitud de crédito y tiene una vigencia de 3 años o durante la relación jurídica.
      </p>
    </div>

    <div className="border border-gray-200 rounded-lg p-4">
      <FormInput
        label=""
        name="sic_authorization"
        type="checkbox"
        value={formData.sic_authorization}
        onChange={(value) => onChange('sic_authorization', value)}
        error={errors.sic_authorization}
        placeholder="Autorizo expresamente a Financiera Incentiva para consultar mi información crediticia en las Sociedades de Información Crediticia y realizar consultas periódicas durante la vigencia del crédito"
      />

      {formData.sic_authorization && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Fecha de Autorización"
            name="sic_authorization_date"
            type="date"
            value={formData.sic_authorization_date}
            onChange={(value) => onChange('sic_authorization_date', value)}
            error={errors.sic_authorization_date}
          />

          <FormInput
            label="Lugar"
            name="sic_authorization_place"
            value={formData.sic_authorization_place}
            onChange={(value) => onChange('sic_authorization_place', value)}
            error={errors.sic_authorization_place}
            placeholder="Ciudad donde se otorga la autorización"
          />

          <FormInput
            label="Nombre del Asesor que Recaba"
            name="collecting_advisor_name"
            value={formData.collecting_advisor_name}
            onChange={(value) => onChange('collecting_advisor_name', value)}
            error={errors.collecting_advisor_name}
          />
        </div>
      )}
    </div>
  </div>
)

// H) Aviso de Privacidad
export const PrivacySection = ({ formData, onChange, errors }: SectionProps) => (
  <div className="space-y-6">
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Aviso de Privacidad</h3>
      
      <div className="text-sm text-gray-700 space-y-3 mb-6">
        <p><strong>Finalidades:</strong></p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li>Evaluación y otorgamiento del crédito solicitado</li>
          <li>Consulta en Sociedades de Información Crediticia (SIC)</li>
          <li>Prevención de fraude y lavado de dinero</li>
          <li>Administración y cobranza del crédito</li>
          <li>Publicidad y telemarketing (cuando aplique)</li>
        </ul>

        <p><strong>Transferencias:</strong> Sus datos podrán ser transferidos a terceros relacionados con el producto/servicio y/o cesión de derechos del crédito.</p>

        <p><strong>Derechos ARCO:</strong> Puede ejercer sus derechos de Acceso, Rectificación, Cancelación y Oposición contactando a nuestro departamento de datos personales.</p>

        <p><strong>Reconocimiento LRSIC:</strong> En cumplimiento del artículo 28 de la Ley para Regular las Sociedades de Información Crediticia.</p>
      </div>

      <FormInput
        label=""
        name="privacy_notice_accepted"
        type="checkbox"
        value={formData.privacy_notice_accepted}
        onChange={(value) => {
          onChange('privacy_notice_accepted', value)
          if (value) {
            onChange('privacy_notice_date', new Date().toISOString())
          }
        }}
        error={errors.privacy_notice_accepted}
        placeholder="He leído, entendido y acepto el Aviso de Privacidad de Financiera Incentiva"
      />
    </div>
  </div>
)

// I) Consentimiento Marketing
export const MarketingSection = ({ formData, onChange, errors }: SectionProps) => (
  <div className="space-y-6">
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <p className="text-green-800 text-sm">
        <strong>Opcional:</strong> Esta autorización es independiente del procesamiento de su solicitud de crédito.
      </p>
    </div>

    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Comunicaciones Comerciales</h3>
      
      <FormInput
        label=""
        name="marketing_consent"
        type="checkbox"
        value={formData.marketing_consent}
        onChange={(value) => onChange('marketing_consent', value)}
        error={errors.marketing_consent}
        placeholder="Autorizo a Financiera Incentiva para enviarme información comercial, promocional y publicitaria sobre productos y servicios financieros a través de cualquier medio de comunicación"
      />

      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Nota:</strong> Puede revocar este consentimiento en cualquier momento sin afectar 
          la prestación de los servicios financieros contratados.
        </p>
      </div>
    </div>
  </div>
)

// J) Uso Interno Fincentiva
export const InternalSection = ({ formData, onChange, errors }: SectionProps) => (
  <div className="space-y-6">
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p className="text-gray-700 text-sm">
        <strong>Sección de uso interno:</strong> Esta información será completada por el personal de Fincentiva.
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <FormInput
        label="Folio Interno"
        name="internal_folio"
        value={formData.internal_folio}
        onChange={(value) => onChange('internal_folio', value)}
        error={errors.internal_folio}
        placeholder="Asignado por sistema"
      />

      <FormInput
        label="Ejecutivo"
        name="executive_name"
        value={formData.executive_name}
        onChange={(value) => onChange('executive_name', value)}
        error={errors.executive_name}
        placeholder="Nombre del ejecutivo"
      />

      <FormInput
        label="Sucursal"
        name="branch_office"
        value={formData.branch_office}
        onChange={(value) => onChange('branch_office', value)}
        error={errors.branch_office}
        placeholder="Sucursal de origen"
      />
    </div>

    {/* Checklist de Expediente */}
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Checklist de Expediente</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          label=""
          name="has_ine"
          type="checkbox"
          value={formData.has_ine}
          onChange={(value) => onChange('has_ine', value)}
          error={errors.has_ine}
          placeholder="INE"
        />

        <FormInput
          label=""
          name="has_address_proof"
          type="checkbox"
          value={formData.has_address_proof}
          onChange={(value) => onChange('has_address_proof', value)}
          error={errors.has_address_proof}
          placeholder="Comprobante de domicilio"
        />

        <FormInput
          label=""
          name="has_payroll_receipts"
          type="checkbox"
          value={formData.has_payroll_receipts}
          onChange={(value) => onChange('has_payroll_receipts', value)}
          error={errors.has_payroll_receipts}
          placeholder="Recibos de nómina"
        />

        <FormInput
          label=""
          name="has_bank_statements"
          type="checkbox"
          value={formData.has_bank_statements}
          onChange={(value) => onChange('has_bank_statements', value)}
          error={errors.has_bank_statements}
          placeholder="Estados de cuenta"
        />

        <FormInput
          label=""
          name="has_discount_mandate"
          type="checkbox"
          value={formData.has_discount_mandate}
          onChange={(value) => onChange('has_discount_mandate', value)}
          error={errors.has_discount_mandate}
          placeholder="Mandato de descuento"
        />
      </div>
    </div>

    {/* Resultado de Entrevista */}
    <div>
      <FormInput
        label="Resultado de Entrevista Personal"
        name="interview_result"
        type="textarea"
        value={formData.interview_result}
        onChange={(value) => onChange('interview_result', value)}
        error={errors.interview_result}
        placeholder="Observaciones y resultado de la entrevista personal (campo libre)"
      />
    </div>
  </div>
)
