"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Save,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  Package,
  Calendar,
  Users,
  Building2,
  ExternalLink,
  MessageSquarePlus,
  ImagePlus,
  AlertCircle,
  FileQuestion,
  RefreshCw,
  Link as LinkIcon,
  Bot,
  Sparkles,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { SupplierLinksPanel } from '@/components/admin/SupplierLinksPanel';

interface Material {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity: number | null;
  images: string[];
  clarification_request?: {
    requested_at: string;
    requested_by?: string;
    source?: string;
    message: string;
    missing_fields?: string[];
    needs_images: boolean;
    needs_description: boolean;
    ai_suggestions?: string[];
    resolved_at: string | null;
  } | null;
}

interface AIAnalysisResult {
  material_id: string;
  material_name: string;
  is_complete: boolean;
  missing_fields: string[];
  missing_fields_fr: string[];
  needs_images: boolean;
  needs_description: boolean;
  confidence_score: number;
  ai_suggestions: string[];
}

interface SupplierRequest {
  id: string;
  request_number: string;
  project_id: string;
  user_id: string;
  status: string;
  num_suppliers: number;
  total_materials: number;
  materials_data: Material[];
  metadata: any;
  public_token: string;
  created_at: string;
  expires_at: string | null;
  ai_analysis_status?: string;
  ai_analysis_completed_at?: string;
  ai_analysis_result?: {
    model_used?: string;
    total_materials?: number;
    complete_materials?: number;
    incomplete_materials?: number;
    analyzed_at?: string;
  };
  materials_needing_clarification?: number;
  projects?: {
    id: string;
    name: string;
  };
  users?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

const statusOptions = [
  { value: 'pending_admin', label: 'En attente admin', icon: Clock, color: 'orange' },
  { value: 'pending', label: 'En attente', icon: Clock, color: 'yellow' },
  { value: 'sent', label: 'Envoyé', icon: Send, color: 'blue' },
  { value: 'in_progress', label: 'En cours', icon: TrendingUp, color: 'purple' },
  { value: 'completed', label: 'Complété', icon: CheckCircle, color: 'green' },
  { value: 'cancelled', label: 'Annulé', icon: XCircle, color: 'red' },
];

export default function EditSupplierRequestPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingClarification, setSendingClarification] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [request, setRequest] = useState<SupplierRequest | null>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [clarificationDialogOpen, setClarificationDialogOpen] = useState(false);
  const [clarificationMessage, setClarificationMessage] = useState('');
  const [needsImages, setNeedsImages] = useState(true);
  const [needsDescription, setNeedsDescription] = useState(true);
  const [showLinksPanel, setShowLinksPanel] = useState(false);
  const [aiAnalysisResults, setAiAnalysisResults] = useState<AIAnalysisResult[]>([]);
  const [showAIResultsDialog, setShowAIResultsDialog] = useState(false);
  const [formData, setFormData] = useState({
    status: '',
    num_suppliers: 3,
    metadata: {
      country: '',
      shipping_type: '',
      notes: '',
    },
  });

  useEffect(() => {
    loadRequest();
  }, [requestId]);

  const loadRequest = async () => {
    try {
      const response = await fetch('/api/admin/supplier-requests');
      if (!response.ok) throw new Error('Failed to load requests');

      const { data } = await response.json();
      const foundRequest = data.find((r: SupplierRequest) => r.id === requestId);

      if (!foundRequest) {
        toast.error('Demande introuvable');
        router.push('/admin/supplier-requests');
        return;
      }

      setRequest(foundRequest);
      setFormData({
        status: foundRequest.status,
        num_suppliers: foundRequest.num_suppliers,
        metadata: foundRequest.metadata || {
          country: '',
          shipping_type: '',
          notes: '',
        },
      });
    } catch (error) {
      console.error('Error loading request:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/supplier-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update');

      toast.success('Demande mise à jour avec succès');
      router.push('/admin/supplier-requests');
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  // AI Analysis function
  const handleAIAnalysis = async (autoSendClarifications: boolean = false) => {
    if (!request?.materials_data || request.materials_data.length === 0) {
      toast.error('Aucun materiau a analyser');
      return;
    }

    setAnalyzing(true);
    try {
      const response = await fetch('/api/ai/analyze-materials-completeness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materials: request.materials_data,
          supplierRequestId: requestId,
          autoSendClarifications,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'AI analysis failed');
      }

      const result = await response.json();
      setAiAnalysisResults(result.results || []);

      if (result.summary.ready_for_quotation) {
        toast.success('Tous les materiaux sont complets ! Pret a envoyer aux fournisseurs.', {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        });
      } else {
        toast.warning(`${result.summary.needs_clarification} materiau(x) necessitent des precisions`, {
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
          description: autoSendClarifications
            ? 'Une notification a ete envoyee au client'
            : 'Cliquez pour voir les details',
        });
        setShowAIResultsDialog(true);
      }

      loadRequest(); // Reload to get updated ai_analysis_status
    } catch (error: any) {
      console.error('AI Analysis error:', error);
      toast.error(error.message || 'Erreur lors de l\'analyse IA');
    } finally {
      setAnalyzing(false);
    }
  };

  // Send clarifications for AI-detected incomplete materials
  const handleSendAIClarifications = async () => {
    const incompleteMaterials = aiAnalysisResults.filter(r => !r.is_complete);
    if (incompleteMaterials.length === 0) return;

    setSendingClarification(true);
    try {
      // Send clarification for each incomplete material
      for (const result of incompleteMaterials) {
        await fetch('/api/admin/clarification-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplierRequestId: requestId,
            materialIds: [result.material_id],
            message: result.ai_suggestions.join(' '),
            needsImages: result.needs_images,
            needsDescription: result.needs_description,
          }),
        });
      }

      toast.success(`Demandes de clarification envoyees pour ${incompleteMaterials.length} materiau(x)`);
      setShowAIResultsDialog(false);
      loadRequest();
    } catch (error: any) {
      console.error('Error sending clarifications:', error);
      toast.error('Erreur lors de l\'envoi des demandes');
    } finally {
      setSendingClarification(false);
    }
  };

  const handleSendToSuppliers = async () => {
    setSending(true);
    try {
      const response = await fetch('/api/admin/supplier-requests/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          numSuppliers: formData.num_suppliers,
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Failed to send');
      }

      const result = await response.json();
      toast.success(result.message);
      setShowLinksPanel(true);
      loadRequest(); // Reload to update status
    } catch (error: any) {
      console.error('Error sending to suppliers:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const toggleMaterialSelection = (materialId: string) => {
    setSelectedMaterials(prev =>
      prev.includes(materialId)
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  const selectAllMaterials = () => {
    if (!request?.materials_data) return;
    if (selectedMaterials.length === request.materials_data.length) {
      setSelectedMaterials([]);
    } else {
      setSelectedMaterials(request.materials_data.map(m => m.id));
    }
  };

  const openClarificationDialog = () => {
    if (selectedMaterials.length === 0) {
      toast.error('Veuillez sélectionner au moins un matériau');
      return;
    }
    setClarificationMessage('Veuillez fournir plus de détails et/ou des images pour ce matériau.');
    setClarificationDialogOpen(true);
  };

  const handleSendClarificationRequest = async () => {
    if (selectedMaterials.length === 0) return;

    setSendingClarification(true);
    try {
      const response = await fetch('/api/admin/clarification-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierRequestId: requestId,
          materialIds: selectedMaterials,
          message: clarificationMessage,
          needsImages,
          needsDescription,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send clarification request');
      }

      const result = await response.json();
      toast.success(result.message);
      setClarificationDialogOpen(false);
      setSelectedMaterials([]);
      loadRequest(); // Reload to see updated status
    } catch (error: any) {
      console.error('Error sending clarification request:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi de la demande');
    } finally {
      setSendingClarification(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Demande introuvable</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const currentStatus = statusOptions.find(s => s.value === formData.status);
  const StatusIcon = currentStatus?.icon || Clock;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/supplier-requests')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour à la liste
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Éditer la Demande</h1>
            <p className="text-gray-600 mt-1">
              Numéro: <span className="font-mono font-semibold">{request.request_number}</span>
            </p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <StatusIcon className="h-5 w-5 mr-2" />
            {currentStatus?.label}
          </Badge>
        </div>
      </div>

      {/* Request Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informations de la Demande
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600">Projet</Label>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="h-4 w-4 text-gray-500" />
                <p className="font-semibold">{request.projects?.name || 'N/A'}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Utilisateur</Label>
              <div className="flex items-center gap-2 mt-1">
                <Users className="h-4 w-4 text-gray-500" />
                <p className="font-semibold">{request.users?.email || 'N/A'}</p>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Date de création</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-500" />
                <p className="font-semibold">
                  {new Date(request.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-sm text-gray-600">Matériaux</Label>
              <div className="flex items-center gap-2 mt-1">
                <Package className="h-4 w-4 text-gray-500" />
                <p className="font-semibold">{request.total_materials || 0}</p>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Supplier Links Panel - Show after sending or if already sent */}
      {(request.status === 'sent' || request.status === 'in_progress' || showLinksPanel) && (
        <Card className="mb-6 border-violet-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-violet-700">
              <LinkIcon className="h-5 w-5" />
              Liens Fournisseurs
            </CardTitle>
            <CardDescription>
              Chaque fournisseur a son propre lien unique et espace de travail isolé
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupplierLinksPanel
              requestId={requestId}
              onSyncComplete={loadRequest}
            />
          </CardContent>
        </Card>
      )}

      {/* AI Analysis Card - For pending_admin status */}
      {request.status === 'pending_admin' && (
        <Card className="mb-6 border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-violet-900 flex items-center gap-2">
                    Verification IA des materiaux
                    {request.ai_analysis_status === 'ready' && (
                      <Badge className="bg-green-100 text-green-700">Pret</Badge>
                    )}
                    {request.ai_analysis_status === 'needs_clarification' && (
                      <Badge className="bg-orange-100 text-orange-700">
                        {request.materials_needing_clarification} a clarifier
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-violet-700 mt-1">
                    L'IA verifie si les descriptions sont suffisantes pour obtenir des cotations precises
                  </p>
                  {request.ai_analysis_completed_at && (
                    <p className="text-xs text-violet-500 mt-1">
                      Derniere analyse: {new Date(request.ai_analysis_completed_at).toLocaleString('fr-FR')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => handleAIAnalysis(false)}
                  disabled={analyzing}
                  variant="outline"
                  className="border-violet-300 text-violet-700 hover:bg-violet-100"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyse...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Analyser
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleAIAnalysis(true)}
                  disabled={analyzing}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Analyse...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyser et notifier
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Send to Suppliers Button - After AI analysis is ready or can be forced */}
      {request.status === 'pending_admin' && (
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Envoyer aux fournisseurs</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {formData.num_suppliers} lien(s) unique(s) seront generes
                  {request.ai_analysis_status === 'needs_clarification' && (
                    <span className="text-orange-600 ml-2">
                      (Attention: {request.materials_needing_clarification} materiau(x) incomplet(s))
                    </span>
                  )}
                </p>
              </div>
              <Button
                onClick={handleSendToSuppliers}
                disabled={sending}
                size="lg"
                className={`${
                  request.ai_analysis_status === 'ready'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600'
                }`}
              >
                {sending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {request.ai_analysis_status === 'needs_clarification'
                      ? 'Envoyer quand meme'
                      : 'Envoyer aux Fournisseurs'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials List */}
      {request.materials_data && request.materials_data.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Liste des Matériaux
                </CardTitle>
                <CardDescription>
                  Sélectionnez les matériaux nécessitant des précisions
                </CardDescription>
              </div>
              {selectedMaterials.length > 0 && (
                <Button
                  onClick={openClarificationDialog}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  <MessageSquarePlus className="h-4 w-4 mr-2" />
                  Demander des précisions ({selectedMaterials.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedMaterials.length === request.materials_data.length}
                        onCheckedChange={selectAllMaterials}
                      />
                    </TableHead>
                    <TableHead>Matériau</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Images</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-16">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.materials_data.map((material) => {
                    const hasClarificationRequest = material.clarification_request && !material.clarification_request.resolved_at;
                    const hasResolvedClarification = material.clarification_request && material.clarification_request.resolved_at;
                    const hasImages = material.images && material.images.length > 0;
                    const hasDescription = material.description && material.description.trim().length > 0;

                    return (
                      <TableRow
                        key={material.id}
                        className={`hover:bg-slate-50 ${hasClarificationRequest ? 'bg-orange-50' : hasResolvedClarification ? 'bg-emerald-50' : ''}`}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedMaterials.includes(material.id)}
                            onCheckedChange={() => toggleMaterialSelection(material.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{material.name}</div>
                          {material.description && (
                            <div className="text-xs text-gray-500 truncate max-w-[200px]">
                              {material.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{material.category || 'Non défini'}</Badge>
                        </TableCell>
                        <TableCell>{material.quantity || '-'}</TableCell>
                        <TableCell>
                          {hasImages ? (
                            <Badge className="bg-green-100 text-green-700">
                              {material.images.length} image(s)
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700">
                              Aucune image
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasClarificationRequest ? (
                            <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              En attente
                            </Badge>
                          ) : hasResolvedClarification ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Modifié
                            </Badge>
                          ) : !hasImages || !hasDescription ? (
                            <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                              <FileQuestion className="h-3 w-3 mr-1" />
                              Incomplet
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Complet
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMaterials([material.id]);
                              openClarificationDialog();
                            }}
                            title="Demander des précisions"
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <MessageSquarePlus className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Modifier les Détails</CardTitle>
          <CardDescription>
            Mettez à jour le statut et les informations de la demande
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div>
            <Label htmlFor="status">Statut *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Number of Suppliers */}
          <div>
            <Label htmlFor="num_suppliers">Nombre de Fournisseurs *</Label>
            <Input
              id="num_suppliers"
              type="number"
              min="1"
              max="10"
              value={formData.num_suppliers}
              onChange={(e) =>
                setFormData({ ...formData, num_suppliers: parseInt(e.target.value) || 1 })
              }
              className="mt-2"
            />
          </div>

          {/* Country */}
          <div>
            <Label htmlFor="country">Pays du Fournisseur</Label>
            <Input
              id="country"
              value={formData.metadata.country}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, country: e.target.value },
                })
              }
              placeholder="Chine, Turquie, etc."
              className="mt-2"
            />
          </div>

          {/* Shipping Type */}
          <div>
            <Label htmlFor="shipping_type">Type d'Expédition</Label>
            <Select
              value={formData.metadata.shipping_type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, shipping_type: value },
                })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Sélectionner..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sea">🚢 Maritime</SelectItem>
                <SelectItem value="air">✈️ Aérien</SelectItem>
                <SelectItem value="land">🚛 Terrestre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.metadata.notes}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  metadata: { ...formData.metadata, notes: e.target.value },
                })
              }
              rows={4}
              placeholder="Notes additionnelles..."
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/supplier-requests')}
          size="lg"
        >
          Annuler
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Enregistrement...' : 'Enregistrer les Modifications'}
        </Button>
      </div>

      {/* Clarification Dialog */}
      <Dialog open={clarificationDialogOpen} onOpenChange={setClarificationDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-orange-500" />
              Demander des précisions
            </DialogTitle>
            <DialogDescription>
              Envoyez une notification au client pour demander plus d'informations
              sur {selectedMaterials.length} matériau(x) sélectionné(s).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Message */}
            <div>
              <Label htmlFor="clarificationMessage">Message au client</Label>
              <Textarea
                id="clarificationMessage"
                value={clarificationMessage}
                onChange={(e) => setClarificationMessage(e.target.value)}
                rows={3}
                placeholder="Décrivez les informations supplémentaires nécessaires..."
                className="mt-2"
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label>Type de précisions demandées</Label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="needsImages"
                  checked={needsImages}
                  onCheckedChange={(checked) => setNeedsImages(checked as boolean)}
                />
                <label
                  htmlFor="needsImages"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <ImagePlus className="h-4 w-4 text-blue-500" />
                  Images supplémentaires requises
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="needsDescription"
                  checked={needsDescription}
                  onCheckedChange={(checked) => setNeedsDescription(checked as boolean)}
                />
                <label
                  htmlFor="needsDescription"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <FileQuestion className="h-4 w-4 text-purple-500" />
                  Description plus détaillée requise
                </label>
              </div>
            </div>

            {/* Selected Materials Preview */}
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <Label className="text-sm text-orange-700 mb-2 block">
                Matériaux concernés:
              </Label>
              <div className="flex flex-wrap gap-1">
                {selectedMaterials.map(id => {
                  const material = request?.materials_data?.find(m => m.id === id);
                  return material ? (
                    <Badge key={id} variant="outline" className="bg-white">
                      {material.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClarificationDialogOpen(false)}
              disabled={sendingClarification}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendClarificationRequest}
              disabled={sendingClarification || (!needsImages && !needsDescription)}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {sendingClarification ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer la demande
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Analysis Results Dialog */}
      <Dialog open={showAIResultsDialog} onOpenChange={setShowAIResultsDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-violet-600" />
              Resultats de l'analyse IA
            </DialogTitle>
            <DialogDescription>
              {aiAnalysisResults.filter(r => !r.is_complete).length} materiau(x) necessitent des precisions supplementaires
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {aiAnalysisResults.filter(r => !r.is_complete).map((result) => (
              <div
                key={result.material_id}
                className="p-4 rounded-lg border border-orange-200 bg-orange-50/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">{result.material_name}</h4>
                  <Badge className={`${
                    result.confidence_score > 70
                      ? 'bg-yellow-100 text-yellow-700'
                      : result.confidence_score > 40
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {result.confidence_score}% complet
                  </Badge>
                </div>

                {result.missing_fields_fr.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-1">Informations manquantes:</p>
                    <div className="flex flex-wrap gap-1">
                      {result.missing_fields_fr.map((field, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {field}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-xs text-slate-500">Suggestions IA:</p>
                  <ul className="text-sm text-slate-700 space-y-1">
                    {result.ai_suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Sparkles className="h-3 w-3 text-violet-500 mt-1 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex gap-2 mt-3">
                  {result.needs_images && (
                    <Badge className="bg-blue-100 text-blue-700">
                      <ImagePlus className="h-3 w-3 mr-1" />
                      Photos requises
                    </Badge>
                  )}
                  {result.needs_description && (
                    <Badge className="bg-purple-100 text-purple-700">
                      <FileQuestion className="h-3 w-3 mr-1" />
                      Description requise
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {/* Complete materials summary */}
            {aiAnalysisResults.filter(r => r.is_complete).length > 0 && (
              <div className="p-4 rounded-lg border border-green-200 bg-green-50/50">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    {aiAnalysisResults.filter(r => r.is_complete).length} materiau(x) complet(s)
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAIResultsDialog(false)}
            >
              Fermer
            </Button>
            <Button
              onClick={handleSendAIClarifications}
              disabled={sendingClarification}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              {sendingClarification ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer les demandes de clarification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
