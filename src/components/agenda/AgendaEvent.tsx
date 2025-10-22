import { format } from "date-fns";
import { MapPin, Users, User } from "lucide-react";
import { Meeting } from "@/hooks/useMeetings";

interface AgendaEventProps {
  event: {
    start: Date;
    end: Date;
    resource: Meeting;
  };
}

export function AgendaEvent({ event }: AgendaEventProps) {
  const meeting = event.resource;
  
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex-1 font-medium">{meeting.title}</div>
      <div className="flex items-center gap-1 text-muted-foreground min-w-[120px]">
        <MapPin className="h-3 w-3" />
        <span>{meeting.room_name}</span>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground min-w-[100px]">
        <Users className="h-3 w-3" />
        <span>{meeting.participants_count}</span>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground min-w-[150px]">
        <User className="h-3 w-3" />
        <span className="truncate">{meeting.creator_name}</span>
      </div>
    </div>
  );
}
