import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemePreview } from './ThemePreview';
import { Palette, RotateCcw } from 'lucide-react';
import { SketchPicker, ColorResult } from 'react-color';

// Funções de conversão HSL ↔ HEX
function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

const PRESET_COLORS = [
  { name: 'Dourado', hue: 38, sat: 75, light: 50 },
  { name: 'Verde', hue: 160, sat: 84, light: 39 },
  { name: 'Azul Petróleo', hue: 195, sat: 80, light: 35 },
  { name: 'Azul Facebook', hue: 221, sat: 79, light: 53 },
  { name: 'Azul Instagram', hue: 225, sat: 90, light: 55 },
  { name: 'Roxo Moderno', hue: 270, sat: 70, light: 50 },
  { name: 'Laranja Energia', hue: 25, sat: 85, light: 50 },
  { name: 'Vermelho Corporativo', hue: 5, sat: 75, light: 45 },
  { name: 'Cinza Prata', hue: 210, sat: 15, light: 50 },
  { name: 'Azul Marinho', hue: 210, sat: 70, light: 30 },
];

export function ThemeManager() {
  const { colors, updateTheme, applyTheme, loading } = useThemeColors();
  const [preview, setPreview] = useState(colors);

  // Sincronizar preview com colors quando carregar
  useEffect(() => {
    setPreview(colors);
  }, [colors]);

  const handlePresetClick = (preset: typeof PRESET_COLORS[0]) => {
    const newColors = {
      hue: preset.hue,
      saturation: preset.sat,
      lightness: preset.light
    };
    setPreview(newColors);
    applyTheme(newColors); // Preview em tempo real
  };

  const handleColorChange = (color: ColorResult) => {
    const hsl = hexToHsl(color.hex);
    // Aplicar limites de saturação e luminosidade
    const newColors = {
      hue: hsl.h,
      saturation: Math.max(40, Math.min(100, hsl.s)),
      lightness: Math.max(20, Math.min(70, hsl.l))
    };
    setPreview(newColors);
    applyTheme(newColors);
  };

  const handleSave = () => {
    updateTheme(preview);
  };

  const handleReset = () => {
    const defaultColors = { hue: 38, saturation: 75, lightness: 50 };
    setPreview(defaultColors);
    applyTheme(defaultColors);
    updateTheme(defaultColors);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Palette className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-2xl font-bold">Aparência do Sistema</h2>
          <p className="text-sm text-muted-foreground">
            Personalize as cores predominantes de toda a aplicação
          </p>
        </div>
      </div>

      {/* Cores Pré-definidas */}
      <Card>
        <CardHeader>
          <CardTitle>Cores Pré-definidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {PRESET_COLORS.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:scale-105 transition-transform"
                onClick={() => handlePresetClick(preset)}
              >
                <div
                  className="w-14 h-14 rounded-full shadow-lg border-2 border-background"
                  style={{ 
                    backgroundColor: `hsl(${preset.hue} ${preset.sat}% ${preset.light}%)` 
                  }}
                />
                <span className="text-xs font-medium text-center">{preset.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seletor Visual de Cores */}
      <Card>
        <CardHeader>
          <CardTitle>Seletor Visual de Cores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Color Picker */}
              <div className="flex-shrink-0">
                <SketchPicker
                  color={hslToHex(preview.hue, preview.saturation, preview.lightness)}
                  onChange={handleColorChange}
                  disableAlpha
                  presetColors={PRESET_COLORS.map(p => 
                    hslToHex(p.hue, p.sat, p.light)
                  )}
                />
              </div>

              {/* Preview e Informações */}
              <div className="flex-1 space-y-4">
                <div>
                  <Label className="text-base font-semibold">Cor Atual</Label>
                  <div className="mt-3 flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                    <div
                      className="w-24 h-24 rounded-lg shadow-lg border-2 border-background flex-shrink-0"
                      style={{ 
                        backgroundColor: `hsl(${preview.hue} ${preview.saturation}% ${preview.lightness}%)` 
                      }}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="space-y-1">
                        <p className="text-sm font-mono font-semibold">
                          {hslToHex(preview.hue, preview.saturation, preview.lightness).toUpperCase()}
                        </p>
                        <p className="text-xs font-mono text-muted-foreground">
                          HSL({preview.hue}, {preview.saturation}%, {preview.lightness}%)
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Esta cor será aplicada em botões, badges, ícones, links e bordas por todo o sistema.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Informações de Limites */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold">ℹ️ Limites Aplicados:</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Saturação: 40-100% (mínimo para evitar cores desbotadas)</li>
                    <li>Luminosidade: 20-70% (para garantir contraste adequado)</li>
                    <li>Matiz: 0-360° (todas as cores do espectro)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <ThemePreview />

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleSave} 
          className="flex-1 h-12 text-base font-semibold"
          size="lg"
        >
          💾 Salvar Tema
        </Button>
        <Button 
          onClick={handleReset} 
          variant="outline"
          className="h-12"
          size="lg"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Resetar para Cor Padrão
        </Button>
      </div>

      {/* Aviso */}
      <Card className="border-primary/50 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            ℹ️ As mudanças serão aplicadas imediatamente para todos os usuários após salvar.
            Certifique-se de verificar o preview antes de confirmar.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
