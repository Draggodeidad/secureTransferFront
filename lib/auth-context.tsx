"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import {
  generateKeyPair,
  saveKeys,
  hasKeys as checkHasKeys,
  getMyKeys,
} from "@/lib/crypto";
import { registerPublicKey, getUserPublicKeys } from "@/lib/api";

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

  const checkAndGenerateKeys = async (userId: string, token: string) => {
    try {
      // Verificar si tiene claves localmente
      const localKeys = getMyKeys();
      if (localKeys) {
        setHasKeys(true);
        setPublicKey(localKeys.publicKey);
        return;
      }

      // Verificar si tiene claves en el backend
      const backendKeys = await getUserPublicKeys(userId, token);
      if (backendKeys && backendKeys.length > 0) {
        setHasKeys(false); // No tiene clave privada local
        setPublicKey(backendKeys[0].publicKey);
        console.warn(
          "⚠️ Tienes una clave pública registrada pero no tienes la clave privada localmente."
        );
        return;
      }

      // Si no tiene claves, generarlas
      console.log("🔑 Generando nuevas claves para el usuario...");
      const newKeys = await generateKeyPair();
      saveKeys(newKeys.publicKey, newKeys.privateKey);

      // Registrar clave pública en el backend
      await registerPublicKey(userId, newKeys.publicKey, token);

      setHasKeys(true);
      setPublicKey(newKeys.publicKey);
      console.log("✅ Claves generadas y registradas exitosamente");
    } catch (error) {
      console.error("Error al verificar/generar claves:", error);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/upload`,
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
