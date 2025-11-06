"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Building2, Home, Wrench, ShoppingCart, Star, Search, TrendingUp, Download, Eye, MapPin, Ruler, DollarSign, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Template {
  id: string; title: string; description: string; longDescription: string;
  category: 'residential' | 'commercial' | 'renovation';
  price: number; materials_count: number; estimated_budget: number; surface: number;
  author: string; rating: number; downloads: number; location: string;
  images: string[]; videoUrl?: string; tags: string[]; features: string[];
}

const TEMPLATES: Template[] = [
  { id: '1', title: 'Villa 150m²', description: 'Construction complète villa moderne', longDescription: 'Template complet pour villa 150m² avec gros œuvre, second œuvre et finitions. 4 chambres, 2 salles de bain, salon-salle à manger, cuisine équipée.', category: 'residential', price: 290000, materials_count: 127, estimated_budget: 45000000, surface: 150, author: 'Architecte Pro', rating: 4.8, downloads: 234, location: 'Abidjan, Côte d\'Ivoire', images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'], videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', tags: ['Villa', 'Résidentiel', 'Moderne'], features: ['4 Chambres', '2 SDB', 'Garage'] },
  { id: '2', title: 'Immeuble R+3', description: 'Structure béton armé 4 niveaux', longDescription: 'Immeuble professionnel R+3 avec fondations, poteaux, dalles, escaliers. Calculs structure inclus.', category: 'commercial', price: 490000, materials_count: 215, estimated_budget: 125000000, surface: 800, author: 'BTP Solutions', rating: 4.9, downloads: 156, location: 'Dakar, Sénégal', images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'], tags: ['Immeuble', 'Commercial'], features: ['8 Appartements', 'Parking', 'Ascenseur'] },
  { id: '3', title: 'Rénovation Appart 80m²', description: 'Rénovation complète appartement', longDescription: 'Guide complet rénovation 80m². Démolition, électricité, plomberie, sols, peinture.', category: 'renovation', price: 150000, materials_count: 68, estimated_budget: 8500000, surface: 80, author: 'Rénov Expert', rating: 4.6, downloads: 412, location: 'Lomé, Togo', images: ['https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800'], videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', tags: ['Rénovation'], features: ['2 Chambres', 'Cuisine ouverte'] },
  { id: '4', title: 'Maison R+1 Économique', description: 'Maison étage budget optimisé', longDescription: 'Maison R+1 120m² avec matériaux locaux. Coûts optimisés sans compromis qualité.', category: 'residential', price: 190000, materials_count: 95, estimated_budget: 28000000, surface: 120, author: 'Eco Build', rating: 4.7, downloads: 189, location: 'Cotonou, Bénin', images: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'], tags: ['Économique'], features: ['3 Chambres', 'Terrasse'] },
  { id: '5', title: 'Local Commercial 200m²', description: 'Aménagement local commercial', longDescription: 'Aménagement professionnel 200m². Cloisons, faux plafond, éclairage LED, climatisation.', category: 'commercial', price: 350000, materials_count: 142, estimated_budget: 18000000, surface: 200, author: 'Commerce Pro', rating: 4.5, downloads: 98, location: 'Ouagadougou', images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'], tags: ['Commercial'], features: ['Open space', 'Bureaux'] },
  { id: '6', title: 'Extension 40m²', description: 'Extension maison existante', longDescription: 'Extension harmonieuse 40m². Fondations, murs, toiture, raccordements.', category: 'renovation', price: 120000, materials_count: 54, estimated_budget: 6500000, surface: 40, author: 'Extension Plus', rating: 4.4, downloads: 267, location: 'Bamako, Mali', images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'], tags: ['Extension'], features: ['Grande pièce', 'Baie vitrée'] }
];

export default function TemplatesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['residential', 'commercial', 'renovation']);
  const [priceRange, setPriceRange] = useState([100000, 500000]);
  const [budgetRange, setBudgetRange] = useState([5, 150]);
  const [surfaceRange, setSurfaceRange] = useState([40, 800]);
  const [minDownloads, setMinDownloads] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const filteredTemplates = TEMPLATES.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategories.includes(t.category);
    const matchesPrice = t.price >= priceRange[0] && t.price <= priceRange[1];
    const matchesBudget = t.estimated_budget/1000000 >= budgetRange[0] && t.estimated_budget/1000000 <= budgetRange[1];
    const matchesSurface = t.surface >= surfaceRange[0] && t.surface <= surfaceRange[1];
    const matchesDownloads = t.downloads >= minDownloads;
    return matchesSearch && matchesCategory && matchesPrice && matchesBudget && matchesSurface && matchesDownloads;
  });

  const handleCategoryToggle = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const clearFilters = () => {
    setSelectedCategories(['residential', 'commercial', 'renovation']);
    setPriceRange([100000, 500000]); setBudgetRange([5, 150]); setSurfaceRange([40, 800]); setMinDownloads(0); setSearchQuery('');
  };

  const handlePurchase = async () => {
    if (!selectedTemplate) return;
    setIsPurchasing(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Connexion requise'); return; }
      const { data: project, error } = await supabase.from('projects').insert({ name: selectedTemplate.title, user_id: user.id }).select().single();
      if (error) throw error;
      toast.success('Template acheté !');
      setSelectedTemplate(null);
      setTimeout(() => router.push(`/dashboard/projects/${project.id}`), 1000);
    } catch (error) {
      toast.error('Erreur achat');
    } finally {
      setIsPurchasing(false);
    }
  };

  const getCategoryIcon = (cat: string) => cat === 'residential' ? <Home className="h-4 w-4" /> : cat === 'commercial' ? <Building2 className="h-4 w-4" /> : <Wrench className="h-4 w-4" />;
  const getCategoryLabel = (cat: string) => cat === 'residential' ? 'Résidentiel' : cat === 'commercial' ? 'Commercial' : 'Rénovation';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-r p-6 h-screen sticky top-0 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Filtres</h2>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-blue-600">Effacer</Button>
        </div>

        <div className="space-y-6">
          <div>
            <Label className="mb-2 block">Recherche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div>
            <Label className="mb-3 block flex items-center gap-2"><Home className="h-4 w-4" />Type de projet</Label>
            <div className="space-y-3">
              {[{id: 'residential', label: 'Résidentiel', icon: Home}, {id: 'commercial', label: 'Commercial', icon: Building2}, {id: 'renovation', label: 'Rénovation', icon: Wrench}].map(({id, label, icon: Icon}) => (
                <div key={id} className="flex items-center space-x-2">
                  <Checkbox id={id} checked={selectedCategories.includes(id)} onCheckedChange={() => handleCategoryToggle(id)} />
                  <label htmlFor={id} className="text-sm cursor-pointer flex items-center gap-2"><Icon className="h-4 w-4" />{label}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <Label className="mb-3 block flex items-center gap-2"><DollarSign className="h-4 w-4" />Prix template</Label>
            <Slider value={priceRange} onValueChange={setPriceRange} min={100000} max={500000} step={10000} className="mb-2" />
            <div className="flex justify-between text-xs text-gray-600">
              <span>{priceRange[0].toLocaleString()}</span><span>{priceRange[1].toLocaleString()} FCFA</span>
            </div>
          </div>

          <div className="border-t pt-6">
            <Label className="mb-3 block flex items-center gap-2"><TrendingUp className="h-4 w-4" />Budget projet (M FCFA)</Label>
            <Slider value={budgetRange} onValueChange={setBudgetRange} min={5} max={150} step={5} className="mb-2" />
            <div className="flex justify-between text-xs text-gray-600">
              <span>{budgetRange[0]}M</span><span>{budgetRange[1]}M</span>
            </div>
          </div>

          <div className="border-t pt-6">
            <Label className="mb-3 block flex items-center gap-2"><Ruler className="h-4 w-4" />Superficie (m²)</Label>
            <Slider value={surfaceRange} onValueChange={setSurfaceRange} min={40} max={800} step={10} className="mb-2" />
            <div className="flex justify-between text-xs text-gray-600">
              <span>{surfaceRange[0]}m²</span><span>{surfaceRange[1]}m²</span>
            </div>
          </div>

          <div className="border-t pt-6">
            <Label className="mb-3 block flex items-center gap-2"><Download className="h-4 w-4" />Téléchargements min</Label>
            <Slider value={[minDownloads]} onValueChange={(v) => setMinDownloads(v[0])} min={0} max={500} step={50} className="mb-2" />
            <div className="text-xs text-gray-600">{minDownloads}+</div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900">{filteredTemplates.length} template{filteredTemplates.length > 1 ? 's' : ''}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Marketplace Templates</h1>
          <p className="text-gray-600">Projets pré-configurés par la communauté</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTemplates.map((t) => (
            <Card key={t.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group border-0 bg-white" onClick={() => { setSelectedTemplate(t); setCurrentImageIndex(0); }}>
              <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                <img src={t.images[0]} alt={t.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <Badge className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm text-xs px-2 py-0.5 shadow-lg border-0 text-gray-900">
                  {getCategoryLabel(t.category)}
                </Badge>
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-full shadow-lg">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-bold text-gray-900">{t.rating}</span>
                </div>
                <div className="absolute bottom-2 right-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Voir détails
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm line-clamp-1 mb-1 text-gray-900">{t.title}</h3>
                <p className="text-xs text-gray-600 line-clamp-2 mb-2">{t.description}</p>
                <p className="text-[10px] text-gray-500 mb-3">
                  Budget estimé: {(t.estimated_budget/1000000).toFixed(1)}M FCFA
                </p>
                
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-blue-600 font-medium">Surface</p>
                    <p className="text-sm font-bold text-blue-900">{t.surface}m²</p>
                  </div>
                  <div className="flex-1 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-purple-600 font-medium">Matériaux</p>
                    <p className="text-sm font-bold text-purple-900">{t.materials_count}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-3 pb-3 border-b">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{t.location.split(',')[0]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    <span>{t.downloads}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <p className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {t.price.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-500">FCFA</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={(e) => { e.stopPropagation(); setSelectedTemplate(t); }} 
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg h-8 px-3"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    <span className="text-white">Voir</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <Card className="p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucun template</h3>
            <p className="text-gray-500 mb-4">Modifiez vos filtres</p>
            <Button onClick={clearFilters} variant="outline">Réinitialiser</Button>
          </Card>
        )}
      </main>

      {/* Modal */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedTemplate.title}</DialogTitle>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline" className="gap-1">{getCategoryIcon(selectedTemplate.category)}{getCategoryLabel(selectedTemplate.category)}</Badge>
                  <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /><span className="font-semibold">{selectedTemplate.rating}</span></div>
                  <div className="flex items-center gap-1 text-gray-600"><Download className="h-4 w-4" />{selectedTemplate.downloads}</div>
                </div>
              </DialogHeader>

              {/* Gallery */}
              <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
                <img src={selectedTemplate.images[currentImageIndex]} alt={selectedTemplate.title} className="w-full h-full object-cover" />
                {selectedTemplate.images.length > 1 && (
                  <>
                    <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80" onClick={() => setCurrentImageIndex(p => p === 0 ? selectedTemplate.images.length - 1 : p - 1)}>
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80" onClick={() => setCurrentImageIndex(p => p === selectedTemplate.images.length - 1 ? 0 : p + 1)}>
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {selectedTemplate.images.map((_, i) => (
                    <button key={i} onClick={() => setCurrentImageIndex(i)} className={`w-2 h-2 rounded-full ${i === currentImageIndex ? 'bg-white' : 'bg-white/50'}`} />
                  ))}
                </div>
              </div>

              {/* Video */}
              {selectedTemplate.videoUrl && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2"><Play className="h-5 w-5" />Vidéo de présentation</h3>
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe src={selectedTemplate.videoUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="mt-4 space-y-4">
                <div><h3 className="font-semibold mb-2">Description</h3><p className="text-gray-700">{selectedTemplate.longDescription}</p></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600">Surface</p><p className="text-2xl font-bold">{selectedTemplate.surface}m²</p></div>
                  <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600">Matériaux</p><p className="text-2xl font-bold">{selectedTemplate.materials_count}</p></div>
                  <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600">Budget</p><p className="text-2xl font-bold">{(selectedTemplate.estimated_budget/1000000).toFixed(1)}M</p></div>
                  <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm text-gray-600">Prix</p><p className="text-2xl font-bold text-blue-600">{selectedTemplate.price.toLocaleString()}</p></div>
                </div>
                <div><h3 className="font-semibold mb-2">Caractéristiques</h3><div className="flex flex-wrap gap-2">{selectedTemplate.features.map((f, i) => <Badge key={i} variant="secondary">{f}</Badge>)}</div></div>
                <div><h3 className="font-semibold mb-2">Tags</h3><div className="flex flex-wrap gap-2">{selectedTemplate.tags.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>)}</div></div>
                <div className="flex items-center justify-between pt-4 border-t">
                  <div><p className="text-sm text-gray-600">Par {selectedTemplate.author}</p><p className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedTemplate.location}</p></div>
                  <Button onClick={handlePurchase} disabled={isPurchasing} size="lg" className="bg-gradient-to-r from-purple-500 to-blue-500">
                    {isPurchasing ? 'Achat...' : <><ShoppingCart className="h-5 w-5 mr-2" />Acheter {selectedTemplate.price.toLocaleString()} FCFA</>}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
