"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SupplierToken {
  id: string;
  label: string;
  token: string;
  url: string;
  status: 'pending' | 'viewed' | 'in_progress' | 'submitted';
  supplierInfo: {
    name?: string;
    email?: string;
    company?: string;
    country?: string;
  };
  materialsVersion: number;
  hasPendingUpdates: boolean;
  quotedMaterials: any[];
  viewCount: number;
  firstViewedAt?: string;
  lastViewedAt?: string;
  submittedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

interface SupplierLinksPanelProps {
  requestId: string;
  onSyncComplete?: () => void;
}

export function SupplierLinksPanel({ requestId, onSyncComplete }: SupplierLinksPanelProps) {
  const [tokens, setTokens] = useState<SupplierToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [needsSyncCount, setNeedsSyncCount] = useState(0);

  useEffect(() => {
    loadTokens();
  }, [requestId]);

  const loadTokens = async () => {
    try {
      const response = await fetch(`/api/admin/supplier-requests/${requestId}/tokens`);
      if (!response.ok) throw new Error('Failed to load tokens');
      const data = await response.json();
      setTokens(data.tokens);

      // Check sync status
      const syncResponse = await fetch(`/api/admin/supplier-requests/sync?requestId=${requestId}`);
      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        setNeedsSyncCount(syncData.needsSyncCount);
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
      toast.error("Erreur lors du chargement des liens");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (token: SupplierToken) => {
    try {
      await navigator.clipboard.writeText(token.url);
      setCopiedId(token.id);
      toast.success("Lien copié !");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error("Erreur lors de la copie");
    }
  };

  const handleAddToken = async () => {
    setAdding(true);
    try {
      const response = await fetch(`/api/admin/supplier-requests/${requestId}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 1 })
      });

      if (!response.ok) throw new Error('Failed to add token');
      const data = await response.json();
      toast.success(data.message);
      loadTokens();
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    if (!confirm("Supprimer ce lien fournisseur ?")) return;

    try {
      const response = await fetch(`/api/admin/supplier-requests/${requestId}/tokens`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenId })
      });

      if (!response.ok) throw new Error('Failed to delete token');
      toast.success("Lien supprimé");
      loadTokens();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/admin/supplier-requests/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId })
      });

      if (!response.ok) throw new Error('Failed to sync');
      const data = await response.json();
      toast.success(data.message);
      loadTokens();
      onSyncComplete?.();
    } catch (error) {
      toast.error("Erreur lors de la synchronisation");
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-slate-500">En attente</Badge>;
      case 'viewed':
        return <Badge className="bg-blue-100 text-blue-700 border-0">Consulté</Badge>;
      case 'in_progress':
        return <Badge className="bg-orange-100 text-orange-700 border-0">En cours</Badge>;
      case 'submitted':
        return <Badge className="bg-emerald-100 text-emerald-700 border-0">Soumis</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-violet-500" />
        <p className="text-sm text-slate-500 mt-2">Chargement des liens...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-violet-500" />
          <h3 className="font-semibold text-slate-900">Liens Fournisseurs</h3>
          <Badge variant="outline">{tokens.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {needsSyncCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="text-orange-600 border-orange-300 hover:bg-orange-50"
            >
              {syncing ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-1" />
              )}
              Synchroniser ({needsSyncCount})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddToken}
            disabled={adding}
          >
            {adding ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            Ajouter
          </Button>
        </div>
      </div>

      {/* Tokens list */}
      {tokens.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg">
          <Users className="h-10 w-10 mx-auto text-slate-300" />
          <p className="text-slate-500 mt-2">Aucun lien fournisseur</p>
          <Button onClick={handleAddToken} className="mt-3" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Créer des liens
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {tokens.map((token, index) => (
            <div
              key={token.id}
              className={cn(
                "border rounded-lg p-4 transition-all",
                token.hasPendingUpdates
                  ? "border-orange-200 bg-orange-50/50"
                  : "border-slate-200 bg-white hover:border-violet-200"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-slate-900">
                      {token.supplierInfo.company || token.supplierInfo.name || `Fournisseur ${index + 1}`}
                    </span>
                    {getStatusBadge(token.status)}
                    {token.hasPendingUpdates && (
                      <Badge className="bg-orange-500 text-white border-0 text-xs">
                        MAJ en attente
                      </Badge>
                    )}
                  </div>

                  {token.supplierInfo.email && (
                    <p className="text-sm text-slate-500">{token.supplierInfo.email}</p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    {token.viewCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {token.viewCount} vue(s)
                      </span>
                    )}
                    {token.lastViewedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(token.lastViewedAt)}
                      </span>
                    )}
                    {token.status === 'submitted' && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Soumis le {formatDate(token.submittedAt)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(token)}
                  >
                    {copiedId === token.id ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(token.url, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  {token.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteToken(token.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* URL preview */}
              <div className="mt-3 p-2 bg-slate-50 rounded text-xs font-mono text-slate-500 truncate">
                {token.url}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-slate-400 mt-4">
        Chaque fournisseur a son propre espace isolé. Vous pouvez synchroniser les mises à jour client vers tous les fournisseurs.
      </p>
    </div>
  );
}
