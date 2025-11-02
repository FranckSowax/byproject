"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Connexion avec Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email ou mot de passe incorrect");
        } else if (error.message.includes("Email not confirmed")) {
          toast.error("Veuillez confirmer votre email avant de vous connecter");
        } else {
          toast.error(`Erreur: ${error.message}`);
        }
        return;
      }

      if (!data.user) {
        toast.error("Erreur de connexion");
        return;
      }

      // Succès!
      toast.success("Connexion réussie!");
      router.push("/dashboard");
      router.refresh();

    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#F8F9FF] to-white p-4">
      <Card className="w-full max-w-md shadow-xl border-[#E0E4FF]">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#5B5FC7] to-[#7B7FE8]">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#2D3748]">Bon retour</CardTitle>
          <CardDescription className="text-[#718096]">
            Connectez-vous à votre compte CompaChantier
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#4A5568]">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="border-[#E0E4FF] focus:border-[#5B5FC7]"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[#4A5568]">Mot de passe</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#5B5FC7] hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="border-[#E0E4FF] focus:border-[#5B5FC7]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#5B5FC7] text-white"
              disabled={isLoading}
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
            <p className="text-center text-sm text-[#718096]">
              Pas encore de compte ?{" "}
              <Link href="/signup" className="text-[#5B5FC7] hover:underline font-medium">
                S&apos;inscrire
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
