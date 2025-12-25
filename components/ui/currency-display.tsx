"use client";

import { useCurrencyConversion } from '@/lib/hooks/useCurrencyConversion';
import { Badge } from './badge';
import { Info } from 'lucide-react';

interface CurrencyDisplayProps {
  amount: number;
  currency: string;
  showOriginal?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CurrencyDisplay({
  amount,
  currency,
  showOriginal = false,
  className = '',
  size = 'md'
}: CurrencyDisplayProps) {
  const { convertToUserCurrency, userCurrency, loading } = useCurrencyConversion();

  if (loading || !userCurrency) {
    return <span className={className}>{amount} {currency}</span>;
  }

  const converted = convertToUserCurrency(amount, currency);
  const isConverted = currency !== userCurrency.currency;

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg font-semibold'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={sizeClasses[size]}>
        {converted.amount.toLocaleString('fr-FR', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        })} {converted.symbol}
      </span>
      
      {isConverted && showOriginal && (
        <Badge variant="outline" className="text-xs" title={`Prix original: ${amount.toLocaleString('fr-FR')} ${currency}`}>
          <Info className="h-3 w-3 mr-1" />
          Converti
        </Badge>
      )}
    </div>
  );
}

interface PriceCardProps {
  price: {
    amount: number;
    currency: string;
    supplier?: { name: string };
    country?: string;
    notes?: string;
  };
  showDetails?: boolean;
}

export function PriceCard({ price, showDetails = true }: PriceCardProps) {
  const { convertToUserCurrency, userCurrency } = useCurrencyConversion();

  if (!userCurrency) return null;

  const converted = convertToUserCurrency(price.amount, price.currency);
  const isConverted = price.currency !== userCurrency.currency;

  return (
    <div className="border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-indigo-600">
            {converted.amount.toLocaleString('fr-FR', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            })} {converted.symbol}
          </div>
          {isConverted && (
            <div className="text-xs text-gray-500 mt-1">
              Prix original: {price.amount.toLocaleString('fr-FR')} {price.currency}
            </div>
          )}
        </div>
        {isConverted && (
          <Badge variant="secondary">
            Converti
          </Badge>
        )}
      </div>
      
      {showDetails && (
        <div className="text-sm text-gray-600 space-y-1">
          {price.supplier && (
            <p>Fournisseur: {price.supplier.name}</p>
          )}
          {price.country && (
            <p>Pays: {price.country}</p>
          )}
          {price.notes && (
            <p className="text-xs">{price.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

interface CurrencySelectorProps {
  onCurrencyChange?: (currency: string) => void;
}

export function CurrencySelector({ onCurrencyChange }: CurrencySelectorProps) {
  const { userCurrency, refreshUserCurrency } = useCurrencyConversion();

  if (!userCurrency) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-600">Devise:</span>
      <Badge className="bg-indigo-600">
        {userCurrency.symbol} ({userCurrency.currency})
      </Badge>
      <button
        onClick={() => {
          window.location.href = '/admin/currencies';
        }}
        className="text-indigo-600 hover:underline text-xs"
      >
        Changer
      </button>
    </div>
  );
}
