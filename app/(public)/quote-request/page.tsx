"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  Plus,
  Trash2,
  Send,
  Gift,
  Clock,
  CheckCircle,
  Globe,
  Shield,
  Sparkles,
  ArrowRight,
  Image as ImageIcon,
  X,
  Building2,
  ShoppingBag,
  Factory,
  Boxes,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface MaterialItem {
  id: string;
  name: string;
  description: string;
  quantity: string;
  unit: string;
  images: string[];
}

export default function PublicQuoteRequestPage() {
  const router = useRouter();
  const supabase = createClient();

  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    description: "",
    quantity: "",
    unit: "pièce",
  });
  const [newImages, setNewImages] = useState<string[]>([]);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Track if we should auto-submit after auth
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false);

  useEffect(() => {
    checkAuth();
    // Load saved materials from localStorage
    const savedMaterials = localStorage.getItem("quote_request_materials");
    if (savedMaterials) {
      setMaterials(JSON.parse(savedMaterials));
    }
    // Check if user just came back from auth flow
    const redirectFlag = localStorage.getItem("quote_request_redirect");
    if (redirectFlag) {
      setShouldAutoSubmit(true);
      localStorage.removeItem("quote_request_redirect");
    }
  }, []);

  useEffect(() => {
    // Save materials to localStorage
    if (materials.length > 0) {
      localStorage.setItem("quote_request_materials", JSON.stringify(materials));
    }
  }, [materials]);

  // Auto-submit after returning from auth flow
  useEffect(() => {
    if (shouldAutoSubmit && isAuthenticated && user && materials.length > 0 && !isSubmitting) {
      setShouldAutoSubmit(false);
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        handleSubmitRequest();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [shouldAutoSubmit, isAuthenticated, user, materials]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setIsAuthenticated(true);
      setUser(session.user);
    }
  };

  const handleAddMaterial = () => {
    if (!newMaterial.name.trim()) {
      toast.error("Le nom du produit est requis");
      return;
    }

    const material: MaterialItem = {
      id: crypto.randomUUID(),
      name: newMaterial.name.trim(),
      description: newMaterial.description.trim(),
      quantity: newMaterial.quantity || "1",
      unit: newMaterial.unit,
      images: newImages,
    };

    setMaterials([...materials, material]);
    setNewMaterial({ name: "", description: "", quantity: "", unit: "pièce" });
    setNewImages([]);
    setIsAddingMaterial(false);
    toast.success("Produit ajouté");
  };

  const handleRemoveMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newUrls: string[] = [];

    for (let i = 0; i < files.length && i < 3; i++) {
      const file = files[i];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max 5MB)`);
        continue;
      }

      // For now, create a local URL preview
      // In production, this would upload to storage
      const reader = new FileReader();
      reader.onloadend = () => {
        newUrls.push(reader.result as string);
        setNewImages([...newImages, ...newUrls]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitRequest = async () => {
    if (materials.length === 0) {
      toast.error("Ajoutez au moins un produit");
      return;
    }

    if (!isAuthenticated) {
      setIsAuthDialogOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the quote request via API
      const response = await fetch("/api/public/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materials,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erreur lors de la création");
      }

      const data = await response.json();

      // Clear localStorage
      localStorage.removeItem("quote_request_materials");

      toast.success("Projet créé avec succès! Votre demande de cotation est en cours.");
      // Redirect to the newly created project
      router.push(`/dashboard/projects/${data.projectId}`);
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthRedirect = (action: "login" | "signup") => {
    // Save current materials before redirect
    localStorage.setItem("quote_request_materials", JSON.stringify(materials));
    localStorage.setItem("quote_request_redirect", "/quote-request");
    router.push(`/${action}?redirect=/quote-request&freemium=true`);
  };

  const units = ["pièce", "m", "m²", "m³", "kg", "tonne", "litre", "lot", "ensemble", "carton", "palette", "container"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Hero Section - Ultra Responsive */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white py-8 sm:py-10 md:py-12 lg:py-16 px-3 sm:px-4 md:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-3 sm:mb-4 bg-white/20 text-white border-white/30 text-xs sm:text-sm px-3 sm:px-4 py-1">
            <Gift className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Offre Freemium - 15 jours gratuits
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-4 leading-tight">
            Sourcez vos Produits en Chine
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-4 sm:mb-6 max-w-3xl mx-auto px-2">
            Matériaux de construction, équipements industriels, produits manufacturés...
            <br className="hidden sm:block" />
            <span className="font-semibold">Obtenez les meilleurs prix</span> de nos fournisseurs partenaires vérifiés.
          </p>

          {/* Categories Pills */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 px-2">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
              <Factory className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">Matériaux BTP</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
              <Boxes className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">Équipements</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
              <ShoppingBag className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="whitespace-nowrap">Tous produits</span>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
              <Globe className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Fournisseurs vérifiés</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Devis sécurisés</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Réponse 48h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Responsive */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 -mt-4 sm:-mt-6 md:-mt-8">
        {/* Materials List Card */}
        <Card className="shadow-2xl border-0 mb-4 sm:mb-6">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0" />
              <span>Votre Liste de Produits</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">
              Ajoutez les produits pour lesquels vous souhaitez obtenir des devis
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            {materials.length === 0 ? (
              <div className="text-center py-8 sm:py-10 md:py-12">
                <Package className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">Aucun produit ajouté</p>
                <Button
                  onClick={() => setIsAddingMaterial(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter votre premier produit
                </Button>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {materials.map((material, index) => (
                  <div
                    key={material.id}
                    className="flex items-start gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl group hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-xs sm:text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{material.name}</h4>
                      {material.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-2">{material.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 sm:mt-2">
                        <Badge variant="outline" className="text-xs">
                          {material.quantity} {material.unit}
                        </Badge>
                        {material.images.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {material.images.length} image(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 flex-shrink-0"
                      onClick={() => handleRemoveMaterial(material.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-full mt-3 sm:mt-4 border-dashed border-2 text-sm sm:text-base py-3 sm:py-4"
                  onClick={() => setIsAddingMaterial(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un autre produit
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Section - Responsive with Better Button Visibility */}
        {materials.length > 0 && (
          <Card className="shadow-xl border-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white overflow-hidden">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="text-center sm:text-left">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-0.5 sm:mb-1">
                    Prêt à obtenir vos devis ?
                  </h3>
                  <p className="text-white/80 text-xs sm:text-sm">
                    {materials.length} produit{materials.length > 1 ? 's' : ''} dans votre liste
                  </p>
                </div>
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl transition-all text-sm sm:text-base py-5 sm:py-6 px-6 sm:px-8 font-bold rounded-xl"
                  onClick={handleSubmitRequest}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="text-purple-700">Envoi en cours...</span>
                  ) : isAuthenticated ? (
                    <>
                      <Send className="h-5 w-5 mr-2 text-purple-700" />
                      <span className="text-purple-700">Envoyer ma demande</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2 text-purple-700" />
                      <span className="text-purple-700">Continuer (Inscription gratuite)</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Section - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mt-8 sm:mt-10 md:mt-12">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 sm:p-5 md:p-6 text-center">
              <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Gift className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">15 Jours Gratuits</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Testez sans engagement pendant 15 jours
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 sm:p-5 md:p-6 text-center">
              <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Globe className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Fournisseurs Chinois</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Réseau de fournisseurs vérifiés en Chine
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4 sm:p-5 md:p-6 text-center">
              <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CheckCircle className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Comparaison Facile</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                Comparez et choisissez la meilleure offre
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Material Dialog - Responsive */}
      <Dialog open={isAddingMaterial} onOpenChange={setIsAddingMaterial}>
        <DialogContent className="sm:max-w-lg mx-3 sm:mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Package className="h-5 w-5 text-purple-600" />
              Ajouter un produit
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Décrivez le produit pour lequel vous souhaitez un devis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="materialName" className="text-sm">Nom du produit *</Label>
              <Input
                id="materialName"
                placeholder="Ex: Carrelage 60x60, Machine CNC, Pièces détachées..."
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                className="text-sm sm:text-base"
              />
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="materialDescription" className="text-sm">Description (optionnel)</Label>
              <Textarea
                id="materialDescription"
                placeholder="Spécifications, dimensions, couleur, marque préférée..."
                value={newMaterial.description}
                onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                rows={3}
                className="text-sm sm:text-base"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="quantity" className="text-sm">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="1"
                  value={newMaterial.quantity}
                  onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="unit" className="text-sm">Unité</Label>
                <select
                  id="unit"
                  value={newMaterial.unit}
                  onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                  className="w-full h-9 sm:h-10 px-3 rounded-md border border-gray-300 bg-white text-sm sm:text-base"
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm">Images (optionnel)</Label>
              <div className="flex flex-wrap gap-2">
                {newImages.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 sm:w-20 sm:h-20">
                    <Image src={img} alt="" fill className="object-cover rounded-lg" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6"
                      onClick={() => setNewImages(newImages.filter((_, i) => i !== idx))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {newImages.length < 3 && (
                  <label className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      multiple
                    />
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500">Max 3 images, 5MB chacune</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddingMaterial(false)} className="text-sm">
              Annuler
            </Button>
            <Button
              onClick={handleAddMaterial}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-sm"
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Required Dialog - Responsive */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="sm:max-w-md mx-3 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Building2 className="h-5 w-5 text-purple-600" />
              Créez votre compte gratuit
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Pour envoyer votre demande, créez un compte ou connectez-vous.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 sm:py-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <Gift className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-purple-900 text-sm sm:text-base">Offre Freemium</h4>
                  <p className="text-xs sm:text-sm text-purple-700">15 jours d'essai gratuit</p>
                </div>
              </div>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-purple-800">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  Jusqu'à 5 projets
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  Devis illimités
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                  Comparaison de prix
                </li>
              </ul>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-sm sm:text-base py-5 sm:py-6"
                onClick={() => handleAuthRedirect("signup")}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Créer mon compte gratuit
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="w-full text-sm sm:text-base py-5 sm:py-6"
                onClick={() => handleAuthRedirect("login")}
              >
                J'ai déjà un compte
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
