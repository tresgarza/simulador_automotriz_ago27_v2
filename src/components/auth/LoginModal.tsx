"use client";
import { useState } from "react";
import { X, User, Building2, Mail, Phone, Key } from "lucide-react";
import { AuthService } from "../../../lib/auth";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [userType, setUserType] = useState<'asesor' | 'agency'>('asesor');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agencyCode, setAgencyCode] = useState('');
  const [asesorCode, setAsesorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let result;
      
      if (userType === 'asesor') {
        result = await AuthService.loginAsesor(email, asesorCode);
      } else {
        result = await AuthService.loginAgency(agencyCode, phone);
      }

      if (result.error) {
        setError(result.error);
      } else {
        onLoginSuccess();
        onClose();
        // Reset form
        setEmail('');
        setPhone('');
        setAgencyCode('');
        setAsesorCode('');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Iniciar Sesión</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Type Selector */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setUserType('asesor')}
              className={`flex items-center justify-center py-3 px-4 border-2 rounded-2xl transition-all ${
                userType === 'asesor'
                  ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                  : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <User className="w-4 h-4 mr-2" />
              Asesor
            </button>
            <button
              type="button"
              onClick={() => setUserType('agency')}
              className={`flex items-center justify-center py-3 px-4 border-2 rounded-2xl transition-all ${
                userType === 'agency'
                  ? 'bg-blue-50 border-blue-400 text-blue-700'
                  : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Agencia
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {userType === 'asesor' ? (
            // Asesor Login
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Acceso
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={asesorCode}
                    onChange={(e) => setAsesorCode(e.target.value.toUpperCase())}
                    placeholder=""
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-emerald-300/50 focus:border-emerald-400"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="asesor@fincentiva.com.mx"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-emerald-300/50 focus:border-emerald-400"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            // Agency Login
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de Agencia
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={agencyCode}
                    onChange={(e) => setAgencyCode(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="81XXXXXXXX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-300/50 focus:border-blue-400"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-2xl font-medium text-white transition-all ${
              userType === 'asesor'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Iniciando sesión...
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-2xl">
          <p className="text-sm text-gray-600">
            {userType === 'asesor' 
              ? '💡 Usa el código de tu financiera y tu email corporativo para acceder'
              : '💡 Usa el código de agencia y teléfono proporcionados por Fincentiva'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

