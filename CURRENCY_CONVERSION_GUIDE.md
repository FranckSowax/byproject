# Guide de Conversion Automatique des Devises 💱

Ce guide explique comment tous les prix sont automatiquement convertis dans la devise principale de l'utilisateur.

## 🎯 Principe

**Tous les prix, quelle que soit leur devise d'origine, sont automatiquement convertis et affichés dans la devise de l'utilisateur.**

### Exemple
```
Utilisateur: Gabon (Devise: XAF/FCFA)
Prix admin en CNY: 1000 ¥
Taux: 1 CNY = 95 FCFA
→ Affichage: 95,000 FCFA
```

---

## 🔧 Utilisation du Hook `useCurrencyConversion`

### Import
```typescript
import { useCurrencyConversion } from '@/lib/hooks/useCurrencyConversion';
```

### Dans un Composant
```typescript
function MyComponent() {
  const { 
    convertToUserCurrency,
    formatAmount,
    userCurrency,
    loading 
  } = useCurrencyConversion();

  // Convertir un montant
  const converted = convertToUserCurrency(1000, 'CNY');
  // { amount: 95000, symbol: 'FCFA', currency: 'XAF' }

  // Formater pour affichage
  const formatted = formatAmount(1000, 'CNY');
  // "95,000 FCFA"

  // Avec prix original
  const formattedWithOriginal = formatAmount(1000, 'CNY', { showOriginal: true });
  // "95,000 FCFA (1,000 CNY)"
}
```

---

## 🎨 Composants UI

### 1. `<CurrencyDisplay />`

Affiche un montant converti avec badge optionnel.

```typescript
import { CurrencyDisplay } from '@/components/ui/currency-display';

<CurrencyDisplay 
  amount={1000}
  currency="CNY"
  showOriginal={true}
  size="lg"
/>
// Affiche: "95,000 FCFA" + Badge "Converti"
```

**Props:**
- `amount`: Montant à afficher
- `currency`: Devise d'origine
- `showOriginal`: Afficher badge "Converti" (default: false)
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `className`: Classes CSS additionnelles

---

### 2. `<PriceCard />`

Carte complète pour afficher un prix avec détails.

```typescript
import { PriceCard } from '@/components/ui/currency-display';

<PriceCard 
  price={{
    amount: 1000,
    currency: 'CNY',
    supplier: { name: 'Twinsk Company' },
    country: 'China',
    notes: 'Prix FOB'
  }}
  showDetails={true}
/>
```

**Affichage:**
```
┌────────────────────────────┐
│ 95,000 FCFA    [Converti] │
│ Prix original: 1,000 CNY   │
│                            │
│ Fournisseur: Twinsk Company│
│ Pays: China                │
│ Prix FOB                   │
└────────────────────────────┘
```

---

### 3. `<CurrencySelector />`

Affiche la devise actuelle avec lien pour changer.

```typescript
import { CurrencySelector } from '@/components/ui/currency-display';

<CurrencySelector />
// Affiche: "Devise: FCFA (XAF) [Changer]"
```

---

## 📊 Conversion des Prix dans les Pages

### Page Projet - Affichage des Prix

**Avant (sans conversion):**
```typescript
<span>{price.amount} {price.currency}</span>
// Affiche: 1000 CNY
```

**Après (avec conversion):**
```typescript
import { CurrencyDisplay } from '@/components/ui/currency-display';

<CurrencyDisplay 
  amount={price.amount}
  currency={price.currency}
  showOriginal={true}
/>
// Affiche: 95,000 FCFA + Badge "Converti"
```

---

### Admin - Envoi de Prix

Quand l'admin envoie un prix en CNY, il est automatiquement converti pour l'utilisateur :

```typescript
// Admin envoie
const adminPrice = {
  amount: 1000,
  currency: 'CNY'
};

// Utilisateur voit (si devise = XAF)
const { convertToUserCurrency } = useCurrencyConversion();
const userPrice = convertToUserCurrency(1000, 'CNY');
// { amount: 95000, symbol: 'FCFA', currency: 'XAF' }
```

