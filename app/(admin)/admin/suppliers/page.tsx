"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Package,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Tag,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface Supplier {
  id: string;
  name: string;
  email: string;
  country: string;
  contact_name?: string;
  phone?: string;
  whatsapp?: string;
  wechat?: string;
  created_at: string;
  keywords?: string[];
  materials_count?: number;
}

interface SupplierFormData {
  name: string;
  email: string;
  country: string;
  contact_name: string;
  phone: string;
  whatsapp: string;
  wechat: string;
  keywords: string[];
}

export default function SuppliersPage() {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    email: '',
    country: 'China',
    contact_name: '',
    phone: '',
    whatsapp: '',
    wechat: '',
    keywords: [],
  });
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [searchTerm, selectedCountry, suppliers]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);

      // Load suppliers
      const { data: suppliersData, error: suppliersError } = await supabase
        .from('suppliers')
        .select('*')
        .order('name', { ascending: true });

      if (suppliersError) throw suppliersError;

      // Load materials count and keywords for each supplier
      const suppliersWithMeta = await Promise.all(
        (suppliersData || []).map(async (supplier: any) => {
          // Get materials count
          const { data: pricesData } = await supabase
            .from('prices')
            .select('material_id, materials(name)')
            .eq('supplier_id', supplier.id);

          // Extract unique material names as keywords
          const materialNames = new Set<string>();
          pricesData?.forEach((price: any) => {
            if (price.materials?.name) {
              materialNames.add(price.materials.name.toLowerCase());
            }
          });

          return {
            ...supplier,
            materials_count: materialNames.size,
            keywords: Array.from(materialNames),
          };
        })
      );

      setSuppliers(suppliersWithMeta);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Erreur lors du chargement des fournisseurs');
    } finally {
      setLoading(false);
    }
  };

  const filterSuppliers = () => {
    let filtered = suppliers;

    // Filter by search term (name, email, country, keywords)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (supplier) =>
          supplier.name.toLowerCase().includes(term) ||
          supplier.email?.toLowerCase().includes(term) ||
          supplier.country?.toLowerCase().includes(term) ||
          supplier.keywords?.some((kw) => kw.includes(term))
      );
    }

    // Filter by country
    if (selectedCountry !== 'all') {
      filtered = filtered.filter((supplier) => supplier.country === selectedCountry);
    }

    setFilteredSuppliers(filtered);
  };

  const handleAddSupplier = async () => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .insert({
          name: formData.name,
          email: formData.email,
          country: formData.country,
          contact_name: formData.contact_name || null,
          phone: formData.phone || null,
          whatsapp: formData.whatsapp || null,
          wechat: formData.wechat || null,
        });

      if (error) throw error;

      toast.success('Fournisseur ajouté avec succès');
      setIsAddDialogOpen(false);
      resetForm();
      loadSuppliers();
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast.error('Erreur lors de l\'ajout du fournisseur');
    }
  };

  const handleEditSupplier = async () => {
    if (!selectedSupplier) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          name: formData.name,
          email: formData.email,
          country: formData.country,
          contact_name: formData.contact_name || null,
          phone: formData.phone || null,
          whatsapp: formData.whatsapp || null,
          wechat: formData.wechat || null,
        })
        .eq('id', selectedSupplier.id);

      if (error) throw error;

      toast.success('Fournisseur mis à jour');
      setIsEditDialogOpen(false);
      setSelectedSupplier(null);
      resetForm();
      loadSuppliers();
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${supplier.name}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplier.id);

      if (error) throw error;

      toast.success('Fournisseur supprimé');
      loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      name: supplier.name,
      email: supplier.email || '',
      country: supplier.country || 'China',
      contact_name: supplier.contact_name || '',
      phone: supplier.phone || '',
      whatsapp: supplier.whatsapp || '',
      wechat: supplier.wechat || '',
      keywords: supplier.keywords || [],
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      country: 'China',
      contact_name: '',
      phone: '',
      whatsapp: '',
      wechat: '',
      keywords: [],
    });
    setNewKeyword('');
  };

  const exportToCSV = () => {
    const csv = [
      ['Nom', 'Email', 'Pays', 'Contact', 'WhatsApp', 'WeChat', 'Matériaux', 'Keywords'],
      ...filteredSuppliers.map((s) => [
        s.name,
        s.email || '',
        s.country || '',
        s.contact_name || '',
        s.whatsapp || '',
        s.wechat || '',
        s.materials_count || 0,
        (s.keywords || []).join(', '),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fournisseurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const countries = Array.from(new Set(suppliers.map((s) => s.country).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-600" />
            Base de Fournisseurs
          </h1>
          <p className="text-gray-600 mt-1">
            Gérez votre base de données fournisseurs et leurs spécialités
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={loadSuppliers}
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
          <Button
            onClick={() => {
              resetForm();
              setIsAddDialogOpen(true);
            }}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Fournisseur
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Fournisseurs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Chine</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {suppliers.filter((s) => s.country === 'China').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cameroun</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {suppliers.filter((s) => s.country === 'Cameroun').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Matériaux Référencés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {suppliers.reduce((sum, s) => sum + (s.materials_count || 0), 0)}
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
                  placeholder="Rechercher par nom, email, pays ou matériau..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
              >
                <option value="all">Tous les pays</option>
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {filteredSuppliers.length} fournisseur(s) trouvé(s)
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fournisseur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Matériaux</TableHead>
                <TableHead>Keywords</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-purple-600" />
                    <p className="mt-2 text-gray-600">Chargement...</p>
                  </TableCell>
                </TableRow>
              ) : filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">Aucun fournisseur trouvé</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{supplier.name}</div>
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.contact_name && (
                          <div className="text-sm text-gray-600">{supplier.contact_name}</div>
                        )}
                        {supplier.whatsapp && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MessageSquare className="h-3 w-3 text-green-600" />
                            {supplier.whatsapp}
                          </div>
                        )}
                        {supplier.wechat && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <MessageSquare className="h-3 w-3 text-blue-600" />
                            WeChat: {supplier.wechat}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {supplier.country === 'China' && '🇨🇳'}
                        {supplier.country === 'Cameroun' && '🇨🇲'}
                        {supplier.country === 'France' && '🇫🇷'}
                        {' '}{supplier.country}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">{supplier.materials_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {supplier.keywords?.slice(0, 3).map((keyword) => (
                          <Badge key={keyword} variant="secondary" className="text-xs">
                            <Tag className="h-2 w-2 mr-1" />
                            {keyword}
                          </Badge>
                        ))}
                        {(supplier.keywords?.length || 0) > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(supplier.keywords?.length || 0) - 3}
                          </Badge>
                        )}
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
                          <DropdownMenuItem onClick={() => openViewDialog(supplier)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(supplier)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteSupplier(supplier)}
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

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau Fournisseur</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau fournisseur à votre base de données
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nom de l'entreprise *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: ABC Supplies"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@abc-supplies.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_name">Nom du contact</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="country">Pays *</Label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300"
                >
                  <option value="China">Chine</option>
                  <option value="Cameroun">Cameroun</option>
                  <option value="France">France</option>
                  <option value="USA">USA</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+237 xxx xxx xxx"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+86 138 xxxx xxxx"
                />
              </div>
              <div>
                <Label htmlFor="wechat">WeChat</Label>
                <Input
                  id="wechat"
                  value={formData.wechat}
                  onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
                  placeholder="WeChat ID"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddSupplier}
              disabled={!formData.name}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le fournisseur</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations du fournisseur
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Nom de l'entreprise *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-contact_name">Nom du contact</Label>
                <Input
                  id="edit-contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-country">Pays *</Label>
                <select
                  id="edit-country"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300"
                >
                  <option value="China">Chine</option>
                  <option value="Cameroun">Cameroun</option>
                  <option value="France">France</option>
                  <option value="USA">USA</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-phone">Téléphone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                <Input
                  id="edit-whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-wechat">WeChat</Label>
                <Input
                  id="edit-wechat"
                  value={formData.wechat}
                  onChange={(e) => setFormData({ ...formData, wechat: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleEditSupplier}
              disabled={!formData.name}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              {selectedSupplier?.name}
            </DialogTitle>
            <DialogDescription>
              Détails complets du fournisseur
            </DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{selectedSupplier.email || '-'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">Pays</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <Badge variant="outline">
                      {selectedSupplier.country === 'China' && '🇨🇳'}
                      {selectedSupplier.country === 'Cameroun' && '🇨🇲'}
                      {' '}{selectedSupplier.country}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Contact</Label>
                  <div className="mt-1">{selectedSupplier.contact_name || '-'}</div>
                </div>
                <div>
                  <Label className="text-gray-600">Téléphone</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{selectedSupplier.phone || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">WhatsApp</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span>{selectedSupplier.whatsapp || '-'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-600">WeChat</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                    <span>{selectedSupplier.wechat || '-'}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-gray-600">Matériaux fournis ({selectedSupplier.materials_count || 0})</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSupplier.keywords?.map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {keyword}
                    </Badge>
                  ))}
                  {(!selectedSupplier.keywords || selectedSupplier.keywords.length === 0) && (
                    <p className="text-sm text-gray-500">Aucun matériau référencé</p>
                  )}
                </div>
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
                if (selectedSupplier) openEditDialog(selectedSupplier);
              }}
              className="bg-purple-600 hover:bg-purple-700"
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
