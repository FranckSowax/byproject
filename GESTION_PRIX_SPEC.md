# 💰 Spécification: Gestion des Prix avec Notes, Photos et Fournisseurs

## 🎯 Objectif

Permettre aux utilisateurs d'ajouter et comparer les prix des matériaux entre:
- **Prix Locaux** (FCFA - Cameroun/Afrique)
- **Prix Chine** (CNY/USD)
- **Autres pays** (optionnel)

Avec pour chaque prix:
- ✅ Notes détaillées
- ✅ Photos des produits
- ✅ Informations fournisseur (nom, contact, WhatsApp, email)
- ✅ Plusieurs fournisseurs par matériau

---

## 📊 Structure des Données

### Table `prices`
```sql
CREATE TABLE prices (
  id SERIAL PRIMARY KEY,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  country TEXT NOT NULL,           -- Cameroun, Chine, France, etc.
  amount NUMERIC NOT NULL,          -- Montant
  currency TEXT REFERENCES currencies(code), -- FCFA, CNY, USD, EUR
  converted_amount NUMERIC,         -- Montant converti en FCFA
  notes TEXT,                       -- Notes sur ce prix
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table `suppliers` (Fournisseurs)
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,               -- Nom du fournisseur
  country TEXT,                     -- Pays
  contact_name TEXT,                -- Nom du contact
  phone TEXT,                       -- Téléphone
  whatsapp TEXT,                    -- WhatsApp
  email TEXT,                       -- Email
  wechat TEXT,                      -- WeChat (pour Chine)
  address TEXT,                     -- Adresse
  website TEXT,                     -- Site web
  notes TEXT,                       -- Notes sur le fournisseur
  logo_url TEXT,                    -- Logo
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Table `photos` (Photos des prix)
```sql
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  material_id UUID REFERENCES materials(id),
  price_id INTEGER REFERENCES prices(id) ON DELETE CASCADE,
  url TEXT NOT NULL,                -- URL de la photo
  caption TEXT,                     -- Légende
  uploaded_at TIMESTAMP DEFAULT NOW()
);
```

### Table `currencies`
```sql
CREATE TABLE currencies (
  code TEXT PRIMARY KEY,            -- FCFA, CNY, USD, EUR
  symbol TEXT,                      -- ₣, ¥, $, €
  name TEXT                         -- Franc CFA, Yuan, Dollar, Euro
);

