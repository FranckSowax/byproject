"use client";

import { useState, useEffect } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Search,
  Eye,
  Package,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Tag,
  Download,
  RefreshCw,
  FileText,
  Calendar,
  Globe,
  ExternalLink,
  CheckCircle2,
  Clock,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface Quotation {
  id: string;
  requestNumber: string;
  projectName: string;
  projectId: string;
  materialsCount: number;
  submittedAt: string;
  status: string;
  isNewSystem: boolean;
}

interface QuotationSupplier {
  id: string;
  name: string;
  email: string;
  company: string;
  country: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  wechat: string;
  quotations: Quotation[];
  totalQuotations: number;
  totalMaterialsQuoted: number;
  materialsSupplied: string[];
  firstQuotationAt: string;
  lastActivityAt: string;
  source: string;
}

interface Stats {
  totalSuppliers: number;
  totalQuotations: number;
  totalMaterials: number;
  byCountry: Record<string, number>;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<QuotationSupplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<QuotationSupplier[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<QuotationSupplier | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    filterSuppliers();
  }, [searchTerm, selectedCountry, suppliers]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/suppliers?source=quotations');
      if (!response.ok) throw new Error('Failed to fetch suppliers');

      const data = await response.json();
      setSuppliers(data.suppliers || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Erreur lors du chargement des fournisseurs');
    } finally {
      setLoading(false);
    }
  };

  const filterSuppliers = () => {
    let filtered = suppliers;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (supplier) =>
          supplier.name?.toLowerCase().includes(term) ||
          supplier.email?.toLowerCase().includes(term) ||
          supplier.company?.toLowerCase().includes(term) ||
          supplier.country?.toLowerCase().includes(term) ||
          supplier.materialsSupplied?.some((m) => m.toLowerCase().includes(term))
      );
    }

    if (selectedCountry !== 'all') {
      filtered = filtered.filter((supplier) => supplier.country === selectedCountry);
    }

    setFilteredSuppliers(filtered);
  };

  const openViewDialog = (supplier: QuotationSupplier) => {
    setSelectedSupplier(supplier);
    setIsViewDialogOpen(true);
  };

  const exportToCSV = () => {
    const csv = [
      ['Entreprise', 'Contact', 'Email', 'Pays', 'WhatsApp', 'WeChat', 'Cotations', 'Materiaux', 'Derniere activite'],
      ...filteredSuppliers.map((s) => [
        s.company || s.name,
        s.contactName || '',
        s.email || '',
        s.country || '',
        s.whatsapp || '',
        s.wechat || '',
        s.totalQuotations,
        s.materialsSupplied?.join('; ') || '',
        s.lastActivityAt ? new Date(s.lastActivityAt).toLocaleDateString('fr-FR') : '',
      ]),
    ]
      .map((row) => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fournisseurs_cotations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const countries = Array.from(new Set(suppliers.map((s) => s.country).filter(Boolean)));

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'China': '🇨🇳',
      'Chine': '🇨🇳',
      'Cameroun': '🇨🇲',
      'Cameroon': '🇨🇲',
      'France': '🇫🇷',
      'USA': '🇺🇸',
      'United States': '🇺🇸',
    };
    return flags[country] || '🌍';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-purple-600" />
            Fournisseurs
          </h1>
          <p className="text-gray-600 mt-1">
            Fournisseurs ayant soumis des cotations
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
            disabled={filteredSuppliers.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Fournisseurs</p>
                <p className="text-3xl font-bold text-purple-600">{stats?.totalSuppliers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Cotations recues</p>
                <p className="text-3xl font-bold text-blue-600">{stats?.totalQuotations || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Materiaux cotes</p>
                <p className="text-3xl font-bold text-orange-600">{stats?.totalMaterials || 0}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Pays</p>
                <p className="text-3xl font-bold text-green-600">{Object.keys(stats?.byCountry || {}).length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <Globe className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Country breakdown */}
      {stats?.byCountry && Object.keys(stats.byCountry).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.byCountry).map(([country, count]) => (
            <Badge
              key={country}
              variant="outline"
              className="px-3 py-1 cursor-pointer hover:bg-slate-100"
              onClick={() => setSelectedCountry(selectedCountry === country ? 'all' : country)}
            >
              {getCountryFlag(country)} {country}: {count}
            </Badge>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email, pays ou materiau..."
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
                    {getCountryFlag(country)} {country}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            {filteredSuppliers.length} fournisseur(s) trouve(s)
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
                <TableHead className="text-center">Cotations</TableHead>
                <TableHead>Materiaux</TableHead>
                <TableHead>Derniere activite</TableHead>
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
              ) : filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-gray-600">Aucun fournisseur trouve</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Les fournisseurs apparaitront ici apres avoir soumis des cotations
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          {supplier.company || supplier.name}
                        </div>
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
                        {supplier.contactName && (
                          <div className="text-sm text-gray-600">{supplier.contactName}</div>
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
                            {supplier.wechat}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getCountryFlag(supplier.country)} {supplier.country || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-purple-600">{supplier.totalQuotations}</span>
                        <span className="text-xs text-slate-500">cotation(s)</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {supplier.materialsSupplied?.slice(0, 3).map((material, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {material.length > 20 ? material.substring(0, 20) + '...' : material}
                          </Badge>
                        ))}
                        {(supplier.materialsSupplied?.length || 0) > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(supplier.materialsSupplied?.length || 0) - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Calendar className="h-3 w-3" />
                        {formatDate(supplier.lastActivityAt)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(supplier)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              {selectedSupplier?.company || selectedSupplier?.name}
            </DialogTitle>
            <DialogDescription>
              Details du fournisseur et historique des cotations
            </DialogDescription>
          </DialogHeader>

          {selectedSupplier && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informations</TabsTrigger>
                <TabsTrigger value="quotations">
                  Cotations ({selectedSupplier.totalQuotations})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-6 mt-4">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Entreprise</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{selectedSupplier.company || selectedSupplier.name || '-'}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-600">Contact</Label>
                    <div className="mt-1">{selectedSupplier.contactName || '-'}</div>
                  </div>
                </div>

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
                        {getCountryFlag(selectedSupplier.country)} {selectedSupplier.country || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-gray-600">Telephone</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedSupplier.phone || '-'}</span>
                    </div>
                  </div>
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

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <Card className="bg-purple-50 border-purple-200">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">{selectedSupplier.totalQuotations}</p>
                        <p className="text-sm text-purple-700">Cotations</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">{selectedSupplier.materialsSupplied?.length || 0}</p>
                        <p className="text-sm text-orange-700">Materiaux</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="pt-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{selectedSupplier.totalMaterialsQuoted}</p>
                        <p className="text-sm text-blue-700">Prix fournis</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Materials */}
                <div>
                  <Label className="text-gray-600">Materiaux cotes</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedSupplier.materialsSupplied?.map((material, idx) => (
                      <Badge key={idx} variant="secondary">
                        <Tag className="h-3 w-3 mr-1" />
                        {material}
                      </Badge>
                    ))}
                    {(!selectedSupplier.materialsSupplied || selectedSupplier.materialsSupplied.length === 0) && (
                      <p className="text-sm text-gray-500">Aucun materiau reference</p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t text-sm text-slate-600">
                  <div>
                    <span className="text-slate-400">Premiere cotation:</span>{' '}
                    {formatDate(selectedSupplier.firstQuotationAt)}
                  </div>
                  <div>
                    <span className="text-slate-400">Derniere activite:</span>{' '}
                    {formatDate(selectedSupplier.lastActivityAt)}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="quotations" className="mt-4">
                <div className="space-y-3">
                  {selectedSupplier.quotations?.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <FileText className="h-10 w-10 mx-auto text-slate-300" />
                      <p className="mt-2">Aucune cotation</p>
                    </div>
                  ) : (
                    selectedSupplier.quotations?.map((quotation) => (
                      <Card key={quotation.id} className="hover:border-purple-200 transition-colors">
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900">
                                  {quotation.projectName || 'Projet'}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {quotation.requestNumber}
                                </Badge>
                                {quotation.status === 'sent_to_client' ? (
                                  <Badge className="bg-green-100 text-green-700 border-0 text-xs">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Envoye
                                  </Badge>
                                ) : (
                                  <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Soumis
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  {quotation.materialsCount} materiaux
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDateTime(quotation.submittedAt)}
                                </span>
                              </div>
                            </div>
                            <Link href={`/admin/quotations`}>
                              <Button variant="ghost" size="sm">
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
