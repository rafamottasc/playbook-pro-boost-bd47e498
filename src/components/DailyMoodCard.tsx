import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smile, Meh, Frown, ThumbsDown } from "lucide-react";
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
    <div className="max-w-4xl mx-auto mb-6 px-4">
      <Card className="border border-border/50 bg-card shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:translate-y-[-2px] transition-all duration-300 animate-fade-in">
        <CardHeader className="text-center pb-2 pt-4 px-4">
          <CardDescription className="text-lg font-medium text-foreground">
            Como você está se sentindo hoje?
          </CardDescription>
        </CardHeader>
        <CardContent className="px-3 sm:px-6 pb-4">
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {moodOptions.map((mood) => {
              const Icon = mood.icon;
              return (
                <button
                  key={mood.value}
                  onClick={() => handleMoodClick(mood.value)}
                  disabled={submitting}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 sm:gap-2",
                    "p-2 sm:p-3 rounded-lg",
                    "border border-border/50 transition-all duration-300",
                    "hover:scale-[1.02] sm:hover:scale-105 hover:shadow-md hover:border-primary/40",
                    "active:scale-95",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    mood.color
                  )}
                >
                  <span className="text-2xl sm:text-3xl">{mood.emoji}</span>
                  <span className="text-xs sm:text-sm font-medium text-foreground">{mood.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
