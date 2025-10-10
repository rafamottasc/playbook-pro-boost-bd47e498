import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, CheckCircle2, Clock, Award } from "lucide-react";
import { getYouTubeThumbnail } from "@/lib/youtube";
import { Progress } from "@/components/ui/progress";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration_minutes: number | null;
  points: number;
}

interface LessonCardProps {
  lesson: Lesson;
  moduleId: string;
  lessonNumber: number;
  isWatched?: boolean;
  progress?: number;
}

export function LessonCard({ lesson, moduleId, lessonNumber, isWatched = false, progress = 0 }: LessonCardProps) {
  const navigate = useNavigate();
  const thumbnail = getYouTubeThumbnail(lesson.video_url);

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-video overflow-hidden bg-muted">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={lesson.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <Play className="h-16 w-16 text-primary/40" />
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white rounded-full p-4">
            <Play className="h-8 w-8 text-primary" />
          </div>
        </div>

        {isWatched && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Concluída
            </Badge>
          </div>
        )}

        <div className="absolute top-3 left-3">
          <Badge variant="secondary">
            Aula {lessonNumber}
          </Badge>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2">
          {lesson.title}
        </h3>
        
        {lesson.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {lesson.description}
          </p>
        )}

        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          {lesson.duration_minutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{lesson.duration_minutes} min</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4" />
            <span>+{lesson.points} pts</span>
          </div>
        </div>

        {progress > 0 && !isWatched && (
          <div className="mb-4">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progress}% concluído
            </p>
          </div>
        )}

        <Button
          onClick={() => navigate(`/resources/training/${moduleId}/${lesson.id}`)}
          className="w-full"
          variant={isWatched ? "secondary" : "default"}
        >
          {isWatched ? 'Assistir novamente' : progress > 0 ? 'Continuar' : 'Começar'}
        </Button>
      </div>
    </Card>
  );
}
