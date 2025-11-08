/**
 * Hook pour gérer les préférences utilisateur
 * Synchronise avec la table user_preferences dans Supabase
 */

// @ts-nocheck
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export interface UserPreferences {
  id?: string;
  user_id?: string;
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
  created_at?: string;
  updated_at?: string;
}

const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  language: 'fr',
  theme: 'light',
  timezone: 'Europe/Paris',
  email_notifications: true,
  project_notifications: true,
  export_notifications: false,
  marketing_emails: false,
  items_per_page: 25,
  default_currency: 'FCFA',
  date_format: 'DD/MM/YYYY',
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadPreferences();
  }, []);

  /**
   * Charger les préférences depuis Supabase
   */
  const loadPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      // Récupérer l'utilisateur actuel
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) {
        setPreferences(DEFAULT_PREFERENCES as UserPreferences);
        return;
      }

      // Récupérer les préférences
      const { data, error: fetchError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        // Si pas de préférences, créer les valeurs par défaut
        if (fetchError.code === 'PGRST116') {
          await createDefaultPreferences(user.id);
          return;
        }
        throw fetchError;
      }

      setPreferences(data);
    } catch (err) {
      console.error('Error loading preferences:', err);
      setError(err as Error);
      // Fallback sur les préférences par défaut
      setPreferences(DEFAULT_PREFERENCES as UserPreferences);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Créer les préférences par défaut
   */
  const createDefaultPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          ...DEFAULT_PREFERENCES,
        })
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (err) {
      console.error('Error creating default preferences:', err);
      setPreferences(DEFAULT_PREFERENCES as UserPreferences);
    }
  };

  /**
   * Mettre à jour les préférences
   */
  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Mise à jour optimiste
      setPreferences(prev => prev ? { ...prev, ...updates } : null);

      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setPreferences(data);
      toast.success('Préférences sauvegardées !');
      
      return { success: true, data };
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err as Error);
      toast.error('Erreur lors de la sauvegarde');
      
      // Rollback en cas d'erreur
      await loadPreferences();
      
      return { success: false, error: err };
    }
  };

  /**
   * Réinitialiser aux valeurs par défaut
   */
  const resetToDefaults = async () => {
    return updatePreferences(DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    resetToDefaults,
    refresh: loadPreferences,
  };
}
