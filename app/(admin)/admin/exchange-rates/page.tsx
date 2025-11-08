"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  TrendingUp,
  RefreshCw,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

// Principales paires de devises pour l'application
const MAIN_CURRENCY_PAIRS = [
  { from: 'CNY', to: 'XAF', label: 'Yuan Chinois → Franc CFA', defaultRate: 95, priority: 1 },
  { from: 'CNY', to: 'XOF', label: 'Yuan Chinois → Franc CFA (Ouest)', defaultRate: 95, priority: 1 },
  { from: 'USD', to: 'XAF', label: 'Dollar US → Franc CFA', defaultRate: 600, priority: 2 },
  { from: 'USD', to: 'XOF', label: 'Dollar US → Franc CFA (Ouest)', defaultRate: 600, priority: 2 },
  { from: 'EUR', to: 'XAF', label: 'Euro → Franc CFA', defaultRate: 655, priority: 2 },
  { from: 'EUR', to: 'XOF', label: 'Euro → Franc CFA (Ouest)', defaultRate: 655, priority: 2 },
  { from: 'CNY', to: 'EUR', label: 'Yuan Chinois → Euro', defaultRate: 0.13, priority: 3 },
  { from: 'CNY', to: 'USD', label: 'Yuan Chinois → Dollar US', defaultRate: 0.14, priority: 3 },
  { from: 'GBP', to: 'XAF', label: 'Livre Sterling → Franc CFA', defaultRate: 780, priority: 4 },
  { from: 'CHF', to: 'XAF', label: 'Franc Suisse → Franc CFA', defaultRate: 680, priority: 4 },
];

interface ExchangeRate {
  id: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: string;
  project_id?: string | null;
}

interface EditingRate {
  id: number;
  rate: string;
}

