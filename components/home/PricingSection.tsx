"use client";

import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "0",
      currency: "$",
      period: "/ projet",
      description: "Pour structurer votre liste et organiser vos idées.",
      features: [
        "Jusqu'à 10 produits",
        "Saisie manuelle des prix",
        "Comparateur Local vs Chine",
        "Organisation par catégories",
        "Export PDF simple"
      ],
      cta: "Commencer gratuitement",
      popular: false,
      highlight: false,
      href: "/signup"
    },
    {
      name: "Projet",
      price: "15",
      currency: "$",
      period: "/ projet",
      description: "Débloquez l'illimité et obtenez un prix de référence.",
      features: [
        "Produits illimités",
        "Import Intelligent IA (PDF/Excel)",
        "1 Cotation Fournisseur incluse",
        "Calcul automatique Transport",
        "Support par email"
      ],
      cta: "Lancer un projet",
      popular: true,
      highlight: false,
      href: "/signup?plan=project"
    },
    {
      name: "Sourcing Premium",
      price: "299",
      currency: "$",
      period: "/ projet",
      description: "Nous trouvons les fournisseurs pour vous. Rentabilité garantie.",
      features: [
        "Tout du pack Projet",
        "3 Cotations Fournisseurs Garanties",
        "Négociation des prix incluse",
        "Vérification des fournisseurs",
        "Organisation logistique complète",
        "Agent de sourcing dédié"
      ],
      cta: "Commander le sourcing",
      popular: false,
      highlight: true,
      href: "/signup?plan=premium"
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
            Payez par Projet, <span className="bg-gradient-to-r from-[#5B5FC7] to-[#FF9B7B] bg-clip-text text-transparent">Pas d'Abonnement</span>
          </h2>
          <p className="text-base sm:text-lg text-[#718096] max-w-2xl mx-auto px-4 mb-8">
            Une tarification claire et sans engagement. Vous ne payez que lorsque vous avez un projet concret.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-7xl mx-auto items-start">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`relative bg-white rounded-2xl p-8 shadow-lg transition-all duration-300 border ${
                plan.highlight
                  ? 'border-[#FF9B7B] shadow-xl scale-105 z-10 ring-1 ring-[#FF9B7B]/20' 
                  : plan.popular 
                    ? 'border-[#5B5FC7] scale-100 z-0' 
                    : 'border-[#E0E4FF] hover:border-[#5B5FC7]/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-[#5B5FC7] text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                    Le plus choisi
                  </div>
                </div>
              )}
              
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-full text-center px-4">
                  <div className="bg-gradient-to-r from-[#FF9B7B] to-[#FF6B6B] text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg inline-flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    Rentabilité Maximale
                  </div>
                </div>
              )}

              <div className="mb-8 pt-2">
                <h3 className="text-xl font-bold text-[#2D3748] mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-[#2D3748]">
                    {plan.price}{plan.currency}
                  </span>
                  {plan.period && (
                    <span className="text-[#718096]">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-[#718096] leading-relaxed min-h-[40px]">
                  {plan.description}
                </p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#4A5568]">
                    <Check className={`h-5 w-5 flex-shrink-0 ${plan.highlight ? 'text-[#FF9B7B]' : 'text-[#5B5FC7]'}`} />
                    <span className="font-medium">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className="block">
                <Button 
                  className={`w-full py-6 text-base font-semibold shadow-md transition-all ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-[#FF9B7B] to-[#FF6B6B] hover:from-[#FF8B5B] hover:to-[#FF5B5B] text-white hover:shadow-xl'
                      : plan.popular
                        ? 'bg-[#5B5FC7] hover:bg-[#4A4DA6] text-white hover:shadow-xl'
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
