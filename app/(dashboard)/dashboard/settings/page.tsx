"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Globe, Bell, Palette } from "lucide-react";
import { toast } from "sonner";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

export default function SettingsPage() {
  const { preferences, loading, updatePreferences } = useUserPreferences();

  const handleLanguageChange = async (language: 'en' | 'fr' | 'zh') => {
    await updatePreferences({ language });
  };

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    await updatePreferences({ theme });
  };

  const handleNotificationToggle = async (key: string, value: boolean) => {
    await updatePreferences({ [key]: value } as any);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-gray-600">Gérez vos préférences d&apos;application</p>
      </div>

      <div className="grid gap-6">
        {/* Langue */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              <CardTitle>Langue</CardTitle>
            </div>
            <CardDescription>
              Choisissez la langue de l&apos;interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Langue préférée</Label>
              <Select
                value={preferences?.language || 'fr'}
                onValueChange={(value) => handleLanguageChange(value as any)}
              >
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-emerald-600" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Gérez vos préférences de notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications par email</Label>
                <p className="text-sm text-gray-500">
                  Recevoir des mises à jour par email
                </p>
              </div>
              <Switch
                checked={preferences?.email_notifications ?? true}
                onCheckedChange={(checked) => handleNotificationToggle('email_notifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications de projet</Label>
                <p className="text-sm text-gray-500">
                  Alertes sur les changements de projets
                </p>
              </div>
              <Switch
                checked={preferences?.project_notifications ?? true}
                onCheckedChange={(checked) => handleNotificationToggle('project_notifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications d&apos;export</Label>
                <p className="text-sm text-gray-500">
                  Alertes quand un export est prêt
                </p>
              </div>
              <Switch
                checked={preferences?.export_notifications ?? false}
                onCheckedChange={(checked) => handleNotificationToggle('export_notifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Apparence */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-600" />
              <CardTitle>Apparence</CardTitle>
            </div>
            <CardDescription>
              Personnalisez l&apos;apparence de l&apos;application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="theme">Thème</Label>
              <Select
                value={preferences?.theme || 'light'}
                onValueChange={(value) => handleThemeChange(value as any)}
              >
                <SelectTrigger id="theme">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Clair</SelectItem>
                  <SelectItem value="dark">Sombre</SelectItem>
                  <SelectItem value="system">Système</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sécurité - Changement de mot de passe */}
        <ChangePasswordForm />
      </div>
    </div>
  );
}
