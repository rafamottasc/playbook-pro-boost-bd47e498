import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, MapPin, Users, User, Trash2, Loader2, Edit } from "lucide-react";
import { Meeting } from "@/hooks/useMeetings";
import { useMeetings } from "@/hooks/useMeetings";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { EditMeetingDialog } from "./EditMeetingDialog";

interface MeetingDetailsProps {
  meeting: Meeting | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeetingDetails({ meeting, open, onOpenChange }: MeetingDetailsProps) {
  const { user, isAdmin } = useAuth();
  const { cancelMeeting, cancelling } = useMeetings();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  if (!meeting) return null;

  const startDate = new Date(meeting.start_date);
  const endDate = new Date(meeting.end_date);
  const isCreator = user?.id === meeting.created_by;
  const canCancel = isAdmin || isCreator;

  const handleCancel = async () => {
    const success = await cancelMeeting({
      meeting_id: meeting.id,
      cancellation_reason: "Cancelado pelo usuário",
    });

    if (success) {
      setShowCancelDialog(false);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl">{meeting.title}</DialogTitle>
                <DialogDescription className="mt-2">
                  {meeting.description || "Sem descrição"}
                </DialogDescription>
              </div>
              <Badge
                variant={meeting.status === "confirmed" ? "default" : "secondary"}
              >
                {meeting.status === "confirmed" ? "Confirmada" : meeting.status === "cancelled" ? "Cancelada" : "Pendente"}
              </Badge>
            </div>
          </DialogHeader>

          <Separator />

          <div className="space-y-4">
            {/* Data e Horário */}
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-foreground">
                  {format(startDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4" />
                  {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
                </p>
              </div>
            </div>

            {/* Sala */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{meeting.room_name}</p>
                <p className="text-sm text-muted-foreground">Sala de reunião</p>
              </div>
            </div>

            {/* Participantes */}
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-foreground">
                  {meeting.participants_count} {meeting.participants_count === 1 ? "participante" : "participantes"}
                </p>
                <p className="text-sm text-muted-foreground">Esperado(s)</p>
              </div>
            </div>

            {/* Organizador */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-foreground">{meeting.creator_name}</p>
                <p className="text-sm text-muted-foreground">Organizador</p>
              </div>
            </div>

            {/* Informações de Cancelamento */}
            {meeting.status === "cancelled" && meeting.cancelled_at && (
              <>
                <Separator />
                <div className="bg-destructive/10 p-3 rounded-lg">
                  <p className="text-sm font-medium text-destructive">
                    Reunião cancelada em {format(new Date(meeting.cancelled_at), "dd/MM/yyyy 'às' HH:mm")}
                  </p>
                  {meeting.cancellation_reason && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Motivo: {meeting.cancellation_reason}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>
            {canCancel && meeting.status === "confirmed" && (
              <>
                <Button
                  variant="outline"
          onClick={() => setShowEditDialog(true)}
                  className="w-full sm:w-auto"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancelling}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancelar Reunião
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Cancelamento */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Reunião</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta reunião? Todos os participantes serão notificados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Não, manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, cancelar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Edição */}
      <EditMeetingDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        meeting={meeting}
        onSuccess={() => onOpenChange(false)}
      />
    </>
  );
}
