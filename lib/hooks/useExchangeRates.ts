// @ts-nocheck
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
}

/**
 * Hook pour récupérer les taux de change depuis la base de données
 * Utilise les taux de la table exchange_rates gérée dans /admin/exchange-rates
 */
export function useExchangeRates() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('exchange_rates')
        .select('from_currency, to_currency, rate')
        .eq('to_currency', 'FCFA')
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Convertir en objet clé-valeur pour accès rapide
      const ratesMap: Record<string, number> = {};
      (data || []).forEach((rate: ExchangeRate) => {
        ratesMap[rate.from_currency] = rate.rate;
      });

      // Ajouter FCFA -> FCFA = 1
      ratesMap['FCFA'] = 1;

      setRates(ratesMap);
      setError(null);
    } catch (err) {
      console.error('Error loading exchange rates:', err);
      setError(err as Error);
      // Fallback sur des taux par défaut en cas d'erreur
      setRates({
        'FCFA': 1,
        'CNY': 85,
        'USD': 600,
        'EUR': 655,
        'TRY': 20,
        'AED': 163,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Convertir un montant d'une devise vers FCFA
   */
  const convertToFCFA = (amount: number, fromCurrency: string): number => {
    const rate = rates[fromCurrency];
    if (!rate) {
      console.warn(`No exchange rate found for ${fromCurrency}, using 1`);
      return amount;
    }
    return amount * rate;
  };

  /**
   * Obtenir le taux pour une devise spécifique
   */
  const getRate = (fromCurrency: string): number => {
    return rates[fromCurrency] || 1;
  };

  /**
   * Recharger les taux depuis la base de données
   */
  const refresh = () => {
    loadRates();
  };

  return {
    rates,
    isLoading,
    error,
    convertToFCFA,
    getRate,
    refresh,
  };
}
