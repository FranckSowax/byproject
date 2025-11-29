'use client';

import { Zap, Users, BarChart3, FileText, Globe, Shield } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Import IA',
    description: 'PDF, Excel, images analysés automatiquement',
  },
  {
    icon: Users,
    title: 'Multi-Fournisseurs',
    description: 'Centralisez tous vos contacts et prix',
  },
  {
    icon: BarChart3,
    title: 'Comparateur',
    description: 'Simulez transport et douane inclus',
  },
  {
    icon: FileText,
    title: 'Devis en ligne',
    description: 'Liens publics pour vos fournisseurs',
  },
  {
    icon: Globe,
    title: 'Multi-devises',
    description: 'EUR, USD, CNY, XAF convertis',
  },
  {
    icon: Shield,
    title: 'Sécurisé',
    description: 'Données chiffrées et privées',
  },
];

export function FeaturesCompact() {
  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Des outils puissants pour simplifier votre sourcing
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
