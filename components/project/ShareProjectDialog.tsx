'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, Mail, UserPlus, X, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface Collaborator {
  id: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  invited_at: string;
  user_id?: string;
}

interface ShareProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  collaborators: Collaborator[];
  onCollaboratorsUpdate: () => void;
}

export default function ShareProjectDialog({
  isOpen,
  onClose,
  projectId,
  projectName,
  collaborators,
  onCollaboratorsUpdate
}: ShareProjectDialogProps) {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const handleInvite = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Email invalide');
      return;
    }

    setIsInviting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Vérifier si l'utilisateur existe dans la table users
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      // Créer l'invitation
      const { error } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: projectId,
          email: email.toLowerCase(),
          role,
          invited_by: user?.id,
          user_id: (existingUser as any)?.id || null,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Cet utilisateur est déjà invité');
        } else {
          throw error;
        }
        return;
      }

      // Envoyer un email d'invitation (TODO: implémenter)
      // await sendInvitationEmail(email, projectName, shareLink);

      // Enregistrer dans l'historique
      await supabase.from('project_history').insert({
        project_id: projectId,
        user_id: user?.id,
        user_email: user?.email || '',
        action_type: 'share',
        entity_type: 'project',
        entity_id: projectId,
        entity_name: projectName,
        changes: { email, role }
      });

      toast.success(`Invitation envoyée à ${email}`);
      setEmail('');
      onCollaboratorsUpdate();
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      toast.error('Erreur lors de l\'invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string, collaboratorEmail: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      // Enregistrer dans l'historique
      await supabase.from('project_history').insert({
        project_id: projectId,
        user_id: user?.id,
        user_email: user?.email || '',
        action_type: 'unshare',
        entity_type: 'project',
        entity_id: projectId,
        entity_name: projectName,
        changes: { removed_email: collaboratorEmail }
      });

      toast.success('Collaborateur retiré');
      onCollaboratorsUpdate();
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const generateShareLink = () => {
    const link = `${window.location.origin}/invite/${projectId}`;
    setShareLink(link);
    return link;
  };

  const copyShareLink = () => {
    const link = generateShareLink();
    navigator.clipboard.writeText(link);
    setLinkCopied(true);
    toast.success('Lien copié!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      owner: 'bg-gradient-to-r from-[#5B5FC7]/10 to-[#7B7FE8]/10 text-[#5B5FC7] border-[#5B5FC7]/20',
      editor: 'bg-gradient-to-r from-[#48BB78]/10 to-[#38A169]/10 text-[#48BB78] border-[#48BB78]/20',
      viewer: 'bg-gradient-to-r from-[#718096]/10 to-[#4A5568]/10 text-[#718096] border-[#718096]/20'
    };
    
    const labels = {
      owner: 'Propriétaire',
      editor: 'Éditeur',
      viewer: 'Lecteur'
    };

    return (
      <Badge className={`${styles[role as keyof typeof styles]} font-semibold`}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      accepted: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-orange-100 text-orange-700 border-orange-200',
      declined: 'bg-red-100 text-red-700 border-red-200'
    };
    
    const labels = {
      accepted: 'Accepté',
      pending: 'En attente',
      declined: 'Refusé'
    };

    return (
      <Badge variant="outline" className={styles[status as keyof typeof styles]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] border-0 bg-white/95 backdrop-blur-sm shadow-2xl">
        <div className="h-2 bg-gradient-to-r from-[#5B5FC7] to-[#FF9B7B] absolute top-0 left-0 right-0 rounded-t-lg" />
        
        <DialogHeader className="pt-4">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="w-10 h-10 bg-gradient-to-br from-[#5B5FC7]/10 to-[#FF9B7B]/10 rounded-xl flex items-center justify-center">
              <Share2 className="h-5 w-5 text-[#5B5FC7]" />
            </div>
            Partager le projet
          </DialogTitle>
          <DialogDescription className="text-[#718096]">
            Invitez des collaborateurs à travailler sur "{projectName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Formulaire d'invitation */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email du collaborateur</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                  className="flex-1"
                />
                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Lecteur</SelectItem>
                    <SelectItem value="editor">Éditeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleInvite}
              disabled={isInviting || !email}
              className="w-full bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#6B6FD7] text-white shadow-lg shadow-[#5B5FC7]/30"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {isInviting ? 'Envoi...' : 'Envoyer l\'invitation'}
            </Button>
          </div>

          {/* Lien de partage */}
          <div className="space-y-2">
            <Label>Ou partagez ce lien</Label>
            <div className="flex gap-2">
              <Input
                value={shareLink || generateShareLink()}
                readOnly
                className="flex-1 bg-[#F8F9FF]"
              />
              <Button
                onClick={copyShareLink}
                variant="outline"
                className="border-[#5B5FC7] text-[#5B5FC7] hover:bg-[#5B5FC7] hover:text-white"
              >
                {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-[#718096]">
              Les personnes avec ce lien pourront demander l'accès au projet
            </p>
          </div>

          {/* Liste des collaborateurs */}
          <div className="space-y-3">
            <Label>Collaborateurs ({collaborators.length})</Label>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {collaborators.length === 0 ? (
                <p className="text-sm text-[#718096] text-center py-8">
                  Aucun collaborateur pour le moment
                </p>
              ) : (
                collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-br from-white to-[#F8F9FF] border border-[#E0E4FF] rounded-xl"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#5B5FC7]/10 to-[#7B7FE8]/10 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-[#5B5FC7]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#4A5568] truncate">
                          {collab.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getRoleBadge(collab.role)}
                          {getStatusBadge(collab.status)}
                        </div>
                      </div>
                    </div>
                    {collab.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCollaborator(collab.id, collab.email)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
