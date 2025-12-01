"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Mail, UserPlus, X, Users, Shield, Copy, Check, RefreshCw, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ShareProjectDialogProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Collaborator {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string;
  user_id?: string;
}

export function ShareProjectDialog({ projectId, projectName, isOpen, onClose, onSuccess }: ShareProjectDialogProps) {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [isLoading, setIsLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);

  // Charger les collaborateurs existants
  const loadCollaborators = async () => {
    try {
      const { data, error } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.debug('Error loading collaborators:', error.message);
        setCollaborators([]);
        return;
      }
      setCollaborators(data || []);
    } catch (error) {
      console.debug('Error loading collaborators:', error);
      setCollaborators([]);
    }
  };

  // Inviter un collaborateur
  const handleInvite = async () => {
    if (!email.trim()) {
      toast.error("Veuillez entrer une adresse email");
      return;
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Adresse email invalide");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Vérifier si l'utilisateur n'est pas déjà invité (avec maybeSingle pour éviter erreur 406)
      const { data: existing, error: checkError } = await supabase
        .from('project_collaborators')
        .select('id, status')
        .eq('project_id', projectId)
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (checkError) {
        console.debug('Check error:', checkError.message);
      }

      if (existing) {
        toast.error("Cet utilisateur est déjà invité");
        setIsLoading(false);
        return;
      }

      // Vérifier si l'utilisateur existe déjà dans auth.users
      // Si oui, on peut lier directement son user_id
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      // Créer l'invitation dans project_collaborators
      const { error: inviteError } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: projectId,
          email: email.toLowerCase(),
          user_id: existingUser?.id || null, // Lier si l'utilisateur existe
          role: role,
          invited_by: user.id,
          status: 'pending',
        });

      if (inviteError) throw inviteError;

      // Envoyer l'email d'invitation via l'API
      try {
        await fetch('/api/collaborators/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.toLowerCase(),
            projectId,
            projectName,
            role,
            inviterEmail: user.email,
          }),
        });
      } catch (emailError) {
        console.debug('Email sending skipped:', emailError);
      }

      toast.success(`Invitation envoyée à ${email}`);
      if (!existingUser) {
        toast.info("L'utilisateur devra créer un compte pour accéder au projet");
      }
      
      setEmail("");
      setRole("viewer");
      loadCollaborators();
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error inviting collaborator:', error);
      toast.error(error.message || "Erreur lors de l'invitation");
    } finally {
      setIsLoading(false);
    }
  };

  // Retirer un collaborateur
  const handleRemove = async (collaboratorId: string, collaboratorEmail: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer l'accès de ${collaboratorEmail} ?`)) return;

    try {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      toast.success(`Accès de ${collaboratorEmail} retiré`);
      loadCollaborators();
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Changer le rôle d'un collaborateur
  const handleChangeRole = async (collaboratorId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .update({ role: newRole })
        .eq('id', collaboratorId);

      if (error) throw error;

      toast.success("Rôle mis à jour");
      loadCollaborators();
    } catch (error) {
      console.error('Error changing role:', error);
      toast.error("Erreur lors de la modification");
    }
  };

  // Renvoyer une invitation
  const handleResendInvite = async (collaboratorEmail: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await fetch('/api/collaborators/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: collaboratorEmail,
          projectId,
          projectName,
          role: collaborators.find(c => c.email === collaboratorEmail)?.role || 'viewer',
          inviterEmail: user?.email,
        }),
      });

      toast.success(`Invitation renvoyée à ${collaboratorEmail}`);
    } catch (error) {
      console.error('Error resending invite:', error);
      toast.error("Erreur lors du renvoi");
    }
  };

  // Charger les collaborateurs à l'ouverture
  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
    }
  }, [isOpen, projectId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-[#5B5FC7] via-[#7B7FE8] to-[#FF9B7B] p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              Partager le projet
            </DialogTitle>
            <DialogDescription className="text-white/90 text-base mt-2">
              Invitez des collaborateurs à travailler sur "{projectName}"
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content scrollable */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Formulaire d'invitation */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#4A5568] font-semibold">Adresse email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-[#5B5FC7]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="collaborateur@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                  disabled={isLoading}
                  className="pl-11 border-[#E0E4FF] focus:border-[#5B5FC7] h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-[#4A5568] font-semibold">Rôle</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger className="border-[#E0E4FF] focus:border-[#5B5FC7] h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Shield className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Lecteur</div>
                        <div className="text-xs text-gray-500">Peut voir le projet</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Shield className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Éditeur</div>
                        <div className="text-xs text-gray-500">Peut modifier le projet</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleInvite}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#5B5FC7] h-12 text-base font-semibold shadow-lg shadow-[#5B5FC7]/30"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              {isLoading ? "Envoi en cours..." : "Envoyer l'invitation"}
            </Button>
          </div>

          {/* Liste des collaborateurs */}
          {collaborators.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#5B5FC7]" />
                <Label className="text-base font-bold text-[#2D3748]">
                  Collaborateurs ({collaborators.length})
                </Label>
              </div>
              <div className="space-y-2">
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-[#F5F6FF] to-[#E8EEFF] rounded-xl border border-[#E0E4FF] hover:shadow-md transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#2D3748] truncate">{collab.email}</div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge 
                          className={
                            collab.status === 'accepted' 
                              ? 'bg-green-100 text-green-700 border-green-200' 
                              : collab.status === 'pending'
                              ? 'bg-orange-100 text-orange-700 border-orange-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }
                        >
                          {collab.status === 'pending' ? '⏳ En attente' : 
                           collab.status === 'accepted' ? '✅ Accepté' : '❌ Refusé'}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={
                            collab.role === 'owner'
                              ? 'border-purple-300 text-purple-700'
                              : collab.role === 'editor'
                              ? 'border-green-300 text-green-700'
                              : 'border-blue-300 text-blue-700'
                          }
                        >
                          {collab.role === 'owner' ? '👑 Propriétaire' :
                           collab.role === 'editor' ? '✏️ Éditeur' : '👁️ Lecteur'}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Actions pour les collaborateurs (pas pour le propriétaire) */}
                    {collab.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-2 hover:bg-white/50 rounded-lg"
                          >
                            <MoreVertical className="h-5 w-5 text-gray-500" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {/* Renvoyer l'invitation si en attente */}
                          {collab.status === 'pending' && (
                            <DropdownMenuItem 
                              onClick={() => handleResendInvite(collab.email)}
                              className="cursor-pointer"
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Renvoyer l'invitation
                            </DropdownMenuItem>
                          )}
                          
                          {/* Changer le rôle */}
                          <DropdownMenuItem 
                            onClick={() => handleChangeRole(collab.id, collab.role === 'editor' ? 'viewer' : 'editor')}
                            className="cursor-pointer"
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            {collab.role === 'editor' ? 'Passer en Lecteur' : 'Passer en Éditeur'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {/* Retirer l'accès */}
                          <DropdownMenuItem 
                            onClick={() => handleRemove(collab.id, collab.email)}
                            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Retirer l'accès
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#E0E4FF] bg-gradient-to-r from-[#F8F9FF] to-white">
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-[#E0E4FF] hover:bg-[#F5F6FF]"
            >
              Fermer
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
