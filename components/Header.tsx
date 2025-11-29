"use client";

import { useAuth } from "@/lib/auth-context";
import { LogOut, User as UserIcon, Shield } from "lucide-react";
import Image from "next/image";

export function Header() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex justify-between items-center h-20">
          {/* Logo - Verde Emerald con buen contraste */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              SecureTransfer
            </h1>
          </div>

          {/* User info */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              {user.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  width={40}
                  height={40}
                  className="rounded-2xl shadow-sm"
                />
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center shadow-sm">
                  <UserIcon className="w-5 h-5 text-gray-600" />
                </div>
              )}
              <span className="text-sm font-medium text-gray-900 hidden sm:inline">
                {user.user_metadata?.full_name || user.email}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all duration-300 ease-out border border-transparent hover:border-emerald-200"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
