# 🗄️ CONFIGURACIÓN DE BASE DE DATOS - SIMULADOR AUTOMOTRIZ

## 📋 Información General
- **Proyecto Supabase:** `ydnygntfkrleiseuciwq`
- **Prefijo de tablas:** `z_auto_`
- **Total de tablas:** 9
- **Funciones implementadas:** Triggers automáticos, auditoría, RLS

## 📁 Estructura de Archivos
```
simulador/
├── database_setup.sql              # Script completo (para dashboard)
├── supabase/
│   ├── config.toml                 # Configuración del proyecto
│   └── migrations/
│       ├── 001_create_simulator_tables.sql    # Tablas + datos iniciales
│       ├── 002_functions_and_triggers.sql     # Funciones y triggers
│       └── 003_security_policies.sql          # Políticas RLS
└── DATABASE_SETUP_README.md        # Este archivo
```

## 🚀 OPCIONES PARA EJECUTAR LAS MIGRACIONES

### Opción 1: Dashboard de Supabase (Recomendado)
1. Ve al [Dashboard de Supabase](https://supabase.com/dashboard)
2. Selecciona tu proyecto: `ydnygntfkrleiseuciwq`
3. Ve a **SQL Editor**
4. Copia y pega el contenido de `database_setup.sql`
5. Ejecuta el script

### Opción 2: CLI de Supabase (Local)
```bash
# 1. Instalar CLI (si no está instalada)
npm install -g supabase

# 2. Conectar al proyecto (necesitas configurar SUPABASE_ACCESS_TOKEN)
supabase link --project-ref ydnygntfkrleiseuciwq

# 3. Ejecutar migraciones
supabase db push
```

### Opción 3: Ejecutar por partes
Si prefieres ejecutar paso a paso:

1. **Paso 1:** Ejecuta `001_create_simulator_tables.sql`
2. **Paso 2:** Ejecuta `002_functions_and_triggers.sql`
3. **Paso 3:** Ejecuta `003_security_policies.sql`

## 📊 TABLAS CREADAS

### 1. `z_auto_users` - Gestión de usuarios y roles
- **Propósito:** Almacenar usuarios del sistema
- **Campos clave:** email, phone, name, user_type, agency_code

### 2. `z_auto_agencies` - Información de agencias
- **Propósito:** Datos de las agencias
- **Campos clave:** agency_code, name, contact_email, address

### 3. `z_auto_rate_tiers` - Tasas de interés
- **Propósito:** Configuración de tasas A, B, C
- **Campos clave:** tier_code, annual_rate, annual_rate_with_iva

### 4. `z_auto_quotes` - Cotizaciones
- **Propósito:** Almacenar cotizaciones realizadas
- **Campos clave:** vehicle_value, down_payment_amount, insurance_mode

### 5. `z_auto_simulations` - Simulaciones completas
- **Propósito:** Resultados de cálculos completos
- **Campos clave:** financed_amount, monthly_payment, amortization_schedule (JSON)

### 6. `z_auto_pdfs_generated` - Historial de PDFs
- **Propósito:** Rastrear PDFs generados
- **Campos clave:** file_name, file_url, generated_by_user_id

### 7. `z_auto_audit_logs` - Auditoría
- **Propósito:** Registro de cambios en el sistema
- **Campos clave:** table_name, action, old_values, new_values

### 8. `z_auto_system_config` - Configuración del sistema
- **Propósito:** Parámetros configurables
- **Campos clave:** config_key, config_value (JSON)

## 🔐 ROLES Y PERMISOS

### Cliente General (`client`)
- ✅ Solo puede usar tasa C (45%)
- ✅ Sin login requerido
- ✅ Puede calcular y descargar PDFs
- ✅ Datos básicos: teléfono, nombre, email

### Agencia (`agency`)
- ✅ Login con código de empresa + teléfono/email
- ✅ Solo puede usar tasa C (45%)
- ✅ Puede agregar datos extras del negocio
- ✅ Acceso a cotizaciones de su agencia

### Asesor Fincentiva (`asesor`)
- ✅ Acceso completo al sistema
- ✅ Puede usar todas las tasas (A, B, C)
- ✅ Puede gestionar usuarios y agencias
- ✅ Acceso a auditoría y configuración

## 🛡️ SEGURIDAD IMPLEMENTADA

### Row Level Security (RLS)
- ✅ Habilitado en todas las tablas
- ✅ Políticas específicas por rol
- ✅ Usuarios solo ven sus propios datos
- ✅ Agencias ven datos de su empresa
- ✅ Asesores tienen acceso completo

### Auditoría
- ✅ Triggers automáticos en tablas críticas
- ✅ Registro de INSERT, UPDATE, DELETE
- ✅ Historial completo de cambios

### Funciones de Seguridad
- ✅ Actualización automática de `updated_at`
- ✅ Validación de datos en triggers
- ✅ Prevención de eliminación accidental

## 📈 ÍNDICES OPTIMIZADOS

```sql
-- Índices principales
idx_z_auto_users_email
idx_z_auto_users_phone
idx_z_auto_quotes_created_at
idx_z_auto_simulations_quote_id
idx_z_auto_audit_logs_created_at
```

## 🔄 VISTAS DISPONIBLES

### `z_auto_usage_stats`
Estadísticas de uso por día y tipo de usuario

### `z_auto_quotes_complete`
Cotizaciones con información completa de usuario y agencia

### `z_auto_simulations_complete`
Simulaciones con todos los datos relacionados

## ⚙️ CONFIGURACIÓN INICIAL

### Tasas de Interés
- **A:** 36% (41.76% con IVA)
- **B:** 40% (46.40% con IVA)
- **C:** 45% (52.20% con IVA)

### Parámetros del Sistema
- **Comisión por apertura:** 3%
- **GPS mensual:** $400
- **Seguro de vida mensual:** $300
- **IVA:** 16%
- **Enganche mínimo:** 30%

## 🧪 VERIFICACIÓN DE INSTALACIÓN

Ejecuta estas consultas para verificar que todo está funcionando:

```sql
-- 1. Verificar tablas creadas
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE 'z_auto_%'
ORDER BY table_name;

-- 2. Verificar datos iniciales
SELECT * FROM z_auto_rate_tiers;
SELECT * FROM z_auto_system_config;

-- 3. Verificar políticas RLS
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename LIKE 'z_auto_%'
ORDER BY tablename, policyname;

-- 4. Verificar triggers
SELECT event_object_table, trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table LIKE 'z_auto_%'
ORDER BY event_object_table, trigger_name;
```

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error de permisos
```bash
# Configurar token de acceso
export SUPABASE_ACCESS_TOKEN="tu_token_aqui"
supabase link --project-ref ydnygntfkrleiseuciwq
```

### Error en RLS
```sql
-- Deshabilitar temporalmente RLS para debugging
ALTER TABLE nombre_tabla DISABLE ROW LEVEL SECURITY;

-- Re-habilitar después
ALTER TABLE nombre_tabla ENABLE ROW LEVEL SECURITY;
```

### Error en triggers
```sql
-- Ver triggers activos
SELECT * FROM pg_trigger WHERE tgisinternal = false;

-- Desactivar trigger problemático
ALTER TABLE nombre_tabla DISABLE TRIGGER nombre_trigger;
```

## 📞 SOPORTE

Si encuentras problemas:
1. Verifica que el proyecto `ydnygntfkrleiseuciwq` existe
2. Confirma que tienes permisos de administrador
3. Revisa los logs en el dashboard de Supabase
4. Ejecuta las consultas de verificación

---
**📅 Última actualización:** 26 enero 2025
**🔗 Proyecto:** ydnygntfkrleiseuciwq
