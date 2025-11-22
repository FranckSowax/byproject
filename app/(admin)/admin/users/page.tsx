"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users as UsersIcon,
  Search,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldOff,
  Mail,
  Calendar,
  FolderKanban,
  CheckCircle2,
  XCircle,
  Download,
  Ban,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  is_active: boolean;
  projects_count: number;
  owned_projects_count?: number;
  collaboration_projects_count?: number;
  raw_user_meta_data: any;
}

interface UserFormData {
  email: string;
  full_name: string;
  role: string;
  password?: string;
}

export default function AdminUsersPage() {
  const supabase = createClient();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    full_name: '',
    role: 'user',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, statusFilter, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      // Fetch users from auth.users via API route
      // The API now handles project counting with admin privileges to bypass RLS
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const usersWithProjects = await response.json();

      const formattedUsers = usersWithProjects.map((user: any) => ({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        role: user.user_metadata?.role || 'user',
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        is_active: user.user_metadata?.is_active !== false, // Default to true if not set
        projects_count: user.projects_count || 0,
        owned_projects_count: user.owned_projects_count || 0,
        collaboration_projects_count: user.collaboration_projects_count || 0,
        raw_user_meta_data: user.user_metadata,
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(term) ||
          user.full_name?.toLowerCase().includes(term) ||
          user.id.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter((user) => user.is_active);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter((user) => !user.is_active);
      } else if (statusFilter === 'confirmed') {
        filtered = filtered.filter((user) => user.email_confirmed_at);
      } else if (statusFilter === 'unconfirmed') {
        filtered = filtered.filter((user) => !user.email_confirmed_at);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update role');

      toast.success(`Rôle mis à jour: ${newRole}`);
      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active }),
      });

      if (!response.ok) throw new Error('Failed to toggle status');

      toast.success(user.is_active ? 'Utilisateur désactivé' : 'Utilisateur activé');
      loadUsers();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.email}" ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete user');

      toast.success('Utilisateur supprimé');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const exportToCSV = () => {
    try {
      const headers = [
        'Email',
        'Nom complet',
        'Rôle',
        'Statut',
        'Email confirmé',
        'Projets',
        'Créé le',
        'Dernière connexion',
      ];

      const rows = filteredUsers.map((user) => [
        user.email,
        user.full_name || 'N/A',
        user.role,
        user.is_active ? 'Actif' : 'Inactif',
        user.email_confirmed_at ? 'Oui' : 'Non',
        user.projects_count,
        new Date(user.created_at).toLocaleDateString('fr-FR'),
        user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR') : 'Jamais',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success('Export CSV réussi');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  const openViewDialog = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name || '',
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      role: 'user',
      password: '',
    });
    setSelectedUser(null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-600"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'editor':
        return <Badge className="bg-blue-600"><Shield className="h-3 w-3 mr-1" />Éditeur</Badge>;
      default:
        return <Badge variant="secondary"><ShieldOff className="h-3 w-3 mr-1" />Utilisateur</Badge>;
    }
  };

  // Calculate stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const totalProjects = users.reduce((sum, u) => sum + u.projects_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <UsersIcon className="h-8 w-8 text-indigo-600" />
            Gestion des Utilisateurs
          </h1>
          <p className="text-gray-600 mt-1">
            Administration complète des comptes utilisateurs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadUsers}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            onClick={exportToCSV}
            variant="outline"
            className="bg-green-50 hover:bg-green-100"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Utilisateurs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">
              Comptes enregistrés
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Utilisateurs Actifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeUsers}</div>
            <p className="text-xs text-gray-500 mt-1">
              {totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0}% du total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Administrateurs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{adminUsers}</div>
            <p className="text-xs text-gray-500 mt-1">
              Accès privilégiés
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Projets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{totalProjects}</div>
            <p className="text-xs text-gray-500 mt-1">
              Créés par les utilisateurs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par email, nom, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-10 px-3 rounded-md border border-gray-300 bg-white"
            >
              <option value="all">Tous les rôles</option>
              <option value="admin">Admin</option>
              <option value="editor">Éditeur</option>
              <option value="user">Utilisateur</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-md border border-gray-300 bg-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="confirmed">Email confirmé</option>
              <option value="unconfirmed">Email non confirmé</option>
            </select>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {filteredUsers.length} utilisateur(s) trouvé(s)
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Projets</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                    <p className="mt-2 text-gray-600">Chargement...</p>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <UsersIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">Aucun utilisateur trouvé</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.full_name || 'Sans nom'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {user.id.substring(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {user.is_active ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inactif
                          </Badge>
                        )}
                        {user.email_confirmed_at && (
                          <Badge variant="outline" className="ml-1">
                            <Mail className="h-3 w-3 mr-1" />
                            Vérifié
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <FolderKanban className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{user.projects_count}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR')
                          : 'Jamais'}
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
                          <DropdownMenuItem onClick={() => openViewDialog(user)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleUpdateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}>
                            {user.role === 'admin' ? (
                              <>
                                <ShieldOff className="h-4 w-4 mr-2" />
                                Retirer admin
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4 mr-2" />
                                Promouvoir admin
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleUserStatus(user)}>
                            {user.is_active ? (
                              <>
                                <Ban className="h-4 w-4 mr-2" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activer
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user)}
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

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5 text-indigo-600" />
              Détails de l'utilisateur
            </DialogTitle>
            <DialogDescription>
              Informations complètes du compte
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Nom complet</Label>
                  <p className="mt-1 font-medium">{selectedUser.full_name || 'Non renseigné'}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="mt-1 font-medium">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Rôle</Label>
                  <div className="mt-1">{getRoleBadge(selectedUser.role)}</div>
                </div>
                <div>
                  <Label className="text-gray-600">Statut</Label>
                  <div className="mt-1">
                    {selectedUser.is_active ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Actif
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactif
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Email confirmé</Label>
                  <p className="mt-1">{selectedUser.email_confirmed_at ? 'Oui' : 'Non'}</p>
                  {selectedUser.email_confirmed_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(selectedUser.email_confirmed_at)}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-gray-600">Projets</Label>
                  <p className="mt-1 font-medium text-purple-600">{selectedUser.projects_count} total</p>
                  {(selectedUser.owned_projects_count !== undefined && selectedUser.collaboration_projects_count !== undefined) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedUser.owned_projects_count} possédés · {selectedUser.collaboration_projects_count} collaborations
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Créé le</Label>
                  <p className="mt-1">{formatDate(selectedUser.created_at)}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Dernière connexion</Label>
                  <p className="mt-1">{formatDate(selectedUser.last_sign_in_at)}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-600">ID Utilisateur</Label>
                <p className="mt-1 text-xs font-mono bg-gray-100 p-2 rounded">{selectedUser.id}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fermer
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedUser) openEditDialog(selectedUser);
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
