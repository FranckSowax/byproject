import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Zap, Globe, TrendingUp, FileText, Shield, Sparkles, Ship, Package, Home as HomeIcon, DollarSign, Briefcase, LogIn, UserPlus, CheckCircle2, Bot } from "lucide-react";
import Image from "next/image";
import { HowItWorksSlider } from "@/components/home/HowItWorksSlider";
import { TemplatesMarketplaceSection } from "@/components/home/TemplatesMarketplaceSection";
import { PricingSection } from "@/components/home/PricingSection";
import { UserJourneySection } from "@/components/home/UserJourneySection";

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#F8F9FF] via-[#E8EEFF] to-white">
      {/* Header - Navigation Moderne */}
      <header className="border-b border-[#E0E4FF] bg-white/95 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Image 
                src="/logo-byproject.png" 
                alt="By Project" 
                width={180} 
                height={60}
                className="h-12 w-auto"
                priority
              />
            </Link>

            {/* Navigation Links (Desktop) */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/services" className="text-sm font-medium text-[#4A5568] hover:text-[#5B5FC7] transition-colors">
                Services Twinsk
              </Link>
              <Link href="#templates" className="text-sm font-medium text-[#4A5568] hover:text-[#5B5FC7] transition-colors">
                Modèles
              </Link>
              <Link href="#features" className="text-sm font-medium text-[#4A5568] hover:text-[#5B5FC7] transition-colors">
                Fonctionnalités
              </Link>
              <Link href="#pricing" className="text-sm font-medium text-[#4A5568] hover:text-[#5B5FC7] transition-colors">
                Tarifs
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" className="gap-2 text-[#4A5568] hover:text-[#5B5FC7] hover:bg-[#F5F6FF] font-medium">
                  <LogIn className="h-4 w-4" />
                  Connexion
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="gap-2 bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#5B5FC7] shadow-lg hover:shadow-xl transition-all">
                  <UserPlus className="h-4 w-4 text-white" />
                  <span className="hidden sm:inline text-white">S'inscrire</span>
                  <span className="sm:hidden text-white">Inscription</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-6 py-24 text-center relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#5B5FC7] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-[#FF9B7B] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          
          <div className="relative mx-auto max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#F5F6FF] to-[#FFF5F2] border border-[#E0E4FF]">
              <Sparkles className="h-4 w-4 text-[#5B5FC7]" />
              <span className="text-sm font-medium text-[#4A5568]">Sourcing BTP & Industrie International</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight px-4 text-[#2D3748]">
              Votre Sourcing, <br />
              <span className="bg-gradient-to-r from-[#5B5FC7] via-[#7B7FE8] to-[#FF9B7B] bg-clip-text text-transparent">
                Sans Frontières
              </span>
            </h1>
            
            <p className="text-xl text-[#718096] max-w-2xl mx-auto leading-relaxed px-4">
              Gérez vos projets, comparez les prix locaux vs import, et sécurisez vos achats en Chine.
              <br/>Que vous soyez au bureau ou sur le terrain.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 px-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#5B5FC7] shadow-xl hover:shadow-2xl transition-all px-8 py-6 text-lg">
                  <span className="text-white">Commencer Gratuitement</span> <ArrowRight className="ml-2 h-5 w-5 text-white" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* User Journey Section (New Logic) */}
        <UserJourneySection />

        {/* How It Works Slider */}
        <div id="how-it-works">
          <HowItWorksSlider />
        </div>

        {/* Templates Marketplace Section (Simplified) */}
        <TemplatesMarketplaceSection />

        {/* Features Section */}
        <section id="features" className="bg-gradient-to-b from-white to-[#F8F9FF] py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#2D3748] mb-4 px-4">
                Fonctionnalités <span className="bg-gradient-to-r from-[#5B5FC7] to-[#FF9B7B] bg-clip-text text-transparent">Puissantes</span>
              </h2>
              <p className="text-base sm:text-lg text-[#718096] max-w-2xl mx-auto px-4">
                Tous les outils dont vous avez besoin pour optimiser vos achats et votre logistique
              </p>
            </div>
            
            <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#E0E4FF] hover:border-[#5B5FC7]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#5B5FC7]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#5B5FC7] to-[#7B7FE8] mb-6 shadow-lg">
                    <Zap className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2D3748] mb-3">Import Intelligent IA</h3>
                  <p className="text-[#718096] leading-relaxed">
                    Importez n'importe quelle liste (PDF, Excel, Image). L'IA extrait et structure automatiquement vos produits, matériaux ou équipements.
                  </p>
                </div>
              </div>
              
              <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#E0E4FF] hover:border-[#FF9B7B]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF9B7B]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9B7B] to-[#FFB599] mb-6 shadow-lg">
                    <Package className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2D3748] mb-3">Gestion Multi-Fournisseurs</h3>
                  <p className="text-[#718096] leading-relaxed">
                    Centralisez les prix de tous vos fournisseurs. Comparez les offres, gérez les contacts et suivez l'évolution des coûts.
                  </p>
                </div>
              </div>
              
              <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#E0E4FF] hover:border-[#6B8AFF]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6B8AFF]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#6B8AFF] to-[#9B7BFF] mb-6 shadow-lg">
                    <BarChart3 className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2D3748] mb-3">Comparateur & Simulation</h3>
                  <p className="text-[#718096] leading-relaxed">
                    Simulez vos coûts d'importation (transport, douane). Comparez l'achat local vs international pour maximiser vos marges.
                  </p>
                </div>
              </div>
              
              <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#E0E4FF] hover:border-[#7BFFA8]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#7BFFA8]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#48BB78] to-[#7BFFA8] mb-6 shadow-lg">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2D3748] mb-3">Sourcing Simplifié</h3>
                  <p className="text-[#718096] leading-relaxed">
                    Générez des liens de cotation publics. Vos fournisseurs remplissent leurs prix directement en ligne. Plus d'emails perdus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Délégations & Missions */}
        <section className="py-16 sm:py-24 bg-slate-900 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
              <div className="lg:w-1/2 space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-200">Solution Délégations & Grands Projets</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
                  Organisez vos Missions Officielles <br />
                  <span className="text-blue-400">En toute sérénité</span>
                </h2>
                
                <p className="text-lg text-slate-300 leading-relaxed">
                  Une solution clé en main pour les délégations d'État et missions d'entreprise.
                  Planifiez vos visites d'usines, gérez la logistique VIP et structurez vos projets grâce à notre assistant IA.
                </p>
                
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-slate-300">
                    <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                      <CheckCircle2 className="h-3 w-3 text-blue-400" />
                    </div>
                    <span>Planification intelligente des visites d'usines (Factory Tour)</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                      <CheckCircle2 className="h-3 w-3 text-blue-400" />
                    </div>
                    <span>Gestion logistique complète (Hôtels, Transferts VIP)</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-300">
                    <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                      <CheckCircle2 className="h-3 w-3 text-blue-400" />
                    </div>
                    <span>Assistant IA pour la structuration du projet</span>
                  </li>
                </ul>
                
                <div className="pt-4">
                  <Link href="/delegations/new">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white border-none shadow-lg shadow-blue-900/20">
                      <Sparkles className="mr-2 h-5 w-5" />
                      Configurer une Mission
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="lg:w-1/2 relative">
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-slate-800/50 backdrop-blur-sm p-1">
                   {/* Abstract Representation of the Dashboard */}
                   <div className="aspect-video bg-slate-900 rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                        </div>
                        <div className="h-2 w-20 bg-slate-800 rounded-full"></div>
                      </div>
                      <div className="flex gap-4">
                        <div className="w-1/3 space-y-3">
                           <div className="h-24 bg-blue-500/10 rounded-lg border border-blue-500/20 animate-pulse"></div>
                           <div className="h-24 bg-slate-800 rounded-lg border border-slate-700"></div>
                        </div>
                        <div className="w-2/3 space-y-3">
                           <div className="h-8 bg-slate-800 rounded-lg w-3/4"></div>
                           <div className="h-32 bg-slate-800 rounded-lg border border-slate-700"></div>
                           <div className="flex gap-3">
                              <div className="h-10 w-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
                                <Bot className="h-5 w-5 text-blue-400" />
                              </div>
                              <div className="flex-1 h-10 bg-slate-800 rounded-lg"></div>
                           </div>
                        </div>
                      </div>
                      {/* Overlay Badge */}
                      <div className="absolute bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium">
                        <Sparkles className="h-4 w-4" />
                        IA Active
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <PricingSection />

        {/* CTA Section */}
        <section className="py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5B5FC7] via-[#7B7FE8] to-[#FF9B7B] opacity-5"></div>
          <div className="container mx-auto px-4 sm:px-6 text-center relative">
            <div className="mx-auto max-w-4xl">
              <div className="relative bg-gradient-to-br from-[#5B5FC7] to-[#7B7FE8] rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 shadow-2xl overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
                
                <div className="relative space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm">
                    <Sparkles className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium text-white">Commencez gratuitement</span>
                  </div>
                  
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white px-4">
                    Prêt à optimiser vos achats ?
                  </h2>
                  
                  <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed px-4">
                    Rejoignez les professionnels qui gagnent du temps et de l'argent avec By Project.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 px-4">
                    <Link href="/signup" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto bg-white hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all px-8 py-6 text-base sm:text-lg font-semibold">
                        <span className="text-[#5B5FC7]">Créer un compte gratuit</span> <ArrowRight className="ml-2 h-5 w-5 text-[#5B5FC7]" />
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-6 text-xs sm:text-sm text-white/80 px-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="whitespace-nowrap">Sans engagement</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="whitespace-nowrap">Accès immédiat</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>


      {/* Footer */}
      <footer className="border-t border-[#E0E4FF] bg-gradient-to-b from-white to-[#F8F9FF] py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Image 
                src="/logo-byproject.png" 
                alt="By Project" 
                width={150} 
                height={50}
                className="h-10 w-auto"
              />
            </Link>
            
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-[#718096]">
              <Link href="/login" className="hover:text-[#5B5FC7] transition-colors whitespace-nowrap">
                Connexion
              </Link>
              <span className="text-[#E0E4FF] hidden sm:inline">|</span>
              <span className="whitespace-nowrap">&copy; 2025 By Project</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
