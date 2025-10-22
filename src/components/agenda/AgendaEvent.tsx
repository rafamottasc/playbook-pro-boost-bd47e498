import { MapPin, Users, User } from "lucide-react";
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
  
  return (
    <div className="py-1">
      {/* Título em destaque */}
      <div className="font-semibold text-white mb-2">
        {meeting.title}
      </div>
      
      {/* Informações secundárias em linha */}
      <div className="flex items-center gap-4 text-xs text-white/90">
        {/* Sala */}
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>{meeting.room_name}</span>
        </div>
        
        {/* Quantidade de Pessoas */}
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{meeting.participants_count}</span>
        </div>
        
        {/* Responsável */}
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span className="truncate">{meeting.creator_name}</span>
        </div>
      </div>
    </div>
  );
}
