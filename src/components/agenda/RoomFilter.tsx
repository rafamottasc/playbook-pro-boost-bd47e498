import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { useMeetingRooms } from "@/hooks/useMeetingRooms";

interface RoomFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function RoomFilter({ value, onChange, disabled }: RoomFilterProps) {
  const { rooms, loading } = useMeetingRooms();
  const activeRooms = rooms.filter((room) => room.active);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
      <SelectTrigger className="w-full sm:w-[250px]">
        <SelectValue placeholder={loading ? "Carregando..." : "Todas as salas"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Todas as Salas
          </div>
        </SelectItem>
        {activeRooms.map((room) => (
          <SelectItem key={room.id} value={room.id}>
            <div className="flex items-center justify-between gap-2 w-full">
              <span>{room.name}</span>
              <span className="text-xs text-muted-foreground">
                ({room.capacity} pessoas)
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
