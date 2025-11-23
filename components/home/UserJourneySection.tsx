import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plane, Laptop, FileCheck2, ArrowRight } from "lucide-react";

export function UserJourneySection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Quelle est votre situation ?
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Une solution adaptée à votre projet, que vous restiez au bureau ou que vous partiez en mission.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Scenario 1: No Travel */}
          <div className="group relative p-8 rounded-2xl border border-slate-100 bg-slate-50 hover:shadow-xl hover:border-blue-200 transition-all duration-300">
            <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Laptop className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Je reste ici</h3>
            <p className="text-slate-600 mb-6 leading-relaxed text-sm">
              Vous ne souhaitez pas vous déplacer. Vous avez une liste de matériaux (Architecte/Ingénieur) ou souhaitez créer un projet de zéro.
            </p>
            <ul className="space-y-2 mb-8 text-sm text-slate-700">
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Import de liste (PDF/Excel)
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Cotation en ligne 100% gérée
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Livraison clé en main
              </li>
            </ul>
            <Link href="/signup?mode=remote" className="block mt-auto">
              <Button className="w-full bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300">
                Commencer à distance <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Scenario 2: Travel / Mission */}
          <div className="group relative p-8 rounded-2xl border border-orange-100 bg-orange-50/50 hover:shadow-xl hover:border-orange-200 transition-all duration-300 transform md:-translate-y-4">
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
              Populaire
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Plane className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Je vais en Chine</h3>
            <p className="text-slate-600 mb-6 leading-relaxed text-sm">
              Vous préparez un voyage, une délégation ou une mission officielle. Vous avez besoin d'organiser vos visites.
            </p>
            <ul className="space-y-2 mb-8 text-sm text-slate-700">
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                Préparation des visites usines
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                Assistant Comparateur sur place
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                Logistique & Accompagnement
              </li>
            </ul>
            <Link href="/services" className="block mt-auto">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-lg">
                Préparer ma mission <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Scenario 3: Templates */}
          <div className="group relative p-8 rounded-2xl border border-purple-100 bg-purple-50/30 hover:shadow-xl hover:border-purple-200 transition-all duration-300">
            <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileCheck2 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Je cherche un modèle</h3>
            <p className="text-slate-600 mb-6 leading-relaxed text-sm">
              Vous n'avez pas encore de liste ? Partez d'un projet existant certifié et adaptez-le.
            </p>
            <ul className="space-y-2 mb-8 text-sm text-slate-700">
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                Catalogue de projets complets
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                Listes de matériaux modifiables
              </li>
              <li className="flex gap-2 items-center">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                Prix de référence immédiats
              </li>
            </ul>
            <Link href="#templates" className="block mt-auto">
              <Button className="w-full bg-white text-purple-600 border border-purple-200 hover:bg-purple-50 hover:border-purple-300">
                Voir les modèles <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
