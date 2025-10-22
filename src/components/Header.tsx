import React from "react";
import { Moon, Sun, User, LogOut, MessageSquare, FolderOpen, TrendingUp, Settings, Building2, BookOpen, Calculator, Calendar } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import comarcIcon from "@/assets/icone-comarc.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";

const BADGE_THRESHOLDS = [
  { name: "🥉 Iniciante", points: 0, maxPoints: 49 },
  { name: "🥈 Consistente", points: 50, maxPoints: 149 },
  { name: "🥇 Avançado", points: 150, maxPoints: 299 },
  { name: "💎 Expert", points: 300, maxPoints: Infinity },
];

export const Header = React.memo(function Header() {
  const { theme, setTheme } = useTheme();
  const { user, signOut, isAdmin } = useAuth();
  const { profile, loading } = useProfile();
  const navigate = useNavigate();

  const getWelcomeMessage = () => {
    if (!profile) return "";
    const firstName = profile.full_name.split(" ")[0];
    
    if (profile.gender === "feminino") {
      return `Seja Bem-Vinda ${firstName}`;
    } else if (profile.gender === "masculino") {
      return `Seja Bem-Vindo ${firstName}`;
    }
    return `Olá ${firstName}`;
  };

  const userPoints = profile?.points || 0;
  
  const currentBadge = [...BADGE_THRESHOLDS]
    .reverse()
    .find((badge) => userPoints >= badge.points) || BADGE_THRESHOLDS[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4">
        {/* Logo */}
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-comarc-green p-2.5 flex-shrink-0">
            <img src={comarcIcon} alt="COMARC" className="w-full h-full object-contain" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-foreground">COMARC</h1>
            <p className="text-xs text-muted-foreground">Negócios Imobiliários</p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div 
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <Sun className="h-5 w-5 text-primary-foreground rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 text-primary-foreground rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Alternar tema claro/escuro</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Notification Bell - NOVO */}
          <NotificationBell />

          {/* User Profile with Gamification */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="hidden md:block text-right space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            ) : profile ? (
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-foreground">{getWelcomeMessage()}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {currentBadge.name}
                  </span>
                  <span className="text-xs font-bold text-primary">{userPoints} pts</span>
                </div>
              </div>
            ) : null}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  {loading ? (
                    <Skeleton className="h-10 w-10 rounded-full" />
                  ) : (
                    <Avatar className="h-10 w-10 border-2 border-primary">
                      <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "User"} />
                      <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                        {profile?.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/agenda")}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Agenda de Reuniões
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/academy/modules")}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Treinamentos Gerais
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/playbooks")}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Playbooks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/resources")}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Central de Recursos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/campaigns")}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Campanhas Ativas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/campaigns/partners")}>
                  <Building2 className="mr-2 h-4 w-4" />
                  Construtoras Parceiras
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/calculator")}>
                  <Calculator className="mr-2 h-4 w-4" />
                  Calculadora de Fluxo
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Painel Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

export default Header;
