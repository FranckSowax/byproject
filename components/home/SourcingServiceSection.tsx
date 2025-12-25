"use client";

import { CheckCircle2, ArrowRight, Users, FileCheck, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SourcingServiceSection() {
  return (
    <section id="sourcing" className="py-16 sm:py-24 bg-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100">
              <MessageSquareText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Service de Cotation Premium</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#2D3748] leading-tight">
              Confiez-nous votre liste, <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                nous trouvons les fournisseurs
              </span>
            </h2>
            
            <p className="text-lg text-[#718096] leading-relaxed">
              Ne perdez plus de temps à chercher. Importez simplement votre liste de produits ou matériaux sur By Project. Notre équipe et nos partenaires s'occupent du sourcing pour vous.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-bold text-[#2D3748]">Importez votre demande</h4>
                  <p className="text-sm text-[#718096]">Utilisez notre IA pour transformer n'importe quel PDF/Excel en demande claire.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-[#2D3748]">Réseau de Partenaires Qualifiés</h4>
                  <p className="text-sm text-[#718096]">Nous diffusons votre demande à notre réseau de fournisseurs vérifiés.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <FileCheck className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-bold text-[#2D3748]">Minimum 3 Offres Garanties</h4>
                  <p className="text-sm text-[#718096]">Recevez et comparez au moins 3 devis compétitifs directement dans votre tableau de bord.</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all">
                  Faire une demande de cotation <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative">
            {/* Abstract representation of the process */}
            <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 p-8 border border-blue-100 shadow-2xl">
              <div className="space-y-6">
                {/* Step 1: List */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-50 flex items-center gap-4 transform translate-x-0 transition-transform">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <span className="font-mono font-bold text-gray-500">1</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-2 w-32 bg-gray-100 rounded"></div>
                  </div>
                  <div className="text-xs font-medium text-blue-600 px-2 py-1 bg-blue-50 rounded">Votre Liste</div>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center">
                  <div className="h-8 w-0.5 bg-blue-200"></div>
                </div>

                {/* Step 2: Processing */}
                <div className="bg-blue-600 p-4 rounded-xl shadow-lg flex items-center justify-between gap-4 transform scale-105 z-10">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center text-white">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-white font-bold">By Project Sourcing</div>
                      <div className="text-blue-100 text-xs">Traitement & Matching</div>
                    </div>
                  </div>
                  <div className="animate-pulse flex gap-1">
                    <div className="h-2 w-2 bg-white rounded-full"></div>
                    <div className="h-2 w-2 bg-white rounded-full animation-delay-200"></div>
                    <div className="h-2 w-2 bg-white rounded-full animation-delay-400"></div>
                  </div>
                </div>

                {/* Arrow Down splitting */}
                <div className="flex justify-center h-8 relative">
                  <div className="absolute top-0 bottom-0 w-0.5 bg-blue-200"></div>
                  <div className="absolute bottom-0 w-32 h-0.5 bg-blue-200"></div>
                  <div className="absolute bottom-0 left-[calc(50%-4rem)] h-4 w-0.5 bg-blue-200"></div>
                  <div className="absolute bottom-0 right-[calc(50%-4rem)] h-4 w-0.5 bg-blue-200"></div>
                </div>

                {/* Step 3: 3 Quotes */}
                <div className="grid grid-cols-3 gap-3 pt-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white p-3 rounded-lg shadow-sm border border-green-100 flex flex-col items-center text-center gap-2 transform hover:-translate-y-1 transition-transform duration-300">
                      <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                        <span className="text-green-600 font-bold text-xs">Devis {i}</span>
                      </div>
                      <div className="w-full space-y-1">
                        <div className="h-1.5 w-full bg-gray-100 rounded"></div>
                        <div className="h-1.5 w-2/3 mx-auto bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400/20 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
