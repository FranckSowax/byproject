# 📋 Workflow Complet des Demandes de Cotation

## 🔄 Flux Utilisateur → Admin → Utilisateur

---

## 1️⃣ UTILISATEUR : Demande de Cotation

### **Page : `/dashboard/projects/[id]`**

#### **Action :**
L'utilisateur clique sur **"Demander une cotation"**

#### **Processus :**
```typescript
handleCreateQuotation() {
  // 1. Récupère les matériaux du projet
  // 2. Récupère les images
  // 3. Récupère les commentaires
  // 4. Traduit tout en EN et ZH
  // 5. Crée supplier_request avec status: 'pending_admin'
}
```

#### **Données créées :**
```json
{
  "project_id": "xxx",
  "user_id": "xxx",
  "request_number": "REQ-1699...-ABC123",
  "public_token": "D48rHddyxkHUq...",
  "status": "pending_admin",  // ⚠️ EN ATTENTE ADMIN
  "materials_data": [...],
  "materials_translated_en": [...],
  "materials_translated_zh": [...],
  "total_materials": 5,
  "metadata": {
    "country": "China",
    "shipping_type": "sea"
  }
}
```

#### **Notification Utilisateur :**
✅ **À AJOUTER** : Section sur la page projet
```
┌─────────────────────────────────────────┐
│ 📤 Demande de cotation envoyée          │
│ En attente de traitement par l'admin    │
│ Demande #REQ-1699...-ABC123             │
└─────────────────────────────────────────┘
```

---

## 2️⃣ ADMIN : Traitement de la Demande

### **Page actuelle : `/dashboard/supplier-requests`**
**⚠️ PROBLÈME** : Cette page affiche les demandes de l'utilisateur connecté uniquement

### **Page nécessaire : `/admin/cotations-chinoises` ou `/admin/pending-quotes`**

#### **Ce que l'admin doit voir :**
```
┌─────────────────────────────────────────────────────────┐
│ 📋 Cotations Chinoises - En Attente                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 🔴 REQ-1699...-ABC123                                   │
│ Projet: Villa Moderne                                   │
│ Client: FRANCK SOWAX                                    │
│ Matériaux: 5                                            │
│ Pays: China                                             │
│ [📋 Voir détails] [✅ Traiter]                          │
│                                                          │
│ 🔴 REQ-1699...-DEF456                                   │
│ Projet: Immeuble Commercial                            │
│ Client: Jean Dupont                                     │
│ Matériaux: 12                                           │
│ Pays: Vietnam                                           │
│ [📋 Voir détails] [✅ Traiter]                          │
└─────────────────────────────────────────────────────────┘
```

#### **Requête nécessaire :**
```typescript
// Récupérer TOUTES les demandes en attente admin
const { data } = await supabase
  .from('supplier_requests')
  .select(`
    *,
    projects (name),
    users (email, full_name)
  `)
  .eq('status', 'pending_admin')
  .order('created_at', { ascending: false });
```

#### **Actions admin :**
1. **Voir les détails** → Ouvre modal avec matériaux
2. **Traiter** → Change status à `in_progress`
3. **Envoyer aux fournisseurs** → Change status à `sent`
4. **Ajouter cotations** → Insère les prix dans le projet

---

## 3️⃣ ADMIN : Envoi des Cotations

### **Processus :**

#### **Option A : Envoi manuel**
```typescript
// Admin ajoute les prix manuellement dans le projet
async function addQuoteToPro ject(projectId, materialId, priceData) {
  await supabase
    .from('prices')
    .insert({
      project_id: projectId,
      material_id: materialId,
      country: priceData.country,
      amount: priceData.amount,
      currency: priceData.currency,
      supplier_id: priceData.supplier_id,
      notes: priceData.notes
    });
}

// Mettre à jour le statut de la demande
await supabase
  .from('supplier_requests')
  .update({ status: 'completed' })
  .eq('id', requestId);
```

#### **Option B : Import automatique**
```typescript
// Admin upload un fichier Excel avec les cotations
// Le système parse et insère automatiquement
```

---

## 4️⃣ UTILISATEUR : Réception des Cotations

### **Page : `/dashboard/projects/[id]`**

#### **Notification :**
```
┌─────────────────────────────────────────┐
│ ✅ Cotations reçues !                   │
│ 3 nouveaux prix disponibles             │
│ [📊 Voir les cotations]                 │
└─────────────────────────────────────────┘
```

#### **Affichage :**
Les prix apparaissent automatiquement dans la liste des matériaux

