import { icons, LucideProps } from 'lucide-react';

interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  // Se contém emoji (unicode), renderiza como texto
  if (/\p{Emoji}/u.test(name)) {
    return <span className="text-lg">{name}</span>;
  }
  
  // Renderiza ícone Lucide
  const IconComponent = icons[name as keyof typeof icons];
  
  if (!IconComponent) {
    return <icons.Circle {...props} />; // fallback
  }
  
  return <IconComponent {...props} />;
};
