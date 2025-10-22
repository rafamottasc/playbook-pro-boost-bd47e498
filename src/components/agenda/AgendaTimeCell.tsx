import { format } from "date-fns";

interface AgendaTimeCellProps {
  event: {
    start: Date;
    end: Date;
  };
}

export function AgendaTimeCell({ event }: AgendaTimeCellProps) {
  // Validate and convert to Date objects if needed
  const startDate = event.start instanceof Date && !isNaN(event.start.getTime()) 
    ? event.start 
    : new Date(event.start);
    
  const endDate = event.end instanceof Date && !isNaN(event.end.getTime()) 
    ? event.end 
    : new Date(event.end);

  return (
    <div className="text-white/90">
      {format(startDate, "HH:mm")} – {format(endDate, "HH:mm")}
    </div>
  );
}
