"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Globe,
  ArrowLeft,
  Send,
  Sparkles,
  Zap,
  Shield,
  Target,
  Info,
  CheckCircle2,
  Clock,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';

interface Project {
  id: string;
  name: string;
  created_at: string | null;
}

export default function QuoteRequestPage() {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    requestType: 'existing',
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
  }, []);

  const loadProjects = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // RLS filtre automatiquement par user_id
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
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

      // Générer un numéro de demande unique
      const requestNumber = `REQ-${Date.now()}-${nanoid(6).toUpperCase()}`;
      const publicToken = nanoid(32);

      // Créer la demande de cotation
      const { error: requestError } = await supabase
        .from('supplier_requests' as any)
        .insert({
          project_id: projectId,
          user_id: user.id,
          request_number: requestNumber,
          public_token: publicToken,
          status: 'pending_admin',
          num_suppliers: parseInt(formData.numSuppliers),
          materials_data: {},
          total_materials: 0,
          filled_materials: 0,
          progress_percentage: 0,
          metadata: {
            country: formData.country,
            shipping_type: formData.shippingType,
            notes: formData.notes,
          }
        });

      if (requestError) throw requestError;

      toast.success('Demande envoyée avec succès !', {
        description: 'Notre équipe va traiter votre demande sous 24-48h'
      });
      
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

      loadProjects();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error('Erreur lors de l\'envoi', {
        description: error.message || 'Veuillez réessayer'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-6 hover:bg-white/80">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au dashboard
            </Button>
          </Link>
          
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-6 shadow-lg">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-4">
              Obtenir une Cotation
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Nous sourçons votre projet auprès d'un <span className="font-semibold text-blue-600">minimum de 3 fournisseurs ou usines chinoises</span> sélectionnés.
              <br />
              Les cotations seront directement ajoutées à votre projet pour <span className="font-semibold">faciliter la comparaison</span>.
            </p>
          </div>
        </div>

        {/* Features Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Sourcing Expert</h3>
                  <p className="text-sm text-slate-600">Minimum 3 fournisseurs chinois qualifiés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Comparaison Facile</h3>
                  <p className="text-sm text-slate-600">Cotations ajoutées directement dans votre projet</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">Prix Compétitifs</h3>
                  <p className="text-sm text-slate-600">Meilleurs tarifs usine directement</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader className="space-y-3 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Nouvelle Demande de Cotation</CardTitle>
                    <CardDescription className="text-base mt-1">
                      Nous contacterons plusieurs fournisseurs chinois et ajouterons leurs cotations à votre projet
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Type de demande */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-semibold">Type de demande</Label>
                      <div className="group relative">
                        <Info className="h-4 w-4 text-slate-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-10">
                          Sélectionnez un projet existant ou créez-en un nouveau pour cette demande de cotation
                        </div>
                      </div>
                    </div>
                    <Select
                      value={formData.requestType}
                      onValueChange={(value) => setFormData({ ...formData, requestType: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="existing">📁 Projet existant</SelectItem>
                        <SelectItem value="new">✨ Nouveau projet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Projet existant */}
                  {formData.requestType === 'existing' && (
                    <div className="space-y-3 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                      <Label className="text-base font-semibold">Sélectionner un projet</Label>
                      <Select
                        value={formData.projectId}
                        onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                      >
                        <SelectTrigger className="h-12 bg-white">
                          <SelectValue placeholder="Choisir un projet existant" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.length === 0 ? (
                            <div className="p-4 text-center text-sm text-slate-500">
                              Aucun projet disponible. Créez-en un nouveau.
                            </div>
                          ) : (
                            projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                📁 {project.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Nouveau projet */}
                  {formData.requestType === 'new' && (
                    <div className="space-y-4 p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Nom du projet *</Label>
                        <Input
                          value={formData.newProjectName}
                          onChange={(e) => setFormData({ ...formData, newProjectName: e.target.value })}
                          placeholder="Ex: Construction Villa Moderne"
                          className="h-12 bg-white"
                          required
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Description (optionnel)</Label>
                        <Textarea
                          value={formData.newProjectDescription}
                          onChange={(e) => setFormData({ ...formData, newProjectDescription: e.target.value })}
                          placeholder="Décrivez brièvement votre projet : type de construction, localisation, besoins spécifiques..."
                          rows={4}
                          className="bg-white resize-none"
                        />
                      </div>
                    </div>
                  )}

                  <Separator className="my-6" />

                  {/* Pays */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-semibold">Pays du fournisseur *</Label>
                      <div className="group relative">
                        <Info className="h-4 w-4 text-slate-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-10">
                          Sélectionnez le pays d'origine des fournisseurs que vous souhaitez contacter
                        </div>
                      </div>
                    </div>
                    <Select
                      value={formData.country}
                      onValueChange={(value) => setFormData({ ...formData, country: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="China">🇨🇳 Chine</SelectItem>
                        <SelectItem value="Vietnam">🇻🇳 Vietnam</SelectItem>
                        <SelectItem value="Thailand">🇹🇭 Thaïlande</SelectItem>
                        <SelectItem value="India">🇮🇳 Inde</SelectItem>
                        <SelectItem value="Turkey">🇹🇷 Turquie</SelectItem>
                        <SelectItem value="Bangladesh">🇧🇩 Bangladesh</SelectItem>
                        <SelectItem value="Pakistan">🇵🇰 Pakistan</SelectItem>
                        <SelectItem value="Indonesia">🇮🇩 Indonésie</SelectItem>
                        <SelectItem value="Malaysia">🇲🇾 Malaisie</SelectItem>
                        <SelectItem value="Other">🌍 Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Nombre de fournisseurs */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-semibold">Nombre de fournisseurs *</Label>
                      <div className="group relative">
                        <Info className="h-4 w-4 text-slate-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-10">
                          Plus vous contactez de fournisseurs, plus vous aurez de chances d'obtenir le meilleur prix
                        </div>
                      </div>
                    </div>
                    <Select
                      value={formData.numSuppliers}
                      onValueChange={(value) => setFormData({ ...formData, numSuppliers: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 fournisseur</SelectItem>
                        <SelectItem value="2">2 fournisseurs (Recommandé)</SelectItem>
                        <SelectItem value="3">3 fournisseurs (Optimal)</SelectItem>
                        <SelectItem value="5">5 fournisseurs (Maximum)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type d'expédition */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="text-base font-semibold">Type d'expédition *</Label>
                      <div className="group relative">
                        <Info className="h-4 w-4 text-slate-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl z-10">
                          Le mode d'expédition influence le coût et le délai de livraison
                        </div>
                      </div>
                    </div>
                    <Select
                      value={formData.shippingType}
                      onValueChange={(value) => setFormData({ ...formData, shippingType: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sea">🚢 Maritime (30-45 jours, économique)</SelectItem>
                        <SelectItem value="air">✈️ Aérien (7-15 jours, rapide)</SelectItem>
                        <SelectItem value="express">⚡ Express (3-7 jours, premium)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="my-6" />

                  {/* Notes */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Notes et exigences spécifiques (optionnel)</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ajoutez ici toute information importante : certifications requises, normes spécifiques, délais particuliers, volumes estimés, etc."
                      rows={5}
                      className="resize-none"
                    />
                  </div>

                  <div className="pt-6">
                    <Button
                      type="submit"
                      disabled={loading || (formData.requestType === 'existing' && !formData.projectId) || (formData.requestType === 'new' && !formData.newProjectName)}
                      className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="h-5 w-5 mr-3" />
                          Envoyer ma demande de cotation
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-slate-500 mt-4">
                      En soumettant ce formulaire, vous acceptez d'être contacté par nos partenaires fournisseurs
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Comment ça marche */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Comment ça marche ?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Soumettez votre demande</p>
                    <p className="text-sm text-slate-600 mt-1">Remplissez le formulaire avec les détails de votre projet</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Validation par notre équipe</p>
                    <p className="text-sm text-slate-600 mt-1">Nous vérifions et transmettons votre demande aux fournisseurs qualifiés</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Recevez vos devis</p>
                    <p className="text-sm text-slate-600 mt-1">Comparez les offres et choisissez le meilleur fournisseur</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avantages */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Nos Avantages
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Réseau de fournisseurs vérifiés et certifiés</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Traduction automatique de vos besoins</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Suivi en temps réel de vos demandes</p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-slate-700">Support client dédié</p>
                </div>
              </CardContent>
            </Card>

            {/* Délais */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Délais Moyens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">Traitement de la demande</span>
                  <span className="font-semibold text-orange-600">24-48h</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">Réception des devis</span>
                  <span className="font-semibold text-orange-600">48-72h</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">Livraison maritime</span>
                  <span className="font-semibold text-orange-600">30-45 jours</span>
                </div>
              </CardContent>
            </Card>

            {/* Support */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-50 to-slate-100">
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 text-slate-600 mx-auto mb-3" />
                <h3 className="font-semibold text-slate-900 mb-2">Besoin d'aide ?</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Notre équipe est là pour vous accompagner
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/settings">
                    Contacter le support
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
