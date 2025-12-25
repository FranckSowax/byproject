"use client";

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Loader2 } from 'lucide-react';

export default function ForceLogoutPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const forceLogout = async () => {
      try {
        // Sign out from Supabase
        await supabase.auth.signOut();
        
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        // Wait a bit to ensure everything is cleared
        setTimeout(() => {
          router.push('/login');
        }, 1000);
      } catch (error) {
        console.error('Error during force logout:', error);
        // Force redirect anyway
        setTimeout(() => {
          router.push('/login');
        }, 1000);
      }
    };

    forceLogout();
  }, [router, supabase]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <LogOut className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Déconnexion en cours...</CardTitle>
          <CardDescription>
            Nettoyage de votre session et redirection vers la page de connexion
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    </div>
  );
}
