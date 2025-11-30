const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface UploadResponse {
  package_id: string;
  filename: string;
  size: number;
  encryptedSize: number;
  downloadUrl: string;
  expiresAt: string;
}

export interface PackageMetadata {
  packageId: string;
  filename: string;
  originalSize: number;
  mimeType: string;
  uploadedAt: string;
  expiresAt: string;
  status: "active" | "expired" | "downloaded" | "deleted";
  signer?: string;
  signatureValid?: boolean;
}

export interface UserPublicKey {
  id: string;
  userId: string;
  publicKey: string;
  createdAt: string;
}

/**
 * Subir archivo al backend
 * El backend se encarga de todo el cifrado automáticamente
 */
export async function uploadFile(
  file: File,
  recipientPublicKey: string,
  userId: string,
  authToken?: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("recipientPublicKey", recipientPublicKey);
  formData.append("userId", userId); // ✅ NUEVO: Enviar userId

  const headers: Record<string, string> = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al subir archivo",
    }));
    throw new Error(error.error || "Error al subir archivo");
  }

  const data = await response.json();
  console.log("🔧 Datos brutos del backend:", data);
  console.log("✅ Archivo guardado en Supabase con userId:", userId);

  // Normalizar la respuesta (manejar tanto snake_case como camelCase)
  return {
    package_id: data.package_id || data.packageId || data.id,
    filename: data.filename,
    size: data.size,
    encryptedSize: data.encryptedSize || data.encrypted_size,
    downloadUrl: data.downloadUrl || data.download_url,
    expiresAt: data.expiresAt || data.expires_at,
  };
}

/**
 * Descargar archivo descifrado directamente (Opción Simple - Recomendada)
 * El backend descifra el archivo y lo retorna listo para usar
 */
export async function downloadDecryptedFile(
  packageId: string,
  privateKey: string,
  authToken?: string
): Promise<Blob> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}/download/${packageId}/decrypted`, {
    method: "POST",
    headers,
    body: JSON.stringify({ privateKey }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al descargar archivo descifrado",
    }));
    throw new Error(error.error || "Error al descargar archivo descifrado");
  }

  return response.blob();
}

/**
 * Descargar paquete cifrado del backend (Opción Avanzada)
 * Retorna el archivo ZIP con el manifest y archivo cifrado
 */
export async function downloadPackageZip(
  packageId: string,
  authToken?: string
): Promise<Blob> {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}/download/${packageId}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al descargar archivo",
    }));
    throw new Error(error.error || "Error al descargar archivo");
  }

  return response.blob();
}

/**
 * @deprecated Usa downloadDecryptedFile() o downloadPackageZip() en su lugar
 * Alias de downloadPackageZip para retrocompatibilidad
 */
export async function downloadPackage(
  packageId: string,
  authToken?: string
): Promise<Blob> {
  return downloadPackageZip(packageId, authToken);
}

/**
 * Obtener metadatos del paquete
 */
export async function getPackageMetadata(
  packageId: string,
  authToken?: string
): Promise<PackageMetadata> {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}/metadata/${packageId}`, {
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al obtener metadatos",
    }));
    throw new Error(error.error || "Error al obtener metadatos");
  }

  return response.json();
}

/**
 * Generar y configurar claves RSA automáticamente (nuevo backend)
 * El backend genera las claves y retorna el par completo
 */
export async function setupKeys(
  authToken: string,
  encryptPrivateKey?: boolean,
  passphrase?: string
): Promise<{
  publicKey: string;
  privateKey: string;
  fingerprint: string;
}> {
  const body: any = {};
  if (encryptPrivateKey && passphrase) {
    body.encryptPrivateKey = true;
    body.passphrase = passphrase;
  }

  const response = await fetch(`${API_URL}/auth/setup-keys`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al configurar claves",
    }));
    throw new Error(error.error || "Error al configurar claves");
  }

  return response.json();
}

/**
 * Obtener perfil del usuario autenticado
 */
export async function getUserProfile(authToken: string): Promise<{
  userId: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  publicKey?: string;
  createdAt: string;
  totalUploads: number;
  totalDownloads: number;
  storageUsed: number;
}> {
  const response = await fetch(`${API_URL}/auth/profile`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al obtener perfil",
    }));
    throw new Error(error.error || "Error al obtener perfil");
  }

  return response.json();
}

/**
 * Actualizar perfil del usuario
 */
export async function updateUserProfile(
  authToken: string,
  data: {
    displayName?: string;
    avatarUrl?: string;
  }
): Promise<void> {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al actualizar perfil",
    }));
    throw new Error(error.error || "Error al actualizar perfil");
  }
}

/**
 * Obtener clave pública de un usuario por userId
 */
export async function getUserPublicKeyById(userId: string): Promise<string> {
  const response = await fetch(`${API_URL}/auth/user/${userId}/public-key`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al obtener clave pública",
    }));
    throw new Error(error.error || "Error al obtener clave pública");
  }

  const data = await response.json();
  return data.publicKey;
}

