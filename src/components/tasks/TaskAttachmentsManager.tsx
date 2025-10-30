import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Link as LinkIcon, FileText, Image as ImageIcon, File, Trash2 } from "lucide-react";
import { useTaskAttachments } from "@/hooks/useTaskAttachments";
import type { TaskAttachment } from "@/hooks/useTasks";

interface TaskAttachmentsManagerProps {
  taskId: string;
  attachments: TaskAttachment[];
  readonly?: boolean;
}

// Função para normalizar URLs
const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  
  // Se já tem protocolo, retorna como está
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  
  // Se parece com URL mas não tem protocolo, adiciona https://
  if (/^[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  
  return trimmed;
};

export function TaskAttachmentsManager({ taskId, attachments, readonly = false }: TaskAttachmentsManagerProps) {
  const { uploadFile, isUploading, addLink, isAddingLink, deleteAttachment } = useTaskAttachments();
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile({ taskId, file });
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddLink = () => {
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    const normalizedUrl = normalizeUrl(linkUrl);
    addLink({ taskId, title: linkTitle.trim(), url: normalizedUrl });
    setLinkTitle("");
    setLinkUrl("");
  };

  const getAttachmentIcon = (attachment: TaskAttachment) => {
    if (attachment.attachment_type === 'link') {
      return <LinkIcon className="w-4 h-4 text-blue-500" />;
    }
    if (attachment.file_type === 'pdf') {
      return <FileText className="w-4 h-4 text-red-500" />;
    }
    if (attachment.file_type === 'image') {
      return <ImageIcon className="w-4 h-4 text-green-500" />;
    }
    return <File className="w-4 h-4 text-gray-500" />;
  };

  const limitReached = attachments.length >= 6;

  return (
    <div className="space-y-4">
      {/* Warning se limite atingido */}
      {limitReached && (
        <Alert variant="destructive">
          <AlertDescription>
            Limite de 6 anexos atingido
          </AlertDescription>
        </Alert>
      )}

      {!readonly && (
        <Tabs defaultValue="files">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="files">📁 Arquivos</TabsTrigger>
            <TabsTrigger value="links">🔗 Links</TabsTrigger>
          </TabsList>

          {/* Tab: Upload de Arquivos */}
          <TabsContent value="files">
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => !limitReached && !isUploading && fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">
                {isUploading ? 'Enviando...' : 'Arraste arquivos ou clique para selecionar'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Máx 10MB - PDF, JPG, PNG, WEBP
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileChange}
                disabled={limitReached || isUploading}
              />
            </div>
          </TabsContent>

          {/* Tab: Adicionar Link */}
          <TabsContent value="links">
            <div className="space-y-3">
              <Input 
                placeholder="Título do link" 
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                disabled={limitReached || isAddingLink}
              />
              <Input 
                placeholder="exemplo: google.com.br ou https://google.com.br" 
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                disabled={limitReached || isAddingLink}
              />
              <Button 
                onClick={handleAddLink}
                disabled={!linkTitle.trim() || !linkUrl.trim() || limitReached || isAddingLink}
                className="w-full"
              >
                {isAddingLink ? 'Adicionando...' : 'Adicionar Link'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Lista de Anexos */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Anexos ({attachments.length}/6)</p>
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-2 p-2 bg-muted rounded">
              {getAttachmentIcon(att)}
              <span className="flex-1 text-sm truncate">{att.title}</span>
              
              {readonly ? (
                att.attachment_type === 'file' ? (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={att.file_url} target="_blank" rel="noopener noreferrer">
                      Ver
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={att.url} target="_blank" rel="noopener noreferrer">
                      Abrir
                    </a>
                  </Button>
                )
              ) : (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => deleteAttachment(att)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && readonly && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum anexo
        </p>
      )}
    </div>
  );
}
