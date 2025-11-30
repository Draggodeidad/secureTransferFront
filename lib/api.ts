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
  authToken?: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("recipientPublicKey", recipientPublicKey);

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
