import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Deshabilitar ESLint completamente durante el build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Deshabilitar verificación de TypeScript durante el build
    ignoreBuildErrors: true,
  },
  experimental: {
    // Deshabilitar verificaciones adicionales
    typedRoutes: false,
  },
  // Configuración adicional para Vercel
  env: {
    SKIP_BUILD_STATIC_GENERATION: 'true'
  }
};

export default nextConfig;
