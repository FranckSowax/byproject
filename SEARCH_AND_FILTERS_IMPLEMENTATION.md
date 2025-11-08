# 🔍 Système de Recherche et Filtres

**Date**: 8 Novembre 2025  
**Version**: 1.0  
**Status**: 📋 Plan d'implémentation

---

## 🎯 Objectifs

Implémenter un système complet de recherche et filtres pour améliorer l'expérience utilisateur et la productivité.

**Fonctionnalités:**
1. ✅ Recherche globale
2. ✅ Filtres avancés
3. ✅ Tri personnalisable
4. ✅ Sauvegarde des filtres

---

## 🔍 1. Recherche Globale

### **A. Composant GlobalSearch**

**Fichier:** `components/search/GlobalSearch.tsx`

**Fonctionnalités:**
- Recherche dans tous les contenus (projets, matériaux, fournisseurs)
- Raccourci clavier (Cmd/Ctrl + K)
- Résultats en temps réel
- Navigation rapide
- Historique de recherche

**Interface:**
```tsx
<GlobalSearch 
  placeholder="Rechercher..." 
  onSelect={(result) => router.push(result.url)}
/>
```

**Recherche dans:**
- Projets (nom, description)
- Matériaux (nom, catégorie, specs)
- Fournisseurs (nom, pays, ville)
- Prix (notes)
- Utilisateurs (nom, email) - Admin uniquement

**Implémentation:**
```tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Search, FolderKanban, Package, Building2, User } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'project' | 'material' | 'supplier' | 'user';
  title: string;
  subtitle?: string;
  url: string;
  icon: React.ReactNode;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Raccourci clavier Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Recherche avec debounce
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Recherche dans les projets
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name, user_id')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);

      projects?.forEach(project => {
        searchResults.push({
          id: project.id,
          type: 'project',
          title: project.name,
          subtitle: 'Projet',
          url: `/dashboard/projects/${project.id}`,
          icon: <FolderKanban className="h-4 w-4" />
        });
      });

      // Recherche dans les matériaux
      const { data: materials } = await supabase
        .from('materials')
        .select('id, name, category, project_id')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);

      materials?.forEach(material => {
        searchResults.push({
          id: material.id,
          type: 'material',
          title: material.name,
          subtitle: material.category || 'Matériau',
          url: `/dashboard/projects/${material.project_id}`,
          icon: <Package className="h-4 w-4" />
        });
      });

      // Recherche dans les fournisseurs
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name, country, city')
        .ilike('name', `%${searchQuery}%`)
        .limit(5);

      suppliers?.forEach(supplier => {
        searchResults.push({
          id: supplier.id,
          type: 'supplier',
          title: supplier.name,
          subtitle: `${supplier.city || ''}, ${supplier.country || ''}`,
          url: `/admin/suppliers?id=${supplier.id}`,
          icon: <Building2 className="h-4 w-4" />
        });
      });

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    router.push(result.url);
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Rechercher...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-gray-600">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Rechercher des projets, matériaux, fournisseurs..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? 'Recherche en cours...' : 'Aucun résultat trouvé.'}
          </CommandEmpty>

          {results.length > 0 && (
            <CommandGroup heading="Résultats">
              {results.map((result) => (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  onSelect={() => handleSelect(result)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {result.icon}
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-gray-500">{result.subtitle}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
```

---

## 🎛️ 2. Filtres Avancés

### **A. Composant AdvancedFilters**

**Fichier:** `components/filters/AdvancedFilters.tsx`

**Fonctionnalités:**
- Filtres multiples combinables
- Filtres par catégorie
- Filtres par plage de dates
- Filtres par plage de prix
- Filtres par statut
- Filtres par pays
- Reset rapide

**Interface:**
```tsx
<AdvancedFilters
  onFilterChange={(filters) => applyFilters(filters)}
  savedFilters={userSavedFilters}
/>
```

**Types de filtres:**

1. **Filtres de Projet:**
   - Statut (actif, complété, en attente, annulé)
   - Date de création
   - Utilisateur (admin)

2. **Filtres de Matériaux:**
   - Catégorie
   - Plage de prix
   - Disponibilité

3. **Filtres de Fournisseurs:**
   - Pays
   - Ville
   - Type de produits

