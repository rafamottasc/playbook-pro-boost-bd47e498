import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendaDateCellProps {
  label: string;
  date: Date;
}

export function AgendaDateCell({ date }: AgendaDateCellProps) {
  return (
    <div className="text-white/90">
      {format(date, "EEEE MMM dd", { locale: ptBR })}
    </div>
  );
}
