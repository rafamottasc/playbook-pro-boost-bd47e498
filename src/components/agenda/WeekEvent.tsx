import { format } from "date-fns";
import { Users, User } from "lucide-react";
import { Meeting } from "@/hooks/useMeetings";

interface WeekEventProps {
  event: {
    title: string;
    start: Date;
    end: Date;
    resource: Meeting;
  };
}

export function WeekEvent({ event }: WeekEventProps) {
  const meeting = event.resource;
  
  return (
    <div className="p-1 text-xs space-y-0.5">
      <div className="font-semibold truncate">{event.title}</div>
      <div className="text-[10px] opacity-90">
        {format(event.start, "HH:mm")} - {format(event.end, "HH:mm")}
      </div>
      <div className="flex items-center gap-2 text-[10px] opacity-80">
        <span className="flex items-center gap-0.5">
          <Users className="h-2.5 w-2.5" />
          {meeting.participants_count}
        </span>
        <span className="flex items-center gap-0.5 truncate">
          <User className="h-2.5 w-2.5" />
          {meeting.creator_name}
        </span>
      </div>
    </div>
  );
}