---

## 🔧 Modifications Nécessaires

### **1. Page Projet - Notification de Statut**

**Fichier :** `/app/(dashboard)/dashboard/projects/[id]/page.tsx`

**Ajouter :**
```typescript
// État pour la demande de cotation
const [quotationRequest, setQuotationRequest] = useState(null);

// Charger la demande de cotation du projet
const loadQuotationRequest = async () => {
  const { data } = await supabase
    .from('supplier_requests')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  setQuotationRequest(data);
};

// Afficher la notification
{quotationRequest && (
  <Card className="mb-6 border-l-4 border-l-blue-500">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            {quotationRequest.status === 'pending_admin' && '📤 Demande envoyée'}
            {quotationRequest.status === 'in_progress' && '⏳ En cours de traitement'}
            {quotationRequest.status === 'sent' && '📨 Envoyée aux fournisseurs'}
            {quotationRequest.status === 'completed' && '✅ Cotations reçues'}
          </h3>
          <p className="text-sm text-gray-600">
            Demande #{quotationRequest.request_number}
          </p>
        </div>
        <Badge variant={
          quotationRequest.status === 'pending_admin' ? 'secondary' :
          quotationRequest.status === 'completed' ? 'success' : 'default'
        }>
          {quotationRequest.status}
        </Badge>
      </div>
    </CardContent>
  </Card>
)}
```

---

### **2. Page Admin - Cotations Chinoises**

**Créer :** `/app/(dashboard)/admin/cotations-chinoises/page.tsx`

```typescript
"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function CotationsChinoisesPage() {
  const [requests, setRequests] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    // Récupérer TOUTES les demandes en attente
    const { data, error } = await supabase
      .from('supplier_requests')
      .select(`
        *,
        projects (name),
        profiles (email, full_name)
      `)
      .eq('status', 'pending_admin')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return;
    }

    setRequests(data || []);
  };

  const handleProcessRequest = async (requestId: string) => {
    await supabase
      .from('supplier_requests')
      .update({ status: 'in_progress' })
      .eq('id', requestId);
    
    loadPendingRequests();
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        📋 Cotations Chinoises - En Attente
      </h1>

      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    {request.projects?.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Client: {request.profiles?.full_name || request.profiles?.email}
                  </p>
                  <p className="text-sm text-gray-600">
                    Demande: {request.request_number}
                  </p>
                  <p className="text-sm text-gray-600">
                    Matériaux: {request.total_materials}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(`/supplier-quote/${request.public_token}`, '_blank')}
                  >
                    📋 Voir détails
                  </Button>
                  <Button
                    onClick={() => handleProcessRequest(request.id)}
                  >
                    ✅ Traiter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

### **3. Permissions Admin**

**Créer table :** `admin_users`

```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin_users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

**Vérifier les permissions :**
```typescript
const checkIsAdmin = async () => {
  const { data } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  return !!data;
};
```

---

## 📊 Schéma Complet

```
┌─────────────┐
│  UTILISATEUR │
└──────┬──────┘
       │
       │ 1. Clique "Demander cotation"
       │
       ▼
┌─────────────────────┐
│  supplier_requests  │
│  status: pending_admin │
└──────┬──────────────┘
       │
       │ 2. Admin voit la demande
       │
       ▼
┌─────────────┐
│    ADMIN    │
│ Cotations   │
│ Chinoises   │
└──────┬──────┘
       │
       │ 3. Traite et ajoute prix
       │
       ▼
┌─────────────┐
│   prices    │
│  (cotations) │
└──────┬──────┘
       │
       │ 4. Utilisateur voit les prix
       │
       ▼
┌─────────────┐
│  UTILISATEUR │
│  (Projet)   │
└─────────────┘
```

---

## ✅ TODO

1. ✅ Fonction `createQuotationRequest()` - **FAIT**
2. ✅ Bouton "Demander cotation" - **FAIT**
3. ❌ Notification statut sur page projet - **À FAIRE**
4. ❌ Page admin "Cotations chinoises" - **À FAIRE**
5. ❌ Table `admin_users` - **À FAIRE**
6. ❌ Système d'ajout de cotations - **À FAIRE**

---

## 🎯 Prochaines Étapes

1. **Ajouter notification de statut** sur la page projet
2. **Créer la page admin** pour voir les demandes
3. **Créer le système** pour que l'admin ajoute les cotations
4. **Notifier l'utilisateur** quand les cotations sont prêtes
