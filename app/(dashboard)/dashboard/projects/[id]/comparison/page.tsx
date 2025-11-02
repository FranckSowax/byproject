'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Download, TrendingDown, TrendingUp, Ship, Package, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Material {
  id: string;
  name: string;
  quantity: number | null;
}

interface Price {
  id: number;
  material_id: string;
  country: string;
  amount: number;
  currency: string;
  converted_amount: number;
  package_length?: number | null;
  package_width?: number | null;
  package_height?: number | null;
  units_per_package?: number | null;
  supplier: {
    name: string;
    country: string;
  } | null;
}

export default function ComparisonPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [project, setProject] = useState<any>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [pricesByMaterial, setPricesByMaterial] = useState<Record<string, Price[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<'all' | 'Cameroun' | 'Chine'>('all');

  useEffect(() => {
    loadData();
  }, [params.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Charger le projet
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', params.id)
        .single();

      setProject(projectData);

      // Charger les matériaux
      const { data: materialsData } = await supabase
        .from('materials')
        .select('id, name, quantity')
        .eq('project_id', params.id)
        .order('name');

      setMaterials((materialsData as unknown as Material[]) || []);

      // Charger tous les prix
      if (materialsData && materialsData.length > 0) {
        const typedMaterials = materialsData as unknown as Material[];
        const materialIds = typedMaterials.map(m => m.id);
        const { data: pricesData } = await supabase
          .from('prices')
          .select(`
            *,
            supplier:suppliers(name, country)
          `)
          .in('material_id', materialIds);

        // Grouper les prix par matériau
        const grouped: Record<string, Price[]> = {};
        const typedPrices = (pricesData as unknown as Price[]) || [];
        typedPrices.forEach(price => {
          if (!grouped[price.material_id]) {
            grouped[price.material_id] = [];
          }
          grouped[price.material_id].push(price);
        });

        setPricesByMaterial(grouped);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  };

  const getBestPrice = (materialId: string, country?: string) => {
    const prices = pricesByMaterial[materialId] || [];
    const filtered = country ? prices.filter(p => p.country === country) : prices;
    if (filtered.length === 0) return null;
    return filtered.reduce((min, p) => 
      (p.converted_amount || p.amount) < (min.converted_amount || min.amount) ? p : min
    );
  };

  const calculateTotal = (country?: string) => {
    return materials.reduce((total, material) => {
      const bestPrice = getBestPrice(material.id, country);
      if (!bestPrice) return total;
      const quantity = material.quantity || 1;
      return total + (bestPrice.converted_amount || bestPrice.amount) * quantity;
    }, 0);
  };

  const calculateVolume = (country?: string) => {
    return materials.reduce((totalVolume, material) => {
      const bestPrice = getBestPrice(material.id, country);
      if (!bestPrice) return totalVolume;
      const quantity = material.quantity || 1;
      
      // Calcul CBM si dimensions disponibles
      if (bestPrice.package_length && bestPrice.package_width && bestPrice.package_height) {
        const cbmPerUnit = (bestPrice.package_length * bestPrice.package_width * bestPrice.package_height) / 1000000;
        const unitsPerPackage = bestPrice.units_per_package || 1;
        const packagesNeeded = Math.ceil(quantity / unitsPerPackage);
        return totalVolume + (cbmPerUnit * packagesNeeded);
      }
      return totalVolume;
    }, 0);
  };

  const calculateShippingCost = (volume: number, country?: string) => {
    // Tarifs estimés (à ajuster selon vos besoins)
    const rates: Record<string, number> = {
      'Chine': 50, // 50 USD par CBM (maritime)
      'Dubai': 80, // 80 USD par CBM (maritime)
      'Turquie': 70, // 70 USD par CBM (maritime)
    };
    
    const ratePerCBM = country && rates[country] ? rates[country] : 0;
    const shippingUSD = volume * ratePerCBM;
    
    // Conversion USD vers FCFA (taux approximatif: 1 USD = 600 FCFA)
    return shippingUSD * 600;
  };

  const totalLocal = calculateTotal('Cameroun');
  const totalChina = calculateTotal('Chine');
  const volumeLocal = calculateVolume('Cameroun');
  const volumeChina = calculateVolume('Chine');
  const shippingCostChina = calculateShippingCost(volumeChina, 'Chine');
  
  const totalChinaWithShipping = totalChina + shippingCostChina;
  const savings = totalLocal - totalChinaWithShipping;
  const savingsPercentage = totalLocal > 0 ? (savings / totalLocal * 100).toFixed(1) : 0;

  const countries = ['Cameroun', 'Chine'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleExportPDF = () => {
    toast.success('Export PDF en cours de développement');
    // TODO: Implémenter l'export PDF avec jsPDF ou react-pdf
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FF] to-[#E8EEFF] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header moderne */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/projects/${params.id}`}>
              <Button
                variant="ghost"
                className="hover:bg-white/50 rounded-xl"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] bg-clip-text text-transparent">
                Comparaison des Prix
              </h1>
              <p className="text-[#718096] mt-2">{project?.name}</p>
            </div>
            <Button 
              onClick={handleExportPDF}
              className="w-full sm:w-auto bg-white hover:bg-white text-[#5B5FC7] border-2 border-[#5B5FC7] hover:border-[#7B7FE8] shadow-lg rounded-xl px-6 py-6 transition-all hover:shadow-xl hover:shadow-[#5B5FC7]/20 relative overflow-hidden group"
            >
              <span className="absolute inset-0 border-2 border-[#5B5FC7] rounded-xl animate-pulse opacity-50"></span>
              <Download className="mr-2 h-5 w-5 relative z-10" />
              <span className="relative z-10">Exporter PDF</span>
            </Button>
          </div>
        </div>

        {/* Résumé Global - Style moderne */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[#4299E1] to-[#3182CE]" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#4299E1]/10 to-[#3182CE]/10 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-[#4299E1]" />
                </div>
                <p className="text-sm font-semibold text-[#718096]">📍 Coût Total Local</p>
              </div>
              <p className="text-4xl font-bold text-[#4299E1] mb-4">
                {totalLocal.toLocaleString()} <span className="text-xl">FCFA</span>
              </p>
              <div className="mt-4 pt-4 border-t border-[#E0E4FF]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[#718096]">Volume estimé:</p>
                  <p className="text-sm font-bold text-[#4299E1]">
                    {volumeLocal.toFixed(3)} CBM
                  </p>
                </div>
                <p className="text-xs text-[#718096]">
                  {materials.length} matériaux • Pas de frais transport
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[#48BB78] to-[#38A169]" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#48BB78]/10 to-[#38A169]/10 rounded-xl flex items-center justify-center">
                  <Ship className="h-6 w-6 text-[#48BB78]" />
                </div>
                <p className="text-sm font-semibold text-[#718096]">🇨🇳 Coût Matériaux Chine</p>
              </div>
              <p className="text-4xl font-bold text-[#48BB78] mb-4">
                {totalChina.toLocaleString()} <span className="text-xl">FCFA</span>
              </p>
              <div className="mt-4 pt-4 border-t border-[#E0E4FF] space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#718096]">Volume estimé:</p>
                  <p className="text-sm font-bold text-[#48BB78]">
                    {volumeChina.toFixed(3)} CBM
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#718096]">+ Transport maritime:</p>
                  <p className="text-sm font-bold text-[#FF9B7B]">
                    {shippingCostChina.toLocaleString()} FCFA
                  </p>
                </div>
                <div className="pt-3 border-t border-[#E0E4FF]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#718096]">Total avec transport:</p>
                    <p className="text-2xl font-bold text-[#48BB78]">
                      {totalChinaWithShipping.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${savings > 0 ? 'from-[#5B5FC7] to-[#7B7FE8]' : 'from-red-500 to-red-600'}`} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${savings > 0 ? 'from-[#5B5FC7]/10 to-[#7B7FE8]/10' : 'from-red-500/10 to-red-600/10'} rounded-xl flex items-center justify-center`}>
                  {savings > 0 ? (
                    <TrendingDown className="h-6 w-6 text-[#5B5FC7]" />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <p className="text-sm font-semibold text-[#718096]">
                  {savings > 0 ? '💰 Économie Totale' : '⚠️ Surcoût'}
                </p>
              </div>
              <p className={`text-4xl font-bold mb-4 ${savings > 0 ? 'text-[#5B5FC7]' : 'text-red-500'}`}>
                {Math.abs(savings).toLocaleString()} <span className="text-xl">FCFA</span>
              </p>
              <div className="mt-4 pt-4 border-t border-[#E0E4FF]">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[#718096]">Pourcentage:</p>
                  <p className={`text-lg font-bold ${savings > 0 ? 'text-[#5B5FC7]' : 'text-red-500'}`}>
                    {savingsPercentage}% {savings > 0 ? 'd\'économie' : 'de plus'}
                  </p>
                </div>
                <p className="text-xs text-[#718096]">
                  Incluant transport maritime
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="p-4 sm:p-6 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant={selectedCountry === 'all' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setSelectedCountry('all')}
              className={`w-full py-6 text-base font-semibold rounded-xl transition-all ${
                selectedCountry === 'all' 
                  ? 'bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] text-white shadow-lg hover:shadow-xl' 
                  : 'border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#F5F6FF]'
              }`}
            >
              Tous les pays
            </Button>
            <Button
              variant={selectedCountry === 'Cameroun' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setSelectedCountry('Cameroun')}
              className={`w-full py-6 text-base font-semibold rounded-xl transition-all ${
                selectedCountry === 'Cameroun' 
                  ? 'bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] text-white shadow-lg hover:shadow-xl' 
                  : 'border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#F5F6FF]'
              }`}
            >
              📍 Cameroun
            </Button>
            <Button
              variant={selectedCountry === 'Chine' ? 'default' : 'outline'}
              size="lg"
              onClick={() => setSelectedCountry('Chine')}
              className={`w-full py-6 text-base font-semibold rounded-xl transition-all ${
                selectedCountry === 'Chine' 
                  ? 'bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] text-white shadow-lg hover:shadow-xl' 
                  : 'border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#F5F6FF]'
              }`}
            >
              🇨🇳 Chine
            </Button>
          </div>
        </Card>

        {/* Tableau de Comparaison - Accordéon Mobile Responsive */}
        <Accordion type="multiple" className="space-y-4">
          {materials.map(material => {
            const prices = pricesByMaterial[material.id] || [];
            const filteredPrices = selectedCountry === 'all' 
              ? prices 
              : prices.filter(p => p.country === selectedCountry);
            
            const sortedPrices = [...filteredPrices].sort((a, b) => 
              (a.converted_amount || a.amount) - (b.converted_amount || b.amount)
            );

            const bestPrice = sortedPrices[0];
            const quantity = material.quantity || 1;

            return (
              <AccordionItem 
                key={material.id} 
                value={material.id}
                className="border-0 bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all data-[state=open]:border-2 data-[state=open]:border-[#5B5FC7]"
              >
                <AccordionTrigger className="hover:no-underline p-0 [&[data-state=open]>div]:bg-white [&[data-state=open]>div]:border-b-2 [&[data-state=open]>div]:border-[#5B5FC7] [&>svg]:hidden">
                  <div className="w-full bg-gradient-to-r from-gray-50 to-gray-100 transition-all flex items-center">
                    {/* Titre et infos - 3/4 de la largeur - aligné à gauche */}
                    <div className="flex-1 p-4 sm:p-6 text-left">
                      <h3 className="font-bold text-base sm:text-lg text-[#2D3748] mb-2">
                        {material.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#718096]">
                        <Badge variant="outline" className="bg-white/50">
                          Qté: {quantity}
                        </Badge>
                        {sortedPrices.length > 0 && (
                          <Badge variant="outline" className="bg-white/50">
                            {sortedPrices.length} prix
                          </Badge>
                        )}
                        {bestPrice && (
                          <Badge variant="outline" className="bg-[#48BB78]/10 text-[#48BB78] border-[#48BB78]/30">
                            Meilleur: {(bestPrice.converted_amount || bestPrice.amount).toLocaleString()} FCFA
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Zone chevron - 1/4 de la largeur */}
                    <div className="w-1/4 min-w-[80px] bg-[#5B5FC7]/5 hover:bg-[#5B5FC7]/10 transition-colors flex items-center justify-center h-full py-4 sm:py-6 border-l border-[#E0E4FF]">
                      <ChevronDown className="h-6 w-6 sm:h-7 sm:w-7 text-[#5B5FC7] shrink-0 transition-transform duration-200" />
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="p-0">
                  {/* Prix Cards - Mobile Friendly */}
                  {sortedPrices.length > 0 ? (
                    <div className="p-4 sm:p-6 bg-gradient-to-b from-[#F8F9FF] to-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {sortedPrices.map((price, index) => {
                        const isLowest = index === 0;
                        const unitPrice = price.converted_amount || price.amount;
                        const totalPrice = unitPrice * quantity;
                        const difference = isLowest ? 0 : unitPrice - (sortedPrices[0].converted_amount || sortedPrices[0].amount);

                        return (
                          <Card
                            key={price.id}
                            className={`p-4 ${isLowest ? 'border-2 border-green-500 bg-green-50' : 'hover:shadow-md transition-shadow'}`}
                          >
                            <div className="space-y-3">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  {isLowest && (
                                    <Badge className="bg-green-600">
                                      🏆 Meilleur
                                    </Badge>
                                  )}
                                  <Badge variant="outline">
                                    #{index + 1}
                                  </Badge>
                                </div>
                                <span className="text-2xl">
                                  {price.country === 'Cameroun' && '📍'}
                                  {price.country === 'Chine' && '🇨🇳'}
                                  {price.country === 'France' && '🇫🇷'}
                                </span>
                              </div>

                              {/* Fournisseur */}
                              {price.supplier && (
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {price.supplier.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {price.country}
                                  </p>
                                </div>
                              )}

                              {/* Prix Unitaire */}
                              <div className="bg-white p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">Prix unitaire</p>
                                <p className="text-2xl font-bold text-gray-900">
                                  {unitPrice.toLocaleString()} FCFA
                                </p>
                                {price.currency !== 'FCFA' && (
                                  <p className="text-xs text-gray-500">
                                    {price.amount} {price.currency}
                                  </p>
                                )}
                              </div>

                              {/* Prix Total */}
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 mb-1">
                                  Total ({quantity}x)
                                </p>
                                <p className="text-xl font-bold text-blue-600">
                                  {totalPrice.toLocaleString()} FCFA
                                </p>
                              </div>

                              {/* Différence */}
                              {!isLowest && difference > 0 && (
                                <div className="bg-red-50 border border-red-200 p-2 rounded">
                                  <p className="text-xs font-medium text-red-600">
                                    +{(difference * quantity).toLocaleString()} FCFA
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    vs meilleur prix
                                  </p>
                                </div>
                              )}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-[#718096]">
                    <p>Aucun prix disponible pour ce matériau</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
            );
          })}
        </Accordion>

        {/* Footer Summary */}
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Résumé du Projet</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Matériaux:</span>
                  <span className="font-medium">{materials.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Coût Local:</span>
                  <span className="font-medium">{totalLocal.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Coût Chine:</span>
                  <span className="font-medium">{totalChina.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Économie:</span>
                  <span className={`font-bold ${savings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {savings > 0 ? '-' : '+'}{Math.abs(savings).toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Recommandation</h3>
              {savings > 0 ? (
                <div className="bg-green-100 border border-green-300 rounded-lg p-4">
                  <p className="text-green-800 font-medium mb-2">
                    ✅ Acheter en Chine est plus avantageux
                  </p>
                  <p className="text-sm text-green-700">
                    Vous économiserez {savingsPercentage}% en important de Chine, 
                    soit {savings.toLocaleString()} FCFA sur le projet total.
                  </p>
                </div>
              ) : (
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                  <p className="text-blue-800 font-medium mb-2">
                    ℹ️ Acheter localement est préférable
                  </p>
                  <p className="text-sm text-blue-700">
                    Les prix locaux sont compétitifs pour ce projet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
