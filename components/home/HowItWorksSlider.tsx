"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Upload, Wand2, DollarSign, BarChart3, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  imagePath: string; // Chemin vers la capture d'écran
}

const steps: Step[] = [
  {
    number: 1,
    title: "Préparez votre mission en Chine",
    description: "Avant de partir : importez votre liste de matériaux ou créez-la manuellement. Organisez votre projet et identifiez vos besoins pour optimiser vos visites fournisseurs.",
    icon: <Upload className="h-8 w-8" />,
    imagePath: "/screenshots/step-1-import.png"
  },
  {
    number: 2,
    title: "Organisez vos données",
    description: "L'IA structure automatiquement vos matériaux (nom, quantité, spécifications). Préparez vos fiches techniques pour vos rendez-vous fournisseurs en Chine.",
    icon: <Wand2 className="h-8 w-8" />,
    imagePath: "/screenshots/step-2-mapping.png"
  },
  {
    number: 3,
    title: "Collectez les prix sur place",
    description: "Pendant vos visites en Chine : saisissez les prix directement depuis votre mobile. Enregistrez les coordonnées des fournisseurs, photos des produits et notes de visite.",
    icon: <DollarSign className="h-8 w-8" />,
    imagePath: "/screenshots/step-3-prices.png"
  },
  {
    number: 4,
    title: "Comparez en temps réel",
    description: "Entre deux rendez-vous : comparez instantanément les offres des différents fournisseurs. Identifiez les meilleures opportunités et négociez en connaissance de cause.",
    icon: <BarChart3 className="h-8 w-8" />,
    imagePath: "/screenshots/step-4-comparison.png"
  },
  {
    number: 5,
    title: "Partagez vos résultats",
    description: "De retour au bureau : générez des rapports complets avec prix, fournisseurs et photos. Présentez vos résultats de mission à votre équipe et prenez les bonnes décisions.",
    icon: <FileDown className="h-8 w-8" />,
    imagePath: "/screenshots/step-5-export.png"
  }
];

export function HowItWorksSlider() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToStep = (index: number) => {
    setCurrentStep(index);
    setIsAutoPlaying(false);
  };

  const nextStep = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
    setIsAutoPlaying(false);
  };

  const prevStep = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
    setIsAutoPlaying(false);
  };

  const step = steps[currentStep];

  return (
    <section className="bg-gradient-to-b from-[#F8F9FF] to-white py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#2D3748] mb-4 px-4">
            Votre assistant pour vos <span className="bg-gradient-to-r from-[#5B5FC7] to-[#FF9B7B] bg-clip-text text-transparent">missions en Chine</span>
          </h2>
          <p className="text-base sm:text-lg text-[#718096] max-w-2xl mx-auto px-4">
            De la préparation au rapport final : gérez vos visites fournisseurs comme un pro
          </p>
        </div>

        {/* Slider Container */}
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E0E4FF]">
            {/* Main Content */}
            <div className="grid lg:grid-cols-2 gap-8 p-8 sm:p-12">
              {/* Left Side - Text Content */}
              <div className="flex flex-col justify-center space-y-6">
                {/* Step Number Badge */}
                <div className="inline-flex items-center gap-3 w-fit">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#5B5FC7] to-[#7B7FE8] shadow-lg">
                    {step.icon}
                  </div>
                  <span className="text-sm font-semibold text-[#5B5FC7] bg-[#F5F6FF] px-4 py-2 rounded-full">
                    Étape {step.number} sur {steps.length}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-2xl sm:text-3xl font-bold text-[#2D3748] leading-tight">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-base sm:text-lg text-[#718096] leading-relaxed">
                  {step.description}
                </p>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-4 pt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevStep}
                    className="h-12 w-12 rounded-full border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#F5F6FF] transition-all"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextStep}
                    className="h-12 w-12 rounded-full border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#F5F6FF] transition-all"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>

                  {/* Progress Dots */}
                  <div className="flex items-center gap-2 ml-4">
                    {steps.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToStep(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentStep
                            ? "w-8 bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8]"
                            : "w-2 bg-[#E0E4FF] hover:bg-[#5B5FC7]/30"
                        }`}
                        aria-label={`Aller à l'étape ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side - Screenshot */}
              <div className="relative">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-[#F5F6FF] to-[#FFF5F2] border-2 border-[#E0E4FF] shadow-xl">
                  {/* Placeholder for screenshot */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4 p-8">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5B5FC7] to-[#7B7FE8] mx-auto shadow-lg">
                        {step.icon}
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-[#718096]">
                          Capture d'écran à venir
                        </p>
                        <p className="text-xs text-[#A0AEC0]">
                          {step.imagePath}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* When you add real screenshots, use this: */}
                  {/* <Image
                    src={step.imagePath}
                    alt={step.title}
                    fill
                    className="object-cover"
                    priority={currentStep === 0}
                  /> */}
                </div>

                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#5B5FC7] rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#FF9B7B] rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-pulse animation-delay-2000"></div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-[#E0E4FF]">
              <div
                className="h-full bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Indicators (Mobile) */}
          <div className="flex justify-center gap-3 mt-8 lg:hidden">
            {steps.map((s, index) => (
              <button
                key={index}
                onClick={() => goToStep(index)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                  index === currentStep
                    ? "bg-gradient-to-br from-[#5B5FC7]/10 to-[#7B7FE8]/10 border-2 border-[#5B5FC7]"
                    : "bg-white border border-[#E0E4FF] hover:border-[#5B5FC7]/50"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  index === currentStep
                    ? "bg-gradient-to-br from-[#5B5FC7] to-[#7B7FE8] text-white"
                    : "bg-[#F5F6FF] text-[#718096]"
                }`}>
                  {s.icon}
                </div>
                <span className={`text-xs font-medium ${
                  index === currentStep ? "text-[#5B5FC7]" : "text-[#718096]"
                }`}>
                  {s.number}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
