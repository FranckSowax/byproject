"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  Plus, 
  X, 
  Check, 
  ChevronDown, 
  ChevronUp,
  Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SuggestionItem {
  name: string;
  reason: string;
}

interface CategorySuggestion {
  category: string;
  missingItems: SuggestionItem[];
}

interface AISuggestionsProps {
  suggestions: CategorySuggestion[];
  onAcceptSuggestion: (item: SuggestionItem, category: string) => void;
  onDismissSuggestion: (item: SuggestionItem, category: string) => void;
  onDismissAll: () => void;
  isLoading?: boolean;
}

export function AISuggestions({
  suggestions,
  onAcceptSuggestion,
  onDismissSuggestion,
  onDismissAll,
  isLoading = false,
}: AISuggestionsProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(suggestions.map(s => s.category))
  );
  const [dismissedItems, setDismissedItems] = useState<Set<string>>(new Set());
  const [acceptedItems, setAcceptedItems] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleAccept = (item: SuggestionItem, category: string) => {
    const key = `${category}-${item.name}`;
    setAcceptedItems(prev => new Set([...prev, key]));
    onAcceptSuggestion(item, category);
  };

  const handleDismiss = (item: SuggestionItem, category: string) => {
    const key = `${category}-${item.name}`;
    setDismissedItems(prev => new Set([...prev, key]));
    onDismissSuggestion(item, category);
  };

  const getItemKey = (category: string, itemName: string) => `${category}-${itemName}`;

  // Filter out dismissed items
  const activeSuggestions = suggestions
    .map(s => ({
      ...s,
      missingItems: s.missingItems.filter(
        item => !dismissedItems.has(getItemKey(s.category, item.name))
      ),
    }))
    .filter(s => s.missingItems.length > 0);

  const totalSuggestions = activeSuggestions.reduce(
    (acc, s) => acc + s.missingItems.length,
    0
  );

  if (totalSuggestions === 0) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <div className="p-2 rounded-lg bg-amber-100">
              <Lightbulb className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <span className="text-lg">Suggestions de l'IA</span>
              <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-700">
                {totalSuggestions} oubli{totalSuggestions > 1 ? 's' : ''} potentiel{totalSuggestions > 1 ? 's' : ''}
              </Badge>
            </div>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismissAll}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
          >
            <X className="h-4 w-4 mr-1" />
            Tout ignorer
          </Button>
        </div>
        <p className="text-sm text-amber-700 mt-1">
          Basé sur l'analyse de votre fichier, voici des éléments souvent oubliés dans ce type de projet.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeSuggestions.map((suggestion) => (
          <div
            key={suggestion.category}
            className="rounded-lg border border-amber-200 bg-white overflow-hidden"
          >
            {/* Category Header */}
            <button
              onClick={() => toggleCategory(suggestion.category)}
              className="w-full flex items-center justify-between p-3 hover:bg-amber-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-amber-300 text-amber-700">
                  {suggestion.category}
                </Badge>
                <span className="text-sm text-slate-500">
                  {suggestion.missingItems.length} suggestion{suggestion.missingItems.length > 1 ? 's' : ''}
                </span>
              </div>
              {expandedCategories.has(suggestion.category) ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </button>

            {/* Items */}
            {expandedCategories.has(suggestion.category) && (
              <div className="border-t border-amber-100">
                {suggestion.missingItems.map((item) => {
                  const key = getItemKey(suggestion.category, item.name);
                  const isAccepted = acceptedItems.has(key);

                  return (
                    <div
                      key={item.name}
                      className={cn(
                        "flex items-start gap-3 p-3 border-b border-amber-50 last:border-b-0",
                        isAccepted && "bg-emerald-50"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
                          <span className={cn(
                            "font-medium text-slate-800",
                            isAccepted && "text-emerald-700"
                          )}>
                            {item.name}
                          </span>
                          {isAccepted && (
                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                              Ajouté
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5 ml-6">
                          {item.reason}
                        </p>
                      </div>
                      
                      {!isAccepted && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAccept(item, suggestion.category)}
                            className="h-8 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            disabled={isLoading}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Ajouter
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDismiss(item, suggestion.category)}
                            className="h-8 px-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                            disabled={isLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
