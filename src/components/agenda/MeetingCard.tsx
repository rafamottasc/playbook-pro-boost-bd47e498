import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, MapPin, Users, User, Pencil, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Meeting } from "@/hooks/useMeetings";

interface MeetingCardProps {
  meeting: Meeting;
  onEdit: (meeting: Meeting) => void;
  onCancel: (meeting: Meeting) => void;
  showSeparator?: boolean;
}

export function MeetingCard({ meeting, onEdit, onCancel, showSeparator = false }: MeetingCardProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-foreground">{meeting.title}</h3>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        <span>{meeting.room_name}</span>
      </div>
      
      <Badge className="mb-1 bg-primary text-primary-foreground hover:bg-primary/90">
        {format(new Date(meeting.start_date), "EEEE, dd/MM", { locale: ptBR })}
      </Badge>
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>
          {format(new Date(meeting.start_date), "HH:mm")} - {format(new Date(meeting.end_date), "HH:mm")}
        </span>
      </div>
      
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-3 w-3" />
          <span>{meeting.participants_count} pessoas</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="h-3 w-3" />
          <span className="truncate">{meeting.creator_name}</span>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1"
          onClick={() => onEdit(meeting)}
        >
          <Pencil className="h-3 w-3" />
          Editar
        </Button>
        <Button 
          size="sm" 
          variant="destructive" 
          className="flex-1"
          onClick={() => onCancel(meeting)}
        >
          <X className="h-3 w-3" />
          Cancelar
        </Button>
      </div>
      
      {showSeparator && <Separator className="mt-4" />}
    </div>
  );
}
