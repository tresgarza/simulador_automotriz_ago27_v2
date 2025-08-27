"use client";
import { useState } from "react";
import Link from "next/link";
import { User, LogOut, Settings, FileText, BarChart3, ChevronDown, FileCheck } from "lucide-react";
import { useAuth } from "../../../lib/auth";

export function UserMenu() {
  const { user, isLoggedIn, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isLoggedIn || !user) return null;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    window.location.reload(); // Refresh para actualizar el estado
  };

  const getUserTypeLabel = () => {
    switch (user.user_type) {
      case 'asesor': return 'Asesor Fincentiva';
      case 'agency': return 'Agencia';
      default: return 'Usuario';
    }
  };

  const getUserTypeColor = () => {
    switch (user.user_type) {
      case 'asesor': return 'bg-emerald-100 text-emerald-700';
      case 'agency': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-4 py-2 text-white hover:bg-white/20 transition-all"
      >
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <User className="w-4 h-4" />
        </div>
        <div className="text-left hidden md:block">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs opacity-75">{getUserTypeLabel()}</div>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
            {/* User Info */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  {user.email && (
                    <div className="text-sm text-gray-500">{user.email}</div>
                  )}
                  <div className="text-sm text-gray-500">{user.phone}</div>
                  <div className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium mt-1 ${getUserTypeColor()}`}>
                    {getUserTypeLabel()}
                  </div>
                </div>
              </div>
              
              {user.agency_name && (
                <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">Agencia</div>
                  <div className="text-sm font-medium text-gray-900">{user.agency_name}</div>
                  <div className="text-xs text-gray-500">Código: {user.agency_code}</div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="p-2">
              {user.user_type === 'asesor' && (
                <>
                  <Link href="/autorizaciones" onClick={() => setIsOpen(false)}>
                    <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                      <FileCheck className="w-4 h-4" />
                      <span>Sistema de Autorizaciones</span>
                    </button>
                  </Link>
                  <Link href="#" onClick={() => setIsOpen(false)}>
                    <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                      <BarChart3 className="w-4 h-4" />
                      <span>Dashboard</span>
                    </button>
                  </Link>
                  <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Configuración</span>
                  </button>
                </>
              )}
              
              <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                <FileText className="w-4 h-4" />
                <span>Mis Cotizaciones</span>
              </button>
              
              <div className="border-t border-gray-100 my-2"></div>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

