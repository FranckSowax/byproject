/**
 * Composant pour changer le mot de passe
 * Utilise Supabase Auth pour la mise à jour sécurisée
 */

"use client";

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const supabase = createClient();

  // Validation du mot de passe
  const passwordValidation = {
    minLength: newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(newPassword),
    hasLowercase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isPasswordValid) {
      toast.error('Le mot de passe ne respecte pas les critères de sécurité');
      return;
    }

    if (!passwordsMatch) {
      toast.error('Les mots de passe ne correspondent pas');
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
      setNewPassword('');
      setConfirmPassword('');

    } catch (error: any) {
      console.error('Error changing password:', error);
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nouveau mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Critères de validation */}
            {newPassword && (
              <div className="space-y-2 mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Critères du mot de passe :</p>
                <div className="space-y-1">
                  <ValidationItem
                    valid={passwordValidation.minLength}
                    text="Au moins 8 caractères"
                  />
                  <ValidationItem
                    valid={passwordValidation.hasUppercase}
                    text="Au moins une majuscule (A-Z)"
                  />
                  <ValidationItem
                    valid={passwordValidation.hasLowercase}
                    text="Au moins une minuscule (a-z)"
                  />
                  <ValidationItem
                    valid={passwordValidation.hasNumber}
                    text="Au moins un chiffre (0-9)"
                  />
                  <ValidationItem
                    valid={passwordValidation.hasSpecial}
                    text="Au moins un caractère spécial (!@#$...)"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirmer mot de passe */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Indicateur de correspondance */}
            {confirmPassword && (
              <div className="flex items-center gap-2 text-sm">
                {passwordsMatch ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">Les mots de passe correspondent</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-600">Les mots de passe ne correspondent pas</span>
                  </>
                )}
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading || !isPasswordValid || !passwordsMatch}
            className="w-full"
          >
            {loading ? 'Modification en cours...' : 'Changer le mot de passe'}
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 <strong>Conseil :</strong> Utilisez un gestionnaire de mots de passe pour créer et stocker des mots de passe forts et uniques.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Composant pour afficher un critère de validation
function ValidationItem({ valid, text }: { valid: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {valid ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
      )}
      <span className={valid ? 'text-green-600' : 'text-gray-600'}>{text}</span>
    </div>
  );
}
