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
  ExternalLink
} from 'lucide-react';
import { createServiceClient } from '@/lib/supabase/service';
import Link from 'next/link';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

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

export default function AdminSupplierRequestsPage() {
  const [requests, setRequests] = useState<SupplierRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const supabase = createServiceClient();
      
      const { data, error } = await supabase
        .from('supplier_requests' as any)
        .select(`
          *,
          projects:project_id (name),
          users:user_id (email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendToSuppliers = async (requestId: string) => {
    try {
      const supabase = createServiceClient();
      
      // Récupérer la demande avec les matériaux du projet
      const { data: request, error: requestError } = await supabase
        .from('supplier_requests' as any)
        .select('*, projects:project_id(id, name)')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Récupérer les matériaux du projet
      const { data: materials, error: materialsError } = await supabase
        .from('materials')
        .select('*')
        .eq('project_id', request.project_id);

      if (materialsError) throw materialsError;

      // Traduire les matériaux (appel API de traduction)
      const translateResponse = await fetch('/api/translate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ materials }),
      });

      if (!translateResponse.ok) throw new Error('Translation failed');
      
      const { materialsEn, materialsZh } = await translateResponse.json();

      // Générer un token public
      const publicToken = nanoid(32);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 jours

      // Mettre à jour la demande
      const { error: updateError } = await supabase
        .from('supplier_requests' as any)
        .update({
          status: 'sent',
          public_token: publicToken,
          expires_at: expiresAt.toISOString(),
          materials_data: materials,
          materials_translated_en: materialsEn,
          materials_translated_zh: materialsZh,
          total_materials: materials.length,
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      toast.success('Demande envoyée aux fournisseurs !');
      loadRequests(); // Recharger la liste
    } catch (error: any) {
      console.error('Error sending to suppliers:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi');
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
    pending: requests.filter(r => r.status === 'pending').length,
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">En attente</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
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

        <Card className="border-0 shadow-lg">
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
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                Tous
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
                size="sm"
              >
                En attente
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
                            {request.public_token && (
                              <a
                                href={`${window.location.origin}/supplier-quote/${request.public_token}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </a>
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
