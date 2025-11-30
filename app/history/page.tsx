"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { LoadingPage, LoadingSpinner } from "@/components/LoadingSpinner";
import { Alert } from "@/components/Alert";
import {
  getUserStats,
  getUserUploads,
  getSharedFiles,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type UserStats,
  type FileUpload,
  type SharedFile,
  type Notification,
} from "@/lib/api";
import {
  Bell,
  BellOff,
  FileText,
  Upload,
  Download,
  HardDrive,
  Check,
  Clock,
  User,
  AlertCircle,
  FileCheck,
  Share2,
} from "lucide-react";

type TabType = "stats" | "uploads" | "shared" | "notifications";

export default function HistoryPage() {
  const { user, session, loading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>("stats");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Cargar datos al iniciar
  useEffect(() => {
    if (user && session) {
      loadStats();
    }
  }, [user, session]);

  // Cargar datos según la pestaña activa
  useEffect(() => {
    if (user && session) {
      if (activeTab === "uploads") {
        loadUploads();
      } else if (activeTab === "shared") {
        loadSharedFiles();
      } else if (activeTab === "notifications") {
        loadNotifications();
      }
    }
  }, [activeTab, user, session]);

  const loadStats = async () => {
    if (!session?.access_token) return;

    try {
      setLoadingData(true);
      const data = await getUserStats(session.access_token);
      setStats(data);
    } catch (err: any) {
      console.error("Error al cargar estadísticas:", err);
      setError(err.message || "Error al cargar estadísticas");
    } finally {
      setLoadingData(false);
    }
  };

  const loadUploads = async () => {
    if (!session?.access_token) return;

    try {
      setLoadingData(true);
      setError(""); // Limpiar errores anteriores
      // console.log("📤 Cargando archivos subidos...");

      const response = await getUserUploads(session.access_token, 1, 10, "all");

      // console.log("📦 Respuesta completa:", response);
      // console.log("📄 Datos:", response.data);
      // console.log("📊 Total archivos:", response.data?.length || 0);

      if (response.data) {
        setUploads(response.data);
        // console.log("✅ Archivos cargados:", response.data.length);
      } else {
        // console.warn("⚠️ response.data está vacío o undefined");
        setUploads([]);
      }
    } catch (err: any) {
      console.error("❌ Error al cargar archivos subidos:", err);
      // console.error("📄 Mensaje de error:", err.message);
      setError(err.message || "Error al cargar archivos subidos");
      setUploads([]);
    } finally {
      setLoadingData(false);
    }
  };

  const loadSharedFiles = async () => {
    if (!session?.access_token) return;

    try {
      setLoadingData(true);
      setError(""); // Limpiar errores anteriores
      // console.log("📥 Cargando archivos compartidos...");

      const response = await getSharedFiles(
        session.access_token,
        1,
        10,
        "false"
      );

      // console.log("📦 Respuesta compartidos:", response);
      // console.log("📄 Datos compartidos:", response.data);
      // console.log("📊 Total compartidos:", response.data?.length || 0);

      if (response.data) {
        setSharedFiles(response.data);
        // console.log("✅ Archivos compartidos cargados:", response.data.length);
      } else {
        // console.warn("⚠️ response.data de compartidos está vacío");
        setSharedFiles([]);
      }
    } catch (err: any) {
      console.error("❌ Error al cargar archivos compartidos:", err);
      // console.error("📄 Mensaje de error:", err.message);
      setError(err.message || "Error al cargar archivos compartidos");
      setSharedFiles([]);
    } finally {
      setLoadingData(false);
    }
  };

  const loadNotifications = async () => {
    if (!session?.access_token) return;

    try {
      setLoadingData(true);
      const response = await getNotifications(
        session.access_token,
        1,
        20,
        "all"
      );
      setNotifications(response.data);
      setUnreadCount(response.unread_count);
    } catch (err: any) {
      console.error("Error al cargar notificaciones:", err);
      setError(err.message || "Error al cargar notificaciones");
    } finally {
      setLoadingData(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    if (!session?.access_token) return;

    try {
      await markNotificationAsRead(notificationId, session.access_token);
      // Recargar notificaciones
      loadNotifications();
      loadStats(); // Para actualizar el contador de no leídas
    } catch (err: any) {
      console.error("Error al marcar como leída:", err);
      setError(err.message || "Error al marcar como leída");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!session?.access_token) return;

    try {
      await markAllNotificationsAsRead(session.access_token);
      // Recargar notificaciones
      loadNotifications();
      loadStats(); // Para actualizar el contador de no leídas
    } catch (err: any) {
      console.error("Error al marcar todas como leídas:", err);
      setError(err.message || "Error al marcar todas como leídas");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      expired: "bg-red-100 text-red-800",
      deleted: "bg-gray-100 text-gray-800",
      archived: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || colors.active;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "file_shared":
        return <Share2 className="w-5 h-5 text-blue-600" />;
      case "file_downloaded":
        return <Download className="w-5 h-5 text-green-600" />;
      case "permission_revoked":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "file_expired":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading || !stats) {
    return <LoadingPage />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-emerald-600 shadow-md mb-6">
            <FileText className="w-8 h-8 text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-semibold text-gray-900 tracking-tight mb-4">
            Historial y Notificaciones
          </h1>
          <p className="text-lg text-gray-500 font-light max-w-2xl mx-auto">
            Gestiona tus archivos y mantente al día con las notificaciones
          </p>
        </div>

        {/* Error */}
        {error && <Alert type="error" message={error} className="mb-8" />}

        {/* Tabs */}
        <div className="glass-card rounded-3xl p-2 mb-8">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-6 py-4 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "stats"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FileCheck className="w-5 h-5" />
              <span>Estadísticas</span>
            </button>
            <button
              onClick={() => setActiveTab("uploads")}
              className={`px-6 py-4 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "uploads"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Upload className="w-5 h-5" />
              <span>Mis Subidas</span>
            </button>
            <button
              onClick={() => setActiveTab("shared")}
              className={`px-6 py-4 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === "shared"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Download className="w-5 h-5" />
              <span>Compartidos</span>
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`px-6 py-4 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-2 relative ${
                activeTab === "notifications"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Bell className="w-5 h-5" />
              <span>Notificaciones</span>
              {stats.unread_notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                  {stats.unread_notifications}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="glass-card rounded-3xl p-10 shadow-2xl">
          {loadingData ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <>
              {/* Estadísticas */}
              {activeTab === "stats" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    Resumen de Actividad
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                          <Upload className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-light">
                            Total Subidos
                          </p>
                          <p className="text-3xl font-bold text-gray-900">
                            {stats.total_uploads}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-green-50/50 border border-green-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                          <Download className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-light">
                            Total Descargas
                          </p>
                          <p className="text-3xl font-bold text-gray-900">
                            {stats.total_downloads}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                          <HardDrive className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-light">
                            Almacenamiento
                          </p>
                          <p className="text-3xl font-bold text-gray-900">
                            {formatBytes(stats.storage_used_bytes)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                          <FileCheck className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-light">
                            Archivos Activos
                          </p>
                          <p className="text-3xl font-bold text-gray-900">
                            {stats.active_files}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-orange-50/50 border border-orange-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                          <Share2 className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-light">
                            Compartidos Conmigo
                          </p>
                          <p className="text-3xl font-bold text-gray-900">
                            {stats.shared_with_me}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-red-50/50 border border-red-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                          <Bell className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 font-light">
                            Notificaciones
                          </p>
                          <p className="text-3xl font-bold text-gray-900">
                            {stats.unread_notifications}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Mis Subidas */}
              {activeTab === "uploads" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    Mis Archivos Subidos
                  </h2>
                  {uploads.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        No has subido ningún archivo aún
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {uploads.map((file) => (
                        <div
                          key={file.package_id}
                          className="p-6 rounded-2xl bg-gray-50/50 border border-gray-100 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-2">
                                {file.original_filename}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>{formatBytes(file.original_size)}</span>
                                <span>•</span>
                                <span>{file.mime_type}</span>
                                <span>•</span>
                                <span>{formatDate(file.created_at)}</span>
                              </div>
                            </div>
                            <span
                              className={`px-4 py-2 rounded-2xl text-xs font-medium ${getStatusColor(
                                file.status
                              )}`}
                            >
                              {file.status}
                            </span>
                          </div>

                          {file.download_stats && (
                            <div className="text-sm text-gray-600 mt-4">
                              <p>
                                Descargas:{" "}
                                <span className="font-semibold">
                                  {file.download_stats.total_downloads}
                                </span>
                              </p>
                              {file.download_stats.last_download && (
                                <p>
                                  Última descarga:{" "}
                                  {formatDate(
                                    file.download_stats.last_download
                                  )}
                                </p>
                              )}
                            </div>
                          )}

                          {file.file_permissions &&
                            file.file_permissions.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-2">
                                  Compartido con:
                                </p>
                                <div className="space-y-2">
                                  {file.file_permissions.map((perm, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span className="text-gray-600">
                                        {perm.user_profiles?.email}
                                      </span>
                                      <span className="text-gray-500">
                                        {perm.downloads_count}/
                                        {perm.max_downloads} descargas
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Compartidos Conmigo */}
              {activeTab === "shared" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                    Archivos Compartidos Conmigo
                  </h2>
                  {sharedFiles.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
                        No tienes archivos compartidos
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sharedFiles.map((shared) => (
                        <div
                          key={shared.id}
                          className="p-6 rounded-2xl bg-gray-50/50 border border-gray-100 hover:shadow-md transition-shadow"
                        >
                          {shared.files && (
                            <>
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 mb-2">
                                    {shared.files.original_filename}
                                  </h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>
                                      {formatBytes(shared.files.original_size)}
                                    </span>
                                    <span>•</span>
                                    <span>{shared.files.mime_type}</span>
                                    <span>•</span>
                                    <span>{formatDate(shared.granted_at)}</span>
                                  </div>
                                </div>
                                <span
                                  className={`px-4 py-2 rounded-2xl text-xs font-medium ${getStatusColor(
                                    shared.files.status
                                  )}`}
                                >
                                  {shared.files.status}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-sm mt-4">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-600">
                                    De: {shared.files.user_profiles?.email}
                                  </span>
                                </div>
                                <span className="text-gray-600">
                                  Descargas: {shared.downloads_count}/
                                  {shared.max_downloads}
                                </span>
                              </div>

                              <button
                                onClick={() =>
                                  router.push(`/download/${shared.package_id}`)
                                }
                                className="mt-4 w-full px-6 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-all duration-300 flex items-center justify-center gap-2"
                              >
                                <Download className="w-5 h-5" />
                                Descargar
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notificaciones */}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Notificaciones
                    </h2>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="px-4 py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-12">
                      <BellOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No tienes notificaciones</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-md cursor-pointer ${
                            notification.read
                              ? "bg-gray-50/50 border-gray-100"
                              : "bg-blue-50/50 border-blue-200"
                          }`}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-gray-900">
                                  {notification.title}
                                </h3>
                                {!notification.read && (
                                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(notification.created_at)}
                                </div>
                                {notification.read && notification.read_at && (
                                  <div className="flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Leída: {formatDate(notification.read_at)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
