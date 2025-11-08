# 🔄 Synchronisation du Workflow Admin - Cotations

## ✅ État Actuel - Ce qui existe déjà

### **Pages Admin**
1. ✅ `/admin/quotations` - Cotations reçues des fournisseurs
2. ✅ `/admin/supplier-requests` - Demandes de cotation (Cotations Chinoises)
3. ✅ `/admin/supplier-requests/[id]` - Détail d'une demande

### **API Routes**
1. ✅ `/api/admin/supplier-requests` - GET toutes les demandes
2. ✅ `/api/admin/supplier-requests/send` - POST envoyer aux fournisseurs

### **Sidebar Admin**
```typescript
{
  title: 'Fournisseurs',
  items: [
    {
      name: 'Quotations',  // Cotations reçues
      href: '/admin/quotations',
    },
    {
      name: 'Cotations Chinoises',  // Demandes utilisateurs
      href: '/admin/supplier-requests',
    },
  ]
}
```

---

## 🔄 Workflow Actuel

### **1. Utilisateur → Demande de Cotation**
```
Page: /dashboard/projects/[id]
Action: Clique "Demander une cotation"
Résultat: Crée supplier_request avec status: 'pending_admin'
```

### **2. Admin → Voir les Demandes**
```
Page: /admin/supplier-requests (Cotations Chinoises)
API: /api/admin/supplier-requests
Affiche: TOUTES les demandes (tous statuts)
```

### **3. Admin → Traiter une Demande**
```
Page: /admin/supplier-requests/[id]
Actions possibles:
- Voir les matériaux
- Envoyer aux fournisseurs
- Changer le statut
```

### **4. Admin → Recevoir Cotations**
```
Page: /admin/quotations
Affiche: Cotations soumises par les fournisseurs
Actions:
- Appliquer marge
- Envoyer au client
```

---

## 🎯 Synchronisation Nécessaire

### **✅ Ce qui fonctionne déjà**
1. Bouton "Demander cotation" crée la demande
2. API récupère toutes les demandes
3. Page admin affiche les demandes
4. Notification de statut sur projet utilisateur

### **🔧 Ce qui doit être synchronisé**

#### **1. Filtrage par Statut sur Page Admin**
**Fichier:** `/app/(admin)/admin/supplier-requests/page.tsx`

**Problème:** Affiche toutes les demandes sans distinction
**Solution:** Ajouter un filtre visuel pour `pending_admin`

```typescript
// Ligne 95 - Ajouter un filtre par défaut
const [statusFilter, setStatusFilter] = useState<string>('pending_admin');

// Ajouter un bouton pour voir les pending_admin en priorité
<Button
  variant={statusFilter === 'pending_admin' ? 'default' : 'outline'}
  onClick={() => setStatusFilter('pending_admin')}
>
  <Clock className="h-4 w-4 mr-2" />
  En attente ({requests.filter(r => r.status === 'pending_admin').length})
</Button>
```

#### **2. Badge de Notification dans Sidebar**
**Fichier:** `/app/(admin)/admin/layout.tsx`

**Ajouter:** Compteur de demandes en attente

```typescript
// Ligne 71-76
{
  name: 'Cotations Chinoises',
  href: '/admin/supplier-requests',
  icon: Globe,
  badge: pendingCount > 0 ? pendingCount : null,  // ⚠️ À ajouter
  description: 'Demandes fournisseurs'
}
```

#### **3. Action "Traiter" sur Page Liste**
**Fichier:** `/app/(admin)/admin/supplier-requests/page.tsx`

**Ajouter:** Bouton rapide pour changer status

```typescript
// Dans le TableRow, ajouter:
{req.status === 'pending_admin' && (
  <Button
    size="sm"
    onClick={() => handleUpdateStatus(req.id, 'in_progress')}
  >
    ✅ Traiter
  </Button>
)}
```

#### **4. Connexion avec Quotations**
**Quand:** Admin envoie aux fournisseurs
**Alors:** Créer entrées dans `supplier_quotes`

```typescript
// Après envoi aux fournisseurs
await supabase
  .from('supplier_quotes')
  .insert({
    supplier_request_id: requestId,
    supplier_name: supplier.name,
    supplier_email: supplier.email,
    status: 'pending',
    quoted_materials: materials
  });
```

---

## 📊 Flux Complet Synchronisé

