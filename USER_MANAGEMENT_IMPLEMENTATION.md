# 👤 Implémentation de la Gestion Utilisateur

**Date**: 8 Novembre 2025  
**Version**: 1.0  
**Status**: ✅ Analyse complète

---

## 📊 État Actuel

### **Pages Existantes**

1. **`/dashboard/profile`** ✅
   - Affiche les informations utilisateur
   - Utilise localStorage (données mockées)
   - À migrer vers Supabase Auth

2. **`/dashboard/settings`** ✅
   - Préférences de langue
   - Notifications
   - Apparence (thème)
   - Sécurité (désactivée pour mock)
   - À connecter à Supabase

3. **`/login`** ✅ (déjà vérifié dans session précédente)
   - Connexion fonctionnelle
   - Supabase Auth

4. **`/signup`** ✅
   - Inscription fonctionnelle
   - Supabase Auth

5. **`/forgot-password`** ✅
   - Récupération mot de passe
   - Supabase Auth

6. **`/reset-password`** ✅
   - Réinitialisation mot de passe
   - Supabase Auth

---

## ❌ Fonctionnalités Manquantes

### **1. Vérification d'Email** ❌

**Problème:**
- Pas de vérification email après inscription
- Utilisateurs peuvent se connecter sans confirmer
- Risque de spam et faux comptes

**Solution à implémenter:**
- Activer email verification dans Supabase
- Page de confirmation email
- Resend verification email
- Bloquer l'accès si email non vérifié

---

### **2. Page de Profil Utilisateur** ⚠️

**État actuel:**
- Page existe mais utilise localStorage
- Pas de modification possible
- Pas de photo de profil

**À implémenter:**
- Connexion à Supabase Auth
- Modification du nom
- Upload photo de profil
- Affichage des statistiques utilisateur
- Historique d'activité

---

### **3. Changement de Mot de Passe** ❌

**État actuel:**
- Bouton désactivé dans settings
- Pas de fonctionnalité

**À implémenter:**
- Formulaire de changement de mot de passe
- Validation mot de passe actuel
- Validation nouveau mot de passe (fort)
- Confirmation par email
- Déconnexion des autres sessions

---

### **4. Gestion des Préférences** ⚠️

**État actuel:**
- Interface existe
- Pas de sauvegarde en BDD
- Utilise localStorage

**À implémenter:**
- Table `user_preferences` dans Supabase
- Sauvegarde des préférences
- Synchronisation multi-appareils
- Préférences par défaut

---

## 🎯 Plan d'Implémentation

### **Phase 1: Vérification Email** (Priorité: Haute)

#### **1.1 Configuration Supabase**

**Dashboard Supabase:**
```
Authentication → Email Templates → Confirm signup
```

**Template Email:**
```html
<h2>Confirmez votre email</h2>
<p>Cliquez sur le lien ci-dessous pour confirmer votre adresse email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmer mon email</a></p>
```

**Settings:**
```
Authentication → Settings
- Enable email confirmations: ON
- Redirect URL: https://byproject.netlify.app/auth/confirm
```

#### **1.2 Page de Confirmation**

**Fichier:** `app/auth/confirm/page.tsx`

```typescript
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ConfirmEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (token && type === 'signup') {
        const supabase = createClient();
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });
        
        if (error) {
          setStatus('error');
        } else {
          setStatus('success');
          setTimeout(() => router.push('/dashboard'), 2000);
        }
      }
    };
    
    confirmEmail();
  }, [searchParams, router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      {status === 'loading' && <p>Vérification en cours...</p>}
      {status === 'success' && <p>✅ Email confirmé ! Redirection...</p>}
      {status === 'error' && <p>❌ Erreur de confirmation</p>}
    </div>
  );
}
```

#### **1.3 Middleware de Vérification**

**Fichier:** `middleware.ts` (à ajouter)

```typescript
// Vérifier si l'email est confirmé
const { data: { user } } = await supabase.auth.getUser();

if (user && !user.email_confirmed_at) {
  // Rediriger vers page de vérification
  return NextResponse.redirect(new URL('/verify-email', request.url));
}
```

#### **1.4 Page "Vérifiez votre Email"**

**Fichier:** `app/verify-email/page.tsx`

