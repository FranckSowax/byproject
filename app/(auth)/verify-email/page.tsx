/**
 * Page de rappel de vérification d'email
 * Affichée quand l'utilisateur n'a pas encore vérifié son email
 */

"use client";

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, RefreshCw, CheckCircle2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    // Si l'email est déjà vérifié, rediriger
    if (user.email_confirmed_at) {
      router.push('/dashboard');
      return;
    }

    setUserEmail(user.email || '');
  };

  const resendEmail = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error('Email non trouvé');
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });

      if (error) throw error;

      setEmailSent(true);
      toast.success('Email de vérification renvoyé !');
    } catch (error: any) {
      console.error('Error resending email:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const checkVerification = async () => {
    setLoading(true);
    
    try {
      // Rafraîchir la session
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;

      if (user?.email_confirmed_at) {
        toast.success('Email vérifié ! Redirection...');
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        toast.info('Email pas encore vérifié. Vérifiez votre boîte mail.');
      }
    } catch (error: any) {
      console.error('Error checking verification:', error);
      toast.error('Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F9FF] to-[#E8EEFF] p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center">
          <Mail className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
          <CardDescription className="text-base">
            Nous avons envoyé un lien de vérification à
          </CardDescription>
          <p className="font-semibold text-gray-900 mt-2">{userEmail}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">📧 Prochaines étapes :</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Ouvrez votre boîte mail</li>
              <li>Cherchez l'email de By Project</li>
              <li>Cliquez sur le lien de vérification</li>
              <li>Revenez ici et cliquez sur "Vérifier"</li>
            </ol>
          </div>

          {/* Message de succès si email renvoyé */}
          {emailSent && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Email renvoyé !</p>
                  <p className="text-sm text-green-800 mt-1">
                    Vérifiez votre boîte mail et vos spams.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="space-y-2">
            <Button
              onClick={checkVerification}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  J'ai vérifié mon email
                </>
              )}
            </Button>

            <Button
              onClick={resendEmail}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Renvoyer l'email
                </>
              )}
            </Button>

            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se déconnecter
            </Button>
          </div>

          {/* Aide */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">💡 Vous ne trouvez pas l'email ?</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Vérifiez votre dossier spam/courrier indésirable</li>
              <li>• Attendez quelques minutes (l'email peut prendre du temps)</li>
              <li>• Vérifiez que l'adresse email est correcte</li>
              <li>• Cliquez sur "Renvoyer l'email" si besoin</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
