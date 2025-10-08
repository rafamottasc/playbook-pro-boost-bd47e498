import React, { useState, useCallback } from "react";
import { Upload, X, FileIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FileUploadProps {
  partnerId: string;
  onUploadComplete: () => void;
}

interface UploadingFile {
  name: string;
  progress: number;
  error?: string;
}

export function FileUpload({ partnerId, onUploadComplete }: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${partnerId}/${Date.now()}-${file.name}`;

    setUploadingFiles(prev => [...prev, { name: file.name, progress: 0 }]);

    try {
      // Upload to storage
      setUploadingFiles(prev =>
        prev.map(f => f.name === file.name ? { ...f, progress: 50 } : f)
      );

      const { error: uploadError, data } = await supabase.storage
        .from('partner-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setUploadingFiles(prev =>
        prev.map(f => f.name === file.name ? { ...f, progress: 100 } : f)
      );

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('partner-files')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('partner_files')
        .insert({
          partner_id: partnerId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_type: fileExt || 'unknown',
          file_size: file.size,
        });

      if (dbError) throw dbError;

      setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
      toast.success(`${file.name} enviado com sucesso`);
      onUploadComplete();
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadingFiles(prev =>
        prev.map(f => f.name === file.name ? { ...f, error: error.message } : f)
      );
      toast.error(`Erro ao enviar ${file.name}`);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(uploadFile);
  }, [partnerId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(uploadFile);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground mb-2">
          Arraste arquivos aqui ou clique para selecionar
        </p>
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button variant="outline" size="sm" asChild>
            <span>Selecionar Arquivos</span>
          </Button>
        </label>
      </div>

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file) => (
            <div key={file.name} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                {file.error ? (
                  <p className="text-xs text-destructive">{file.error}</p>
                ) : (
                  <Progress value={file.progress} className="h-1 mt-1" />
                )}
              </div>
              {file.progress < 100 && !file.error && (
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