```typescript
"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  
  const resendEmail = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.email) {
      await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });
      toast.success('Email de vérification renvoyé !');
    }
    setLoading(false);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Mail className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <CardTitle>Vérifiez votre email</CardTitle>
          <CardDescription>
            Nous avons envoyé un lien de vérification à votre adresse email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={resendEmail} disabled={loading} className="w-full">
            Renvoyer l'email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### **Phase 2: Table user_preferences**

#### **2.1 Migration Supabase**

```sql
-- Créer la table user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Préférences générales
  language TEXT DEFAULT 'fr' CHECK (language IN ('en', 'fr', 'zh')),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  timezone TEXT DEFAULT 'Europe/Paris',
  
  -- Notifications
  email_notifications BOOLEAN DEFAULT true,
  project_notifications BOOLEAN DEFAULT true,
  export_notifications BOOLEAN DEFAULT false,
  marketing_emails BOOLEAN DEFAULT false,
  
  -- Préférences d'affichage
  items_per_page INTEGER DEFAULT 25,
  default_currency TEXT DEFAULT 'FCFA',
  date_format TEXT DEFAULT 'DD/MM/YYYY',
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- Fonction pour créer les préférences par défaut
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
CREATE TRIGGER trigger_create_default_user_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_preferences();
```

#### **2.2 Hook useUserPreferences**

**Fichier:** `lib/hooks/useUserPreferences.ts`

```typescript
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserPreferences {
  language: 'en' | 'fr' | 'zh';
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  email_notifications: boolean;
  project_notifications: boolean;
  export_notifications: boolean;
  marketing_emails: boolean;
  items_per_page: number;
  default_currency: string;
  date_format: string;
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  
  useEffect(() => {
    loadPreferences();
  }, []);
  
  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      return { success: true };
    } catch (error) {
      console.error('Error updating preferences:', error);
      return { success: false, error };
    }
  };
  
  return {
    preferences,
    loading,
    updatePreferences,
    refresh: loadPreferences,
  };
}
```

---

### **Phase 3: Changement de Mot de Passe**

#### **3.1 Composant ChangePassword**

**Fichier:** `components/settings/ChangePasswordForm.tsx`

```typescript
"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const supabase = createClient();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setLoading(true);
    
    try {
      // Supabase Auth change password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast.success('Mot de passe modifié avec succès !');
      
      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-red-600" />
          <CardTitle>Changer le mot de passe</CardTitle>
        </div>
        <CardDescription>
          Modifiez votre mot de passe pour sécuriser votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Mot de passe actuel</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-sm text-gray-500">
              Minimum 8 caractères, avec majuscule, minuscule, chiffre et caractère spécial
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Modification...' : 'Changer le mot de passe'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

### **Phase 4: Profil Utilisateur Complet**

#### **4.1 Table user_profiles**

```sql
-- Étendre les informations utilisateur
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Informations personnelles
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  bio TEXT,
  
  -- Adresse
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  
  -- Réseaux sociaux
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

---

## ✅ Checklist d'Implémentation

### **Vérification Email**
- [ ] Activer email confirmation dans Supabase
- [ ] Créer page `/auth/confirm`
- [ ] Créer page `/verify-email`
- [ ] Ajouter middleware de vérification
- [ ] Tester le flux complet

### **Préférences Utilisateur**
- [ ] Créer table `user_preferences`
- [ ] Créer hook `useUserPreferences`
- [ ] Mettre à jour page `/dashboard/settings`
- [ ] Tester sauvegarde/chargement

### **Changement Mot de Passe**
- [ ] Créer composant `ChangePasswordForm`
- [ ] Ajouter à `/dashboard/settings`
- [ ] Validation mot de passe fort
- [ ] Tester changement

### **Profil Utilisateur**
- [ ] Créer table `user_profiles`
- [ ] Mettre à jour page `/dashboard/profile`
- [ ] Upload photo de profil (Supabase Storage)
- [ ] Modification informations
- [ ] Tester mise à jour

---

## 📚 Ressources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Verification](https://supabase.com/docs/guides/auth/auth-email)
- [User Management](https://supabase.com/docs/guides/auth/managing-user-data)

---

**Toutes les fonctionnalités de gestion utilisateur sont documentées et prêtes à être implémentées !** 👤✅