---

## 🔄 Taux de Change

### Stockage dans `exchange_rates`

```sql
CREATE TABLE exchange_rates (
  id INTEGER PRIMARY KEY,
  from_currency TEXT,
  to_currency TEXT,
  rate NUMERIC,
  updated_at TIMESTAMP
);
```

### Exemples de Taux

| From | To | Rate | Description |
|------|-----|------|-------------|
| CNY | XAF | 95 | 1 Yuan = 95 FCFA |
| CNY | FCFA | 95 | Alias pour XAF |
| USD | XAF | 600 | 1 Dollar = 600 FCFA |
| EUR | XAF | 655 | 1 Euro = 655 FCFA |
| CNY | EUR | 0.13 | 1 Yuan = 0.13 Euro |

---

## 🎯 Cas d'Usage Complets

### Use Case 1: Admin Envoie Prix Chinois

**Scénario:** Admin reçoit cotation de Chine et l'envoie au client gabonais

**Étapes:**
1. Admin reçoit: 1000 CNY
2. Admin envoie via `/admin/quotations`
3. Prix stocké: `{ amount: 1000, currency: 'CNY' }`
4. Client gabonais ouvre projet
5. Hook charge: `userCurrency = XAF`
6. Hook charge: `rate CNY→XAF = 95`
7. Conversion: `1000 * 95 = 95,000`
8. Affichage: **95,000 FCFA**

---

### Use Case 2: Utilisateur Change de Pays

**Scénario:** Utilisateur déménage du Gabon en France

**Avant:**
```
Pays: Gabon
Devise: XAF (FCFA)
Prix affiché: 95,000 FCFA
```

**Actions:**
1. Va sur `/admin/currencies`
2. Sélectionne "France"
3. Devise change: XAF → EUR

**Après:**
```
Pays: France
Devise: EUR (€)
Prix affiché: 145 € (converti depuis 1000 CNY)
Taux: 1 CNY = 0.145 EUR
```

---

### Use Case 3: Comparaison Multi-Devises

**Scénario:** Projet avec prix de plusieurs pays

**Prix stockés:**
```
Prix 1: 1000 CNY (Chine)
Prix 2: 150 USD (USA)
Prix 3: 130 EUR (France)
```

**Utilisateur Gabonais voit:**
```
Prix 1: 95,000 FCFA (converti)
Prix 2: 90,000 FCFA (converti)
Prix 3: 85,150 FCFA (converti)
```

**Utilisateur Français voit:**
```
Prix 1: 145 € (converti)
Prix 2: 138 € (converti)
Prix 3: 130 € (original)
```

---

## 🛠️ Implémentation dans les Pages Existantes

### 1. Page Projet (`/dashboard/projects/[id]/page.tsx`)

**Remplacer:**
```typescript
// Ancien code
<div className="text-2xl font-bold">
  {price.amount} {price.currency}
</div>
```

**Par:**
```typescript
// Nouveau code
import { CurrencyDisplay } from '@/components/ui/currency-display';

<CurrencyDisplay 
  amount={price.amount}
  currency={price.currency}
  showOriginal={true}
  size="lg"
/>
```

---

### 2. Page Matériaux (`/admin/materials/page.tsx`)

**Remplacer:**
```typescript
// Ancien code
<span>{material.price} FCFA</span>
```

**Par:**
```typescript
// Nouveau code
import { useCurrencyConversion } from '@/lib/hooks/useCurrencyConversion';

const { formatAmount } = useCurrencyConversion();

<span>{formatAmount(material.price, material.currency)}</span>
```

---

### 3. Page Cotations (`/admin/quotations/page.tsx`)

