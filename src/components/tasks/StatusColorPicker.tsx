import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PRESET_COLORS = [
  { name: 'Azul', hex: '#3b82f6' },
  { name: 'Verde', hex: '#10b981' },
  { name: 'Laranja', hex: '#f59e0b' },
  { name: 'Roxo', hex: '#8b5cf6' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Vermelho', hex: '#ef4444' },
  { name: 'Amarelo', hex: '#fbbf24' },
  { name: 'Cinza', hex: '#6b7280' },
  { name: 'Azul Escuro', hex: '#1e40af' },
  { name: 'Verde Escuro', hex: '#047857' },
  { name: 'Roxo Escuro', hex: '#6d28d9' },
  { name: 'Rosa Escuro', hex: '#be185d' },
];

interface StatusColorPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentColor: string;
  onSelectColor: (color: string) => void;
  statusName: string;
}

export function StatusColorPicker({
  open,
  onOpenChange,
  currentColor,
  onSelectColor,
  statusName,
}: StatusColorPickerProps) {
  const handleColorSelect = (color: string) => {
    onSelectColor(color);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escolher cor para "{statusName}"</DialogTitle>
          <DialogDescription>
            Selecione uma cor para personalizar sua etapa
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-4 gap-3 py-4">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.hex}
              onClick={() => handleColorSelect(color.hex)}
              className="relative flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
              title={color.name}
            >
              <div
                className="w-12 h-12 rounded-lg shadow-sm ring-2 ring-border group-hover:ring-primary transition-all"
                style={{ backgroundColor: color.hex }}
              >
                {currentColor === color.hex && (
                  <div className="w-full h-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-white drop-shadow-md" />
                  </div>
                )}
              </div>
              <span className="text-xs text-center text-muted-foreground group-hover:text-foreground transition-colors">
                {color.name}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
