'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  Search,
  Filter,
  ExternalLink,
  Star,
  MapPin,
  ShoppingCart,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  ArrowUpDown,
  RefreshCw,
  ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Product1688,
  SearchResult1688,
  ProductListSearchResult,
  CNY_TO_FCFA_RATE,
} from '@/lib/types/1688';
import { use1688Filters } from '@/hooks/use1688Search';

interface Results1688Props {
  results: ProductListSearchResult | null;
  isLoading?: boolean;
  error?: string | null;
  progress?: {
    completed: number;
    total: number;
    currentProduct: string;
    percentage: number;
  };
  onProductSelect?: (product: Product1688, searchQuery: string) => void;
}

type SortOption = 'price_asc' | 'price_desc' | 'moq_asc' | 'moq_desc' | 'rating_desc';

export function Results1688({
  results,
  isLoading = false,
  error,
  progress,
  onProductSelect,
}: Results1688Props) {
  const [selectedProduct, setSelectedProduct] = useState<Product1688 | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [sortBy, setSortBy] = useState<SortOption>('price_asc');
  const [showFilters, setShowFilters] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-600">
                  {progress?.percentage || 0}%
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium text-slate-900">
                Recherche en cours sur 1688.com
              </p>
              {progress && (
                <p className="text-sm text-slate-600 mt-1">
                  {progress.completed}/{progress.total} - {progress.currentProduct}
                </p>
              )}
            </div>
            {progress && (
              <div className="w-full max-w-xs">
                <div className="bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="border-0 shadow-lg border-red-200">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-900">Erreur de recherche</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No results
  if (!results || results.results.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-900">Aucun résultat</p>
              <p className="text-sm text-slate-600 mt-1">
                Lancez une recherche pour voir les produits de 1688.com
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort products
  const sortProducts = (products: Product1688[]): Product1688[] => {
    return [...products].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price.min - b.price.min;
        case 'price_desc':
          return b.price.min - a.price.min;
        case 'moq_asc':
          return a.moq - b.moq;
        case 'moq_desc':
          return b.moq - a.moq;
        case 'rating_desc':
          return (b.supplier.rating || 0) - (a.supplier.rating || 0);
        default:
          return 0;
      }
    });
  };

  // Filter results by search query
  const filteredResults = results.results
    .filter((result) => {
      if (!searchFilter) return true;
      return result.searchQuery.toLowerCase().includes(searchFilter.toLowerCase());
    })
    .map((result) => ({
      ...result,
      results: sortProducts(
        result.results.filter((product) => {
          const priceInFCFA = product.priceInFCFA.min;
          return priceInFCFA >= priceRange[0] && priceInFCFA <= priceRange[1];
        })
      ),
    }));

  const totalProducts = filteredResults.reduce((acc, r) => acc + r.results.length, 0);
  const successfulSearches = results.completedSearches;
  const failedSearches = results.failedSearches;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{successfulSearches}</p>
                  <p className="text-xs text-slate-600">Recherches réussies</p>
                </div>
              </div>
              {failedSearches > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{failedSearches}</p>
                    <p className="text-xs text-slate-600">Échecs</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{totalProducts}</p>
                  <p className="text-xs text-slate-600">Produits trouvés</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Rechercher un matériau
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Filtrer par nom..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Trier par
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm"
                  >
                    <option value="price_asc">Prix croissant</option>
                    <option value="price_desc">Prix décroissant</option>
                    <option value="moq_asc">MOQ croissant</option>
                    <option value="moq_desc">MOQ décroissant</option>
                    <option value="rating_desc">Meilleure note</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Prix (FCFA): {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()}
                  </label>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    min={0}
                    max={1000000}
                    step={10000}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results by product */}
      <Accordion type="multiple" className="space-y-4">
        {filteredResults.map((result, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border-0 shadow-lg rounded-xl overflow-hidden bg-white"
          >
            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-slate-50">
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-900">{result.searchQuery}</p>
                    {result.searchQueryChinese && (
                      <p className="text-sm text-slate-500">{result.searchQueryChinese}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={result.results.length > 0 ? 'default' : 'secondary'}
                    className={cn(
                      result.results.length > 0
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {result.results.length} produit{result.results.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              {result.results.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>Aucun produit trouvé pour cette recherche</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {result.results.map((product, productIndex) => (
                    <ProductCard
                      key={product.id || productIndex}
                      product={product}
                      onClick={() => {
                        setSelectedProduct(product);
                        onProductSelect?.(product, result.searchQuery);
                      }}
                    />
                  ))}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {/* Product Detail Modal */}
      <ProductDetailDialog
        product={selectedProduct}
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

interface ProductCardProps {
  product: Product1688;
  onClick: () => void;
}

function ProductCard({ product, onClick }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card
      className="border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
      onClick={onClick}
    >
      {/* Image en haut */}
      <div className="relative w-full aspect-square bg-slate-100 overflow-hidden">
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <ImageIcon className="h-10 w-10 text-slate-300" />
          </div>
        )}
        {/* Badge prix en overlay */}
        <div className="absolute bottom-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-md text-sm font-bold shadow-lg">
          {product.priceInFCFA.min.toLocaleString()} FCFA
        </div>
      </div>

      {/* Contenu texte en dessous */}
      <CardContent className="p-3">
        {/* Titre */}
        <h4 className="font-medium text-sm text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight mb-2">
          {product.title}
        </h4>

        {/* Prix CNY */}
        <p className="text-xs text-slate-500 mb-2">
          ¥{product.price.min.toFixed(2)} CNY
        </p>

        {/* MOQ, Rating & Repurchase Rate */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded">
            <ShoppingCart className="h-3 w-3" />
            MOQ: {product.moq}
          </span>
          {product.supplier.rating && (
            <span className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-yellow-700">
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
              {product.supplier.rating.toFixed(1)}
            </span>
          )}
          {product.repurchaseRate !== undefined && product.repurchaseRate > 0 && (
            <span className="flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded text-green-600">
              <RefreshCw className="h-3 w-3" />
              {product.repurchaseRate}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProductDetailDialogProps {
  product: Product1688 | null;
  open: boolean;
  onClose: () => void;
}

function ProductDetailDialog({ product, open, onClose }: ProductDetailDialogProps) {
  const [imageError, setImageError] = useState(false);

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Image en haut - Grande et proéminente */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
          {product.imageUrl && !imageError ? (
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <ImageIcon className="h-20 w-20 text-slate-300" />
              <p className="text-sm text-slate-400">Image non disponible</p>
            </div>
          )}
          {/* Bouton fermer en overlay */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Contenu texte en dessous */}
        <div className="p-5 space-y-4">
          {/* Titre du produit */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">{product.title}</h2>
            {product.titleChinese && product.titleChinese !== product.title && (
              <p className="text-sm text-slate-500 mt-1">{product.titleChinese}</p>
            )}
          </div>

          {/* Prix et MOQ - Compact */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Prix unitaire</p>
                <p className="text-2xl font-bold text-orange-600">
                  {product.priceInFCFA.min.toLocaleString()} FCFA
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  ¥{product.price.min.toFixed(2)} CNY
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">MOQ</p>
                <p className="text-2xl font-bold text-slate-900">{product.moq}</p>
                <p className="text-sm text-slate-500">unités</p>
              </div>
            </div>
          </div>

          {/* Badges stats */}
          <div className="flex flex-wrap gap-2">
            {product.sold > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 py-1 px-2 text-xs">
                <ShoppingCart className="h-3 w-3" />
                {product.sold.toLocaleString()} vendus
              </Badge>
            )}
            {product.supplier.rating && (
              <Badge variant="outline" className="flex items-center gap-1 py-1 px-2 text-xs bg-yellow-50 border-yellow-200 text-yellow-700">
                <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                {product.supplier.rating.toFixed(1)}
              </Badge>
            )}
            {product.repurchaseRate !== undefined && product.repurchaseRate > 0 && (
              <Badge variant="outline" className="flex items-center gap-1 py-1 px-2 text-xs bg-green-50 border-green-200 text-green-700">
                <RefreshCw className="h-3 w-3" />
                {product.repurchaseRate}% réachat
              </Badge>
            )}
          </div>

          {/* Fournisseur - Compact */}
          <div className="border border-slate-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-slate-900 text-sm">Fournisseur</span>
              {product.supplier.isVerified && (
                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs py-0 px-1.5">
                  <CheckCircle className="h-3 w-3 mr-0.5" />
                  Vérifié
                </Badge>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nom</span>
                <span className="font-medium text-slate-900 text-right max-w-[60%] truncate" title={product.supplier.nameChinese}>
                  {product.supplier.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Localisation</span>
                <span className="font-medium text-slate-900" title={product.supplier.locationChinese}>
                  {product.supplier.location}
                </span>
              </div>
              {product.supplier.yearsOnPlatform && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Ancienneté</span>
                  <span className="font-medium text-slate-900">{product.supplier.yearsOnPlatform} ans</span>
                </div>
              )}
            </div>
          </div>

          {/* Bouton action */}
          {product.productUrl && (
            <Button
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
              onClick={() => window.open(product.productUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir sur 1688.com
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Results1688;
