"use client";

import { Building2, Globe2, Lock, ShieldCheck, LayoutTemplate, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EnterpriseWhiteLabelSection() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-[#1a1f2c] to-[#2d3748] text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 mb-6 backdrop-blur-sm">
            <Building2 className="h-4 w-4 text-blue-300" />
            <span className="text-sm font-medium text-blue-100">Solution Entreprise & Gouvernement</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Votre Plateforme de Pilotage <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-purple-300">
              en Marque Blanche
            </span>
          </h2>
          
          <p className="text-lg text-gray-300 leading-relaxed">
            Pour les agences d'état, délégations et grandes entreprises. Déployez votre propre environnement sécurisé pour préparer et piloter vos projets structurels en Chine.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors duration-300">
            <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
              <LayoutTemplate className="h-6 w-6 text-blue-300" />
            </div>
            <h3 className="text-xl font-bold mb-3">Interface Personnalisée</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Une plateforme à vos couleurs. Vos équipes, de la direction aux acheteurs en mission, travaillent dans un environnement familier et professionnel.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors duration-300">
            <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
              <Activity className="h-6 w-6 text-purple-300" />
            </div>
            <h3 className="text-xl font-bold mb-3">Pilotage de A à Z</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Suivez l'avancement de chaque projet en temps réel : définition des besoins, sourcing, validation des échantillons, production et logistique.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors duration-300">
            <div className="h-12 w-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
              <Lock className="h-6 w-6 text-green-300" />
            </div>
            <h3 className="text-xl font-bold mb-3">Sécurité & Contrôle</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Données hébergées sur serveurs dédiés possibles. Gestion fine des rôles et permissions pour vos différentes équipes et départements.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
          <Link href="mailto:contact@byproject.com">
            <Button size="lg" className="bg-white text-[#1a1f2c] hover:bg-gray-100 font-semibold px-8 h-14 text-lg">
              Contacter le Service Entreprise
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <ShieldCheck className="h-4 w-4" />
            <span>Déploiement sur mesure</span>
          </div>
        </div>
      </div>
    </section>
  );
}