/**
 * Obtener clave pública de un usuario por email
 */
export async function getUserPublicKeyByEmail(email: string): Promise<string> {
  const response = await fetch(
    `${API_URL}/auth/user/email/${encodeURIComponent(email)}/public-key`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al obtener clave pública",
    }));
    throw new Error(error.error || "Error al obtener clave pública");
  }

  const data = await response.json();
  return data.publicKey;
}

/**
 * @deprecated Usa setupKeys() en su lugar
 * Registrar clave pública del usuario (método antiguo)
 */
export async function registerPublicKey(
  userId: string,
  publicKey: string,
  authToken: string
): Promise<void> {
  const response = await fetch(`${API_URL}/keys/public`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ userId, publicKey }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al registrar clave pública",
    }));
    throw new Error(error.error || "Error al registrar clave pública");
  }
}

/**
 * @deprecated Usa getUserProfile() en su lugar
 * Obtener claves públicas del usuario (método antiguo)
 */
export async function getUserPublicKeys(
  userId: string,
  authToken: string
): Promise<UserPublicKey[]> {
  const response = await fetch(`${API_URL}/users/${userId}/keys`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al obtener claves",
    }));
    throw new Error(error.error || "Error al obtener claves");
  }

  return response.json();
}

// ============================================
// HISTORIAL Y NOTIFICACIONES
// ============================================

export interface UserStats {
  total_uploads: number;
  total_downloads: number;
  storage_used_bytes: number;
  active_files: number;
  shared_with_me: number;
  unread_notifications: number;
}

export interface FileUpload {
  package_id: string;
  original_filename: string;
  original_size: number;
  mime_type: string;
  encrypted_size: number;
  status: string;
  expires_at: string;
  created_at: string;
  download_stats?: {
    total_downloads: number;
    last_download: string | null;
  };
  file_permissions?: Array<{
    recipient_id: string;
    permission_type: string;
    downloads_count: number;
    max_downloads: number;
    revoked: boolean;
    user_profiles?: {
      email: string;
      display_name: string;
    };
  }>;
}

export interface SharedFile {
  id: string;
  package_id: string;
  permission_type: string;
  max_downloads: number;
  downloads_count: number;
  revoked: boolean;
  granted_at: string;
  files?: {
    package_id: string;
    original_filename: string;
    original_size: number;
    mime_type: string;
    encrypted_size: number;
    expires_at: string;
    status: string;
    created_at: string;
    user_profiles?: {
      email: string;
      display_name: string;
    };
  };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  related_package_id: string | null;
  related_user_id: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * Obtener estadísticas del usuario
 */
export async function getUserStats(authToken: string): Promise<UserStats> {
  const response = await fetch(`${API_URL}/history/stats`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al obtener estadísticas",
    }));
    throw new Error(error.error || "Error al obtener estadísticas");
  }

  const data = await response.json();
  return data.stats;
}

/**
 * Obtener archivos subidos por el usuario
 */
export async function getUserUploads(
  authToken: string,
  page: number = 1,
  limit: number = 10,
  status: string = "active"
): Promise<PaginatedResponse<FileUpload>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status,
  });

  const response = await fetch(`${API_URL}/history/uploads?${params}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al obtener archivos subidos",
    }));
    throw new Error(error.error || "Error al obtener archivos subidos");
  }

  return response.json();
}

/**
 * Obtener archivos compartidos con el usuario
 */
export async function getSharedFiles(
  authToken: string,
  page: number = 1,
  limit: number = 10,
  revoked: string = "false"
): Promise<PaginatedResponse<SharedFile>> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    revoked,
  });

  const response = await fetch(`${API_URL}/history/shared?${params}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al obtener archivos compartidos",
    }));
    throw new Error(error.error || "Error al obtener archivos compartidos");
  }

  return response.json();
}

/**
 * Obtener notificaciones del usuario
 */
export async function getNotifications(
  authToken: string,
  page: number = 1,
  limit: number = 20,
  read: string = "all"
): Promise<PaginatedResponse<Notification> & { unread_count: number }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    read,
  });

  const response = await fetch(`${API_URL}/history/notifications?${params}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al obtener notificaciones",
    }));
    throw new Error(error.error || "Error al obtener notificaciones");
  }

  return response.json();
}

/**
 * Marcar notificación como leída
 */
export async function markNotificationAsRead(
  notificationId: string,
  authToken: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/history/notifications/${notificationId}/read`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al marcar notificación como leída",
    }));
    throw new Error(error.error || "Error al marcar notificación como leída");
  }
}

/**
 * Marcar todas las notificaciones como leídas
 */
export async function markAllNotificationsAsRead(
  authToken: string
): Promise<number> {
  const response = await fetch(`${API_URL}/history/notifications/read-all`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Error al marcar todas las notificaciones como leídas",
    }));
    throw new Error(
      error.error || "Error al marcar todas las notificaciones como leídas"
    );
  }

  const data = await response.json();
  return data.updated_count;
}
