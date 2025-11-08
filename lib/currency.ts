// @ts-nocheck
import { createClient } from '@/lib/supabase/client';

/**
 * Convertir un montant d'une devise vers FCFA en utilisant les taux de la base de données
 * @param amount - Montant à convertir
 * @param fromCurrency - Devise source (CNY, USD, EUR, etc.)
 * @returns Montant converti en FCFA
 */
export async function convertToFCFA(amount: number, fromCurrency: string): Promise<number> {
  if (fromCurrency === 'FCFA') {
    return amount;
  }

  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', 'FCFA')
      .single();

    if (error) {
      console.error(`Exchange rate not found for ${fromCurrency}:`, error);
      throw new Error(`Taux de change non trouvé pour ${fromCurrency}. Veuillez le configurer dans Admin > Taux de Change.`);
    }

    return amount * data.rate;
  } catch (error) {
    console.error('Error converting currency:', error);
    throw error;
  }
}

/**
 * Obtenir le taux de change pour une devise spécifique
 * @param fromCurrency - Devise source
 * @returns Taux de change vers FCFA
 */
export async function getExchangeRate(fromCurrency: string): Promise<number> {
  if (fromCurrency === 'FCFA') {
    return 1;
  }

  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', fromCurrency)
      .eq('to_currency', 'FCFA')
      .single();

    if (error) {
      console.error(`Exchange rate not found for ${fromCurrency}:`, error);
      throw new Error(`Taux de change non trouvé pour ${fromCurrency}`);
    }

    return data.rate;
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    throw error;
  }
}

/**
 * Obtenir tous les taux de change disponibles
 * @returns Map des taux de change (devise -> taux)
 */
export async function getAllExchangeRates(): Promise<Record<string, number>> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('from_currency, rate')
      .eq('to_currency', 'FCFA');

    if (error) {
      console.error('Error loading exchange rates:', error);
      return { 'FCFA': 1 };
    }

    const rates: Record<string, number> = { 'FCFA': 1 };
    (data || []).forEach((rate: any) => {
      rates[rate.from_currency] = rate.rate;
    });

    return rates;
  } catch (error) {
    console.error('Error getting all exchange rates:', error);
    return { 'FCFA': 1 };
  }
}
