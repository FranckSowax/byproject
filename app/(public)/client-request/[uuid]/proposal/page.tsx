'use client';

import { use, useEffect, useState } from 'react';
import { ProposalView } from '@/components/client-request/ProposalView';
import { Loader2, FileText } from 'lucide-react';
import type { ProposalResponsePayload } from '@/lib/types/marketplace';

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default function ProposalPage({ params }: PageProps) {
  const { uuid } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProposal() {
      try {
        const res = await fetch(`/api/client-requests/${uuid}/proposal`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || 'Erreur de chargement');
          return;
        }

        setData(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProposal();
  }, [uuid]);

  const handleRespond = async (responseData: ProposalResponsePayload): Promise<boolean> => {
    try {
      const res = await fetch(`/api/client-requests/${uuid}/proposal/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData),
      });

      return res.ok;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Proposition non disponible</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Votre proposition</h1>
          </div>
          <p className="text-muted-foreground">
            Sélectionnez les articles qui vous intéressent et ajustez les quantités.
          </p>
          {data?.proposal && (
            <p className="text-sm text-muted-foreground mt-1">
              Proposition {data.proposal.proposal_number} - Valide jusqu&apos;au{' '}
              {data.proposal.valid_until
                ? new Date(data.proposal.valid_until).toLocaleDateString('fr-FR')
                : 'N/A'}
            </p>
          )}
        </div>

        <ProposalView
          items={data?.items || []}
          proposalCurrency={data?.proposal?.currency || 'EUR'}
          defaultMargin={data?.proposal?.default_margin_percent || 20}
          onRespond={handleRespond}
        />
      </div>
    </div>
  );
}
