'use client';

import { Upload, Sparkles, GitCompare, Send } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Importez votre liste',
    description: 'Excel, PDF ou saisie manuelle',
    color: 'from-violet-500 to-purple-600',
  },
  {
    number: '02',
    icon: Sparkles,
    title: "L'IA structure",
    description: 'Catégorisation automatique',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    number: '03',
    icon: GitCompare,
    title: 'Comparez les prix',
    description: 'Local vs Import Chine',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    number: '04',
    icon: Send,
    title: 'Collectez les devis',
    description: 'Fournisseurs en ligne',
    color: 'from-orange-500 to-amber-500',
  },
];

export function HowItWorksSimple() {
  return (
    <section className="py-16 sm:py-20 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            Comment ça marche
          </h2>
          <p className="text-slate-600">
            4 étapes pour optimiser vos achats
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                {/* Connector line (hidden on mobile for first row) */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-slate-200 to-slate-100" />
                )}
                
                <div className="flex flex-col items-center text-center">
                  <div className={`relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} shadow-lg mb-4`}>
                    <Icon className="w-9 h-9 text-white" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-bold text-slate-700">
                      {step.number}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-slate-900 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
