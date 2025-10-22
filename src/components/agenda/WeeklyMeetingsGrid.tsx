import { useMemo, useState } from "react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeetings, Meeting } from "@/hooks/useMeetings";
import { MeetingCard } from "./MeetingCard";
import { EditMeetingDialog } from "./EditMeetingDialog";

interface WeeklyMeetingsGridProps {
  selectedRoomId: string;
}

export function WeeklyMeetingsGrid({ selectedRoomId }: WeeklyMeetingsGridProps) {
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
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-semibold">
                {format(weekDays[0], "dd MMM", { locale: ptBR })} -{" "}
                {format(weekDays[6], "dd MMM yyyy", { locale: ptBR })}
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleToday}>
                Hoje
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextWeek}>
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-4">
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

                  <div className="flex-1 space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                    {dayMeetings.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-8">
                        Sem reuniões
                      </div>
                    ) : (
                      dayMeetings.map((meeting, idx) => (
                        <div
                          key={meeting.id}
                          className="p-3 border-l-4 border-l-primary rounded-md bg-card shadow-sm hover:shadow-md transition-shadow"
                        >
                          <MeetingCard
                            meeting={meeting}
                            onEdit={handleEdit}
                            onCancel={handleCancel}
                            showSeparator={false}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
