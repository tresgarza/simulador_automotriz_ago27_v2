"use client";
import { useAuth } from "../../../lib/auth";
import { useEffect, useState } from "react";

interface SessionGuardProps {
  children: React.ReactNode;
  requiredRole?: 'asesor' | 'agency' | 'client';
  fallback?: React.ReactNode;
}

export function SessionGuard({ children, requiredRole, fallback }: SessionGuardProps) {
  const { user, isLoggedIn, isVerified, isAsesor, isAgency, isClient } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Dar tiempo para que la verificación inicial se complete
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Mostrar loading mientras se verifica la sesión
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-600">Verificando sesión...</span>
      </div>
    );
  }

  // Si se requiere un rol específico, verificar
  if (requiredRole) {
    const hasRequiredRole = 
      (requiredRole === 'asesor' && isAsesor) ||
      (requiredRole === 'agency' && isAgency) ||
      (requiredRole === 'client' && isClient);

    if (!hasRequiredRole) {
      return fallback || (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">
            No tienes permisos para acceder a esta sección.
            {requiredRole === 'asesor' && ' Solo los asesores pueden acceder.'}
            {requiredRole === 'agency' && ' Solo las agencias pueden acceder.'}
            {requiredRole === 'client' && ' Esta sección es solo para clientes.'}
          </p>
        </div>
      );
    }
  }

  // Si hay usuario pero no está verificado, mostrar advertencia
  if (isLoggedIn && !isVerified) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-3"></div>
          <p className="text-yellow-800 text-sm">
            Verificando sesión con el servidor...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
