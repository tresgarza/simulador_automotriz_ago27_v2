# Simulador de Crédito Automotriz - Financiera Incentiva

Un simulador web profesional para cotizar créditos automotrices con cálculos precisos, interfaz moderna y funcionalidades completas.

## 🚀 Características

- **Motor de Cálculo Preciso**: Implementa saldos insolutos, prorrateo por días y reglas de negocio exactas del PRD
- **Comparador A/B/C**: Visualiza diferentes niveles de tasas (36%, 40%, 45%) lado a lado
- **GPS Mensual**: Incluye renta mensual de GPS en los cálculos con IVA
- **Exportaciones**: PDF de carátula, XLSX de tabla de amortización, JSON para CRM
- **UI Profesional**: Diseño responsive con branding de Financiera Incentiva
- **Validaciones Inteligentes**: Enganche mínimo 30% con autocorrección
- **Tests Completos**: Suite de pruebas unitarias para el motor de cálculo

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + Componentes customizados
- **Formularios**: React Hook Form + Zod validation
- **PDF**: @react-pdf/renderer
- **Exportación**: XLSX (SheetJS)
- **Tests**: Vitest
- **Dev**: ESLint + Prettier

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- npm o pnpm

### Instalación

```bash
# Clonar el proyecto
cd simulador

# Instalar dependencias
npm install

# Ejecutar en desarrollo (puerto 4321)
npm run dev

# Abrir en el navegador
open http://localhost:4321
```

### Scripts Disponibles

```bash
npm run dev        # Servidor de desarrollo (puerto 4321)
npm run build      # Build de producción
npm run start      # Servidor de producción (puerto 4321)
npm run lint       # Lint con ESLint
npm test           # Tests unitarios con Vitest
npm run test:ui    # Tests con interfaz web
```

## 📋 Casos de Uso

### Cliente Final
1. Ingresa valor del vehículo, enganche y plazo
2. Selecciona seguro (contado/financiado)
3. Ve pago estimado en tiempo real
4. Descarga carátula PDF

### Asesor
1. Usa comparador A/B/C para mostrar opciones
2. Ajusta nivel de tasa según perfil del cliente
3. Exporta tabla completa en XLSX
4. Copia JSON para integrar con CRM

## 🧮 Motor de Cálculo

### Características Principales

- **TAN Fijo**: 36%, 40% o 45% anual sobre saldo insoluto
- **Comisión de Apertura**: 3% del monto financiado (+ IVA)
- **GPS Mensual**: $400 + IVA cada periodo
- **Prorrateo**: Primer pago a la próxima quincena con días reales
- **IVA**: 16% sobre intereses, comisiones y GPS

### Ejemplo de Cálculo

```
Vehículo: $405,900
Enganche: $121,770 (30%)
Plazo: 48 meses
TAN: 45%

Principal: $284,130
PMT Base: $12,850.09
Primer Pago: $13,598.22 (incluye prorrateo + GPS)
Segundo Pago: $14,952.42 (pago mensual típico)
```

## 🎨 Diseño y UX

