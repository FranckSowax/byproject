"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Calendar } from "lucide-react";

interface MockUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isTestUser: boolean;
}

export default function ProfilePage() {
  const [mockUser, setMockUser] = useState<MockUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("mockUser");
    if (storedUser) {
      setMockUser(JSON.parse(storedUser));
    }
  }, []);

  if (!mockUser) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil</h1>
        <p className="text-gray-600">Informations de votre compte</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>Vos données de compte</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Nom complet</p>
                <p className="font-semibold">{mockUser.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                <Mail className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="font-semibold">{mockUser.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Rôle</p>
                <Badge variant="secondary">{mockUser.role}</Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Calendar className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Membre depuis</p>
                <p className="font-semibold">{new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut du compte</CardTitle>
            <CardDescription>Type et permissions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockUser.isTestUser && (
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-blue-600">Compte de Test</Badge>
                </div>
                <p className="text-sm text-blue-800">
                  Ceci est un compte de test pour le développement. 
                  En production, utilisez Supabase Auth.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-semibold">Permissions</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Créer des projets
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Modifier les données
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Exporter des rapports
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  Gérer les utilisateurs
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
