"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Construction, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export function ComingSoon({ title, description, icon: Icon = Construction }: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          {Icon && <Icon className="h-8 w-8 text-blue-600" />}
          {title}
        </h1>
        <p className="text-slate-600 mt-1">{description}</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="py-24">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Construction className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Page en construction
            </h2>
            <p className="text-slate-600 mb-6">
              Cette fonctionnalité est en cours de développement et sera bientôt disponible.
            </p>
            <Link href="/admin">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour au Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