### Branding
- **Colores**: Verde primario (#2EB872) y azul secundario (#36A3E0)
- **Gradiente**: Header con transición verde → azul
- **Tipografía**: Sans-serif moderna con alta legibilidad

### Responsive Design
- **Desktop**: Grid 2/3 + 1/3 (formulario + resumen)
- **Mobile**: Stack vertical con formulario expandido
- **Accesibilidad**: Contraste AA, foco visible, labels descriptivos

## 🧪 Testing

### Casos Cubiertos

- ✅ Cálculo PMT con fórmula francesa
- ✅ Lógica de próxima quincena (15 o último día)
- ✅ Prorrateo por días reales (ejemplo PRD)
- ✅ Diferentes niveles de tasa A/B/C
- ✅ Seguro financiado vs contado
- ✅ Balance final en cero

```bash
# Ejecutar tests
npm test

# Tests con cobertura
npm test -- --coverage

# Tests en modo watch
npm test -- --watch
```

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── api/quotes/compute/     # Endpoint de cálculo
│   └── page.tsx                # Página principal
├── components/
│   ├── form/QuoteForm.tsx      # Formulario principal
│   ├── summary/SummaryCard.tsx # Resumen y acciones
│   └── ui/                     # Componentes base
├── lib/
│   ├── math/finance.ts         # Motor de cálculo
│   ├── dates/quincena.ts       # Lógica de fechas
│   └── utils.ts                # Utilidades
├── pdf/Caratula.tsx           # Generación PDF
├── csv/export.ts              # Exportación XLSX
└── styles/theme.ts            # Configuración de marca
```

## 🔧 Configuración

### Variables de Negocio

Editar `src/lib/math/finance.ts`:

```typescript
const defaultSettings = {
  annual_nominal_rate: 0.45,    // TAN 45%
  iva: 0.16,                    // IVA 16%
  opening_fee_rate: 0.03,       // Comisión 3%
  gps_monthly: 400,             // GPS mensual
  // ...
};
```

### Branding

Editar `src/styles/theme.ts`:

```typescript
export const brand = {
  primary: "#2EB872",           // Verde corporativo
  secondary: "#36A3E0",         // Azul corporativo
  gradient: "linear-gradient(...)",
};
```

## 🚀 Despliegue

### Vercel (Recomendado)

```bash
# Conectar repositorio a Vercel
# Auto-deploy en cada push a main
```

### Docker

```bash
# Build y ejecutar con Docker
docker build -t simulador-automotriz .
docker run -p 4321:4321 simulador-automotriz

# O usando Docker Compose
docker-compose up -d
```

### Variables de Entorno

Copia `env.example` a `.env.local` y ajusta los valores:

```bash
cp env.example .env.local
```

Variables clave:
- `NODE_ENV`: production/development
- `PORT`: puerto del servidor (default: 4321)
- `NEXT_PUBLIC_DEFAULT_TAN_*`: tasas por nivel
- `NEXT_PUBLIC_BRAND_*`: colores corporativos

## 📄 API Reference

### POST `/api/quotes/compute`

Calcula una cotización completa.

**Request:**
```json
{
  "vehicle_value": 405900,
  "down_payment_amount": 121770,
  "term_months": 48,
  "insurance": { "mode": "cash", "amount": 19000 },
  "settings": {
    "annual_nominal_rate": 0.45,
    "iva": 0.16,
    "opening_fee_rate": 0.03,
    "gps_monthly": 400,
    "first_payment_rule": "next_quincena"
  },
  "as_of": "2025-08-11"
}
```

**Response:**
```json
{
  "summary": {
    "pmt_base": 12850.09,
    "pmt_total_month2": 14952.42,
    "first_payment_date": "2025-08-15",
    "principal_financed": 284130,
    "initial_outlay": 151121.72
  },
  "schedule": [...], // Tabla de amortización completa
  "inputs": {...}    // Echo de inputs con settings
}
```

## 🐛 Solución de Problemas

### Puerto en Uso
```bash
# El simulador usa puerto 4321 por defecto
# Si está ocupado, cambiar en package.json
"dev": "next dev -p 5000"
```

### Errores de Build
```bash
# Limpiar cache
rm -rf .next node_modules
npm install
npm run build
```

### Tests Fallan
```bash
# Verificar dependencias de test
npm install -D vitest @vitest/ui
npm test
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

### Estándares de Código

- **TypeScript estricto**: No usar `any`, interfaces tipadas
- **Tests obligatorios**: Cobertura >80% para funciones críticas
- **Commits semánticos**: `feat:`, `fix:`, `docs:`, etc.
- **ESLint/Prettier**: Código formateado automáticamente

## 📝 Changelog

### v1.0.0 - 2025-08-11
- ✅ Motor de cálculo completo con prorrateo
- ✅ UI profesional con comparador A/B/C
- ✅ GPS mensual integrado
- ✅ Exportaciones PDF/XLSX/JSON
- ✅ Tests unitarios completos
- ✅ README y documentación

## 📞 Soporte

- **Issues**: [GitHub Issues](link-to-issues)
- **Docs**: Este README
- **Tests**: `npm test` para validar funcionamiento

## 📄 Licencia

Copyright © 2025 Financiera Incentiva. Todos los derechos reservados.