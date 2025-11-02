"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FolderOpen, Calendar } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Project {
  id: string;
  name: string;
  created_at: string;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Si pas d'utilisateur Supabase, vérifier le mock user
        const mockUser = localStorage.getItem("mockUser");
        if (mockUser) {
          // Pour le mock user, on affiche un projet vide
          setProjects([]);
        }
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('projects')
        .select('id, name, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading projects:", error);
      } else {
        setProjects((data as unknown as Project[]) || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F9FF] to-[#E8EEFF] p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header avec style moderne */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] bg-clip-text text-transparent">
              Projets
            </h1>
            <p className="text-[#718096] mt-2">
              Gérez vos projets de comparaison de matériaux de construction
            </p>
          </div>
          <Link href="/dashboard/projects/new">
            <Button className="gap-2 bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#6B6FD7] text-white shadow-lg shadow-[#5B5FC7]/30 rounded-xl px-6 py-6 transition-all hover:scale-105">
              <Plus className="h-5 w-5" />
              Nouveau Projet
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gradient-to-br from-[#5B5FC7]/10 to-[#FF9B7B]/10 rounded-2xl flex items-center justify-center mb-6">
                <FolderOpen className="h-10 w-10 text-[#5B5FC7]" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-[#4A5568]">
                Aucun projet pour le moment
              </h3>
              <p className="mb-8 text-center text-[#718096] max-w-md">
                Commencez par créer votre premier projet de comparaison
              </p>
              <Link href="/dashboard/projects/new">
                <Button className="gap-2 bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] hover:from-[#4A4DA6] hover:to-[#6B6FD7] text-white shadow-lg shadow-[#5B5FC7]/30 rounded-xl px-8 py-6 text-lg transition-all hover:scale-105">
                  <Plus className="h-5 w-5" />
                  Créer un Projet
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="group border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden hover:scale-105"
              >
                <div className="h-2 bg-gradient-to-r from-[#5B5FC7] to-[#FF9B7B]" />
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold text-[#4A5568] group-hover:text-[#5B5FC7] transition-colors">
                    {project.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-[#718096]">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#5B5FC7]/10 to-[#FF9B7B]/10 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-[#5B5FC7]" />
                    </div>
                    {new Date(project.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <Button 
                      variant="outline" 
                      className="w-full border-2 border-[#E0E4FF] hover:border-[#5B5FC7] hover:bg-[#5B5FC7] hover:text-white text-[#5B5FC7] font-semibold rounded-xl py-6 transition-all"
                    >
                      Ouvrir le Projet
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
