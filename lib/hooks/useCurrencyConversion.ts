import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ConversionRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at: string;
}

interface UserCurrency {
  currency: string;
  symbol: string;
  country: string;
}

export function useCurrencyConversion() {
  const supabase = createClient();
  const [userCurrency, setUserCurrency] = useState<UserCurrency | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserCurrency();
    loadExchangeRates();
  }, []);

  const loadUserCurrency = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const currency = user.user_metadata?.currency || 'XAF';
        const symbol = user.user_metadata?.currency_symbol || 'FCFA';
        const country = user.user_metadata?.country || 'GA';
        
        setUserCurrency({ currency, symbol, country });
      } else {
        // Default to FCFA for Gabon
        setUserCurrency({ currency: 'XAF', symbol: 'FCFA', country: 'GA' });
      }
    } catch (error) {
      console.error('Error loading user currency:', error);
      setUserCurrency({ currency: 'XAF', symbol: 'FCFA', country: 'GA' });
    }
  };

  const loadExchangeRates = async () => {
    try {
      const { data: ratesData, error } = await supabase
        .from('exchange_rates')
        .select('from_currency, to_currency, rate, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Create a map of conversion rates
      const ratesMap: Record<string, number> = {};
      
      ratesData?.forEach((rate: ConversionRate) => {
        const key = `${rate.from_currency}_${rate.to_currency}`;
        ratesMap[key] = rate.rate;
      });

      setRates(ratesMap);
    } catch (error) {
      console.error('Error loading exchange rates:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Convert an amount from one currency to user's currency
   */
  const convertToUserCurrency = (
    amount: number,
    fromCurrency: string
  ): { amount: number; symbol: string; currency: string } => {
    if (!userCurrency) {
      return { amount, symbol: fromCurrency, currency: fromCurrency };
    }

    // If already in user's currency, return as is
    if (fromCurrency === userCurrency.currency) {
      return { 
        amount, 
        symbol: userCurrency.symbol, 
        currency: userCurrency.currency 
      };
    }

    // Get conversion rate
    const key = `${fromCurrency}_${userCurrency.currency}`;
    const rate = rates[key];

    if (rate) {
      return {
        amount: amount * rate,
        symbol: userCurrency.symbol,
        currency: userCurrency.currency
      };
    }

    // Try reverse conversion
    const reverseKey = `${userCurrency.currency}_${fromCurrency}`;
    const reverseRate = rates[reverseKey];

    if (reverseRate) {
      return {
        amount: amount / reverseRate,
        symbol: userCurrency.symbol,
        currency: userCurrency.currency
      };
    }

    // If no rate found, return original with warning
    console.warn(`No conversion rate found for ${fromCurrency} to ${userCurrency.currency}`);
    return { 
      amount, 
      symbol: fromCurrency, 
      currency: fromCurrency 
    };
  };

  /**
   * Format amount with currency symbol
   */
  const formatAmount = (
    amount: number,
    fromCurrency?: string,
    options?: { showOriginal?: boolean }
  ): string => {
    if (!userCurrency) return `${amount}`;

    if (fromCurrency && fromCurrency !== userCurrency.currency) {
      const converted = convertToUserCurrency(amount, fromCurrency);
      
      if (options?.showOriginal && fromCurrency !== converted.currency) {
        return `${converted.amount.toLocaleString('fr-FR', { 
          minimumFractionDigits: 0,
          maximumFractionDigits: 0 
        })} ${converted.symbol} (${amount.toLocaleString('fr-FR')} ${fromCurrency})`;
      }
      
      return `${converted.amount.toLocaleString('fr-FR', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      })} ${converted.symbol}`;
    }

    return `${amount.toLocaleString('fr-FR', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    })} ${userCurrency.symbol}`;
  };

  /**
   * Get conversion rate between two currencies
   */
  const getRate = (fromCurrency: string, toCurrency: string): number | null => {
    const key = `${fromCurrency}_${toCurrency}`;
    return rates[key] || null;
  };

  /**
   * Convert price object with all variations
   */
  const convertPrice = (price: {
    amount: number;
    currency: string;
    variations?: Array<{ amount: string; [key: string]: any }>;
  }) => {
    const converted = convertToUserCurrency(price.amount, price.currency);
    
    return {
      ...price,
      original_amount: price.amount,
      original_currency: price.currency,
      converted_amount: converted.amount,
      display_currency: converted.currency,
      display_symbol: converted.symbol,
      variations: price.variations?.map(v => ({
        ...v,
        original_amount: parseFloat(v.amount),
        converted_amount: convertToUserCurrency(parseFloat(v.amount), price.currency).amount
      }))
    };
  };

  return {
    userCurrency,
    rates,
    loading,
    convertToUserCurrency,
    formatAmount,
    getRate,
    convertPrice,
    refreshRates: loadExchangeRates,
    refreshUserCurrency: loadUserCurrency
  };
}
