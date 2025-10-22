import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Users, User, Calendar, Clock } from "lucide-react";
import { Meeting } from "@/hooks/useMeetings";

interface AgendaEventProps {
  event: {
    start: Date;
    end: Date;
    resource: Meeting;
    title: string;
  };
}

export function AgendaEvent({ event }: AgendaEventProps) {
  const meeting = event.resource;
  
  // Validar e converter para Date objects
  const startDate = event.start instanceof Date && !isNaN(event.start.getTime()) 
    ? event.start 
    : new Date(event.start);
    
  const endDate = event.end instanceof Date && !isNaN(event.end.getTime()) 
    ? event.end 
    : new Date(event.end);
  
  return (
    <div className="flex items-center gap-4 text-sm py-1">
      {/* Data */}
      <div className="flex items-center gap-1 text-white/90 min-w-[140px]">
        <Calendar className="h-3 w-3" />
        <span className="font-medium">{format(startDate, "EEEE, dd/MM", { locale: ptBR })}</span>
      </div>
      
      {/* Horário */}
      <div className="flex items-center gap-1 text-white/90 min-w-[100px]">
        <Clock className="h-3 w-3" />
        <span>{format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}</span>
      </div>
      
      {/* Título */}
      <div className="flex-1 font-medium text-white min-w-[150px]">{meeting.title}</div>
      
      {/* Sala */}
      <div className="flex items-center gap-1 text-white/90 min-w-[120px]">
        <MapPin className="h-3 w-3" />
        <span>{meeting.room_name}</span>
      </div>
      
      {/* Quantidade de Pessoas */}
      <div className="flex items-center gap-1 text-white/90 min-w-[100px]">
        <Users className="h-3 w-3" />
        <span>{meeting.participants_count}</span>
      </div>
      
      {/* Responsável */}
      <div className="flex items-center gap-1 text-white/90 min-w-[150px]">
        <User className="h-3 w-3" />
        <span className="truncate">{meeting.creator_name}</span>
      </div>
    </div>
  );
}