```
┌─────────────────────────────────────────────────────────┐
│                    UTILISATEUR                           │
│  /dashboard/projects/[id]                               │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ 1. Clique "Demander cotation"
                   │    → Crée supplier_request
                   │    → status: 'pending_admin'
                   │    → materials_data avec commentaires
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  📤 Notification sur Projet                             │
│  "Demande envoyée - En attente admin"                  │
└─────────────────────────────────────────────────────────┘
                   │
                   │ 2. Admin reçoit notification
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                  ADMIN - SIDEBAR                         │
│  🔴 Cotations Chinoises (3)  ← Badge notification      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ 3. Admin clique
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│         ADMIN - /admin/supplier-requests                │
│                                                          │
│  Filtres: [En attente (3)] [En cours] [Toutes]        │
│                                                          │
│  🟡 REQ-123 - Villa Moderne - 5 matériaux              │
│     Client: FRANCK SOWAX                                │
│     [📋 Voir] [✅ Traiter]                              │
│                                                          │
│  🟡 REQ-456 - Immeuble - 12 matériaux                  │
│     Client: Jean Dupont                                 │
│     [📋 Voir] [✅ Traiter]                              │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ 4. Admin clique "Traiter"
                   │    → status: 'in_progress'
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  ⏳ Notification Utilisateur                            │
│  "Cotation en cours de traitement"                     │
└─────────────────────────────────────────────────────────┘
                   │
                   │ 5. Admin clique "Voir"
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│      ADMIN - /admin/supplier-requests/[id]              │
│                                                          │
│  Projet: Villa Moderne                                  │
│  Client: FRANCK SOWAX                                   │
│                                                          │
│  Matériaux (5):                                         │
│  - Ciment Portland (100 sacs)                          │
│    💬 2 commentaires                                    │
│  - Fer à béton (500 kg)                                │
│    💬 1 commentaire                                     │
│                                                          │
│  [📤 Envoyer aux fournisseurs]                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ 6. Admin envoie aux fournisseurs
                   │    → status: 'sent'
                   │    → Crée supplier_quotes
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  📨 Notification Utilisateur                            │
│  "Demande envoyée aux fournisseurs"                    │
└─────────────────────────────────────────────────────────┘
                   │
                   │ 7. Fournisseurs soumettent cotations
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│           ADMIN - /admin/quotations                     │
│                                                          │
│  Cotations reçues:                                      │
│  - Supplier A - Villa Moderne                           │
│    5 matériaux cotés                                    │
│    [Appliquer marge] [Envoyer au client]               │
└──────────────────┬──────────────────────────────────────┘
                   │
                   │ 8. Admin applique marge et envoie
                   │    → Insère prices dans projet
                   │    → status: 'completed'
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  ✅ Notification Utilisateur                            │
│  "Cotations reçues ! Consultez les prix"               │
└─────────────────────────────────────────────────────────┘
                   │
                   │ 9. Utilisateur voit les prix
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│         UTILISATEUR - /dashboard/projects/[id]          │
│                                                          │
│  Matériaux avec prix:                                   │
│  - Ciment Portland                                      │
│    💰 $50/sac (Supplier A)                             │
│    💰 $48/sac (Supplier B)                             │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Modifications à Faire

### **1. Ajouter Filtre par Défaut**
```typescript
// /app/(admin)/admin/supplier-requests/page.tsx
const [statusFilter, setStatusFilter] = useState<string>('pending_admin');
```

### **2. Ajouter Badge Notification**
```typescript
// /app/(admin)/admin/layout.tsx
// Récupérer le count de pending_admin
const [pendingCount, setPendingCount] = useState(0);

useEffect(() => {
  async function loadPendingCount() {
    const response = await fetch('/api/admin/supplier-requests/count');
    const { count } = await response.json();
    setPendingCount(count);
  }
  loadPendingCount();
}, []);
```

### **3. Ajouter API Count**
```typescript
// /app/api/admin/supplier-requests/count/route.ts
export async function GET() {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from('supplier_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_admin');
  
  return NextResponse.json({ count });
}
```

### **4. Ajouter Bouton Traiter**
```typescript
// /app/(admin)/admin/supplier-requests/page.tsx
const handleUpdateStatus = async (id: string, status: string) => {
  await fetch(`/api/admin/supplier-requests/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
  loadRequests();
};
```

---

## ✅ Résultat Final

**Workflow Complet et Synchronisé:**
1. ✅ Utilisateur demande cotation
2. ✅ Notification utilisateur (pending_admin)
3. ✅ Badge admin sidebar (nombre en attente)
4. ✅ Page admin filtrée par défaut sur pending_admin
5. ✅ Bouton "Traiter" rapide
6. ✅ Page détail avec matériaux et commentaires
7. ✅ Envoi aux fournisseurs
8. ✅ Réception cotations
9. ✅ Envoi au client
10. ✅ Notification utilisateur (completed)

**Tout est connecté et synchronisé !** 🎉
