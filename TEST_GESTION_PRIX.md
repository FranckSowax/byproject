# 🧪 Guide de Test - Gestion des Prix

## ✅ Implémentation Complète!

Toutes les fonctionnalités de gestion des prix sont maintenant actives dans `page.tsx`!

---

## 🚀 Démarrage

### 1. Vérifier que l'App Tourne
```bash
# Si pas déjà démarré
npm run dev
```

### 2. Accéder à un Projet
```
http://localhost:3000/dashboard/projects/[votre-project-id]
```

---

## 🧪 Tests à Effectuer

### Test 1: Ouvrir le Modal Prix

**Étapes**:
1. Sur la page du projet, localisez un matériau dans la liste
2. Cliquez sur le bouton **💰** (vert) à droite du matériau
3. ✅ Le modal "Prix - [Nom du matériau]" s'ouvre
4. ✅ Affiche "Aucun prix ajouté pour ce matériau"
5. ✅ Bouton "Ajouter un Prix" visible

**Résultat attendu**:
```
┌──────────────────────────────────────┐
│ 💰 Prix - Ciment Portland      [X] │
│ Gérez les prix de ce matériau...   │
├──────────────────────────────────────┤
│                                      │
│  Aucun prix ajouté pour ce matériau │
│                                      │
│         [+ Ajouter un Prix]          │
│                          [Fermer]    │
└──────────────────────────────────────┘
```

---

### Test 2: Ajouter un Prix Local (Cameroun)

**Étapes**:
1. Dans le modal prix, cliquez **"Ajouter un Prix"**
2. Remplissez le formulaire:
   - **Pays**: Cameroun
   - **Fournisseur**: ○ Nouveau fournisseur
   - **Nom du fournisseur**: Local Cement Co.
   - **Nom du contact**: Jean Dupont
   - **Téléphone**: +237 6XX XX XX XX
   - **WhatsApp**: +237 6XX XX XX XX
   - **Montant**: 50000
   - **Devise**: FCFA (auto-sélectionné)
   - **Notes**: "Livraison gratuite pour commandes +100 sacs\nDélai: 2-3 jours"
3. Cliquez **"Ajouter"**

**Résultat attendu**:
- ✅ Toast "Prix ajouté avec succès"
- ✅ Modal d'ajout se ferme
- ✅ Modal principal se met à jour
- ✅ Affiche le nouveau prix sous "📍 Cameroun"

**Affichage**:
```
📍 Cameroun
┌────────────────────────────────────┐
│ Local Cement Co.                   │
│ Contact: Jean Dupont               │
│ 📞 +237 6XX  💬 +237 6XX          │
│                                    │
│ 50,000 FCFA                        │
│                                    │
│ 📝 Notes:                          │
│ Livraison gratuite pour...        │
│                                    │
│                              [🗑️] │
└────────────────────────────────────┘
```

---

### Test 3: Ajouter un Prix Chine

**Étapes**:
1. Cliquez **"Ajouter un Prix"**
2. Remplissez:
   - **Pays**: Chine (devise auto: CNY)
   - **Fournisseur**: ○ Nouveau fournisseur
   - **Nom du fournisseur**: Alibaba Building Materials
   - **Nom du contact**: Wang Li
   - **WeChat**: wangli123
   - **Email**: supplier@alibaba.com
   - **Montant**: 500
   - **Devise**: CNY (¥)
   - **Notes**: "MOQ: 500 sacs\nShipping: 30 jours par bateau\nPort: Douala"
3. Cliquez **"Ajouter"**

**Résultat attendu**:
- ✅ Toast "Prix ajouté avec succès"
- ✅ Prix affiché sous "🇨🇳 Chine"
- ✅ **Conversion automatique**: 500 CNY ≈ 42,000 FCFA
- ✅ **Calcul d'économie**: 8,000 FCFA (16%)

**Affichage**:
```
🇨🇳 Chine
┌────────────────────────────────────┐
│ Alibaba Building Materials         │
│ Contact: Wang Li                   │
│ WeChat: wangli123                  │
│                                    │
│ 500 CNY (≈ 42,000 FCFA)           │
│ 💰 Économie: 8,000 FCFA (16%)     │
│                                    │
│ 📝 Notes:                          │
│ MOQ: 500 sacs                      │
│ Shipping: 30 jours par bateau     │
│                                    │
│                              [🗑️] │
└────────────────────────────────────┘
```

---

### Test 4: Utiliser un Fournisseur Existant

**Étapes**:
1. Cliquez **"Ajouter un Prix"**
2. Sélectionnez:
   - **Pays**: Cameroun
   - **Fournisseur**: ○ Fournisseur existant
   - **Sélectionner**: Local Cement Co. (Cameroun)
   - **Montant**: 48000
   - **Devise**: FCFA
   - **Notes**: "Prix promotionnel - Valable jusqu'au 31/12"
