"use client";
// @ts-nocheck

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Copy, 
  ExternalLink, 
  Package, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Send,
  Edit,
  Trash2,
  Search,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SupplierRequest {
  id: string;
  request_number: string;
  project_id: string;
  status: string;
  num_suppliers: number;
  public_token: string;
  created_at: string;
  expires_at: string | null;
  total_materials: number;
  filled_materials: number;
  progress_percentage: number;
  projects?: {
    name: string;
  };
}

const statusConfig = {
  pending_admin: { label: 'En attente admin', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  pending: { label: 'En attente', color: 'bg-blue-100 text-blue-800', icon: Clock },
  sent: { label: 'Envoyée', color: 'bg-purple-100 text-purple-800', icon: Send },
  in_progress: { label: 'En cours', color: 'bg-orange-100 text-orange-800', icon: Package },
  completed: { label: 'Terminée', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function SupplierRequestsPage() {
  const [requests, setRequests] = useState<SupplierRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('supplier_requests')
        .select(`
          *,
          projects (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setIsLoading(false);
    }
  };

  const copySupplierLink = (token: string) => {
    const link = `${window.location.origin}/supplier-quote/${token}`;
    navigator.clipboard.writeText(link);
    toast.success('Lien copié dans le presse-papier !');
  };

  const openSupplierLink = (token: string) => {
    const link = `${window.location.origin}/supplier-quote/${token}`;
    window.open(link, '_blank');
  };

  const filteredRequests = requests.filter(req => 
    req.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.projects?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Demandes de Cotation
          </h1>
          <p className="text-gray-600">
            Gérez vos demandes et partagez les liens avec les fournisseurs
          </p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par numéro ou projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Aucune demande trouvée' : 'Aucune demande de cotation'}
              </p>
              <Link href="/dashboard/quote-request">
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Créer une demande
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const StatusIcon = statusConfig[request.status as keyof typeof statusConfig]?.icon || Clock;
              const statusInfo = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;

              return (
                <Card key={request.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">
                            {request.request_number}
                          </CardTitle>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {request.projects?.name || 'Projet sans nom'}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Matériaux</p>
                          <p className="font-semibold">{request.total_materials}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Fournisseurs</p>
                          <p className="font-semibold">{request.num_suppliers}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Progression</p>
                          <p className="font-semibold">{request.progress_percentage}%</p>
                        </div>
                      </div>

                      {/* Supplier Link */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          🔗 Lien Fournisseur
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/supplier-quote/${request.public_token}`}
                            readOnly
                            className="bg-white font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copySupplierLink(request.public_token)}
                            title="Copier le lien"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openSupplierLink(request.public_token)}
                            title="Ouvrir dans un nouvel onglet"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          Partagez ce lien avec vos fournisseurs pour qu'ils puissent soumettre leurs cotations
                        </p>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            Créée le {format(new Date(request.created_at), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                        </div>
                        {request.expires_at && (
                          <span className="text-orange-600">
                            Expire le {format(new Date(request.expires_at), 'dd MMMM yyyy', { locale: fr })}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
