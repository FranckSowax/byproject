"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Database,
  Search,
  Eye,
  Package,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Globe,
  Users,
  RefreshCw,
  Download,
  BarChart3,
  ArrowUpDown,
  Calendar,
  Building2,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';

interface MaterialQuotation {
  id: string;
  material_name: string;
  material_category: string | null;
  supplier_email: string;
  supplier_company: string;
  supplier_name: string;
  supplier_country: string;
  supplier_phone: string;
  supplier_whatsapp: string;
  unit_price: number;
  currency: string;
  unit: string;
  moq: number;
  variations: any[];
  converted_price_fcfa: number;
  status: string;
  created_at: string;
}

interface MaterialComparison {
  material_name: string;
  material_category: string;
  supplier_count: number;
  quotation_count: number;
  avg_price: number;
  lowest_price: number;
  highest_price: number;
  price_range: number;
  most_common_currency: string;
  lowest_quote: MaterialQuotation;
  all_quotes: MaterialQuotation[];
}

interface Stats {
  total_quotations: number;
  unique_suppliers: number;
  unique_materials: number;
  unique_countries: number;
  recent_quotations_30d: number;
  by_currency: Record<string, number>;
  by_country: Record<string, number>;
  by_category: Record<string, number>;
}

export default function MaterialQuotationsPage() {
  const [quotations, setQuotations] = useState<MaterialQuotation[]>([]);
  const [comparisons, setComparisons] = useState<MaterialComparison[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comparison');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('lowest_price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter options
  const [filterOptions, setFilterOptions] = useState<{
    materials: string[];
    categories: string[];
    countries: string[];
  }>({ materials: [], categories: [], countries: [] });

  // Detail dialog
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialComparison | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'comparison') {
        await loadComparisons();
      } else if (activeTab === 'list') {
        await loadQuotations();
      }
      await loadStats();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des donnees');
    } finally {
      setLoading(false);
    }
  };

  const loadComparisons = async () => {
    const response = await fetch('/api/admin/material-quotations?view=comparison');
    if (!response.ok) throw new Error('Failed to load comparisons');
    const data = await response.json();
    setComparisons(data.data || []);
  };

  const loadQuotations = async () => {
    const params = new URLSearchParams({
      view: 'list',
      limit: '200',
    });
    if (selectedCountry !== 'all') params.set('country', selectedCountry);
    if (selectedCategory !== 'all') params.set('category', selectedCategory);

    const response = await fetch(`/api/admin/material-quotations?${params}`);
    if (!response.ok) throw new Error('Failed to load quotations');
    const data = await response.json();
    setQuotations(data.data || []);
    setFilterOptions(data.filters || { materials: [], categories: [], countries: [] });
  };

  const loadStats = async () => {
    const response = await fetch('/api/admin/material-quotations?view=stats');
    if (!response.ok) return;
    const data = await response.json();
    setStats(data.stats || null);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price) + ' ' + currency;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'China': '🇨🇳',
      'Chine': '🇨🇳',
      'Cameroun': '🇨🇲',
      'France': '🇫🇷',
    };
    return flags[country] || '🌍';
  };

  const filteredComparisons = comparisons
    .filter(c => {
      const matchesSearch = c.material_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || c.material_category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'lowest_price':
          comparison = a.lowest_price - b.lowest_price;
          break;
        case 'supplier_count':
          comparison = a.supplier_count - b.supplier_count;
          break;
        case 'quotation_count':
          comparison = a.quotation_count - b.quotation_count;
          break;
        case 'material_name':
          comparison = a.material_name.localeCompare(b.material_name);
          break;
        default:
          comparison = a.lowest_price - b.lowest_price;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const exportToCSV = () => {
    const csv = [
      ['Materiau', 'Categorie', 'Fournisseurs', 'Prix Min', 'Prix Moyen', 'Prix Max', 'Devise'],
      ...filteredComparisons.map((c) => [
        c.material_name,
        c.material_category || '',
        c.supplier_count,
        c.lowest_price,
        c.avg_price,
        c.highest_price,
        c.most_common_currency,
      ]),
    ]
      .map((row) => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cotations_materiaux_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="h-8 w-8 text-indigo-600" />
            Base de Cotations
          </h1>
          <p className="text-gray-600 mt-1">
            Historique des prix par materiau et fournisseur
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            disabled={filteredComparisons.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Cotations</p>
                  <p className="text-3xl font-bold text-indigo-600">{stats.total_quotations}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <Database className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Materiaux</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.unique_materials}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Fournisseurs</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.unique_suppliers}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pays</p>
                  <p className="text-3xl font-bold text-green-600">{stats.unique_countries}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Globe className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">30 derniers jours</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.recent_quotations_30d}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="comparison">
            <TrendingDown className="h-4 w-4 mr-2" />
            Comparaison Prix
          </TabsTrigger>
          <TabsTrigger value="list">
            <Database className="h-4 w-4 mr-2" />
            Toutes les Cotations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="mt-4">
          {/* Filters */}
          <Card className="mb-4">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher un materiau..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lowest_price">Prix le plus bas</SelectItem>
                    <SelectItem value="supplier_count">Nombre fournisseurs</SelectItem>
                    <SelectItem value="quotation_count">Nombre cotations</SelectItem>
                    <SelectItem value="material_name">Nom materiau</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                {filteredComparisons.length} materiau(x) avec cotations
              </div>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Materiau</TableHead>
                    <TableHead className="text-center">Fournisseurs</TableHead>
                    <TableHead className="text-right">Prix Min</TableHead>
                    <TableHead className="text-right">Prix Moyen</TableHead>
                    <TableHead className="text-right">Prix Max</TableHead>
                    <TableHead className="text-right">Ecart</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                        <p className="mt-2 text-gray-600">Chargement...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredComparisons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <Database className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="mt-2 text-gray-600">Aucune cotation trouvee</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Les cotations apparaitront ici apres traitement des devis fournisseurs
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredComparisons.map((comparison) => (
                      <TableRow key={comparison.material_name} className="hover:bg-slate-50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {comparison.material_name}
                            </div>
                            {comparison.material_category && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {comparison.material_category}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-lg font-bold text-purple-600">
                              {comparison.supplier_count}
                            </span>
                            <span className="text-xs text-slate-500">
                              {comparison.quotation_count} cotation(s)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 text-green-600 font-semibold">
                            <TrendingDown className="h-4 w-4" />
                            {formatPrice(comparison.lowest_price, comparison.most_common_currency)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-slate-600">
                          {formatPrice(comparison.avg_price, comparison.most_common_currency)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 text-red-600">
                            <TrendingUp className="h-4 w-4" />
                            {formatPrice(comparison.highest_price, comparison.most_common_currency)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={comparison.price_range > comparison.avg_price * 0.5 ? 'text-red-600' : 'text-green-600'}>
                            {formatPrice(comparison.price_range, comparison.most_common_currency)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMaterial(comparison);
                              setIsDetailOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Materiau</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Pays</TableHead>
                    <TableHead className="text-right">Prix</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                      </TableCell>
                    </TableRow>
                  ) : quotations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12">
                        <Database className="h-12 w-12 mx-auto text-gray-400" />
                        <p className="mt-2 text-gray-600">Aucune cotation</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    quotations.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell>
                          <div className="font-medium">{q.material_name}</div>
                          {q.material_category && (
                            <Badge variant="secondary" className="text-xs">
                              {q.material_category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{q.supplier_company || q.supplier_name}</div>
                          <div className="text-xs text-slate-500">{q.supplier_email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getCountryFlag(q.supplier_country)} {q.supplier_country}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatPrice(q.unit_price, q.currency)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDate(q.created_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" />
              {selectedMaterial?.material_name}
            </DialogTitle>
            <DialogDescription>
              Comparaison des prix entre {selectedMaterial?.supplier_count} fournisseur(s)
            </DialogDescription>
          </DialogHeader>

          {selectedMaterial && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4 text-center">
                    <p className="text-sm text-green-700">Prix Min</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatPrice(selectedMaterial.lowest_price, selectedMaterial.most_common_currency)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4 text-center">
                    <p className="text-sm text-blue-700">Prix Moyen</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatPrice(selectedMaterial.avg_price, selectedMaterial.most_common_currency)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="pt-4 text-center">
                    <p className="text-sm text-red-700">Prix Max</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatPrice(selectedMaterial.highest_price, selectedMaterial.most_common_currency)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-4 text-center">
                    <p className="text-sm text-purple-700">Ecart</p>
                    <p className="text-xl font-bold text-purple-600">
                      {formatPrice(selectedMaterial.price_range, selectedMaterial.most_common_currency)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* All quotes */}
              <div>
                <h3 className="font-semibold mb-3">Toutes les cotations</h3>
                <div className="space-y-3">
                  {selectedMaterial.all_quotes
                    ?.sort((a, b) => a.unit_price - b.unit_price)
                    .map((quote, idx) => (
                      <Card key={quote.id || idx} className={idx === 0 ? 'border-green-300 bg-green-50/50' : ''}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {idx === 0 && (
                                <Badge className="bg-green-500 text-white">Meilleur prix</Badge>
                              )}
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-slate-400" />
                                  {quote.supplier_company || quote.supplier_name}
                                </div>
                                <div className="text-sm text-slate-500 flex items-center gap-2">
                                  <Mail className="h-3 w-3" />
                                  {quote.supplier_email}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-slate-900">
                                {formatPrice(quote.unit_price, quote.currency)}
                              </div>
                              <div className="text-sm text-slate-500 flex items-center gap-1 justify-end">
                                <Calendar className="h-3 w-3" />
                                {formatDate(quote.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline">
                              {getCountryFlag(quote.supplier_country)} {quote.supplier_country}
                            </Badge>
                            {quote.moq && (
                              <Badge variant="secondary">MOQ: {quote.moq}</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
