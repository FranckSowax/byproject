"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Mail, 
  MapPin,
  Percent,
  DollarSign,
  Package,
  Send,
  Eye,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface PriceVariation {
  id: string;
  label: string;
  labelFr?: string;
  amount: string;
  notes: string;
  notesFr?: string;
}

interface Price {
  id: number;
  amount: number;
  currency: string;
  country: string;
  supplier_name: string;
  variations: PriceVariation[];
}

interface Material {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  quantity: number | null;
  prices?: Price[];
  unavailable?: boolean;
}

interface SupplierQuote {
  id: string;
  supplier_request_id: string;
  supplier_name: string;
  supplier_email: string;
  supplier_company: string;
  supplier_country: string;
  supplier_phone?: string;
  supplier_whatsapp?: string;
  supplier_wechat?: string;
  supplier_reference?: string; // Anonymous reference for client (e.g., REF-A1B2)
  quoted_materials: Material[];
  status: string;
  submitted_at: string;
  created_at: string;
  admin_margin?: number;
  sent_to_client_at?: string;
  supplier_requests?: {
    id: string;
    request_number: string;
    project_id: string;
    user_id?: string;
    projects?: {
      id: string;
      name: string;
      user_id?: string;
    };
  };
  // New system fields
  isNewSystem?: boolean;
  tokenId?: string;
}

