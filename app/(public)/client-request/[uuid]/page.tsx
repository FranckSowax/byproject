'use client';

import { use } from 'react';
import { useClientRequest } from '@/hooks/useClientRequest';
import { ClientRequestForm } from '@/components/client-request/ClientRequestForm';
import { RequestStatusBadge } from '@/components/client-request/RequestStatusBadge';
import { Loader2, ShoppingBag } from 'lucide-react';

interface PageProps {
  params: Promise<{ uuid: string }>;
}

export default function ClientRequestPage({ params }: PageProps) {
  const { uuid } = use(params);
  const {
    request,
    items,
    isLoading,
    error,
    addItem,
    deleteItem,
    submitRequest,
  } = useClientRequest(uuid);

  if (isLoading && !request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Requête introuvable</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Votre demande de sourcing</h1>
          </div>
          {request && (
            <div className="flex items-center justify-center gap-3">
              <span className="text-sm text-muted-foreground">
                Réf: {request.request_number}
              </span>
              <RequestStatusBadge status={request.status as any} />
            </div>
          )}
          <p className="text-muted-foreground mt-2">
            Ajoutez les articles que vous recherchez avec des images et descriptions.
            Notre équipe trouvera les meilleurs fournisseurs pour vous.
          </p>
        </div>

        {/* Form */}
        <ClientRequestForm
          items={items.map(i => ({
            id: i.id,
            name: i.name,
            description: i.description,
            quantity: i.quantity,
            images: i.images || [],
          }))}
          onAddItem={addItem}
          onDeleteItem={deleteItem}
          onSubmit={submitRequest}
          isSubmitted={request?.status !== 'draft'}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
