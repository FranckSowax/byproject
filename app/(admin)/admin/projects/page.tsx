"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FolderKanban,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  Download,
  RefreshCw,
  ExternalLink,
  User,
  Calendar,
  Package,
  FileText,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  user_id: string;
  source_url: string | null;
  file_path: string | null;
  mapping_status: string | null;
  created_at: string;
  updated_at: string | null;
  user_name?: string;
  user_email?: string;
  materials_count?: number;
}

export default function AdminProjectsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [searchTerm, statusFilter, projects]);

  const loadProjects = async () => {
    try {
      setLoading(true);

      // Load projects from Admin API (bypasses RLS and enriches data)
      const response = await fetch('/api/admin/projects');
      if (!response.ok) throw new Error('Failed to fetch projects');
      
      const projectsWithMeta = await response.json();
      setProjects(projectsWithMeta);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(term) ||
          project.user_name?.toLowerCase().includes(term) ||
          project.user_email?.toLowerCase().includes(term)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((project) => project.mapping_status === statusFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      toast.success('Projet supprimé');
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const exportToCSV = () => {
    const csv = [
      ['ID', 'Nom', 'Utilisateur', 'Email', 'Matériaux', 'Statut', 'Créé le', 'Source'],
      ...filteredProjects.map((p) => [
        p.id,
        p.name,
        p.user_name || '',
        p.user_email || '',
        p.materials_count || 0,
        p.mapping_status || 'N/A',
        new Date(p.created_at).toLocaleDateString('fr-FR'),
        p.source_url || p.file_path || 'Manuel',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projets_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">N/A</Badge>;
    
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      completed: { label: 'Terminé', variant: 'default' },
      pending: { label: 'En cours', variant: 'secondary' },
      failed: { label: 'Échoué', variant: 'destructive' },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FolderKanban className="h-8 w-8 text-purple-600" />
            Tous les Projets
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez tous les projets de tous les utilisateurs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadProjects}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Projets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{projects.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Terminés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {projects.filter((p) => p.mapping_status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>En Cours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {projects.filter((p) => p.mapping_status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Matériaux</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {projects.reduce((sum, p) => sum + (p.materials_count || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, utilisateur ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="completed">Terminé</option>
                <option value="pending">En cours</option>
                <option value="failed">Échoué</option>
              </select>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {filteredProjects.length} projet(s) trouvé(s)
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Matériaux</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-600" />
                    <p className="mt-2 text-gray-600">Chargement...</p>
                  </TableCell>
                </TableRow>
              ) : filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <FolderKanban className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">Aucun projet trouvé</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{project.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {project.id.substring(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3 text-gray-400" />
                          <span className="font-medium">{project.user_name}</span>
                        </div>
                        <div className="text-xs text-gray-500">{project.user_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">{project.materials_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(project.mapping_status)}
                    </TableCell>
                    <TableCell>
                      {project.source_url ? (
                        <Badge variant="outline" className="text-xs">
                          <ExternalLink className="h-2 w-2 mr-1" />
                          URL
                        </Badge>
                      ) : project.file_path ? (
                        <Badge variant="outline" className="text-xs">
                          <FileText className="h-2 w-2 mr-1" />
                          Fichier
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Manuel</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir le projet
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => window.open(`/dashboard/projects/${project.id}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ouvrir dans un nouvel onglet
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteProject(project)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
