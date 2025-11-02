import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Zap, Globe, TrendingUp, FileText, Shield, Sparkles, Ship, Package } from "lucide-react";
import Image from "next/image";

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-[#F8F9FF] via-[#E8EEFF] to-white">
      {/* Header */}
      <header className="border-b border-[#E0E4FF] bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
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
          <nav className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-[#4A5568] hover:text-[#5B5FC7] hover:bg-[#F5F6FF]">
                Connexion
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#5B5FC7] text-white shadow-lg hover:shadow-xl transition-all">
                Commencer <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-6 py-24 text-center relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#5B5FC7] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-[#FF9B7B] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-[#7BFFA8] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
          
          <div className="relative mx-auto max-w-4xl space-y-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#F5F6FF] to-[#FFF5F2] border border-[#E0E4FF]">
              <Sparkles className="h-4 w-4 text-[#5B5FC7]" />
              <span className="text-sm font-medium text-[#4A5568]">Plateforme d'organisation et de comparaison</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight px-4">
              <span className="text-[#2D3748]">Optimisez le budget </span>
              <span className="bg-gradient-to-r from-[#5B5FC7] via-[#7B7FE8] to-[#FF9B7B] bg-clip-text text-transparent">
                de votre projet en Chine
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-[#718096] max-w-3xl mx-auto leading-relaxed px-4">
              Plateforme pour organiser et comparer vos prix de matériaux entre le Gabon et la Chine. 
              Importez vos listes, saisissez vos prix, et visualisez les meilleures opportunités d'achat.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6 px-4">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#5B5FC7] text-white shadow-xl hover:shadow-2xl transition-all px-8 py-6 text-base sm:text-lg">
                  Commencer <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-8 text-xs sm:text-sm text-[#718096] px-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-[#48BB78]" />
                <span className="whitespace-nowrap">Sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-[#5B5FC7]" />
                <span className="whitespace-nowrap">IA Avancée</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-[#FF9B7B]" />
                <span className="whitespace-nowrap">Rapide</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gradient-to-b from-white to-[#F8F9FF] py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#2D3748] mb-4 px-4">
                Fonctionnalités <span className="bg-gradient-to-r from-[#5B5FC7] to-[#FF9B7B] bg-clip-text text-transparent">Puissantes</span>
              </h2>
              <p className="text-base sm:text-lg text-[#718096] max-w-2xl mx-auto px-4">
                Tous les outils dont vous avez besoin pour optimiser vos achats
              </p>
            </div>
            
            <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#E0E4FF] hover:border-[#5B5FC7]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#5B5FC7]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#5B5FC7] to-[#7B7FE8] mb-6 shadow-lg">
                    <Zap className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2D3748] mb-3">Import Intelligent</h3>
                  <p className="text-[#718096] leading-relaxed">
                    Importez PDF, CSV ou Excel. L'IA détecte vos colonnes, vous saisissez les prix manuellement.
                  </p>
                </div>
              </div>
              
              <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#E0E4FF] hover:border-[#FF9B7B]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#FF9B7B]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9B7B] to-[#FFB599] mb-6 shadow-lg">
                    <Globe className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2D3748] mb-3">Multi-Devises</h3>
                  <p className="text-[#718096] leading-relaxed">
                    Comparez les prix en CFA et RMB avec contrôle manuel du taux de change.
                  </p>
                </div>
              </div>
              
              <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#E0E4FF] hover:border-[#6B8AFF]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#6B8AFF]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#6B8AFF] to-[#9B7BFF] mb-6 shadow-lg">
                    <BarChart3 className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2D3748] mb-3">Comparaison Temps Réel</h3>
                  <p className="text-[#718096] leading-relaxed">
                    Tableaux de comparaison avec filtrage, tri et mises à jour instantanées.
                  </p>
                </div>
              </div>
              
              <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-[#E0E4FF] hover:border-[#7BFFA8]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#7BFFA8]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#48BB78] to-[#7BFFA8] mb-6 shadow-lg">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-[#2D3748] mb-3">Rapports Professionnels</h3>
                  <p className="text-[#718096] leading-relaxed">
                    Exportez de beaux rapports PDF et Excel avec votre image de marque.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

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
                    Prêt à optimiser le budget de votre projet ?
                  </h2>
                  
                  <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed px-4">
                    Rejoignez les équipes qui prennent des décisions d'achat plus intelligentes avec CompaChantier.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 px-4">
                    <Link href="/login" className="w-full sm:w-auto">
                      <Button size="lg" className="w-full sm:w-auto bg-white text-[#5B5FC7] hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all px-8 py-6 text-base sm:text-lg font-semibold">
                        Commencer Maintenant <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-6 text-xs sm:text-sm text-white/80 px-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="whitespace-nowrap">Sans carte bancaire</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="whitespace-nowrap">Configuration en 2 minutes</span>
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
