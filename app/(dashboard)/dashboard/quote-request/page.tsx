"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Globe,
  Package,
  Ship,
  FileText,
  Plus,
  ArrowLeft,
  Send,
  Clock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  created_at: string;
}

interface QuoteRequest {
  id: string;
  request_number: string;
  status: string;
  num_suppliers: number;
  progress_percentage: number;
  created_at: string;
  projects?: {
    name: string;
  };
}

export default function QuoteRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [myRequests, setMyRequests] = useState<QuoteRequest[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    requestType: 'existing', // 'existing' or 'new'
    projectId: '',
    newProjectName: '',
    newProjectDescription: '',
    country: 'China',
    numSuppliers: '3',
    shippingType: 'sea',
    notes: '',
  });

  useEffect(() => {
    loadProjects();
    loadMyRequests();
  }, []);

  const loadProjects = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadMyRequests = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('supplier_requests' as any)
        .select(`
          *,
          projects:project_id (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Vous devez être connecté');
        return;
      }

      // Créer le projet si nouveau
      let projectId = formData.projectId;
      if (formData.requestType === 'new') {
        const { data: newProject, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: formData.newProjectName,
            user_id: user.id,
          })
          .select()
          .single();

        if (projectError) throw projectError;
        projectId = newProject.id;
      }

      // Créer la demande de cotation (statut: pending_admin)
      const { data: request, error: requestError } = await supabase
        .from('supplier_requests' as any)
        .insert({
          project_id: projectId,
          user_id: user.id,
          status: 'pending_admin', // En attente de traitement admin
          num_suppliers: parseInt(formData.numSuppliers),
          materials_data: {}, // Vide pour l'instant
          total_materials: 0,
          filled_materials: 0,
          progress_percentage: 0,
          metadata: {
            country: formData.country,
            shipping_type: formData.shippingType,
            notes: formData.notes,
          }
        })
        .select()
        .single();

      if (requestError) throw requestError;

      toast.success('Demande de cotation envoyée !');
      
      // Réinitialiser le formulaire
      setFormData({
        requestType: 'existing',
        projectId: '',
        newProjectName: '',
        newProjectDescription: '',
        country: 'China',
        numSuppliers: '3',
        shippingType: 'sea',
        notes: '',
      });

      // Recharger les demandes
      loadMyRequests();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi de la demande');
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    pending_admin: {
      label: 'En attente',
      color: 'bg-yellow-100 text-yellow-700',
      icon: Clock,
    },
    sent: {
      label: 'Envoyé',
      color: 'bg-blue-100 text-blue-700',
      icon: Send,
    },
    in_progress: {
      label: 'En cours',
      color: 'bg-purple-100 text-purple-700',
      icon: TrendingUp,
    },
    completed: {
      label: 'Complété',
      color: 'bg-green-100 text-green-700',
      icon: CheckCircle,
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/dashboard">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Globe className="h-8 w-8 text-blue-600" />
              Demande de Cotation Fournisseur Chinois
            </h1>
            <p className="text-slate-600 mt-1">Envoyez votre projet à nos partenaires fournisseurs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Nouvelle Demande</CardTitle>
                <CardDescription>
                  Remplissez le formulaire ci-dessous pour soumettre votre demande
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Type de demande */}
                  <div className="space-y-2">
                    <Label>Type de demande</Label>
                    <Select
                      value={formData.requestType}
                      onValueChange={(value) => setFormData({ ...formData, requestType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="existing">Projet existant</SelectItem>
                        <SelectItem value="new">Nouveau projet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Projet existant */}
                  {formData.requestType === 'existing' && (
                    <div className="space-y-2">
                      <Label>Sélectionner un projet</Label>
                      <Select
                        value={formData.projectId}
                        onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un projet" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Nouveau projet */}
                  {formData.requestType === 'new' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nom du projet</Label>
                        <Input
                          value={formData.newProjectName}
                          onChange={(e) => setFormData({ ...formData, newProjectName: e.target.value })}
                          placeholder="Ex: Construction Villa Moderne"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description (optionnel)</Label>
                        <Textarea
                          value={formData.newProjectDescription}
                          onChange={(e) => setFormData({ ...formData, newProjectDescription: e.target.value })}
                          placeholder="Décrivez brièvement votre projet..."
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  {/* Pays */}
                  <div className="space-y-2">
                    <Label>Pays de destination</Label>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => setFormData({ ...formData, country: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="China">Chine</SelectItem>
                        <SelectItem value="Vietnam">Vietnam</SelectItem>
                        <SelectItem value="Thailand">Thaïlande</SelectItem>
                        <SelectItem value="India">Inde</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nombre de fournisseurs */}
                  <div className="space-y-2">
                    <Label>Nombre de fournisseurs souhaités</Label>
                    <Select
                      value={formData.numSuppliers}
                      onValueChange={(value) => setFormData({ ...formData, numSuppliers: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 fournisseur</SelectItem>
                        <SelectItem value="2">2 fournisseurs</SelectItem>
                        <SelectItem value="3">3 fournisseurs</SelectItem>
                        <SelectItem value="5">5 fournisseurs</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type d'expédition */}
                  <div className="space-y-2">
                    <Label>Type d'expédition</Label>
                    <Select
                      value={formData.shippingType}
                      onValueChange={(value) => setFormData({ ...formData, shippingType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sea">Maritime (économique)</SelectItem>
                        <SelectItem value="air">Aérien (rapide)</SelectItem>
                        <SelectItem value="express">Express (très rapide)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Notes additionnelles (optionnel)</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Informations supplémentaires, exigences spéciales..."
                      rows={4}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || (formData.requestType === 'existing' && !formData.projectId) || (formData.requestType === 'new' && !formData.newProjectName)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? 'Envoi en cours...' : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Envoyer la demande
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Mes demandes */}
          <div>
            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle>Mes Demandes</CardTitle>
                <CardDescription>Suivi de vos cotations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myRequests.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Aucune demande</p>
                    </div>
                  ) : (
                    myRequests.map((request) => {
                      const statusInfo = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending_admin;
                      const StatusIcon = statusInfo.icon;

                      return (
                        <div
                          key={request.id}
                          className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-slate-900">
                                {(request.projects as any)?.name || 'Projet'}
                              </p>
                              <p className="text-xs text-slate-500 font-mono">
                                {request.request_number}
                              </p>
                            </div>
                            <Badge className={`${statusInfo.color} text-xs`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-600">Fournisseurs</span>
                              <span className="font-medium">{request.num_suppliers}</span>
                            </div>
                            
                            {request.status !== 'pending_admin' && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-600">Progression</span>
                                  <span className="font-medium">{Math.round(request.progress_percentage)}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                  <div
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-1.5 rounded-full transition-all"
                                    style={{ width: `${request.progress_percentage}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 mt-2">
                            {new Date(request.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
