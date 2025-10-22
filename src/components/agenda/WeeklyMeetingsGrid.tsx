import { useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useMeetings, Meeting } from "@/hooks/useMeetings";
import { MeetingCard } from "./MeetingCard";
import { EditMeetingDialog } from "./EditMeetingDialog";
import { useIsMobile } from "@/hooks/use-mobile";

interface WeeklyMeetingsGridProps {
  selectedRoomId: string;
}

export function WeeklyMeetingsGrid({ selectedRoomId }: WeeklyMeetingsGridProps) {
  const isMobile = useIsMobile();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { locale: ptBR })
  );
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [cancellingMeeting, setCancellingMeeting] = useState<Meeting | null>(null);

  const { meetings, loading } = useMeetings({
    roomId: selectedRoomId === "all" ? undefined : selectedRoomId,
    status: "confirmed",
  });

  const weekDays = useMemo(() => {
    return eachDayOfInterval({
      start: currentWeekStart,
      end: endOfWeek(currentWeekStart, { locale: ptBR }),
    });
  }, [currentWeekStart]);

  const meetingsByDay = useMemo(() => {
    const grouped: Record<string, Meeting[]> = {};

    weekDays.forEach((day) => {
      const dateKey = format(day, "yyyy-MM-dd");
      grouped[dateKey] = meetings
        .filter((m) => {
          const meetingDate = format(new Date(m.start_date), "yyyy-MM-dd");
          return meetingDate === dateKey;
        })
        .sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        );
    });

    return grouped;
  }, [meetings, weekDays]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, -1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { locale: ptBR }));
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
  };

  const handleCancel = (meeting: Meeting) => {
    setCancellingMeeting(meeting);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreviousWeek}
              className="w-full sm:w-auto"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm sm:text-base">
                {format(weekDays[0], "dd MMM", { locale: ptBR })} -{" "}
                {format(weekDays[6], "dd MMM yyyy", { locale: ptBR })}
              </span>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleToday}
                className="flex-1 sm:flex-none"
              >
                Hoje
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNextWeek}
                className="flex-1 sm:flex-none"
              >
                Próxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isMobile ? (
        // Layout Vertical para Mobile
        <div className="space-y-4">
          {weekDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayMeetings = meetingsByDay[dateKey] || [];
            const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

            return (
              <Card key={dateKey}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b">
                    <div>
                      <div className={`text-sm uppercase font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                        {format(day, "EEEE", { locale: ptBR })}
                      </div>
                      <div className={`text-3xl font-bold mt-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                        {format(day, "dd/MM")}
                      </div>
                    </div>
                    <Badge variant={dayMeetings.length > 0 ? "default" : "secondary"}>
                      {dayMeetings.length} {dayMeetings.length === 1 ? 'reunião' : 'reuniões'}
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {dayMeetings.length === 0 ? (
                      <div className="text-center text-sm text-muted-foreground py-8">
                        Sem reuniões agendadas
                      </div>
                    ) : (
                      dayMeetings.map((meeting) => (
                        <MeetingCard
                          key={meeting.id}
                          meeting={meeting}
                          onEdit={handleEdit}
                          onCancel={handleCancel}
                          showSeparator={false}
                        />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        // Layout Grid para Desktop
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
              {weekDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayMeetings = meetingsByDay[dateKey] || [];
                const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

                return (
                  <div key={dateKey} className="flex flex-col min-h-[400px]">
                    <div className={`text-center border-b pb-3 mb-3 ${isToday ? 'border-primary' : ''}`}>
                      <div className={`text-xs uppercase font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                        {format(day, "EEE", { locale: ptBR })}
                      </div>
                      <div className={`text-2xl font-bold mt-1 ${isToday ? 'text-primary' : ''}`}>
                        {format(day, "dd")}
                      </div>
                    </div>

                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px] pr-1 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                      {dayMeetings.length === 0 ? (
                        <div className="text-center text-xs text-muted-foreground py-8">
                          Sem reuniões
                        </div>
                      ) : (
                        dayMeetings.map((meeting) => (
                          <MeetingCard
                            key={meeting.id}
                            meeting={meeting}
                            onEdit={handleEdit}
                            onCancel={handleCancel}
                            showSeparator={false}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {editingMeeting && (
        <EditMeetingDialog
          meeting={editingMeeting}
          open={!!editingMeeting}
          onOpenChange={(open) => !open && setEditingMeeting(null)}
        />
      )}
    </>
  );
}
