"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Filter, 
  LayoutGrid, 
  List, 
  LayoutList, 
  Plus, 
  Download, 
  Trash2, 
  MoreVertical,
  SlidersHorizontal,
  X,
  Sparkles
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ViewMode } from "./types";
import { cn } from "@/lib/utils";

interface MaterialsToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCount: number;
  totalCount: number;
  onAdd: () => void;
  onDeleteSelected: () => void;
  onImport: () => void;
  onExport: () => void;
  activeFiltersCount: number;
  onToggleFilters: () => void;
  suggestionsCount?: number;
}

export function MaterialsToolbar({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  selectedCount,
  totalCount,
  onAdd,
  onDeleteSelected,
  onImport,
  onExport,
  activeFiltersCount,
  onToggleFilters,
  suggestionsCount = 0
}: MaterialsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm mb-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-lg">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Rechercher un matériau..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={onToggleFilters}
                className={cn(
                  "flex-shrink-0 border-slate-200",
                  activeFiltersCount > 0 && "bg-violet-50 border-violet-200 text-violet-700"
                )}
              >
                <Filter className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-violet-600 rounded-full border border-white" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Filtres avancés</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Actions and View Switcher */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        {selectedCount > 0 ? (
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm animate-in fade-in slide-in-from-bottom-2">
            <span className="font-medium">{selectedCount} sélectionné(s)</span>
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-red-400 hover:text-red-300 hover:bg-red-950/30"
              onClick={onDeleteSelected}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Supprimer
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-slate-300 hover:text-white hover:bg-slate-800"
              onClick={() => onViewModeChange(viewMode)} // Just to close selection in a real app logic
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            {/* View Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onViewModeChange('categories')}
                      className={cn(
                        "p-1.5 rounded-md transition-all",
                        viewMode === 'categories' 
                          ? "bg-white text-slate-900 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                      )}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Vue par catégories</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onViewModeChange('grid')}
                      className={cn(
                        "p-1.5 rounded-md transition-all",
                        viewMode === 'grid' 
                          ? "bg-white text-slate-900 shadow-sm" 
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                      )}
                    >
                      <TableIcon className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Vue tableau</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {suggestionsCount > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onViewModeChange('suggestions')}
                        className={cn(
                          "p-1.5 rounded-md transition-all relative",
                          viewMode === 'suggestions' 
                            ? "bg-white text-blue-600 shadow-sm" 
                            : "text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                        )}
                      >
                        <Sparkles className="h-4 w-4" />
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Suggestions IA ({suggestionsCount})</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Primary Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hidden sm:flex">
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onExport}>
                  Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExport}>
                  PDF (Liste)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExport}>
                  CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200"
              onClick={onAdd}
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="sm:hidden">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onImport}>
                  Importer un fichier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onExport}>
                  Exporter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  );
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 3v18"/>
      <rect width="18" height="18" x="3" y="3" rx="2"/>
      <path d="M3 9h18"/>
    </svg>
  );
}
