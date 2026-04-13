"use client";

import { use, useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Package,
  FileText,
  Eye,
  Copy,
  ExternalLink,
  Loader2,
  ArrowLeft,
  Store,
  MapPin,
  Star,
  Send,
  RefreshCw,
  FolderOpen,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { RequestStatusBadge } from '@/components/client-request/RequestStatusBadge';
import { useMarketplaceSearch } from '@/hooks/useMarketplaceSearch';
import type { ClientRequestStatus, MarketplaceSource } from '@/lib/types/marketplace';

interface PageProps {
  params: Promise<{ id: string }>;
}

const sourceLabels: Record<string, { label: string; color: string }> = {
  '1688': { label: '1688', color: 'bg-orange-100 text-orange-700' },
  taobao: { label: 'Taobao', color: 'bg-red-100 text-red-700' },
  kimi_factory: { label: 'Usine Kimi', color: 'bg-blue-100 text-blue-700' },
  manual: { label: 'Manuel', color: 'bg-gray-100 text-gray-700' },
};

export default function AdminClientRequestDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [globalMargin, setGlobalMargin] = useState(20);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  const [savingCuration, setSavingCuration] = useState(false);
  const [sendingProposal, setSendingProposal] = useState(false);
  const [converting, setConverting] = useState(false);

  const { isSearching, startSearch, totalResults: searchTotalResults } = useMarketplaceSearch();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/client-requests/${id}`);
      const json = await res.json();
      if (res.ok) {
        setData(json.data);
        // Initialize selected results
        const selected = new Set<string>();
        json.data.items?.forEach((item: any) => {
          item.search_results?.forEach((r: any) => {
            if (r.is_selected) selected.add(r.id);
          });
        });
        setSelectedResults(selected);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = async () => {
    const result = await startSearch(id);
    if (result) {
      toast.success(`Recherche terminée : ${result.totalResults} résultats`);
      fetchData();
    } else {
      toast.error('Erreur lors de la recherche');
    }
  };

  const toggleResult = (resultId: string) => {
    setSelectedResults(prev => {
      const next = new Set(prev);
      if (next.has(resultId)) {
        next.delete(resultId);
      } else {
        next.add(resultId);
      }
      return next;
    });
  };

  const saveCuration = async () => {
    setSavingCuration(true);
    try {
      const selections = Array.from(
        new Set([
          ...selectedResults,
          ...(data.items?.flatMap((item: any) =>
            item.search_results?.map((r: any) => r.id) || []
          ) || []),
        ])
      ).map(resultId => ({
        result_id: resultId,
        is_selected: selectedResults.has(resultId),
        margin_percent: globalMargin,
      }));

      const res = await fetch(`/api/admin/client-requests/${id}/results/curate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections, default_margin_percent: globalMargin }),
      });

      if (res.ok) {
        toast.success('Sélection sauvegardée');
        fetchData();
      }
    } catch {
      toast.error('Erreur de sauvegarde');
    } finally {
      setSavingCuration(false);
    }
  };

  const sendProposal = async () => {
    setSendingProposal(true);
    try {
      const res = await fetch(`/api/admin/client-requests/${id}/proposal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_margin_percent: globalMargin }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('Proposition envoyée');
        if (json.proposal_url) {
          navigator.clipboard.writeText(`${window.location.origin}${json.proposal_url}`);
          toast.info('Lien proposition copié');
        }
        fetchData();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error('Erreur envoi proposition');
    } finally {
      setSendingProposal(false);
    }
  };

  const convertToProject = async () => {
    setConverting(true);
    try {
      const res = await fetch(`/api/admin/client-requests/${id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success(`Projet créé avec ${json.materials_created} matériaux`);
        fetchData();
      } else {
        toast.error(json.error);
      }
    } catch {
      toast.error('Erreur de conversion');
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20">Requête non trouvée</div>;
  }

  const allResults = data.items?.flatMap((item: any) => item.search_results || []) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/client-requests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{data.request_number}</h1>
            <RequestStatusBadge status={data.status} />
          </div>
          <p className="text-muted-foreground">
            {data.client_name || 'Client non renseigné'}
            {data.client_email && ` - ${data.client_email}`}
            {data.client_company && ` (${data.client_company})`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/client-request/${data.public_uuid}`
              );
              toast.success('Lien copié');
            }}
          >
            <Copy className="h-4 w-4 mr-1" />
            Lien client
          </Button>
          {!data.project_id && selectedResults.size > 0 && (
            <Button variant="outline" size="sm" onClick={convertToProject} disabled={converting}>
              {converting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FolderOpen className="h-4 w-4 mr-1" />}
              Convertir en projet
            </Button>
          )}
          {data.project_id && (
            <Link href={`/dashboard/projects/${data.project_id}`}>
              <Button variant="outline" size="sm">
                <FolderOpen className="h-4 w-4 mr-1" />
                Voir le projet
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Items submitted by client */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Articles du client ({data.items?.length || 0})</CardTitle>
              <CardDescription>Articles soumis par le client avec images et descriptions</CardDescription>
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !data.items?.length}
              size="lg"
            >
              {isSearching ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              {isSearching ? 'Recherche en cours...' : 'Rechercher sur les marketplaces'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(data.items || []).map((item: any) => (
              <div key={item.id} className="rounded-lg border p-4">
                {item.images?.[0] && (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-md mb-3"
                  />
                )}
                <h4 className="font-medium">{item.name}</h4>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">Qté: {item.quantity}</span>
                  <Badge variant="outline">
                    {item.search_results?.length || 0} résultat(s)
                  </Badge>
                </div>
                {item.name_zh && (
                  <p className="text-xs text-muted-foreground mt-1">ZH: {item.name_zh}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {allResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Résultats marketplace ({allResults.length})</CardTitle>
                <CardDescription>
                  {selectedResults.size} sélectionné(s) - Marge: {globalMargin}%
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-48">
                  <span className="text-sm whitespace-nowrap">Marge: {globalMargin}%</span>
                  <Slider
                    value={[globalMargin]}
                    onValueChange={([v]) => setGlobalMargin(v)}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={saveCuration}
                  disabled={savingCuration}
                >
                  {savingCuration ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                  Sauvegarder sélection
                </Button>
                <Button
                  onClick={sendProposal}
                  disabled={sendingProposal || selectedResults.size === 0}
                >
                  {sendingProposal ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                  Envoyer proposition
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all">Tous ({allResults.length})</TabsTrigger>
                <TabsTrigger value="1688">
                  1688 ({allResults.filter((r: any) => r.source === '1688').length})
                </TabsTrigger>
                <TabsTrigger value="taobao">
                  Taobao ({allResults.filter((r: any) => r.source === 'taobao').length})
                </TabsTrigger>
                <TabsTrigger value="kimi_factory">
                  Usines ({allResults.filter((r: any) => r.source === 'kimi_factory').length})
                </TabsTrigger>
              </TabsList>

              {['all', '1688', 'taobao', 'kimi_factory'].map((tab) => (
                <TabsContent key={tab} value={tab}>
                  {(data.items || []).map((item: any) => {
                    const results = (item.search_results || []).filter(
                      (r: any) => tab === 'all' || r.source === tab
                    );
                    if (results.length === 0) return null;

                    return (
                      <div key={item.id} className="mb-6">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {item.name}
                        </h4>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {results.map((result: any) => {
                            const isSelected = selectedResults.has(result.id);

                            return (
                              <div
                                key={result.id}
                                className={`rounded-lg border p-3 cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                    : 'hover:border-muted-foreground/30'
                                }`}
                                onClick={() => toggleResult(result.id)}
                              >
                                {result.image_url && (
                                  <img
                                    src={result.image_url}
                                    alt=""
                                    className="w-full h-32 object-cover rounded-md mb-2"
                                  />
                                )}

                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className={sourceLabels[result.source]?.color || ''}>
                                    {sourceLabels[result.source]?.label || result.source}
                                  </Badge>
                                  <Checkbox checked={isSelected} />
                                </div>

                                <h5 className="text-sm font-medium line-clamp-2">
                                  {result.title_fr || result.title}
                                </h5>

                                {result.supplier_name && (
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                    <Store className="h-3 w-3" />
                                    {result.supplier_name}
                                  </div>
                                )}

                                <div className="flex items-center justify-between mt-2">
                                  {result.price_min ? (
                                    <span className="font-bold">
                                      ¥{result.price_min}
                                      {result.price_max && result.price_max !== result.price_min && `-${result.price_max}`}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">Prix N/A</span>
                                  )}
                                  {result.moq && (
                                    <span className="text-xs text-muted-foreground">MOQ: {result.moq}</span>
                                  )}
                                </div>

                                {result.product_url && (
                                  <a
                                    href={result.product_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 flex items-center gap-1 mt-1"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <ExternalLink className="h-3 w-3" /> Voir
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Proposals history */}
      {data.proposals?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Propositions envoyées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.proposals.map((proposal: any) => (
                <div key={proposal.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <span className="font-mono text-sm">{proposal.proposal_number}</span>
                    <span className="ml-3 text-sm text-muted-foreground">
                      {proposal.total_amount?.toFixed(2)} {proposal.currency}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{proposal.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(proposal.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
