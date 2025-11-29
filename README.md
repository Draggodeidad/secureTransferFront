# 🔒 SecureTransfer - Frontend

Aplicación web para transferencia segura de archivos con cifrado end-to-end.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Autenticación**: Supabase Auth (Google OAuth)
- **Iconos**: Lucide React
- **Criptografía**: Web Crypto API (RSA-OAEP)

## 📁 Estructura del Proyecto

```
seifront/
├── app/
│   ├── login/              # Página de inicio de sesión
│   ├── upload/             # Página de emisor (subir archivos)
│   ├── download/
│   │   └── [packageId]/    # Página de receptor (descargar archivos)
│   ├── layout.tsx          # Layout principal con AuthProvider
│   └── page.tsx            # Página de inicio (redirección)
├── components/
│   ├── Header.tsx          # Header con info de usuario
│   ├── LoadingSpinner.tsx  # Componentes de loading
│   ├── FileDropZone.tsx    # Zona de drag & drop
│   └── Alert.tsx           # Componente de alertas
├── lib/
│   ├── supabase.ts         # Configuración de Supabase
│   ├── api.ts              # Cliente de API REST
│   ├── crypto.ts           # Funciones de criptografía
│   └── auth-context.tsx    # Context de autenticación
└── .env.local              # Variables de entorno
```

## 🛠️ Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

### 3. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Habilita Google OAuth en Authentication > Providers
3. Configura la URL de redirección: `http://localhost:3000/upload` (desarrollo)
4. Copia las credenciales al `.env.local`

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🎯 Funcionalidades

### 1. Autenticación (Login)

- Inicio de sesión con Google OAuth
- Generación automática de claves RSA al primer login
- Registro de clave pública en el backend

### 2. Emisor (Upload)

- Selección de archivo mediante drag & drop o click
- Input para clave pública del receptor
- Subida de archivo con progreso
- Generación de link compartible
- Visualización de tu propia clave pública

### 3. Receptor (Download)

- Visualización de metadatos del archivo
- Verificación de firma digital
- Carga de clave privada (archivo .pem o manual)
- Descarga de paquete cifrado
- Descarga automática de clave privada

## 🔐 Flujo de Seguridad

1. **Generación de Claves**: Al primer login, se genera un par de claves RSA-OAEP (2048 bits)
2. **Almacenamiento**:
   - Clave privada: localStorage (⚠️ solo para desarrollo)
   - Clave pública: Backend (vinculada al usuario)
3. **Cifrado**: El backend cifra con la clave pública del receptor
4. **Descifrado**: El receptor usa su clave privada en el navegador

## 📡 Endpoints de la API

El frontend consume los siguientes endpoints:

- `POST /upload` - Subir archivo cifrado
- `GET /download/:packageId` - Descargar paquete cifrado
- `GET /metadata/:packageId` - Obtener metadatos del paquete
- `POST /keys/public` - Registrar clave pública del usuario
- `GET /users/:id/keys` - Listar claves públicas del usuario

## ⚠️ Notas de Seguridad

### Para Desarrollo

Este proyecto guarda la clave privada en `localStorage` para facilitar el desarrollo.

### Para Producción

**IMPORTANTE**: Implementar las siguientes mejoras de seguridad:

1. **Claves Privadas**:
   - No almacenar en localStorage
   - Mantener solo en memoria durante la sesión
   - Permitir descarga como archivo .pem seguro
   - Considerar uso de IndexedDB con cifrado adicional

2. **Autenticación**:
   - Implementar refresh tokens
   - Manejo de expiración de sesiones
   - 2FA (Two-Factor Authentication)

3. **Transporte**:
   - Solo HTTPS en producción
   - Content Security Policy (CSP)
   - Verificación de certificados

4. **Tokens Hardware** (opcional):
   - Integración con Yubikey
   - WebAuthn para autenticación biométrica

## 🧪 Testing

```bash
# Ejecutar tests (cuando se implementen)
npm test

# Ejecutar linter
npm run lint

# Build de producción
npm run build
```

## 📦 Deployment

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Configurar variables de entorno en Vercel Dashboard:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Otras plataformas

- Netlify
- AWS Amplify
- Railway
- Render

## 🐛 Troubleshooting

### Error: "Faltan las variables de entorno de Supabase"

Asegúrate de tener el archivo `.env.local` con las credenciales correctas.

### Error al subir archivos

Verifica que el backend esté corriendo y la URL en `NEXT_PUBLIC_API_URL` sea correcta.

### Error de autenticación

Verifica que Google OAuth esté configurado correctamente en Supabase.

## 📚 Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es parte de un MVP educativo.

---

**¡Tu aplicación de transferencia segura está lista! 🎉**
