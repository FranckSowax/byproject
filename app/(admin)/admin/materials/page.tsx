"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  Search,
  RefreshCw,
  MoreVertical,
  Eye,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Layers,
  Download,
  Filter,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface MaterialPrice {
  id: number;
  supplier_name: string;
  country: string;
  amount: number;
  currency: string;
  converted_amount: number | null;
  created_at: string;
}

interface Material {
  id: string;
  name: string;
  category: string | null;
  specs: any;
  project_id: string;
  project_name: string;
  quantity: number | null;
  weight: number | null;
  volume: number | null;
  prices: MaterialPrice[];
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
  price_count: number;
  supplier_count: number;
}

interface ConsolidatedMaterial {
  name: string;
  category: string | null;
  occurrences: number;
  total_quantity: number;
  projects: string[];
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
  price_count: number;
  suppliers: string[];
  materials: Material[];
}

export default function AdminMaterialsPage() {
  const supabase = createClient();
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [consolidatedMaterials, setConsolidatedMaterials] = useState<ConsolidatedMaterial[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<ConsolidatedMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'consolidated' | 'detailed'>('consolidated');
  
  const [selectedMaterial, setSelectedMaterial] = useState<ConsolidatedMaterial | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [searchTerm, categoryFilter, priceFilter, consolidatedMaterials, viewMode]);

  const loadMaterials = async () => {
    try {
      setLoading(true);

      // Load all materials with their projects and prices
      const { data: materialsData, error: materialsError } = await supabase
        .from('materials')
        .select(`
          *,
          project:projects(id, name),
          prices(
            id,
            amount,
            currency,
            converted_amount,
            country,
            created_at,
            supplier:suppliers(name)
          )
        `)
        .order('name');

      if (materialsError) throw materialsError;

      // Transform data
      const transformedMaterials: Material[] = (materialsData || []).map((mat: any) => {
        const prices: MaterialPrice[] = (mat.prices || []).map((p: any) => ({
          id: p.id,
          supplier_name: p.supplier?.name || 'Unknown',
          country: p.country || 'N/A',
          amount: p.amount,
          currency: p.currency,
          converted_amount: p.converted_amount,
          created_at: p.created_at,
        }));

        const amounts = prices
          .map(p => p.converted_amount || p.amount)
          .filter(a => a > 0);

        const uniqueSuppliers = [...new Set(prices.map(p => p.supplier_name))];

        return {
          id: mat.id,
          name: mat.name,
          category: mat.category,
          specs: mat.specs,
          project_id: mat.project_id,
          project_name: mat.project?.name || 'Unknown Project',
          quantity: mat.quantity,
          weight: mat.weight,
          volume: mat.volume,
          prices,
          min_price: amounts.length > 0 ? Math.min(...amounts) : null,
          max_price: amounts.length > 0 ? Math.max(...amounts) : null,
          avg_price: amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : null,
          price_count: prices.length,
          supplier_count: uniqueSuppliers.length,
        };
      });

      setMaterials(transformedMaterials);
      consolidateMaterials(transformedMaterials);
    } catch (error) {
      console.error('Error loading materials:', error);
      toast.error('Erreur lors du chargement des matériaux');
    } finally {
      setLoading(false);
    }
  };

  const consolidateMaterials = (mats: Material[]) => {
    // Group materials by name (case-insensitive)
    const grouped = mats.reduce((acc, mat) => {
      const key = mat.name.toLowerCase().trim();
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(mat);
      return acc;
    }, {} as Record<string, Material[]>);

    // Create consolidated entries
    const consolidated: ConsolidatedMaterial[] = Object.values(grouped).map((group) => {
      const allPrices = group.flatMap(m => m.prices);
      const amounts = allPrices
        .map(p => p.converted_amount || p.amount)
        .filter(a => a > 0);
      
      const uniqueSuppliers = [...new Set(allPrices.map(p => p.supplier_name))];
      const uniqueProjects = [...new Set(group.map(m => m.project_name))];
      
      return {
        name: group[0].name,
        category: group[0].category,
        occurrences: group.length,
        total_quantity: group.reduce((sum, m) => sum + (m.quantity || 0), 0),
        projects: uniqueProjects,
        min_price: amounts.length > 0 ? Math.min(...amounts) : null,
        max_price: amounts.length > 0 ? Math.max(...amounts) : null,
        avg_price: amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : null,
        price_count: allPrices.length,
        suppliers: uniqueSuppliers,
        materials: group,
      };
    });

    // Sort by occurrences (most common first)
    consolidated.sort((a, b) => b.occurrences - a.occurrences);
    
    setConsolidatedMaterials(consolidated);
  };

  const filterMaterials = () => {
    let filtered = consolidatedMaterials;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (mat) =>
          mat.name.toLowerCase().includes(term) ||
          mat.category?.toLowerCase().includes(term) ||
          mat.suppliers.some(s => s.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((mat) => mat.category === categoryFilter);
    }

    // Price filter
    if (priceFilter !== 'all') {
      if (priceFilter === 'with_prices') {
        filtered = filtered.filter((mat) => mat.price_count > 0);
      } else if (priceFilter === 'no_prices') {
        filtered = filtered.filter((mat) => mat.price_count === 0);
      }
    }

    setFilteredMaterials(filtered);
  };

  const exportToCSV = () => {
    try {
      const headers = [
        'Matériau',
        'Catégorie',
        'Occurrences',
        'Quantité totale',
        'Projets',
        'Prix Min (FCFA)',
        'Prix Moy (FCFA)',
        'Prix Max (FCFA)',
        'Nombre cotations',
        'Fournisseurs',
      ];

      const rows = filteredMaterials.map((mat) => [
        mat.name,
        mat.category || 'N/A',
        mat.occurrences,
        mat.total_quantity,
        mat.projects.join('; '),
        mat.min_price ? mat.min_price.toFixed(0) : 'N/A',
        mat.avg_price ? mat.avg_price.toFixed(0) : 'N/A',
        mat.max_price ? mat.max_price.toFixed(0) : 'N/A',
        mat.price_count,
        mat.suppliers.join('; '),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `catalogue_materiaux_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('Export CSV réussi');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getPriceVariation = (min: number | null, max: number | null) => {
    if (!min || !max || min === max) return 0;
    return ((max - min) / min) * 100;
  };

  const openViewDialog = (material: ConsolidatedMaterial) => {
    setSelectedMaterial(material);
    setIsViewDialogOpen(true);
  };

  // Get unique categories for filter
  const categories = [...new Set(materials.map(m => m.category).filter(Boolean))];
  
  // Calculate stats
  const totalMaterials = consolidatedMaterials.length;
  const materialsWithPrices = consolidatedMaterials.filter(m => m.price_count > 0).length;
  const totalPriceQuotes = consolidatedMaterials.reduce((sum, m) => sum + m.price_count, 0);
  const totalSuppliers = [...new Set(consolidatedMaterials.flatMap(m => m.suppliers))].length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            Catalogue Global des Matériaux
          </h1>
          <p className="text-gray-600 mt-1">
            Base de données consolidée de tous les matériaux cotés
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadMaterials}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Matériaux Uniques</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalMaterials}</div>
            <p className="text-xs text-gray-500 mt-1">
              Base de données consolidée
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avec Cotations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{materialsWithPrices}</div>
            <p className="text-xs text-gray-500 mt-1">
              {totalMaterials > 0 ? Math.round((materialsWithPrices / totalMaterials) * 100) : 0}% du catalogue
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Cotations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{totalPriceQuotes}</div>
            <p className="text-xs text-gray-500 mt-1">
              Prix collectés
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Fournisseurs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{totalSuppliers}</div>
            <p className="text-xs text-gray-500 mt-1">
              Sources uniques
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher matériaux, catégories, fournisseurs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 px-3 rounded-md border border-gray-300 bg-white"
            >
              <option value="all">Toutes catégories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat || 'null'}>
                  {cat || 'Sans catégorie'}
                </option>
              ))}
            </select>
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="h-10 px-3 rounded-md border border-gray-300 bg-white"
            >
              <option value="all">Tous les prix</option>
              <option value="with_prices">Avec cotations</option>
              <option value="no_prices">Sans cotations</option>
            </select>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {filteredMaterials.length} matériau(x) trouvé(s)
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matériau</TableHead>
                <TableHead>Occurrences</TableHead>
                <TableHead>Projets</TableHead>
                <TableHead className="text-right">Prix Min</TableHead>
                <TableHead className="text-right">Prix Moy</TableHead>
                <TableHead className="text-right">Prix Max</TableHead>
                <TableHead className="text-center">Variation</TableHead>
                <TableHead>Cotations</TableHead>
                <TableHead>Fournisseurs</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                    <p className="mt-2 text-gray-600">Chargement du catalogue...</p>
                  </TableCell>
                </TableRow>
              ) : filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">Aucun matériau trouvé</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material, idx) => {
                  const variation = getPriceVariation(material.min_price, material.max_price);
                  return (
                    <TableRow key={idx}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{material.name}</div>
                          {material.category && (
                            <Badge variant="outline" className="mt-1">
                              {material.category}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {material.occurrences}x
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {material.projects.length} projet(s)
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium text-green-600">
                          {formatPrice(material.min_price)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium text-blue-600">
                          {formatPrice(material.avg_price)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium text-red-600">
                          {formatPrice(material.max_price)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {variation > 0 ? (
                          <div className="flex items-center justify-center gap-1">
                            {variation > 50 ? (
                              <TrendingUp className="h-4 w-4 text-red-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-yellow-600" />
                            )}
                            <span className={`text-sm ${variation > 50 ? 'text-red-600' : 'text-yellow-600'}`}>
                              {variation.toFixed(0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{material.price_count}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{material.suppliers.length}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openViewDialog(material)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir détails complets
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              {selectedMaterial?.name}
            </DialogTitle>
            <DialogDescription>
              Détails complets et historique des cotations
            </DialogDescription>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-600">Occurrences</div>
                  <div className="text-2xl font-bold text-blue-600 mt-1">
                    {selectedMaterial.occurrences}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-600">Projets</div>
                  <div className="text-2xl font-bold text-purple-600 mt-1">
                    {selectedMaterial.projects.length}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-600">Cotations</div>
                  <div className="text-2xl font-bold text-green-600 mt-1">
                    {selectedMaterial.price_count}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-600">Fournisseurs</div>
                  <div className="text-2xl font-bold text-orange-600 mt-1">
                    {selectedMaterial.suppliers.length}
                  </div>
                </div>
              </div>

              {/* Price Range */}
              {selectedMaterial.price_count > 0 && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Fourchette de Prix
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Minimum</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(selectedMaterial.min_price)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Moyenne</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatPrice(selectedMaterial.avg_price)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Maximum</div>
                      <div className="text-lg font-bold text-red-600">
                        {formatPrice(selectedMaterial.max_price)}
                      </div>
                    </div>
                  </div>
                  {selectedMaterial.min_price && selectedMaterial.max_price && (
                    <div className="mt-3 text-sm text-gray-600">
                      Variation: {getPriceVariation(selectedMaterial.min_price, selectedMaterial.max_price).toFixed(1)}%
                    </div>
                  )}
                </div>
              )}

              {/* Projects */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Projets ({selectedMaterial.projects.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedMaterial.projects.map((project, idx) => (
                    <Badge key={idx} variant="outline">
                      {project}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Suppliers */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Fournisseurs ({selectedMaterial.suppliers.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedMaterial.suppliers.map((supplier, idx) => (
                    <Badge key={idx} variant="secondary">
                      {supplier}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Detailed Occurrences */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Détails par Occurrence ({selectedMaterial.materials.length})
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Projet</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead className="text-right">Prix</TableHead>
                        <TableHead>Fournisseur</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedMaterial.materials.map((mat, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {mat.project_name}
                          </TableCell>
                          <TableCell>
                            {mat.quantity || 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            {mat.prices.length > 0 ? (
                              <div className="space-y-1">
                                {mat.prices.map((price, pidx) => (
                                  <div key={pidx} className="text-sm">
                                    {formatPrice(price.converted_amount || price.amount)}
                                    <span className="text-xs text-gray-500 ml-1">
                                      ({price.currency})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">Pas de prix</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {mat.prices.length > 0 ? (
                              <div className="space-y-1">
                                {mat.prices.map((price, pidx) => (
                                  <div key={pidx} className="text-sm">
                                    {price.supplier_name}
                                    <span className="text-xs text-gray-500 ml-1">
                                      ({price.country})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
