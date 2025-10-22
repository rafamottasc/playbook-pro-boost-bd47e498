import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, MapPin, Users, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeetings } from "@/hooks/useMeetings";

export function UpcomingMeetingsSidebar() {
  const navigate = useNavigate();
  const { meetings, loading } = useMeetings({ limit: 4, status: "confirmed" });
  
  const upcomingMeetings = meetings
    .filter(m => new Date(m.start_date) > new Date())
    .slice(0, 4);

  if (loading) {
    return (
      <Card className="min-h-[600px] flex flex-col border-l-4 border-l-primary shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Próximas Reuniões</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-h-[600px] flex flex-col border-l-4 border-l-primary shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Próximas Reuniões</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {upcomingMeetings.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <Calendar className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">
              Nenhuma reunião agendada
            </p>
            <Button onClick={() => navigate('/agenda')}>
              Agendar Reunião
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 flex-1">
              {upcomingMeetings.map((meeting, idx) => (
                <div key={meeting.id} className="space-y-2">
                  <Badge variant="secondary" className="mb-1">
                    {format(new Date(meeting.start_date), "EEEE, dd/MM", { locale: ptBR })}
                  </Badge>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(new Date(meeting.start_date), "HH:mm")} - {format(new Date(meeting.end_date), "HH:mm")}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-foreground">{meeting.title}</h3>
                  
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3" />
                      <span>{meeting.room_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      <span>{meeting.participants_count} pessoas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span className="truncate">{meeting.creator_name}</span>
                    </div>
                  </div>
                  
                  {idx < upcomingMeetings.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
            </div>

            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/agenda')}
            >
              Ver Todas
              {meetings.length > 4 && ` (${meetings.length})`}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
