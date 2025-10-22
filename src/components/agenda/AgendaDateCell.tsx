import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendaDateCellProps {
  label: string;
  date: Date;
}

export function AgendaDateCell({ date, label }: AgendaDateCellProps) {
  // Validate if date is a valid Date object
  const dateObj = date instanceof Date && !isNaN(date.getTime()) ? date : null;
  
  return (
    <div className="text-white/90">
      {dateObj ? format(dateObj, "EEEE, dd 'de' MMMM", { locale: ptBR }) : label}
    </div>
  );
}
