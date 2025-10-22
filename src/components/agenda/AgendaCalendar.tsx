import { useState, useMemo, useCallback } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMeetings } from "@/hooks/useMeetings";
import { useMeetingRooms } from "@/hooks/useMeetingRooms";
import { Meeting } from "@/hooks/useMeetings";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { toast } from "sonner";
import { MeetingDialog } from "./MeetingDialog";
import { MeetingDetails } from "./MeetingDetails";
import { RoomFilter } from "./RoomFilter";
import { AgendaEvent } from "./AgendaEvent";
import { WeekEvent } from "./WeekEvent";
import { MonthEvent } from "./MonthEvent";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./calendar-styles.css";

const locales = {
  "pt-BR": ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Mensagens em português
const messages = {
  allDay: "Dia inteiro",
  previous: "Anterior",
  next: "Próximo",
  today: "Hoje",
  month: "Mês",
  week: "Semana",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Hora",
  event: "Evento",
  noEventsInRange: "Não há reuniões agendadas neste período",
  showMore: (total: number) => `+ ${total} mais`,
};

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Meeting;
}

export function AgendaCalendar() {
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedSlotDate, setSelectedSlotDate] = useState<Date | undefined>();

  // Buscar reuniões com filtro de sala
  const { meetings, loading } = useMeetings({
    roomId: selectedRoomId === "all" ? undefined : selectedRoomId,
    status: "confirmed",
  });

  // Transformar meetings em eventos do calendário
  const events: CalendarEvent[] = useMemo(() => {
    return meetings.map((meeting) => ({
      id: meeting.id,
      title: meeting.title,
      start: new Date(meeting.start_date),
      end: new Date(meeting.end_date),
      resource: meeting,
    }));
  }, [meetings]);

  // Handler para clicar em um evento
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedMeeting(event.resource);
    setShowDetailsDialog(true);
  }, []);

  // Handler para selecionar um slot (criar nova reunião)
  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    // Validar se não é no passado
    const now = new Date();
    if (slotInfo.start < now) {
      toast.error("Não é possível agendar reuniões no passado");
      return;
    }
    
    setSelectedSlotDate(slotInfo.start);
    setShowMeetingDialog(true);
  }, []);

  // Estilo customizado para os eventos
  const eventStyleGetter = useCallback(() => {
    return {
      style: {
        backgroundColor: "hsl(var(--primary))",
        borderRadius: "4px",
        opacity: 0.9,
        color: "hsl(var(--primary-foreground))",
        border: "none",
        display: "block",
        fontSize: "0.875rem",
        padding: "2px 4px",
      },
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card className="p-4 border-border/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-foreground">Filtros</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Filtro por Sala */}
            <RoomFilter value={selectedRoomId} onChange={setSelectedRoomId} />

            {/* Botão Nova Reunião */}
            <Button onClick={() => setShowMeetingDialog(true)} className="w-full sm:w-auto">
              Nova Reunião
            </Button>
          </div>
        </div>
      </Card>

      {/* Calendário */}
      <Card className="p-4 border-border/50 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
        {loading ? (
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando reuniões...</p>
            </div>
          </div>
        ) : (
          <div className="calendar-wrapper">
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: 600 }}
              messages={messages}
              culture="pt-BR"
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              views={["month", "week", "day", "agenda"]}
              step={30}
              showMultiDayTimes
              defaultView="week"
              components={{
                agenda: {
                  event: AgendaEvent,
                },
                week: {
                  event: WeekEvent,
                },
                month: {
                  event: MonthEvent,
                },
              }}
            />
          </div>
        )}
      </Card>

      {/* Modal de Nova Reunião */}
      <MeetingDialog
        open={showMeetingDialog}
        onOpenChange={setShowMeetingDialog}
        selectedDate={selectedSlotDate}
      />

      {/* Modal de Detalhes da Reunião */}
      <MeetingDetails
        meeting={selectedMeeting}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </div>
  );
}
