import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Heart, CheckCircle, AlertCircle, Info } from 'lucide-react';

export function ThemePreview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview do Tema</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Botões */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Botões</h4>
          <div className="flex flex-wrap gap-2">
            <Button>Botão Primário</Button>
            <Button variant="outline">Botão Outline</Button>
            <Button variant="secondary">Botão Secundário</Button>
            <Button variant="ghost">Botão Ghost</Button>
            <Button variant="destructive">Botão Destrutivo</Button>
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Badges</h4>
          <div className="flex flex-wrap gap-2">
            <Badge>Badge Padrão</Badge>
            <Badge variant="secondary">Badge Secundário</Badge>
            <Badge variant="outline">Badge Outline</Badge>
            <Badge variant="destructive">Badge Destrutivo</Badge>
          </div>
        </div>

        {/* Ícones com Cor Primária */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Ícones Coloridos</h4>
          <div className="flex gap-4">
            <Heart className="w-8 h-8 text-primary" />
            <CheckCircle className="w-8 h-8 text-primary" />
            <AlertCircle className="w-8 h-8 text-primary" />
            <Info className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Input com Focus */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Input (Focus Ring)</h4>
          <Input placeholder="Clique para ver o ring colorido" />
        </div>

        {/* Card com Borda */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Card com Borda Colorida</h4>
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-primary">Card Destacado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Este card usa a cor primária na borda e no título.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gradiente */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Gradiente Dinâmico</h4>
          <div 
            className="h-24 rounded-lg"
            style={{ background: 'var(--gradient-primary)' }}
          />
        </div>

        {/* Link */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground">Links e Texto</h4>
          <div className="space-y-2">
            <p className="text-sm">
              Texto normal com <a href="#" className="text-primary underline hover:text-primary/80">link colorido</a>
            </p>
            <p className="text-sm text-primary font-semibold">Texto com cor primária</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
