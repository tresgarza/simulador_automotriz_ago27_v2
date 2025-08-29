import Link from 'next/link';

export default function PoliticaPrivacidad() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">
            Política de Privacidad
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Financiera Incentiva
            </h2>
            
            <p className="mb-6 text-gray-700">
              En Financiera Incentiva, respetamos y protegemos la privacidad de nuestros usuarios. 
              Esta política describe cómo recopilamos, utilizamos y protegemos su información personal.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Información que Recopilamos
            </h3>
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li>Nombre completo</li>
              <li>Número de teléfono</li>
              <li>Correo electrónico</li>
              <li>Información del vehículo de interés</li>
              <li>Datos de la simulación de crédito</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Uso de la Información
            </h3>
            <p className="mb-6 text-gray-700">
              Utilizamos su información para:
            </p>
            <ul className="list-disc pl-6 mb-6 text-gray-700">
              <li>Procesar su solicitud de simulación de crédito</li>
              <li>Contactarlo con información relevante sobre nuestros productos</li>
              <li>Mejorar nuestros servicios</li>
              <li>Cumplir con requisitos legales y regulatorios</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Protección de Datos
            </h3>
            <p className="mb-6 text-gray-700">
              Implementamos medidas de seguridad técnicas y organizativas para proteger 
              su información personal contra acceso no autorizado, alteración, divulgación o destrucción.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Sus Derechos
            </h3>
            <p className="mb-6 text-gray-700">
              Usted tiene derecho a acceder, rectificar, cancelar u oponerse al tratamiento 
              de sus datos personales. Para ejercer estos derechos, puede contactarnos.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Contacto
            </h3>
            <p className="text-gray-700">
              Para cualquier consulta sobre esta política de privacidad, puede contactarnos en:
            </p>
            <p className="text-gray-700 mt-2">
              <strong>Email:</strong> privacidad@fincentiva.com.mx<br/>
              <strong>Teléfono:</strong> (81) 1234-5678
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors"
            >
              ← Volver al Simulador
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

