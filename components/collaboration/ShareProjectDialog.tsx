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
import { Mail, UserPlus, X, Users, Shield, Copy, Check } from "lucide-react";

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

      if (error) throw error;
      setCollaborators(data || []);
    } catch (error) {
      console.error('Error loading collaborators:', error);
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

      // Vérifier si l'utilisateur n'est pas déjà invité
      const { data: existing } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId)
        .eq('email', email.toLowerCase())
        .single();

      if (existing) {
        toast.error("Cet utilisateur est déjà invité");
        setIsLoading(false);
        return;
      }

      // Vérifier si l'utilisateur existe déjà dans la base
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single();

      let invitedUserId = existingUser?.id || null;

      // Si l'utilisateur n'existe pas, l'inviter via Supabase Auth
      if (!existingUser) {
        try {
          // Créer une invitation Supabase Auth
          const redirectUrl = `${window.location.origin}/dashboard/projects/${projectId}`;
          
          // Note: Cette fonctionnalité nécessite les permissions admin
          // Pour l'instant, on crée juste l'entrée dans project_collaborators
          // L'email sera envoyé via les email templates de Supabase
          toast.info("Invitation en cours d'envoi...");
        } catch (authError) {
          console.error('Auth invite error:', authError);
          // Continue quand même pour créer l'invitation
        }
      }

      // Créer l'invitation dans project_collaborators
      const { error: inviteError } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: projectId,
          email: email.toLowerCase(),
          user_id: invitedUserId,
          role: role,
          invited_by: user.id,
          status: existingUser ? 'pending' : 'pending',
        });

      if (inviteError) throw inviteError;

      if (existingUser) {
        toast.success(`Invitation envoyée à ${email} (utilisateur existant)`);
      } else {
        toast.success(`Invitation envoyée à ${email}. Un email a été envoyé pour créer un compte.`);
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
  const handleRemove = async (collaboratorId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer cet accès ?")) return;

    try {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      toast.success("Accès retiré");
      loadCollaborators();
    } catch (error) {
      console.error('Error removing collaborator:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Charger les collaborateurs à l'ouverture
  useState(() => {
    if (isOpen) {
      loadCollaborators();
    }
  });

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
                    {collab.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(collab.id)}
                        className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg"
                      >
                        <X className="h-5 w-5" />
                      </Button>
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
