"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Globe, Copy, Check, Send, Users, Calendar, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface SendToSuppliersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  materialsCount: number;
}

export function SendToSuppliersDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  materialsCount,
}: SendToSuppliersDialogProps) {
  const [numSuppliers, setNumSuppliers] = useState(3);
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [isCreating, setIsCreating] = useState(false);
  const [publicUrl, setPublicUrl] = useState('');
  const [requestNumber, setRequestNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/supplier-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          numSuppliers,
          expiresInDays,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create supplier request');
      }

      const data = await response.json();
      setPublicUrl(data.publicUrl);
      setRequestNumber(data.requestNumber);
      
      toast.success('Demande créée avec succès !');
    } catch (error) {
      console.error('Error creating supplier request:', error);
      toast.error('Erreur lors de la création de la demande');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Lien copié !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setPublicUrl('');
    setRequestNumber('');
    setNumSuppliers(3);
    setExpiresInDays(30);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Envoyer aux Fournisseurs Chinois
          </DialogTitle>
          <DialogDescription>
            Créez un lien de cotation traduit automatiquement en anglais et chinois
          </DialogDescription>
        </DialogHeader>

        {!publicUrl ? (
          <div className="space-y-6 py-4">
            {/* Project Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Projet: {projectName}</h3>
              <div className="flex items-center gap-4 text-sm text-blue-700">
                <Badge variant="secondary">{materialsCount} matériaux</Badge>
                <span>• Liste vierge à remplir</span>
                <span>• Traduction auto EN/ZH</span>
              </div>
            </div>

            {/* Configuration */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="numSuppliers" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Nombre de fournisseurs attendus
                </Label>
                <Input
                  id="numSuppliers"
                  type="number"
                  min={1}
                  max={10}
                  value={numSuppliers}
                  onChange={(e) => setNumSuppliers(parseInt(e.target.value) || 1)}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nombre de cotations que vous souhaitez recevoir
                </p>
              </div>

              <div>
                <Label htmlFor="expiresInDays" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Validité du lien (jours)
                </Label>
                <Input
                  id="expiresInDays"
                  type="number"
                  min={1}
                  max={90}
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(parseInt(e.target.value) || 30)}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le lien expirera après ce délai
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-gray-900">Fonctionnalités incluses:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Traduction automatique EN/ZH via DeepSeek AI
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Switch langue (Français/English/中文)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Suivi de progression en temps réel
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Comparaison automatique avec prix locaux
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-600" />
                  Notification à réception des cotations
                </li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Demande créée avec succès !</h3>
              </div>
              <p className="text-sm text-green-700">
                Numéro de demande: <span className="font-mono font-bold">{requestNumber}</span>
              </p>
            </div>

            {/* Public URL */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <LinkIcon className="h-4 w-4" />
                Lien public de cotation
              </Label>
              <div className="flex gap-2">
                <Input
                  value={publicUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleCopyUrl}
                  variant="outline"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Partagez ce lien avec vos fournisseurs chinois
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-blue-900">Prochaines étapes:</h4>
              <ol className="space-y-2 text-sm text-blue-700 list-decimal list-inside">
                <li>Copiez le lien ci-dessus</li>
                <li>Envoyez-le à vos fournisseurs chinois par email/WeChat</li>
                <li>Ils verront la liste traduite en chinois/anglais</li>
                <li>Suivez la progression dans l'onglet "Demandes Fournisseurs"</li>
                <li>Recevez une notification à chaque cotation reçue</li>
                <li>Comparez et synchronisez avec vos prix locaux</li>
              </ol>
            </div>

            {/* Email Template */}
            <div>
              <Label className="mb-2 block">Modèle d'email (optionnel)</Label>
              <Textarea
                readOnly
                rows={6}
                className="text-sm"
                value={`Hello,

We would like to request a quotation for our construction project.

Please fill in your prices using this link:
${publicUrl}

The form is available in English and Chinese (中文).

Request number: ${requestNumber}
Number of materials: ${materialsCount}

Thank you for your cooperation.`}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {!publicUrl ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                {isCreating ? (
                  'Création...'
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Créer le lien
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleReset}>
                Créer un autre
              </Button>
              <Button onClick={() => onOpenChange(false)}>
                Fermer
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