**Ajouter conversion lors de l'envoi:**
```typescript
import { useCurrencyConversion } from '@/lib/hooks/useCurrencyConversion';

const { convertPrice } = useCurrencyConversion();

// Avant d'insérer les prix
const convertedPrices = prices.map(price => convertPrice(price));

// Insérer avec montants originaux ET convertis
await supabase.from('prices').insert(
  convertedPrices.map(p => ({
    amount: p.original_amount,
    currency: p.original_currency,
    converted_amount: p.converted_amount,
    display_currency: p.display_currency
  }))
);
```

---

## 📝 Checklist d'Implémentation

### Pages à Mettre à Jour

- [ ] `/dashboard/projects/[id]/page.tsx` - Affichage des prix
- [ ] `/admin/quotations/page.tsx` - Envoi des cotations
- [ ] `/admin/materials/page.tsx` - Catalogue matériaux
- [ ] `/admin/suppliers/page.tsx` - Prix fournisseurs
- [ ] Tout composant affichant des prix

### Étapes

1. **Importer le hook**
   ```typescript
   import { useCurrencyConversion } from '@/lib/hooks/useCurrencyConversion';
   ```

2. **Utiliser dans le composant**
   ```typescript
   const { formatAmount, convertToUserCurrency } = useCurrencyConversion();
   ```

3. **Remplacer l'affichage**
   ```typescript
   // Avant
   {price.amount} {price.currency}
   
   // Après
   {formatAmount(price.amount, price.currency)}
   ```

4. **Ajouter badge "Converti" si nécessaire**
   ```typescript
   <CurrencyDisplay 
     amount={price.amount}
     currency={price.currency}
     showOriginal={true}
   />
   ```

---

## 🎨 Exemples Visuels

### Affichage Simple
```
95,000 FCFA
```

### Avec Badge Converti
```
95,000 FCFA [ℹ️ Converti]
```

### Avec Prix Original (hover)
```
95,000 FCFA [ℹ️ Converti]
     ↓ (au survol)
Prix original: 1,000 CNY
```

### Carte Prix Complète
```
┌────────────────────────────────┐
│ 95,000 FCFA        [Converti] │
│ Prix original: 1,000 CNY       │
│                                │
│ Fournisseur: Twinsk Company    │
│ Pays: China                    │
│ Délai: 30 jours                │
│ Prix FOB Shanghai              │
└────────────────────────────────┘
```

---

## 🚀 Prochaines Étapes

1. ✅ Hook de conversion créé
2. ✅ Composants UI créés
3. ⏳ Mettre à jour page projet
4. ⏳ Mettre à jour page cotations
5. ⏳ Mettre à jour page matériaux
6. ⏳ Tester toutes les conversions
7. ⏳ Documenter les taux de change

---

## 💡 Bonnes Pratiques

### 1. Toujours Stocker la Devise Originale
```typescript
// ✅ Bon
{
  amount: 1000,
  currency: 'CNY',
  converted_amount: 95000,
  display_currency: 'XAF'
}

// ❌ Mauvais (perte d'info)
{
  amount: 95000,
  currency: 'XAF'
}
```

### 2. Afficher Badge "Converti"
```typescript
// ✅ Bon - utilisateur sait que c'est converti
<CurrencyDisplay showOriginal={true} />

// ⚠️ Acceptable - mais moins clair
<CurrencyDisplay showOriginal={false} />
```

### 3. Gérer les Taux Manquants
```typescript
const converted = convertToUserCurrency(amount, currency);

if (converted.currency === currency) {
  // Pas de conversion = taux manquant
  console.warn(`Taux manquant: ${currency} → ${userCurrency}`);
}
```

---

## 🎉 Résumé

**Avant:**
- Prix affichés dans devise d'origine
- Confusion pour l'utilisateur
- Comparaison difficile

**Après:**
- ✅ Tous les prix dans devise utilisateur
- ✅ Badge "Converti" pour transparence
- ✅ Prix original accessible
- ✅ Comparaison facile
- ✅ Expérience utilisateur améliorée

**Le système de conversion automatique est prêt à être déployé !** 💱✨
