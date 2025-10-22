import { format } from "date-fns";
import { MapPin, Users, User, Clock } from "lucide-react";
import { Meeting } from "@/hooks/useMeetings";

interface MonthEventProps {
  event: {
    title: string;
    start: Date;
    end: Date;
    resource: Meeting;
  };
}

export function MonthEvent({ event }: MonthEventProps) {
  const meeting = event.resource;
  
  return (
    <div className="text-[10px] leading-tight space-y-0.5 p-0.5">
      <div className="font-semibold truncate">{event.title}</div>
      <div className="flex items-center gap-2 opacity-90">
        <span className="flex items-center gap-0.5">
          <MapPin className="h-2 w-2 flex-shrink-0" />
          <span className="truncate">{meeting.room_name}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <Clock className="h-2 w-2 flex-shrink-0" />
          <span>{format(event.start, "HH:mm")}</span>
        </span>
      </div>
    </div>
  );
}
