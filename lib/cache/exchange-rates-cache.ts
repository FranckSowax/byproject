/**
 * Cache pour les taux de change
 * Implémente un cache en mémoire avec TTL et localStorage comme fallback
 */

// @ts-nocheck
import { createClient } from '@/lib/supabase/client';

interface ExchangeRate {
  from_currency: string;
  to_currency: string;
  rate: number;
  updated_at?: string;
}

interface CacheEntry {
  data: Record<string, number>;
  timestamp: number;
  expiresAt: number;
}

const CACHE_KEY = 'exchange_rates_cache';
const CACHE_TTL = 1000 * 60 * 60; // 1 heure en millisecondes
const STORAGE_KEY = 'byproject_exchange_rates';

/**
 * Cache en mémoire
 */
class ExchangeRatesCache {
  private cache: CacheEntry | null = null;
  private fetchPromise: Promise<Record<string, number>> | null = null;

  /**
   * Obtenir les taux de change (avec cache)
   */
  async getRates(): Promise<Record<string, number>> {
    // 1. Vérifier le cache mémoire
    if (this.cache && this.cache.expiresAt > Date.now()) {
      console.log('📦 Exchange rates from memory cache');
      return this.cache.data;
    }

    // 2. Vérifier localStorage
    const storedCache = this.getFromLocalStorage();
    if (storedCache && storedCache.expiresAt > Date.now()) {
      console.log('💾 Exchange rates from localStorage');
      this.cache = storedCache;
      return storedCache.data;
    }

    // 3. Si déjà en train de fetcher, attendre
    if (this.fetchPromise) {
      console.log('⏳ Waiting for ongoing fetch...');
      return this.fetchPromise;
    }

    // 4. Fetcher depuis la base de données
    console.log('🌐 Fetching exchange rates from database...');
    this.fetchPromise = this.fetchFromDatabase();

    try {
      const rates = await this.fetchPromise;
      return rates;
    } finally {
      this.fetchPromise = null;
    }
  }

  /**
   * Fetcher depuis la base de données
   */
  private async fetchFromDatabase(): Promise<Record<string, number>> {
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('from_currency, to_currency, rate, updated_at')
        .eq('to_currency', 'FCFA')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Convertir en objet clé-valeur
      const ratesMap: Record<string, number> = {};
      (data || []).forEach((rate: ExchangeRate) => {
        ratesMap[rate.from_currency] = rate.rate;
      });

      // Ajouter FCFA -> FCFA = 1
      ratesMap['FCFA'] = 1;

      // Mettre en cache
      this.setCache(ratesMap);

      return ratesMap;
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      // Fallback sur les taux par défaut
      const fallbackRates = {
        'FCFA': 1,
        'CNY': 85,
        'USD': 600,
        'EUR': 655,
        'GBP': 765,
        'TRY': 20,
        'AED': 163,
      };

      // Mettre en cache même les fallback (mais avec TTL plus court)
      this.setCache(fallbackRates, 1000 * 60 * 5); // 5 minutes

      return fallbackRates;
    }
  }

  /**
   * Mettre en cache
   */
  private setCache(data: Record<string, number>, ttl: number = CACHE_TTL): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    // Cache mémoire
    this.cache = entry;

    // localStorage
    this.saveToLocalStorage(entry);
  }

  /**
   * Sauvegarder dans localStorage
   */
  private saveToLocalStorage(entry: CacheEntry): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  /**
   * Récupérer depuis localStorage
   */
  private getFromLocalStorage(): CacheEntry | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      return JSON.parse(stored) as CacheEntry;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return null;
    }
  }

  /**
   * Invalider le cache
   */
  invalidate(): void {
    console.log('🗑️ Invalidating exchange rates cache');
    this.cache = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Forcer le refresh
   */
  async refresh(): Promise<Record<string, number>> {
    this.invalidate();
    return this.getRates();
  }

  /**
   * Obtenir l'âge du cache (en secondes)
   */
  getCacheAge(): number | null {
    if (!this.cache) return null;
    return Math.floor((Date.now() - this.cache.timestamp) / 1000);
  }

  /**
   * Vérifier si le cache est valide
   */
  isCacheValid(): boolean {
    return this.cache !== null && this.cache.expiresAt > Date.now();
  }
}

// Instance singleton
const exchangeRatesCache = new ExchangeRatesCache();

export default exchangeRatesCache;

/**
 * Hook React pour utiliser le cache
 */
export function useCachedExchangeRates() {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cacheAge, setCacheAge] = useState<number | null>(null);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      setIsLoading(true);
      const data = await exchangeRatesCache.getRates();
      setRates(data);
      setCacheAge(exchangeRatesCache.getCacheAge());
      setError(null);
    } catch (err) {
      console.error('Error loading cached rates:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Convertir un montant vers FCFA
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
   * Obtenir le taux pour une devise
   */
  const getRate = (fromCurrency: string): number => {
    return rates[fromCurrency] || 1;
  };

  /**
   * Forcer le refresh
   */
  const refresh = async () => {
    try {
      setIsLoading(true);
      const data = await exchangeRatesCache.refresh();
      setRates(data);
      setCacheAge(0);
      setError(null);
    } catch (err) {
      console.error('Error refreshing rates:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    rates,
    isLoading,
    error,
    cacheAge,
    isCached: exchangeRatesCache.isCacheValid(),
    convertToFCFA,
    getRate,
    refresh,
  };
}