export default function ExchangeRatesPage() {
  const supabase = createClient();
  
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRate, setEditingRate] = useState<EditingRate | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRate, setNewRate] = useState({
    from_currency: 'CNY',
    to_currency: 'XAF',
    rate: '95'
  });

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setRates(data || []);
    } catch (error) {
      console.error('Error loading rates:', error);
      toast.error('Erreur lors du chargement des taux');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRate = async (id: number, newRateValue: string) => {
    try {
      const rateNumber = parseFloat(newRateValue);
      
      if (isNaN(rateNumber) || rateNumber <= 0) {
        toast.error('Taux invalide');
        return;
      }

      console.log('Updating rate:', { id, oldRate: rates.find(r => r.id === id)?.rate, newRate: rateNumber });

      const { data, error } = await supabase
        .from('exchange_rates')
        .update({ 
          rate: rateNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Update result:', data);

      toast.success(`Taux mis à jour: ${rateNumber}`);
      setEditingRate(null);
      
      // Force reload to get fresh data
      await loadRates();
    } catch (error) {
      console.error('Error updating rate:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleAddRate = async () => {
    try {
      const rateNumber = parseFloat(newRate.rate);
      
      if (isNaN(rateNumber) || rateNumber <= 0) {
        toast.error('Taux invalide');
        return;
      }

      // Check if rate already exists
      const existing = rates.find(
        r => r.from_currency === newRate.from_currency && r.to_currency === newRate.to_currency
      );

      if (existing) {
        toast.error('Ce taux existe déjà. Modifiez-le plutôt.');
        return;
      }

      const { error } = await supabase
        .from('exchange_rates')
        .insert([{
          from_currency: newRate.from_currency,
          to_currency: newRate.to_currency,
          rate: rateNumber,
          updated_at: new Date().toISOString()
        }]);

      if (error) throw error;

      toast.success('Taux ajouté avec succès');
      setIsAddDialogOpen(false);
      setNewRate({ from_currency: 'CNY', to_currency: 'XAF', rate: '95' });
      loadRates();
    } catch (error) {
      console.error('Error adding rate:', error);
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const handleDeleteRate = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce taux ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('exchange_rates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Taux supprimé');
      loadRates();
    } catch (error) {
      console.error('Error deleting rate:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleInitializeDefaultRates = async () => {
    try {
      const ratesToAdd = [];

      for (const pair of MAIN_CURRENCY_PAIRS) {
        const existing = rates.find(
          r => r.from_currency === pair.from && r.to_currency === pair.to
        );

        if (!existing) {
          ratesToAdd.push({
            from_currency: pair.from,
            to_currency: pair.to,
            rate: pair.defaultRate,
            updated_at: new Date().toISOString()
          });
        }
      }

      if (ratesToAdd.length === 0) {
        toast.info('Tous les taux par défaut existent déjà');
        return;
      }

      const { error } = await supabase
        .from('exchange_rates')
        .insert(ratesToAdd);

      if (error) throw error;

      toast.success(`${ratesToAdd.length} taux initialisés`);
      loadRates();
    } catch (error) {
      console.error('Error initializing rates:', error);
      toast.error('Erreur lors de l\'initialisation');
    }
  };

  const getRateLabel = (from: string, to: string) => {
    const pair = MAIN_CURRENCY_PAIRS.find(p => p.from === from && p.to === to);
    return pair?.label || `${from} → ${to}`;
  };

  const getPriorityBadge = (from: string, to: string) => {
    const pair = MAIN_CURRENCY_PAIRS.find(p => p.from === from && p.to === to);
    if (!pair) return null;

    const colors = {
      1: 'bg-red-600',
      2: 'bg-orange-600',
      3: 'bg-blue-600',
      4: 'bg-gray-600'
    };

    const labels = {
      1: 'Critique',
      2: 'Important',
      3: 'Standard',
      4: 'Secondaire'
    };

    return (
      <Badge className={colors[pair.priority as keyof typeof colors] || 'bg-gray-600'}>
        {labels[pair.priority as keyof typeof labels]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const missingRates = MAIN_CURRENCY_PAIRS.filter(
    pair => !rates.find(r => r.from_currency === pair.from && r.to_currency === pair.to)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-indigo-600" />
            Taux de Change
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez les taux de conversion utilisés dans toute l'application
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadRates}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Warning if missing rates */}
      {missingRates.length > 0 && (
        <Card className="border-orange-600 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">Taux Manquants</CardTitle>
            </div>
            <CardDescription className="text-orange-800">
              {missingRates.length} taux recommandés ne sont pas configurés
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {missingRates.map((pair, idx) => (
                <div key={idx} className="text-sm text-orange-900">
                  • {pair.label} (taux suggéré: {pair.defaultRate})
                </div>
              ))}
              <Button
                onClick={handleInitializeDefaultRates}
                className="mt-4 bg-orange-600 hover:bg-orange-700"
              >
                Initialiser les taux manquants
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Taux</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{rates.length}</div>
            <p className="text-xs text-gray-500 mt-1">Configurés</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taux Critiques</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {rates.filter(r => {
                const pair = MAIN_CURRENCY_PAIRS.find(p => p.from === r.from_currency && p.to === r.to_currency);
                return pair?.priority === 1;
              }).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">CNY → FCFA</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Dernière MAJ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-gray-900">
              {rates.length > 0 ? formatDate(rates[0].updated_at).split(' ')[0] : 'N/A'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {rates.length > 0 ? formatDate(rates[0].updated_at).split(' ')[1] : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Taux Manquants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{missingRates.length}</div>
            <p className="text-xs text-gray-500 mt-1">À configurer</p>
          </CardContent>
        </Card>
      </div>

      {/* Rates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Taux de Conversion</CardTitle>
          <CardDescription>
            Ces taux sont utilisés pour toutes les conversions de devises dans l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>De</TableHead>
                <TableHead>Vers</TableHead>
                <TableHead>Paire</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Taux</TableHead>
                <TableHead>Dernière MAJ</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
              ) : rates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <TrendingUp className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">Aucun taux configuré</p>
                    <Button
                      onClick={handleInitializeDefaultRates}
                      className="mt-4"
                    >
                      Initialiser les taux par défaut
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                rates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{rate.from_currency}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{rate.to_currency}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {getRateLabel(rate.from_currency, rate.to_currency)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPriorityBadge(rate.from_currency, rate.to_currency)}
                    </TableCell>
                    <TableCell>
                      {editingRate?.id === rate.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            value={editingRate.rate}
                            onChange={(e) => setEditingRate({ ...editingRate, rate: e.target.value })}
                            className="w-32"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => handleUpdateRate(rate.id, editingRate.rate)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingRate(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-indigo-600">
                            {rate.rate.toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4
                            })}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingRate({ id: rate.id, rate: rate.rate.toString() })}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatDate(rate.updated_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRate(rate.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Impact Notice */}
      <Card className="border-indigo-600 bg-indigo-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-indigo-900">Impact des Modifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-indigo-900 space-y-2">
          <p>✅ Les modifications sont <strong>appliquées immédiatement</strong> dans toute l'application</p>
          <p>✅ Tous les prix affichés utilisent ces taux pour la conversion</p>
          <p>✅ Les prix originaux sont conservés, seul l'affichage change</p>
          <p>⚠️ Modifiez les taux avec précaution car cela affecte tous les utilisateurs</p>
        </CardContent>
      </Card>

      {/* Add Rate Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un Taux de Change</DialogTitle>
            <DialogDescription>
              Définissez un nouveau taux de conversion entre deux devises
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Devise Source</Label>
              <Input
                value={newRate.from_currency}
                onChange={(e) => setNewRate({ ...newRate, from_currency: e.target.value.toUpperCase() })}
                placeholder="CNY"
                maxLength={3}
                className="uppercase"
              />
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>
            <div>
              <Label>Devise Cible</Label>
              <Input
                value={newRate.to_currency}
                onChange={(e) => setNewRate({ ...newRate, to_currency: e.target.value.toUpperCase() })}
                placeholder="XAF"
                maxLength={3}
                className="uppercase"
              />
            </div>
            <div>
              <Label>Taux de Conversion</Label>
              <Input
                type="number"
                step="0.01"
                value={newRate.rate}
                onChange={(e) => setNewRate({ ...newRate, rate: e.target.value })}
                placeholder="95"
              />
              <p className="text-xs text-gray-500 mt-1">
                1 {newRate.from_currency} = {newRate.rate} {newRate.to_currency}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddRate} className="bg-indigo-600 hover:bg-indigo-700">
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
