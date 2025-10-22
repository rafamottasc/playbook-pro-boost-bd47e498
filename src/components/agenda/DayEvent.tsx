import { format } from "date-fns";
import { Users, User } from "lucide-react";
import { Meeting } from "@/hooks/useMeetings";

interface DayEventProps {
  event: {
    title: string;
    start: Date;
    end: Date;
    resource: Meeting;
  };
}

export function DayEvent({ event }: DayEventProps) {
  const meeting = event.resource;
  
  return (
    <div className="p-2 text-sm space-y-1">
      <div className="font-semibold text-white">{event.title}</div>
      <div className="text-xs text-white/90">
        {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
      </div>
      <div className="flex items-center gap-1 text-xs text-white/90">
        <span className="flex items-center gap-0.5">
          <Users className="h-3 w-3" />
          {meeting.participants_count}
        </span>
        <span>|</span>
        <span className="flex items-center gap-0.5 truncate">
          <User className="h-3 w-3" />
          {meeting.creator_name}
        </span>
      </div>
    </div>
  );
}
