import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ThemeColors {
  hue: number;
  saturation: number;
  lightness: number;
}

export function useThemeColors() {
  const [colors, setColors] = useState<ThemeColors>({
    hue: 160,
    saturation: 84,
    lightness: 39
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const { data, error } = await supabase
        .from('theme_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      
      if (data) {
        const themeColors = {
          hue: data.primary_hue,
          saturation: data.primary_saturation,
          lightness: data.primary_lightness
        };
        setColors(themeColors);
        applyTheme(themeColors);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (theme: ThemeColors) => {
    const { hue, saturation, lightness } = theme;
    const root = document.documentElement;
    
    // Cor principal
    const primaryHSL = `${hue} ${saturation}% ${lightness}%`;
    root.style.setProperty('--primary', primaryHSL);
    
    // Cor de foco (ring) - mesma que primary
    root.style.setProperty('--ring', primaryHSL);
    
    // Accent (mesma que primary)
    root.style.setProperty('--accent', primaryHSL);
    
    // Calcular cor de texto (contraste automático)
    const foregroundColor = lightness > 60 ? '0 0% 10%' : '0 0% 100%';
    root.style.setProperty('--primary-foreground', foregroundColor);
    root.style.setProperty('--accent-foreground', foregroundColor);
    
    // Cor secundária para gradiente (15° mais quente no matiz + ligeiramente mais claro)
    const secondaryHue = (hue + 15) % 360;
    const secondaryL = Math.min(lightness + 10, 60);
    const secondaryHSL = `${secondaryHue} ${saturation}% ${secondaryL}%`;
    
    // Gradiente dinâmico
    const gradient = `linear-gradient(135deg, hsl(${primaryHSL}), hsl(${secondaryHSL}))`;
    root.style.setProperty('--gradient-primary', gradient);
    
    // Aplicar também para dark mode card gradient
    const darkGradient = `linear-gradient(135deg, hsl(240 10% 7%), hsl(240 3.7% 12%))`;
    root.style.setProperty('--gradient-card', gradient); // Light mode usa o gradiente colorido
  };

  const updateTheme = async (newColors: ThemeColors) => {
    try {
      // Buscar o ID da configuração atual
      const { data: currentSettings } = await supabase
        .from('theme_settings')
        .select('id')
        .single();

      if (!currentSettings?.id) {
        toast({ title: 'Erro ao buscar configuração de tema', variant: 'destructive' });
        return;
      }

      const { error } = await supabase
        .from('theme_settings')
        .update({
          primary_hue: newColors.hue,
          primary_saturation: newColors.saturation,
          primary_lightness: newColors.lightness
        })
        .eq('id', currentSettings.id);
      
      if (error) throw error;
      
      setColors(newColors);
      applyTheme(newColors);
      toast({ title: 'Tema atualizado com sucesso!' });
    } catch (error) {
      console.error('Error updating theme:', error);
      toast({ title: 'Erro ao salvar tema', variant: 'destructive' });
    }
  };

  return { colors, updateTheme, applyTheme, loading };
}
