'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ShoppingCart,
  Send,
  Package,
  Store,
  MapPin,
  Star,
  ExternalLink,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ClientRequestItem, MarketplaceSearchResultRow, ProposalResponsePayload } from '@/lib/types/marketplace';

interface ProposalViewProps {
  items: (ClientRequestItem & { search_results: MarketplaceSearchResultRow[] })[];
  proposalCurrency: string;
  defaultMargin: number;
  onRespond: (data: ProposalResponsePayload) => Promise<boolean>;
}

const sourceLabels: Record<string, { label: string; color: string }> = {
  '1688': { label: '1688', color: 'bg-orange-100 text-orange-700' },
  taobao: { label: 'Taobao', color: 'bg-red-100 text-red-700' },
  kimi_factory: { label: 'Usine', color: 'bg-blue-100 text-blue-700' },
  manual: { label: 'Manuel', color: 'bg-gray-100 text-gray-700' },
};

export function ProposalView({ items, proposalCurrency, onRespond }: ProposalViewProps) {
  const [selections, setSelections] = useState<Record<string, { selected: boolean; quantity: number }>>(() => {
    const initial: Record<string, { selected: boolean; quantity: number }> = {};
    items.forEach(item => {
      item.search_results?.forEach(result => {
        initial[result.id] = {
          selected: result.is_selected,
          quantity: result.quantity || 1,
        };
      });
    });
    return initial;
  });
  const [clientNotes, setClientNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleSelection = (resultId: string) => {
    setSelections(prev => ({
      ...prev,
      [resultId]: {
        ...prev[resultId],
        selected: !prev[resultId]?.selected,
      },
    }));
  };

  const updateQuantity = (resultId: string, quantity: number) => {
    setSelections(prev => ({
      ...prev,
      [resultId]: {
        ...prev[resultId],
        quantity: Math.max(1, quantity),
      },
    }));
  };

  const selectedCount = Object.values(selections).filter(s => s.selected).length;
  const totalPrice = items.reduce((sum, item) => {
    return sum + (item.search_results || []).reduce((itemSum, result) => {
      const sel = selections[result.id];
      if (sel?.selected && result.client_price) {
        return itemSum + result.client_price * sel.quantity;
      }
      return itemSum;
    }, 0);
  }, 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const responseSelections = Object.entries(selections).map(([result_id, data]) => ({
      result_id,
      selected: data.selected,
      quantity: data.quantity,
    }));

    const success = await onRespond({
      selections: responseSelections,
      client_notes: clientNotes || undefined,
    });

    setIsSubmitting(false);
    if (success) {
      setSubmitted(true);
      toast.success('Votre sélection a été enregistrée !');
    }
  };

  if (submitted) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Sélection enregistrée !</h2>
            <p className="text-muted-foreground">
              Nous avons bien reçu votre choix. Notre équipe va préparer le devis final.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              {item.name}
              {item.description && (
                <span className="text-sm font-normal text-muted-foreground">
                  - {item.description}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {item.search_results && item.search_results.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {item.search_results.map((result) => {
                  const sel = selections[result.id];
                  const isSelected = sel?.selected || false;

                  return (
                    <div
                      key={result.id}
                      className={`rounded-lg border p-3 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'hover:border-muted-foreground/30'
                      }`}
                      onClick={() => toggleSelection(result.id)}
                    >
                      {/* Image */}
                      {result.image_url && (
                        <img
                          src={result.image_url}
                          alt={result.title_fr || result.title}
                          className="w-full h-40 object-cover rounded-md mb-3"
                        />
                      )}

                      {/* Source badge */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={sourceLabels[result.source]?.color || ''}>
                          {sourceLabels[result.source]?.label || result.source}
                        </Badge>
                        <Checkbox checked={isSelected} />
                      </div>

                      {/* Title */}
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {result.title_fr || result.title}
                      </h4>

                      {/* Supplier */}
                      {result.supplier_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Store className="h-3 w-3" />
                          {result.supplier_name}
                          {result.supplier_location && (
                            <>
                              <MapPin className="h-3 w-3 ml-1" />
                              {result.supplier_location}
                            </>
                          )}
                        </div>
                      )}

                      {result.supplier_rating && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {result.supplier_rating}
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-lg">
                          {result.client_price
                            ? `${result.client_price.toFixed(2)} ${result.client_currency || proposalCurrency}`
                            : 'Prix sur demande'}
                        </span>
                        {result.moq && (
                          <span className="text-xs text-muted-foreground">
                            MOQ: {result.moq}
                          </span>
                        )}
                      </div>

                      {/* Quantity selector */}
                      {isSelected && (
                        <div className="mt-3 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <span className="text-sm">Qté:</span>
                          <Input
                            type="number"
                            min={1}
                            value={sel?.quantity || 1}
                            onChange={(e) => updateQuantity(result.id, parseInt(e.target.value) || 1)}
                            className="w-20 h-8"
                          />
                        </div>
                      )}

                      {/* Product link */}
                      {result.product_url && (
                        <a
                          href={result.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 flex items-center gap-1 mt-2"
                          onClick={e => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Voir le produit
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun résultat pour cet article</p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Submit bar */}
      <Card className="sticky bottom-4">
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{selectedCount} article(s) sélectionné(s)</span>
                {totalPrice > 0 && (
                  <span className="ml-4 font-bold text-lg">
                    Total: {totalPrice.toFixed(2)} {proposalCurrency}
                  </span>
                )}
              </div>
            </div>
            <Textarea
              value={clientNotes}
              onChange={(e) => setClientNotes(e.target.value)}
              placeholder="Notes ou commentaires sur votre sélection..."
              rows={2}
            />
            <Button
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || selectedCount === 0}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              Valider ma sélection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
