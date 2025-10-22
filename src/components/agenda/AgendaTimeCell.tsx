import { format } from "date-fns";

interface AgendaTimeCellProps {
  event: {
    start: Date;
    end: Date;
  };
}

export function AgendaTimeCell({ event }: AgendaTimeCellProps) {
  return (
    <div className="text-white/90">
      {format(event.start, "HH:mm")} – {format(event.end, "HH:mm")}
    </div>
  );
}
