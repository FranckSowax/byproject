# 🤝 Guide d'Utilisation - Fonctionnalités de Collaboration

**Date**: 3 Novembre 2025  
**Version**: 1.0  
**Pour**: Utilisateurs de Compa Chantier

---

## 🎯 Vue d'Ensemble

Votre application dispose maintenant de **3 fonctionnalités de collaboration puissantes**:

1. **Partage de Projets** 👥 - Invitez des collaborateurs
2. **Commentaires** 💬 - Discutez sur les matériaux
3. **Historique** 📜 - Suivez toutes les modifications

---

## 1️⃣ Partager un Projet

### Comment Faire

1. **Ouvrir un projet**
2. **Cliquer sur l'icône "Utilisateurs"** (👥) dans le header
3. **Entrer l'email** du collaborateur
4. **Choisir le rôle**:
   - **Lecteur** - Peut seulement voir
   - **Éditeur** - Peut modifier
5. **Cliquer sur "Envoyer l'invitation"**

### Rôles Expliqués

#### 👑 Propriétaire (Owner)
- **Vous** - Créateur du projet
- Tous les droits
- Peut inviter/retirer des collaborateurs
- Peut supprimer le projet

#### ✏️ Éditeur (Editor)
- Peut ajouter/modifier des matériaux
- Peut ajouter/modifier des prix
- Peut commenter
- **Ne peut pas** supprimer le projet
- **Ne peut pas** gérer les accès

#### 👁️ Lecteur (Viewer)
- Lecture seule
- Peut voir tous les matériaux et prix
- Peut voir les commentaires
- **Ne peut rien modifier**

### Gérer les Collaborateurs

**Voir la liste**:
- Ouvrez le dialog de partage
- La liste apparaît en bas

**Retirer un accès**:
- Cliquez sur le ❌ à côté du collaborateur
- Confirmez la suppression

---

## 2️⃣ Commenter sur un Matériau

### Comment Faire

1. **Ouvrir un projet**
2. **Trouver le matériau** dans la liste
3. **Cliquer sur l'icône "Bulle"** (💬) violette
4. **Écrire votre commentaire**
5. **Cliquer sur "Publier"**

### Fonctionnalités des Commentaires

#### Ajouter un Commentaire
```
1. Cliquez sur l'icône 💬
2. Tapez votre message
3. Cliquez "Publier"
```

#### Répondre à un Commentaire
```
1. Cliquez sur "Répondre" sous un commentaire
2. Tapez votre réponse
3. Cliquez "Publier"
```

#### Modifier un Commentaire
```
1. Cliquez sur ⋮ (trois points)
2. Sélectionnez "Modifier"
3. Changez le texte
4. Cliquez "Enregistrer"
```

#### Supprimer un Commentaire
```
1. Cliquez sur ⋮ (trois points)
2. Sélectionnez "Supprimer"
3. Confirmez
```

### Temps Réel ⚡

Les commentaires s'affichent **instantanément** pour tous les collaborateurs!

**Exemple**:
- User A ajoute un commentaire
- User B le voit immédiatement (sans rafraîchir)
- Comme Google Docs!

---

## 3️⃣ Voir l'Historique du Projet

### Comment Faire

1. **Ouvrir un projet**
2. **Cliquer sur l'icône "Horloge"** (🕐) dans le header
3. **L'historique s'affiche** en dessous

### Que Voit-on?

L'historique montre **toutes les actions**:

#### Types d'Actions

**🟢 INSERT** (Ajout)
- Nouveau matériau ajouté
- Nouveau prix ajouté
- Nouveau commentaire
- Nouveau fournisseur

**🔵 UPDATE** (Modification)
- Matériau modifié
- Prix mis à jour
- Commentaire édité
- Fournisseur modifié

**🔴 DELETE** (Suppression)
- Matériau supprimé
- Prix supprimé
- Commentaire supprimé
- Fournisseur supprimé

### Informations Affichées

Pour chaque action:
- **Qui** - Nom/Email de l'utilisateur
- **Quoi** - Type d'action et élément concerné
- **Quand** - "il y a 2 heures", "il y a 3 jours"
- **Détails** - Cliquez pour voir les changements

### Exemple d'Historique

```
👤 sowax a ajouté le matériau "Ciment"
   il y a 5 minutes
   🟢 INSERT

👤 junior a ajouté un prix pour "Ciment"
   il y a 3 minutes
   🟢 INSERT

👤 sowax a commenté "Ciment"
   il y a 1 minute
   💬 COMMENT
```

---

## 🎨 Interface Utilisateur

### Boutons dans le Header

Quand vous ouvrez un projet, vous voyez:

```
[←] Projet Name                [👥] [🕐] [⚙️] [🗑️]
```

- **👥** = Partager le projet
- **🕐** = Afficher/Masquer l'historique
- **⚙️** = Paramètres
- **🗑️** = Supprimer le projet

### Boutons sur les Matériaux

Pour chaque matériau:

```
Nom du Matériau              [💬] [💰] [✏️] [🗑️]
```

- **💬** = Commentaires (violet)
- **💰** = Gérer les prix (vert)
- **✏️** = Éditer (bleu)
- **🗑️** = Supprimer (rouge)

---

## 💡 Cas d'Usage Pratiques

### Cas 1: Équipe de Construction

**Situation**: Vous gérez un chantier avec 3 personnes

**Solution**:
1. **Vous** (Chef de projet) - Owner
2. **Acheteur** - Editor (peut ajouter des prix)
3. **Comptable** - Viewer (peut voir les coûts)

**Workflow**:
```
1. Vous créez le projet
2. Vous invitez l'acheteur (Editor)
3. Vous invitez le comptable (Viewer)
4. L'acheteur ajoute des prix
5. Vous commentez pour valider
6. Le comptable consulte les totaux
```

