# 🔔 Système de Notifications Complet

## Vue d'ensemble

Système de notifications en temps réel pour informer les utilisateurs et les admins de toutes les actions importantes dans l'application.

---

## 📊 Architecture

### **Table: notifications**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE,
  link TEXT,
  icon VARCHAR(50),
  color VARCHAR(50)
);
```

### **Indexes**
- `idx_notifications_user_id` - Requêtes par utilisateur
- `idx_notifications_read` - Filtrage lu/non-lu
- `idx_notifications_created_at` - Tri chronologique
- `idx_notifications_type` - Filtrage par type

---

## 🔐 Row Level Security (RLS)

### **Policies**
1. **Users can view own notifications** - SELECT
2. **Users can update own notifications** - UPDATE (mark as read)
3. **Service role can insert notifications** - INSERT
4. **Users can delete own notifications** - DELETE

---

## 🎯 Types de Notifications

### **Pour les Utilisateurs**

#### **1. quotation_status**
**Trigger:** Changement de statut de `supplier_requests`

**Statuts:**
- `in_progress` 🔵
  - Titre: "Cotation en cours de traitement"
  - Message: "Votre demande pour '{project}' est en cours de traitement"
  - Icon: Package
  - Color: blue

- `sent` 🟣
  - Titre: "Demande envoyée aux fournisseurs"
  - Message: "Votre demande pour '{project}' a été envoyée aux fournisseurs"
  - Icon: Send
  - Color: purple

- `completed` 🟢
  - Titre: "Cotations reçues !"
  - Message: "Des cotations sont disponibles pour '{project}'"
  - Icon: CheckCircle2
  - Color: green

#### **2. supplier_quote_received**
**Trigger:** Insertion dans `supplier_quotes`

- Titre: "Nouvelle cotation reçue"
- Message: "{supplier} a soumis une cotation pour '{project}'"
- Icon: DollarSign
- Color: green
- Link: `/dashboard/projects/{project_id}`

### **Pour les Admins**

#### **1. admin_new_quotation**
**Trigger:** Insertion dans `supplier_requests`

- Titre: "Nouvelle demande de cotation"
- Message: "{user} a demandé une cotation pour '{project}'"
- Icon: Bell
- Color: orange
- Link: `/admin/supplier-requests`

#### **2. admin_new_project**
**Trigger:** Insertion dans `projects`

- Titre: "Nouveau projet créé"
- Message: "{user} a créé le projet '{project}'"
- Icon: FolderKanban
- Color: blue
- Link: `/admin/projects`

---

## 🔧 Fonctions SQL

### **create_notification()**
Crée une nouvelle notification

```sql
SELECT create_notification(
  p_user_id := 'uuid',
  p_type := 'quotation_status',
  p_title := 'Titre',
  p_message := 'Message',
  p_data := '{"project_id": "uuid"}'::jsonb,
  p_link := '/dashboard/projects/uuid',
  p_icon := 'CheckCircle2',
  p_color := 'green'
);
```

### **mark_notification_read()**
Marque une notification comme lue

```sql
SELECT mark_notification_read('notification_id');
```

### **mark_all_notifications_read()**
Marque toutes les notifications de l'utilisateur comme lues

```sql
SELECT mark_all_notifications_read();
```

---

## 🎨 Composant UI: NotificationBell

### **Emplacement**
- Dashboard: `/components/layout/DashboardNav.tsx`
- Admin: `/components/admin/AdminTopBar.tsx`

### **Fonctionnalités**
✅ Badge avec compteur de non-lus
✅ Dropdown avec liste des notifications
✅ Temps relatif (il y a X minutes)
✅ Icônes colorées par type
✅ Clic pour marquer comme lu
✅ Suppression individuelle
✅ Bouton "Tout marquer comme lu"
✅ Realtime avec Supabase subscriptions
✅ Toast pour nouvelles notifications
✅ Redirection vers la page liée

### **Interface**
```typescript
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
  link: string | null;
  icon: string | null;
  color: string | null;
}
```

---

## 📡 Realtime Subscriptions

### **Channel: notifications**
```typescript
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
  }, (payload) => {
    // Nouvelle notification reçue
    const newNotification = payload.new;
    // Afficher toast
    // Mettre à jour la liste
  })
  .subscribe();
```

---

## 🔄 Workflow Complet

### **Exemple: Demande de Cotation**

```
1. User crée une demande de cotation
   ↓
2. Trigger: trigger_notify_admin_quotation
   ↓
3. Notification créée pour tous les admins
   - Type: admin_new_quotation
   - Badge admin: +1
   ↓
4. Admin traite la demande (status → in_progress)
   ↓
5. Trigger: trigger_notify_quotation_status
   ↓
6. Notification créée pour le user
   - Type: quotation_status
   - Badge user: +1
   ↓
7. Admin envoie aux fournisseurs (status → sent)
   ↓
8. Trigger: trigger_notify_quotation_status
   ↓
9. Notification créée pour le user
   - Type: quotation_status
   - Badge user: +1
   ↓
10. Fournisseur soumet cotation
   ↓
11. Trigger: trigger_notify_supplier_quote
   ↓
12. Notification créée pour le user
   - Type: supplier_quote_received
   - Badge user: +1
