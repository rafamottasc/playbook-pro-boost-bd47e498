import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, Loader2, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMeetingRooms } from "@/hooks/useMeetingRooms";
import { useMeetings } from "@/hooks/useMeetings";
import { toast } from "sonner";

interface MeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
}

export function MeetingDialog({ open, onOpenChange, selectedDate }: MeetingDialogProps) {
  const { rooms } = useMeetingRooms();
  const { createMeeting, creating } = useMeetings();
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState<Date | undefined>(selectedDate || new Date());
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [participants, setParticipants] = useState("5");

  const activeRooms = rooms.filter((room) => room.active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Digite um título para a reunião");
      return;
    }

    if (!roomId) {
      toast.error("Selecione uma sala");
      return;
    }

    if (!date) {
      toast.error("Selecione uma data");
      return;
    }

    // Criar objetos Date com horários
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startDate = new Date(date);
    startDate.setHours(startHour, startMinute, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(endHour, endMinute, 0, 0);

    // Validar se a data não é no passado
    const now = new Date();
    if (startDate < now) {
      toast.error("Não é possível agendar reuniões no passado");
      return;
    }

    // Validar horários
    if (endDate <= startDate) {
      toast.error("O horário de término deve ser após o horário de início");
      return;
    }

    // Validar duração mínima (15 minutos)
    const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    if (durationMinutes < 15) {
      toast.error("A reunião deve ter pelo menos 15 minutos de duração");
      return;
    }

    const participantsCount = parseInt(participants);
    if (isNaN(participantsCount) || participantsCount < 1) {
      toast.error("Digite um número válido de participantes");
      return;
    }

    const result = await createMeeting({
      title: title.trim(),
      description: description.trim() || undefined,
      room_id: roomId,
      start_date: startDate,
      end_date: endDate,
      participants_count: participantsCount,
    });

    if (result) {
      // Resetar form
      setTitle("");
      setDescription("");
      setRoomId("");
      setDate(undefined);
      setStartTime("09:00");
      setEndTime("10:00");
      setParticipants("5");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Reunião</DialogTitle>
          <DialogDescription>
            Preencha os dados para agendar uma nova reunião
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Reunião de Planejamento"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={creating}
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Detalhes sobre a reunião (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={creating}
            />
          </div>

          {/* Sala */}
          <div className="space-y-2">
            <Label htmlFor="room">Sala *</Label>
            <Select value={roomId} onValueChange={setRoomId} disabled={creating}>
              <SelectTrigger id="room">
                <SelectValue placeholder="Selecione uma sala" />
              </SelectTrigger>
              <SelectContent>
                {activeRooms.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Nenhuma sala disponível
                  </div>
                ) : (
                  activeRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {room.name} - Capacidade: {room.capacity} pessoas
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Data */}
          <div className="space-y-2">
            <Label>Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={creating}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Horário Início *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="pl-10"
                  disabled={creating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Horário Fim *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="pl-10"
                  disabled={creating}
                />
              </div>
            </div>
          </div>

          {/* Número de Participantes */}
          <div className="space-y-2">
            <Label htmlFor="participants">Número de Participantes *</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="participants"
                type="number"
                min="1"
                value={participants}
                onChange={(e) => setParticipants(e.target.value)}
                className="pl-10"
                disabled={creating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Reunião
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
