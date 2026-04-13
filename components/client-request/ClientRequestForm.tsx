'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Upload,
  X,
  Plus,
  Image as ImageIcon,
  FileText,
  Loader2,
  Send,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AddItemPayload, SubmitRequestPayload } from '@/lib/types/marketplace';

interface ClientRequestFormProps {
  items: Array<{
    id: string;
    name: string;
    description: string | null;
    quantity: number;
    images: string[];
  }>;
  onAddItem: (item: AddItemPayload) => Promise<any>;
  onDeleteItem: (itemId: string) => Promise<void>;
  onSubmit: (data: SubmitRequestPayload) => Promise<boolean>;
  isSubmitted: boolean;
  isLoading: boolean;
}

export function ClientRequestForm({
  items,
  onAddItem,
  onDeleteItem,
  onSubmit,
  isSubmitted,
  isLoading,
}: ClientRequestFormProps) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemImages, setNewItemImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(async (files: FileList | File[]) => {
    setUploading(true);
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max 10MB)`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', 'client-request-images');

        const res = await fetch('/api/public/upload-image', {
          method: 'POST',
          body: formData,
        });

        const json = await res.json();
        if (res.ok && (json.url || json.data?.url)) {
          uploaded.push(json.url || json.data.url);
        }
      } catch {
        toast.error(`Erreur upload ${file.name}`);
      }
    }

    setNewItemImages(prev => [...prev, ...uploaded]);
    setUploading(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files);
    }
  }, [handleImageUpload]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      handleImageUpload(imageFiles);
    }
  }, [handleImageUpload]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast.error('Donnez un nom à votre article');
      return;
    }

    await onAddItem({
      name: newItemName.trim(),
      description: newItemDescription.trim() || undefined,
      quantity: newItemQuantity,
      images: newItemImages,
    });

    setNewItemName('');
    setNewItemDescription('');
    setNewItemQuantity(1);
    setNewItemImages([]);
    toast.success('Article ajouté');
  };

  const handleSubmit = async () => {
    if (!clientName.trim() || !clientEmail.trim()) {
      toast.error('Nom et email requis');
      return;
    }

    const success = await onSubmit({
      client_name: clientName.trim(),
      client_email: clientEmail.trim(),
      client_phone: clientPhone.trim() || undefined,
      client_company: clientCompany.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    if (success) {
      toast.success('Requête soumise avec succès !');
    }
  };

  if (isSubmitted) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <Send className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Requête soumise !</h2>
            <p className="text-muted-foreground max-w-md">
              Votre demande a été transmise à notre équipe. Nous allons rechercher les meilleurs
              fournisseurs et vous envoyer une proposition sous peu.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Items list */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vos articles ({items.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-16 h-16 rounded-md object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Qté: {item.quantity}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDeleteItem(item.id)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add item form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <Plus className="h-5 w-5 inline mr-2" />
            Ajouter un article
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Image upload zone */}
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            onPaste={handlePaste}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
            ) : newItemImages.length > 0 ? (
              <div className="flex flex-wrap gap-2 justify-center">
                {newItemImages.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} alt="" className="w-20 h-20 rounded-md object-cover" />
                    <button
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewItemImages(prev => prev.filter((_, idx) => idx !== i));
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <div className="w-20 h-20 rounded-md border-2 border-dashed flex items-center justify-center">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-center gap-2">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <Camera className="h-6 w-6 text-muted-foreground" />
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Glissez une image, collez depuis le presse-papier, ou cliquez pour uploader
                </p>
                <p className="text-xs text-muted-foreground">Max 10 MB par image</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            />
          </div>

          <div className="grid gap-3">
            <div>
              <Label>Nom de l&apos;article *</Label>
              <Input
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="Ex: Chaise de bureau ergonomique"
              />
            </div>
            <div>
              <Label>Description (optionnel)</Label>
              <Textarea
                value={newItemDescription}
                onChange={(e) => setNewItemDescription(e.target.value)}
                placeholder="Détails, couleur, dimensions, matière..."
                rows={2}
              />
            </div>
            <div className="w-32">
              <Label>Quantité</Label>
              <Input
                type="number"
                min={1}
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <Button onClick={handleAddItem} disabled={!newItemName.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter l&apos;article
          </Button>
        </CardContent>
      </Card>

      {/* Submit section */}
      {items.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            {!showSubmitForm ? (
              <Button
                size="lg"
                className="w-full"
                onClick={() => setShowSubmitForm(true)}
              >
                <Send className="h-5 w-5 mr-2" />
                Soumettre ma demande ({items.length} article{items.length > 1 ? 's' : ''})
              </Button>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold">Vos coordonnées</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label>Nom *</Label>
                    <Input
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Votre nom"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="+33 6 xx xx xx xx"
                    />
                  </div>
                  <div>
                    <Label>Entreprise</Label>
                    <Input
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                      placeholder="Nom de votre entreprise"
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Précisions sur votre demande..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    onClick={handleSubmit}
                    disabled={isLoading || !clientName.trim() || !clientEmail.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Envoyer ma demande
                  </Button>
                  <Button variant="outline" onClick={() => setShowSubmitForm(false)}>
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
