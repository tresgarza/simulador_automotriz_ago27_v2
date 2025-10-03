"use client";
import { useState } from "react";
import { X, User, Building2, Mail, Phone, Key, MessageSquare, Shield, LogIn as LogInIcon } from "lucide-react";
import { EmailVerificationService } from "../../lib/email-verification-service";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

// Helper functions para login de asesor y agencia
async function loginAsesor(email: string, code: string) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userType: 'asesor', email, asesorCode: code })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Error al iniciar sesión' };
    }
    
      // Guardar usuario en localStorage
      if (data.user && typeof window !== 'undefined') {
        console.log('🔍 [DEBUG] loginAsesor - Guardando usuario en current_user:', data.user.name);
        // Usar 'current_user' para consistencia con useAuth
        localStorage.setItem('current_user', JSON.stringify(data.user));
        console.log('✅ [DEBUG] loginAsesor - Usuario guardado exitosamente');
        
        // Disparar evento para actualizar useAuth inmediatamente
        window.dispatchEvent(new CustomEvent('auth-changed'));
        console.log('✅ Evento auth-changed disparado después de login de asesor');
      }
    
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Error en loginAsesor:', error);
    return { error: 'Error al iniciar sesión' };
  }
}

async function loginAgency(agencyCode: string, phone: string) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userType: 'agency', agencyCode, phone })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { error: data.error || 'Error al iniciar sesión' };
    }
    
    // Guardar usuario en localStorage
    if (data.user && typeof window !== 'undefined') {
      // Usar 'current_user' para consistencia con useAuth
      localStorage.setItem('current_user', JSON.stringify(data.user));
      
      // Disparar evento para actualizar useAuth inmediatamente
      window.dispatchEvent(new CustomEvent('auth-changed'));
      console.log('✅ Evento auth-changed disparado después de login de agencia');
    }
    
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Error en loginAgency:', error);
    return { error: 'Error al iniciar sesión' };
  }
}

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const [userType, setUserType] = useState<'cliente' | 'asesor' | 'agency'>('cliente');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [agencyCode, setAgencyCode] = useState('');
  const [asesorCode, setAsesorCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'credentials' | 'verify_code'>('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // CLIENTE: Login por email con código de verificación
      if (userType === 'cliente') {
        if (step === 'credentials') {
          // Paso 1: Solicitar código por email
          // Validación básica de email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!email || !emailRegex.test(email)) {
            setError('Ingresa un email válido');
            setIsLoading(false);
            return;
          }

          const result = await EmailVerificationService.requestVerificationCode(email, 'login');
          
          if (!result.success) {
            setError(result.message);
            setIsLoading(false);
            return;
          }

          // Código enviado exitosamente
          setStep('verify_code');
          setIsLoading(false);
        } else {
          // Paso 2: Verificar código
          if (!verificationCode || verificationCode.length !== 6) {
            setError('Ingresa el código de 6 dígitos');
            setIsLoading(false);
            return;
          }

              const result = await EmailVerificationService.verifyCode(email, verificationCode, 'login');
              
              if (!result.success) {
                setError(result.message);
                setIsLoading(false);
                return;
              }

              // Verificación exitosa - guardar usuario en localStorage
              if (result.userData) {
                localStorage.setItem('current_user', JSON.stringify(result.userData));
                console.log('✅ Usuario logueado y guardado en localStorage:', result.userData.name);
              }
              
              // Disparar evento para actualizar useAuth
              window.dispatchEvent(new CustomEvent('auth-changed'));
              console.log('✅ Evento auth-changed disparado después de login de cliente');
              
              onLoginSuccess();
              onClose();
              // Reset form
              setEmail('');
              setVerificationCode('');
              setStep('credentials');
              setIsLoading(false);
        }
      } 
      // ASESOR: Login con código de acceso y email corporativo
      else if (userType === 'asesor') {
        const result = await loginAsesor(email, asesorCode);
        
        if (result.error) {
          setError(result.error);
        } else {
          onLoginSuccess();
          onClose();
          // Reset form
          setEmail('');
          setAsesorCode('');
        }
        setIsLoading(false);
      } 
      // AGENCIA: Login con código de agencia y teléfono
      else if (userType === 'agency') {
        const result = await loginAgency(agencyCode, phone);
        
        if (result.error) {
          setError(result.error);
        } else {
          onLoginSuccess();
          onClose();
          // Reset form
          setPhone('');
          setAgencyCode('');
        }
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error al iniciar sesión');
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await EmailVerificationService.requestVerificationCode(email, 'login');
      
      if (result.success) {
        setError('');
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Error al reenviar código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setVerificationCode('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {step === 'verify_code' && userType === 'cliente' ? 'Verificar Código' : 'Iniciar Sesión'}
            </h2>
            {step === 'verify_code' && userType === 'cliente' && (
              <p className="text-sm text-gray-600 mt-1">
                Código enviado a {email}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Type Selector - Solo mostrar en step 'credentials' */}
        {step === 'credentials' && (
          <div className="mb-6">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setUserType('cliente')}
                className={`flex flex-col items-center justify-center py-3 px-2 border-2 rounded-2xl transition-all ${
                  userType === 'cliente'
                    ? 'bg-green-50 border-green-400 text-green-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <Mail className="w-4 h-4 mb-1" />
                <span className="text-xs font-medium">Cliente</span>
              </button>
              <button
                type="button"
                onClick={() => setUserType('asesor')}
                className={`flex flex-col items-center justify-center py-3 px-2 border-2 rounded-2xl transition-all ${
                  userType === 'asesor'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <User className="w-4 h-4 mb-1" />
                <span className="text-xs font-medium">Asesor</span>
              </button>
              <button
                type="button"
                onClick={() => setUserType('agency')}
                className={`flex flex-col items-center justify-center py-3 px-2 border-2 rounded-2xl transition-all ${
                  userType === 'agency'
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                <Building2 className="w-4 h-4 mb-1" />
                <span className="text-xs font-medium">Agencia</span>
              </button>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* CLIENTE - Login por email */}
          {userType === 'cliente' && step === 'credentials' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                placeholder="tu@ejemplo.com"
                className={`w-full px-4 py-3 border rounded-2xl focus:ring-4 focus:ring-green-300/50 focus:border-green-400 ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
                autoFocus
                required
              />
            </div>
          )}

          {/* CLIENTE - Verificar código */}
          {userType === 'cliente' && step === 'verify_code' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                Código de Verificación
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').substring(0, 6);
                  setVerificationCode(value);
                  if (error) setError('');
                }}
                placeholder="123456"
                className={`w-full px-4 py-3 border rounded-2xl text-center text-2xl font-mono tracking-widest focus:ring-4 focus:ring-green-300/50 focus:border-green-400 ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={6}
                disabled={isLoading}
                autoFocus
                required
              />
              
              {/* Botones de código */}
              <div className="flex justify-between items-center mt-3">
                <button
                  type="button"
                  onClick={handleBackToCredentials}
                  className="text-sm text-gray-600 hover:text-gray-800"
                  disabled={isLoading}
                >
                  ← Cambiar email
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-sm text-green-600 hover:text-green-700"
                  disabled={isLoading}
                >
                  Reenviar código
                </button>
              </div>
            </div>
          )}

          {/* ASESOR - Login */}
          {userType === 'asesor' && (
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
          )}

          {/* AGENCIA - Login */}
          {userType === 'agency' && (
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
              userType === 'cliente'
                ? 'bg-green-600 hover:bg-green-700'
                : userType === 'asesor'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {userType === 'cliente' && step === 'credentials' ? 'Enviando...' : 
                 userType === 'cliente' && step === 'verify_code' ? 'Verificando...' : 
                 'Iniciando sesión...'}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                {userType === 'cliente' && step === 'credentials' ? (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar Código por Email
                  </>
                ) : userType === 'cliente' && step === 'verify_code' ? (
                  <>
                    <LogInIcon className="w-4 h-4 mr-2" />
                    Verificar Código
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </div>
            )}
          </button>
        </form>

        {/* Info */}
        {userType === 'cliente' && step === 'credentials' && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <div className="flex items-center mb-2">
              <Shield className="w-4 h-4 text-green-600 mr-2" />
              <h4 className="font-medium text-green-800">Autenticación Segura por Email</h4>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Te enviaremos un código de 6 dígitos por email</li>
              <li>• El código es válido por 10 minutos</li>
              <li>• Solo tú puedes acceder con tu email</li>
              <li>• ¡Completamente GRATIS! 💚</li>
            </ul>
          </div>
        )}

        {userType === 'cliente' && step === 'verify_code' && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-2xl">
            <div className="flex items-center mb-2">
              <Shield className="w-4 h-4 text-green-600 mr-2" />
              <h4 className="font-medium text-green-800">Verificación por Email</h4>
            </div>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Revisa tu bandeja de entrada y spam</li>
              <li>• El código expira en 10 minutos</li>
              <li>• Puedes solicitar un nuevo código si es necesario</li>
              <li>• No compartas este código con nadie</li>
            </ul>
          </div>
        )}

        {userType === 'asesor' && (
          <div className="mt-6 p-4 bg-emerald-50 rounded-2xl">
            <p className="text-sm text-emerald-700">
              💡 Usa el código de tu financiera y tu email corporativo para acceder
            </p>
          </div>
        )}

        {userType === 'agency' && (
          <div className="mt-6 p-4 bg-blue-50 rounded-2xl">
            <p className="text-sm text-blue-700">
              💡 Usa el código de agencia y teléfono proporcionados por Fincentiva
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

