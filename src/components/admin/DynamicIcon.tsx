import { icons, LucideProps } from 'lucide-react';
import { createElement } from 'react';

interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  name: string;
}

export const DynamicIcon = ({ name, ...props }: DynamicIconProps) => {
  // Se contém emoji (unicode), renderiza como texto
  if (/\p{Emoji}/u.test(name)) {
    return <span className="text-lg">{name}</span>;
  }
  
  // Busca o ícone no objeto icons
  const IconComponent = icons[name as keyof typeof icons];
  
  // Validação: verifica se é uma função válida (componente React)
  if (!IconComponent || typeof IconComponent !== 'function') {
    console.warn(`Icon "${name}" not found, using fallback`);
    return createElement(icons.Circle, props);
  }
  
  // Renderiza usando createElement para evitar problemas com displayName
  return createElement(IconComponent, props);
};
