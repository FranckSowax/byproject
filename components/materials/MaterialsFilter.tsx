"use client";

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X, Filter, SlidersHorizontal } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

export type SortOption = 
  | 'name-asc' 
  | 'name-desc' 
  | 'quantity-high' 
  | 'quantity-low'
  | 'price-high'
  | 'price-low';

interface MaterialsFilterProps {
  materials: any[];
  onFilteredChange: (filtered: any[]) => void;
  showPriceSort?: boolean;
}

export function MaterialsFilter({ 
  materials, 
  onFilteredChange,
  showPriceSort = false 
}: MaterialsFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Extract unique categories from materials
  const categories = useMemo(() => {
    const cats = new Set<string>();
    materials.forEach(material => {
      if (material.category) {
        cats.add(material.category);
      }
    });
    return Array.from(cats).sort();
  }, [materials]);

  // Apply filters and sorting
  const filteredMaterials = useMemo(() => {
    let filtered = [...materials];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(material => 
        material.name?.toLowerCase().includes(query) ||
        material.description?.toLowerCase().includes(query) ||
        material.category?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(material => 
        material.category && selectedCategories.includes(material.category)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'quantity-high':
          return (b.quantity || 0) - (a.quantity || 0);
        case 'quantity-low':
          return (a.quantity || 0) - (b.quantity || 0);
        case 'price-high':
          // Find highest price for this material
          const pricesA = (a.prices || []).map((p: any) => parseFloat(p.amount) || 0);
          const pricesB = (b.prices || []).map((p: any) => parseFloat(p.amount) || 0);
          const maxA = pricesA.length ? Math.max(...pricesA) : 0;
          const maxB = pricesB.length ? Math.max(...pricesB) : 0;
          return maxB - maxA;
        case 'price-low':
          const pricesA2 = (a.prices || []).map((p: any) => parseFloat(p.amount) || 0);
          const pricesB2 = (b.prices || []).map((p: any) => parseFloat(p.amount) || 0);
          const minA = pricesA2.length ? Math.min(...pricesA2) : 0;
          const minB = pricesB2.length ? Math.min(...pricesB2) : 0;
          return minA - minB;
        default:
          return 0;
      }
    });

    return filtered;
  }, [materials, searchQuery, sortBy, selectedCategories]);

  // Update parent when filtered materials change
  useMemo(() => {
    onFilteredChange(filteredMaterials);
  }, [filteredMaterials, onFilteredChange]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSortBy('name-asc');
  };

  const activeFiltersCount = selectedCategories.length + (searchQuery ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search and Sort Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un matériau..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sort and Filters */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Nom (A-Z)</SelectItem>
              <SelectItem value="name-desc">Nom (Z-A)</SelectItem>
              <SelectItem value="quantity-high">Quantité ↓</SelectItem>
              <SelectItem value="quantity-low">Quantité ↑</SelectItem>
              {showPriceSort && (
                <>
                  <SelectItem value="price-high">Prix ↓</SelectItem>
                  <SelectItem value="price-low">Prix ↑</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {/* Category Filter Button */}
          {categories.length > 0 && (
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative w-full sm:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                  {activeFiltersCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Catégories</h4>
                    {selectedCategories.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCategories([])}
                        className="h-auto p-0 text-xs text-blue-600 hover:text-blue-700"
                      >
                        Tout effacer
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {categories.map(category => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => handleCategoryToggle(category)}
                        />
                        <label
                          htmlFor={`category-${category}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          {category}
                          <span className="text-xs text-gray-500 ml-2">
                            ({materials.filter(m => m.category === category).length})
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {(selectedCategories.length > 0 || searchQuery) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Filtres actifs:</span>
          
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Recherche: "{searchQuery}"
              <button
                onClick={() => setSearchQuery('')}
                className="ml-1 hover:bg-gray-300 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {selectedCategories.map(category => (
            <Badge key={category} variant="secondary" className="gap-1">
              {category}
              <button
                onClick={() => handleCategoryToggle(category)}
                className="ml-1 hover:bg-gray-300 rounded-full"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 text-xs"
          >
            Tout effacer
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {filteredMaterials.length} matériau{filteredMaterials.length !== 1 ? 'x' : ''} 
        {materials.length !== filteredMaterials.length && (
          <span className="text-gray-400"> sur {materials.length}</span>
        )}
      </div>
    </div>
  );
}
