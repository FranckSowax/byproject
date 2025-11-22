"use client";

import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Découverte",
      price: "0",
      period: "toujours",
      description: "Pour tester la puissance de l'IA et découvrir la plateforme.",
      features: [
        "1 Projet actif",
        "Import IA (limité à 3 pages/mois)",
        "Gestion basique des fournisseurs",
        "Comparateur de prix simple",
        "Support par email"
      ],
      cta: "Commencer gratuitement",
      popular: false,
      href: "/signup"
    },
    {
      name: "Professionnel",
      price: isAnnual ? "29" : "39",
      period: "mois",
      description: "Pour les entrepreneurs et acheteurs réguliers.",
      features: [
        "Projets illimités",
        "Import IA illimité (PDF, Excel, Images)",
        "Sourcing Chine & International",
        "Demandes de cotation prioritaires",
        "Export PDF & Excel personnalisés",
        "Support prioritaire 24/7"
      ],
      cta: "Essayer gratuitement",
      popular: true,
      href: "/signup?plan=pro"
    },
    {
      name: "Entreprise",
      price: "Sur devis",
      period: "",
      description: "Pour les grandes équipes et besoins spécifiques.",
      features: [
        "Tout du plan Professionnel",
        "Multi-utilisateurs & Rôles",
        "API Access",
        "Onboarding dédié",
        "Sourcing agent dédié",
        "Contrat SLA"
      ],
      cta: "Nous contacter",
      popular: false,
      href: "mailto:contact@byproject.com"
    }
  ];

  return (
    <section id="pricing" className="py-16 sm:py-24 bg-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -right-64 w-96 h-96 bg-[#5B5FC7]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -left-64 w-96 h-96 bg-[#FF9B7B]/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#2D3748] mb-4 px-4">
            Tarifs Simples et <span className="bg-gradient-to-r from-[#5B5FC7] to-[#FF9B7B] bg-clip-text text-transparent">Transparents</span>
          </h2>
          <p className="text-base sm:text-lg text-[#718096] max-w-2xl mx-auto px-4 mb-8">
            Choisissez le plan adapté à votre volume d'activité. Changez à tout moment.
          </p>

          {/* Toggle Annuel/Mensuel */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm font-medium ${!isAnnual ? 'text-[#2D3748]' : 'text-[#718096]'}`}>Mensuel</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isAnnual ? 'bg-[#5B5FC7]' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isAnnual ? 'translate-x-7' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-sm font-medium ${isAnnual ? 'text-[#2D3748]' : 'text-[#718096]'}`}>
              Annuel <span className="text-[#5B5FC7] text-xs font-bold ml-1">-25%</span>
            </span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border ${
                plan.popular 
                  ? 'border-[#5B5FC7] scale-105 z-10' 
                  : 'border-[#E0E4FF] hover:border-[#5B5FC7]/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1 shadow-lg">
                    <Sparkles className="h-3 w-3" />
                    Plus Populaire
                  </div>
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-xl font-bold text-[#2D3748] mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-[#2D3748]">
                    {plan.price === "Sur devis" ? "" : "€"}{plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-[#718096]">/{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-[#718096] leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#4A5568]">
                    <Check className={`h-5 w-5 flex-shrink-0 ${plan.popular ? 'text-[#5B5FC7]' : 'text-[#48BB78]'}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className="block">
                <Button 
                  className={`w-full py-6 text-base font-semibold shadow-md transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#5B5FC7] text-white hover:shadow-xl'
                      : 'bg-white border-2 border-[#E0E4FF] text-[#4A5568] hover:border-[#5B5FC7] hover:text-[#5B5FC7]'
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
