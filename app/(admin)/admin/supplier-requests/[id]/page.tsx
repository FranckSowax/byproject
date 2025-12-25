"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from 'lucide-react';
import { toast } from 'sonner';

interface SupplierRequest {
  id: string;
  request_number: string;
  project_id: string;
  user_id: string;
  status: string;
  num_suppliers: number;
  total_materials: number;
  metadata: any;
  public_token: string;
  created_at: string;
  expires_at: string | null;
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
  const [request, setRequest] = useState<SupplierRequest | null>(null);
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

          {request.public_token && (
            <div className="pt-4 border-t">
              <Label className="text-sm text-gray-600">Lien Public</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/supplier-quote/${request.public_token}`}
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.open(`/supplier-quote/${request.public_token}`, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
