import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Globe, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  Bot, 
  LogIn, 
  UserPlus,
  FileUp,
  Users,
  BarChart3,
  Send,
  Zap,
  Clock,
  TrendingDown,
  Building2,
  Hotel,
  UtensilsCrossed,
  Store,
  HeartPulse,
  Package
} from "lucide-react";
import Image from "next/image";
import { HowItWorksSimple } from "@/components/home/HowItWorksSimple";
import { PricingSection } from "@/components/home/PricingSection";

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/95 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Image 
                src="/logo-byproject.png" 
                alt="By Project" 
                width={140} 
                height={45}
                className="h-9 w-auto"
                priority
              />
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                Fonctionnalités
              </Link>
              <Link href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                Comment ça marche
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                Tarifs
              </Link>
              <Link href="/delegations" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                Délégations
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-violet-600">
                  <LogIn className="h-4 w-4 mr-1.5" />
                  <span className="hidden sm:inline">Connexion</span>
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  <span>S'inscrire</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-blue-50 pointer-events-none" />
          
          <div className="container mx-auto px-4 sm:px-6 py-20 sm:py-28 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Plateforme de Sourcing B2B depuis la Chine
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                Importez, comparez, sourcez
                <span className="block bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  en toute simplicité
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                La plateforme qui centralise vos besoins, collecte les prix de fournisseurs chinois et vous aide à prendre les meilleures décisions d'achat.
              </p>

              {/* Secteurs supportés */}
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                {[
                  { icon: Building2, label: 'BTP' },
                  { icon: Hotel, label: 'Hôtellerie' },
                  { icon: UtensilsCrossed, label: 'Restauration' },
                  { icon: Store, label: 'Retail' },
                  { icon: HeartPulse, label: 'Médical' },
                  { icon: Package, label: 'Et plus...' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-sm">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white px-8 h-12 text-base">
                    Démarrer gratuitement
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-slate-50 h-12 text-base">
                    Découvrir la plateforme
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Problème / Solution */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                  Le sourcing international, simplifié
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Fini les emails perdus, les fichiers Excel éparpillés et les comparaisons manuelles interminables.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Clock,
                    title: "Gain de temps",
                    description: "Centralisez tous vos besoins et fournisseurs en un seul endroit. Plus de va-et-vient entre emails et tableurs.",
                    color: "violet"
                  },
                  {
                    icon: TrendingDown,
                    title: "Réduction des coûts",
                    description: "Comparez instantanément les prix locaux vs import Chine. Identifiez les meilleures opportunités.",
                    color: "emerald"
                  },
                  {
                    icon: Shield,
                    title: "Sécurité",
                    description: "Vos données sont protégées. Historique complet des échanges et traçabilité des prix.",
                    color: "blue"
                  }
                ].map((item) => (
                  <div key={item.title} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className={`w-12 h-12 rounded-xl bg-${item.color}-100 flex items-center justify-center mb-5`}>
                      <item.icon className={`h-6 w-6 text-${item.color}-600`} />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-3">{item.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section: Fonctionnalités Clés */}
        <section id="features" className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                  Tout ce dont vous avez besoin
                </h2>
                <p className="text-lg text-slate-600">
                  Des outils puissants pour chaque étape de votre sourcing
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Feature 1: Import IA */}
                <div className="group relative bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-8 border border-violet-100 hover:border-violet-200 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-violet-600 flex items-center justify-center flex-shrink-0">
                      <FileUp className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Import intelligent</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Uploadez vos listes Excel, PDF ou CSV. L'IA analyse et structure automatiquement vos données selon votre secteur d'activité.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-violet-600 font-medium">
                        <Zap className="h-4 w-4" />
                        Mapping automatique par IA
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 2: Multi-fournisseurs */}
                <div className="group relative bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-8 border border-emerald-100 hover:border-emerald-200 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
                      <Users className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Gestion fournisseurs</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Centralisez tous vos contacts fournisseurs. Gérez les informations, suivez l'historique des prix et des échanges.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 font-medium">
                        <Globe className="h-4 w-4" />
                        Base fournisseurs Chine intégrée
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 3: Comparaison */}
                <div className="group relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 hover:border-blue-200 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Comparateur de prix</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Visualisez les écarts de prix entre fournisseurs. Simulez les coûts d'import (transport, douane) pour une décision éclairée.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 font-medium">
                        <TrendingDown className="h-4 w-4" />
                        Calcul automatique des économies
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 4: Cotation en ligne */}
                <div className="group relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border border-amber-100 hover:border-amber-200 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                      <Send className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Cotation en ligne</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Générez un lien unique pour chaque fournisseur. Ils remplissent leurs prix directement en ligne. Fini les emails perdus.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Réponses centralisées automatiquement
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <div id="how-it-works">
          <HowItWorksSimple />
        </div>

        {/* Section Délégations */}
        <section className="py-20 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 sm:px-6 relative">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium">
                    <Globe className="h-3.5 w-3.5" />
                    Solution Entreprises & Délégations
                  </div>
                  
                  <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                    Missions en Chine
                    <span className="block text-blue-400">clé en main</span>
                  </h2>
                  
                  <p className="text-slate-300 text-lg">
                    Organisez vos visites d'usines, gérez la logistique VIP et structurez vos projets avec notre assistant IA.
                  </p>
                  
                  <ul className="space-y-3 text-left">
                    {[
                      'Planification intelligente des Factory Tours',
                      'Logistique complète (hôtels, transferts, interprètes)',
                      'Assistant IA pour structurer votre projet',
                      'Suivi de budget en temps réel'
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-slate-300">
                        <CheckCircle2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/delegations/new">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white mt-4">
                      <Bot className="mr-2 h-5 w-5" />
                      Configurer une mission
                    </Button>
                  </Link>
                </div>
                
                <div className="lg:w-1/2">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-800/50 p-1.5">
                    <div className="aspect-[4/3] bg-slate-900 rounded-xl p-5 flex flex-col gap-4">
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/40" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                        <div className="w-3 h-3 rounded-full bg-green-500/40" />
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div className="col-span-1 space-y-3">
                          <div className="h-20 bg-blue-500/10 rounded-lg border border-blue-500/20 animate-pulse" />
                          <div className="h-20 bg-slate-800 rounded-lg" />
                        </div>
                        <div className="col-span-2 space-y-3">
                          <div className="h-8 bg-slate-800 rounded w-3/4" />
                          <div className="h-24 bg-slate-800 rounded-lg" />
                          <div className="flex gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-600/30 flex items-center justify-center">
                              <Bot className="h-5 w-5 text-blue-400" />
                            </div>
                            <div className="flex-1 h-10 bg-slate-800 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <div id="pricing">
          <PricingSection />
        </div>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-10 sm:p-14 shadow-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Prêt à optimiser vos achats ?
              </h2>
              <p className="text-violet-100 text-lg mb-8 max-w-xl mx-auto">
                Rejoignez les entreprises qui sourcent efficacement avec By Project.
              </p>
              <Link href="/signup">
                <Button size="lg" className="bg-white hover:bg-violet-50 text-violet-700 font-semibold px-10 h-12 text-base">
                  Créer un compte gratuit
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-8 mt-8 text-sm text-violet-200">
                <span className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Sans engagement
                </span>
                <span className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Accès immédiat
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Image 
                src="/logo-byproject.png" 
                alt="By Project" 
                width={120} 
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <Link href="/login" className="hover:text-violet-600 transition-colors">
                Connexion
              </Link>
              <Link href="/signup" className="hover:text-violet-600 transition-colors">
                Inscription
              </Link>
              <span>&copy; 2025 By Project</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
