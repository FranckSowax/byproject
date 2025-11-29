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
  Package,
  Factory,
  Truck,
  MessageCircle,
  BadgeCheck,
  Handshake,
  MapPin
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
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-amber-50 pointer-events-none" />
          
          {/* Decorative elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-red-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
          
          <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
            <div className="max-w-5xl mx-auto text-center space-y-8">
              {/* Twinsk Badge */}
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-500 to-amber-500 text-white text-sm font-semibold shadow-lg shadow-red-500/25">
                <span className="flex items-center gap-1.5">
                  <Globe className="h-4 w-4" />
                  Powered by Twinsk
                </span>
                <span className="w-px h-4 bg-white/30" />
                <span>Réseau de fournisseurs chinois</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-tight">
                Vos devis envoyés,
                <span className="block bg-gradient-to-r from-red-600 to-amber-500 bg-clip-text text-transparent">
                  la Chine vous répond
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Créez vos demandes de cotation, <strong className="text-slate-800">Twinsk</strong> les transmet à son réseau de fournisseurs vérifiés en Chine et vous recevez des offres compétitives directement sur la plateforme.
              </p>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8 pt-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Factory className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">500+</p>
                    <p className="text-xs">Usines partenaires</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <BadgeCheck className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">100%</p>
                    <p className="text-xs">Fournisseurs vérifiés</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-900">Guangzhou</p>
                    <p className="text-xs">Bureau sur place</p>
                  </div>
                </div>
              </div>

              {/* Secteurs supportés */}
              <div className="flex flex-wrap justify-center gap-2 pt-4">
                {[
                  { icon: Building2, label: 'BTP' },
                  { icon: Hotel, label: 'Hôtellerie' },
                  { icon: UtensilsCrossed, label: 'Restauration' },
                  { icon: Store, label: 'Retail' },
                  { icon: HeartPulse, label: 'Médical' },
                  { icon: Package, label: 'Tous secteurs' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur border border-slate-200 text-slate-600 text-sm shadow-sm">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </span>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-white px-8 h-14 text-base font-semibold shadow-lg shadow-red-500/25 transition-all hover:shadow-red-500/40">
                    <Send className="mr-2 h-5 w-5" />
                    Envoyer ma première cotation
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 text-slate-700 hover:bg-white h-14 text-base">
                    Comment ça marche ?
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Comment Twinsk vous aide */}
        <section className="py-20 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-600/20 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 sm:px-6 relative">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-300 text-sm font-medium mb-6">
                  <Handshake className="h-4 w-4" />
                  Le réseau Twinsk à votre service
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Votre bureau d'achat en Chine
                </h2>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                  Twinsk dispose d'une équipe sur place à Guangzhou qui gère vos demandes et négocie avec les meilleurs fournisseurs.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: Send,
                    title: "1. Vous envoyez",
                    description: "Créez votre demande de cotation avec vos spécifications. Uploadez vos fichiers, photos, plans.",
                    color: "red"
                  },
                  {
                    icon: Factory,
                    title: "2. Twinsk source",
                    description: "Notre équipe en Chine contacte les usines partenaires et collecte les meilleures offres pour vous.",
                    color: "amber"
                  },
                  {
                    icon: BarChart3,
                    title: "3. Vous comparez",
                    description: "Recevez les prix directement sur la plateforme. Comparez, négociez et passez commande.",
                    color: "emerald"
                  }
                ].map((item) => (
                  <div key={item.title} className="bg-slate-800/50 backdrop-blur rounded-2xl p-8 border border-slate-700 hover:border-slate-600 transition-all group">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-${item.color}-500 to-${item.color}-600 flex items-center justify-center mb-6 shadow-lg shadow-${item.color}-500/30 group-hover:scale-110 transition-transform`}>
                      <item.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{item.description}</p>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { value: '48h', label: 'Délai moyen de réponse' },
                  { value: '30%', label: 'Économies moyennes' },
                  { value: '15+', label: 'Catégories de produits' },
                  { value: '24/7', label: 'Support disponible' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-red-400 to-amber-400 bg-clip-text text-transparent">{stat.value}</p>
                    <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section: Fonctionnalités Clés */}
        <section id="features" className="py-20 bg-slate-50">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
                  Une plateforme complète
                </h2>
                <p className="text-lg text-slate-600">
                  Tous les outils pour gérer vos achats internationaux
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Feature 1: Import IA */}
                <div className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-red-200 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/25">
                      <FileUp className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Import intelligent</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Uploadez vos listes Excel, PDF ou photos. L'IA analyse et structure automatiquement vos besoins.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-red-600 font-medium">
                        <Zap className="h-4 w-4" />
                        Extraction automatique par IA
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 2: Réseau Twinsk */}
                <div className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-amber-200 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/25">
                      <Factory className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Réseau Twinsk</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Accédez à plus de 500 usines vérifiées en Chine. Notre équipe sur place négocie pour vous.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 font-medium">
                        <BadgeCheck className="h-4 w-4" />
                        Fournisseurs certifiés
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 3: Comparaison */}
                <div className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-emerald-200 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
                      <BarChart3 className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Comparateur de prix</h3>
                      <p className="text-slate-600 leading-relaxed">
                        Comparez les offres reçues. Visualisez les économies potentielles avec les coûts d'import inclus.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600 font-medium">
                        <TrendingDown className="h-4 w-4" />
                        Jusqu'à 30% d'économies
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 4: Suivi logistique */}
                <div className="group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
                      <Truck className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">Suivi complet</h3>
                      <p className="text-slate-600 leading-relaxed">
                        De la cotation à la livraison, suivez chaque étape. Photos d'usine, contrôle qualité, expédition.
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        Traçabilité complète
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
            <div className="max-w-4xl mx-auto text-center bg-gradient-to-br from-red-600 via-red-500 to-amber-500 rounded-3xl p-10 sm:p-14 shadow-2xl relative overflow-hidden">
              {/* Decorative */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl" />
              
              <div className="relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
                  <Globe className="h-4 w-4" />
                  Twinsk • Votre partenaire en Chine
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Prêt à sourcer depuis la Chine ?
                </h2>
                <p className="text-red-100 text-lg mb-8 max-w-xl mx-auto">
                  Envoyez votre première demande de cotation et recevez des offres de fournisseurs chinois vérifiés sous 48h.
                </p>
                <Link href="/signup">
                  <Button size="lg" className="bg-white hover:bg-red-50 text-red-600 font-semibold px-10 h-14 text-base shadow-lg">
                    <Send className="mr-2 h-5 w-5" />
                    Envoyer ma cotation
                  </Button>
                </Link>
                <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mt-8 text-sm text-red-100">
                  <span className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Sans engagement
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Réponse sous 48h
                  </span>
                  <span className="flex items-center gap-2">
                    <BadgeCheck className="h-5 w-5" />
                    Fournisseurs vérifiés
                  </span>
                </div>
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
