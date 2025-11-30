"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { LoadingPage, LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert } from "@/components/Alert";
import {
  downloadDecryptedFile,
  downloadPackageZip,
  getPackageMetadata,
  PackageMetadata,
} from "@/lib/api";
import { getMyKeys, readFileAsText, downloadTextFile } from "@/lib/crypto";
import {
  Download,
  FileCheck,
  Shield,
  Key,
  AlertTriangle,
  Info,
  Check,
  Clock,
} from "lucide-react";

export default function DownloadPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const packageId = params.packageId as string;

  const [metadata, setMetadata] = useState<PackageMetadata | null>(null);
  const [loadingMetadata, setLoadingMetadata] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [error, setError] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [privateKeyFile, setPrivateKeyFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Redirigir si no está autenticado, guardando la URL actual
  useEffect(() => {
    if (!loading && !user) {
      // Guardar la URL actual para redirigir después del login
      const currentPath = `/download/${packageId}`;
      localStorage.setItem("redirectAfterLogin", currentPath);
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [user, loading, router, packageId]);

  // Cargar metadatos al iniciar
  useEffect(() => {
    if (user && session) {
      loadMetadata();
      loadPrivateKey();
    }
  }, [user, session, packageId]);

  const loadMetadata = async () => {
    if (!session?.access_token) return;

    try {
      setLoadingMetadata(true);
      const data = await getPackageMetadata(packageId, session.access_token);
      setMetadata(data);
    } catch (err: any) {
      console.error("Error al cargar metadatos:", err);
      setError(err.message || "Error al obtener información del paquete");
    } finally {
      setLoadingMetadata(false);
    }
  };

  const loadPrivateKey = () => {
    const keys = getMyKeys();
    if (keys?.privateKey) {
      setPrivateKey(keys.privateKey);
    }
  };

  const handlePrivateKeyFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      setPrivateKey(content);
      setPrivateKeyFile(file);
      setError("");
    } catch (err) {
      setError("Error al leer el archivo de clave privada");
    }
  };

  // Opción Simple: Descargar archivo descifrado directamente
  const handleDownloadDecrypted = async () => {
    if (!privateKey.trim()) {
      setError("Por favor proporciona tu clave privada");
      return;
    }

    if (!session?.access_token) {
      setError("No se encontró una sesión válida");
      return;
    }

    setIsDownloading(true);
    setError("");

    try {
      // Descargar el archivo ya descifrado del backend
      const blob = await downloadDecryptedFile(
        packageId,
        privateKey,
        session.access_token
      );

      // Obtener el nombre del archivo original desde los metadatos
      const filename = metadata?.filename || "archivo-descargado";

      // Descargar el archivo directamente
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert(
        "✅ ¡Archivo descargado exitosamente!\n\nEl archivo está listo para usar."
      );
    } catch (err: any) {
      console.error("Error al descargar archivo descifrado:", err);
      setError(err.message || "Error al descargar el archivo descifrado");
    } finally {
      setIsDownloading(false);
    }
  };

  // Opción Avanzada: Descargar ZIP con archivos cifrados
  const handleDownloadZip = async () => {
    if (!privateKey.trim()) {
      setError("Por favor proporciona tu clave privada");
      return;
    }

    if (!session?.access_token) {
      setError("No se encontró una sesión válida");
      return;
    }

    setIsDownloadingZip(true);
    setError("");

    try {
      // Descargar el paquete ZIP con archivos cifrados
      const blob = await downloadPackageZip(packageId, session.access_token);

      // Descargar el archivo ZIP
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `secure-package-${packageId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // También descargar la clave privada para referencia
      downloadTextFile(privateKey, `private-key-${packageId}.pem`);

      alert(
        "✅ Paquete ZIP descargado!\n\n" +
          "El archivo ZIP contiene:\n" +
          "1. manifest.json - Metadatos del archivo\n" +
          "2. encrypted_file.enc - Archivo cifrado\n" +
          "3. encrypted_key.bin - Clave AES cifrada\n" +
          "4. README.txt - Instrucciones\n\n" +
          "Tu clave privada también se ha descargado por separado."
      );
    } catch (err: any) {
      console.error("Error al descargar ZIP:", err);
      setError(err.message || "Error al descargar el paquete ZIP");
    } finally {
      setIsDownloadingZip(false);
    }
  };

  if (loading || loadingMetadata) {
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
            <Download className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-semibold text-gray-900 tracking-tight mb-4">
            Descarga tu archivo
          </h1>
          <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto">
            ID del paquete:{" "}
            <code className="text-xs bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-gray-200">
              {packageId}
            </code>
          </p>
        </div>

        {/* Error general */}
        {error && !metadata && (
          <Alert type="error" message={error} className="mb-8" />
        )}

        {/* Metadatos del paquete */}
        {metadata && (
          <div className="glass-card rounded-3xl p-10 shadow-2xl mb-8">
            <div className="flex items-start gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md flex-shrink-0">
                <FileCheck className="w-7 h-7 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                  Información del Archivo
                </h2>
                <p className="text-sm text-gray-500 mt-1 font-light">
                  Revisa los detalles antes de descargar
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <span className="text-gray-500 font-light">
                  Nombre del archivo:
                </span>
                <span className="font-medium text-gray-900">
                  {metadata.filename}
                </span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <span className="text-gray-500 font-light">Tamaño:</span>
                <span className="font-medium text-gray-900">
                  {(metadata.originalSize / 1024).toFixed(2)} KB
                </span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <span className="text-gray-500 font-light">Tipo:</span>
                <span className="font-medium text-gray-900">
                  {metadata.mimeType}
                </span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <span className="text-gray-500 font-light">Subido:</span>
                <span className="font-medium text-gray-900">
                  {new Date(metadata.uploadedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-4 border-b border-gray-100">
                <span className="text-gray-500 font-light">Expira:</span>
                <span className="font-medium text-gray-900">
                  {new Date(metadata.expiresAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-4">
                <span className="text-gray-500 font-light">Estado:</span>
                <span
                  className={`inline-flex items-center px-4 py-2 rounded-2xl text-xs font-medium ${
                    metadata.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {metadata.status === "active" ? "Activo" : metadata.status}
                </span>
              </div>
            </div>

            {/* Verificación de firma */}
            {metadata.signer && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-start gap-3 p-6 rounded-2xl bg-gray-50/50 backdrop-blur-sm">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      metadata.signatureValid ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    <Shield
                      className={`w-5 h-5 flex-shrink-0 ${
                        metadata.signatureValid
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                      strokeWidth={1.5}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 tracking-tight">
                      Verificación de Firma
                    </p>
                    <p className="text-xs text-gray-600 mt-2 font-light">
                      {metadata.signatureValid ? (
                        <span className="text-green-600">
                          Firma válida - El archivo no ha sido modificado
                        </span>
                      ) : (
                        <span className="text-red-600">
                          Firma inválida - El archivo puede haber sido alterado
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-2 font-light">
                      Firmado por: {metadata.signer}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Advertencia si no está activo */}
            {metadata.status !== "active" && (
              <Alert
                type="warning"
                message="Este paquete no está disponible para descarga"
                className="mt-6"
              />
            )}
          </div>
        )}

        {/* Sección de clave privada */}
        <div className="glass-card rounded-3xl p-10 shadow-2xl mb-8">
          <div className="flex items-start gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md flex-shrink-0">
              <Key className="w-7 h-7 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                Tu Clave Privada
              </h2>
              <p className="text-sm text-gray-500 mt-1 font-light">
                Necesaria para descifrar el archivo
              </p>
            </div>
          </div>

          {privateKey ? (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-green-50/50 backdrop-blur-sm border border-green-200/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-green-800">
                    Clave privada cargada correctamente
                  </span>
                </div>
                <div className="bg-white/50 rounded-xl p-4 backdrop-blur-sm">
                  <code className="text-xs text-gray-700 break-all font-mono">
                    {privateKey.substring(0, 100)}...
                  </code>
                </div>
              </div>
              <button
                onClick={() => setPrivateKey("")}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors duration-300"
              >
                Cambiar clave privada
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-amber-50/50 backdrop-blur-sm border border-amber-200/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-amber-800">
                    Necesitas tu clave privada para descifrar el archivo
                  </span>
                </div>
              </div>

              {/* Opción 1: Cargar archivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 tracking-tight">
                  Cargar archivo de clave privada (.pem)
                </label>
                <input
                  type="file"
                  accept=".pem,.key"
                  onChange={handlePrivateKeyFileChange}
                  className="block w-full text-sm text-gray-900 border border-gray-200 rounded-2xl cursor-pointer bg-white focus:outline-none p-3 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:transition-all file:duration-300"
                />
              </div>

              {/* Opción 2: Pegar manualmente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 tracking-tight">
                  O pega tu clave privada aquí
                </label>
                <textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                  rows={6}
                  className="block w-full px-6 py-4 border border-gray-200 rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 font-mono text-xs bg-white transition-all duration-300"
                />
              </div>
            </div>
          )}

          {/* Advertencia de seguridad */}
          <div className="mt-6 flex items-start gap-3 bg-yellow-50/50 backdrop-blur-sm border border-yellow-200/50 rounded-2xl p-6">
            <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle
                className="w-5 h-5 text-yellow-600"
                strokeWidth={1.5}
              />
            </div>
            <div className="text-xs text-yellow-800 font-light">
              <p className="font-semibold mb-2">Advertencia de Seguridad</p>
              <p>
                Nunca compartas tu clave privada. Es personal e intransferible.
                Mantenla segura en todo momento.
              </p>
            </div>
          </div>
        </div>

        {/* Error de descarga */}
        {error && metadata && (
          <Alert type="error" message={error} className="mb-8" />
        )}

        {/* Botones de descarga */}
        <div className="glass-card rounded-3xl p-10 shadow-2xl space-y-8">
          {/* Opción Simple (Recomendada) */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
                Opción Recomendada
              </h3>
              <span className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-2xl shadow-md">
                Simple
              </span>
            </div>
            <button
              onClick={handleDownloadDecrypted}
              disabled={
                isDownloading ||
                !privateKey.trim() ||
                metadata?.status !== "active"
              }
              className="w-full bg-emerald-600 text-white py-5 px-6 rounded-3xl hover:bg-emerald-700 hover:shadow-lg disabled:bg-gray-200 disabled:cursor-not-allowed font-medium transition-all duration-300 ease-out flex items-center justify-center gap-3 hover:scale-[1.02] disabled:hover:scale-100 disabled:shadow-none"
            >
              {isDownloading ? (
                <>
                  <LoadingSpinner
                    size="sm"
                    className="border-white border-t-transparent"
                  />
                  <span>Descargando...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" strokeWidth={2} />
                  <span>Descargar Archivo</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 mt-4 text-center font-light">
              Descarga el archivo descifrado y listo para usar
            </p>
          </div>

          {/* Divisor */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-5 py-2 bg-white/80 backdrop-blur-sm text-xs text-gray-500 hover:text-gray-700 transition-all duration-300 rounded-2xl hover:shadow-md"
              >
                {showAdvanced
                  ? "Ocultar opción avanzada"
                  : "Mostrar opción avanzada"}
              </button>
            </div>
          </div>

          {/* Opción Avanzada (Colapsable) */}
          {showAdvanced && (
            <div className="pt-4 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
                  Opción Avanzada
                </h3>
                <span className="px-4 py-2 text-xs font-medium bg-gray-100 text-gray-600 rounded-2xl">
                  Debug
                </span>
              </div>
              <button
                onClick={handleDownloadZip}
                disabled={
                  isDownloadingZip ||
                  !privateKey.trim() ||
                  metadata?.status !== "active"
                }
                className="w-full bg-gray-700 text-white py-5 px-6 rounded-3xl hover:bg-gray-800 hover:shadow-lg disabled:bg-gray-200 disabled:cursor-not-allowed font-medium transition-all duration-300 ease-out flex items-center justify-center gap-3 hover:scale-[1.02] disabled:hover:scale-100 disabled:shadow-none"
              >
                {isDownloadingZip ? (
                  <>
                    <LoadingSpinner
                      size="sm"
                      className="border-white border-t-transparent"
                    />
                    <span>Descargando ZIP...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" strokeWidth={2} />
                    <span>Descargar ZIP (Archivos cifrados)</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-400 text-center font-light">
                Descarga el paquete completo con manifest y archivos cifrados
              </p>
            </div>
          )}

          {/* Mensaje si no hay clave privada */}
          {!privateKey && (
            <div className="pt-4">
              <div className="p-4 rounded-2xl bg-amber-50/50 backdrop-blur-sm border border-amber-200/50">
                <p className="text-xs text-amber-700 text-center font-light">
                  Primero proporciona tu clave privada arriba
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-16 glass-card rounded-3xl p-8">
          <h3 className="text-base font-semibold text-gray-900 mb-6 flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
              <Info className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
            </div>
            Opciones de Descarga
          </h3>
          <div className="space-y-6 text-sm">
            <div className="p-6 rounded-2xl bg-blue-50/50 backdrop-blur-sm">
              <p className="font-medium text-gray-900 mb-2 tracking-tight">
                Opción Simple (Recomendada):
              </p>
              <p className="text-xs text-gray-600 font-light">
                El servidor descifra el archivo por ti y lo descargas listo para
                usar. Perfecto para usuarios finales.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-gray-50/50 backdrop-blur-sm">
              <p className="font-medium text-gray-900 mb-2 tracking-tight">
                Opción Avanzada (ZIP):
              </p>
              <p className="text-xs text-gray-600 font-light">
                Descargas el paquete completo con archivos cifrados, manifest y
                README. Útil para desarrolladores y debugging.
              </p>
            </div>
          </div>
        </div>

        {/* Features con iconos */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-8 glass-card rounded-3xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 mb-4">
              <Shield className="w-6 h-6 text-emerald-600" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-gray-700 font-light">
              Cifrado end-to-end con RSA-OAEP + AES-256
            </p>
          </div>
          <div className="text-center p-8 glass-card rounded-3xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 mb-4">
              <Key className="w-6 h-6 text-emerald-600" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-gray-700 font-light">
              Tu clave privada nunca sale de tu navegador
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
