"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FolderOpen, Settings, Briefcase, LogOut, User, FileText, Globe } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      } else {
        // Check for mock user
        const mockUserStr = localStorage.getItem('mockUser');
        if (mockUserStr) {
          const mockUser = JSON.parse(mockUserStr);
          setUserEmail(mockUser.email || 'admin@compachantier.com');
        }
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Déconnexion réussie");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    }
  };

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/');
  };

  return (
    <header className="border-b border-[#E0E4FF] bg-white/95 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <Image 
              src="/logo-byproject.png" 
              alt="By Project" 
              width={150} 
              height={50}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/dashboard">
              <Button 
                variant="ghost" 
                className={`gap-2 font-medium transition-colors ${
                  isActive('/dashboard') && !pathname.includes('/projects/') && !pathname.includes('/templates')
                    ? 'text-[#5B5FC7] bg-[#F5F6FF]' 
                    : 'text-[#4A5568] hover:text-[#5B5FC7] hover:bg-[#F5F6FF]'
                }`}
              >
                <FolderOpen className="h-4 w-4" />
                Projets
              </Button>
            </Link>
            <Link href="/dashboard/templates">
              <Button 
                variant="ghost" 
                className={`gap-2 font-medium transition-colors ${
                  isActive('/dashboard/templates')
                    ? 'text-[#5B5FC7] bg-[#F5F6FF]' 
                    : 'text-[#4A5568] hover:text-[#5B5FC7] hover:bg-[#F5F6FF]'
                }`}
              >
                <FileText className="h-4 w-4" />
                Templates
              </Button>
            </Link>
            <Link href="/dashboard/quote-request">
              <Button 
                variant="ghost" 
                className={`gap-2 font-medium transition-colors ${
                  isActive('/dashboard/quote-request')
                    ? 'text-[#5B5FC7] bg-[#F5F6FF]' 
                    : 'text-[#4A5568] hover:text-[#5B5FC7] hover:bg-[#F5F6FF]'
                }`}
              >
                <Globe className="h-4 w-4" />
                Obtenir une Cotation
              </Button>
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <NotificationBell />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-r from-[#5B5FC7] to-[#7B7FE8] text-white font-semibold">
                      {userEmail ? getInitials(userEmail) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Mon compte</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    <span>Mes projets</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Réglages</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
