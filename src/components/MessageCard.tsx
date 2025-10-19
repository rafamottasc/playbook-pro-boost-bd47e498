import React, { useState } from "react";
import { Copy, ThumbsUp, ThumbsDown, MessageSquarePlus, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MessageCardProps {
  id: string;
  title: string;
  content: string;
  likes: number;
  dislikes: number;
  userFeedback?: 'like' | 'dislike' | null;
  deliveryType?: 'audio' | 'call' | 'text';
  onCopy: () => void;
  onLike: () => void;
  onDislike: () => void;
  onSuggest: (suggestion: string) => void;
}

export function MessageCard({
  title,
  content,
  likes,
  dislikes,
  userFeedback = null,
  deliveryType = 'text',
  onCopy,
  onLike,
  onDislike,
  onSuggest,
}: MessageCardProps) {
  const [copied, setCopied] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    onLike();
  };

  const handleDislike = () => {
    onDislike();
  };

  const handleSuggestion = () => {
    if (suggestion.trim().length > 0 && suggestion.length <= 200) {
      onSuggest(suggestion);
      setSuggestion("");
      setDialogOpen(false);
    }
  };

  const totalFeedback = likes + dislikes;
  const approvalRate = totalFeedback > 0 ? Math.round((likes / totalFeedback) * 100) : 0;

  return (
    <Card className="group relative overflow-hidden bg-background border rounded-xl shadow-[0px_2px_6px_rgba(0,0,0,0.05)] hover:shadow-[0_3px_8px_rgba(var(--primary)/0.08)] hover:border-primary/30 transition-smooth">
      <div className="p-[18px]">
        {/* WhatsApp Icon + Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-whatsapp shrink-0">
            <svg
              viewBox="0 0 24 24"
              className="h-[14px] w-[14px] fill-white"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        
        {/* Delivery Type Badge */}
        <Badge 
          variant="outline"
          className="mb-3 border-primary text-primary bg-transparent rounded-md px-[6px] py-[2px] text-[11px] font-medium"
        >
          {deliveryType === 'audio' ? '🎵 Áudio' :
           deliveryType === 'call' ? '📞 Ligação' :
           '💬 Texto'}
        </Badge>

        {/* Content */}
        <p className="mb-4 text-sm text-muted-foreground leading-[1.5em] whitespace-pre-wrap">
          {content}
        </p>

        {/* Separator Line */}
        <div className="h-px bg-border mb-3" />

        {/* Stats */}
        <div className="mb-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3.5 w-3.5" />
              {likes}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsDown className="h-3.5 w-3.5" />
              {dislikes}
            </span>
          </div>
          {totalFeedback > 0 && (
            <span className="font-semibold text-primary text-xs">{approvalRate}% aprovação</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2">
          {/* Feedback icons à esquerda */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleLike}
              className={`h-9 w-9 transition-smooth ${
                userFeedback === "like" 
                  ? "bg-green-500 hover:bg-green-600 text-white border-green-500" 
                  : "text-muted-foreground hover:bg-green-50 hover:border-green-500 hover:text-green-600"
              }`}
              title="Gostei"
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={handleDislike}
              className={`h-9 w-9 transition-smooth ${
                userFeedback === "dislike" 
                  ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500" 
                  : "text-muted-foreground hover:bg-orange-50 hover:border-orange-500 hover:text-orange-600"
              }`}
              title="Não gostei"
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-9 w-9 text-muted-foreground hover:bg-primary/10 hover:border-primary hover:text-primary transition-smooth"
                  title="Sugerir melhoria"
                >
                  <MessageSquarePlus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Sugerir melhoria</DialogTitle>
                  <DialogDescription>
                    Compartilhe sua ideia para melhorar esta mensagem (máximo 200 caracteres).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Ex: Adicionar informação sobre localização..."
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value.slice(0, 200))}
                    maxLength={200}
                    rows={4}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {suggestion.length}/200 caracteres
                    </span>
                    <Button
                      onClick={handleSuggestion}
                      disabled={suggestion.trim().length === 0}
                    >
                      Enviar sugestão
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Botão copiar à direita */}
          <Button
            onClick={handleCopy}
            variant="default"
            size="sm"
            className="bg-primary text-primary-foreground border-primary hover:bg-primary/90 shadow-comarc hover:shadow-comarc-hover transition-smooth gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
