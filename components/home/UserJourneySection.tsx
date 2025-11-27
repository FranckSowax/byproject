import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plane, Laptop, FileCheck2, ArrowRight, CheckCircle2 } from "lucide-react";

export function UserJourneySection() {
  return (
    <section className="py-20 sm:py-32 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Choisissez votre parcours
            </span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            Quelle est votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">situation</span> ?
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed">
            Une solution adaptée à votre projet, que vous restiez au bureau ou que vous partiez en mission.
          </p>
        </div>

        {/* Journey Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
          
          {/* Card 1: Remote/Digital */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
            <div className="relative h-full p-8 rounded-3xl border border-slate-200 bg-white hover:border-blue-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col">
              {/* Icon */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-md opacity-20"></div>
                <div className="relative h-16 w-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Laptop className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Je reste ici</h3>
              <p className="text-slate-600 mb-6 leading-relaxed flex-grow">
                Vous ne souhaitez pas vous déplacer. Vous avez une liste de matériaux ou souhaitez créer un projet de zéro.
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Import de liste (PDF/Excel)</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Cotation en ligne 100% gérée</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>Livraison clé en main</span>
                </li>
              </ul>

              {/* CTA */}
              <Link href="/signup?mode=remote" className="block mt-auto">
                <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0 shadow-lg hover:shadow-xl transition-all group">
                  Commencer à distance 
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 2: Travel/Mission (Featured) */}
          <div className="group relative md:-mt-4">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                Le plus populaire
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
            <div className="relative h-full p-8 rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50/50 to-red-50/30 hover:border-orange-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col">
              {/* Icon */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl blur-md opacity-30"></div>
                <div className="relative h-16 w-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Plane className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Je vais en Chine</h3>
              <p className="text-slate-700 mb-6 leading-relaxed flex-grow">
                Vous préparez un voyage, une délégation ou une mission officielle. Vous avez besoin d'organiser vos visites.
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>Préparation des visites usines</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>Assistant Comparateur sur place</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>Logistique & Accompagnement</span>
                </li>
              </ul>

              {/* CTA */}
              <Link href="/services" className="block mt-auto">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all group">
                  Préparer ma mission 
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 3: Templates */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
            <div className="relative h-full p-8 rounded-3xl border border-slate-200 bg-white hover:border-purple-300 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex flex-col">
              {/* Icon */}
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-md opacity-20"></div>
                <div className="relative h-16 w-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <FileCheck2 className="h-8 w-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Je cherche un modèle</h3>
              <p className="text-slate-600 mb-6 leading-relaxed flex-grow">
                Vous n'avez pas encore de liste ? Partez d'un projet existant certifié et adaptez-le.
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>Catalogue de projets complets</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>Listes de matériaux modifiables</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700">
                  <CheckCircle2 className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <span>Prix de référence immédiats</span>
                </li>
              </ul>

              {/* CTA */}
              <Link href="#templates" className="block mt-auto">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all group">
                  Voir les modèles 
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Info Banner */}
        <div className="mt-16 text-center">
          <p className="text-slate-500 text-sm">
            <span className="font-semibold text-slate-700">Pas encore sûr ?</span> Commencez gratuitement et explorez toutes les options.
          </p>
        </div>
      </div>
    </section>
  );
}
