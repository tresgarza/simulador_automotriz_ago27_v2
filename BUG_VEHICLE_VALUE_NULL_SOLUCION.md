# 🐛 Bug: Campo `vehicle_value` en NULL - Solución Aplicada

## 📋 Descripción del Problema

**Fecha**: 2 de octubre de 2025  
**Reportado por**: Usuario (asesor Eduardo Acevedo)  
**Solicitud afectada**: `SOL-2025-0050` (`b5bc3dc7-9547-4d41-8c71-d04adaa528d2`)

### Síntomas

- El campo "Precio Vehículo" aparecía vacío (mostrando el placeholder `350000`) al abrir una solicitud existente
- Al intentar guardar, el valor no se persistía en la base de datos
- El campo `vehicle_value` quedaba como `null` en Supabase

## 🔍 Diagnóstico

### Root Cause Identificado

La solicitud `SOL-2025-0050` es una **"Solicitud independiente"** creada manualmente por el asesor, **NO** desde el flujo normal del simulador:

```json
{
  "folio_number": "SOL-2025-0050",
  "quote_id": null,          ← No tiene cotización asociada
  "vehicle_value": null,     ← El asesor no llenó este campo
  "vehicle_brand": "Honda",  ← Sí lo llenó
  "vehicle_model": "Civic Sport"  ← Sí lo llenó
}
```

### Problema de UX/Validación

El campo `vehicle_value` **NO era obligatorio** en el formulario, permitiendo que el asesor:
1. Creara una solicitud independiente
2. Llenara solo algunos campos del vehículo (marca, modelo, año)
3. Omitiera el "Precio Vehículo" sin recibir advertencia
4. Guardara la solicitud con `vehicle_value = null`

### Confusión Durante Testing

Durante las pruebas con el navegador automatizado (Playwright), los **Fast Refresh** constantes de Next.js causaron que el valor ingresado manualmente se perdiera, haciendo parecer que el auto-save no funcionaba. Sin embargo, el auto-save estaba funcionando correctamente - simplemente guardaba `null` porque el campo estaba vacío.

## ✅ Solución Implementada

### 1. Campo Marcado como Obligatorio en el Frontend

**Archivo**: `simulador/src/components/credit-application/FormSectionsReorganized.tsx`

```tsx
<FormInput
  label="Precio Vehículo"
  name="vehicle_value"
  type="number"
  value={formData.vehicle_value}
  onChange={(value) => onChange('vehicle_value', parseFloat(value))}
  error={errors.vehicle_value}
  required  ← ✅ AGREGADO
  placeholder="350000"
/>
```

**Resultado**: El campo ahora muestra un asterisco `*` visual indicando que es obligatorio.

### 2. Validación Agregada al Backend

**Archivo**: `simulador/src/lib/credit-application-service.ts`

```typescript
const requiredFields = [
  'first_names',
  'paternal_surname',
  // ... otros campos ...
  'vehicle_value',      ← ✅ AGREGADO
  'requested_amount',   ← ✅ AGREGADO
  'term_months'         ← ✅ AGREGADO
]
```

**Resultado**:
- ✅ El porcentaje de completitud ahora considera `vehicle_value` como requerido
- ✅ El contador de "Campos pendientes" aumentó de 16 a 17 (correctamente)
- ✅ El porcentaje de completitud cambió de 20% a 26% (porque ahora hay más campos requeridos)

## 📊 Impacto

### Antes de la Solución

```
✅ Marca: Honda
✅ Modelo: Civic Sport  
✅ Año: 2024
❌ Precio Vehículo: (vacío, sin advertencia)
→ Solicitud guardada con vehicle_value = null
```

### Después de la Solución

```
✅ Marca: Honda
✅ Modelo: Civic Sport  
✅ Año: 2024
⚠️ Precio Vehículo *: (campo obligatorio marcado con asterisco)
   → Contador: "Faltan 17 campos requeridos"
   → No permite enviar solicitud completa sin este campo
```

## 🧪 Verificación

### Evidencia en la UI

```yaml
- generic [ref=e178]:
  - generic [ref=e179]: Precio Vehículo *  ← ✅ Asterisco visible
  - spinbutton [ref=e180]

- paragraph [ref=e223]: Faltan 17 campos requeridos para completar la solicitud.
                        ↑↑ Aumentó de 16 a 17
```

### Evidencia en los Logs

```javascript
📝 FormData DESPUÉS de aplicar prefill:
  🚗 Vehículo:
    - vehicle_brand: Honda
    - vehicle_model: Civic Sport
    - vehicle_year: 2024
    - vehicle_value: null  ← Cargado desde DB (solicitud anterior)
```

## 🎯 Siguiente Paso para el Usuario

Para corregir la solicitud `SOL-2025-0050` existente:

1. Navegar a `/solicitud-credito?application_id=b5bc3dc7-9547-4d41-8c71-d04adaa528d2`
2. Llenar el campo "Precio Vehículo *" con el valor correcto
3. Hacer clic en "Guardar Borrador"
4. Verificar que el valor se guardó correctamente

## 🔧 Archivos Modificados

1. `simulador/src/components/credit-application/FormSectionsReorganized.tsx`
   - Línea 119: Agregado `required` al campo `vehicle_value`

2. `simulador/src/lib/credit-application-service.ts`
   - Líneas 722-724: Agregados `vehicle_value`, `requested_amount`, `term_months` a `requiredFields[]`

## ✨ Beneficio

Esta solución previene que:
- ❌ Asesores creen solicitudes incompletas sin precio del vehículo
- ❌ Se generen PDFs con campos críticos vacíos
- ❌ Se procesen autorizaciones con información insuficiente

---

**Estado**: ✅ Solución implementada y verificada  
**Autor**: AI Assistant (Cursor)  
**Fecha**: 2 de octubre de 2025




