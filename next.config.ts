import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimización para Vercel deployment
  output: 'standalone',
  
  // Configuración para Next.js 15 + React 19
  experimental: {
    // Habilitar solo las características que necesitamos
    serverActions: {
      allowedOrigins: ['*']
    }
  },
  
  // Optimizaciones de build (swcMinify es default en Next.js 15)
  
  // Configuración de imágenes
  images: {
    domains: ['localhost'],
    unoptimized: false
  },
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
