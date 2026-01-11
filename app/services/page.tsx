import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plane, Calculator, Contact, FileCheck, Shield, Users, Building2, Globe } from "lucide-react";
import Image from "next/image";

export const dynamic = 'force-dynamic';

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
             <Image
                src="/logo-byproject.png"
                alt="By Project"
                width={225}
                height={75}
                className="h-[60px] w-auto"
              />
          </Link>
          <Link href="/">
            <Button variant="ghost">Retour à l'accueil</Button>
          </Link>
        </div>
      </header>

      {/* Hero Services */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600/10"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-medium mb-6">
            <Building2 className="h-4 w-4" />
            <span>Twinsk by Project</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Votre Partenaire <span className="text-blue-400">Terrain & Logistique</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Que vous soyez à distance ou en déplacement en Chine, Twinsk agit comme votre tiers de confiance pour sécuriser vos achats et optimiser vos missions.
          </p>
        </div>
      </section>

      {/* Service 1: Sourcing Digital (Stay at home) */}
      <section className="py-20 border-b border-gray-100">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Calculator className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Sourcing & Cotation à Distance</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Vous ne souhaitez pas vous déplacer ? Importez simplement vos plans ou listes de matériaux (Architecte, Ingénieur).
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-1 text-green-500" />
                  <span><strong>Fournisseur Tampon :</strong> Nous agissons comme intermédiaire unique.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-1 text-green-500" />
                  <span><strong>Cotations Certifiées :</strong> Prix incluant transport et douane.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-1 text-green-500" />
                  <span><strong>Comparateur :</strong> Analysez l'économie réalisée par rapport à l'achat local.</span>
                </li>
              </ul>
              <Link href="/signup?service=quote">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Demander une cotation
                </Button>
              </Link>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <Image 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
                alt="Digital Sourcing"
                width={600}
                height={400}
                className="rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Service 2: Accompagnement Mission (Travel) */}
      <section className="py-20 bg-slate-50 border-b border-gray-100">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 bg-white p-8 rounded-2xl border border-gray-100">
              <Image 
                src="https://images.unsplash.com/photo-1512353087810-25dfcd100962?auto=format&fit=crop&w=800&q=80"
                alt="Business Trip China"
                width={600}
                height={400}
                className="rounded-lg shadow-md"
              />
            </div>
            <div className="order-1 md:order-2">
              <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Plane className="h-6 w-6 text-orange-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Accompagnement Mission Chine</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Vous préparez un déplacement, une délégation ou une mission pour une agence d'État ? Ne partez pas à l'aveugle.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-1 text-green-500" />
                  <span><strong>Préparation en Amont :</strong> Identification des usines à visiter avant le départ.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-1 text-green-500" />
                  <span><strong>Assistant Personnel :</strong> Un expert Twinsk vous accompagne sur place.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-1 text-green-500" />
                  <span><strong>Comparateur Live :</strong> Vérifiez sur place si les prix proposés sont compétitifs.</span>
                </li>
              </ul>
              <Link href="/signup?service=mission">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white">
                  Organiser ma mission
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Service 3: Achat Contacts */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Contact className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Accès Réseau Fournisseurs</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Vous préférez gérer vos achats en direct ? Profitez de notre travail de qualification.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-1 text-green-500" />
                  <span><strong>Contacts Vérifiés :</strong> Coordonnées directes de fournisseurs audités.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-1 text-green-500" />
                  <span><strong>Par Secteur :</strong> BTP, Industrie, Second œuvre.</span>
                </li>
              </ul>
              <Link href="/signup?service=contacts">
                <Button size="lg" variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                  Acheter des contacts
                </Button>
              </Link>
            </div>
            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
              <Image 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80"
                alt="Business Network"
                width={600}
                height={400}
                className="rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg 
      className={`h-5 w-5 flex-shrink-0 ${className}`} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