3. Cliquez **"Ajouter"**

**Résultat attendu**:
- ✅ Nouveau prix ajouté avec le même fournisseur
- ✅ Deux prix sous "📍 Cameroun"

---

### Test 5: Supprimer un Prix

**Étapes**:
1. Dans le modal prix, cliquez sur **🗑️** d'un prix
2. Confirmez la suppression

**Résultat attendu**:
- ✅ Confirmation demandée
- ✅ Toast "Prix supprimé"
- ✅ Prix retiré de la liste
- ✅ Liste mise à jour

---

### Test 6: Ajouter un Prix France (EUR)

**Étapes**:
1. **Pays**: France
2. **Fournisseur**: Nouveau - "French Building Supply"
3. **Montant**: 80
4. **Devise**: EUR (€)
5. **Notes**: "Livraison Europe"

**Résultat attendu**:
- ✅ Conversion: 80 EUR ≈ 52,400 FCFA
- ✅ Comparaison avec prix local et Chine

---

## 📊 Vérifications Base de Données

### Vérifier les Fournisseurs Créés
```sql
SELECT * FROM suppliers ORDER BY created_at DESC LIMIT 5;
```

**Attendu**:
- Local Cement Co. (Cameroun)
- Alibaba Building Materials (Chine)
- French Building Supply (France)

### Vérifier les Prix
```sql
SELECT 
  m.name as material,
  p.country,
  p.amount,
  p.currency,
  p.converted_amount,
  s.name as supplier
FROM prices p
JOIN materials m ON p.material_id = m.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
ORDER BY p.created_at DESC;
```

**Attendu**:
- Prix avec conversions correctes
- Liens fournisseurs corrects

### Vérifier les Taux de Change
```sql
SELECT * FROM exchange_rates;
```

**Attendu**:
- CNY → FCFA: 84
- USD → FCFA: 600
- EUR → FCFA: 655

---

## 🐛 Problèmes Possibles

### Problème 1: Modal ne s'ouvre pas
**Solution**: Vérifier la console browser pour erreurs

### Problème 2: Conversion incorrecte
**Solution**: Vérifier les taux dans `exchange_rates`

### Problème 3: Fournisseur non créé
**Solution**: Vérifier les policies RLS sur `suppliers`

### Problème 4: Prix non sauvegardé
**Solution**: Vérifier les policies RLS sur `prices`

---

## ✅ Checklist Complète

### Fonctionnalités
- [ ] Bouton 💰 visible sur chaque matériau
- [ ] Modal prix s'ouvre
- [ ] Affichage "Aucun prix" si vide
- [ ] Bouton "Ajouter un Prix" fonctionne
- [ ] Formulaire d'ajout complet
- [ ] Sélection pays
- [ ] Auto-sélection devise
- [ ] Nouveau fournisseur
- [ ] Fournisseur existant
- [ ] Champs contact (téléphone, WhatsApp, WeChat, email)
- [ ] Montant et devise
- [ ] Zone notes
- [ ] Sauvegarde prix
- [ ] Création fournisseur
- [ ] Conversion automatique
- [ ] Calcul d'économie
- [ ] Affichage groupé par pays
- [ ] Icônes pays (📍 🇨🇳)
- [ ] Suppression prix
- [ ] Rechargement automatique

### Base de Données
- [ ] Table `suppliers` fonctionnelle
- [ ] Table `prices` fonctionnelle
- [ ] Table `exchange_rates` avec taux
- [ ] Policies RLS actives
- [ ] Relations correctes

---

## 🎉 Résultat Final Attendu

**Modal avec 3 Prix**:
```
┌──────────────────────────────────────────────────┐
│ 💰 Prix - Ciment Portland CEM II           [X] │
├──────────────────────────────────────────────────┤
│                                                  │
│ 📍 Cameroun                                      │
│ ┌────────────────────────────────────────────┐  │
│ │ Local Cement Co.                           │  │
│ │ 50,000 FCFA                                │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ 🇨🇳 Chine                                        │
│ ┌────────────────────────────────────────────┐  │
│ │ Alibaba Building Materials                 │  │
│ │ 500 CNY (≈ 42,000 FCFA)                   │  │
│ │ 💰 Économie: 8,000 FCFA (16%)             │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ 🇫🇷 France                                       │
│ ┌────────────────────────────────────────────┐  │
│ │ French Building Supply                     │  │
│ │ 80 EUR (≈ 52,400 FCFA)                    │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│              [+ Ajouter un Prix]  [Fermer]      │
└──────────────────────────────────────────────────┘
```

---

## 🚀 Prochaines Étapes

Après validation des tests:
1. **Phase 3.5**: Upload photos pour les prix
2. **Phase 4**: Page de comparaison complète
3. **Phase 5**: Export PDF/Excel

---

**Tout est prêt pour les tests!** 🎉

**Commencez par le Test 1 et progressez étape par étape!**
