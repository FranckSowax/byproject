"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Building2, 
  Home, 
  Wrench, 
  ShoppingCart, 
  Star, 
  Search,
  TrendingUp,
  Users,
  Download,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Template {
  id: string;
  title: string;
  description: string;
  category: 'residential' | 'commercial' | 'renovation';
  price: number;
  currency: string;
  materials_count: number;
  estimated_budget: number;
  author: string;
  rating: number;
  downloads: number;
  image: string;
  tags: string[];
  preview_materials: string[];
}

const TEMPLATES: Template[] = [
  {
    id: '1',
    title: 'Villa 150m² - Construction Complète',
    description: 'Template complet pour la construction d\'une villa de 150m² avec tous les matériaux nécessaires : gros œuvre, second œuvre, finitions.',
    category: 'residential',
    price: 29000,
    currency: 'FCFA',
    materials_count: 127,
    estimated_budget: 45000000,
    author: 'Architecte Pro',
    rating: 4.8,
    downloads: 234,
    image: '🏡',
    tags: ['Villa', 'Résidentiel', 'Gros œuvre', 'Finitions'],
    preview_materials: ['Ciment', 'Fer à béton', 'Briques', 'Carrelage', 'Peinture']
  },
  {
    id: '2',
    title: 'Immeuble R+3 - Structure Béton',
    description: 'Projet d\'immeuble de 4 niveaux (R+3) avec structure en béton armé. Inclut fondations, poteaux, dalles et escaliers.',
    category: 'commercial',
    price: 49000,
    currency: 'FCFA',
    materials_count: 215,
    estimated_budget: 125000000,
    author: 'BTP Solutions',
    rating: 4.9,
    downloads: 156,
    image: '🏢',
    tags: ['Immeuble', 'Commercial', 'Béton armé', 'Multi-niveaux'],
    preview_materials: ['Béton', 'Acier HA', 'Coffrages', 'Agrégats', 'Ciment']
  },
  {
    id: '3',
    title: 'Rénovation Appartement 80m²',
    description: 'Template de rénovation complète d\'un appartement : démolition, électricité, plomberie, peinture, sols.',
    category: 'renovation',
    price: 15000,
    currency: 'FCFA',
    materials_count: 68,
    estimated_budget: 8500000,
    author: 'Rénov Expert',
    rating: 4.6,
    downloads: 412,
    image: '🔨',
    tags: ['Rénovation', 'Appartement', 'Second œuvre', 'Finitions'],
    preview_materials: ['Peinture', 'Parquet', 'Câbles électriques', 'Tuyauterie', 'Carrelage']
  },
  {
    id: '4',
    title: 'Maison R+1 - Économique',
    description: 'Construction d\'une maison à étage optimisée pour un budget réduit. Matériaux locaux privilégiés.',
    category: 'residential',
    price: 19000,
    currency: 'FCFA',
    materials_count: 95,
    estimated_budget: 28000000,
    author: 'Eco Build',
    rating: 4.7,
    downloads: 189,
    image: '🏠',
    tags: ['Maison', 'Économique', 'R+1', 'Matériaux locaux'],
    preview_materials: ['Parpaings', 'Ciment', 'Sable', 'Gravier', 'Tôles']
  },
  {
    id: '5',
    title: 'Local Commercial 200m²',
    description: 'Aménagement complet d\'un local commercial : cloisons, faux plafond, électricité, climatisation.',
    category: 'commercial',
    price: 35000,
    currency: 'FCFA',
    materials_count: 142,
    estimated_budget: 18000000,
    author: 'Commerce Pro',
    rating: 4.5,
    downloads: 98,
    image: '🏪',
    tags: ['Commercial', 'Aménagement', 'Climatisation', 'Électricité'],
    preview_materials: ['Placoplatre', 'Rails', 'Câbles', 'Climatiseurs', 'Luminaires']
  },
  {
    id: '6',
    title: 'Extension Maison 40m²',
    description: 'Projet d\'extension de maison existante : fondations, murs, toiture, raccordements.',
    category: 'renovation',
    price: 12000,
    currency: 'FCFA',
    materials_count: 54,
    estimated_budget: 6500000,
    author: 'Extension Plus',
    rating: 4.4,
    downloads: 267,
    image: '🏗️',
    tags: ['Extension', 'Agrandissement', 'Raccordement', 'Toiture'],
    preview_materials: ['Briques', 'Ciment', 'Charpente', 'Tuiles', 'Isolation']
  }
];

