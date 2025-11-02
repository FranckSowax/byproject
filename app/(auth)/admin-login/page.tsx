"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Shield } from "lucide-react";
import { toast } from "sonner";

// Credentials de test - À REMPLACER en production
const TEST_ADMIN = {
  email: "admin@compachantier.com",
  password: "Admin123!",
  name: "Admin Test",
  role: "Administrator"
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Vérification des credentials de test
      if (email === TEST_ADMIN.email && password === TEST_ADMIN.password) {
        // Stocker les infos de session dans localStorage pour le test
        const mockUser = {
          id: "test-admin-id",
          email: TEST_ADMIN.email,
          name: TEST_ADMIN.name,
          role: TEST_ADMIN.role,
          isTestUser: true
        };
        
        localStorage.setItem("mockUser", JSON.stringify(mockUser));
        
        toast.success("Connexion admin réussie!");
        router.push("/dashboard");
      } else {
        toast.error("Email ou mot de passe incorrect");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setEmail(TEST_ADMIN.email);
    setPassword(TEST_ADMIN.password);
    toast.info("Credentials de test remplis");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <Card className="w-full max-w-md border-blue-200">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Test Login</CardTitle>
          <CardDescription>
            Connexion administrateur pour tester l&apos;application
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4 text-sm">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Credentials de test:</span>
              </div>
              <div className="space-y-1 text-blue-800">
                <p><strong>Email:</strong> {TEST_ADMIN.email}</p>
                <p><strong>Password:</strong> {TEST_ADMIN.password}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={fillTestCredentials}
              >
                Remplir automatiquement
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@compachantier.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
            <div className="text-center text-xs text-gray-500">
              ⚠️ Ceci est un login de test. En production, utilisez Supabase Auth.
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
