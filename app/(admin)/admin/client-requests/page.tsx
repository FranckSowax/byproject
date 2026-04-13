"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Eye,
  Copy,
  Package,
  Users,
  ShoppingCart,
  FileText,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { RequestStatusBadge } from '@/components/client-request/RequestStatusBadge';
import type { ClientRequestStatus } from '@/lib/types/marketplace';

interface ClientRequestRow {
  id: string;
  public_uuid: string;
  request_number: string;
  client_name: string | null;
  client_email: string | null;
  client_company: string | null;
  status: ClientRequestStatus;
  title: string | null;
  item_count: number;
  result_count: number;
  created_at: string;
  submitted_at: string | null;
}

export default function AdminClientRequestsPage() {
  const [requests, setRequests] = useState<ClientRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [creating, setCreating] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/client-requests?${params}`);
      const json = await res.json();

      if (res.ok) {
        setRequests(json.data || []);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const createRequest = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/admin/client-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Nouvelle requête' }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success('Requête créée');
        // Copy client URL
        const clientUrl = `${window.location.origin}/client-request/${json.public_uuid}`;
        navigator.clipboard.writeText(clientUrl);
        toast.info('Lien client copié dans le presse-papier');
        fetchRequests();
      }
    } catch {
      toast.error('Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const copyClientLink = (uuid: string) => {
    const url = `${window.location.origin}/client-request/${uuid}`;
    navigator.clipboard.writeText(url);
    toast.success('Lien copié');
  };

  const filtered = requests.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.request_number.toLowerCase().includes(q) ||
      r.client_name?.toLowerCase().includes(q) ||
      r.client_email?.toLowerCase().includes(q) ||
      r.client_company?.toLowerCase().includes(q)
    );
  });

  // Stats
  const stats = {
    total: requests.length,
    submitted: requests.filter(r => r.status === 'submitted').length,
    searching: requests.filter(r => r.status === 'searching' || r.status === 'search_complete').length,
    proposals: requests.filter(r => r.status === 'proposal_ready' || r.status === 'proposal_reviewed').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Requêtes Client</h1>
          <p className="text-muted-foreground">
            Gestion des demandes de sourcing client (workflow Twinsk)
          </p>
        </div>
        <Button onClick={createRequest} disabled={creating}>
          {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Nouvelle requête
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.submitted}</p>
                <p className="text-xs text-muted-foreground">Soumises</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.searching}</p>
                <p className="text-xs text-muted-foreground">En recherche</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.proposals}</p>
                <p className="text-xs text-muted-foreground">Propositions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom, email, référence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillon</SelectItem>
                <SelectItem value="submitted">Soumise</SelectItem>
                <SelectItem value="searching">Recherche</SelectItem>
                <SelectItem value="search_complete">Recherche terminée</SelectItem>
                <SelectItem value="proposal_ready">Proposition envoyée</SelectItem>
                <SelectItem value="proposal_reviewed">Client a répondu</SelectItem>
                <SelectItem value="accepted">Acceptée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-center">Articles</TableHead>
                  <TableHead className="text-center">Résultats</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucune requête trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-sm">
                        {req.request_number}
                        {req.title && (
                          <div className="text-xs text-muted-foreground">{req.title}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{req.client_name || '-'}</div>
                        <div className="text-xs text-muted-foreground">{req.client_email || ''}</div>
                        {req.client_company && (
                          <div className="text-xs text-muted-foreground">{req.client_company}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <RequestStatusBadge status={req.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{req.item_count}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{req.result_count}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Copier lien client"
                            onClick={() => copyClientLink(req.public_uuid)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Link href={`/admin/client-requests/${req.id}`}>
                            <Button variant="ghost" size="icon" title="Voir détail">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
