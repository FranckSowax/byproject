"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { History, Plus, Edit, Trash2, MessageSquare, DollarSign, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface HistoryEntry {
  id: string;
  project_id: string;
  user_id: string | null;
  user_email: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  changes: any;
  created_at: string;
}

interface ProjectHistoryProps {
  projectId: string;
}

export function ProjectHistory({ projectId }: ProjectHistoryProps) {
  const supabase = createClient();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel(`project_history:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_history',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          loadHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('project_history' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (actionType: string, entityType: string) => {
    if (actionType === 'INSERT') return <Plus className="h-4 w-4 text-green-600" />;
    if (actionType === 'UPDATE') return <Edit className="h-4 w-4 text-blue-600" />;
    if (actionType === 'DELETE') return <Trash2 className="h-4 w-4 text-red-600" />;
    
    if (entityType === 'comment') return <MessageSquare className="h-4 w-4 text-purple-600" />;
    if (entityType === 'price') return <DollarSign className="h-4 w-4 text-yellow-600" />;
    
    return <FileText className="h-4 w-4 text-gray-600" />;
  };

  const getActionText = (entry: HistoryEntry) => {
    const action = entry.action_type;
    const entity = entry.entity_type;
    const name = entry.entity_name || 'élément';

    if (action === 'INSERT') {
      if (entity === 'material') return `a ajouté le matériau "${name}"`;
      if (entity === 'price') return `a ajouté un prix pour "${name}"`;
      if (entity === 'comment') return `a commenté "${name}"`;
      if (entity === 'supplier') return `a ajouté le fournisseur "${name}"`;
      return `a créé ${name}`;
    }

    if (action === 'UPDATE') {
      if (entity === 'material') return `a modifié le matériau "${name}"`;
      if (entity === 'price') return `a mis à jour un prix pour "${name}"`;
      if (entity === 'comment') return `a modifié un commentaire sur "${name}"`;
      if (entity === 'supplier') return `a modifié le fournisseur "${name}"`;
      return `a modifié ${name}`;
    }

    if (action === 'DELETE') {
      if (entity === 'material') return `a supprimé le matériau "${name}"`;
      if (entity === 'price') return `a supprimé un prix pour "${name}"`;
      if (entity === 'comment') return `a supprimé un commentaire sur "${name}"`;
      if (entity === 'supplier') return `a supprimé le fournisseur "${name}"`;
      return `a supprimé ${name}`;
    }

    return `a effectué une action sur ${name}`;
  };

  const getActionColor = (actionType: string) => {
    if (actionType === 'INSERT') return 'bg-green-100 text-green-800';
    if (actionType === 'UPDATE') return 'bg-blue-100 text-blue-800';
    if (actionType === 'DELETE') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatChanges = (changes: any, entityType: string) => {
    if (!changes || Object.keys(changes).length === 0) return null;

    const descriptions: string[] = [];

    // Helper pour vérifier si un changement est valide
    const isValidChange = (change: any) => {
      return change && typeof change === 'object' && change !== null && ('old' in change || 'new' in change);
    };

    // Formater selon le type d'entité
    if (entityType === 'material') {
      if (changes.name && isValidChange(changes.name)) {
        descriptions.push(`Nom: "${changes.name.old || 'vide'}" → "${changes.name.new || 'vide'}"`);
      }
      if (changes.description && isValidChange(changes.description)) {
        descriptions.push(`Description: "${changes.description.old || 'vide'}" → "${changes.description.new || 'vide'}"`);
      }
      if (changes.category && isValidChange(changes.category)) {
        descriptions.push(`Catégorie: "${changes.category.old || 'aucune'}" → "${changes.category.new || 'aucune'}"`);
      }
      if (changes.quantity && isValidChange(changes.quantity)) {
        descriptions.push(`Quantité: ${changes.quantity.old || 0} → ${changes.quantity.new || 0}`);
      }
      if (changes.surface && isValidChange(changes.surface)) {
        descriptions.push(`Surface: ${changes.surface.old || 0} m² → ${changes.surface.new || 0} m²`);
      }
      if (changes.weight && isValidChange(changes.weight)) {
        descriptions.push(`Poids: ${changes.weight.old || 0} kg → ${changes.weight.new || 0} kg`);
      }
      if (changes.volume && isValidChange(changes.volume)) {
        descriptions.push(`Volume: ${changes.volume.old || 0} m³ → ${changes.volume.new || 0} m³`);
      }
    } else if (entityType === 'price') {
      if (changes.amount && isValidChange(changes.amount)) {
        descriptions.push(`Montant: ${changes.amount.old || 0} → ${changes.amount.new || 0} FCFA`);
      }
      if (changes.currency && isValidChange(changes.currency)) {
        descriptions.push(`Devise: ${changes.currency.old || ''} → ${changes.currency.new || ''}`);
      }
      if (changes.supplier_name && isValidChange(changes.supplier_name)) {
        descriptions.push(`Fournisseur: "${changes.supplier_name.old || 'inconnu'}" → "${changes.supplier_name.new || 'inconnu'}"`);
      }
      if (changes.country && isValidChange(changes.country)) {
        descriptions.push(`Pays: ${changes.country.old || ''} → ${changes.country.new || ''}`);
      }
      if (changes.delivery_time && isValidChange(changes.delivery_time)) {
        descriptions.push(`Délai: ${changes.delivery_time.old || 0} → ${changes.delivery_time.new || 0} jours`);
      }
    } else if (entityType === 'supplier') {
      if (changes.name && isValidChange(changes.name)) {
        descriptions.push(`Nom: "${changes.name.old || 'vide'}" → "${changes.name.new || 'vide'}"`);
      }
      if (changes.country && isValidChange(changes.country)) {
        descriptions.push(`Pays: ${changes.country.old || ''} → ${changes.country.new || ''}`);
      }
      if (changes.contact && isValidChange(changes.contact)) {
        descriptions.push(`Contact: ${changes.contact.old || ''} → ${changes.contact.new || ''}`);
      }
      if (changes.email && isValidChange(changes.email)) {
        descriptions.push(`Email: ${changes.email.old || ''} → ${changes.email.new || ''}`);
      }
    } else if (entityType === 'comment') {
      if (changes.content && isValidChange(changes.content)) {
        descriptions.push(`Contenu: "${changes.content.old || 'vide'}" → "${changes.content.new || 'vide'}"`);
      }
    }

    // Si aucun champ connu n'est trouvé, afficher tous les changements
    if (descriptions.length === 0) {
      Object.keys(changes).forEach(key => {
        const change = changes[key];
        if (isValidChange(change)) {
          descriptions.push(`${key}: ${change.old || ''} → ${change.new || ''}`);
        }
      });
    }

    return descriptions.length > 0 ? descriptions : null;
  };

  if (isLoading) {
    return (
      <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5B5FC7]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-[#5B5FC7]" />
          Historique du projet
          <Badge variant="secondary">{history.length}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Aucune activité pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-[#5B5FC7] text-white text-xs">
                    {getInitials(entry.user_email)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-semibold">{entry.user_email.split('@')[0]}</span>
                        {' '}
                        <span className="text-gray-600">{getActionText(entry)}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(entry.created_at), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getActionIcon(entry.action_type, entry.entity_type)}
                      <Badge
                        variant="secondary"
                        className={getActionColor(entry.action_type)}
                      >
                        {entry.action_type}
                      </Badge>
                    </div>
                  </div>

                  {/* Afficher les changements si disponibles */}
                  {entry.changes && Object.keys(entry.changes).length > 0 && (() => {
                    const changeDescriptions = formatChanges(entry.changes, entry.entity_type);
                    if (!changeDescriptions || changeDescriptions.length === 0) return null;
                    
                    return (
                      <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                        <p className="text-xs font-semibold text-gray-700 mb-2">
                          📝 Modifications apportées :
                        </p>
                        <ul className="space-y-1">
                          {changeDescriptions.map((desc, idx) => (
                            <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5">•</span>
                              <span>{desc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
