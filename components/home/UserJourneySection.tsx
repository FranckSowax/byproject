import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plane, Laptop, FileCheck2, ArrowRight, CheckCircle2 } from "lucide-react";

export function UserJourneySection() {
  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-white via-slate-50/50 to-white relative overflow-hidden">
      {/* Enhanced Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 to-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-64 w-[500px] h-[500px] bg-gradient-to-bl from-purple-500/10 to-pink-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Enhanced Section Header */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border border-blue-100/50 mb-8 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
            </span>
            <span className="text-sm font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Choisissez votre parcours
            </span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Quelle est votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient">situation</span> ?
          </h2>
          <p className="text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Une solution adaptée à votre projet, que vous restiez au bureau ou que vous partiez en mission.
          </p>
        </div>

        {/* Enhanced Journey Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto">
          
          {/* Card 1: Remote/Digital - Enhanced */}
          <div className="group relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-25 transition-all duration-700"></div>
            
            {/* Card */}
            <div className="relative h-full p-10 rounded-[1.75rem] border-2 border-slate-200/80 bg-white/95 backdrop-blur-sm hover:border-blue-300/50 transition-all duration-500 hover:shadow-[0_20px_70px_-15px_rgba(59,130,246,0.3)] hover:-translate-y-3 flex flex-col overflow-hidden">
              {/* Shine effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </div>

              {/* Icon with enhanced glow */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative h-20 w-20 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 group-hover:shadow-2xl group-hover:shadow-blue-500/40 transition-all duration-500 group-hover:scale-110">
                  <Laptop className="h-10 w-10 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">Je reste ici</h3>
              <p className="text-slate-600 mb-8 leading-relaxed flex-grow text-base">
                Vous ne souhaitez pas vous déplacer. Vous avez une liste de matériaux ou souhaitez créer un projet de zéro.
              </p>

              {/* Features with enhanced styling */}
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3 text-sm text-slate-700 group/item hover:text-blue-600 transition-colors">
                  <div className="mt-0.5 p-1 rounded-full bg-blue-50 group-hover/item:bg-blue-100 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  </div>
                  <span className="font-medium">Import de liste (PDF/Excel)</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 group/item hover:text-blue-600 transition-colors">
                  <div className="mt-0.5 p-1 rounded-full bg-blue-50 group-hover/item:bg-blue-100 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  </div>
                  <span className="font-medium">Cotation en ligne 100% gérée</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 group/item hover:text-blue-600 transition-colors">
                  <div className="mt-0.5 p-1 rounded-full bg-blue-50 group-hover/item:bg-blue-100 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  </div>
                  <span className="font-medium">Livraison clé en main</span>
                </li>
              </ul>

              {/* Enhanced CTA */}
              <Link href="/signup?mode=remote" className="block mt-auto">
                <Button className="w-full h-14 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white border-0 shadow-xl shadow-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300 text-base font-semibold group/btn">
                  Commencer à distance 
                  <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-2 transition-transform duration-300" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 2: Travel/Mission (Featured) - Enhanced */}
          <div className="group relative md:-mt-6">
            {/* Popular Badge - Enhanced */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white text-xs font-bold px-5 py-2.5 rounded-full shadow-2xl shadow-orange-500/50 flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s' }}>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                Le plus populaire
              </div>
            </div>

            {/* Enhanced Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 rounded-[2rem] blur-2xl opacity-30 group-hover:opacity-40 transition-all duration-700"></div>
            
            {/* Card with gradient background */}
            <div className="relative h-full p-10 rounded-[1.75rem] border-2 border-orange-300/60 bg-gradient-to-br from-orange-50/80 via-white/90 to-red-50/80 backdrop-blur-sm hover:border-orange-400/70 transition-all duration-500 hover:shadow-[0_25px_80px_-15px_rgba(249,115,22,0.4)] hover:-translate-y-3 flex flex-col overflow-hidden">
              {/* Enhanced Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-transparent to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </div>

              {/* Icon with pulsing glow */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 animate-pulse transition-opacity duration-500"></div>
                <div className="relative h-20 w-20 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/40 group-hover:shadow-3xl group-hover:shadow-orange-500/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                  <Plane className="h-10 w-10 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-orange-600 transition-colors duration-300">Je vais en Chine</h3>
              <p className="text-slate-700 mb-8 leading-relaxed flex-grow text-base font-medium">
                Vous préparez un voyage, une délégation ou une mission officielle. Vous avez besoin d'organiser vos visites.
              </p>

              {/* Features */}
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3 text-sm text-slate-700 group/item hover:text-orange-600 transition-colors">
                  <div className="mt-0.5 p-1 rounded-full bg-orange-50 group-hover/item:bg-orange-100 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  </div>
                  <span className="font-medium">Préparation des visites usines</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 group/item hover:text-orange-600 transition-colors">
                  <div className="mt-0.5 p-1 rounded-full bg-orange-50 group-hover/item:bg-orange-100 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  </div>
                  <span className="font-medium">Assistant Comparateur sur place</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 group/item hover:text-orange-600 transition-colors">
                  <div className="mt-0.5 p-1 rounded-full bg-orange-50 group-hover/item:bg-orange-100 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-orange-600 flex-shrink-0" />
                  </div>
                  <span className="font-medium">Logistique & Accompagnement</span>
                </li>
              </ul>

              {/* Premium CTA */}
              <Link href="/delegations/new" className="block mt-auto">
                <Button className="w-full h-14 bg-gradient-to-r from-orange-600 via-red-500 to-orange-600 hover:from-orange-700 hover:via-red-600 hover:to-orange-700 text-white border-0 shadow-2xl shadow-orange-500/40 hover:shadow-3xl hover:shadow-orange-500/50 transition-all duration-300 text-base font-semibold group/btn">
                  Préparer ma mission 
                  <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-2 transition-transform duration-300" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Card 3: Templates - Enhanced */}
          <div className="group relative">
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-25 transition-all duration-700"></div>
            
            {/* Card */}
            <div className="relative h-full p-10 rounded-[1.75rem] border-2 border-slate-200/80 bg-white/95 backdrop-blur-sm hover:border-purple-300/50 transition-all duration-500 hover:shadow-[0_20px_70px_-15px_rgba(168,85,247,0.3)] hover:-translate-y-3 flex flex-col overflow-hidden">
              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
              </div>

              {/* Icon */}
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative h-20 w-20 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-500/30 group-hover:shadow-2xl group-hover:shadow-purple-500/40 transition-all duration-500 group-hover:scale-110">
                  <FileCheck2 className="h-10 w-10 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-purple-600 transition-colors duration-300">Je cherche un projet modèle</h3>
              <p className="text-slate-600 mb-8 leading-relaxed flex-grow text-base">
                Vous n'avez pas encore de liste ? Partez d'un projet existant certifié et adaptez-le.
              </p>

              {/* Features */}
              <ul className="space-y-4 mb-10">
                <li className="flex items-start gap-3 text-sm text-slate-700 group/item hover:text-purple-600 transition-colors">
                  <div className="mt-0.5 p-1 rounded-full bg-purple-50 group-hover/item:bg-purple-100 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  </div>
                  <span className="font-medium">Catalogue de projets complets</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 group/item hover:text-purple-600 transition-colors">
                  <div className="mt-0.5 p-1 rounded-full bg-purple-50 group-hover/item:bg-purple-100 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  </div>
                  <span className="font-medium">Listes de matériaux modifiables</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-slate-700 group/item hover:text-purple-600 transition-colors">
                  <div className="mt-0.5 p-1 rounded-full bg-purple-50 group-hover/item:bg-purple-100 transition-colors">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  </div>
                  <span className="font-medium">Prix de référence immédiats</span>
                </li>
              </ul>

              {/* CTA */}
              <Link href="#templates" className="block mt-auto">
                <Button className="w-full h-14 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 hover:from-purple-700 hover:via-purple-600 hover:to-pink-600 text-white border-0 shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 text-base font-semibold group/btn">
                  Voir les projets modèles 
                  <ArrowRight className="ml-2 h-5 w-5 group-hover/btn:translate-x-2 transition-transform duration-300" />
                </Button>
              </Link>
            </div>
          </div>

        </div>

        {/* Enhanced Bottom Info Banner */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 shadow-sm">
            <span className="font-semibold text-slate-900">Pas encore sûr ?</span>
            <span className="text-slate-600">Commencez gratuitement et explorez toutes les options.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
