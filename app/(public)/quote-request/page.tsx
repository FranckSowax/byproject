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

  useEffect(() => {
    checkAuth();
    // Load saved materials from localStorage
    const savedMaterials = localStorage.getItem("quote_request_materials");
    if (savedMaterials) {
      setMaterials(JSON.parse(savedMaterials));
    }
  }, []);

  useEffect(() => {
    // Save materials to localStorage
    if (materials.length > 0) {
      localStorage.setItem("quote_request_materials", JSON.stringify(materials));
    }
  }, [materials]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setIsAuthenticated(true);
      setUser(session.user);
    }
  };

  const handleAddMaterial = () => {
    if (!newMaterial.name.trim()) {
      toast.error("Le nom du matériau est requis");
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
    toast.success("Matériau ajouté");
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
      toast.error("Ajoutez au moins un matériau");
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

  const units = ["pièce", "m", "m²", "m³", "kg", "tonne", "litre", "lot", "ensemble"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30 text-sm px-4 py-1">
            <Gift className="h-4 w-4 mr-2" />
            Offre Freemium - 15 jours gratuits
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Obtenez les Meilleurs Prix
          </h1>
          <p className="text-xl text-white/90 mb-6">
            Comparez les prix de vos matériaux de construction avec nos fournisseurs partenaires en Chine
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Globe className="h-4 w-4" />
              Fournisseurs vérifiés
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Shield className="h-4 w-4" />
              Devis sécurisés
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
              <Clock className="h-4 w-4" />
              Réponse sous 48h
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 -mt-8">
        {/* Materials List Card */}
        <Card className="shadow-2xl border-0 mb-6">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-6 w-6 text-purple-600" />
              Votre Liste de Matériaux
            </CardTitle>
            <CardDescription>
              Ajoutez les matériaux pour lesquels vous souhaitez obtenir des devis
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {materials.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Aucun matériau ajouté</p>
                <Button
                  onClick={() => setIsAddingMaterial(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter votre premier matériau
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {materials.map((material, index) => (
                  <div
                    key={material.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{material.name}</h4>
                      {material.description && (
                        <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline">
                          {material.quantity} {material.unit}
                        </Badge>
                        {material.images.length > 0 && (
                          <Badge variant="secondary">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            {material.images.length} image(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveMaterial(material.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-full mt-4 border-dashed border-2"
                  onClick={() => setIsAddingMaterial(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un autre matériau
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Section */}
        {materials.length > 0 && (
          <Card className="shadow-xl border-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">
                    Prêt à obtenir vos devis ?
                  </h3>
                  <p className="text-white/80">
                    {materials.length} matériau(x) dans votre liste
                  </p>
                </div>
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-gray-100 shadow-lg"
                  onClick={handleSubmitRequest}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Envoi en cours..."
                  ) : isAuthenticated ? (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Envoyer ma demande
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Continuer (Inscription gratuite)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Gift className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">15 Jours Gratuits</h3>
              <p className="text-sm text-gray-600">
                Testez notre plateforme sans engagement pendant 15 jours
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Fournisseurs Chinois</h3>
              <p className="text-sm text-gray-600">
                Accédez à notre réseau de fournisseurs vérifiés en Chine
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Comparaison Facile</h3>
              <p className="text-sm text-gray-600">
                Comparez les prix et choisissez la meilleure offre
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Material Dialog */}
      <Dialog open={isAddingMaterial} onOpenChange={setIsAddingMaterial}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Ajouter un matériau
            </DialogTitle>
            <DialogDescription>
              Décrivez le matériau pour lequel vous souhaitez un devis
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="materialName">Nom du matériau *</Label>
              <Input
                id="materialName"
                placeholder="Ex: Carrelage 60x60 blanc brillant"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialDescription">Description (optionnel)</Label>
              <Textarea
                id="materialDescription"
                placeholder="Spécifications, dimensions, couleur, marque préférée..."
                value={newMaterial.description}
                onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantité</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="1"
                  value={newMaterial.quantity}
                  onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unité</Label>
                <select
                  id="unit"
                  value={newMaterial.unit}
                  onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white"
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Images (optionnel)</Label>
              <div className="flex flex-wrap gap-2">
                {newImages.map((img, idx) => (
                  <div key={idx} className="relative w-20 h-20">
                    <Image src={img} alt="" fill className="object-cover rounded-lg" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setNewImages(newImages.filter((_, i) => i !== idx))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {newImages.length < 3 && (
                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      multiple
                    />
                    <Plus className="h-6 w-6 text-gray-400" />
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500">Max 3 images, 5MB chacune</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingMaterial(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleAddMaterial}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Required Dialog */}
      <Dialog open={isAuthDialogOpen} onOpenChange={setIsAuthDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Créez votre compte gratuit
            </DialogTitle>
            <DialogDescription>
              Pour envoyer votre demande de cotation, vous devez créer un compte ou vous connecter.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <Gift className="h-8 w-8 text-purple-600" />
                <div>
                  <h4 className="font-semibold text-purple-900">Offre Freemium</h4>
                  <p className="text-sm text-purple-700">15 jours d'essai gratuit</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-purple-800">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Jusqu'à 5 projets
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Devis illimités
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Comparaison de prix
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600"
                onClick={() => handleAuthRedirect("signup")}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Créer mon compte gratuit
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="w-full"
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
