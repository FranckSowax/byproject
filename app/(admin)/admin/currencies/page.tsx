"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DollarSign,
  Globe,
  RefreshCw,
  CheckCircle2,
  Star,
  Search,
  MapPin,
  Languages,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

// Liste complète des pays avec leurs devises
const COUNTRIES_CURRENCIES = [
  // Afrique Francophone (FCFA)
  { country: 'Gabon', code: 'GA', language: 'fr', currency: 'XAF', currencyName: 'Franc CFA (BEAC)', symbol: 'FCFA', region: 'Afrique Centrale' },
  { country: 'Cameroun', code: 'CM', language: 'fr', currency: 'XAF', currencyName: 'Franc CFA (BEAC)', symbol: 'FCFA', region: 'Afrique Centrale' },
  { country: 'Congo', code: 'CG', language: 'fr', currency: 'XAF', currencyName: 'Franc CFA (BEAC)', symbol: 'FCFA', region: 'Afrique Centrale' },
  { country: 'RD Congo', code: 'CD', language: 'fr', currency: 'CDF', currencyName: 'Franc Congolais', symbol: 'FC', region: 'Afrique Centrale' },
  { country: 'Tchad', code: 'TD', language: 'fr', currency: 'XAF', currencyName: 'Franc CFA (BEAC)', symbol: 'FCFA', region: 'Afrique Centrale' },
  { country: 'Centrafrique', code: 'CF', language: 'fr', currency: 'XAF', currencyName: 'Franc CFA (BEAC)', symbol: 'FCFA', region: 'Afrique Centrale' },
  { country: 'Guinée Équatoriale', code: 'GQ', language: 'es', currency: 'XAF', currencyName: 'Franc CFA (BEAC)', symbol: 'FCFA', region: 'Afrique Centrale' },
  
  { country: 'Sénégal', code: 'SN', language: 'fr', currency: 'XOF', currencyName: 'Franc CFA (BCEAO)', symbol: 'FCFA', region: 'Afrique de l\'Ouest' },
  { country: 'Côte d\'Ivoire', code: 'CI', language: 'fr', currency: 'XOF', currencyName: 'Franc CFA (BCEAO)', symbol: 'FCFA', region: 'Afrique de l\'Ouest' },
  { country: 'Mali', code: 'ML', language: 'fr', currency: 'XOF', currencyName: 'Franc CFA (BCEAO)', symbol: 'FCFA', region: 'Afrique de l\'Ouest' },
  { country: 'Burkina Faso', code: 'BF', language: 'fr', currency: 'XOF', currencyName: 'Franc CFA (BCEAO)', symbol: 'FCFA', region: 'Afrique de l\'Ouest' },
  { country: 'Bénin', code: 'BJ', language: 'fr', currency: 'XOF', currencyName: 'Franc CFA (BCEAO)', symbol: 'FCFA', region: 'Afrique de l\'Ouest' },
  { country: 'Togo', code: 'TG', language: 'fr', currency: 'XOF', currencyName: 'Franc CFA (BCEAO)', symbol: 'FCFA', region: 'Afrique de l\'Ouest' },
  { country: 'Niger', code: 'NE', language: 'fr', currency: 'XOF', currencyName: 'Franc CFA (BCEAO)', symbol: 'FCFA', region: 'Afrique de l\'Ouest' },
  { country: 'Guinée-Bissau', code: 'GW', language: 'pt', currency: 'XOF', currencyName: 'Franc CFA (BCEAO)', symbol: 'FCFA', region: 'Afrique de l\'Ouest' },
  
  // Autres pays africains
  { country: 'Maroc', code: 'MA', language: 'ar', currency: 'MAD', currencyName: 'Dirham Marocain', symbol: 'DH', region: 'Afrique du Nord' },
  { country: 'Algérie', code: 'DZ', language: 'ar', currency: 'DZD', currencyName: 'Dinar Algérien', symbol: 'DA', region: 'Afrique du Nord' },
  { country: 'Tunisie', code: 'TN', language: 'ar', currency: 'TND', currencyName: 'Dinar Tunisien', symbol: 'DT', region: 'Afrique du Nord' },
  { country: 'Égypte', code: 'EG', language: 'ar', currency: 'EGP', currencyName: 'Livre Égyptienne', symbol: 'E£', region: 'Afrique du Nord' },
  { country: 'Afrique du Sud', code: 'ZA', language: 'en', currency: 'ZAR', currencyName: 'Rand Sud-Africain', symbol: 'R', region: 'Afrique Australe' },
  { country: 'Nigeria', code: 'NG', language: 'en', currency: 'NGN', currencyName: 'Naira Nigérian', symbol: '₦', region: 'Afrique de l\'Ouest' },
  { country: 'Kenya', code: 'KE', language: 'en', currency: 'KES', currencyName: 'Shilling Kenyan', symbol: 'KSh', region: 'Afrique de l\'Est' },
  { country: 'Ghana', code: 'GH', language: 'en', currency: 'GHS', currencyName: 'Cedi Ghanéen', symbol: 'GH₵', region: 'Afrique de l\'Ouest' },
  
  // Europe
  { country: 'France', code: 'FR', language: 'fr', currency: 'EUR', currencyName: 'Euro', symbol: '€', region: 'Europe' },
  { country: 'Belgique', code: 'BE', language: 'fr', currency: 'EUR', currencyName: 'Euro', symbol: '€', region: 'Europe' },
  { country: 'Suisse', code: 'CH', language: 'fr', currency: 'CHF', currencyName: 'Franc Suisse', symbol: 'CHF', region: 'Europe' },
  { country: 'Luxembourg', code: 'LU', language: 'fr', currency: 'EUR', currencyName: 'Euro', symbol: '€', region: 'Europe' },
  { country: 'Royaume-Uni', code: 'GB', language: 'en', currency: 'GBP', currencyName: 'Livre Sterling', symbol: '£', region: 'Europe' },
  
  // Asie
  { country: 'Chine', code: 'CN', language: 'zh', currency: 'CNY', currencyName: 'Yuan Chinois', symbol: '¥', region: 'Asie' },
  { country: 'Japon', code: 'JP', language: 'ja', currency: 'JPY', currencyName: 'Yen Japonais', symbol: '¥', region: 'Asie' },
  { country: 'Inde', code: 'IN', language: 'en', currency: 'INR', currencyName: 'Roupie Indienne', symbol: '₹', region: 'Asie' },
  { country: 'Émirats Arabes Unis', code: 'AE', language: 'ar', currency: 'AED', currencyName: 'Dirham des EAU', symbol: 'AED', region: 'Moyen-Orient' },
  
  // Amériques
  { country: 'États-Unis', code: 'US', language: 'en', currency: 'USD', currencyName: 'Dollar Américain', symbol: '$', region: 'Amérique du Nord' },
  { country: 'Canada', code: 'CA', language: 'en', currency: 'CAD', currencyName: 'Dollar Canadien', symbol: 'C$', region: 'Amérique du Nord' },
  { country: 'Brésil', code: 'BR', language: 'pt', currency: 'BRL', currencyName: 'Real Brésilien', symbol: 'R$', region: 'Amérique du Sud' },
];

