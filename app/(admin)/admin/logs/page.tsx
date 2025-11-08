"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MessageSquare,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Info,
  XCircle,
  Clock,
  User,
  Activity,
  Database,
  Shield,
  Zap,
  FileText,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'success';
  category: string;
  message: string;
  user?: string;
  ip?: string;
  details?: string;
}

export default function LogsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    errors: 0,
    warnings: 0,
    info: 0
  });

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, selectedLevel, selectedCategory]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      // Simuler le chargement des logs
      // En production, ces données viendraient de la base de données ou d'un service de logs
      
      const mockLogs: LogEntry[] = [
        { id: '1', timestamp: '2025-11-08 14:35:22', level: 'error', category: 'auth', message: 'Tentative de connexion échouée', user: 'user@example.com', ip: '192.168.1.1', details: 'Mot de passe incorrect' },
        { id: '2', timestamp: '2025-11-08 14:34:15', level: 'success', category: 'auth', message: 'Connexion réussie', user: 'admin@compachantier.com', ip: '192.168.1.2' },
        { id: '3', timestamp: '2025-11-08 14:33:08', level: 'info', category: 'database', message: 'Backup automatique créé', details: 'backup_2025_11_08_14_00.sql' },
        { id: '4', timestamp: '2025-11-08 14:32:45', level: 'warning', category: 'system', message: 'Utilisation mémoire élevée', details: '85% utilisé' },
        { id: '5', timestamp: '2025-11-08 14:31:30', level: 'success', category: 'database', message: 'Migration exécutée', details: 'create_system_settings_table' },
        { id: '6', timestamp: '2025-11-08 14:30:12', level: 'info', category: 'api', message: 'Requête API reçue', user: 'sowaxcom@gmail.com', details: 'GET /api/admin/users' },
        { id: '7', timestamp: '2025-11-08 14:28:55', level: 'error', category: 'api', message: 'Erreur API 500', details: 'Internal Server Error' },
        { id: '8', timestamp: '2025-11-08 14:27:33', level: 'warning', category: 'security', message: 'Tentatives de connexion multiples', user: 'unknown@test.com', ip: '192.168.1.100' },
        { id: '9', timestamp: '2025-11-08 14:26:18', level: 'info', category: 'system', message: 'Service redémarré', details: 'API Gateway' },
        { id: '10', timestamp: '2025-11-08 14:25:05', level: 'success', category: 'user', message: 'Nouvel utilisateur créé', user: 'newuser@example.com' },
        { id: '11', timestamp: '2025-11-08 14:23:42', level: 'info', category: 'export', message: 'Export PDF généré', user: 'admin@compachantier.com', details: 'project_report.pdf' },
        { id: '12', timestamp: '2025-11-08 14:22:15', level: 'error', category: 'database', message: 'Échec de la connexion', details: 'Connection timeout' },
        { id: '13', timestamp: '2025-11-08 14:20:58', level: 'warning', category: 'storage', message: 'Espace disque faible', details: '15% restant' },
        { id: '14', timestamp: '2025-11-08 14:19:30', level: 'success', category: 'backup', message: 'Backup restauré', details: 'backup_2025_11_07_14_00.sql' },
        { id: '15', timestamp: '2025-11-08 14:18:12', level: 'info', category: 'auth', message: 'Déconnexion utilisateur', user: 'user@example.com' }
      ];

      setLogs(mockLogs);

      // Calculer les stats
      const errors = mockLogs.filter(l => l.level === 'error').length;
      const warnings = mockLogs.filter(l => l.level === 'warning').length;
      const info = mockLogs.filter(l => l.level === 'info' || l.level === 'success').length;

      setStats({
        total: mockLogs.length,
        errors,
        warnings,
        info
      });

    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filtre par niveau
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    // Filtre par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(log => log.category === selectedCategory);
    }

    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(query) ||
        log.user?.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query)
      );
    }

    setFilteredLogs(filtered);
  };

  const handleExport = () => {
    try {
      const csvContent = [
        ['Timestamp', 'Level', 'Category', 'Message', 'User', 'IP', 'Details'].join(','),
        ...filteredLogs.map(log =>
          [log.timestamp, log.level, log.category, log.message, log.user || '', log.ip || '', log.details || ''].join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast.success('Logs exportés avec succès');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants: Record<string, string> = {
      error: 'bg-red-100 text-red-800 border-red-200',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      success: 'bg-green-100 text-green-800 border-green-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return variants[level] || variants.info;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth':
        return <Shield className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'api':
        return <Zap className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const categories = ['all', 'auth', 'database', 'api', 'system', 'security', 'user', 'export', 'backup', 'storage'];
  const levels = ['all', 'error', 'warning', 'success', 'info'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-indigo-600" />
            Logs Système
          </h1>
          <p className="text-gray-600 mt-1">
            Journaux d'activité et événements système
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadLogs}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-600 mt-1">Entrées totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erreurs</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
            <p className="text-xs text-gray-600 mt-1">Erreurs critiques</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avertissements</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
            <p className="text-xs text-gray-600 mt-1">Avertissements</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Info</CardTitle>
            <Info className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.info}</div>
            <p className="text-xs text-gray-600 mt-1">Informations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher dans les logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Level Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Niveau</label>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => (
                  <Button
                    key={level}
                    variant={selectedLevel === level ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedLevel(level)}
                  >
                    {level === 'all' ? 'Tous' : level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie</label>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 5).map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === 'all' ? 'Toutes' : category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Filters Info */}
          {(searchQuery || selectedLevel !== 'all' || selectedCategory !== 'all') && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Info className="h-4 w-4" />
              <span>
                {filteredLogs.length} résultat{filteredLogs.length > 1 ? 's' : ''} sur {logs.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLevel('all');
                  setSelectedCategory('all');
                }}
              >
                Réinitialiser
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>Entrées de Log</CardTitle>
          <CardDescription>
            {filteredLogs.length} entrée{filteredLogs.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucun log trouvé</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="mt-0.5">
                    {getLevelIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${getLevelBadge(log.level)} border`}>
                        {log.level}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getCategoryIcon(log.category)}
                        {log.category}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {log.timestamp}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 mb-1">{log.message}</p>
                    {log.details && (
                      <p className="text-sm text-gray-600 mb-1">{log.details}</p>
                    )}
                    {(log.user || log.ip) && (
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {log.user && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.user}
                          </span>
                        )}
                        {log.ip && (
                          <span>IP: {log.ip}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