-- Données initiales
INSERT INTO currencies (code, symbol, name) VALUES
('FCFA', '₣', 'Franc CFA'),
('CNY', '¥', 'Yuan Chinois'),
('USD', '$', 'Dollar US'),
('EUR', '€', 'Euro');
```

### Table `exchange_rates` (Taux de change)
```sql
CREATE TABLE exchange_rates (
  id SERIAL PRIMARY KEY,
  from_currency TEXT REFERENCES currencies(code),
  to_currency TEXT REFERENCES currencies(code),
  rate NUMERIC NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Taux de change approximatifs (à mettre à jour régulièrement)
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
('CNY', 'FCFA', 84.0),    -- 1 Yuan = 84 FCFA
('USD', 'FCFA', 600.0),   -- 1 Dollar = 600 FCFA
('EUR', 'FCFA', 655.0);   -- 1 Euro = 655 FCFA
```

---

## 🎨 Interface Utilisateur

### 1. Bouton Prix sur Chaque Matériau

```
Ciment Portland CEM II                    [💰] [✏️] [🗑️]
[Matériaux de base] Quantité: 100
```

### 2. Modal "Gérer les Prix"

```
┌──────────────────────────────────────────────────────────┐
│ 💰 Prix - Ciment Portland CEM II                    [X] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ 📍 Prix Locaux (Cameroun)                               │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Fournisseur: Local Cement Co.                      │  │
│ │ Contact: Jean Dupont (+237 6XX XX XX XX)           │  │
│ │ WhatsApp: +237 6XX XX XX XX                        │  │
│ │                                                    │  │
│ │ Prix: 50,000 FCFA                                  │  │
│ │                                                    │  │
│ │ 📝 Notes:                                          │  │
│ │ "Livraison gratuite pour +100 sacs                │  │
│ │  Délai: 2-3 jours"                                │  │
│ │                                                    │  │
│ │ 📷 Photos: [img1] [img2] [img3]                   │  │
│ │                                                    │  │
│ │                              [✏️ Éditer] [🗑️]     │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ 🇨🇳 Prix Chine                                           │
│ ┌────────────────────────────────────────────────────┐  │
│ │ Fournisseur: Alibaba Supplier                      │  │
│ │ Contact: Wang Li (WeChat: wangli123)               │  │
│ │ Email: supplier@alibaba.com                        │  │
│ │                                                    │  │
│ │ Prix: 500 CNY (≈ 42,000 FCFA)                     │  │
│ │ 💰 Économie: -8,000 FCFA (-16%)                   │  │
│ │                                                    │  │
│ │ 📝 Notes:                                          │  │
│ │ "MOQ: 500 sacs                                    │  │
│ │  Shipping: 30 jours par bateau                    │  │
│ │  Port: Douala"                                    │  │
│ │                                                    │  │
│ │ 📷 Photos: [img1] [img2]                          │  │
│ │                                                    │  │
│ │                              [✏️ Éditer] [🗑️]     │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│                    [+ Ajouter un Prix]                   │
│                                                          │
│                                          [Fermer]        │
└──────────────────────────────────────────────────────────┘
```

### 3. Formulaire d'Ajout de Prix

```
┌──────────────────────────────────────────────────────────┐
│ Ajouter un Prix                                      [X] │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Pays *                                                   │
│ [Cameroun ▼]  (Cameroun, Chine, France, USA, etc.)     │
│                                                          │
│ ─────────────── Fournisseur ───────────────             │
│                                                          │
│ ○ Nouveau fournisseur                                   │
│ ○ Fournisseur existant [Sélectionner ▼]                │
│                                                          │
│ Nom du fournisseur *                                    │
│ [                                                    ]   │
│                                                          │
│ Nom du contact                                          │
│ [                                                    ]   │
│                                                          │
│ Téléphone                                               │
│ [                                                    ]   │
│                                                          │
│ WhatsApp                                                │
│ [                                                    ]   │
│                                                          │
│ Email                                                   │
│ [                                                    ]   │
│                                                          │
│ WeChat (pour Chine)                                     │
│ [                                                    ]   │
│                                                          │
│ ─────────────── Prix ───────────────                    │
│                                                          │
│ Montant *                     Devise                    │
│ [              ]              [FCFA ▼]                  │
│                                                          │
│ Montant converti: ~42,000 FCFA                          │
│                                                          │
│ ─────────────── Détails ───────────────                 │
│                                                          │
│ Notes                                                   │
│ ┌────────────────────────────────────────────────────┐  │
│ │ MOQ, délais, conditions, etc.                      │  │
│ │                                                    │  │
│ │                                                    │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ Photos                                                  │
│ [📷 Ajouter des photos]                                 │
│ [img1] [img2] [img3]                                    │
│                                                          │
│                              [Annuler] [Ajouter]        │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Workflow Complet

### 1. Ajouter un Prix Local

```
1. Clic sur [💰] du matériau
   ↓
2. Modal "Gérer les Prix" s'ouvre
   ↓
3. Clic "Ajouter un Prix"
   ↓
4. Formulaire:
   - Pays: Cameroun
   - Fournisseur: Local Cement Co.
   - Contact: Jean (+237 6XX)
   - WhatsApp: +237 6XX
   - Prix: 50,000 FCFA
   - Notes: "Livraison gratuite..."
   - Photos: [Upload 3 photos]
   ↓
5. Sauvegarde
   ↓
6. Prix apparaît dans le modal
```

### 2. Ajouter un Prix Chine

```
1. Dans le même modal
   ↓
2. Clic "Ajouter un Prix"
   ↓
3. Formulaire:
   - Pays: Chine
   - Fournisseur: Alibaba Supplier
   - Contact: Wang Li
   - WeChat: wangli123
   - Email: supplier@alibaba.com
   - Prix: 500 CNY
   - Conversion auto: ≈ 42,000 FCFA
   - Notes: "MOQ: 500 sacs..."
   - Photos: [Upload 2 photos]
   ↓
4. Sauvegarde
   ↓
5. Comparaison automatique:
   💰 Économie: -8,000 FCFA (-16%)
```

### 3. Ajouter Plusieurs Fournisseurs

```
Pour le même matériau, on peut avoir:
- 3 fournisseurs locaux (Cameroun)
- 5 fournisseurs chinois
- 2 fournisseurs européens

Chacun avec ses prix, notes, photos, contacts
```

---

## 📋 Fonctionnalités

### Gestion des Prix
- ✅ Ajouter un prix (pays, montant, devise)
- ✅ Éditer un prix
- ✅ Supprimer un prix
- ✅ Conversion automatique en FCFA
- ✅ Calcul d'économie

### Gestion des Fournisseurs
- ✅ Créer un nouveau fournisseur
- ✅ Sélectionner un fournisseur existant
- ✅ Stocker contacts (téléphone, WhatsApp, email, WeChat)
- ✅ Notes sur le fournisseur
- ✅ Plusieurs fournisseurs par matériau

### Notes
- ✅ Notes par prix
- ✅ MOQ (Minimum Order Quantity)
- ✅ Délais de livraison
- ✅ Conditions spéciales
- ✅ Remarques

### Photos
- ✅ Upload multiple photos par prix
- ✅ Affichage en galerie
- ✅ Légendes optionnelles
- ✅ Stockage dans Supabase Storage

---

## 💾 API Routes à Créer

### 1. `/api/prices/[materialId]`
```typescript
GET    - Liste des prix d'un matériau
POST   - Ajouter un prix
PUT    - Modifier un prix
DELETE - Supprimer un prix
```

### 2. `/api/suppliers`
```typescript
GET    - Liste des fournisseurs
POST   - Créer un fournisseur
PUT    - Modifier un fournisseur
DELETE - Supprimer un fournisseur
```

### 3. `/api/exchange-rates`
```typescript
GET    - Taux de change actuels
POST   - Convertir un montant
```

### 4. `/api/photos/upload`
```typescript
POST   - Upload une photo
DELETE - Supprimer une photo
```

---

## 📊 Page de Comparaison

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Comparaison des Prix                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Matériau          │ Local (FCFA) │ Chine (FCFA) │ Économie    │
│───────────────────┼──────────────┼──────────────┼─────────────│
│ Ciment Portland   │   50,000     │   42,000     │ -8,000 (-16%)│
│   3 fournisseurs  │              │ 5 fournisseurs│             │
│   [Voir détails]  │              │ [Voir détails]│             │
│                   │              │              │             │
│ Fer à béton       │  150,000     │  120,000     │-30,000 (-20%)│
│   2 fournisseurs  │              │ 4 fournisseurs│             │
│   [Voir détails]  │              │ [Voir détails]│             │
│                   │              │              │             │
│ Briques           │   80,000     │   65,000     │-15,000 (-19%)│
│   1 fournisseur   │              │ 3 fournisseurs│             │
│   [Voir détails]  │              │ [Voir détails]│             │
│───────────────────┼──────────────┼──────────────┼─────────────│
│ TOTAL             │  280,000     │  227,000     │-53,000 (-19%)│
│                                                                 │
│ 💰 Économie Totale: 53,000 FCFA                                │
│ 📦 Nombre de fournisseurs: 6 locaux, 12 chinois                │
│                                                                 │
│              [Exporter PDF] [Exporter Excel] [Imprimer]        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Prochaines Étapes d'Implémentation

### Phase 1: Base de Données ✅
- [x] Créer tables prices, suppliers, photos
- [x] Ajouter currencies et exchange_rates
- [x] Policies RLS

### Phase 2: Interface Prix (En cours)
- [x] Bouton Prix sur matériaux
- [ ] Modal "Gérer les Prix"
- [ ] Formulaire d'ajout de prix
- [ ] Affichage des prix existants

### Phase 3: Fournisseurs
- [ ] Formulaire fournisseur
- [ ] Sélection fournisseur existant
- [ ] Gestion contacts (WhatsApp, WeChat, etc.)

### Phase 4: Photos
- [ ] Upload photos
- [ ] Galerie photos
- [ ] Stockage Supabase Storage

### Phase 5: Comparaison
- [ ] Page de comparaison
- [ ] Calculs d'économie
- [ ] Export PDF/Excel

---

## ✅ Résumé

**Système complet de gestion des prix avec**:
- ✅ Prix multiples par matériau
- ✅ Plusieurs fournisseurs
- ✅ Contacts détaillés (téléphone, WhatsApp, WeChat, email)
- ✅ Notes par prix
- ✅ Photos multiples
- ✅ Conversion automatique
- ✅ Comparaison et économies

**Prêt à implémenter!** 🚀
