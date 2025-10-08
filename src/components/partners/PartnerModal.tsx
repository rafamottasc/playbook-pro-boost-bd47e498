import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileUpload } from "./FileUpload";
import { ExternalLink, Trash2, Plus, BookOpen, Building2, FileIcon, Pencil } from "lucide-react";

const normalizeUrl = (url: string): string => {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed.match(/^https?:\/\//)) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

const partnerSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  manager_name: z.string().optional(),
  manager_phone: z.string().optional(),
  manager_email: z.string().email("Email inválido").optional().or(z.literal("")),
  observations: z.string().optional(),
  active: z.boolean(),
  drive_link: z.string()
    .transform((val) => {
      if (!val) return "";
      // Se não começar com http:// ou https://, adiciona https://
      if (val && !val.match(/^https?:\/\//)) {
        return `https://${val}`;
      }
      return val;
    })
    .pipe(z.string().url("Link do Google Drive inválido").or(z.literal(""))),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

interface PartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  partner?: any;
  onSuccess: () => void;
}

export function PartnerModal({
  open,
  onOpenChange,
  categoryId,
  partner,
  onSuccess,
}: PartnerModalProps) {
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<any[]>([]);
  const [newLink, setNewLink] = useState({ title: "", url: "" });
  const [files, setFiles] = useState<any[]>([]);
  const [editingLink, setEditingLink] = useState<any>(null);

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: "",
      manager_name: "",
      manager_phone: "",
      manager_email: "",
      observations: "",
      active: true,
      drive_link: "",
    },
  });

  useEffect(() => {
    if (partner) {
      form.reset({
        name: partner.name,
        manager_name: partner.manager_name || "",
        manager_phone: partner.manager_phone || "",
        manager_email: partner.manager_email || "",
        observations: partner.observations || "",
        active: partner.active,
        drive_link: partner.drive_link || "",
      });
      loadLinks();
      loadFiles();
    } else {
      form.reset();
      setLinks([]);
      setFiles([]);
    }
  }, [partner]);

  const loadLinks = async () => {
    if (!partner) return;
    const { data } = await supabase
      .from("partner_links")
      .select("*")
      .eq("partner_id", partner.id);
    setLinks(data || []);
  };

  const loadFiles = async () => {
    if (!partner) return;
    const { data } = await supabase
      .from("partner_files")
      .select("*")
      .eq("partner_id", partner.id)
      .order("created_at", { ascending: false });
    setFiles(data || []);
  };

  const onSubmit = async (data: PartnerFormData) => {
    setLoading(true);
    try {
      console.log("Salvando construtora:", data);
      
      if (partner) {
        const { error } = await supabase
          .from("partners")
          .update(data)
          .eq("id", partner.id);
        if (error) throw error;
        toast.success("Construtora atualizada com sucesso!");
      } else {
        const { data: newPartner, error } = await supabase
          .from("partners")
          .insert({ ...data, category_id: categoryId })
          .select()
          .single();
        
        if (error) throw error;
        console.log("Construtora criada:", newPartner);
        toast.success("Construtora criada com sucesso! Agora você pode adicionar materiais e links.");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar construtora:", error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addLink = async () => {
    if (!partner || !newLink.title || !newLink.url) return;
    
    // Normalizar URL antes de salvar
    const normalizedUrl = normalizeUrl(newLink.url);
    
    // Validar se é uma URL válida
    try {
      new URL(normalizedUrl);
    } catch {
      toast.error("URL inválida. Ex: https://exemplo.com ou apenas exemplo.com");
      return;
    }
    
    const { error } = await supabase
      .from("partner_links")
      .insert({ 
        partner_id: partner.id, 
        title: newLink.title,
        url: normalizedUrl 
      });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Link adicionado");
      setNewLink({ title: "", url: "" });
      loadLinks();
    }
  };

  const deleteLink = async (linkId: string) => {
    const { error } = await supabase
      .from("partner_links")
      .delete()
      .eq("id", linkId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Link removido");
      loadLinks();
    }
  };

  const updateLink = async () => {
    if (!editingLink || !editingLink.title || !editingLink.url) return;
    
    const normalizedUrl = normalizeUrl(editingLink.url);
    
    try {
      new URL(normalizedUrl);
    } catch {
      toast.error("URL inválida");
      return;
    }
    
    const { error } = await supabase
      .from("partner_links")
      .update({ 
        title: editingLink.title,
        url: normalizedUrl 
      })
      .eq("id", editingLink.id);
      
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Link atualizado");
      setEditingLink(null);
      loadLinks();
    }
  };

  const deleteFile = async (file: any) => {
    try {
      const filePath = file.file_url.split('/partner-files/')[1];
      
      const { error: storageError } = await supabase.storage
        .from('partner-files')
        .remove([filePath]);
      
      if (storageError) throw storageError;
      
      const { error: dbError } = await supabase
        .from('partner_files')
        .delete()
        .eq('id', file.id);
      
      if (dbError) throw dbError;
      
      toast.success("Material removido");
      loadFiles();
    } catch (error: any) {
      console.error("Erro ao deletar arquivo:", error);
      toast.error(`Erro ao remover: ${error.message}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {partner ? "Editar Construtora" : "Nova Construtora"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
            <TabsTrigger value="recursos" disabled={!partner}>
              Materiais & Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Construtora</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manager_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Gerente</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="manager_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manager_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="drive_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link do Google Drive</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://drive.google.com/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Construtora Ativa</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="recursos" className="space-y-6 mt-4">
            {partner ? (
              <>
                {/* Seção de Materiais */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Materiais
                  </h3>
                  <FileUpload 
                    partnerId={partner.id} 
                    onUploadComplete={() => {
                      loadLinks();
                      loadFiles();
                    }} 
                  />
                  
                  <div className="space-y-2 mt-4">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileIcon className="h-4 w-4 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(file.file_size / 1024).toFixed(1)} KB • {file.file_type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(file.file_url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFile(file)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Seção de Links */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Links Externos
                  </h3>
                  
                  <div className="space-y-2 mb-4">
                    <Input
                      placeholder="Título do link"
                      value={newLink.title}
                      onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    />
                    <Input
                      placeholder="URL (ex: https://exemplo.com ou exemplo.com)"
                      value={newLink.url}
                      onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    />
                    <Button onClick={addLink} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Link
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {links.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-3 border rounded">
                        {editingLink?.id === link.id ? (
                          <div className="flex-1 space-y-2 mr-2">
                            <Input
                              value={editingLink.title}
                              onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                              placeholder="Título"
                            />
                            <Input
                              value={editingLink.url}
                              onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                              placeholder="URL"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={updateLink}>Salvar</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingLink(null)}>
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-1">
                              <ExternalLink className="h-4 w-4" />
                              <div>
                                <p className="font-medium">{link.title}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-md">{link.url}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingLink(link)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteLink(link.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium mb-1">Salve a construtora primeiro</p>
                <p className="text-sm">Para adicionar materiais e links, você precisa salvar os dados básicos da construtora.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
