"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { MaterialsFilter } from '@/components/materials/MaterialsFilter';
import { ImageUpload } from '@/components/project/ImageUpload';
import { ArrowLeft, Upload, FileText, Plus, Loader2, File, CheckCircle2, AlertCircle, Image as ImageIcon, Trash2, Building2 } from 'lucide-react';
import Link from 'next/link';

interface Material {
  name: string;
  description: string;
  quantity: number;
  unit: string;
  category?: string;
  supplier?: {
    name: string;
    contact: string;
    phone: string;
    email: string;
    whatsapp?: string;
    address?: string;
  };
}

interface ParsingChunk {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  materials: Material[];
  error?: string;
}

export default function CreateTemplatePage() {
  const router = useRouter();
  const supabase = createClient();
  
  // Template info
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [category, setCategory] = useState<'residential' | 'commercial' | 'renovation'>('residential');
  
  // Presentation info
  const [presentationDescription, setPresentationDescription] = useState('');
  const [templateImages, setTemplateImages] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  
  // Manual materials
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filteredMaterials, setFilteredMaterials] = useState<Material[]>([]);
  const [newMaterial, setNewMaterial] = useState<Material>({
    name: '',
    description: '',
    quantity: 1,
    unit: 'unité',
    category: '',
    supplier: undefined
  });
  
  // Supplier for current material
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [supplierData, setSupplierData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    whatsapp: '',
    address: ''
  });
  
  // File upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingChunks, setParsingChunks] = useState<ParsingChunk[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);
  
  // Mode selection
  const [mode, setMode] = useState<'manual' | 'file'>('manual');
  
  const handleAddMaterial = () => {
    if (!newMaterial.name.trim()) {
      toast.error('Nom du matériau requis');
      return;
    }
    
    const materialToAdd = {
      ...newMaterial,
      supplier: showSupplierForm && supplierData.name ? { ...supplierData } : undefined
    };
    
    setMaterials([...materials, materialToAdd]);
    setNewMaterial({
      name: '',
      description: '',
      quantity: 1,
      unit: 'unité',
      category: '',
      supplier: undefined
    });
    setSupplierData({
      name: '',
      contact: '',
      phone: '',
      email: '',
      whatsapp: '',
      address: ''
    });
    setShowSupplierForm(false);
    toast.success('Matériau ajouté');
  };
  
  const handleRemoveMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index));
    toast.success('Matériau supprimé');
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel
      'application/pdf', // PDF
      'text/csv', // CSV
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
    ];
    
    if (!validTypes.includes(file.type)) {
      toast.error('Format non supporté. Utilisez Excel, PDF, CSV ou DOCX');
      return;
    }
    
    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 50MB)');
      return;
    }
    
    setSelectedFile(file);
    toast.success(`Fichier sélectionné: ${file.name}`);
  };
  
  const handleParseFile = async () => {
    if (!selectedFile) {
      toast.error('Aucun fichier sélectionné');
      return;
    }
    
    setIsParsing(true);
    setParsingChunks([]);
    setTotalProgress(0);
    
    try {
      // Upload file first
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const uploadResponse = await fetch('/api/upload-template-file', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Erreur upload fichier');
      }
      
      const { fileUrl, fileSize } = await uploadResponse.json();
      
      // Calculate number of chunks based on file size
      const chunkSize = 5 * 1024 * 1024; // 5MB per chunk
      const numChunks = Math.ceil(fileSize / chunkSize);
      
      // Initialize chunks
      const chunks: ParsingChunk[] = Array.from({ length: numChunks }, (_, i) => ({
        id: `chunk-${i}`,
        status: 'pending',
        progress: 0,
        materials: []
      }));
      
      setParsingChunks(chunks);
      
      // Process chunks sequentially to avoid data loss
      for (let i = 0; i < numChunks; i++) {
        // Update chunk status
        setParsingChunks(prev => prev.map((chunk, idx) => 
          idx === i ? { ...chunk, status: 'processing' } : chunk
        ));
        
        // Parse chunk
        const parseResponse = await fetch('/api/parse-template-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileUrl,
            chunkIndex: i,
            totalChunks: numChunks,
            fileType: selectedFile.type
          })
        });
        
        if (!parseResponse.ok) {
          throw new Error(`Erreur parsing chunk ${i + 1}`);
        }
        
        const { materials: chunkMaterials } = await parseResponse.json();
        
        // Update chunk with results
        setParsingChunks(prev => prev.map((chunk, idx) => 
          idx === i ? { 
            ...chunk, 
            status: 'completed', 
            progress: 100,
            materials: chunkMaterials 
          } : chunk
        ));
        
        // Add materials to the list
        setMaterials(prev => [...prev, ...chunkMaterials]);
        
        // Update total progress
        setTotalProgress(Math.round(((i + 1) / numChunks) * 100));
        
        toast.success(`Chunk ${i + 1}/${numChunks} traité`);
      }
      
      toast.success('✅ Fichier entièrement traité !');
      setMode('manual'); // Switch to manual mode to review materials
      
    } catch (error) {
      console.error('Parse error:', error);
      toast.error('Erreur lors du parsing');
      
      // Mark current chunk as error
      setParsingChunks(prev => prev.map(chunk => 
        chunk.status === 'processing' ? { ...chunk, status: 'error', error: 'Erreur parsing' } : chunk
      ));
    } finally {
      setIsParsing(false);
    }
  };
  
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Nom du template requis');
      return;
    }
    
    if (materials.length === 0) {
      toast.error('Ajoutez au moins un matériau');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Connexion requise');
        return;
      }
      
      // Create template
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .insert({
          name: templateName,
          description: templateDescription,
          category,
          materials_count: materials.length,
          is_active: true,
          user_id: user.id,
          presentation_description: presentationDescription,
          images: templateImages,
          main_image_index: mainImageIndex
        })
        .select()
        .single();
      
      if (templateError) throw templateError;
      
      // Save materials with supplier info
      const materialsData = materials.map(m => ({
        template_id: template.id,
        name: m.name,
        description: m.description,
        quantity: m.quantity,
        unit: m.unit,
        category: m.category || null,
        supplier_name: m.supplier?.name || null,
        supplier_contact: m.supplier?.contact || null,
        supplier_phone: m.supplier?.phone || null,
        supplier_email: m.supplier?.email || null,
        supplier_whatsapp: m.supplier?.whatsapp || null,
        supplier_address: m.supplier?.address || null
      }));
      
      const { error: materialsError } = await supabase
        .from('template_materials')
        .insert(materialsData);
      
      if (materialsError) throw materialsError;
      
      toast.success('✅ Template créé avec succès !');
      
      setTimeout(() => {
        router.push('/dashboard/templates');
      }, 1000);
      
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/templates">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux templates
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Créer un Template</h1>
          <p className="text-gray-600 mt-2">
            Créez un template de projet pour gagner du temps sur vos futurs projets
          </p>
        </div>
        
        {/* Template Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informations du Template</CardTitle>
            <CardDescription>Définissez les informations de base de votre template</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du template *</Label>
              <Input
                id="name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ex: Villa moderne 150m²"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Décrivez votre template..."
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Résidentiel</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="renovation">Rénovation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Presentation Info Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Présentation du Template
            </CardTitle>
            <CardDescription>
              Ces informations seront visibles quand on clique sur "Voir" le template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="presentation-desc">Description de présentation</Label>
              <Textarea
                id="presentation-desc"
                value={presentationDescription}
                onChange={(e) => setPresentationDescription(e.target.value)}
                placeholder="Décrivez ce template en détail (matériaux, spécificités, cas d'usage...)"
                rows={4}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cette description apparaîtra dans la vue détaillée du template
              </p>
            </div>
            
            <div>
              <Label className="text-base font-semibold mb-3 block">Images & Vidéos du Template</Label>
              <ImageUpload
                images={templateImages}
                onImagesChange={setTemplateImages}
                maxImages={10}
                bucket="templates"
                path="presentation"
              />
              {templateImages.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm">Image principale</Label>
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {templateImages.map((img, index) => (
                      <div
                        key={index}
                        onClick={() => setMainImageIndex(index)}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          mainImageIndex === index
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Image ${index + 1}`}
                          className="w-full h-20 object-cover"
                        />
                        {mainImageIndex === index && (
                          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-blue-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Cliquez sur une image pour la définir comme image principale
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Materials Section */}
        <Card>
          <CardHeader>
            <CardTitle>Matériaux du Template</CardTitle>
            <CardDescription>
              Ajoutez des matériaux manuellement ou importez depuis un fichier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v: any) => setMode(v)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="manual">Ajout Manuel</TabsTrigger>
                <TabsTrigger value="file">Import Fichier</TabsTrigger>
              </TabsList>
              
              {/* Manual Mode */}
              <TabsContent value="manual" className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-semibold mb-4">Ajouter un matériau</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nom *</Label>
                      <Input
                        value={newMaterial.name}
                        onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                        placeholder="Ex: Ciment"
                      />
                    </div>
                    <div>
                      <Label>Quantité *</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={newMaterial.quantity}
                          onChange={(e) => setNewMaterial({ ...newMaterial, quantity: parseFloat(e.target.value) || 1 })}
                          placeholder="1"
                          className="flex-1"
                        />
                        <Input
                          value={newMaterial.unit}
                          onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                          placeholder="unité"
                          className="w-32"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <Label>Catégorie</Label>
                      <Input
                        value={newMaterial.category}
                        onChange={(e) => setNewMaterial({ ...newMaterial, category: e.target.value })}
                        placeholder="Ex: Maçonnerie"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={newMaterial.description}
                        onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                        placeholder="Description optionnelle..."
                      />
                    </div>
                  </div>
                  
                  {/* Supplier Form Toggle */}
                  <div className="mt-4 border-t pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSupplierForm(!showSupplierForm)}
                      className="w-full"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      {showSupplierForm ? 'Masquer' : 'Ajouter un fournisseur'}
                    </Button>
                    
                    {showSupplierForm && (
                      <div className="mt-4 p-4 border rounded-lg bg-blue-50 space-y-3">
                        <h4 className="font-semibold text-sm flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Informations Fournisseur
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Nom du fournisseur *</Label>
                            <Input
                              value={supplierData.name}
                              onChange={(e) => setSupplierData({ ...supplierData, name: e.target.value })}
                              placeholder="Nom de l'entreprise"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Contact</Label>
                            <Input
                              value={supplierData.contact}
                              onChange={(e) => setSupplierData({ ...supplierData, contact: e.target.value })}
                              placeholder="Nom du contact"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Téléphone</Label>
                            <Input
                              value={supplierData.phone}
                              onChange={(e) => setSupplierData({ ...supplierData, phone: e.target.value })}
                              placeholder="+33 6 12 34 56 78"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">WhatsApp</Label>
                            <Input
                              value={supplierData.whatsapp}
                              onChange={(e) => setSupplierData({ ...supplierData, whatsapp: e.target.value })}
                              placeholder="+33 6 12 34 56 78"
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs">Email</Label>
                          <Input
                            type="email"
                            value={supplierData.email}
                            onChange={(e) => setSupplierData({ ...supplierData, email: e.target.value })}
                            placeholder="contact@fournisseur.com"
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs">Adresse</Label>
                          <Textarea
                            value={supplierData.address}
                            onChange={(e) => setSupplierData({ ...supplierData, address: e.target.value })}
                            placeholder="Adresse complète du fournisseur"
                            rows={2}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button onClick={handleAddMaterial} className="mt-4 w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter ce matériau
                  </Button>
                </div>
                
                {/* Materials List */}
                {materials.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Matériaux ajoutés ({materials.length})</h3>
                    
                    {/* Filtrage et Recherche Dynamique */}
                    <MaterialsFilter 
                      materials={materials}
                      onFilteredChange={setFilteredMaterials}
                      showPriceSort={false}
                    />
                    
                    <div className="space-y-2">
                      {filteredMaterials.map((material, index) => {
                        // Find original index for removal
                        const originalIndex = materials.findIndex(m => 
                          m.name === material.name && 
                          m.quantity === material.quantity && 
                          m.unit === material.unit
                        );
                        
                        return (
                          <div key={index} className="p-3 bg-white border rounded-lg hover:border-blue-500 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{material.name}</p>
                                  {material.category && (
                                    <Badge variant="secondary" className="text-xs">
                                      {material.category}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {material.quantity} {material.unit}
                                  {material.description && ` - ${material.description}`}
                                </p>
                                
                                {material.supplier && (
                                  <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                                    <div className="flex items-center gap-1 text-xs font-semibold text-blue-700 mb-1">
                                      <Building2 className="h-3 w-3" />
                                      Fournisseur
                                    </div>
                                    <p className="text-xs text-gray-700">
                                      <strong>{material.supplier.name}</strong>
                                      {material.supplier.contact && ` - ${material.supplier.contact}`}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600">
                                      {material.supplier.phone && (
                                        <span>📞 {material.supplier.phone}</span>
                                      )}
                                      {material.supplier.email && (
                                        <span>✉️ {material.supplier.email}</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMaterial(originalIndex)}
                                className="text-red-600 hover:bg-red-50 ml-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* File Mode */}
              <TabsContent value="file" className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <input
                    type="file"
                    id="template-file"
                    className="hidden"
                    accept=".xlsx,.xls,.pdf,.csv,.docx"
                    onChange={handleFileSelect}
                  />
                  <label htmlFor="template-file" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      {selectedFile ? selectedFile.name : 'Cliquez pour sélectionner un fichier'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Excel (.xlsx), PDF, CSV ou Word (.docx) - Max 50MB
                    </p>
                  </label>
                </div>
                
                {selectedFile && !isParsing && (
                  <Button onClick={handleParseFile} className="w-full" size="lg">
                    <FileText className="h-4 w-4 mr-2" />
                    Analyser le fichier avec IA
                  </Button>
                )}
                
                {/* Parsing Progress */}
                {isParsing && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Analyse en cours...</p>
                      <p className="text-sm text-gray-600">{totalProgress}%</p>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${totalProgress}%` }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      {parsingChunks.map((chunk, index) => (
                        <div key={chunk.id} className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                          <div className="flex-shrink-0">
                            {chunk.status === 'pending' && <File className="h-5 w-5 text-gray-400" />}
                            {chunk.status === 'processing' && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                            {chunk.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                            {chunk.status === 'error' && <AlertCircle className="h-5 w-5 text-red-600" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Chunk {index + 1}/{parsingChunks.length}</p>
                            {chunk.status === 'completed' && (
                              <p className="text-xs text-gray-600">{chunk.materials.length} matériaux extraits</p>
                            )}
                            {chunk.error && (
                              <p className="text-xs text-red-600">{chunk.error}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Actions */}
        <div className="mt-6 flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/templates')}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSaveTemplate}
            disabled={isUploading || materials.length === 0}
            className="flex-1 bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8]"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Créer le Template
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
