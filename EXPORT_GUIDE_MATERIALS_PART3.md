# 📦 GUIDE D'EXPORT - PARTIE 3 : Page Comparaison & Modal Détail

---

## 11. PAGE DE COMPARAISON DES PRIX

### `app/dashboard/projects/[id]/comparison/page.tsx`

```typescript
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
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Material {
  id: string;
  name: string;
  quantity: number | null;
}

interface PriceVariation {
  id: string;
  label: string;
  amount: string;
  notes?: string;
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
  variations?: PriceVariation[] | null;
  supplier: {
    name: string;
    country: string;
  } | null;
}

interface ExtendedMaterial extends Material {
  isVariation?: boolean;
  parentId?: string;
  parentName?: string;
  variationLabel?: string;
  variationPrice?: number;
  basePrice?: Price;
}

export default function ComparisonPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [project, setProject] = useState<any>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [pricesByMaterial, setPricesByMaterial] = useState<Record<string, Price[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [params.id]);

  const expandMaterialsWithVariations = (materials: Material[], pricesByMaterial: Record<string, Price[]>): ExtendedMaterial[] => {
    const expanded: ExtendedMaterial[] = [];

    materials.forEach(material => {
      expanded.push(material);

      const prices = pricesByMaterial[material.id] || [];
      
      prices.forEach(price => {
        if (price.variations && price.variations.length > 0) {
          price.variations.forEach((variation, index) => {
            const variationMaterial: ExtendedMaterial = {
              id: `${material.id}-var-${price.id}-${index}`,
              name: `${material.name} - ${variation.label}`,
              quantity: material.quantity,
              isVariation: true,
              parentId: material.id,
              parentName: material.name,
              variationLabel: variation.label,
              variationPrice: parseFloat(variation.amount) || 0,
              basePrice: price,
            };
            expanded.push(variationMaterial);
          });
        }
      });
    });

    return expanded;
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const projectId = params.id as string;
      if (!projectId) return;

      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      setProject(projectData);

      const { data: materialsData } = await supabase
        .from('materials')
        .select('id, name, quantity')
        .eq('project_id', projectId)
        .order('name');

      setMaterials((materialsData as Material[]) || []);

      if (materialsData && materialsData.length > 0) {
        const materialIds = materialsData.map((m: any) => m.id);
        const { data: pricesData } = await supabase
          .from('prices')
          .select(`
            *,
            supplier:suppliers(name, country)
          `)
          .in('material_id', materialIds);

        const grouped: Record<string, Price[]> = {};
        const typedPrices = (pricesData as Price[]) || [];
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
    const filtered = country 
      ? prices.filter(p => p.country === country || p.supplier?.country === country) 
      : prices;
    if (filtered.length === 0) return null;
    return filtered.reduce((min, p) => 
      (p.converted_amount || p.amount) < (min.converted_amount || min.amount) ? p : min
    );
  };

  const calculateTotal = (country?: string) => {
    const expandedMaterials = expandMaterialsWithVariations(materials, pricesByMaterial);
    
    return expandedMaterials.reduce((total, material) => {
      if (material.isVariation && material.variationPrice) {
        const quantity = material.quantity || 1;
        return total + (material.variationPrice * quantity);
      }
      
      const bestPrice = getBestPrice(material.id, country);
      if (!bestPrice) return total;
      const quantity = material.quantity || 1;
      const price = bestPrice.converted_amount && bestPrice.converted_amount > 0 
        ? bestPrice.converted_amount 
        : bestPrice.amount;
      return total + price * quantity;
    }, 0);
  };

  const calculateVolume = (country?: string) => {
    return materials.reduce((totalVolume, material) => {
      const bestPrice = getBestPrice(material.id, country);
      if (!bestPrice) return totalVolume;
      const quantity = material.quantity || 1;
      
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
    const rates: Record<string, number> = {
      'Chine': 50,
      'Dubai': 80,
      'Turquie': 70,
    };
    
    const ratePerCBM = country && rates[country] ? rates[country] : 0;
    const shippingUSD = volume * ratePerCBM;
    return shippingUSD * 600; // Conversion USD -> FCFA
  };

  const countries = Array.from(
    new Set(
      Object.values(pricesByMaterial)
        .flat()
        .map(p => p.supplier?.country)
        .filter(Boolean)
    )
  ).sort() as string[];

  const localCountries = ['Cameroun', 'Gabon', 'Congo', 'RDC', 'Côte d\'Ivoire', 'Sénégal', 'Bénin', 'Togo'];
  
  const calculateLocalTotal = () => {
    const expandedMaterials = expandMaterialsWithVariations(materials, pricesByMaterial);
    
    return expandedMaterials.reduce((total, material) => {
      if (material.isVariation && material.variationPrice && material.basePrice) {
        const isLocal = localCountries.includes(material.basePrice.country || '') || 
                       localCountries.includes(material.basePrice.supplier?.country || '');
        if (isLocal) {
          const quantity = material.quantity || 1;
          return total + (material.variationPrice * quantity);
        }
        return total;
      }
      
      const prices = pricesByMaterial[material.id] || [];
      const localPrices = prices.filter(p => 
        localCountries.includes(p.country || '') || 
        localCountries.includes(p.supplier?.country || '')
      );
      if (localPrices.length === 0) return total;
      
      const bestLocalPrice = localPrices.reduce((min, p) => 
        (p.converted_amount || p.amount) < (min.converted_amount || min.amount) ? p : min
      );
      
      const quantity = material.quantity || 1;
      const price = bestLocalPrice.converted_amount && bestLocalPrice.converted_amount > 0
        ? bestLocalPrice.converted_amount
        : bestLocalPrice.amount;
      return total + price * quantity;
    }, 0);
  };
  
  const totalLocal = calculateLocalTotal();
  const totalChina = calculateTotal('Chine');
  const volumeLocal = calculateVolume();
  const volumeChina = calculateVolume('Chine');
  const shippingCostChina = calculateShippingCost(volumeChina, 'Chine');
  
  const totalChinaWithShipping = totalChina + shippingCostChina;
  const savings = totalLocal - totalChinaWithShipping;
  const savingsPercentage = totalLocal > 0 ? (savings / totalLocal * 100).toFixed(1) : 0;

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      const formatNumber = (num: number): string => {
        return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
      };
      
      const primaryColor: [number, number, number] = [91, 95, 199];
      
      // En-tête
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text('Rapport de Comparaison', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(project?.name || 'Projet', 105, 30, { align: 'center' });
      
      const today = new Date().toLocaleDateString('fr-FR');
      doc.setFontSize(10);
      doc.text(`Généré le ${today}`, 105, 36, { align: 'center' });
      
      // Résumé
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.text('Résumé Global', 14, 55);
      
      autoTable(doc, {
        startY: 60,
        head: [['Indicateur', 'Valeur']],
        body: [
          ['Coût Total Local', `${formatNumber(totalLocal)} FCFA`],
          ['Coût Matériaux Chine', `${formatNumber(totalChina)} FCFA`],
          ['Volume Chine', `${volumeChina.toFixed(3)} CBM`],
          ['Frais Transport Maritime', `${formatNumber(shippingCostChina)} FCFA`],
          ['Coût Total Chine (avec transport)', `${formatNumber(totalChinaWithShipping)} FCFA`],
          ['Économie / Surcoût', `${savings > 0 ? '-' : '+'}${formatNumber(Math.abs(savings))} FCFA (${savingsPercentage}%)`],
        ],
        headStyles: { fillColor: primaryColor, textColor: 255 },
        alternateRowStyles: { fillColor: [248, 249, 255] },
        margin: { left: 14, right: 14 },
      });
      
      // Détail par matériau
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Détail par Matériau', 14, 20);
      
      let currentY = 30;
      
      materials.forEach((material, index) => {
        const prices = pricesByMaterial[material.id] || [];
        const sortedPrices = [...prices].sort((a, b) => 
          (a.converted_amount || a.amount) - (b.converted_amount || b.amount)
        );
        
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.text(`${index + 1}. ${material.name}`, 14, currentY);
        currentY += 7;
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Quantité: ${material.quantity || 1}`, 14, currentY);
        currentY += 5;
        
        if (sortedPrices.length > 0) {
          const priceRows = sortedPrices.slice(0, 5).map((price, idx) => [
            idx === 0 ? '[MEILLEUR] ' + (price.supplier?.name || 'N/A') : price.supplier?.name || 'N/A',
            price.country,
            `${formatNumber(price.converted_amount || price.amount)} FCFA`,
            `${formatNumber((price.converted_amount || price.amount) * (material.quantity || 1))} FCFA`,
          ]);
          
          autoTable(doc, {
            startY: currentY,
            head: [['Fournisseur', 'Pays', 'Prix Unitaire', 'Total']],
            body: priceRows,
            headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            alternateRowStyles: { fillColor: [248, 249, 255] },
            margin: { left: 14, right: 14 },
            theme: 'grid',
          });
          
          currentY = (doc as any).lastAutoTable.finalY + 10;
        } else {
          doc.setTextColor(150, 150, 150);
          doc.text('Aucun prix disponible', 14, currentY);
          currentY += 10;
        }
      });
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `${project?.name || 'Projet'} - Page ${i}/${pageCount}`,
          105,
          290,
          { align: 'center' }
        );
      }
      
      const fileName = `comparaison-${project?.name || 'projet'}-${today.replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
      
      toast.success('PDF généré avec succès !');
    } catch (error) {
      console.error('Erreur PDF:', error);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FF] to-[#E8EEFF] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/projects/${params.id}`}>
              <Button variant="ghost" className="hover:bg-white/50 rounded-xl">
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
              className="w-full sm:w-auto bg-white hover:bg-white text-[#5B5FC7] border-2 border-[#5B5FC7] shadow-lg rounded-xl px-6 py-6"
            >
              <Download className="mr-2 h-5 w-5" />
              Exporter PDF
            </Button>
          </div>
        </div>

        {/* Cards Résumé */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Local */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[#4299E1] to-[#3182CE]" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#4299E1]/10 rounded-xl flex items-center justify-center">
                  <Package className="h-6 w-6 text-[#4299E1]" />
                </div>
                <p className="text-sm font-semibold text-[#718096]">📍 Coût Total Local</p>
              </div>
              <p className="text-4xl font-bold text-[#4299E1]">
                {totalLocal.toLocaleString()} <span className="text-xl">FCFA</span>
              </p>
            </div>
          </Card>

          {/* Card Chine */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[#48BB78] to-[#38A169]" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#48BB78]/10 rounded-xl flex items-center justify-center">
                  <Ship className="h-6 w-6 text-[#48BB78]" />
                </div>
                <p className="text-sm font-semibold text-[#718096]">🇨🇳 Coût Chine</p>
              </div>
              <p className="text-4xl font-bold text-[#48BB78]">
                {totalChina.toLocaleString()} <span className="text-xl">FCFA</span>
              </p>
              <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Volume:</span>
                  <span className="font-bold">{volumeChina.toFixed(3)} CBM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">+ Transport:</span>
                  <span className="font-bold text-orange-500">{shippingCostChina.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Total:</span>
                  <span className="text-xl font-bold">{totalChinaWithShipping.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Card Économie */}
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${savings > 0 ? 'from-[#5B5FC7] to-[#7B7FE8]' : 'from-red-500 to-red-600'}`} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 ${savings > 0 ? 'bg-[#5B5FC7]/10' : 'bg-red-500/10'} rounded-xl flex items-center justify-center`}>
                  {savings > 0 ? (
                    <TrendingDown className="h-6 w-6 text-[#5B5FC7]" />
                  ) : (
                    <TrendingUp className="h-6 w-6 text-red-500" />
                  )}
                </div>
                <p className="text-sm font-semibold text-[#718096]">
                  {savings > 0 ? '💰 Économie' : '⚠️ Surcoût'}
                </p>
              </div>
              <p className={`text-4xl font-bold ${savings > 0 ? 'text-[#5B5FC7]' : 'text-red-500'}`}>
                {Math.abs(savings).toLocaleString()} <span className="text-xl">FCFA</span>
              </p>
              <p className={`text-lg mt-2 ${savings > 0 ? 'text-[#5B5FC7]' : 'text-red-500'}`}>
                {savingsPercentage}% {savings > 0 ? "d'économie" : "de plus"}
              </p>
            </div>
          </Card>
        </div>

        {/* Filtres par pays */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant={selectedCountry === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCountry('all')}
              className={`py-4 rounded-xl ${selectedCountry === 'all' ? 'bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] text-white' : ''}`}
            >
              Tous les pays
            </Button>
            {countries.map(country => (
              <Button
                key={country}
                variant={selectedCountry === country ? 'default' : 'outline'}
                onClick={() => setSelectedCountry(country)}
                className={`py-4 rounded-xl ${selectedCountry === country ? 'bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] text-white' : ''}`}
              >
                {country}
              </Button>
            ))}
          </div>
        </Card>

        {/* Liste des matériaux */}
        <Accordion type="multiple" className="space-y-4">
          {expandMaterialsWithVariations(materials, pricesByMaterial).map(material => {
            const prices = pricesByMaterial[material.id] || [];
            const filteredPrices = selectedCountry === 'all' 
              ? prices 
              : prices.filter(p => p.supplier?.country === selectedCountry);
            
            const sortedPrices = [...filteredPrices].sort((a, b) => 
              (a.converted_amount || a.amount) - (b.converted_amount || b.amount)
            );

            const bestPrice = sortedPrices[0];
            const quantity = material.quantity || 1;

            return (
              <AccordionItem 
                key={material.id} 
                value={material.id}
                className="border-0 bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline p-0 [&>svg]:hidden">
                  <div className="w-full flex items-center">
                    <div className="flex-1 p-4 text-left">
                      <h3 className="font-bold text-lg">{material.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">Qté: {quantity}</Badge>
                        {sortedPrices.length > 0 && (
                          <Badge variant="outline">{sortedPrices.length} prix</Badge>
                        )}
                        {bestPrice && (
                          <Badge className="bg-green-100 text-green-700">
                            Meilleur: {(bestPrice.converted_amount || bestPrice.amount).toLocaleString()} FCFA
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="w-16 bg-[#5B5FC7]/5 flex items-center justify-center py-6">
                      <ChevronDown className="h-6 w-6 text-[#5B5FC7]" />
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="p-4 bg-gray-50">
                  {sortedPrices.length > 0 ? (
                    <div className="space-y-3">
                      {sortedPrices.map((price, idx) => (
                        <div 
                          key={price.id}
                          className={`p-4 rounded-xl border-2 ${idx === 0 ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white'}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold">{price.supplier?.name || 'Fournisseur inconnu'}</p>
                              <p className="text-sm text-gray-500">{price.country}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">
                                {(price.converted_amount || price.amount).toLocaleString()} FCFA
                              </p>
                              <p className="text-sm text-gray-500">
                                Total: {((price.converted_amount || price.amount) * quantity).toLocaleString()} FCFA
                              </p>
                            </div>
                          </div>
                          {idx === 0 && (
                            <Badge className="mt-2 bg-green-500 text-white">Meilleur prix</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Aucun prix disponible</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
```

---

*Suite dans EXPORT_GUIDE_MATERIALS_PART4.md (MaterialDetailModal complet)...*
