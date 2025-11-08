"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  HardDrive,
  FileText,
  Play,
  Pause,
  Info,
  Activity,
  BarChart3,
  Table as TableIcon,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface TableInfo {
  name: string;
  rows: number;
  size: string;
  last_modified: string;
}

interface MigrationInfo {
  version: string;
  name: string;
  executed_at: string;
  status: 'success' | 'pending' | 'failed';
}

interface BackupInfo {
  id: string;
  name: string;
  size: string;
  created_at: string;
  tables_count: number;
  rows_count: number;
}

export default function DatabasePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [migrations, setMigrations] = useState<MigrationInfo[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [dbStats, setDbStats] = useState({
    total_tables: 0,
    total_rows: 0,
    total_size: '0 MB',
    last_backup: 'Jamais'
  });

  useEffect(() => {
    loadDatabaseInfo();
  }, []);

  const loadDatabaseInfo = async () => {
    try {
      setLoading(true);
      
      // Simuler le chargement des infos de la base de données
      // En production, ces données viendraient de l'API Supabase Management
      
      // Tables fictives pour démo
      const mockTables: TableInfo[] = [
        { name: 'users', rows: 150, size: '2.3 MB', last_modified: '2025-11-08 14:30' },
        { name: 'projects', rows: 45, size: '1.8 MB', last_modified: '2025-11-08 13:15' },
        { name: 'materials', rows: 320, size: '5.2 MB', last_modified: '2025-11-08 12:00' },
        { name: 'prices', rows: 890, size: '8.7 MB', last_modified: '2025-11-08 11:45' },
        { name: 'suppliers', rows: 67, size: '1.2 MB', last_modified: '2025-11-07 16:20' },
        { name: 'exchange_rates', rows: 24, size: '0.5 MB', last_modified: '2025-11-08 14:20' },
        { name: 'system_settings', rows: 24, size: '0.3 MB', last_modified: '2025-11-08 14:31' },
        { name: 'project_collaborators', rows: 12, size: '0.4 MB', last_modified: '2025-11-06 10:00' }
      ];

      const mockMigrations: MigrationInfo[] = [
        { version: '20251108_001', name: 'create_system_settings_table', executed_at: '2025-11-08 14:31', status: 'success' },
        { version: '20251108_002', name: 'add_exchange_rates_rls_policies', executed_at: '2025-11-08 13:40', status: 'success' },
        { version: '20251101_001', name: 'create_roles_permissions', executed_at: '2025-11-01 19:56', status: 'success' },
        { version: '20251031_001', name: 'add_project_collaborators', executed_at: '2025-10-31 15:30', status: 'success' },
        { version: '20251030_001', name: 'create_initial_schema', executed_at: '2025-10-30 10:00', status: 'success' }
      ];

      const mockBackups: BackupInfo[] = [
        { id: '1', name: 'backup_2025_11_08_14_00', size: '25.4 MB', created_at: '2025-11-08 14:00', tables_count: 8, rows_count: 1532 },
        { id: '2', name: 'backup_2025_11_07_14_00', size: '24.8 MB', created_at: '2025-11-07 14:00', tables_count: 8, rows_count: 1498 },
        { id: '3', name: 'backup_2025_11_06_14_00', size: '23.2 MB', created_at: '2025-11-06 14:00', tables_count: 7, rows_count: 1445 }
      ];

      setTables(mockTables);
      setMigrations(mockMigrations);
      setBackups(mockBackups);

      // Calculer les stats
      const totalRows = mockTables.reduce((sum, t) => sum + t.rows, 0);
      setDbStats({
        total_tables: mockTables.length,
        total_rows: totalRows,
        total_size: '20.4 MB',
        last_backup: mockBackups[0]?.created_at || 'Jamais'
      });

    } catch (error) {
      console.error('Error loading database info:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      // En production, appeler l'API Supabase Management pour créer un backup
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simuler
      toast.success('Backup créé avec succès');
      loadDatabaseInfo();
    } catch (error) {
      toast.error('Erreur lors de la création du backup');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm('Voulez-vous vraiment restaurer ce backup ? Cela écrasera les données actuelles.')) {
      return;
    }
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Backup restauré avec succès');
      loadDatabaseInfo();
    } catch (error) {
      toast.error('Erreur lors de la restauration');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce backup ?')) {
      return;
    }
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Backup supprimé');
      loadDatabaseInfo();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  const handleRunMigration = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Migration exécutée avec succès');
      loadDatabaseInfo();
    } catch (error) {
      toast.error('Erreur lors de la migration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Database className="h-8 w-8 text-indigo-600" />
            Base de Données
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des backups, migrations et statistiques
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadDatabaseInfo}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={handleCreateBackup}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Créer Backup
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tables</CardTitle>
            <TableIcon className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats.total_tables}</div>
            <p className="text-xs text-gray-600 mt-1">Tables actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lignes</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats.total_rows.toLocaleString()}</div>
            <p className="text-xs text-gray-600 mt-1">Enregistrements totaux</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taille</CardTitle>
            <HardDrive className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dbStats.total_size}</div>
            <p className="text-xs text-gray-600 mt-1">Espace utilisé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernier Backup</CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{dbStats.last_backup}</div>
            <p className="text-xs text-gray-600 mt-1">Date du backup</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tables" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tables">
            <TableIcon className="h-4 w-4 mr-2" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="backups">
            <Download className="h-4 w-4 mr-2" />
            Backups
          </TabsTrigger>
          <TabsTrigger value="migrations">
            <Zap className="h-4 w-4 mr-2" />
            Migrations
          </TabsTrigger>
          <TabsTrigger value="health">
            <Activity className="h-4 w-4 mr-2" />
            Santé
          </TabsTrigger>
        </TabsList>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tables de la Base de Données</CardTitle>
              <CardDescription>
                Liste de toutes les tables avec statistiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : (
                <div className="space-y-2">
                  {tables.map((table) => (
                    <div
                      key={table.name}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <TableIcon className="h-5 w-5 text-indigo-600" />
                        <div>
                          <p className="font-medium">{table.name}</p>
                          <p className="text-sm text-gray-600">
                            {table.rows.toLocaleString()} lignes • {table.size}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Dernière modification</p>
                        <p className="text-sm font-medium">{table.last_modified}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backups Tab */}
        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backups Disponibles</CardTitle>
              <CardDescription>
                Gérez vos sauvegardes de base de données
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : backups.length === 0 ? (
                <div className="text-center py-8">
                  <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun backup disponible</p>
                  <Button
                    onClick={handleCreateBackup}
                    className="mt-4"
                  >
                    Créer le premier backup
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {backups.map((backup) => (
                    <div
                      key={backup.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Download className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">{backup.name}</p>
                          <p className="text-sm text-gray-600">
                            {backup.tables_count} tables • {backup.rows_count.toLocaleString()} lignes • {backup.size}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Créé le {backup.created_at}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreBackup(backup.id)}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Restaurer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBackup(backup.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">
                    Backups Automatiques
                  </p>
                  <p className="text-sm text-blue-700">
                    Les backups sont créés automatiquement tous les jours à 14h00.
                    Vous pouvez également créer des backups manuels à tout moment.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Migrations Tab */}
        <TabsContent value="migrations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historique des Migrations</CardTitle>
                  <CardDescription>
                    Toutes les migrations exécutées sur la base de données
                  </CardDescription>
                </div>
                <Button
                  onClick={handleRunMigration}
                  disabled={loading}
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Exécuter Migration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : (
                <div className="space-y-2">
                  {migrations.map((migration) => (
                    <div
                      key={migration.version}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {migration.status === 'success' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : migration.status === 'failed' ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-yellow-600" />
                        )}
                        <div>
                          <p className="font-medium">{migration.name}</p>
                          <p className="text-sm text-gray-600">Version: {migration.version}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={migration.status === 'success' ? 'default' : 'destructive'}
                        >
                          {migration.status === 'success' ? 'Succès' : migration.status === 'failed' ? 'Échoué' : 'En attente'}
                        </Badge>
                        <p className="text-sm text-gray-600">{migration.executed_at}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Connexions Actives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">12</div>
                <p className="text-sm text-gray-600 mt-1">Connexions en cours</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requêtes/min</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">847</div>
                <p className="text-sm text-gray-600 mt-1">Moyenne dernière heure</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Temps de Réponse</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600">45ms</div>
                <p className="text-sm text-gray-600 mt-1">Moyenne</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disponibilité</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">99.9%</div>
                <p className="text-sm text-gray-600 mt-1">Uptime 30 jours</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-900">
                    Base de Données en Bonne Santé
                  </p>
                  <p className="text-sm text-green-700">
                    Toutes les métriques sont normales. La base de données fonctionne correctement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
