import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

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
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
            <span className="text-xl font-bold text-white">C</span>
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
            <p className="text-sm font-medium">{userName}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {currentBadge.icon} {currentBadge.name}
              </span>
              <span className="text-xs font-bold text-primary">{userPoints} pts</span>
            </div>
          </div>
          <div className="relative">
            <Avatar className="h-10 w-10 border-2 border-primary">
              <AvatarImage src="" alt={userName} />
              <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                {userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-16">
              <Progress value={progressPercentage} className="h-1" />
            </div>
          </div>
        </div>
        </div>
      </div>
    </header>
  );
}
