"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { MessageSquare, Send, Edit, Trash2, Reply, MoreVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Comment {
  id: string;
  material_id: string;
  user_id: string | null;
  user_email: string;
  user_name: string | null;
  comment: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  is_deleted: boolean;
}

interface MaterialCommentsProps {
  materialId: string;
  materialName: string;
}

export function MaterialComments({ materialId, materialName }: MaterialCommentsProps) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
    getCurrentUser();
    
    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel(`material_comments:${materialId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'material_comments',
          filter: `material_id=eq.${materialId}`,
        },
        () => {
          loadComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [materialId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('material_comments')
        .select('*')
        .eq('material_id', materialId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      toast.error("Le commentaire ne peut pas être vide");
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('material_comments')
        .insert({
          material_id: materialId,
          user_id: user.id,
          user_email: user.email!,
          user_name: user.user_metadata?.full_name || user.email,
          comment: newComment.trim(),
          parent_id: replyTo,
        });

      if (error) throw error;

      toast.success("Commentaire ajouté");
      setNewComment("");
      setReplyTo(null);
      loadComments();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(error.message || "Erreur lors de l'ajout du commentaire");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editText.trim()) {
      toast.error("Le commentaire ne peut pas être vide");
      return;
    }

    try {
      const { error } = await supabase
        .from('material_comments')
        .update({ comment: editText.trim() })
        .eq('id', commentId);

      if (error) throw error;

      toast.success("Commentaire modifié");
      setEditingId(null);
      setEditText("");
      loadComments();
    } catch (error) {
      console.error('Error editing comment:', error);
      toast.error("Erreur lors de la modification");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) return;

    try {
      const { error } = await supabase
        .from('material_comments')
        .update({ is_deleted: true, comment: '[Commentaire supprimé]' })
        .eq('id', commentId);

      if (error) throw error;

      toast.success("Commentaire supprimé");
      loadComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const isEditing = editingId === comment.id;
    const isOwner = currentUserId === comment.user_id;

    return (
      <div
        key={comment.id}
        className={`flex gap-3 ${isReply ? 'ml-12 mt-3' : 'mt-4'}`}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-[#5B5FC7] text-white text-xs">
            {getInitials(comment.user_name || comment.user_email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                {comment.user_name || comment.user_email}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
              {comment.is_edited && (
                <Badge variant="outline" className="text-xs">
                  modifié
                </Badge>
              )}
            </div>

            {isOwner && !isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditText(comment.comment);
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(comment.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleEdit(comment.id)}
                  className="bg-[#5B5FC7]"
                >
                  Enregistrer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setEditText("");
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {comment.comment}
              </p>
              {!isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyTo(comment.id)}
                  className="text-xs h-7"
                >
                  <Reply className="mr-1 h-3 w-3" />
                  Répondre
                </Button>
              )}
            </>
          )}

          {/* Réponses */}
          {comments
            .filter((c) => c.parent_id === comment.id)
            .map((reply) => renderComment(reply, true))}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-[#5B5FC7]" />
          Commentaires sur {materialName}
          <Badge variant="secondary">{comments.filter(c => !c.parent_id).length}</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Formulaire de nouveau commentaire */}
        <div className="space-y-3">
          {replyTo && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Reply className="h-4 w-4" />
              Réponse à un commentaire
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyTo(null)}
                className="h-6 text-xs"
              >
                Annuler
              </Button>
            </div>
          )}
          <Textarea
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
            disabled={isLoading}
          />
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !newComment.trim()}
            className="bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8]"
          >
            <Send className="mr-2 h-4 w-4" />
            {isLoading ? "Envoi..." : "Publier"}
          </Button>
        </div>

        {/* Liste des commentaires */}
        <div className="space-y-4 mt-6">
          {comments.filter((c) => !c.parent_id).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Aucun commentaire pour le moment</p>
              <p className="text-sm">Soyez le premier à commenter!</p>
            </div>
          ) : (
            comments
              .filter((c) => !c.parent_id)
              .map((comment) => renderComment(comment))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
