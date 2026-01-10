'use client';

import { Upload, Send, GitCompare, Bell, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Importez vos besoins',
    description: 'Liste Excel, PDF ou saisie manuelle',
    detail: "L'IA structure automatiquement vos materiaux",
    color: 'from-violet-500 to-purple-600',
  },
  {
    number: '02',
    icon: Send,
    title: 'Demandez des cotations',
    description: 'En un clic depuis votre projet',
    detail: 'Notre equipe sollicite les fournisseurs',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    number: '03',
    icon: Bell,
    title: 'Recevez les prix',
    description: 'Notification automatique',
    detail: 'Prix convertis et comparables',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    number: '04',
    icon: GitCompare,
    title: 'Comparez et decidez',
    description: 'Local vs Import Chine',
    detail: 'Identifiez les meilleures opportunites',
    color: 'from-orange-500 to-amber-500',
  },
];

export function HowItWorksSimple() {
  return (
    <section className="py-16 sm:py-24 bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-3">
            Cotation en ligne, simplifiee
          </h2>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            De la demande aux prix, tout est automatise et centralise
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                {/* Connector line (desktop only) */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-slate-300 to-slate-200" />
                )}

                <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className={`relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} shadow-lg mb-5`}>
                    <Icon className="w-9 h-9 text-white" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-bold text-slate-700">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="font-semibold text-slate-900 mb-1 text-lg">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-2">
                    {step.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    {step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Process summary */}
        <div className="mt-12 max-w-3xl mx-auto bg-white rounded-2xl p-6 sm:p-8 border border-slate-100 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="font-semibold text-slate-900 text-lg mb-1">
                Processus 100% transparent
              </h4>
              <p className="text-slate-600 text-sm">
                Vous gardez le controle. Chaque fournisseur est identifie par une reference unique.
                Les prix sont convertis automatiquement en FCFA pour faciliter la comparaison.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
