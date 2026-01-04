"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  Edit2, 
  Trash2, 
  Copy, 
  Image as ImageIcon,
  Check,
  X
} from "lucide-react";
import { Material } from "./types";
import { cn } from "@/lib/utils";
import { ImagePreview } from "./ImagePreview";

interface MaterialsDataGridProps {
  materials: Material[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
  onEdit: (material: Material) => void;
  onDelete: (id: string) => void;
  onDuplicate: (material: Material) => void;
  pricesByMaterial: Record<string, any[]>;
  onQuickUpdate?: (id: string, field: string, value: any) => Promise<void>;
}

export function MaterialsDataGrid({
  materials,
  selectedIds,
  onSelectChange,
  onEdit,
  onDelete,
  onDuplicate,
  pricesByMaterial,
  onQuickUpdate
}: MaterialsDataGridProps) {
  const [sortColumn, setSortColumn] = useState<keyof Material | 'price'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [editingCell, setEditingCell] = useState<{id: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const handleSort = (column: keyof Material | 'price') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedMaterials = [...materials].sort((a, b) => {
    let valA: any = a[sortColumn as keyof Material];
    let valB: any = b[sortColumn as keyof Material];

    if (sortColumn === 'price') {
      const pricesA = pricesByMaterial[a.id]?.map((p: any) => p.amount) || [];
      const pricesB = pricesByMaterial[b.id]?.map((p: any) => p.amount) || [];
      valA = pricesA.length ? Math.min(...pricesA) : 0;
      valB = pricesB.length ? Math.min(...pricesB) : 0;
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDirection === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    }
    
    // Handle null/undefined
    if (!valA && valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA && !valB) return sortDirection === 'asc' ? 1 : -1;
    if (!valA && !valB) return 0;

    return sortDirection === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === materials.length) {
      onSelectChange([]);
    } else {
      onSelectChange(materials.map(m => m.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  const startEditing = (id: string, field: string, currentValue: any) => {
    if (!onQuickUpdate) return;
    setEditingCell({ id, field });
    setEditValue(currentValue?.toString() || "");
  };

  const saveEdit = async () => {
    if (!editingCell || !onQuickUpdate) return;
    
    try {
      let value: any = editValue;
      if (editingCell.field === 'quantity') {
        value = parseFloat(editValue);
        if (isNaN(value)) value = 0;
      }
      
      await onQuickUpdate(editingCell.id, editingCell.field, value);
    } catch (error) {
      console.error("Failed to update", error);
    } finally {
      setEditingCell(null);
    }
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40px] pl-4">
              <Checkbox 
                checked={materials.length > 0 && selectedIds.length === materials.length}
                onCheckedChange={toggleSelectAll}
                aria-label="Tout sélectionner"
              />
            </TableHead>
            <TableHead className="w-[80px]">Image</TableHead>
            <TableHead className="min-w-[200px]">
              <Button variant="ghost" onClick={() => handleSort('name')} className="h-8 -ml-3 px-3 hover:bg-slate-100 font-semibold text-slate-700">
                Nom
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead>
              <Button variant="ghost" onClick={() => handleSort('category')} className="h-8 -ml-3 px-3 hover:bg-slate-100 font-semibold text-slate-700">
                Catégorie
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" onClick={() => handleSort('quantity')} className="h-8 -mr-3 px-3 hover:bg-slate-100 font-semibold text-slate-700">
                Quantité
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <Button variant="ghost" onClick={() => handleSort('price')} className="h-8 -mr-3 px-3 hover:bg-slate-100 font-semibold text-slate-700">
                Prix estimé
                <ArrowUpDown className="ml-2 h-3 w-3" />
              </Button>
            </TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedMaterials.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                Aucun matériau trouvé.
              </TableCell>
            </TableRow>
          ) : (
            sortedMaterials.map((material) => {
              const prices = pricesByMaterial[material.id] || [];
              const minPrice = prices.length ? Math.min(...prices.map(p => p.amount)) : null;
              const currency = prices.length ? prices[0].currency : '';

              return (
                <TableRow 
                  key={material.id} 
                  className={cn(
                    "group transition-colors hover:bg-slate-50",
                    selectedIds.includes(material.id) && "bg-slate-50"
                  )}
                >
                  <TableCell className="pl-4">
                    <Checkbox 
                      checked={selectedIds.includes(material.id)}
                      onCheckedChange={() => toggleSelect(material.id)}
                      aria-label={`Sélectionner ${material.name}`}
                    />
                  </TableCell>
                  <TableCell className="py-2">
                    <div className="h-10 w-10 rounded overflow-hidden bg-slate-100 border border-slate-200">
                      {material.images && material.images.length > 0 ? (
                        <ImagePreview 
                          images={material.images} 
                          alt={material.name} 
                          size="sm"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {editingCell?.id === material.id && editingCell.field === 'name' ? (
                      <div className="flex items-center gap-2">
                        <Input 
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          autoFocus
                          className="h-8"
                        />
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600" onClick={saveEdit}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400" onClick={() => setEditingCell(null)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
                        onClick={() => onEdit(material)}
                      >
                        <span className="truncate max-w-[300px]">{material.name}</span>
                        {material.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px] hidden xl:inline-block font-normal">
                            - {material.description}
                          </span>
                        )}
                        {onQuickUpdate && (
                          <Edit2 
                            className="h-3 w-3 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 transition-opacity" 
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(material.id, 'name', material.name);
                            }}
                          />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {material.category ? (
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 font-normal">
                        {material.category}
                      </Badge>
                    ) : (
                      <span className="text-slate-400 text-sm italic">--</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingCell?.id === material.id && editingCell.field === 'quantity' ? (
                      <div className="flex items-center justify-end gap-1">
                        <Input 
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          autoFocus
                          className="h-8 w-20 text-right"
                        />
                      </div>
                    ) : (
                      <div 
                        className="flex items-center justify-end gap-2 group/qty"
                        onClick={() => onQuickUpdate && startEditing(material.id, 'quantity', material.quantity)}
                      >
                        <span className={cn("font-medium", !material.quantity && "text-slate-300 italic")}>
                          {material.quantity || 0}
                        </span>
                        {material.specs?.unit && (
                          <span className="text-xs text-muted-foreground">{material.specs.unit}</span>
                        )}
                        {onQuickUpdate && (
                          <Edit2 className="h-3 w-3 opacity-0 group-hover/qty:opacity-100 text-slate-400 cursor-pointer" />
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {minPrice !== null ? (
                      <div className="font-medium text-emerald-700">
                        {minPrice.toLocaleString()} {currency}
                        {prices.length > 1 && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {prices.length} offres
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="sr-only">Ouvrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onEdit(material)}>
                          <Edit2 className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(material)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(material.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
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
    </div>
  );
}