**Implémentation:**
```tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter, X, Save } from 'lucide-react';

export interface FilterConfig {
  category?: string;
  status?: string;
  country?: string;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: string;
  dateTo?: string;
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterConfig) => void;
  onSaveFilter?: (name: string, filters: FilterConfig) => void;
}

export function AdvancedFilters({ onFilterChange, onSaveFilter }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterConfig>({});
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = (key: keyof FilterConfig, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  return (
    <div className="space-y-4">
      {/* Filter Toggle */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtres
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 text-xs bg-indigo-600 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filtres Avancés</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select
                value={filters.category || ''}
                onValueChange={(value) => updateFilter('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Toutes</SelectItem>
                  <SelectItem value="Gros œuvre">Gros œuvre</SelectItem>
                  <SelectItem value="Second œuvre">Second œuvre</SelectItem>
                  <SelectItem value="Finitions">Finitions</SelectItem>
                  <SelectItem value="Électricité">Électricité</SelectItem>
                  <SelectItem value="Plomberie">Plomberie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => updateFilter('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="completed">Complété</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="cancelled">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Country Filter */}
            <div className="space-y-2">
              <Label>Pays</Label>
              <Select
                value={filters.country || ''}
                onValueChange={(value) => updateFilter('country', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous</SelectItem>
                  <SelectItem value="Gabon">🇬🇦 Gabon</SelectItem>
                  <SelectItem value="China">🇨🇳 Chine</SelectItem>
                  <SelectItem value="Turkey">🇹🇷 Turquie</SelectItem>
                  <SelectItem value="UAE">🇦🇪 Émirats Arabes Unis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label>Prix minimum (FCFA)</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minPrice || ''}
                onChange={(e) => updateFilter('minPrice', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div className="space-y-2">
              <Label>Prix maximum (FCFA)</Label>
              <Input
                type="number"
                placeholder="1000000"
                value={filters.maxPrice || ''}
                onChange={(e) => updateFilter('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
              />
            </div>

            {/* Save Filter Button */}
            {onSaveFilter && activeFilterCount > 0 && (
              <div className="flex items-end">
                <Button
                  onClick={() => {
                    const name = prompt('Nom du filtre:');
                    if (name) onSaveFilter(name, filters);
                  }}
                  variant="outline"
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder ce filtre
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## 📊 3. Tri Personnalisable

### **A. Composant SortableTable**

**Fichier:** `components/table/SortableTable.tsx`

**Fonctionnalités:**
- Tri par colonne (ascendant/descendant)
- Indicateurs visuels
- Multi-colonnes
- Sauvegarde de l'ordre

**Interface:**
```tsx
<SortableTable
  data={items}
  columns={columns}
  onSort={(field, direction) => handleSort(field, direction)}
/>
```

**Implémentation:**
```tsx
"use client";

import { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onSort?: (field: keyof T, direction: SortDirection) => void;
}