export default function TemplatesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handlePurchase = async (template: Template) => {
    setIsPurchasing(template.id);
    
    try {
      // Simuler un achat (à remplacer par vraie logique de paiement)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Créer un nouveau projet basé sur le template
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Vous devez être connecté');
        return;
      }

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          name: template.title,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Template "${template.title}" acheté et ajouté à vos projets !`);
      
      // Rediriger vers le nouveau projet
      setTimeout(() => {
        router.push(`/dashboard/projects/${project.id}`);
      }, 1000);
      
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Erreur lors de l\'achat du template');
    } finally {
      setIsPurchasing(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'residential': return <Home className="h-4 w-4" />;
      case 'commercial': return <Building2 className="h-4 w-4" />;
      case 'renovation': return <Wrench className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'residential': return 'Résidentiel';
      case 'commercial': return 'Commercial';
      case 'renovation': return 'Rénovation';
      default: return category;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FF] to-[#E8EEFF] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] bg-clip-text text-transparent">
                Marketplace de Templates
              </h1>
              <p className="text-gray-600 mt-1">
                Gagnez du temps avec des projets pré-configurés par la communauté
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="border-2 border-purple-100">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{TEMPLATES.length}</p>
                  <p className="text-sm text-gray-600">Templates disponibles</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-100">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">1,356</p>
                  <p className="text-sm text-gray-600">Téléchargements</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-2 border-green-100">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">4.7</p>
                  <p className="text-sm text-gray-600">Note moyenne</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Rechercher un template..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                  className={selectedCategory === 'all' ? 'bg-gradient-to-r from-purple-500 to-blue-500' : ''}
                >
                  Tous
                </Button>
                <Button
                  variant={selectedCategory === 'residential' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('residential')}
                  className={selectedCategory === 'residential' ? 'bg-gradient-to-r from-purple-500 to-blue-500' : ''}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Résidentiel
                </Button>
                <Button
                  variant={selectedCategory === 'commercial' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('commercial')}
                  className={selectedCategory === 'commercial' ? 'bg-gradient-to-r from-purple-500 to-blue-500' : ''}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Commercial
                </Button>
                <Button
                  variant={selectedCategory === 'renovation' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('renovation')}
                  className={selectedCategory === 'renovation' ? 'bg-gradient-to-r from-purple-500 to-blue-500' : ''}
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Rénovation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="border-0 shadow-lg hover:shadow-2xl transition-all overflow-hidden group">
              {/* Image/Icon */}
              <div className="h-32 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                {template.image}
              </div>

              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <Badge variant="outline" className="gap-1">
                    {getCategoryIcon(template.category)}
                    {getCategoryLabel(template.category)}
                  </Badge>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-semibold">{template.rating}</span>
                  </div>
                </div>
                <CardTitle className="text-xl">{template.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-600">Matériaux</p>
                    <p className="font-bold text-purple-600">{template.materials_count}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-600">Budget estimé</p>
                    <p className="font-bold text-green-600">
                      {(template.estimated_budget / 1000000).toFixed(1)}M
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Preview Materials */}
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Aperçu des matériaux :</p>
                  <div className="flex flex-wrap gap-1">
                    {template.preview_materials.map((material, index) => (
                      <span key={index} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {material}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Author & Downloads */}
                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <span>Par {template.author}</span>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    <span>{template.downloads}</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-between bg-gray-50 p-4">
                <div>
                  <p className="text-2xl font-bold text-purple-600">
                    {template.price.toLocaleString()} {template.currency}
                  </p>
                </div>
                <Button
                  onClick={() => handlePurchase(template)}
                  disabled={isPurchasing === template.id}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                >
                  {isPurchasing === template.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Achat...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Acheter
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredTemplates.length === 0 && (
          <Card className="border-0 shadow-lg p-12 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Aucun template trouvé
            </h3>
            <p className="text-gray-500">
              Essayez de modifier vos filtres ou votre recherche
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
