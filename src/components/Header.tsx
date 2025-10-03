import { Moon, Sun, User, LogOut, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import comarcIcon from "@/assets/icone-comarc.png";
import comarcLogo from "@/assets/logo-comarc.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  userPoints: number;
  userName: string;
}

const BADGE_THRESHOLDS = [
  { name: "Iniciante", points: 10, icon: "🟢" },
  { name: "Consistente", points: 50, icon: "🔵" },
  { name: "Estrategista", points: 100, icon: "🟠" },
  { name: "Mestre da Conversão", points: 200, icon: "🏆" },
];

export function Header({ userPoints, userName }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string; avatar_url: string | null; gender: string | null }>({
    full_name: userName,
    avatar_url: null,
    gender: null,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, avatar_url, gender")
      .eq("id", user.id)
      .maybeSingle();
    
    if (data) {
      setProfile(data);
    }
  };

  const getWelcomeMessage = () => {
    const firstName = profile.full_name.split(" ")[0];
    
    if (profile.gender === "feminino") {
      return `Seja Bem-Vinda ${firstName}`;
    } else if (profile.gender === "masculino") {
      return `Seja Bem-Vindo ${firstName}`;
    }
    return `Olá ${firstName}`;
  };

  const currentBadge = [...BADGE_THRESHOLDS]
    .reverse()
    .find((badge) => userPoints >= badge.points) || BADGE_THRESHOLDS[0];

  const nextBadge = BADGE_THRESHOLDS.find((badge) => badge.points > userPoints);
  const progressPercentage = nextBadge
    ? ((userPoints - currentBadge.points) / (nextBadge.points - currentBadge.points)) * 100
    : 100;

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
            <p className="text-xs text-muted-foreground">Playbooks WhatsApp</p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User Profile with Gamification */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-primary">{getWelcomeMessage()}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {currentBadge.icon} {currentBadge.name}
                </span>
                <span className="text-xs font-bold text-primary">{userPoints} pts</span>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10 border-2 border-primary">
                    <AvatarImage src={profile.avatar_url || ""} alt={profile.full_name} />
                    <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                      {profile.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-16">
                    <Progress value={progressPercentage} className="h-1" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/resources")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Central de Recursos
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
}
