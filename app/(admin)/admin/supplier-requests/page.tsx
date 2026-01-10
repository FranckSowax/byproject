"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Globe,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Users,
  Package,
  TrendingUp,
  Calendar,
  ExternalLink,
  Edit,
  Plus,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface SupplierRequest {
  id: string;
  request_number: string;
  project_id: string;
  user_id: string;
  status: string;
  num_suppliers: number;
  total_materials: number;
  filled_materials: number;
  progress_percentage: number;
  public_token: string;
  created_at: string;
  expires_at: string | null;
  projects?: {
    name: string;
  };
  users?: {
    email: string;
    full_name: string | null;
  };
}

const statusConfig = {
  pending_admin: {
    label: 'En attente admin',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: Clock,
  },
  pending: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock,
  },
  sent: {
    label: 'Envoyé',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Send,
  },
  in_progress: {
    label: 'En cours',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: TrendingUp,
  },
  completed: {
    label: 'Complété',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  cancelled: {
    label: 'Annulé',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
};

export const dynamic = 'force-dynamic';

export default function AdminSupplierRequestsPage() {
  const [requests, setRequests] = useState<SupplierRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending_admin'); // Filtre par défaut sur les demandes en attente

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await fetch('/api/admin/supplier-requests');
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      
      const { data } = await response.json();
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const [generatingToken, setGeneratingToken] = useState<string | null>(null);

  const handleSendToSuppliers = async (requestId: string) => {
    try {
      const response = await fetch('/api/admin/supplier-requests/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to send to suppliers');
      }

      const { message } = await response.json();
      toast.success(message || 'Demande envoyée aux fournisseurs !');
      loadRequests(); // Recharger la liste
    } catch (error: any) {
      console.error('Error sending to suppliers:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi');
    }
  };

  // Générer un nouveau lien fournisseur et l'ouvrir dans un nouvel onglet
  const handleGenerateNewLink = async (requestId: string) => {
    setGeneratingToken(requestId);
    try {
      const response = await fetch(`/api/admin/supplier-requests/${requestId}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 1 }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to generate link');
      }

      const { tokens } = await response.json();
      if (tokens && tokens.length > 0) {
        // Ouvrir le nouveau lien dans un nouvel onglet
        window.open(tokens[0].url, '_blank');
        toast.success('Nouveau lien fournisseur généré');
        loadRequests(); // Recharger pour mettre à jour le compteur
      }
    } catch (error: any) {
      console.error('Error generating new link:', error);
      toast.error(error.message || 'Erreur lors de la génération du lien');
    } finally {
      setGeneratingToken(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = 
      req.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.projects as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.users as any)?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: requests.length,
    pendingAdmin: requests.filter(r => r.status === 'pending_admin').length,
    sent: requests.filter(r => r.status === 'sent').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Globe className="h-8 w-8 text-blue-600" />
            Cotations Fournisseurs Chinois
          </h1>
          <p className="text-slate-600 mt-1">Gestion des demandes de cotation</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
          <Download className="h-4 w-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <Globe className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setStatusFilter('pending_admin')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">À traiter</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pendingAdmin}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setStatusFilter('sent')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Envoyées</p>
                <p className="text-3xl font-bold text-blue-600">{stats.sent}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Send className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setStatusFilter('in_progress')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">En cours</p>
                <p className="text-3xl font-bold text-purple-600">{stats.inProgress}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setStatusFilter('completed')}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Complétées</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par numéro, projet, utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                Tous
              </Button>
              <Button
                variant={statusFilter === 'pending_admin' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending_admin')}
                size="sm"
                className={statusFilter === 'pending_admin' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                À traiter {stats.pendingAdmin > 0 && `(${stats.pendingAdmin})`}
              </Button>
              <Button
                variant={statusFilter === 'sent' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('sent')}
                size="sm"
              >
                Envoyées
              </Button>
              <Button
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('in_progress')}
                size="sm"
              >
                En cours
              </Button>
              <Button
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('completed')}
                size="sm"
              >
                Complétées
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Demandes de Cotation</CardTitle>
          <CardDescription>
            {filteredRequests.length} demande{filteredRequests.length > 1 ? 's' : ''} trouvée{filteredRequests.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Numéro</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Matériaux</TableHead>
                  <TableHead>Progression</TableHead>
                  <TableHead>Fournisseurs</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                      Aucune demande trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => {
                    const statusInfo = statusConfig[request.status as keyof typeof statusConfig];
                    const StatusIcon = statusInfo?.icon || Clock;

                    return (
                      <TableRow key={request.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="font-mono text-sm font-medium text-blue-600">
                            {request.request_number}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900">
                            {(request.projects as any)?.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium text-slate-900">
                              {(request.users as any)?.full_name || 'N/A'}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {(request.users as any)?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusInfo?.color} border`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Package className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{request.total_materials}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[80px]">
                              <div
                                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all"
                                style={{ width: `${request.progress_percentage || 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-slate-700">
                              {Math.round(request.progress_percentage || 0)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{request.num_suppliers}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-slate-600">
                            {new Date(request.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/supplier-requests/${request.id}`}>
                              <Button variant="ghost" size="sm" title="Éditer">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            {request.status === 'pending_admin' && (
                              <Button 
                                variant="default" 
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-purple-600"
                                onClick={() => handleSendToSuppliers(request.id)}
                              >
                                <Send className="h-4 w-4 mr-1" />
                                Envoyer
                              </Button>
                            )}
                            {(request.status === 'sent' || request.status === 'in_progress') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                title="Générer nouveau lien fournisseur"
                                onClick={() => handleGenerateNewLink(request.id)}
                                disabled={generatingToken === request.id}
                              >
                                {generatingToken === request.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
