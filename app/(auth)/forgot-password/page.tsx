"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Veuillez entrer votre adresse email");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Reset password error:", error);
        toast.error(`Erreur: ${error.message}`);
        return;
      }

      setEmailSent(true);
      toast.success("Email de réinitialisation envoyé !");
      
    } catch (error: any) {
      console.error("Error:", error);
      toast.error(`Une erreur est survenue: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F9FF] to-[#E8EEFF] p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <Image
                src="/logo-byproject.png"
                alt="By Project Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] bg-clip-text text-transparent">
            Mot de passe oublié
          </CardTitle>
          <CardDescription className="text-center text-base">
            {emailSent 
              ? "Consultez votre boîte email"
              : "Entrez votre email pour réinitialiser votre mot de passe"
            }
          </CardDescription>
        </CardHeader>

        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-green-900 mb-1">
                      Email envoyé !
                    </h4>
                    <p className="text-sm text-green-800">
                      Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>
                    </p>
                    <p className="text-sm text-green-700 mt-2">
                      Vérifiez votre boîte de réception et vos spams.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => setEmailSent(false)}
                  className="w-full"
                >
                  Renvoyer l'email
                </Button>
                <Link href="/login" className="w-full">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Adresse email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#5B5FC7] text-white font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Envoyer le lien
                  </>
                )}
              </Button>

              <Link href="/login" className="block">
                <Button variant="ghost" className="w-full" type="button">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour à la connexion
                </Button>
              </Link>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-2 text-center text-sm text-gray-600">
          <p>
            Vous n'avez pas de compte ?{" "}
            <Link href="/signup" className="text-[#5B5FC7] hover:underline font-semibold">
              Créer un compte
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