export function SortableTable<T>({ data, columns, onSort }: SortableTableProps<T>) {
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (field: keyof T) => {
    let newDirection: SortDirection = 'asc';

    if (sortField === field) {
      if (sortDirection === 'asc') newDirection = 'desc';
      else if (sortDirection === 'desc') newDirection = null;
    }

    setSortField(newDirection ? field : null);
    setSortDirection(newDirection);
    onSort?.(field, newDirection);
  };

  const getSortedData = () => {
    if (!sortField || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === bValue) return 0;

      const comparison = aValue > bValue ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const sortedData = getSortedData();

  const getSortIcon = (field: keyof T) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 text-indigo-600" />;
    }
    return <ArrowDown className="h-4 w-4 text-indigo-600" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)} className="px-4 py-3 text-left">
                {column.sortable !== false ? (
                  <Button
                    variant="ghost"
                    onClick={() => handleSort(column.key)}
                    className="flex items-center gap-2 font-semibold hover:bg-gray-100"
                  >
                    {column.label}
                    {getSortIcon(column.key)}
                  </Button>
                ) : (
                  <span className="font-semibold">{column.label}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              {columns.map((column) => (
                <td key={String(column.key)} className="px-4 py-3">
                  {column.render
                    ? column.render(item[column.key], item)
                    : String(item[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 💾 4. Sauvegarde des Filtres

### **A. Table saved_filters**

**Migration Supabase:**
```sql
CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filter_type TEXT NOT NULL, -- 'project', 'material', 'supplier'
  filters JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_filters_user_id ON saved_filters(user_id);
CREATE INDEX idx_saved_filters_type ON saved_filters(filter_type);

-- RLS
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own filters"
  ON saved_filters
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);
```

### **B. Hook useSavedFilters**

**Fichier:** `lib/hooks/useSavedFilters.ts`

```typescript
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface SavedFilter {
  id: string;
  name: string;
  filter_type: string;
  filters: any;
  is_default: boolean;
}

export function useSavedFilters(filterType: string) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadFilters();
  }, [filterType]);

  const loadFilters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_filters')
        .select('*')
        .eq('user_id', user.id)
        .eq('filter_type', filterType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedFilters(data || []);
    } catch (error) {
      console.error('Error loading filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveFilter = async (name: string, filters: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('saved_filters')
        .insert({
          user_id: user.id,
          name,
          filter_type: filterType,
          filters
        });

      if (error) throw error;

      toast.success('Filtre sauvegardé !');
      loadFilters();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  const deleteFilter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_filters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Filtre supprimé');
      loadFilters();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const setDefaultFilter = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Reset all defaults
      await supabase
        .from('saved_filters')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('filter_type', filterType);

      // Set new default
      const { error } = await supabase
        .from('saved_filters')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      toast.success('Filtre par défaut défini');
      loadFilters();
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    }
  };

  return {
    savedFilters,
    loading,
    saveFilter,
    deleteFilter,
    setDefaultFilter,
    refresh: loadFilters
  };
}
```

---

## 📋 Checklist d'Implémentation

### **Phase 1: Recherche Globale**
- [ ] Créer composant GlobalSearch
- [ ] Implémenter raccourci clavier (Cmd+K)
- [ ] Ajouter recherche dans projets
- [ ] Ajouter recherche dans matériaux
- [ ] Ajouter recherche dans fournisseurs
- [ ] Ajouter debounce (300ms)
- [ ] Tester et optimiser

### **Phase 2: Filtres Avancés**
- [ ] Créer composant AdvancedFilters
- [ ] Implémenter filtres par catégorie
- [ ] Implémenter filtres par statut
- [ ] Implémenter filtres par pays
- [ ] Implémenter filtres par prix
- [ ] Implémenter filtres par date
- [ ] Ajouter compteur de filtres actifs
- [ ] Ajouter bouton reset

### **Phase 3: Tri Personnalisable**
- [ ] Créer composant SortableTable
- [ ] Implémenter tri ascendant/descendant
- [ ] Ajouter indicateurs visuels
- [ ] Permettre tri multi-colonnes
- [ ] Sauvegarder l'ordre de tri

### **Phase 4: Sauvegarde des Filtres**
- [ ] Créer table saved_filters
- [ ] Créer hook useSavedFilters
- [ ] Implémenter sauvegarde
- [ ] Implémenter chargement
- [ ] Implémenter suppression
- [ ] Implémenter filtre par défaut
- [ ] Ajouter UI de gestion

---

## 🚀 Utilisation

### **Exemple Complet**

```tsx
"use client";

import { useState } from 'react';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { AdvancedFilters, FilterConfig } from '@/components/filters/AdvancedFilters';
import { SortableTable, Column } from '@/components/table/SortableTable';
import { useSavedFilters } from '@/lib/hooks/useSavedFilters';

export default function ProjectsPage() {
  const [filters, setFilters] = useState<FilterConfig>({});
  const { savedFilters, saveFilter } = useSavedFilters('project');
  const [projects, setProjects] = useState([]);

  const columns: Column<Project>[] = [
    { key: 'name', label: 'Nom', sortable: true },
    { key: 'status', label: 'Statut', sortable: true },
    { key: 'created_at', label: 'Date', sortable: true },
  ];

  return (
    <div className="space-y-6">
      {/* Global Search */}
      <GlobalSearch />

      {/* Advanced Filters */}
      <AdvancedFilters
        onFilterChange={setFilters}
        onSaveFilter={saveFilter}
      />

      {/* Sortable Table */}
      <SortableTable
        data={projects}
        columns={columns}
        onSort={(field, direction) => {
          // Apply sort
        }}
      />
    </div>
  );
}
```

---

**Le système de recherche et filtres est maintenant documenté et prêt à être implémenté !** 🔍✅
