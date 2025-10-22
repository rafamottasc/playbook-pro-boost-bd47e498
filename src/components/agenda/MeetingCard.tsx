import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, MapPin, Users, User, Pencil, Trash2, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Meeting } from "@/hooks/useMeetings";

interface MeetingCardProps {
  meeting: Meeting;
  onEdit: (meeting: Meeting) => void;
  onCancel: (meeting: Meeting) => void;
  onDelete: (meeting: Meeting) => void;
  showSeparator?: boolean;
  currentUserId: string;
  isAdmin: boolean;
}

export function MeetingCard({ meeting, onEdit, onCancel, onDelete, showSeparator = false, currentUserId, isAdmin }: MeetingCardProps) {
  const canModify = isAdmin || meeting.created_by === currentUserId;
  const isPastMeeting = new Date(meeting.end_date) < new Date();

  return (
    <div className="space-y-2 p-4 border-l-4 border-l-primary rounded-md bg-card shadow-sm hover:shadow-md transition-smooth">
      <h3 className="font-semibold text-foreground">{meeting.title}</h3>
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" />
        <span>{meeting.room_name}</span>
      </div>
      
      <Badge className={`mb-1 ${
        isPastMeeting 
          ? 'bg-muted text-muted-foreground hover:bg-muted/80' 
          : 'bg-primary text-primary-foreground hover:bg-primary/90'
      }`}>
        {format(new Date(meeting.start_date), "EEEE, dd/MM", { locale: ptBR })}
      </Badge>
      
      {isPastMeeting && (
        <Badge variant="secondary" className="text-xs mb-2">
          Concluída
        </Badge>
      )}
      
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

      {canModify && (
        <TooltipProvider>
          <div className="flex gap-2 pt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-9 w-9"
                  onClick={() => onEdit(meeting)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar reunião</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-9 w-9"
                  onClick={() => onCancel(meeting)}
                >
                  <Ban className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cancelar reunião</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="destructive" 
                  className="h-9 w-9"
                  onClick={() => onDelete(meeting)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Excluir permanentemente</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      )}
      
      {showSeparator && <Separator className="mt-4" />}
    </div>
  );
}
