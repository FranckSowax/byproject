"use client";

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Search,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  File,
  FileImage,
  Copy,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  file_url: string | null;
  file_type: string | null;
  materials_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

interface TemplateFormData {
  name: string;
  description: string;
  category: string;
  file: File | null;
}

export default function AdminTemplatesPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    category: 'residential',
    file: null,
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [searchTerm, categoryFilter, templates]);

  const loadTemplates = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/admin/templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const templatesData = await response.json();

      // Count materials for each template (if needed)
      const templatesWithCounts = (templatesData || []).map((template: any) => ({
        ...template,
        materials_count: 0, // TODO: Count from template_materials table
      }));

      setTemplates(templatesWithCounts);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Erreur lors du chargement des templates');
    } finally {
      setLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(term) ||
          template.description?.toLowerCase().includes(term) ||
          template.category?.toLowerCase().includes(term)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((template) => template.category === categoryFilter);
    }

    setFilteredTemplates(filtered);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
      ];
      
      if (!validTypes.includes(file.type)) {
        toast.error('Format de fichier non supporté. Utilisez PDF, Excel ou CSV');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Fichier trop volumineux. Taille max: 10MB');
        return;
      }

      setFormData({ ...formData, file });
      toast.success(`Fichier sélectionné: ${file.name}`);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `templates/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erreur lors de l\'upload du fichier');
      return null;
    }
  };

  const handleAddTemplate = async () => {
    if (!formData.name) {
      toast.error('Le nom est obligatoire');
      return;
    }

    try {
      setUploading(true);

      let fileUrl = null;
      let fileType = null;

      if (formData.file) {
        fileUrl = await uploadFile(formData.file);
        fileType = formData.file.type;
        if (!fileUrl) return;
      }

      const { error } = await supabase.from('templates').insert({
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        file_url: fileUrl,
        file_type: fileType,
        is_active: true,
      });

      if (error) throw error;

      toast.success('Template créé avec succès');
      setIsAddDialogOpen(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Error adding template:', error);
      toast.error('Erreur lors de la création du template');
    } finally {
      setUploading(false);
    }
  };

  const handleEditTemplate = async () => {
    if (!selectedTemplate || !formData.name) {
      toast.error('Le nom est obligatoire');
      return;
    }

    try {
      setUploading(true);

      let fileUrl = selectedTemplate.file_url;
      let fileType = selectedTemplate.file_type;

      if (formData.file) {
        fileUrl = await uploadFile(formData.file);
        fileType = formData.file.type;
        if (!fileUrl) return;
      }

      const { error } = await supabase
        .from('templates')
        .update({
          name: formData.name,
          description: formData.description || null,
          category: formData.category,
          file_url: fileUrl,
          file_type: fileType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedTemplate.id);

      if (error) throw error;

      toast.success('Template mis à jour');
      setIsEditDialogOpen(false);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${template.name}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', template.id);

      if (error) throw error;

      toast.success('Template supprimé');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleTemplateStatus = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;

      toast.success(`Template ${template.is_active ? 'désactivé' : 'activé'}`);
      loadTemplates();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const duplicateTemplate = async (template: Template) => {
    try {
      const { error } = await supabase.from('templates').insert({
        name: `${template.name} (Copie)`,
        description: template.description,
        category: template.category,
        file_url: template.file_url,
        file_type: template.file_type,
        is_active: false,
      });

      if (error) throw error;

      toast.success('Template dupliqué');
      loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Erreur lors de la duplication');
    }
  };

  const openEditDialog = (template: Template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category || 'residential',
      file: null,
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (template: Template) => {
    setSelectedTemplate(template);
    setIsViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'residential',
      file: null,
    });
    setSelectedTemplate(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <FileText className="h-4 w-4" />;
    if (fileType.includes('pdf')) return <FileImage className="h-4 w-4 text-red-600" />;
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
      return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    }
    if (fileType.includes('csv')) return <File className="h-4 w-4 text-blue-600" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-purple-600" />
            Gestion des Templates
          </h1>
          <p className="text-gray-600 mt-1">
            Créez et gérez vos modèles de projets avec import Excel, CSV et PDF
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadTemplates}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Template
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Templates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{templates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Actifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {templates.filter((t) => t.is_active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avec Fichiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {templates.filter((t) => t.file_url).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Résidentiels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {templates.filter((t) => t.category === 'residential').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, description ou catégorie..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
              >
                <option value="all">Toutes catégories</option>
                <option value="residential">Résidentiel</option>
                <option value="commercial">Commercial</option>
                <option value="renovation">Rénovation</option>
              </select>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {filteredTemplates.length} template(s) trouvé(s)
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Fichier</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-600" />
                    <p className="mt-2 text-gray-600">Chargement...</p>
                  </TableCell>
                </TableRow>
              ) : filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">Aucun template trouvé</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {template.category === 'residential' && '🏠 Résidentiel'}
                        {template.category === 'commercial' && '🏢 Commercial'}
                        {template.category === 'renovation' && '🔨 Rénovation'}
                        {!template.category && 'Non catégorisé'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {template.file_url ? (
                        <div className="flex items-center gap-2">
                          {getFileIcon(template.file_type)}
                          <span className="text-xs text-gray-600">
                            {template.file_type?.includes('pdf') && 'PDF'}
                            {template.file_type?.includes('excel') && 'Excel'}
                            {template.file_type?.includes('spreadsheet') && 'Excel'}
                            {template.file_type?.includes('csv') && 'CSV'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {template.is_active ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Actif
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactif
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatDate(template.created_at)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openViewDialog(template)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateTemplate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Dupliquer
                          </DropdownMenuItem>
                          {template.file_url && (
                            <DropdownMenuItem onClick={() => window.open(template.file_url!, '_blank')}>
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger fichier
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => toggleTemplateStatus(template)}>
                            {template.is_active ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Activer
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteTemplate(template)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isAddDialogOpen ? 'Nouveau Template' : 'Modifier le Template'}
            </DialogTitle>
            <DialogDescription>
              {isAddDialogOpen 
                ? 'Créez un nouveau template de projet avec fichier optionnel'
                : 'Modifiez les informations du template'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="name">Nom du template *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Villa Moderne 3 chambres"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description détaillée du template..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="category">Catégorie</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-gray-300"
              >
                <option value="residential">🏠 Résidentiel</option>
                <option value="commercial">🏢 Commercial</option>
                <option value="renovation">🔨 Rénovation</option>
              </select>
            </div>
            <div>
              <Label htmlFor="file">Fichier (Excel, CSV ou PDF)</Label>
              <div className="mt-2 space-y-2">
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf"
                  onChange={handleFileChange}
                />
                {formData.file && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Upload className="h-4 w-4" />
                    {formData.file.name} ({(formData.file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
                {selectedTemplate?.file_url && !formData.file && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    {getFileIcon(selectedTemplate.file_type)}
                    Fichier actuel disponible
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  Formats acceptés: Excel (.xlsx, .xls), CSV (.csv), PDF (.pdf) - Max 10MB
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={isAddDialogOpen ? handleAddTemplate : handleEditTemplate}
              disabled={!formData.name || uploading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  {isAddDialogOpen ? 'Créer' : 'Enregistrer'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              {selectedTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              Détails complets du template
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-600">Description</Label>
                <p className="mt-1 text-sm">
                  {selectedTemplate.description || 'Aucune description'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Catégorie</Label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {selectedTemplate.category === 'residential' && '🏠 Résidentiel'}
                      {selectedTemplate.category === 'commercial' && '🏢 Commercial'}
                      {selectedTemplate.category === 'renovation' && '🔨 Rénovation'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Statut</Label>
                  <div className="mt-1">
                    {selectedTemplate.is_active ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactif
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {selectedTemplate.file_url && (
                <div>
                  <Label className="text-gray-600">Fichier attaché</Label>
                  <div className="mt-2 flex items-center gap-3">
                    {getFileIcon(selectedTemplate.file_type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {selectedTemplate.file_type?.includes('pdf') && 'Document PDF'}
                        {selectedTemplate.file_type?.includes('excel') && 'Fichier Excel'}
                        {selectedTemplate.file_type?.includes('spreadsheet') && 'Fichier Excel'}
                        {selectedTemplate.file_type?.includes('csv') && 'Fichier CSV'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(selectedTemplate.file_url!, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-600">Créé le</Label>
                  <p className="mt-1">{formatDate(selectedTemplate.created_at)}</p>
                </div>
                {selectedTemplate.updated_at && (
                  <div>
                    <Label className="text-gray-600">Mis à jour le</Label>
                    <p className="mt-1">{formatDate(selectedTemplate.updated_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fermer
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedTemplate) openEditDialog(selectedTemplate);
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
