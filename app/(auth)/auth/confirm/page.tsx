/**
 * Page de confirmation d'email
 * Gère la vérification du lien envoyé par email
 */

"use client";

// Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

type Status = 'loading' | 'success' | 'error' | 'already_confirmed';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const supabase = createClient();

  useEffect(() => {
    confirmEmail();
  }, [searchParams]);

  const confirmEmail = async () => {
    try {
      const token_hash = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (!token_hash || type !== 'email') {
        setStatus('error');
        setErrorMessage('Lien de confirmation invalide');
        return;
      }

      // Vérifier l'OTP
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'email',
      });

      if (error) {
        // Vérifier si l'email est déjà confirmé
        if (error.message.includes('already') || error.message.includes('expired')) {
          setStatus('already_confirmed');
        } else {
          setStatus('error');
          setErrorMessage(error.message);
        }
        return;
      }

      if (data.user) {
        setStatus('success');
        // Rediriger vers le dashboard après 3 secondes
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    } catch (err: any) {
      console.error('Error confirming email:', err);
      setStatus('error');
      setErrorMessage(err.message || 'Une erreur est survenue');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F9FF] to-[#E8EEFF] p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <CardTitle>Vérification en cours...</CardTitle>
              <CardDescription>
                Veuillez patienter pendant que nous confirmons votre email
              </CardDescription>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-green-600">Email confirmé !</CardTitle>
              <CardDescription>
                Votre adresse email a été vérifiée avec succès
              </CardDescription>
            </>
          )}

          {status === 'already_confirmed' && (
            <>
              <Mail className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-blue-600">Déjà confirmé</CardTitle>
              <CardDescription>
                Votre email a déjà été vérifié
              </CardDescription>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <CardTitle className="text-red-600">Erreur de confirmation</CardTitle>
              <CardDescription>
                {errorMessage || 'Impossible de confirmer votre email'}
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800 text-center">
                  Redirection vers le dashboard dans 3 secondes...
                </p>
              </div>
              <Link href="/dashboard" className="block">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Accéder au dashboard
                </Button>
              </Link>
            </div>
          )}

          {status === 'already_confirmed' && (
            <Link href="/dashboard" className="block">
              <Button className="w-full">
                Accéder au dashboard
              </Button>
            </Link>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  Le lien de confirmation est peut-être expiré ou invalide.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Se connecter
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="w-full">
                    S'inscrire
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 text-center">
                Cela ne devrait prendre que quelques secondes...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
