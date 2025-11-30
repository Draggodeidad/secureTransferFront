"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { saveKeys, getMyKeys } from "@/lib/crypto";
import { getUserProfile } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  hasKeys: boolean;
  publicKey: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasKeys, setHasKeys] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Si hay usuario, verificar claves
      if (session?.user) {
        checkAndGenerateKeys(session.user.id, session.access_token);
      }
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Si hay usuario, verificar claves
      if (session?.user) {
        checkAndGenerateKeys(session.user.id, session.access_token);
      } else {
        setHasKeys(false);
        setPublicKey(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeUserKeys = async (accessToken: string) => {
    try {
      // console.log("🔑 Inicializando claves del usuario...");
      // console.log("📍 API_URL:", API_URL);
      // console.log("🎫 Access Token:", accessToken.substring(0, 20) + "...");

      const url = `${API_URL}/auth/initialize`;
      // console.log("🌐 Llamando a:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // console.log("📥 Respuesta HTTP:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        // console.log("✅ " + data.message);
        // console.log("📦 Datos recibidos:", {
        //   hasPublicKey: !!data.publicKey,
        //   hasPrivateKey: !!data.privateKey,
        //   profileUserId: data.profile?.userId,
        // });

        // Guardar clave privada si se generó
        if (data.privateKey) {
          localStorage.setItem("user_private_key", data.privateKey);
          // console.log("🔐 Clave privada guardada en localStorage");
        }

        // Guardar clave pública también
        if (data.publicKey || data.profile?.publicKey) {
          const publicKey = data.publicKey || data.profile?.publicKey;
          localStorage.setItem("myPublicKey", publicKey);
          setPublicKey(publicKey);
          setHasKeys(true);
          // console.log("🔓 Clave pública guardada en localStorage");
        }

        return true;
      } else {
        const errorData = await response.json().catch(() => ({
          error: "Error al inicializar",
        }));
        console.error("❌ Error al inicializar:", errorData.error);
        // console.error("📄 Error completo:", errorData);
        return false;
      }
    } catch (error) {
      console.error("💥 Error de red o excepción:", error);
      return false;
    }
  };

  const checkAndGenerateKeys = async (userId: string, token: string) => {
    try {
      // console.log("🔍 Verificando claves para usuario:", userId);

      // Verificar si tiene claves localmente
      const localKeys = getMyKeys();
      if (localKeys) {
        setHasKeys(true);
        setPublicKey(localKeys.publicKey);
        // console.log("✅ Claves encontradas localmente");
        // console.log(
        //   "🔓 Public Key (primeros 50 chars):",
        //   localKeys.publicKey.substring(0, 50) + "..."
        // );
        return;
      }

      // console.log("⚠️ No se encontraron claves locales");
      // console.log("🔄 Intentando inicializar usuario en el backend...");

      const initialized = await initializeUserKeys(token);

      if (initialized) {
        // console.log("✅ Inicialización completada");
        // Verificar nuevamente si ahora tenemos las claves
        const newLocalKeys = getMyKeys();
        if (newLocalKeys) {
          setHasKeys(true);
          setPublicKey(newLocalKeys.publicKey);
          // console.log("✅ Usuario inicializado y claves guardadas");
          // console.log(
          //   "🔓 Public Key (primeros 50 chars):",
          //   newLocalKeys.publicKey.substring(0, 50) + "..."
          // );
          return;
        } else {
          console.warn(
            "⚠️ Inicialización OK pero no se guardaron las claves localmente"
          );
        }
      } else {
        console.error("❌ La inicialización falló");
      }

      // Si el initialize falló o no retornó claves, verificar en el perfil
      // console.log("🔄 Intentando obtener perfil del usuario...");
      try {
        const profile = await getUserProfile(token);
        // console.log("📋 Perfil obtenido:", {
        //   userId: profile.userId,
        //   email: profile.email,
        //   hasPublicKey: !!profile.publicKey,
        // });

        if (profile.publicKey) {
          setHasKeys(false); // No tiene clave privada local
          setPublicKey(profile.publicKey);
          console.warn(
            "⚠️ Tienes una clave pública registrada pero no tienes la clave privada localmente."
          );
          return;
        }
      } catch (error) {
        console.error("❌ Error al obtener perfil:", error);
        // console.log(
        //   "⚠️ No se pudo obtener el perfil, las claves se generarán en el próximo intento"
        // );
      }
    } catch (error) {
      console.error("💥 Error al verificar/generar claves:", error);
    }
  };

  const signInWithGoogle = async () => {
    // Verificar si hay una URL de redirección guardada
    const redirectUrl = localStorage.getItem("redirectAfterLogin") || "/upload";

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${redirectUrl}`,
      },
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signInWithGoogle,
        signOut,
        hasKeys,
        publicKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