```

---

## 🎯 Triggers Automatiques

### **1. trigger_notify_quotation_status**
**Table:** `supplier_requests`
**Event:** UPDATE OF status
**Condition:** OLD.status IS DISTINCT FROM NEW.status

**Actions:**
- Récupère le nom du projet
- Détermine le titre/message selon le statut
- Crée notification pour l'utilisateur

### **2. trigger_notify_admin_quotation**
**Table:** `supplier_requests`
**Event:** INSERT

**Actions:**
- Récupère le nom du projet et de l'utilisateur
- Boucle sur tous les admins
- Crée notification pour chaque admin

### **3. trigger_notify_admin_project**
**Table:** `projects`
**Event:** INSERT

**Actions:**
- Récupère le nom de l'utilisateur
- Boucle sur tous les admins
- Crée notification pour chaque admin

### **4. trigger_notify_supplier_quote**
**Table:** `supplier_quotes`
**Event:** INSERT

**Actions:**
- Récupère les détails de la demande
- Récupère le nom du projet
- Crée notification pour l'utilisateur

---

## 🎨 Design System

### **Couleurs par Type**
```typescript
const colorMap = {
  green: 'bg-green-100 text-green-600',   // Success, cotations reçues
  blue: 'bg-blue-100 text-blue-600',      // Info, en cours
  purple: 'bg-purple-100 text-purple-600', // Envoyé
  orange: 'bg-orange-100 text-orange-600', // Admin, en attente
  red: 'bg-red-100 text-red-600',         // Erreur, urgent
};
```

### **Icônes par Type**
```typescript
const iconMap = {
  CheckCircle2,  // Complété
  Package,       // En cours
  Send,          // Envoyé
  DollarSign,    // Cotation
  FolderKanban,  // Projet
  Bell,          // Notification générale
};
```

---

## 📱 Interface Utilisateur

### **Badge de Notification**
```
🔔 (3)  ← Badge rouge avec compteur
```

### **Dropdown**
```
┌─────────────────────────────────────────┐
│ Notifications        [Tout marquer lu]  │
├─────────────────────────────────────────┤
│ 🟢 Cotations reçues !                   │
│    Des cotations sont disponibles       │
│    il y a 5 minutes                  ●  │
├─────────────────────────────────────────┤
│ 🟣 Demande envoyée aux fournisseurs     │
│    Votre demande a été envoyée          │
│    il y a 2 heures                      │
├─────────────────────────────────────────┤
│ 🔵 Cotation en cours de traitement      │
│    Notre équipe traite votre demande    │
│    il y a 1 jour                        │
├─────────────────────────────────────────┤
│         [Voir toutes les notifications] │
└─────────────────────────────────────────┘
```

---

## ✅ Fonctionnalités Implémentées

### **Backend**
✅ Table `notifications` créée
✅ RLS policies configurées
✅ Indexes pour performance
✅ Fonctions SQL helpers
✅ Triggers automatiques
✅ Notifications utilisateur
✅ Notifications admin

### **Frontend**
✅ Composant NotificationBell
✅ Badge avec compteur
✅ Dropdown avec liste
✅ Realtime subscriptions
✅ Toast pour nouvelles notifs
✅ Marquer comme lu
✅ Supprimer notification
✅ Tout marquer comme lu
✅ Redirection vers page liée
✅ Temps relatif (date-fns)
✅ Icônes colorées
✅ Intégration Dashboard
✅ Intégration Admin

---

## 🚀 Utilisation

### **Créer une notification manuelle**
```typescript
const { data, error } = await supabase
  .from('notifications')
  .insert({
    user_id: userId,
    type: 'custom',
    title: 'Titre',
    message: 'Message',
    data: { custom_data: 'value' },
    link: '/dashboard/page',
    icon: 'Bell',
    color: 'blue'
  });
```

### **Marquer comme lu**
```typescript
const { error } = await supabase
  .from('notifications')
  .update({ read: true, read_at: new Date().toISOString() })
  .eq('id', notificationId);
```

### **Récupérer les notifications**
```typescript
const { data } = await supabase
  .from('notifications')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(20);
```

---

## 📊 Statistiques

### **Notifications par Type**
- `quotation_status` - Changements de statut
- `supplier_quote_received` - Nouvelles cotations
- `admin_new_quotation` - Nouvelles demandes (admin)
- `admin_new_project` - Nouveaux projets (admin)

### **Performance**
- Indexes optimisés pour requêtes rapides
- Realtime via Supabase channels
- Limit 20 notifications dans dropdown
- Pagination disponible

---

## 🎯 Prochaines Améliorations (Optionnel)

- [ ] Notifications par email
- [ ] Notifications push (PWA)
- [ ] Préférences de notification
- [ ] Groupement par projet
- [ ] Filtres par type
- [ ] Page dédiée `/dashboard/notifications`
- [ ] Statistiques de notifications
- [ ] Archivage automatique
- [ ] Notifications récurrentes
- [ ] Templates de notifications

---

## 🔧 Maintenance

### **Nettoyage des anciennes notifications**
```sql
DELETE FROM notifications
WHERE created_at < NOW() - INTERVAL '30 days'
AND read = true;
```

### **Statistiques**
```sql
SELECT 
  type,
  COUNT(*) as total,
  SUM(CASE WHEN read THEN 1 ELSE 0 END) as read_count,
  SUM(CASE WHEN NOT read THEN 1 ELSE 0 END) as unread_count
FROM notifications
GROUP BY type;
```

---

## ✅ Résumé

**Système de notifications complet et fonctionnel !**

- ✅ Notifications automatiques pour toutes les actions
- ✅ Interface utilisateur élégante
- ✅ Realtime avec Supabase
- ✅ Séparation user/admin
- ✅ Performance optimisée
- ✅ Sécurité avec RLS
- ✅ Extensible et maintenable

**Prêt pour la production !** 🚀
