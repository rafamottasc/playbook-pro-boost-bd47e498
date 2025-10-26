import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const MAX_ATTACHMENTS = 6;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export function useTaskAttachments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ taskId, file }: { taskId: string; file: File }) => {
      // Get current attachments count
      const { count } = await supabase
        .from('task_attachments')
        .select('id', { count: 'exact', head: true })
        .eq('task_id', taskId);

      if (count && count >= MAX_ATTACHMENTS) {
        throw new Error(`Limite de ${MAX_ATTACHMENTS} anexos atingido`);
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error('Arquivo muito grande. Máximo: 10MB');
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Tipo de arquivo não permitido. Use: PDF, JPG, PNG ou WEBP');
      }

      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Upload to storage
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `${user.id}/${taskId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('task-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('task-attachments')
        .getPublicUrl(filePath);

      // Determine file type
      let fileType: 'pdf' | 'image' | 'other' = 'other';
      if (file.type === 'application/pdf') fileType = 'pdf';
      else if (file.type.startsWith('image/')) fileType = 'image';

      // Insert attachment record
      const { error: dbError } = await supabase
        .from('task_attachments')
        .insert([{
          task_id: taskId,
          title: file.name,
          attachment_type: 'file',
          file_url: publicUrl,
          file_type: fileType,
          file_size: file.size,
        }]);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      toast({ title: "Arquivo anexado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao anexar arquivo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add link mutation
  const addLinkMutation = useMutation({
    mutationFn: async ({ taskId, title, url }: { taskId: string; title: string; url: string }) => {
      // Get current attachments count
      const { count } = await supabase
        .from('task_attachments')
        .select('id', { count: 'exact', head: true })
        .eq('task_id', taskId);

      if (count && count >= MAX_ATTACHMENTS) {
        throw new Error(`Limite de ${MAX_ATTACHMENTS} anexos atingido`);
      }

      // Validate URL
      const urlPattern = /^https?:\/\/.+/i;
      if (!urlPattern.test(url)) {
        throw new Error('URL inválida. Deve começar com http:// ou https://');
      }

      // Insert link record
      const { error } = await supabase
        .from('task_attachments')
        .insert([{
          task_id: taskId,
          title,
          attachment_type: 'link',
          url,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      toast({ title: "Link adicionado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete attachment mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachment: { id: string; attachment_type: 'file' | 'link'; file_url?: string }) => {
      // If file, delete from storage first
      if (attachment.attachment_type === 'file' && attachment.file_url) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Extract path from URL
          const urlParts = attachment.file_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const taskId = urlParts[urlParts.length - 2];
          const filePath = `${user.id}/${taskId}/${fileName}`;

          await supabase.storage
            .from('task-attachments')
            .remove([filePath]);
        }
      }

      // Delete record from database
      const { error } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', attachment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      toast({ title: "Anexo removido" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover anexo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    uploadFile: uploadFileMutation.mutate,
    isUploading: uploadFileMutation.isPending,
    addLink: addLinkMutation.mutate,
    isAddingLink: addLinkMutation.isPending,
    deleteAttachment: deleteAttachmentMutation.mutate,
  };
}
