"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Shield,
  ShieldCheck,
  Users,
  Package,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Eye,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  level: number;
  is_system: boolean;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
  permissions_count?: number;
}

interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  action: string;
  resource: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
  permission: Permission;
}

export default function RolesPermissionsPage() {
  const supabase = createClient();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('app_roles')
        .select('*')
        .order('level', { ascending: false });

      if (rolesError) throw rolesError;

      // Load permissions
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('app_permissions')
        .select('*')
        .order('category', { ascending: true });

      if (permissionsError) throw permissionsError;

      // Load role-permission mappings
      const { data: rpData, error: rpError } = await supabase
        .from('app_role_permissions')
        .select(`
          role_id,
          permission_id,
          permission:app_permissions(*)
        `);

      if (rpError) throw rpError;

      // Count permissions per role
      const rolesWithCounts = rolesData?.map(role => ({
        ...role,
        permissions_count: rpData?.filter(rp => rp.role_id === role.id).length || 0
      })) || [];

      setRoles(rolesWithCounts);
      setPermissions(permissionsData || []);
      setRolePermissions(rpData || []);

      if (rolesWithCounts.length > 0 && !selectedRole) {
        setSelectedRole(rolesWithCounts[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (iconName: string) => {
    switch (iconName) {
      case 'shield-check': return <ShieldCheck className="h-5 w-5" />;
      case 'user': return <Shield className="h-5 w-5" />;
      case 'users': return <Users className="h-5 w-5" />;
      case 'package': return <Package className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  const getRoleBadge = (role: Role) => {
    const colorClasses = {
      red: 'bg-red-600',
      blue: 'bg-blue-600',
      green: 'bg-green-600',
      purple: 'bg-purple-600',
      gray: 'bg-gray-600'
    };
    
    return (
      <Badge className={`${colorClasses[role.color as keyof typeof colorClasses] || 'bg-gray-600'} text-white`}>
        {getRoleIcon(role.icon)}
        <span className="ml-1">{role.display_name}</span>
      </Badge>
    );
  };

  const getRolePermissions = (roleId: string) => {
    return rolePermissions
      .filter(rp => rp.role_id === roleId)
      .map(rp => rp.permission);
  };

  const hasPermission = (roleId: string, permissionId: string) => {
    return rolePermissions.some(
      rp => rp.role_id === roleId && rp.permission_id === permissionId
    );
  };

  const categories = Array.from(new Set(permissions.map(p => p.category)));
  const filteredPermissions = selectedCategory === 'all'
    ? permissions
    : permissions.filter(p => p.category === selectedCategory);

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      projects: 'bg-blue-100 text-blue-800',
      materials: 'bg-green-100 text-green-800',
      prices: 'bg-yellow-100 text-yellow-800',
      quotations: 'bg-purple-100 text-purple-800',
      users: 'bg-red-100 text-red-800',
      suppliers: 'bg-orange-100 text-orange-800',
      templates: 'bg-pink-100 text-pink-800',
      system: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge variant="outline" className={colors[category] || 'bg-gray-100 text-gray-800'}>
        {category}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="h-8 w-8 text-indigo-600" />
            Rôles & Permissions
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion du système de contrôle d'accès
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Rôles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{roles.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {roles.filter(r => r.is_system).length} système
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{permissions.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {categories.length} catégories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Assignations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{rolePermissions.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              Rôle-Permission
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Catégories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{categories.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              Types de ressources
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Roles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {roles.map((role) => (
          <Card
            key={role.id}
            className={`cursor-pointer transition-all ${
              selectedRole?.id === role.id
                ? 'ring-2 ring-indigo-600 shadow-lg'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedRole(role)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                {getRoleBadge(role)}
                {role.is_system && (
                  <Badge variant="outline" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Système
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">{role.description}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Niveau: {role.level}</span>
                <span className="font-medium text-indigo-600">
                  {role.permissions_count} permissions
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions Matrix */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getRoleBadge(selectedRole)}
                  <span className="text-gray-400">-</span>
                  <span>Permissions</span>
                </CardTitle>
                <CardDescription className="mt-2">
                  {selectedRole.description}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                >
                  <option value="all">Toutes les catégories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Permission</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Ressource</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
                      <p className="mt-2 text-gray-600">Chargement...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredPermissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <Shield className="h-12 w-12 mx-auto text-gray-400" />
                      <p className="mt-2 text-gray-600">Aucune permission trouvée</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPermissions.map((permission) => {
                    const hasP = hasPermission(selectedRole.id, permission.id);
                    return (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {permission.display_name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {permission.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getCategoryBadge(permission.category)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {permission.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {permission.resource}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {hasP ? (
                            <Badge className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Accordée
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Non accordée
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Summary by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé par Catégorie</CardTitle>
          <CardDescription>
            Distribution des permissions par catégorie de ressources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => {
              const categoryPerms = permissions.filter(p => p.category === category);
              const rolePerms = selectedRole 
                ? getRolePermissions(selectedRole.id).filter(p => p.category === category)
                : [];
              
              return (
                <div key={category} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    {getCategoryBadge(category)}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedRole ? rolePerms.length : categoryPerms.length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedRole 
                      ? `sur ${categoryPerms.length} permissions`
                      : `permissions disponibles`
                    }
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
