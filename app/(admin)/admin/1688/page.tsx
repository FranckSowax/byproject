'use client';

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Globe,
  Search,
  Package,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Eye,
  Loader2,
  TrendingUp,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';
import { use1688Search } from '@/hooks/use1688Search';
import { Results1688 } from '@/components/1688/Results1688';
import { ProductListSearchResult } from '@/lib/types/1688';

interface SupplierRequest {
  id: string;
  request_number: string;
  project_id: string;
  user_id: string;
  status: string;
  num_suppliers: number;
  total_materials: number;
  created_at: string;
  projects?: {
    id: string;
    name: string;
  };
  users?: {
    email: string;
    full_name: string | null;
  };
}

export default function Admin1688Page() {
  const [requests, setRequests] = useState<SupplierRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<SupplierRequest | null>(null);
  const [searchResults, setSearchResults] = useState<ProductListSearchResult | null>(null);
  const [showResultsDialog, setShowResultsDialog] = useState(false);

  const {
    isLoading: isSearching,
    progress,
    results,
    error,
    searchProjectProducts,
    cancelSearch,
    clearResults,
  } = use1688Search();

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

  const handleSearch1688 = async (request: SupplierRequest) => {
    setSelectedRequest(request);
    clearResults();

    toast.info(`Lancement de la recherche 1688 pour ${request.projects?.name || 'le projet'}...`);

    const result = await searchProjectProducts(request.project_id, {
      maxResults: 10,
      translateToChines: true,
    });

    if (result) {
      setSearchResults(result);
      setShowResultsDialog(true);
      toast.success(`Recherche terminée: ${result.completedSearches} matériaux traités`);
    } else if (error) {
      toast.error(error);
    }
  };

  const handleViewResults = (request: SupplierRequest) => {
    setSelectedRequest(request);
    if (results) {
      setSearchResults(results);
      setShowResultsDialog(true);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.projects as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.users as any)?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const stats = {
    total: requests.length,
    withMaterials: requests.filter(r => r.total_materials > 0).length,
    totalMaterials: requests.reduce((acc, r) => acc + r.total_materials, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Globe className="h-8 w-8 text-orange-600" />
            Recherche 1688.com
          </h1>
          <p className="text-slate-600 mt-1">
            Rechercher des produits sur la marketplace chinoise B2B
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadRequests}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Demandes totales</p>
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
                <p className="text-sm text-slate-600">Avec matériaux</p>
                <p className="text-3xl font-bold text-green-600">{stats.withMaterials}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total matériaux</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalMaterials}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search loading indicator */}
      {isSearching && (
        <Card className="border-0 shadow-lg border-l-4 border-l-orange-500">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
                <div>
                  <p className="font-medium text-slate-900">
                    Recherche en cours sur 1688.com
                  </p>
                  {progress && (
                    <p className="text-sm text-slate-600">
                      {progress.completed}/{progress.total} - {progress.currentProduct}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {progress && (
                  <div className="w-32">
                    <div className="bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-1">
                      {progress.percentage}%
                    </p>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelSearch}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Filter */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par numéro, projet ou utilisateur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Demandes de Cotation</CardTitle>
          <CardDescription>
            Sélectionnez une demande pour lancer une recherche sur 1688.com
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
                  <TableHead>Matériaux</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      Aucune demande trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((request) => (
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
                        <Badge
                          variant={request.total_materials > 0 ? 'default' : 'secondary'}
                          className={
                            request.total_materials > 0
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : ''
                          }
                        >
                          <Package className="h-3 w-3 mr-1" />
                          {request.total_materials} matériau{request.total_materials > 1 ? 'x' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600">
                          {new Date(request.created_at).toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                            onClick={() => handleSearch1688(request)}
                            disabled={isSearching || request.total_materials === 0}
                          >
                            {isSearching && selectedRequest?.id === request.id ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4 mr-1" />
                            )}
                            Rechercher
                          </Button>
                          {results && selectedRequest?.id === request.id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewResults(request)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Résultats
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-orange-600" />
              Résultats 1688.com - {selectedRequest?.projects?.name || 'Projet'}
            </DialogTitle>
            <DialogDescription>
              Recherche pour la demande {selectedRequest?.request_number}
            </DialogDescription>
          </DialogHeader>
          <Results1688
            results={searchResults}
            isLoading={isSearching}
            error={error}
            progress={progress}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
