"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Mail, UserPlus, X, Users, Shield } from "lucide-react";

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

      // Créer l'invitation
      const { error: inviteError } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: projectId,
          email: email.toLowerCase(),
          role: role,
          invited_by: user.id,
          status: 'pending',
        });

      if (inviteError) throw inviteError;

      toast.success(`Invitation envoyée à ${email}`);
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#5B5FC7]" />
            Partager le projet
          </DialogTitle>
          <DialogDescription>
            Invitez des collaborateurs à travailler sur "{projectName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Formulaire d'invitation */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adresse email</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="collaborateur@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                    disabled={isLoading}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select value={role} onValueChange={(value: any) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Lecteur</div>
                        <div className="text-xs text-gray-500">Peut voir le projet</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="editor">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div className="font-medium">Éditeur</div>
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
              className="w-full bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8]"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {isLoading ? "Envoi..." : "Envoyer l'invitation"}
            </Button>
          </div>

          {/* Liste des collaborateurs */}
          {collaborators.length > 0 && (
            <div className="space-y-3">
              <Label>Collaborateurs ({collaborators.length})</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{collab.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={collab.status === 'accepted' ? 'default' : 'secondary'}>
                          {collab.status === 'pending' ? 'En attente' : 
                           collab.status === 'accepted' ? 'Accepté' : 'Refusé'}
                        </Badge>
                        <Badge variant="outline">
                          {collab.role === 'owner' ? 'Propriétaire' :
                           collab.role === 'editor' ? 'Éditeur' : 'Lecteur'}
                        </Badge>
                      </div>
                    </div>
                    {collab.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(collab.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
