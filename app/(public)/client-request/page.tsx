'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Page de landing pour les requêtes client
 * Crée automatiquement une nouvelle requête et redirige
 */
export default function ClientRequestLandingPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function createRequest() {
      try {
        const res = await fetch('/api/client-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        const json = await res.json();
        if (res.ok && json.public_uuid) {
          router.replace(`/client-request/${json.public_uuid}`);
        } else {
          setError(json.error || 'Erreur de création');
        }
      } catch (err: any) {
        setError(err.message);
      }
    }

    createRequest();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Erreur</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Création de votre demande...</p>
      </div>
    </div>
  );
}