export default function AdminQuotationsPage() {
  const router = useRouter();
  const supabase = createClient();
  
  const [quotes, setQuotes] = useState<SupplierQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<SupplierQuote | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [margin, setMargin] = useState<number>(0);
  const [individualMargins, setIndividualMargins] = useState<{ [materialId: string]: number }>({});
  const [useIndividualMargins, setUseIndividualMargins] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      
      // Get the current session to get the access token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      // Use the admin API route which bypasses RLS issues
      const response = await fetch('/api/admin/quotes', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load quotes');
      }

      const { data } = await response.json();
      setQuotes(data || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
      toast.error('Erreur lors du chargement des cotations');
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuote = (quote: SupplierQuote) => {
    setSelectedQuote(quote);
    setMargin(quote.admin_margin || 0);
    
    // Initialize individual margins with global margin for all materials
    const initialMargins: { [key: string]: number } = {};
    quote.quoted_materials
      .filter(m => m.prices && m.prices.length > 0)
      .forEach(material => {
        initialMargins[material.id] = quote.admin_margin || 0;
      });
    setIndividualMargins(initialMargins);
    setUseIndividualMargins(false);
    
    setIsViewModalOpen(true);
  };

  const getMarginForMaterial = (materialId: string): number => {
    return useIndividualMargins ? (individualMargins[materialId] || 0) : margin;
  };

  const handleApplyGlobalMargin = () => {
    const newMargins: { [key: string]: number } = {};
    Object.keys(individualMargins).forEach(materialId => {
      newMargins[materialId] = margin;
    });
    setIndividualMargins(newMargins);
  };

  const calculatePriceWithMargin = (price: number, marginPercent: number): number => {
    return price * (1 + marginPercent / 100);
  };

  const handleSendToClient = async () => {
    if (!selectedQuote || !selectedQuote.supplier_requests?.project_id) {
      toast.error('Projet non trouvé');
      return;
    }

    try {
      setIsSending(true);

      const projectId = selectedQuote.supplier_requests.project_id;
      const userId = selectedQuote.supplier_requests.user_id || selectedQuote.supplier_requests.projects?.user_id;
      const projectName = selectedQuote.supplier_requests.projects?.name;

      // 1. Get all materials from the project
      const { data: projectMaterials, error: materialsError } = await supabase
        .from('materials')
        .select('id, name')
        .eq('project_id', projectId);

      if (materialsError) throw materialsError;

      // Create a map of material names to IDs
      const materialNameToId = new Map(
        projectMaterials?.map(m => [m.name.toLowerCase().trim(), m.id]) || []
      );

      // 2. Find or create admin supplier "Twinsk Company Ltd"
      const adminSupplierName = 'Twinsk Company Ltd';
      let supplierId: string | null = null;

      // Try to find existing Twinsk supplier
      const { data: existingSupplier } = await supabase
        .from('suppliers')
        .select('id')
        .ilike('name', adminSupplierName)
        .single();

      if (existingSupplier) {
        supplierId = existingSupplier.id;
      } else {
        // Create Twinsk admin supplier
        const { data: newSupplier, error: supplierError } = await supabase
          .from('suppliers')
          .insert({
            name: adminSupplierName,
            email: 'admin@twinsk.com',
            country: 'China',
          })
          .select('id')
          .single();

        if (supplierError) {
          console.error('Error creating Twinsk supplier:', supplierError);
        } else {
          supplierId = newSupplier.id;
        }
      }

      // 3. Get exchange rate for CNY to FCFA conversion
      const { data: exchangeRate } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', 'CNY')
        .eq('to_currency', 'FCFA')
        .single();

      const cnyToFcfaRate = exchangeRate?.rate || 95; // Default rate if not found

      // 4. Prepare prices with margin for each material
      const pricesWithMargin = selectedQuote.quoted_materials
        .filter(m => m.prices && m.prices.length > 0)
        .flatMap(material => {
          // Find the corresponding project material by name
          const projectMaterialId = materialNameToId.get(material.name.toLowerCase().trim());

          if (!projectMaterialId) {
            console.warn(`Material "${material.name}" not found in project`);
            return [];
          }

          return material.prices!.map(price => {
            const materialMargin = getMarginForMaterial(material.id);
            const finalAmount = calculatePriceWithMargin(price.amount, materialMargin);

            // Calculate FCFA conversion
            let convertedAmount = finalAmount;
            if (price.currency === 'CNY') {
              convertedAmount = finalAmount * cnyToFcfaRate;
            } else if (price.currency !== 'FCFA') {
              convertedAmount = finalAmount * cnyToFcfaRate;
            }

            // Prepare variations with margin
            const variationsWithMargin = price.variations?.map(v => ({
              ...v,
              amount: calculatePriceWithMargin(parseFloat(v.amount), materialMargin).toString(),
              originalAmount: v.amount,
            })) || [];

            // Use supplier reference (anonymous ID) for client-facing notes
            // Admin info is stored separately in material_quotations
            const supplierRef = selectedQuote.supplier_reference || `REF-${selectedQuote.id.slice(0, 8).toUpperCase()}`;

            return {
              material_id: projectMaterialId,
              supplier_id: supplierId,
              country: selectedQuote.supplier_country,
              amount: finalAmount,
              currency: price.currency,
              converted_amount: convertedAmount,
              // Client sees only the reference, not the actual supplier name
              notes: `Référence: ${supplierRef}\nPays: ${selectedQuote.supplier_country}`,
              notes_fr: `Référence: ${supplierRef}\nPays: ${selectedQuote.supplier_country}`,
              // Store supplier reference for tracking
              supplier_reference: supplierRef,
              variations: variationsWithMargin,
            };
          });
        });

      // 5. Get the session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      // 6. Call the API to send to client with notification
      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          quoteId: selectedQuote.id,
          projectId,
          userId,
          pricesWithMargin,
          supplierId,
          isNewSystem: selectedQuote.isNewSystem || false,
          projectName,
          materialCount: pricesWithMargin.length,
          // Pass original materials and supplier info for material_quotations database
          quotedMaterials: selectedQuote.quoted_materials,
          supplierInfo: {
            email: selectedQuote.supplier_email,
            company: selectedQuote.supplier_company,
            name: selectedQuote.supplier_name,
            country: selectedQuote.supplier_country,
            phone: selectedQuote.supplier_phone,
            whatsapp: selectedQuote.supplier_whatsapp,
            wechat: selectedQuote.supplier_wechat,
            reference: selectedQuote.supplier_reference || `REF-${selectedQuote.id.slice(0, 8).toUpperCase()}`,
          },
        }),
      });

      if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || 'Erreur lors de l\'envoi');
      }

      const result = await response.json();
      toast.success(result.message || `Cotation envoyée au client avec ${pricesWithMargin.length} prix ajoutés`);
      setIsViewModalOpen(false);
      loadQuotes();
    } catch (error: any) {
      console.error('Error sending to client:', error);
      toast.error(error.message || 'Erreur lors de l\'envoi au client');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-blue-500"><Clock className="h-3 w-3 mr-1" /> En attente</Badge>;
      case 'sent_to_client':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Envoyé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cotations Fournisseurs</h1>
        <p className="text-gray-600">Gérez les cotations reçues et ajoutez votre marge avant envoi au client</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Cotations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotes.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">En Attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {quotes.filter(q => q.status === 'submitted').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Envoyées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {quotes.filter(q => q.status === 'sent_to_client').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotes List */}
      <div className="space-y-4">
        {quotes.map((quote) => (
          <Card key={quote.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{quote.supplier_company}</CardTitle>
                    {getStatusBadge(quote.status)}
                  </div>
                  <CardDescription className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>Contact: {quote.supplier_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{quote.supplier_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{quote.supplier_country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      <span>
                        Projet: {quote.supplier_requests?.projects?.name || 'N/A'} 
                        {' - '}
                        Demande #{quote.supplier_requests?.request_number || 'N/A'}
                      </span>
                    </div>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 mb-2">
                    {new Date(quote.submitted_at).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  {quote.admin_margin && (
                    <Badge variant="outline" className="mb-2">
                      <Percent className="h-3 w-3 mr-1" />
                      Marge: {quote.admin_margin}%
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm">
                    <span className="font-semibold">
                      {quote.quoted_materials.filter(m => m.prices && m.prices.length > 0).length}
                    </span>
                    {' '}matériaux avec prix
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">
                      {quote.quoted_materials.filter(m => m.unavailable).length}
                    </span>
                    {' '}indisponibles
                  </div>
                </div>
                <Button onClick={() => handleViewQuote(quote)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir & Traiter
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {quotes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune cotation reçue pour le moment</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View & Process Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Cotation - {selectedQuote?.supplier_company}
            </DialogTitle>
            <DialogDescription>
              Vérifiez les prix et ajoutez votre marge avant envoi au client
            </DialogDescription>
          </DialogHeader>

          {selectedQuote && (
            <div className="space-y-6">
              {/* Supplier Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations Fournisseur</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Entreprise</Label>
                    <p className="font-medium">{selectedQuote.supplier_company}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Contact</Label>
                    <p className="font-medium">{selectedQuote.supplier_name}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Email</Label>
                    <p className="font-medium">{selectedQuote.supplier_email}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Pays</Label>
                    <p className="font-medium">{selectedQuote.supplier_country}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Margin Setting */}
              <Card className="border-2 border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Percent className="h-5 w-5 text-blue-600" />
                    Marge Administrative
                  </CardTitle>
                  <CardDescription>
                    {useIndividualMargins 
                      ? "Ajustez la marge pour chaque matériau individuellement"
                      : "Cette marge sera appliquée à tous les prix de cette cotation"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Toggle Mode */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="individualMargins"
                        checked={useIndividualMargins}
                        onChange={(e) => setUseIndividualMargins(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="individualMargins" className="cursor-pointer font-medium">
                        Marges individuelles par matériau
                      </Label>
                    </div>
                  </div>

                  {/* Global Margin */}
                  {!useIndividualMargins && (
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Label htmlFor="margin">Pourcentage de marge globale (%)</Label>
                        <Input
                          id="margin"
                          type="number"
                          step="0.1"
                          value={margin}
                          onChange={(e) => setMargin(parseFloat(e.target.value) || 0)}
                          className="mt-1"
                          placeholder="Ex: 15"
                        />
                      </div>
                      <div className="text-sm text-gray-600 pt-6">
                        {margin > 0 && (
                          <span className="text-blue-600 font-medium">
                            +{margin}% sur tous les prix
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Apply Global to All */}
                  {useIndividualMargins && (
                    <div className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex-1">
                        <Label htmlFor="globalMargin">Appliquer une marge à tous (%)</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id="globalMargin"
                            type="number"
                            step="0.1"
                            value={margin}
                            onChange={(e) => setMargin(parseFloat(e.target.value) || 0)}
                            placeholder="Ex: 15"
                          />
                          <Button onClick={handleApplyGlobalMargin} variant="outline">
                            Appliquer
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Materials with Prices */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Matériaux Cotés ({selectedQuote.quoted_materials.filter(m => m.prices && m.prices.length > 0).length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedQuote.quoted_materials
                      .filter(m => m.prices && m.prices.length > 0)
                      .map((material) => {
                        const materialMargin = getMarginForMaterial(material.id);
                        return (
                        <div key={material.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{material.name}</h4>
                              {material.category && (
                                <p className="text-sm text-gray-600">{material.category}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {material.quantity && (
                                <Badge variant="outline">Qté: {material.quantity}</Badge>
                              )}
                              {/* Individual Margin Input */}
                              {useIndividualMargins && (
                                <div className="flex items-center gap-2 ml-4">
                                  <Label className="text-xs text-gray-600 whitespace-nowrap">Marge:</Label>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    value={individualMargins[material.id] || 0}
                                    onChange={(e) => setIndividualMargins({
                                      ...individualMargins,
                                      [material.id]: parseFloat(e.target.value) || 0
                                    })}
                                    className="w-20 h-8 text-sm"
                                    placeholder="%"
                                  />
                                  <span className="text-xs text-gray-600">%</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {material.prices && material.prices.map((price, idx) => (
                            <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <Label className="text-xs text-gray-600">Prix Fournisseur</Label>
                                  <p className="text-lg font-semibold text-gray-900">
                                    {price.amount} {price.currency}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-600">Marge ({materialMargin}%)</Label>
                                  <p className="text-lg font-semibold text-blue-600">
                                    +{(price.amount * materialMargin / 100).toFixed(2)} {price.currency}
                                  </p>
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-600">Prix Client</Label>
                                  <p className="text-lg font-semibold text-green-600">
                                    {calculatePriceWithMargin(price.amount, materialMargin).toFixed(2)} {price.currency}
                                  </p>
                                </div>
                              </div>

                              {/* Variations */}
                              {price.variations && price.variations.length > 0 && (
                                <div className="mt-3 pt-3 border-t">
                                  <Label className="text-xs text-gray-600 mb-2 block">Variations de prix</Label>
                                  {price.variations.map((variation) => (
                                    <div key={variation.id} className="grid grid-cols-3 gap-4 text-sm mb-2">
                                      <div>
                                        <span className="text-gray-600">{variation.label}:</span>
                                        <span className="ml-2 font-medium">{variation.amount} {price.currency}</span>
                                      </div>
                                      <div className="text-blue-600">
                                        +{(parseFloat(variation.amount) * materialMargin / 100).toFixed(2)} {price.currency}
                                      </div>
                                      <div className="text-green-600 font-medium">
                                        {calculatePriceWithMargin(parseFloat(variation.amount), materialMargin).toFixed(2)} {price.currency}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>

              {/* Unavailable Materials */}
              {selectedQuote.quoted_materials.filter(m => m.unavailable).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-500" />
                      Matériaux Indisponibles ({selectedQuote.quoted_materials.filter(m => m.unavailable).length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedQuote.quoted_materials
                        .filter(m => m.unavailable)
                        .map((material) => (
                          <div key={material.id} className="flex items-center gap-2 text-gray-600">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span>{material.name}</span>
                            {material.category && (
                              <span className="text-sm text-gray-500">- {material.category}</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Fermer
            </Button>
            <Button 
              onClick={handleSendToClient}
              disabled={isSending || selectedQuote?.status === 'sent_to_client'}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSending ? (
                'Envoi...'
              ) : selectedQuote?.status === 'sent_to_client' ? (
                'Déjà envoyé'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer au Client
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
