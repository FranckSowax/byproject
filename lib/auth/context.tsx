"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string, language: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    // Si c'est l'admin de test, utiliser l'ID fixe
    if (email === 'admin@compachantier.com' && password === 'Admin123!') {
      try {
        // Créer une session pour l'admin de test
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        return data;
      } catch (error) {
        console.log('Auth error or Mock mode:', error);
        // Fallback pour le mode local sans backend valide
        const mockUser = {
          id: 'mock-admin-id',
          email: email,
          user_metadata: { full_name: 'Admin Test' },
          role: 'authenticated',
          aud: 'authenticated',
          app_metadata: {},
          created_at: new Date().toISOString()
        } as unknown as User;
        
        // Simuler la session
        setUser(mockUser);
        localStorage.setItem('mockUser', JSON.stringify({
          id: 'mock-admin-id',
          email: email,
          name: 'Admin Test',
          role: 'admin',
          isTestUser: true
        }));
        
        return { user: mockUser, session: { user: mockUser } };
      }
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    language: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          preferred_language: language,
        },
      },
    });

    if (error) throw error;

    // Create user profile with default Reader role
    if (data.user) {
      const { error: profileError } = await (supabase as any)
        .from("users")
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          preferred_language: language,
          role_id: 3, // Reader role by default
        });

      if (profileError) {
        console.error("Error creating user profile:", profileError);
      }

      // Create default free subscription
      const { error: subscriptionError } = await (supabase as any)
        .from("subscriptions")
        .insert({
          user_id: data.user.id,
          plan: "Free",
          project_limit: 5,
          export_limit: 2,
        });

      if (subscriptionError) {
        console.error("Error creating subscription:", subscriptionError);
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
