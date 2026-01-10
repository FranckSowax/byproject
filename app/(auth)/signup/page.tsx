"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Gift, Phone, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const isFreemium = searchParams.get("freemium") === "true";
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    whatsapp: "",
    password: "",
    confirmPassword: "",
    language: "fr",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (!formData.fullName.trim()) {
      toast.error("Le nom complet est requis");
      return;
    }

    if (!formData.whatsapp.trim()) {
      toast.error("Le numéro WhatsApp est requis");
      return;
    }

    setIsLoading(true);

    try {
      // Utiliser l'API server-side pour créer le compte (contourne les RLS)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          whatsapp: formData.whatsapp,
          language: formData.language,
          isFreemium,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Erreur lors de la création du compte");
        return;
      }

      // Succès! Maintenant connecter l'utilisateur automatiquement
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.error("Auto sign-in error:", signInError);
        toast.success("Compte créé! Connectez-vous maintenant.");
        setTimeout(() => {
          router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
        }, 1500);
        return;
      }

      // Nettoyer le localStorage
      localStorage.removeItem("mockUser");

      toast.success("Compte créé et connecté avec succès!");

      // Rediriger directement vers la destination
      router.push(redirectTo);
      router.refresh();

    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-purple-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          {isFreemium && (
            <Badge className="mx-auto mb-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
              <Gift className="h-3 w-3 mr-1" />
              15 jours d'essai gratuit
            </Badge>
          )}
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-purple-100 to-blue-100">
            <BarChart3 className="h-6 w-6 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
          <CardDescription>
            {isFreemium
              ? "Commencez votre essai gratuit de 15 jours"
              : "Comparez les prix des matériaux de construction"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {isFreemium && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3 mb-4">
                <ul className="space-y-1 text-sm text-purple-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Jusqu'à 5 projets
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Devis fournisseurs illimités
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Comparaison de prix en temps réel
                  </li>
                </ul>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Nom complet *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jean Dupont"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="nom@exemple.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-green-600" />
                WhatsApp *
              </Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="+225 07 XX XX XX XX"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Nous utilisons WhatsApp pour vous contacter rapidement
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Langue préférée</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
                minLength={8}
              />
              <p className="text-xs text-gray-500">Minimum 8 caractères</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className={`w-full ${isFreemium ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}`}
              disabled={isLoading}
            >
              {isLoading
                ? "Création du compte..."
                : isFreemium
                  ? "Commencer mon essai gratuit"
                  : "Créer un compte"}
            </Button>
            <p className="text-center text-sm text-gray-600">
              Vous avez déjà un compte ?{" "}
              <Link href={`/login${redirectTo !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`} className="text-purple-600 hover:underline">
                Se connecter
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
