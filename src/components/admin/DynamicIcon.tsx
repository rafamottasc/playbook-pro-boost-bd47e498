import { icons, LucideProps } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  // Se contém emoji (unicode), renderiza como texto
  if (/\p{Emoji}/u.test(name)) {
    return <span className="text-lg">{name}</span>;
  }
  
  // Busca o ícone no pacote lucide-react usando notação de ponto
  const IconComponent = (LucideIcons as any)[name];
  
  // Se não encontrar, usa Circle como fallback
  if (!IconComponent || typeof IconComponent !== 'function') {
    return <LucideIcons.Circle {...props} />;
  }
  
  // Renderiza o ícone diretamente
  return <IconComponent {...props} />;
};
