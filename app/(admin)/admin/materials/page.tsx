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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Layers,
  Download,
  BarChart3,
  Image as ImageIcon,
  Globe,
  Calendar,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

interface SupplierInfo {
  id: string;
  name: string;
  email?: string;
  country?: string;
}

interface MaterialPrice {
  id: number | string;
  supplier_name: string;
  country: string;
  amount: number;
  currency: string;
  converted_amount: number | null;
  created_at: string;
  variations?: any[];
  source?: 'database' | 'quotation';
  supplier?: SupplierInfo;
}

interface Material {
  id: string;
  name: string;
  original_name?: string;
  category: string | null;
  description?: string | null;
  specs: any;
  project_id: string;
  project_name: string;
  quantity: number | null;
  weight: number | null;
  volume: number | null;
  images?: string[];
  prices: MaterialPrice[];
  quotation_prices?: MaterialPrice[];
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
  price_count: number;
  supplier_count: number;
  source?: 'database' | 'quotation';
  submitted_at?: string;
}

interface ConsolidatedMaterial {
  name: string;
  category: string | null;
  description: string | null;
  occurrences: number;
  total_quantity: number;
  projects: string[];
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
  price_count: number;
  suppliers: SupplierInfo[];
  materials: Material[];
  images: string[];
  has_quotation_prices: boolean;
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
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const [selectedMaterial, setSelectedMaterial] = useState<ConsolidatedMaterial | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    filterMaterials();
  }, [searchTerm, categoryFilter, priceFilter, sourceFilter, consolidatedMaterials]);

  const loadMaterials = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/materials');
      if (!response.ok) throw new Error('Failed to fetch materials');

      const materialsData = await response.json();

      // Transform data
      const transformedMaterials: Material[] = (materialsData || []).map((mat: any) => {
        // Combine prices from database and quotations
        const dbPrices: MaterialPrice[] = (mat.prices || []).map((p: any) => ({
          id: p.id,
          supplier_name: p.supplier?.name || 'Unknown',
          country: p.country || p.supplier?.country || 'N/A',
          amount: p.amount,
          currency: p.currency,
          converted_amount: p.converted_amount,
          created_at: p.created_at,
          variations: p.variations || [],
          source: 'database' as const,
          supplier: p.supplier,
        }));

        const quotationPrices: MaterialPrice[] = (mat.quotation_prices || []).map((p: any) => ({
          id: p.id,
          supplier_name: p.supplier_name || p.supplier?.name || 'Unknown',
          country: p.country || p.supplier?.country || 'Chine',
          amount: p.amount,
          currency: p.currency || 'CNY',
          converted_amount: p.converted_amount || null,
          created_at: p.created_at,
          variations: p.variations || [],
          source: 'quotation' as const,
          supplier: p.supplier,
        }));

        const allPrices = [...dbPrices, ...quotationPrices];
        const amounts = allPrices
          .map(p => p.converted_amount || p.amount)
          .filter(a => a > 0);

        const uniqueSuppliers = [...new Set(allPrices.map(p => p.supplier_name))];

        return {
          id: mat.id,
          name: mat.name,
          original_name: mat.original_name,
          category: mat.category,
          description: mat.description,
          specs: mat.specs,
          project_id: mat.project_id,
          project_name: mat.project?.name || mat.project_name || 'Unknown Project',
          quantity: mat.quantity,
          weight: mat.weight,
          volume: mat.volume,
          images: mat.images || [],
          prices: allPrices,
          min_price: amounts.length > 0 ? Math.min(...amounts) : null,
          max_price: amounts.length > 0 ? Math.max(...amounts) : null,
          avg_price: amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : null,
          price_count: allPrices.length,
          supplier_count: uniqueSuppliers.length,
          source: mat.source,
          submitted_at: mat.submitted_at,
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

      // Get unique suppliers with their info
      const suppliersMap = new Map<string, SupplierInfo>();
      allPrices.forEach(p => {
        if (p.supplier?.id && !suppliersMap.has(p.supplier.id)) {
          suppliersMap.set(p.supplier.id, p.supplier);
        } else if (!suppliersMap.has(p.supplier_name)) {
          suppliersMap.set(p.supplier_name, {
            id: p.supplier_name,
            name: p.supplier_name,
            country: p.country,
          });
        }
      });

      const uniqueProjects = [...new Set(group.map(m => m.project_name))];
      const allImages = [...new Set(group.flatMap(m => m.images || []))];
      const hasQuotationPrices = allPrices.some(p => p.source === 'quotation');
      const description = group.find(m => m.description)?.description || null;

      return {
        name: group[0].name,
        category: group[0].category,
        description,
        occurrences: group.length,
        total_quantity: group.reduce((sum, m) => sum + (m.quantity || 0), 0),
        projects: uniqueProjects,
        min_price: amounts.length > 0 ? Math.min(...amounts) : null,
        max_price: amounts.length > 0 ? Math.max(...amounts) : null,
        avg_price: amounts.length > 0 ? amounts.reduce((a, b) => a + b, 0) / amounts.length : null,
        price_count: allPrices.length,
        suppliers: Array.from(suppliersMap.values()),
        materials: group,
        images: allImages,
        has_quotation_prices: hasQuotationPrices,
      };
    });

    // Sort by most recent quotations first, then by occurrences
    consolidated.sort((a, b) => {
      if (a.has_quotation_prices && !b.has_quotation_prices) return -1;
      if (!a.has_quotation_prices && b.has_quotation_prices) return 1;
      return b.price_count - a.price_count;
    });

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
          mat.description?.toLowerCase().includes(term) ||
          mat.suppliers.some(s => s.name.toLowerCase().includes(term))
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

    // Source filter
    if (sourceFilter !== 'all') {
      if (sourceFilter === 'quotation') {
        filtered = filtered.filter((mat) => mat.has_quotation_prices);
      } else if (sourceFilter === 'database') {
        filtered = filtered.filter((mat) => !mat.has_quotation_prices && mat.price_count > 0);
      }
    }

    setFilteredMaterials(filtered);
  };

  const exportToCSV = () => {
    try {
      const headers = [
        'Matériau',
        'Catégorie',
        'Description',
        'Projets',
        'Prix Min (CNY)',
        'Prix Moy (CNY)',
        'Prix Max (CNY)',
        'Cotations',
        'Fournisseurs',
        'Source',
      ];

      const rows = filteredMaterials.map((mat) => [
        mat.name,
        mat.category || 'N/A',
        mat.description || 'N/A',
        mat.projects.join('; '),
        mat.min_price ? mat.min_price.toFixed(0) : 'N/A',
        mat.avg_price ? mat.avg_price.toFixed(0) : 'N/A',
        mat.max_price ? mat.max_price.toFixed(0) : 'N/A',
        mat.price_count,
        mat.suppliers.map(s => s.name).join('; '),
        mat.has_quotation_prices ? 'Quotation' : 'Database',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `materiaux_fournisseurs_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('Export CSV réussi');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error("Erreur lors de l'export");
    }
  };

  const formatCNY = (price: number | null) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
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
  const materialsFromQuotations = consolidatedMaterials.filter(m => m.has_quotation_prices).length;
  const totalPriceQuotes = consolidatedMaterials.reduce((sum, m) => sum + m.price_count, 0);
  const totalSuppliers = [...new Set(consolidatedMaterials.flatMap(m => m.suppliers.map(s => s.name)))].length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-blue-600" />
            Matériaux & Prix Fournisseurs
          </h1>
          <p className="text-gray-600 mt-1">
            Catalogue des matériaux avec prix collectés des fournisseurs
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Matériaux Uniques</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{totalMaterials}</div>
            <p className="text-xs text-gray-500 mt-1">
              Base consolidée
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avec Prix</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{materialsWithPrices}</div>
            <p className="text-xs text-gray-500 mt-1">
              {totalMaterials > 0 ? Math.round((materialsWithPrices / totalMaterials) * 100) : 0}% du catalogue
            </p>
          </CardContent>
        </Card>
        <Card className="border-purple-200 bg-purple-50/30">
          <CardHeader className="pb-2">
            <CardDescription className="text-purple-700">Depuis Quotations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{materialsFromQuotations}</div>
            <p className="text-xs text-purple-600 mt-1">
              Réponses fournisseurs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Prix</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{totalPriceQuotes}</div>
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
            <div className="text-3xl font-bold text-indigo-600">{totalSuppliers}</div>
            <p className="text-xs text-gray-500 mt-1">
              Sources uniques
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher matériaux, fournisseurs..."
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
              <option value="with_prices">Avec prix</option>
              <option value="no_prices">Sans prix</option>
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="h-10 px-3 rounded-md border border-gray-300 bg-white"
            >
              <option value="all">Toutes sources</option>
              <option value="quotation">Depuis Quotations</option>
              <option value="database">Base de données</option>
            </select>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {filteredMaterials.length} matériau(x) trouvé(s)
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-2 text-gray-600">Chargement du catalogue...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-600">Aucun matériau trouvé</p>
          </div>
        ) : (
          filteredMaterials.map((material, idx) => {
            const variation = getPriceVariation(material.min_price, material.max_price);
            const mainImage = material.images[0];

            return (
              <Card
                key={idx}
                className={`hover:shadow-lg transition-shadow cursor-pointer ${
                  material.has_quotation_prices ? 'border-purple-200 bg-purple-50/20' : ''
                }`}
                onClick={() => openViewDialog(material)}
              >
                <CardContent className="p-4">
                  {/* Image */}
                  <div className="relative h-40 mb-3 bg-gray-100 rounded-lg overflow-hidden">
                    {mainImage ? (
                      <Image
                        src={mainImage}
                        alt={material.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                    {material.has_quotation_prices && (
                      <Badge className="absolute top-2 right-2 bg-purple-600">
                        <Globe className="h-3 w-3 mr-1" />
                        Quotation
                      </Badge>
                    )}
                    {material.images.length > 1 && (
                      <Badge variant="secondary" className="absolute bottom-2 right-2">
                        <ImageIcon className="h-3 w-3 mr-1" />
                        {material.images.length}
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="space-y-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {material.name}
                      </h3>
                      {material.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {material.category}
                        </Badge>
                      )}
                    </div>

                    {material.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {material.description}
                      </p>
                    )}

                    {/* Price Range */}
                    {material.price_count > 0 ? (
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-600 font-medium">
                            {formatCNY(material.min_price)}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-red-600 font-medium">
                            {formatCNY(material.max_price)}
                          </span>
                        </div>
                        {variation > 0 && (
                          <div className="flex items-center justify-center mt-1 text-xs text-gray-500">
                            {variation > 50 ? (
                              <TrendingUp className="h-3 w-3 text-red-500 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 text-yellow-500 mr-1" />
                            )}
                            Variation: {variation.toFixed(0)}%
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-2 bg-gray-50 rounded-lg text-center text-sm text-gray-400">
                        Pas de prix disponible
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-3 w-3" />
                        {material.price_count} prix
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {material.suppliers.length} fournisseur(s)
                      </div>
                      <div className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {material.projects.length} projet(s)
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              {selectedMaterial?.name}
              {selectedMaterial?.has_quotation_prices && (
                <Badge className="bg-purple-600 ml-2">
                  <Globe className="h-3 w-3 mr-1" />
                  Prix Fournisseurs
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Détails complets et historique des prix
            </DialogDescription>
          </DialogHeader>
          {selectedMaterial && (
            <div className="space-y-6">
              {/* Images Gallery */}
              {selectedMaterial.images.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Images ({selectedMaterial.images.length})
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedMaterial.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                        onClick={() => setSelectedImage(img)}
                      >
                        <Image
                          src={img}
                          alt={`${selectedMaterial.name} - ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedMaterial.description && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{selectedMaterial.description}</p>
                </div>
              )}

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
                  <div className="text-sm text-gray-600">Prix Collectés</div>
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
                <div className="p-4 border rounded-lg bg-gradient-to-r from-green-50 via-blue-50 to-red-50">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Fourchette de Prix (CNY)
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-600">Minimum</div>
                      <div className="text-xl font-bold text-green-600">
                        {formatCNY(selectedMaterial.min_price)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Moyenne</div>
                      <div className="text-xl font-bold text-blue-600">
                        {formatCNY(selectedMaterial.avg_price)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Maximum</div>
                      <div className="text-xl font-bold text-red-600">
                        {formatCNY(selectedMaterial.max_price)}
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

              {/* Suppliers with Prices */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Prix par Fournisseur
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Pays</TableHead>
                        <TableHead className="text-right">Prix</TableHead>
                        <TableHead>Devise</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedMaterial.materials.flatMap(mat =>
                        mat.prices.map((price, pidx) => (
                          <TableRow key={`${mat.id}-${pidx}`}>
                            <TableCell className="font-medium">
                              {price.supplier_name}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3 text-gray-400" />
                                {price.country}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-blue-600">
                              {formatCNY(price.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{price.currency}</Badge>
                            </TableCell>
                            <TableCell>
                              {price.source === 'quotation' ? (
                                <Badge className="bg-purple-100 text-purple-700">
                                  Quotation
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  Database
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {price.created_at ? new Date(price.created_at).toLocaleDateString('fr-FR') : 'N/A'}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Projects */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Projets ({selectedMaterial.projects.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedMaterial.projects.map((project, idx) => (
                    <Badge key={idx} variant="outline" className="py-1 px-3">
                      {project}
                    </Badge>
                  ))}
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

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <div className="relative aspect-video">
              <Image
                src={selectedImage}
                alt="Image agrandie"
                fill
                className="object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
