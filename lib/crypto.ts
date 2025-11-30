/**
 * @deprecated Usa setupKeys() del API en su lugar
 * Generar par de claves RSA para el receptor (OBSOLETO)
 * Ahora el backend genera las claves automáticamente
 * Esto se mantiene solo para compatibilidad temporal
 */
export async function generateKeyPair(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  // Generar par de claves RSA-OAEP
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );

  // Exportar clave pública en formato SPKI (PEM)
  const publicKeyBuffer = await window.crypto.subtle.exportKey(
    "spki",
    keyPair.publicKey
  );
  const publicKeyPem = bufferToPem(publicKeyBuffer, "PUBLIC KEY");

  // Exportar clave privada en formato PKCS8 (PEM)
  const privateKeyBuffer = await window.crypto.subtle.exportKey(
    "pkcs8",
    keyPair.privateKey
  );
  const privateKeyPem = bufferToPem(privateKeyBuffer, "PRIVATE KEY");

  return {
    publicKey: publicKeyPem,
    privateKey: privateKeyPem,
  };
}

/**
 * Guardar claves en localStorage (temporal)
 * ⚠️ En producción, considera usar un método más seguro
 */
export function saveKeys(publicKey: string, privateKey: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem("myPublicKey", publicKey);
  // ⚠️ IMPORTANTE: En producción, la clave privada debería estar
  // mejor protegida o solo existir en memoria
  localStorage.setItem("myPrivateKey", privateKey);
}

/**
 * Obtener claves guardadas
 * Soporta tanto el formato antiguo (myPrivateKey) como el nuevo (user_private_key)
 */
export function getMyKeys(): { publicKey: string; privateKey: string } | null {
  if (typeof window === "undefined") return null;

  const publicKey = localStorage.getItem("myPublicKey");

  // Buscar clave privada en ambos formatos (compatibilidad)
  let privateKey = localStorage.getItem("myPrivateKey");
  if (!privateKey) {
    privateKey = localStorage.getItem("user_private_key");
  }

  if (!publicKey || !privateKey) return null;

  return { publicKey, privateKey };
}

/**
 * Verificar si el usuario tiene claves guardadas localmente
 */
export function hasKeys(): boolean {
  return getMyKeys() !== null;
}

// Función auxiliar para convertir buffer a PEM
function bufferToPem(buffer: ArrayBuffer, type: string): string {
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const formatted = base64.match(/.{1,64}/g)?.join("\n") || base64;
  return `-----BEGIN ${type}-----\n${formatted}\n-----END ${type}-----`;
}

/**
 * Importar clave privada desde PEM
 */
export async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  // Remover headers y espacios
  const pemContents = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  // Convertir de base64 a ArrayBuffer
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  // Importar la clave
  return await window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}

/**
 * Descifrar datos con clave privada RSA
 */
export async function decryptWithPrivateKey(
  encryptedData: ArrayBuffer,
  privateKeyPem: string
): Promise<ArrayBuffer> {
  const privateKey = await importPrivateKey(privateKeyPem);

  return await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    privateKey,
    encryptedData
  );
}

/**
 * Calcular hash SHA-256 de un archivo
 */
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Calcular hash SHA-256 de un ArrayBuffer
 */
export async function calculateHash(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Descargar archivo al sistema
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

/**
 * Descargar texto como archivo
 */
export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain" });
  downloadFile(blob, filename);
}

/**
 * Leer archivo como texto
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Leer archivo como ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
