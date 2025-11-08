"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Globe,
  Bell,
  Mail,
  Shield,
  Database,
  Palette,
  Zap,
  FileText,
  DollarSign,
  Users,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemSettings {
  // Général
  app_name: string;
  app_description: string;
  support_email: string;
  support_phone: string;
  
  // Langues
  default_language: 'fr' | 'en' | 'zh';
  enabled_languages: string[];
  
  // Devises
  default_currency: string;
  auto_convert_prices: boolean;
  
  // Notifications
  email_notifications: boolean;
  push_notifications: boolean;
  notification_frequency: 'instant' | 'daily' | 'weekly';
  
  // Sécurité
  require_email_verification: boolean;
  password_min_length: number;
  session_timeout_minutes: number;
  max_login_attempts: number;
  
  // Projets
  max_projects_per_user: number;
  auto_archive_days: number;
  allow_project_sharing: boolean;
  
  // Fournisseurs
  auto_approve_suppliers: boolean;
  supplier_verification_required: boolean;
  
  // Exports
  max_exports_per_day: number;
  export_formats: string[];
  
  // Maintenance
  maintenance_mode: boolean;
  maintenance_message: string;
}

export default function SettingsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<SystemSettings>({
    app_name: 'Compa Chantier',
    app_description: 'Plateforme de gestion de projets de construction',
    support_email: 'support@compachantier.com',
    support_phone: '+33 1 23 45 67 89',
    default_language: 'fr',
    enabled_languages: ['fr', 'en', 'zh'],
    default_currency: 'XAF',
    auto_convert_prices: true,
    email_notifications: true,
    push_notifications: false,
    notification_frequency: 'instant',
    require_email_verification: true,
    password_min_length: 8,
    session_timeout_minutes: 60,
    max_login_attempts: 5,
    max_projects_per_user: 10,
    auto_archive_days: 90,
    allow_project_sharing: true,
    auto_approve_suppliers: false,
    supplier_verification_required: true,
    max_exports_per_day: 50,
    export_formats: ['PDF', 'Excel', 'CSV'],
    maintenance_mode: false,
    maintenance_message: 'Maintenance en cours. Retour prévu dans 2 heures.'
  });
  
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Sauvegarder dans localStorage pour l'instant
      // TODO: Créer une table system_settings dans Supabase
      localStorage.setItem('system_settings', JSON.stringify(settings));
      
      toast.success('Paramètres sauvegardés avec succès');
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const saved = localStorage.getItem('system_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
      setHasChanges(false);
      toast.info('Paramètres réinitialisés');
    }
  };

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  useEffect(() => {
    const saved = localStorage.getItem('system_settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-indigo-600" />
            Paramètres Système
          </h1>
          <p className="text-gray-600 mt-1">
            Configurez tous les aspects de votre application
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="h-4 w-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">
                Vous avez des modifications non sauvegardées
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto">
          <TabsTrigger value="general">
            <Globe className="h-4 w-4 mr-2" />
            Général
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="projects">
            <FileText className="h-4 w-4 mr-2" />
            Projets
          </TabsTrigger>
          <TabsTrigger value="suppliers">
            <Users className="h-4 w-4 mr-2" />
            Fournisseurs
          </TabsTrigger>
          <TabsTrigger value="advanced">
            <Zap className="h-4 w-4 mr-2" />
            Avancé
          </TabsTrigger>
        </TabsList>

        {/* Général Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'Application</CardTitle>
              <CardDescription>
                Configurez les informations de base de votre application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="app_name">Nom de l'Application</Label>
                  <Input
                    id="app_name"
                    value={settings.app_name}
                    onChange={(e) => updateSetting('app_name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_email">Email Support</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => updateSetting('support_email', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="app_description">Description</Label>
                <Input
                  id="app_description"
                  value={settings.app_description}
                  onChange={(e) => updateSetting('app_description', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="support_phone">Téléphone Support</Label>
                <Input
                  id="support_phone"
                  value={settings.support_phone}
                  onChange={(e) => updateSetting('support_phone', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Langues et Devises</CardTitle>
              <CardDescription>
                Gérez les langues et devises disponibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Langue par Défaut</Label>
                  <div className="flex gap-2">
                    {['fr', 'en', 'zh'].map((lang) => (
                      <Button
                        key={lang}
                        variant={settings.default_language === lang ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateSetting('default_language', lang)}
                      >
                        {lang === 'fr' ? '🇫🇷 Français' : lang === 'en' ? '🇬🇧 English' : '🇨🇳 中文'}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default_currency">Devise par Défaut</Label>
                  <Input
                    id="default_currency"
                    value={settings.default_currency}
                    onChange={(e) => updateSetting('default_currency', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Conversion Automatique des Prix</Label>
                  <p className="text-sm text-gray-500">
                    Convertir automatiquement les prix dans la devise de l'utilisateur
                  </p>
                </div>
                <Switch
                  checked={settings.auto_convert_prices}
                  onCheckedChange={(checked) => updateSetting('auto_convert_prices', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Notification</CardTitle>
              <CardDescription>
                Configurez comment et quand les utilisateurs reçoivent des notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Notifications Email
                  </Label>
                  <p className="text-sm text-gray-500">
                    Envoyer des notifications par email
                  </p>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notifications Push
                  </Label>
                  <p className="text-sm text-gray-500">
                    Activer les notifications push dans le navigateur
                  </p>
                </div>
                <Switch
                  checked={settings.push_notifications}
                  onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Fréquence des Notifications</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'instant', label: 'Instantané' },
                    { value: 'daily', label: 'Quotidien' },
                    { value: 'weekly', label: 'Hebdomadaire' }
                  ].map((freq) => (
                    <Button
                      key={freq.value}
                      variant={settings.notification_frequency === freq.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('notification_frequency', freq.value)}
                    >
                      {freq.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres de Sécurité</CardTitle>
              <CardDescription>
                Configurez les règles de sécurité et d'authentification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Vérification Email Obligatoire</Label>
                  <p className="text-sm text-gray-500">
                    Les utilisateurs doivent vérifier leur email avant d'accéder à l'app
                  </p>
                </div>
                <Switch
                  checked={settings.require_email_verification}
                  onCheckedChange={(checked) => updateSetting('require_email_verification', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password_min_length">Longueur Minimale du Mot de Passe</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    min="6"
                    max="20"
                    value={settings.password_min_length}
                    onChange={(e) => updateSetting('password_min_length', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_login_attempts">Tentatives de Connexion Max</Label>
                  <Input
                    id="max_login_attempts"
                    type="number"
                    min="3"
                    max="10"
                    value={settings.max_login_attempts}
                    onChange={(e) => updateSetting('max_login_attempts', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="session_timeout">Timeout de Session (minutes)</Label>
                <Input
                  id="session_timeout"
                  type="number"
                  min="15"
                  max="480"
                  value={settings.session_timeout_minutes}
                  onChange={(e) => updateSetting('session_timeout_minutes', parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500">
                  Déconnexion automatique après inactivité
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Projets</CardTitle>
              <CardDescription>
                Configurez les limites et règles pour les projets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max_projects">Projets Max par Utilisateur</Label>
                  <Input
                    id="max_projects"
                    type="number"
                    min="1"
                    max="100"
                    value={settings.max_projects_per_user}
                    onChange={(e) => updateSetting('max_projects_per_user', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="auto_archive">Archivage Auto (jours)</Label>
                  <Input
                    id="auto_archive"
                    type="number"
                    min="30"
                    max="365"
                    value={settings.auto_archive_days}
                    onChange={(e) => updateSetting('auto_archive_days', parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Partage de Projets</Label>
                  <p className="text-sm text-gray-500">
                    Permettre aux utilisateurs de partager leurs projets
                  </p>
                </div>
                <Switch
                  checked={settings.allow_project_sharing}
                  onCheckedChange={(checked) => updateSetting('allow_project_sharing', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des Fournisseurs</CardTitle>
              <CardDescription>
                Configurez les règles pour les fournisseurs et cotations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Approbation Automatique</Label>
                  <p className="text-sm text-gray-500">
                    Approuver automatiquement les nouveaux fournisseurs
                  </p>
                </div>
                <Switch
                  checked={settings.auto_approve_suppliers}
                  onCheckedChange={(checked) => updateSetting('auto_approve_suppliers', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Vérification Obligatoire</Label>
                  <p className="text-sm text-gray-500">
                    Les fournisseurs doivent être vérifiés avant d'envoyer des cotations
                  </p>
                </div>
                <Switch
                  checked={settings.supplier_verification_required}
                  onCheckedChange={(checked) => updateSetting('supplier_verification_required', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Exports et Limites</CardTitle>
              <CardDescription>
                Configurez les limites d'export et formats disponibles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max_exports">Exports Max par Jour</Label>
                <Input
                  id="max_exports"
                  type="number"
                  min="10"
                  max="1000"
                  value={settings.max_exports_per_day}
                  onChange={(e) => updateSetting('max_exports_per_day', parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Formats d'Export Disponibles</Label>
                <div className="flex gap-2">
                  {['PDF', 'Excel', 'CSV', 'JSON'].map((format) => (
                    <Badge
                      key={format}
                      variant={settings.export_formats.includes(format) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const formats = settings.export_formats.includes(format)
                          ? settings.export_formats.filter(f => f !== format)
                          : [...settings.export_formats, format];
                        updateSetting('export_formats', formats);
                      }}
                    >
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Mode Maintenance</CardTitle>
              <CardDescription>
                Activez le mode maintenance pour bloquer l'accès à l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-red-600">Activer le Mode Maintenance</Label>
                  <p className="text-sm text-gray-500">
                    ⚠️ Les utilisateurs ne pourront plus accéder à l'application
                  </p>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => updateSetting('maintenance_mode', checked)}
                />
              </div>
              
              {settings.maintenance_mode && (
                <div className="space-y-2">
                  <Label htmlFor="maintenance_message">Message de Maintenance</Label>
                  <Input
                    id="maintenance_message"
                    value={settings.maintenance_message}
                    onChange={(e) => updateSetting('maintenance_message', e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">
                Sauvegarde Automatique
              </p>
              <p className="text-sm text-blue-700">
                Les paramètres sont actuellement sauvegardés localement. Pour une sauvegarde permanente,
                créez une table <code className="bg-blue-100 px-1 rounded">system_settings</code> dans Supabase.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
