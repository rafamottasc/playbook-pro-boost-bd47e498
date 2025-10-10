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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileUpload } from "./FileUpload";
import { ExternalLink, Trash2, Plus, BookOpen, Building2, FileIcon, Pencil, AlertCircle } from "lucide-react";
import { formatPhone, unformatPhone } from "@/lib/utils";

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
  categoryId?: string | null;
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
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [activeTab, setActiveTab] = useState("dados");
  const [currentPartner, setCurrentPartner] = useState<any>(null);

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
    loadCategories();
    
    // Setup realtime para categorias
    const channel = supabase
      .channel("partner-modal-categories")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partners_categories" },
        () => {
          console.log("Categoria mudou - atualizando select");
          loadCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (categoryId) {
      setSelectedCategoryId(categoryId);
    }
  }, [categoryId]);

  useEffect(() => {
    if (partner) {
      setCurrentPartner(partner);
      form.reset({
        name: partner.name,
        manager_name: partner.manager_name || "",
        manager_email: partner.manager_email || "",
        manager_phone: formatPhone(partner.manager_phone || ""),
        drive_link: partner.drive_link || "",
        observations: partner.observations || "",
      });
      loadLinks();
      loadFiles();
    } else {
      setCurrentPartner(null);
      form.reset();
      setLinks([]);
      setFiles([]);
    }
  }, [partner]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from("partners_categories")
      .select("*")
      .eq("active", true)
      .order("display_order");
    setCategories(data || []);
  };

  const loadLinks = async () => {
    if (!currentPartner) return;
    const { data } = await supabase
      .from("partner_links")
      .select("*")
      .eq("partner_id", currentPartner.id);
    setLinks(data || []);
  };

  const loadFiles = async () => {
    if (!currentPartner) return;
    const { data } = await supabase
      .from("partner_files")
      .select("*")
      .eq("partner_id", currentPartner.id)
      .order("created_at", { ascending: false });
    setFiles(data || []);
  };

  const onSubmit = async (data: PartnerFormData) => {
    const finalCategoryId = categoryId || selectedCategoryId;
    
    if (!finalCategoryId) {
      toast.error("Selecione uma categoria");
      return;
    }

    setLoading(true);
    try {
      console.log("Salvando construtora:", data);
      
      if (partner) {
        const { error } = await supabase
          .from("partners")
          .update({
            ...data,
            manager_phone: data.manager_phone ? unformatPhone(data.manager_phone) : null
          })
          .eq("id", partner.id);
        if (error) throw error;
        toast.success("Construtora atualizada com sucesso!");
        onSuccess();
        onOpenChange(false);
      } else {
        const { data: newPartner, error } = await supabase
          .from("partners")
          .insert({ 
            ...data, 
            category_id: finalCategoryId,
            manager_phone: data.manager_phone ? unformatPhone(data.manager_phone) : null
          })
          .select()
          .single();
        
        if (error) throw error;
        console.log("Construtora criada:", newPartner);
        toast.success("✅ Construtora criada! Agora adicione materiais na aba ao lado →");

        // Atualizar estado local com a nova construtora
        setCurrentPartner(newPartner);

        // Atualizar form com os dados do novo partner
        form.reset(newPartner);

        // Mudar automaticamente para aba Materiais
        setActiveTab("recursos");

        onSuccess();
        // NÃO fecha o modal para nova construtora
      }
    } catch (error: any) {
      console.error("Erro ao salvar construtora:", error);
      toast.error(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInlineCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const { data, error } = await supabase
        .from("partners_categories")
        .insert({ 
          name: newCategoryName, 
          active: true,
          display_order: 0 
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Categoria criada!");
      setSelectedCategoryId(data.id);
      loadCategories();
      setNewCategoryName("");
    } catch (error: any) {
      toast.error(`Erro ao criar categoria: ${error.message}`);
    }
  };

  const addLink = async () => {
    if (!currentPartner || !newLink.title || !newLink.url) return;
    
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
        partner_id: currentPartner.id, 
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados">Dados Básicos</TabsTrigger>
            <TabsTrigger value="recursos">
              Materiais & Links
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {!partner && !categoryId && (
                  <div className="space-y-2">
                    <FormLabel>Categoria *</FormLabel>
                    
                    {categories.length === 0 ? (
                      <div className="border rounded-lg p-4 space-y-3 bg-muted/50">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                          <p className="font-medium">Primeira categoria necessária</p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Crie a primeira categoria para organizar suas construtoras:
                        </p>
                        <Input 
                          placeholder="Nome da categoria (ex: Alto Padrão, Econômico...)"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <Button 
                          size="sm" 
                          onClick={handleCreateInlineCategory}
                          disabled={!newCategoryName.trim()}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Categoria e Continuar
                        </Button>
                      </div>
                    ) : (
                      <Select 
                        value={selectedCategoryId} 
                        onValueChange={setSelectedCategoryId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}

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
                          <Input 
                            {...field} 
                            placeholder="(47) 99663-3255"
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
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
          {currentPartner ? (
              <>
                {/* Seção de Materiais */}
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Materiais
                  </h3>
                  <FileUpload 
                    partnerId={currentPartner.id} 
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
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(file.file_url, '_blank')}
                          >
                            👁️ Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={file.file_url} download={file.file_name}>
                              ⬇️ Download
                            </a>
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
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="w-full mt-4"
                >
                  Concluir e Fechar
                </Button>
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
