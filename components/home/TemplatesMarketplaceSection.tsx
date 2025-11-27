import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  LayoutTemplate, 
  CheckCircle2,
  Globe,
  ArrowRight,
  Building2
} from "lucide-react";

const templates = [
  {
    id: 1,
    title: "Villa Moderne T5",
    category: "Résidentiel",
    image: "https://images.unsplash.com/photo-1600596542815-60c37cabc38d?auto=format&fit=crop&w=800&q=80",
    materialsCount: 145,
    estimatedPrice: "185,000 €",
    features: ["Liste matériaux complète", "Plans 3D inclus", "Cotations disponibles"]
  },
  {
    id: 2,
    title: "Salon de Coiffure Moderne",
    category: "Commercial",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    materialsCount: 65,
    estimatedPrice: "45,000 €",
    features: ["Postes de coiffure complets", "Éclairage LED technique", "Plomberie & Bacs"]
  },
  {
    id: 3,
    title: "Hangar Industriel 1000m²",
    category: "Industriel",
    image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80",
    materialsCount: 85,
    estimatedPrice: "120,000 €",
    features: ["Structure métallique", "Bardage double peau", "Fondations incluses"]
  }
];

export function TemplatesMarketplaceSection() {
  return (
    <section id="templates" className="py-20 sm:py-32 bg-[#F8F9FF] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-orange-500/5 to-red-500/5 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm border border-blue-100 mb-6">
            <LayoutTemplate className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Marketplace de Projets Modèles</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1A202C] mb-6">
            Démarrez plus vite avec nos <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Projets Modèles Certifiés</span>
          </h2>
          
          <p className="text-lg text-gray-600 leading-relaxed">
            Accédez à des projets complets "prêts-à-sourcer". Listes de matériaux vérifiées, fournisseurs identifiés, et flexibilité totale pour votre gestion de projet.
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {templates.map((template) => (
            <div key={template.id} className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col">
              {/* Image */}
              <div className="relative h-48 sm:h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gray-200 animate-pulse" /> {/* Placeholder loader */}
                <Image 
                  src={template.image}
                  alt={template.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-xs font-bold text-gray-700 shadow-sm">
                    {template.category}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-blue-600/90 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-sm">
                    Demo
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{template.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-1">
                    <LayoutTemplate className="h-4 w-4" />
                    <span>{template.materialsCount} articles</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    <span>Sourcing Ready</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {template.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">Prix estimé matériaux</span>
                    <span className="text-lg font-bold text-blue-600">{template.estimatedPrice}</span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md group-hover:shadow-lg transition-all">
                    Voir le projet <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
