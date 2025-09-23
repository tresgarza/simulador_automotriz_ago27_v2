"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../../lib/auth";
import { SimulationService, SimulationWithQuote } from "../../../lib/simulation-service";
import { formatMXN } from "../../lib/utils";
import { 
  Search, 
  Filter, 
  FileText, 
  Download, 
  Edit2, 
  Trash2, 
  Calendar,
  Car,
  User,
  Phone,
  Mail,
  ArrowLeft,
  Eye
} from "lucide-react";
import Link from "next/link";
import { generateProfessionalPDF } from "../../components/pdf/ProfessionalPDFGenerator";

interface Quote {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_value: number;
  created_at: string;
  user_id: string;
  simulations?: SimulationWithQuote[];
}

export default function MisCotizacionesPage() {
  const { user, isLoggedIn } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    if (isLoggedIn && user) {
      loadQuotes();
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    filterQuotes();
  }, [searchTerm, quotes]);

  const loadQuotes = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Obtener simulaciones del usuario que incluyen las cotizaciones
      const simulations = await SimulationService.getUserSimulations(user.id, user.user_type);
      
      // Agrupar por cotización
      const quotesMap = new Map<string, Quote>();
      
      simulations.forEach(simulation => {
        if (simulation.quote) {
          const quoteId = simulation.quote.id;
          
          if (!quotesMap.has(quoteId)) {
            quotesMap.set(quoteId, {
              id: simulation.quote.id,
              client_name: simulation.quote.client_name,
              client_email: simulation.quote.client_email,
              client_phone: simulation.quote.client_phone,
              vehicle_brand: simulation.quote.vehicle_brand,
              vehicle_model: simulation.quote.vehicle_model,
              vehicle_year: simulation.quote.vehicle_year,
              vehicle_value: simulation.quote.vehicle_value,
              created_at: simulation.quote.created_at,
              user_id: simulation.quote.user_id,
              simulations: []
            });
          }
          
          quotesMap.get(quoteId)!.simulations!.push(simulation);
        }
      });
      
      const quotesArray = Array.from(quotesMap.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setQuotes(quotesArray);
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterQuotes = () => {
    if (!searchTerm.trim()) {
      setFilteredQuotes(quotes);
      return;
    }

    const filtered = quotes.filter(quote => 
      quote.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.vehicle_brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.vehicle_model.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredQuotes(filtered);
  };

  const handleViewDetails = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowDetails(true);
  };

  const handleGeneratePDF = async (quote: Quote) => {
    if (!quote.simulations || quote.simulations.length === 0) {
      alert('No hay simulaciones disponibles para generar PDF');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      // Organizar simulaciones por tier y término
      const matrixResult = {
        A: {} as any,
        B: {} as any,
        C: {} as any
      };

      quote.simulations.forEach(sim => {
        if (!matrixResult[sim.tier_code as keyof typeof matrixResult]) {
          matrixResult[sim.tier_code as keyof typeof matrixResult] = {};
        }
        matrixResult[sim.tier_code as keyof typeof matrixResult][sim.term_months] = {
          pmt_total_month2: sim.pmt_total_month2,
          monthly_payment: sim.monthly_payment,
          // Agregar otros campos necesarios para el PDF
        };
      });

      const formData = {
        clientName: quote.client_name,
        clientEmail: quote.client_email,
        clientPhone: quote.client_phone,
        vehicleBrand: quote.vehicle_brand,
        vehicleModel: quote.vehicle_model,
        vehicleYear: quote.vehicle_year,
        vehicleValue: quote.vehicle_value,
      };

      // Generar PDF usando el componente existente
      await generateProfessionalPDF(matrixResult);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Restringido</h2>
          <p className="text-gray-600 mb-6">Debes iniciar sesión para ver tus cotizaciones.</p>
          <Link href="/" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
            Volver al Simulador
          </Link>
        </div>
      </div>
    );
  }

  if (showDetails && selectedQuote) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setShowDetails(false)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Mis Cotizaciones
            </button>
            <div className="flex space-x-3">
              <button
                onClick={() => handleGeneratePDF(selectedQuote)}
                disabled={isGeneratingPDF}
                className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingPDF ? 'Generando...' : 'Descargar PDF'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Details Content */}
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Detalles de Cotización
            </h1>

            {/* Client Info */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Información del Cliente
                </h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Nombre:</span> {selectedQuote.client_name}</p>
                  <p className="flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    {selectedQuote.client_email}
                  </p>
                  <p className="flex items-center">
                    <Phone className="w-4 h-4 mr-2" />
                    {selectedQuote.client_phone}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Car className="w-5 h-5 mr-2" />
                  Información del Vehículo
                </h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Marca:</span> {selectedQuote.vehicle_brand}</p>
                  <p><span className="font-medium">Modelo:</span> {selectedQuote.vehicle_model}</p>
                  <p><span className="font-medium">Año:</span> {selectedQuote.vehicle_year}</p>
                  <p><span className="font-medium">Valor:</span> {formatMXN(selectedQuote.vehicle_value)}</p>
                </div>
              </div>
            </div>

            {/* Simulations */}
            {selectedQuote.simulations && selectedQuote.simulations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulaciones Disponibles</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plazo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pago Mensual
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total a Pagar
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedQuote.simulations.map((simulation) => (
                        <tr key={simulation.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              simulation.tier_code === 'A' ? 'bg-green-100 text-green-800' :
                              simulation.tier_code === 'B' ? 'bg-blue-100 text-blue-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              Plan {simulation.tier_code}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {simulation.term_months} meses
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatMXN(simulation.monthly_payment)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatMXN(simulation.pmt_total_month2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Cotizaciones</h1>
            <p className="text-gray-600">Historial de cotizaciones generadas</p>
          </div>
          <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Simulador
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por cliente, email o vehículo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="text-sm text-gray-600">
              {filteredQuotes.length} cotizaciones encontradas
            </div>
          </div>
        </div>

        {/* Quotes List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando cotizaciones...</p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron cotizaciones' : 'No tienes cotizaciones aún'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Comienza generando tu primera cotización en el simulador'
              }
            </p>
            <Link href="/" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
              Ir al Simulador
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredQuotes.map((quote) => (
              <div key={quote.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1 grid md:grid-cols-3 gap-4 mb-4 lg:mb-0">
                    {/* Client Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900">{quote.client_name}</h3>
                      <p className="text-sm text-gray-600">{quote.client_email}</p>
                      <p className="text-sm text-gray-600">{quote.client_phone}</p>
                    </div>

                    {/* Vehicle Info */}
                    <div>
                      <p className="font-medium text-gray-900">
                        {quote.vehicle_brand} {quote.vehicle_model}
                      </p>
                      <p className="text-sm text-gray-600">Año {quote.vehicle_year}</p>
                      <p className="text-sm font-medium text-emerald-600">
                        {formatMXN(quote.vehicle_value)}
                      </p>
                    </div>

                    {/* Date and Stats */}
                    <div>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(quote.created_at).toLocaleDateString('es-MX')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {quote.simulations?.length || 0} simulaciones
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleViewDetails(quote)}
                      className="flex items-center space-x-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Ver</span>
                    </button>
                    <button
                      onClick={() => handleGeneratePDF(quote)}
                      disabled={isGeneratingPDF}
                      className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}




