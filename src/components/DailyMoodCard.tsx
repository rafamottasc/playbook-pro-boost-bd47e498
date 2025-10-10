import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smile, Meh, Frown, ThumbsDown, CloudOff } from "lucide-react";
import { useDailyMood, MoodType } from "@/hooks/useDailyMood";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const moodOptions = [
  { 
    value: "otimo" as MoodType, 
    icon: Smile, 
    label: "Ótimo", 
    color: "text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20",
    emoji: "😊"
  },
  { 
    value: "bem" as MoodType, 
    icon: Smile, 
    label: "Bem", 
    color: "text-lime-500 hover:bg-lime-50 dark:hover:bg-lime-950/20",
    emoji: "🙂"
  },
  { 
    value: "neutro" as MoodType, 
    icon: Meh, 
    label: "Neutro", 
    color: "text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/20",
    emoji: "😐"
  },
  { 
    value: "cansado" as MoodType, 
    icon: Frown, 
    label: "Cansado", 
    color: "text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20",
    emoji: "😔"
  },
  { 
    value: "dificil" as MoodType, 
    icon: ThumbsDown, 
    label: "Difícil", 
    color: "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20",
    emoji: "😞"
  },
];

export function DailyMoodCard() {
  const { user } = useAuth();
  const { hasAnsweredToday, loading, submitting, submitMood } = useDailyMood();

  // Don't show if not logged in, loading, or already answered
  if (!user || loading || hasAnsweredToday) {
    return null;
  }

  const userName = user.user_metadata?.full_name?.split(' ')[0] || "Corretor";

  const handleMoodClick = (mood: MoodType) => {
    submitMood(mood);
  };

  return (
    <div className="max-w-7xl mx-auto mb-8 px-4">
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10 shadow-comarc animate-fade-in">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <CloudOff className="h-6 w-6 text-primary" />
            Como você está se sentindo hoje?
          </CardTitle>
          <CardDescription className="text-base">
            Olá, {userName}! Nos ajude a entender como você está 😊
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
            {moodOptions.map((mood) => {
              const Icon = mood.icon;
              return (
                <button
                  key={mood.value}
                  onClick={() => handleMoodClick(mood.value)}
                  disabled={submitting}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 p-4 rounded-lg",
                    "border-2 border-border transition-all duration-300",
                    "hover:scale-105 hover:shadow-lg hover:border-primary/50",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    mood.color
                  )}
                >
                  <span className="text-4xl">{mood.emoji}</span>
                  <span className="text-sm font-medium text-foreground">{mood.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