interface UserPreference {
  id: string;
  user_id: string;
  country: string;
  language: string;
  currency: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export default function CurrenciesPage() {
  const supabase = createClient();
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userPreference, setUserPreference] = useState<UserPreference | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<typeof COUNTRIES_CURRENCIES[0] | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        // Try to load user preference (we'll need to create this table)
        // For now, check user metadata
        const country = user.user_metadata?.country;
        const language = user.user_metadata?.language || 'fr';
        const currency = user.user_metadata?.currency;

        if (country && currency) {
          const countryData = COUNTRIES_CURRENCIES.find(c => c.code === country);
          if (countryData) {
            setSelectedCountry(countryData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCountry = async (country: typeof COUNTRIES_CURRENCIES[0]) => {
    try {
      if (!currentUser) {
        toast.error('Vous devez être connecté');
        return;
      }

      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: {
          country: country.code,
          language: country.language,
          currency: country.currency,
          currency_symbol: country.symbol
        }
      });

      if (error) throw error;

      setSelectedCountry(country);
      setIsDialogOpen(false);
      toast.success(`Devise définie: ${country.currency} (${country.country})`);
      
      // Reload to update
      loadData();
    } catch (error) {
      console.error('Error updating currency:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const regions = Array.from(new Set(COUNTRIES_CURRENCIES.map(c => c.region)));
  
  const filteredCountries = COUNTRIES_CURRENCIES.filter(country => {
    const matchesSearch = searchTerm === '' || 
      country.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.currencyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = selectedRegion === 'all' || country.region === selectedRegion;
    
    return matchesSearch && matchesRegion;
  });

  // Group by currency
  const currencyGroups = filteredCountries.reduce((acc, country) => {
    if (!acc[country.currency]) {
      acc[country.currency] = [];
    }
    acc[country.currency].push(country);
    return acc;
  }, {} as Record<string, typeof COUNTRIES_CURRENCIES>);

  const uniqueCurrencies = Object.keys(currencyGroups).length;
  const fcfaCountries = COUNTRIES_CURRENCIES.filter(c => c.currency === 'XAF' || c.currency === 'XOF').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-indigo-600" />
            Gestion des Devises
          </h1>
          <p className="text-gray-600 mt-1">
            Sélectionnez la devise principale selon votre pays et langue
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Current Selection */}
      {selectedCountry && (
        <Card className="border-2 border-indigo-600">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Star className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <CardTitle>Devise Actuelle</CardTitle>
                  <CardDescription>Configuration de votre compte</CardDescription>
                </div>
              </div>
              <Button onClick={() => setIsDialogOpen(true)}>
                Changer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-600">Pays</Label>
                <p className="mt-1 font-medium text-lg">{selectedCountry.country}</p>
                <p className="text-xs text-gray-500">{selectedCountry.region}</p>
              </div>
              <div>
                <Label className="text-gray-600">Langue</Label>
                <p className="mt-1 font-medium text-lg">{selectedCountry.language.toUpperCase()}</p>
              </div>
              <div>
                <Label className="text-gray-600">Devise</Label>
                <p className="mt-1 font-medium text-lg">{selectedCountry.currency}</p>
                <p className="text-xs text-gray-500">{selectedCountry.currencyName}</p>
              </div>
              <div>
                <Label className="text-gray-600">Symbole</Label>
                <p className="mt-1 font-medium text-2xl text-indigo-600">{selectedCountry.symbol}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Pays</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{COUNTRIES_CURRENCIES.length}</div>
            <p className="text-xs text-gray-500 mt-1">Disponibles</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Devises Uniques</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{uniqueCurrencies}</div>
            <p className="text-xs text-gray-500 mt-1">Différentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Zone FCFA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{fcfaCountries}</div>
            <p className="text-xs text-gray-500 mt-1">Pays membres</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Régions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{regions.length}</div>
            <p className="text-xs text-gray-500 mt-1">Géographiques</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par pays, devise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="h-10 px-3 rounded-md border border-gray-300 bg-white"
            >
              <option value="all">Toutes les régions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {filteredCountries.length} pays trouvé(s)
          </div>
        </CardContent>
      </Card>

      {/* Countries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pays et Devises</CardTitle>
          <CardDescription>
            Cliquez sur un pays pour définir sa devise comme devise principale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pays</TableHead>
                <TableHead>Région</TableHead>
                <TableHead>Langue</TableHead>
                <TableHead>Devise</TableHead>
                <TableHead>Nom Complet</TableHead>
                <TableHead>Symbole</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                    <p className="mt-2 text-gray-600">Chargement...</p>
                  </TableCell>
                </TableRow>
              ) : filteredCountries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Globe className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">Aucun pays trouvé</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCountries.map((country) => (
                  <TableRow 
                    key={`${country.code}-${country.currency}`}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedCountry?.code === country.code && selectedCountry?.currency === country.currency
                        ? 'bg-indigo-50'
                        : ''
                    }`}
                    onClick={() => handleSelectCountry(country)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{country.country}</span>
                        {selectedCountry?.code === country.code && selectedCountry?.currency === country.currency && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{country.region}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Languages className="h-3 w-3 text-gray-400" />
                        <span className="text-sm">{country.language.toUpperCase()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-indigo-600">{country.currency}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{country.currencyName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg font-bold text-indigo-600">{country.symbol}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={selectedCountry?.code === country.code && selectedCountry?.currency === country.currency ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectCountry(country);
                        }}
                      >
                        {selectedCountry?.code === country.code && selectedCountry?.currency === country.currency ? 'Sélectionné' : 'Sélectionner'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Currency Groups Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Devises par Groupe</CardTitle>
          <CardDescription>Regroupement des pays par devise commune</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(currencyGroups).map(([currency, countries]) => (
              <div key={currency} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="bg-indigo-600">{currency}</Badge>
                  <span className="text-sm text-gray-500">{countries.length} pays</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{countries[0].currencyName}</p>
                <div className="flex flex-wrap gap-1">
                  {countries.map(c => (
                    <Badge key={c.code} variant="outline" className="text-xs">
                      {c.country}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Changer de Devise</DialogTitle>
            <DialogDescription>
              Sélectionnez votre pays pour définir automatiquement la devise et la langue
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {COUNTRIES_CURRENCIES.map((country) => (
                <div
                  key={`${country.code}-${country.currency}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelectCountry(country)}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{country.country}</p>
                      <p className="text-xs text-gray-500">{country.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge>{country.currency}</Badge>
                    <span className="text-lg font-bold text-indigo-600">{country.symbol}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
