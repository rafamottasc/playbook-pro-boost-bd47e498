import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ThemePreview } from './ThemePreview';
import { Palette, RotateCcw } from 'lucide-react';

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

  const handleSliderChange = (field: 'hue' | 'saturation' | 'lightness', value: number) => {
    const newColors = { ...preview, [field]: value };
    setPreview(newColors);
    applyTheme(newColors); // Preview em tempo real
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

      {/* Ajuste Personalizado */}
      <Card>
        <CardHeader>
          <CardTitle>Ajuste Personalizado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Matiz */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Matiz (Cor Base)</Label>
                <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                  {preview.hue}°
                </span>
              </div>
              <Slider
                value={[preview.hue]}
                onValueChange={([val]) => handleSliderChange('hue', val)}
                min={0}
                max={360}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                0° = Vermelho | 120° = Verde | 240° = Azul | 360° = Vermelho
              </p>
            </div>
            
            {/* Saturação */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Saturação (Intensidade)</Label>
                <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                  {preview.saturation}%
                </span>
              </div>
              <Slider
                value={[preview.saturation]}
                onValueChange={([val]) => handleSliderChange('saturation', val)}
                min={40}
                max={100}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Mínimo de 40% para evitar cores desbotadas
              </p>
            </div>
            
            {/* Luminosidade */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Luminosidade (Brilho)</Label>
                <span className="text-sm font-mono bg-muted px-3 py-1 rounded">
                  {preview.lightness}%
                </span>
              </div>
              <Slider
                value={[preview.lightness]}
                onValueChange={([val]) => handleSliderChange('lightness', val)}
                min={20}
                max={70}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                20-70% para garantir contraste adequado com o texto
              </p>
            </div>

            {/* Preview da cor atual */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Cor Atual</Label>
              <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/30">
                <div
                  className="w-20 h-20 rounded-lg shadow-lg border-2 border-background"
                  style={{ 
                    backgroundColor: `hsl(${preview.hue} ${preview.saturation}% ${preview.lightness}%)` 
                  }}
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-mono">
                    HSL({preview.hue}, {preview.saturation}%, {preview.lightness}%)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Esta cor será aplicada em botões, badges, ícones, links e bordas
                  </p>
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
