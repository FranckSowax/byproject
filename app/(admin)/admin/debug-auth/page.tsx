"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, RefreshCw, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AuthDebugInfo {
  sessionActive: boolean;
  userId: string | null;
  email: string | null;
  jwtRole: string | null;
  jwtMetadata: any;
  dbRole: string | null;
  rolesMatch: boolean;
  hasAdminAccess: boolean;
}

export default function DebugAuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<AuthDebugInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      setLoading(true);

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setDebugInfo({
          sessionActive: false,
          userId: null,
          email: null,
          jwtRole: null,
          jwtMetadata: null,
          dbRole: null,
          rolesMatch: false,
          hasAdminAccess: false,
        });
        return;
      }

      const jwtRole = session.user.user_metadata?.role || null;
      const jwtMetadata = session.user.user_metadata || {};

      // Try to access admin-only data to test permissions
      // @ts-ignore - supplier_quotes not in types yet
      const { error: testError } = await supabase
        .from('supplier_quotes')
        .select('id')
        .limit(1);

      const hasAdminAccess = !testError;

      setDebugInfo({
        sessionActive: true,
        userId: session.user.id,
        email: session.user.email || null,
        jwtRole,
        jwtMetadata,
        dbRole: jwtRole, // In JWT, so should match
        rolesMatch: jwtRole === 'admin',
        hasAdminAccess,
      });
    } catch (error) {
      console.error('Error loading debug info:', error);
      toast.error('Erreur lors du chargement des informations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      toast.success('Token rafraîchi avec succès !');
      await loadDebugInfo();
    } catch (error) {
      console.error('Error refreshing token:', error);
      toast.error('Erreur lors du rafraîchissement du token');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Déconnexion réussie');
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Erreur lors de la déconnexion');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!debugInfo) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="py-12 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">Impossible de charger les informations de débogage</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Débogage Authentification</h1>
        <p className="text-gray-600">Diagnostiquer les problèmes d'accès admin</p>
      </div>

      {/* Status Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {debugInfo.hasAdminAccess ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            Status Global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Session Active</span>
              {debugInfo.sessionActive ? (
                <Badge className="bg-green-500">Oui</Badge>
              ) : (
                <Badge variant="destructive">Non</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Accès Admin</span>
              {debugInfo.hasAdminAccess ? (
                <Badge className="bg-green-500">Autorisé</Badge>
              ) : (
                <Badge variant="destructive">Refusé</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Rôle Correct</span>
              {debugInfo.rolesMatch ? (
                <Badge className="bg-green-500">Oui</Badge>
              ) : (
                <Badge variant="destructive">Non</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Information */}
      {debugInfo.sessionActive && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informations Utilisateur</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Email</span>
                <p className="font-medium">{debugInfo.email}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">User ID</span>
                <p className="font-mono text-sm">{debugInfo.userId}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Rôle JWT</span>
                <p className="font-medium">
                  {debugInfo.jwtRole ? (
                    <Badge className={debugInfo.jwtRole === 'admin' ? 'bg-green-500' : 'bg-yellow-500'}>
                      {debugInfo.jwtRole}
                    </Badge>
                  ) : (
                    <Badge variant="outline">Aucun rôle</Badge>
                  )}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Métadonnées JWT</span>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                  {JSON.stringify(debugInfo.jwtMetadata, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnostic */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Diagnostic</CardTitle>
          <CardDescription>Analyse des problèmes potentiels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!debugInfo.sessionActive && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Aucune session active</p>
                  <p className="text-sm text-red-700 mt-1">
                    Vous devez vous connecter pour accéder aux pages admin.
                  </p>
                </div>
              </div>
            )}

            {debugInfo.sessionActive && !debugInfo.jwtRole && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <XCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Aucun rôle défini</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Votre compte n'a pas de rôle assigné. Contactez un administrateur.
                  </p>
                </div>
              </div>
            )}

            {debugInfo.sessionActive && debugInfo.jwtRole && debugInfo.jwtRole !== 'admin' && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <XCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900">Rôle insuffisant</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Votre rôle actuel est "{debugInfo.jwtRole}". Vous avez besoin du rôle "admin".
                  </p>
                </div>
              </div>
            )}

            {debugInfo.sessionActive && debugInfo.jwtRole === 'admin' && !debugInfo.hasAdminAccess && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Token non rafraîchi</p>
                  <p className="text-sm text-red-700 mt-1">
                    Votre rôle est "admin" mais le token JWT n'a pas été rafraîchi.
                  </p>
                  <p className="text-sm text-red-700 mt-2 font-medium">
                    Solution : Déconnectez-vous et reconnectez-vous.
                  </p>
                </div>
              </div>
            )}

            {debugInfo.hasAdminAccess && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">Tout fonctionne correctement</p>
                  <p className="text-sm text-green-700 mt-1">
                    Vous avez accès aux fonctionnalités admin.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={loadDebugInfo} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recharger
            </Button>
            
            {debugInfo.sessionActive && (
              <>
                <Button 
                  onClick={handleRefreshToken} 
                  disabled={refreshing}
                  variant="outline"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Rafraîchir Token
                </Button>
                
                <Button onClick={handleSignOut} variant="destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Se Déconnecter
                </Button>
              </>
            )}

            {!debugInfo.sessionActive && (
              <Button onClick={() => router.push('/login')}>
                Aller à la Connexion
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
