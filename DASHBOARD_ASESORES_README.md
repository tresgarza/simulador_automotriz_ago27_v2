# 📊 Dashboard de Asesores - Sistema de Solicitudes de Crédito

## 🎯 **Descripción**

El Dashboard de Asesores es una herramienta completa para que los asesores de Fincentiva puedan:
- Ver todas las solicitudes de crédito enviadas
- Filtrar y buscar solicitudes específicas
- Descargar PDFs de las solicitudes
- Ver detalles completos de cada solicitud

## 🚀 **Cómo Acceder**

### **Opción 1: Navegación Principal**
1. Ve a cualquier página del sistema (http://localhost:3002)
2. En la barra de navegación superior, haz clic en **"Dashboard"**

### **Opción 2: URL Directa**
- Accede directamente a: **http://localhost:3002/dashboard-asesores**

## 📋 **Funcionalidades Principales**

### **1. Vista General**
- **Contador total** de solicitudes en la parte superior
- **Tabla completa** con todas las solicitudes ordenadas por fecha (más recientes primero)
- **Estados visuales** con colores distintivos

### **2. Filtros de Búsqueda**
- **🔍 Búsqueda por texto**: Folio, nombre del cliente o email
- **📊 Filtro por estado**: Todos, Enviadas, En Revisión, Aprobadas, Rechazadas, Borradores
- **📅 Filtro por fecha**: Seleccionar fecha específica
- **🔄 Botón Actualizar**: Para refrescar los datos

### **3. Información Mostrada**
Para cada solicitud se muestra:
- **Folio**: Número único secuencial (SOL-2025-XXXX)
- **Cliente**: Nombre completo y email
- **Producto**: Tipo de crédito y plazo
- **Monto**: Cantidad solicitada formateada
- **Estado**: Badge con color según el estado
- **Fecha**: Fecha y hora de creación

### **4. Acciones Disponibles**
- **👁️ Ver**: Abre modal con detalles completos de la solicitud
- **📄 PDF**: Descarga inmediata del PDF de la solicitud

## 🔍 **Detalles de Solicitud**

Al hacer clic en **"Ver"**, se abre un modal con información completa:

### **Información del Cliente**
- Nombre completo, CURP, RFC
- Email, teléfono, fecha de nacimiento

### **Información del Crédito**
- Producto, monto, plazo, periodicidad
- Uso de recursos, estado actual

### **Información Laboral**
- Empresa, puesto, antigüedad
- Ingreso mensual

### **Domicilio**
- Dirección completa
- Tipo de vivienda

## 📄 **Descarga de PDFs**

### **Desde la Tabla**
1. Localiza la solicitud deseada
2. Haz clic en el botón **"PDF"** (verde)
3. El PDF se descarga automáticamente

### **Desde el Modal de Detalles**
1. Abre los detalles de una solicitud
2. Haz clic en **"Descargar PDF"** en la parte inferior
3. El PDF se genera y descarga inmediatamente

### **Características del PDF**
- **Formato profesional** con colores Fincentiva
- **Folio único** en el encabezado
- **Información completa** de todas las secciones (A-J)
- **Diseño compacto** optimizado para impresión
- **Nombre del archivo**: `Solicitud_Credito_[FOLIO]_[FECHA].pdf`

## 🎨 **Estados de Solicitudes**

| Estado | Color | Descripción |
|--------|-------|-------------|
| **Enviada** | 🔵 Azul | Solicitud completada y enviada |
| **En Revisión** | 🟡 Amarillo | Siendo evaluada por el equipo |
| **Aprobada** | 🟢 Verde | Crédito aprobado |
| **Rechazada** | 🔴 Rojo | Crédito no aprobado |
| **Borrador** | ⚪ Gris | Solicitud incompleta |

## 🔄 **Actualización de Datos**

- **Automática**: La página se actualiza automáticamente al cargar
- **Manual**: Usa el botón **"Actualizar"** para refrescar los datos
- **Tiempo real**: Los nuevos registros aparecen inmediatamente

## 📱 **Diseño Responsivo**

El dashboard funciona perfectamente en:
- **💻 Desktop**: Vista completa con tabla expandida
- **📱 Mobile**: Vista adaptada con información condensada
- **📊 Tablet**: Vista intermedia optimizada

## 🛠️ **Solución de Problemas**

### **No aparecen solicitudes**
1. Verifica que hay solicitudes creadas en el sistema
2. Revisa los filtros aplicados
3. Haz clic en "Actualizar"

### **Error al descargar PDF**
1. Verifica que la solicitud tiene datos completos
2. Revisa la consola del navegador para errores
3. Intenta nuevamente

### **Filtros no funcionan**
1. Limpia los filtros y vuelve a aplicarlos
2. Actualiza la página
3. Verifica la conexión a internet

## 🎯 **Casos de Uso Típicos**

### **Revisar Solicitudes del Día**
1. Usa el filtro de fecha para hoy
2. Revisa las solicitudes "Enviadas"
3. Cambia estados según evaluación

### **Buscar Solicitud Específica**
1. Usa la búsqueda por folio o nombre
2. Abre los detalles para revisar
3. Descarga PDF si es necesario

### **Generar Reportes**
1. Aplica filtros según criterios
2. Descarga PDFs de solicitudes relevantes
3. Usa la información para análisis

## 📞 **Soporte**

Para soporte técnico o preguntas sobre el dashboard:
- Contacta al equipo de desarrollo
- Revisa los logs del servidor para errores técnicos
- Verifica la conexión a la base de datos

---

**✅ Sistema completamente funcional y listo para uso en producción**



