"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { LoadingPage, LoadingSpinner } from "@/components/LoadingSpinner";
import { FileDropZone } from "@/components/FileDropZone";
import { Alert } from "@/components/Alert";
import {
  uploadFile,
  getUserPublicKeyByEmail,
  getUserPublicKeyById,
} from "@/lib/api";
import {
  Copy,
  Check,
  Key,
  Upload as UploadIcon,
  Shield,
  Clock,
  Sparkles,
  Search,
} from "lucide-react";

interface UploadResult {
  package_id: string;
  filename: string;
  size: number;
  encryptedSize: number;
  downloadUrl: string;
  expiresAt: string;
}

export default function UploadPage() {
  const { user, session, loading, publicKey } = useAuth();
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [recipientPublicKey, setRecipientPublicKey] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [isSearchingKey, setIsSearchingKey] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [keyFoundByEmail, setKeyFoundByEmail] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError("");
    setResult(null);
  };

  const handleClearFile = () => {
    setFile(null);
    setError("");
  };

  const handleSearchPublicKey = async () => {
    if (!recipientEmail.trim()) {
      setSearchError("Por favor ingresa un email");
      return;
    }

    setIsSearchingKey(true);
    setSearchError("");

    try {
      const publicKey = await getUserPublicKeyByEmail(recipientEmail.trim());
      setRecipientPublicKey(publicKey);
      setSearchError("");
      setKeyFoundByEmail(true);
      setShowManualInput(false);
      console.log("✅ Clave pública encontrada para:", recipientEmail);
    } catch (err: any) {
      console.error("Error al buscar clave pública:", err);
      setSearchError(
        err.message || "No se encontró clave pública para este usuario"
      );
      setRecipientPublicKey("");
      setKeyFoundByEmail(false);
    } finally {
      setIsSearchingKey(false);
    }
  };

  const handleClearRecipient = () => {
    setRecipientEmail("");
    setRecipientPublicKey("");
    setKeyFoundByEmail(false);
    setShowManualInput(false);
    setSearchError("");
  };

  const handleToggleManualInput = () => {
    setShowManualInput(!showManualInput);
    if (!showManualInput) {
      setKeyFoundByEmail(false);
      setRecipientEmail("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Por favor selecciona un archivo");
      return;
    }

    if (!recipientPublicKey.trim()) {
      setError("Por favor proporciona la clave pública del receptor");
      return;
    }

    if (!session?.access_token) {
      setError("No se encontró una sesión válida");
      return;
    }

    if (!user?.id) {
      setError("No se pudo obtener el ID del usuario");
      return;
    }

    setIsUploading(true);
    setError("");
    setUploadProgress(0);

    try {
      // Simular progreso (en producción, usar XMLHttpRequest o similar)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      console.log("📤 Subiendo archivo con userId:", user.id);

      const response = await uploadFile(
        file,
        recipientPublicKey,
        user.id, // ✅ NUEVO: Enviar userId
        session.access_token
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Debug: ver la respuesta completa
      console.log("Respuesta del backend:", response);
      console.log("Package ID:", response.package_id);
      console.log("✅ Archivo guardado en Supabase");

      setResult(response);
      setFile(null);
      setRecipientPublicKey("");
    } catch (err: any) {
      console.error("Error al subir archivo:", err);
      setError(err.message || "Error al subir el archivo");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCopyLink = () => {
    if (!result) return;

    const downloadUrl = `${window.location.origin}/download/${result.package_id}`;
    console.log("Copiando URL:", downloadUrl);
    console.log("Package ID:", result.package_id);

    navigator.clipboard.writeText(downloadUrl);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleCopyOwnKey = () => {
    if (!publicKey) return;
    navigator.clipboard.writeText(publicKey);
  };

  if (loading) {
    return <LoadingPage />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Hero Section - Título con mucho whitespace */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-600 shadow-md mb-6">
            <UploadIcon className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-semibold text-gray-900 tracking-tight mb-4">
            Envía archivos seguros
          </h1>
          <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto">
            Cifrado end-to-end automático. Solo el receptor podrá descifrarlo.
          </p>
        </div>

        {/* Tu clave pública - Card flotante */}
        {publicKey && (
          <div className="mb-8 glass-card rounded-3xl p-8 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md flex-shrink-0">
                <Key className="w-6 h-6 text-white" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-gray-900 mb-2 tracking-tight">
                  Tu Clave Pública
                </h3>
                <p className="text-sm text-gray-500 mb-4 font-light">
                  Comparte esta clave con quien quiera enviarte archivos
                </p>
                <div className="bg-gray-50/50 backdrop-blur-sm rounded-2xl border border-gray-100 p-4">
                  <code className="text-xs text-gray-700 break-all font-mono">
                    {publicKey.substring(0, 80)}...
                  </code>
                </div>
              </div>
              <button
                onClick={handleCopyOwnKey}
                className="px-5 py-2.5 text-sm bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all duration-300 ease-out flex-shrink-0 hover:shadow-md hover:scale-105"
              >
                Copiar
              </button>
            </div>
          </div>
        )}

        {/* Tarjeta Central Flotante - Hero Component */}
        <div className="glass-card rounded-3xl p-12 shadow-2xl mb-8">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Drop Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-6 tracking-tight">
                Selecciona el archivo
              </label>
              <FileDropZone
                onFileSelect={handleFileSelect}
                selectedFile={file}
                onClear={handleClearFile}
              />
            </div>

            {/* Clave pública del receptor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-6 tracking-tight">
                Buscar receptor por email
              </label>
              <div className="flex gap-3 mb-4">
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="ejemplo@email.com"
                  className="flex-1 px-6 py-4 border border-gray-200 rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 text-sm bg-white transition-all duration-300"
                  disabled={isUploading || isSearchingKey || keyFoundByEmail}
                />
                {keyFoundByEmail ? (
                  <button
                    type="button"
                    onClick={handleClearRecipient}
                    className="px-6 py-4 bg-gray-500 text-white rounded-3xl hover:bg-gray-600 transition-all duration-300 ease-out flex items-center gap-2 hover:shadow-md hover:scale-105"
                  >
                    <span>Cambiar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSearchPublicKey}
                    disabled={
                      isUploading || isSearchingKey || !recipientEmail.trim()
                    }
                    className="px-6 py-4 bg-emerald-600 text-white rounded-3xl hover:bg-emerald-700 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all duration-300 ease-out flex items-center gap-2 hover:shadow-md hover:scale-105 disabled:hover:scale-100"
                  >
                    {isSearchingKey ? (
                      <>
                        <LoadingSpinner
                          size="sm"
                          className="border-white border-t-transparent"
                        />
                        <span>Buscando...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5" strokeWidth={2} />
                        <span>Buscar</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {searchError && (
                <Alert type="error" message={searchError} className="mb-4" />
              )}

              {/* Mensaje de éxito cuando se encuentra la clave */}
              {keyFoundByEmail && !showManualInput && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">
                      Clave pública encontrada para {recipientEmail}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 font-light">
                    El archivo será cifrado para este receptor
                  </p>
                  <button
                    type="button"
                    onClick={handleToggleManualInput}
                    className="text-xs text-emerald-600 hover:text-emerald-700 underline mt-2"
                  >
                    Ver/editar clave manualmente
                  </button>
                </div>
              )}

              {/* Mostrar input manual solo si no se encontró por email o si se solicita */}
              {(!keyFoundByEmail || showManualInput) && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700 tracking-tight">
                      {keyFoundByEmail
                        ? "Editar clave pública manualmente"
                        : "O pega la clave pública manualmente"}
                    </label>
                    {showManualInput && (
                      <button
                        type="button"
                        onClick={handleToggleManualInput}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Ocultar
                      </button>
                    )}
                  </div>
                  <textarea
                    value={recipientPublicKey}
                    onChange={(e) => {
                      setRecipientPublicKey(e.target.value);
                      setKeyFoundByEmail(false);
                    }}
                    placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                    rows={6}
                    className="block w-full px-6 py-4 border border-gray-200 rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-mono text-xs bg-white transition-all duration-300"
                    disabled={isUploading}
                  />
                  <p className="text-xs text-gray-400 mt-4 font-light">
                    {recipientPublicKey
                      ? "✅ Clave pública cargada"
                      : "Busca por email o pega la clave pública RSA del receptor en formato PEM"}
                  </p>
                </>
              )}
            </div>

            {/* Barra de progreso */}
            {isUploading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-light">
                    Cifrando y subiendo archivo...
                  </span>
                  <span className="text-gray-900 font-semibold">
                    {uploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Botón de envío */}
            <button
              type="submit"
              disabled={isUploading || !file || !recipientPublicKey.trim()}
              className="w-full bg-emerald-600 text-white py-5 px-6 rounded-3xl hover:bg-emerald-700 hover:shadow-lg disabled:bg-gray-200 disabled:cursor-not-allowed font-medium transition-all duration-300 ease-out flex items-center justify-center gap-3 hover:scale-[1.02] disabled:hover:scale-100 disabled:shadow-none"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner
                    size="sm"
                    className="border-white border-t-transparent"
                  />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <UploadIcon className="w-5 h-5" strokeWidth={2} />
                  <span>Enviar archivo</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && <Alert type="error" message={error} className="mb-8" />}

        {/* Resultado exitoso */}
        {result && (
          <div className="glass-card rounded-3xl p-10 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg mb-4">
                <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2 tracking-tight">
                Archivo enviado exitosamente
              </h3>
              <p className="text-gray-500 font-light">
                El archivo ha sido cifrado y subido correctamente
              </p>
            </div>

            <div className="space-y-6">
              {/* Información del archivo */}
              <div className="bg-gray-50/50 backdrop-blur-sm rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4 tracking-tight">
                  Información del archivo
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-light">Archivo:</span>
                    <span className="font-medium text-gray-900">
                      {result.filename}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-light">Tamaño:</span>
                    <span className="font-medium text-gray-900">
                      {(result.size / 1024).toFixed(2)} KB
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-light">Expira:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(result.expiresAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Link de descarga */}
              <div className="bg-gradient-to-br from-[#fff5f2] to-[#ffe8e0] rounded-2xl p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#ff6b35]" />
                  Comparte este link con el receptor
                </h4>
                <div className="flex gap-3">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/download/${result.package_id}`}
                    className="flex-1 px-4 py-3 text-sm bg-white/80 backdrop-blur-sm border border-[#ff6b35]/20 rounded-2xl font-mono"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-6 py-3 rounded-2xl font-medium transition-all duration-300 ease-out flex items-center gap-2 ${
                      copied
                        ? "bg-emerald-700 text-white shadow-md"
                        : "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md hover:scale-105"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información adicional con iconos */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-8 glass-card rounded-3xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 mb-4">
              <Shield className="w-6 h-6 text-emerald-600" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-gray-700 font-light">
              Tu archivo será cifrado automáticamente antes de subirlo
            </p>
          </div>
          <div className="text-center p-8 glass-card rounded-3xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 mb-4">
              <Key className="w-6 h-6 text-emerald-600" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-gray-700 font-light">
              Solo el receptor con la clave privada correspondiente podrá
              descifrarlo
            </p>
          </div>
          <div className="text-center p-8 glass-card rounded-3xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 mb-4">
              <Clock className="w-6 h-6 text-emerald-600" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-gray-700 font-light">
              Los archivos se eliminan automáticamente después de 24 horas
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
