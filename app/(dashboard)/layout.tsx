"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { DashboardNav } from "@/components/layout/DashboardNav";

interface MockUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isTestUser: boolean;
}

interface RealUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isTestUser: false;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<MockUser | RealUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // 1. Vérifier d'abord s'il y a une session Supabase
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      if (supabaseUser) {
        // Utilisateur Supabase authentifié
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email || 'User',
          role: 'User',
          isTestUser: false,
        });
        setIsLoading(false);
        return;
      }

      // 2. Sinon, vérifier le mock user
      const storedUser = localStorage.getItem("mockUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsLoading(false);
        return;
      }

      // 3. Aucun utilisateur connecté, rediriger vers login
      router.push("/login");
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/login");
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5B5FC7] mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <DashboardNav />

      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-b from-[#F8F9FF] to-white">
        {children}
      </main>
    </div>
  );
}
