import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Eye } from "lucide-react";
import { useMeetings } from "@/hooks/useMeetings";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export const WeeklyPreview = () => {
  const navigate = useNavigate();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Segunda-feira
  const weekEnd = addDays(weekStart, 6); // Domingo
  
  const { meetings, loading } = useMeetings({
    startDate: weekStart,
    endDate: weekEnd,
    status: "confirmed",
    limit: 3,
  });

  // Verificar se há reuniões futuras (não mostrar reuniões passadas)
  const upcomingMeetings = meetings.filter(
    (meeting) => new Date(meeting.start_date) >= new Date()
  );

  // Não renderizar se não houver reuniões futuras e não estiver carregando
  if (!loading && upcomingMeetings.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-border/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          Reuniões desta Semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : upcomingMeetings.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma reunião agendada esta semana
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingMeetings.map((meeting) => {
              const startDate = new Date(meeting.start_date);
              const dayOfWeek = format(startDate, "EEE", { locale: ptBR }).toUpperCase();
              const dayOfMonth = format(startDate, "dd");
              const time = format(startDate, "HH:mm");

              return (
                <div
                  key={meeting.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() => navigate("/agenda")}
                >
                  {/* Data */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                    <span className="text-xs font-medium text-muted-foreground">
                      {dayOfWeek}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {dayOfMonth}
                    </span>
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate text-foreground">
                      {meeting.title}
                    </h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {meeting.room_name}
                      </span>
                    </div>
                  </div>

                  {/* Ícone de visualizar */}
                  <Eye className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              );
            })}
          </div>
        )}

        {/* Botão para ver agenda completa */}
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => navigate("/agenda")}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Ver Agenda Completa
        </Button>
      </CardContent>
    </Card>
  );
};
