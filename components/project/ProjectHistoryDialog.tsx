'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Plus, Edit, Trash2, Share2, UserMinus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface HistoryEntry {
  id: string;
  user_email: string;
  user_id?: string | null;
  action_type: string;
  entity_type: string;
  entity_name: string | null;
  entity_id: string | null;
  project_id?: string;
  changes: any;
  created_at: string | null;
}

interface ProjectHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export default function ProjectHistoryDialog({
  isOpen,
  onClose,
  projectId,
  projectName
}: ProjectHistoryDialogProps) {
  const supabase = createClient();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, projectId]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('project_history')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    const icons = {
      create: <Plus className="h-4 w-4" />,
      update: <Edit className="h-4 w-4" />,
      delete: <Trash2 className="h-4 w-4" />,
      share: <Share2 className="h-4 w-4" />,
      unshare: <UserMinus className="h-4 w-4" />
    };
    return icons[actionType as keyof typeof icons] || <History className="h-4 w-4" />;
  };

  const getActionBadge = (actionType: string) => {
    const styles = {
      create: 'bg-gradient-to-r from-[#48BB78]/10 to-[#38A169]/10 text-[#48BB78] border-[#48BB78]/20',
      update: 'bg-gradient-to-r from-[#5B5FC7]/10 to-[#7B7FE8]/10 text-[#5B5FC7] border-[#5B5FC7]/20',
      delete: 'bg-gradient-to-r from-red-500/10 to-red-600/10 text-red-500 border-red-500/20',
      share: 'bg-gradient-to-r from-[#FF9B7B]/10 to-[#FF8A65]/10 text-[#FF9B7B] border-[#FF9B7B]/20',
      unshare: 'bg-gradient-to-r from-[#718096]/10 to-[#4A5568]/10 text-[#718096] border-[#718096]/20'
    };

    const labels = {
      create: 'Création',
      update: 'Modification',
      delete: 'Suppression',
      share: 'Partage',
      unshare: 'Retrait'
    };

    return (
      <Badge className={`${styles[actionType as keyof typeof styles]} font-semibold`}>
        {labels[actionType as keyof typeof labels]}
      </Badge>
    );
  };

  const getEntityLabel = (entityType: string) => {
    const labels: Record<string, string> = {
      project: 'Projet',
      materials: 'Matériau',
      prices: 'Prix',
      suppliers: 'Fournisseur',
      photos: 'Photo'
    };
    return labels[entityType] || entityType;
  };

  const formatAction = (entry: HistoryEntry) => {
    const entity = getEntityLabel(entry.entity_type);
    const name = entry.entity_name || 'élément';

    switch (entry.action_type) {
      case 'create':
        return `a créé ${entity.toLowerCase()} "${name}"`;
      case 'update':
        return `a modifié ${entity.toLowerCase()} "${name}"`;
      case 'delete':
        return `a supprimé ${entity.toLowerCase()} "${name}"`;
      case 'share':
        return `a partagé le projet avec ${entry.changes?.email || 'un collaborateur'}`;
      case 'unshare':
        return `a retiré ${entry.changes?.removed_email || 'un collaborateur'}`;
      default:
        return `a effectué une action sur ${entity.toLowerCase()}`;
    }
  };

  const getChangesSummary = (entry: HistoryEntry) => {
    if (!entry.changes) return null;

    if (entry.action_type === 'update' && entry.changes.old && entry.changes.new) {
      const changes: string[] = [];
      const old = entry.changes.old;
      const newData = entry.changes.new;

      Object.keys(newData).forEach(key => {
        if (old[key] !== newData[key] && !['id', 'created_at', 'updated_at', 'user_id', 'project_id'].includes(key)) {
          changes.push(`${key}: ${old[key]} → ${newData[key]}`);
        }
      });

      return changes.length > 0 ? changes.join(', ') : null;
    }

    if (entry.action_type === 'share') {
      return `Rôle: ${entry.changes.role === 'editor' ? 'Éditeur' : 'Lecteur'}`;
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] border-0 bg-white/95 backdrop-blur-sm shadow-2xl">
        <div className="h-2 bg-gradient-to-r from-[#5B5FC7] via-[#7B7FE8] to-[#FF9B7B] absolute top-0 left-0 right-0 rounded-t-lg" />
        
        <DialogHeader className="pt-4">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-[#5B5FC7]/10 to-[#FF9B7B]/10 rounded-xl flex items-center justify-center">
              <History className="h-5 w-5 text-[#5B5FC7]" />
            </div>
            Historique du projet
          </DialogTitle>
          <DialogDescription className="text-[#718096]">
            Toutes les modifications sur "{projectName}" (non effaçables)
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#5B5FC7]/20 border-t-[#5B5FC7] rounded-full animate-spin"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-[#5B5FC7]/10 to-[#FF9B7B]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <History className="h-8 w-8 text-[#5B5FC7]" />
              </div>
              <p className="text-[#718096]">Aucun historique pour le moment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="group relative bg-gradient-to-br from-white to-[#F8F9FF] border border-[#E0E4FF] hover:border-[#5B5FC7] rounded-xl p-4 transition-all duration-300"
                >
                  {/* Indicateur coloré */}
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#5B5FC7] to-[#FF9B7B] rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      entry.action_type === 'create' ? 'bg-[#48BB78]/10 text-[#48BB78]' :
                      entry.action_type === 'update' ? 'bg-[#5B5FC7]/10 text-[#5B5FC7]' :
                      entry.action_type === 'delete' ? 'bg-red-500/10 text-red-500' :
                      entry.action_type === 'share' ? 'bg-[#FF9B7B]/10 text-[#FF9B7B]' :
                      'bg-[#718096]/10 text-[#718096]'
                    }`}>
                      {getActionIcon(entry.action_type)}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[#4A5568]">
                            <span className="font-semibold">{entry.user_email}</span>
                            {' '}
                            <span className="text-[#718096]">{formatAction(entry)}</span>
                          </p>
                        </div>
                        {getActionBadge(entry.action_type)}
                      </div>

                      {/* Détails des changements */}
                      {getChangesSummary(entry) && (
                        <div className="mt-2 p-2 bg-[#F8F9FF] rounded-lg">
                          <p className="text-xs text-[#718096] font-mono">
                            {getChangesSummary(entry)}
                          </p>
                        </div>
                      )}

                      {/* Date */}
                      <p className="text-xs text-[#718096] mt-2">
                        {entry.created_at 
                          ? formatDistanceToNow(new Date(entry.created_at as string), { 
                              addSuffix: true,
                              locale: fr 
                            })
                          : 'Date inconnue'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
