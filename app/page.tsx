import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, FileText, Globe, Zap } from "lucide-react";

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">CompaChantier</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/admin-login">
              <Button variant="ghost" size="sm" className="text-xs">
                🔐 Admin Test
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="mx-auto max-w-3xl space-y-8">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Compare Construction Equipment Prices{" "}
              <span className="text-blue-600">Across Countries</span>
            </h1>
            <p className="text-xl text-gray-600">
              AI-powered platform to compare material prices between Gabon and China. 
              Upload your lists, get instant analysis, and make informed purchasing decisions.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Start Free Trial <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-white py-20">
          <div className="container mx-auto px-4">
            <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
              Powerful Features for Smart Procurement
            </h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold">AI-Powered Mapping</h3>
                <p className="text-gray-600">
                  Upload PDF, CSV, or Excel files. GPT-4o automatically detects and maps your columns.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <Globe className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold">Multi-Currency Support</h3>
                <p className="text-gray-600">
                  Compare prices in CFA and RMB with manual exchange rate control.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                  <BarChart3 className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-semibold">Real-Time Comparison</h3>
                <p className="text-gray-600">
                  Live comparison tables with filtering, sorting, and instant price updates.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold">Professional Reports</h3>
                <p className="text-gray-600">
                  Export beautiful PDF and Excel reports with your branding.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <div className="mx-auto max-w-2xl space-y-6 rounded-2xl bg-blue-600 p-12 text-white">
              <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
              <p className="text-lg text-blue-100">
                Join teams making smarter procurement decisions with CompaChantier.
              </p>
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="gap-2">
                  Create Free Account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>&copy; 2025 CompaChantier. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
