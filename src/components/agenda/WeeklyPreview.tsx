import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Eye, Users, User } from "lucide-react";
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
    <Card className="mb-6 border-border/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          Reuniões desta Semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-2 p-2">
                <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : upcomingMeetings.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground text-sm mb-3">
              Nenhuma reunião agendada esta semana
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/agenda")}
            >
              <Calendar className="h-3.5 w-3.5 mr-2" />
              Ir para Agenda
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[180px] overflow-y-auto mb-3">
              {upcomingMeetings.slice(0, 2).map((meeting) => {
                const startDate = new Date(meeting.start_date);
                const dayOfWeek = format(startDate, "EEE", { locale: ptBR }).toUpperCase();
                const dayOfMonth = format(startDate, "dd");
                const time = format(startDate, "HH:mm");

                return (
                  <div
                    key={meeting.id}
                    className="flex items-start gap-2 p-2 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors cursor-pointer group"
                    onClick={() => navigate("/agenda")}
                  >
                    {/* Data */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-medium text-muted-foreground leading-none">
                        {dayOfWeek}
                      </span>
                      <span className="text-base font-bold text-primary leading-none mt-0.5">
                        {dayOfMonth}
                      </span>
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate text-foreground text-sm leading-tight">
                        {meeting.title}
                      </h4>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{time}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{meeting.room_name}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{meeting.participants_count}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{meeting.creator_name?.split(' ')[0]}</span>
                        </span>
                      </div>
                    </div>

                    {/* Ícone de visualizar */}
                    <Eye className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                  </div>
                );
              })}
            </div>

            {/* Botão para ver agenda completa */}
            <Button
              variant="outline"
              className="w-full"
              size="sm"
              onClick={() => navigate("/agenda")}
            >
              <Calendar className="h-3.5 w-3.5 mr-2" />
              Ver {upcomingMeetings.length > 2 ? `todas as ${upcomingMeetings.length}` : 'Agenda Completa'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
