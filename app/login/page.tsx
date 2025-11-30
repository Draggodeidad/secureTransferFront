"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert } from "@/components/Alert";
import { Shield, Key, Clock } from "lucide-react";

export default function LoginPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user && !loading) {
      // Verificar si hay una URL de redirección
      const redirectUrl =
        searchParams.get("redirect") ||
        localStorage.getItem("redirectAfterLogin");

      if (redirectUrl) {
        // Limpiar el localStorage
        localStorage.removeItem("redirectAfterLogin");
        // Redirigir a la URL guardada
        router.push(redirectUrl);
      } else {
        // Redirigir a la página de upload por defecto
        router.push("/upload");
      }
    }
  }, [user, loading, router, searchParams]);

  const handleSignIn = async () => {
    setError("");
    setIsLoggingIn(true);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Error al iniciar sesión:", err);
      setError(err.message || "Error al iniciar sesión con Google");
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center fresh-mint-bg px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-3xl mb-6 shadow-md">
            <Shield className="w-10 h-10 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-5xl font-semibold text-gray-900 mb-3 tracking-tight">
            SecureTransfer
          </h1>
          <p className="text-lg text-gray-600 font-light">
            Transferencia segura con cifrado end-to-end
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center tracking-tight">
            Iniciar Sesión
          </h2>

          {/* Error Alert */}
          {error && <Alert type="error" message={error} className="mb-6" />}

          {/* Botón de Google */}
          <button
            onClick={handleSignIn}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 px-6 py-4 rounded-2xl hover:bg-gray-50 hover:border-emerald-600 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
          >
            {isLoggingIn ? (
              <>
                <LoadingSpinner size="sm" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continuar con Google</span>
              </>
            )}
          </button>

          {/* Información adicional - Sin emojis */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Shield
                    className="w-4 h-4 text-emerald-600"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Cifrado end-to-end
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 font-light">
                    Solo el receptor puede descifrar tus archivos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Key className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Claves automáticas
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 font-light">
                    Generamos tus claves de forma segura en tu navegador
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-emerald-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Privado y seguro
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 font-light">
                    Tus archivos se eliminan automáticamente después de 24 horas
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8 font-light">
          Al iniciar sesión, aceptas nuestros términos de servicio
        </p>
      </div>
    </div>
  );
}
