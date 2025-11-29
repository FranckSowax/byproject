'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Hotel, 
  UtensilsCrossed, 
  Store, 
  Briefcase, 
  HeartPulse, 
  PartyPopper, 
  Package,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sectors = [
  {
    slug: 'construction',
    name: 'Construction & BTP',
    icon: Building2,
    color: '#f59e0b',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    hoverBorder: 'hover:border-amber-400',
    iconBg: 'bg-amber-500',
  },
  {
    slug: 'hotellerie',
    name: 'Hôtellerie',
    icon: Hotel,
    color: '#8b5cf6',
    bgColor: 'bg-violet-50',
    borderColor: 'border-violet-200',
    hoverBorder: 'hover:border-violet-400',
    iconBg: 'bg-violet-500',
  },
  {
    slug: 'restauration',
    name: 'Restauration',
    icon: UtensilsCrossed,
    color: '#ef4444',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    hoverBorder: 'hover:border-red-400',
    iconBg: 'bg-red-500',
  },
  {
    slug: 'retail',
    name: 'Commerce & Retail',
    icon: Store,
    color: '#10b981',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    hoverBorder: 'hover:border-emerald-400',
    iconBg: 'bg-emerald-500',
  },
  {
    slug: 'bureau',
    name: 'Mobilier Bureau',
    icon: Briefcase,
    color: '#3b82f6',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    hoverBorder: 'hover:border-blue-400',
    iconBg: 'bg-blue-500',
  },
  {
    slug: 'medical',
    name: 'Médical & Santé',
    icon: HeartPulse,
    color: '#06b6d4',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    hoverBorder: 'hover:border-cyan-400',
    iconBg: 'bg-cyan-500',
  },
  {
    slug: 'evenementiel',
    name: 'Événementiel',
    icon: PartyPopper,
    color: '#ec4899',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    hoverBorder: 'hover:border-pink-400',
    iconBg: 'bg-pink-500',
  },
  {
    slug: 'autre',
    name: 'Autre Secteur',
    icon: Package,
    color: '#6b7280',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    hoverBorder: 'hover:border-gray-400',
    iconBg: 'bg-gray-500',
  },
];

export function SectorGrid() {
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
            Quel est votre secteur ?
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            Sélectionnez votre domaine pour démarrer un projet adapté
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {sectors.map((sector) => {
            const Icon = sector.icon;
            const isHovered = hoveredSector === sector.slug;
            
            return (
              <Link
                key={sector.slug}
                href={`/dashboard/projects/new?sector=${sector.slug}`}
                className={cn(
                  'group relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300',
                  sector.bgColor,
                  sector.borderColor,
                  sector.hoverBorder,
                  'hover:shadow-lg hover:-translate-y-1'
                )}
                onMouseEnter={() => setHoveredSector(sector.slug)}
                onMouseLeave={() => setHoveredSector(null)}
              >
                <div className={cn(
                  'flex items-center justify-center w-14 h-14 rounded-xl mb-4 transition-transform duration-300',
                  sector.iconBg,
                  'group-hover:scale-110'
                )}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                
                <span className="text-sm font-semibold text-slate-800 text-center leading-tight">
                  {sector.name}
                </span>

                <div className={cn(
                  'absolute bottom-3 right-3 opacity-0 transition-opacity duration-300',
                  isHovered && 'opacity-100'
                )}>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