### Cas 2: Comparaison Internationale

**Situation**: Comparer prix Cameroun vs Chine

**Solution**:
1. **Vous** - Créez le projet
2. **Contact Cameroun** - Editor (ajoute prix locaux)
3. **Contact Chine** - Editor (ajoute prix chinois)

**Workflow**:
```
1. Vous ajoutez les matériaux
2. Contact Cameroun ajoute ses prix
3. Contact Chine ajoute ses prix
4. Vous commentez pour discuter
5. Historique montre qui a ajouté quoi
```

### Cas 3: Validation Client

**Situation**: Client doit valider les choix

**Solution**:
1. **Vous** - Owner
2. **Client** - Viewer

**Workflow**:
```
1. Vous préparez le projet
2. Vous invitez le client (Viewer)
3. Client consulte et commente
4. Vous ajustez selon les retours
5. Historique = preuve des échanges
```

---

## 🔔 Notifications (Futures)

### Actuellement

Les mises à jour sont **en temps réel** dans l'application.

### Bientôt

- 📧 Email lors d'une invitation
- 📧 Email lors d'une réponse à votre commentaire
- 📧 Email lors d'une modification importante

---

## 🛡️ Sécurité et Confidentialité

### Qui Voit Quoi?

**Vos projets**:
- ✅ Vous
- ✅ Les collaborateurs que vous invitez
- ❌ Personne d'autre

**Vos commentaires**:
- ✅ Tous les collaborateurs du projet
- ❌ Personne en dehors du projet

**L'historique**:
- ✅ Tous les collaborateurs du projet
- ❌ Personne en dehors du projet

### Données Stockées

- Commentaires: Base de données sécurisée
- Historique: Base de données sécurisée
- Temps réel: Connexion chiffrée Supabase

---

## 🐛 Résolution de Problèmes

### Je ne vois pas le bouton de partage

**Solution**: Assurez-vous d'être sur la page d'un projet (pas le dashboard)

### Les commentaires ne s'affichent pas

**Solutions**:
1. Vérifiez votre connexion internet
2. Rafraîchissez la page (F5)
3. Vérifiez que vous êtes collaborateur du projet

### L'historique est vide

**Raisons possibles**:
- Projet nouvellement créé (aucune action encore)
- Vous n'avez pas les permissions

### Je ne peux pas commenter

**Vérifiez**:
- Vous êtes Owner ou Editor (pas Viewer)
- Vous êtes bien connecté
- Le projet existe toujours

---

## 📱 Raccourcis Clavier (Futurs)

### Prévus pour la prochaine version

- `Ctrl + K` - Ouvrir partage
- `Ctrl + H` - Toggle historique
- `Ctrl + /` - Commenter le matériau sélectionné

---

## 🎓 Bonnes Pratiques

### Pour les Commentaires

✅ **À FAIRE**:
- Soyez clair et précis
- Mentionnez des chiffres si pertinent
- Répondez aux questions
- Utilisez les threads (réponses)

❌ **À ÉVITER**:
- Commentaires vagues ("ok", "bien")
- Informations sensibles (mots de passe, etc.)
- Spam ou messages répétés

### Pour le Partage

✅ **À FAIRE**:
- Invitez seulement les personnes nécessaires
- Choisissez le bon rôle (Viewer vs Editor)
- Retirez l'accès quand le projet est terminé

❌ **À ÉVITER**:
- Donner Owner à tout le monde
- Partager avec des emails inconnus
- Oublier de retirer les accès temporaires

### Pour l'Historique

✅ **À FAIRE**:
- Consultez régulièrement
- Vérifiez qui a fait quoi
- Utilisez pour résoudre les conflits

❌ **À ÉVITER**:
- Ignorer les modifications suspectes
- Ne jamais vérifier l'historique

---

## 🚀 Prochaines Fonctionnalités

### En Développement

1. **Notifications Email** 📧
   - Invitation reçue
   - Nouveau commentaire
   - Modification importante

2. **Mentions** @
   - @mention dans les commentaires
   - Notification de la personne

3. **Réactions** 👍
   - Like/Dislike sur commentaires
   - Compteur de réactions

4. **Pièces Jointes** 📎
   - Upload de fichiers dans commentaires
   - Images, PDFs, etc.

---

## 📞 Support

### Besoin d'Aide?

- **Email**: support@compachantier.com
- **Documentation**: Ce fichier
- **Vidéos**: Bientôt disponibles

### Signaler un Bug

Si quelque chose ne fonctionne pas:
1. Notez ce que vous faisiez
2. Faites une capture d'écran
3. Contactez le support

---

## ✅ Checklist de Démarrage

Pour bien démarrer avec la collaboration:

- [ ] J'ai créé mon premier projet
- [ ] J'ai invité un collaborateur
- [ ] J'ai testé les rôles (Viewer vs Editor)
- [ ] J'ai ajouté un commentaire
- [ ] J'ai répondu à un commentaire
- [ ] J'ai consulté l'historique
- [ ] J'ai compris les permissions
- [ ] J'ai retiré un accès de test

---

## 🎉 Conclusion

Vous avez maintenant tous les outils pour **collaborer efficacement** sur vos projets de comparaison de prix!

**Rappel des 3 fonctionnalités**:
1. 👥 **Partage** - Invitez votre équipe
2. 💬 **Commentaires** - Discutez en temps réel
3. 📜 **Historique** - Suivez tout

**Bonne collaboration!** 🚀

---

**Version**: 1.0  
**Dernière mise à jour**: 3 Novembre 2025  
**Prochaine révision**: Après retours utilisateurs
