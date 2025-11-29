import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Shield, Sparkles, CheckCircle2, Bot, LogIn, UserPlus } from "lucide-react";
import Image from "next/image";
import { SectorGrid } from "@/components/home/SectorGrid";
import { HowItWorksSimple } from "@/components/home/HowItWorksSimple";
import { FeaturesCompact } from "@/components/home/FeaturesCompact";
import { PricingSection } from "@/components/home/PricingSection";

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header - Navigation Épurée */}
      <header className="border-b border-slate-100 bg-white/95 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
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

            {/* Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#sectors" className="text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                Secteurs
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

            {/* Auth Buttons */}
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
        {/* Hero Section - Épuré */}
        <section className="relative overflow-hidden">
          {/* Subtle background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-violet-50/50 to-white pointer-events-none" />
          
          <div className="container mx-auto px-4 sm:px-6 py-16 sm:py-24 relative">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-medium">
                <Sparkles className="h-3.5 w-3.5" />
                Plateforme de Sourcing International
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
                Sourcez vos projets
                <span className="block bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  depuis la Chine
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
                Importez votre liste, comparez les prix et collectez les devis de fournisseurs chinois. Quel que soit votre secteur.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white px-8">
                    Démarrer gratuitement
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-200 text-slate-700 hover:bg-slate-50">
                    Voir comment ça marche
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Sector Selection Grid */}
        <div id="sectors">
          <SectorGrid />
        </div>

        {/* How It Works - Simple */}
        <div id="how-it-works">
          <HowItWorksSimple />
        </div>

        {/* Features - Compact */}
        <div id="features">
          <FeaturesCompact />
        </div>

        {/* Section Délégations - Condensée */}
        <section className="py-16 sm:py-20 bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 sm:px-6 relative">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
                {/* Content */}
                <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium">
                    <Globe className="h-3.5 w-3.5" />
                    Délégations & Missions
                  </div>
                  
                  <h2 className="text-3xl sm:text-4xl font-bold text-white">
                    Missions officielles
                    <span className="block text-blue-400">clé en main</span>
                  </h2>
                  
                  <p className="text-slate-300">
                    Organisez vos visites d'usines, gérez la logistique VIP et structurez vos projets avec notre assistant IA.
                  </p>
                  
                  <ul className="space-y-3 text-left">
                    {['Planification Factory Tours', 'Logistique VIP complète', 'Assistant IA intégré'].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/delegations/new">
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white">
                      <Bot className="mr-2 h-4 w-4" />
                      Configurer une mission
                    </Button>
                  </Link>
                </div>
                
                {/* Visual */}
                <div className="lg:w-1/2">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-800/50 p-1">
                    <div className="aspect-[4/3] bg-slate-900 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                      </div>
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div className="col-span-1 space-y-2">
                          <div className="h-16 bg-blue-500/10 rounded-lg border border-blue-500/20" />
                          <div className="h-16 bg-slate-800 rounded-lg" />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <div className="h-6 bg-slate-800 rounded w-2/3" />
                          <div className="h-20 bg-slate-800 rounded-lg" />
                          <div className="flex gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-600/30 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-blue-400" />
                            </div>
                            <div className="flex-1 h-8 bg-slate-800 rounded" />
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

        {/* CTA Section - Épuré */}
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-8 sm:p-12 shadow-xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Prêt à optimiser vos achats ?
              </h2>
              <p className="text-violet-100 mb-8">
                Rejoignez les professionnels qui sourcent efficacement avec By Project.
              </p>
              <Link href="/signup">
                <Button size="lg" className="bg-white hover:bg-violet-50 text-violet-700 font-semibold px-8">
                  Créer un compte gratuit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-6 mt-6 text-sm text-violet-200">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />
                  Sans engagement
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Accès immédiat
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-slate-100 py-8">
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
