import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, ExternalLink, FileText, Video, Link, Upload } from "lucide-react";
import {
  Dialog,
  DraggableDialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  resource_type: string;
  category: string;
  display_order: number;
  created_at: string;
  file_name?: string;
  file_size?: number;
}

const RESOURCE_TYPES = [
  { id: "pdf", name: "PDF", icon: FileText },
  { id: "link", name: "Link", icon: Link },
  { id: "video", name: "Vídeo", icon: Video },
  { id: "image", name: "Imagem", icon: FileText },
];

const CATEGORIES = [
  { id: "administrativo", name: "Materiais Administrativos" },
  { id: "digital", name: "Material Digital" },
];

export function ResourcesManager() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    resource_type: "pdf",
    category: "administrativo" as "administrativo" | "digital",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar recursos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getResourcesByCategory = (category: string) => {
    return resources.filter(r => r.category === category);
  };

  const handleFileUpload = async (): Promise<{ url: string; fileName: string; fileSize: number } | null> => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      
      // Sanitizar nome do arquivo
      const sanitizedName = selectedFile.name
        .normalize('NFD') // Remove acentos
        .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
        .replace(/[^a-zA-Z0-9.-]/g, '_') // Substitui caracteres especiais por _
        .replace(/\s+/g, '_'); // Substitui espaços por _
      
      const fileName = `${Date.now()}-${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('resources')
        .getPublicUrl(fileName);

      return { url: data.publicUrl, fileName: selectedFile.name, fileSize: selectedFile.size };
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const normalizeUrl = (url: string): string => {
    if (!url) return url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return `https://${url}`;
  };

  const handleSave = async () => {
    try {
      let finalUrl = formData.url;
      let fileName: string | undefined;
      let fileSize: number | undefined;

      // Se há arquivo selecionado, fazer upload
      if (selectedFile) {
        const uploadResult = await handleFileUpload();
        if (!uploadResult) return;
        finalUrl = uploadResult.url;
        fileName = uploadResult.fileName;
        fileSize = uploadResult.fileSize;
      } else if (finalUrl) {
        // Normalizar URL se for link ou vídeo
        finalUrl = normalizeUrl(finalUrl);
      }

      if (editingResource) {
        const { error } = await supabase
          .from("resources")
          .update({
            title: formData.title,
            description: formData.description,
            url: finalUrl,
            resource_type: formData.resource_type,
            category: formData.category,
            file_name: fileName,
            file_size: fileSize,
          })
          .eq("id", editingResource.id);

        if (error) throw error;
        toast({ title: "Recurso atualizado com sucesso!" });
      } else {
        const { error } = await supabase.from("resources").insert([
          {
            title: formData.title,
            description: formData.description,
            url: finalUrl,
            resource_type: formData.resource_type,
            category: formData.category,
            display_order: resources.length,
            file_name: fileName,
            file_size: fileSize,
          },
        ]);

        if (error) throw error;
        toast({ title: "Recurso criado com sucesso!" });
      }

      loadResources();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar recurso",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    setResourceToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!resourceToDelete) return;

    try {
      const { error } = await supabase.from("resources").delete().eq("id", resourceToDelete);
      if (error) throw error;

      toast({ title: "Recurso excluído com sucesso!" });
      loadResources();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir recurso",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setResourceToDelete(null);
    }
  };

  const openEditDialog = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || "",
      url: resource.url,
      resource_type: resource.resource_type,
      category: resource.category as "administrativo" | "digital",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingResource(null);
    setSelectedFile(null);
    setFormData({
      title: "",
      description: "",
      url: "",
      resource_type: "pdf",
      category: "administrativo",
    });
  };

  const requiresFileUpload = () => {
    return formData.resource_type === "pdf" || formData.resource_type === "image";
  };

  const getResourceIcon = (type: string) => {
    const resourceType = RESOURCE_TYPES.find((t) => t.id === type);
    const Icon = resourceType?.icon || FileText;
    return <Icon className="h-5 w-5" />;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold">Recursos Educativos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Recurso
            </Button>
          </DialogTrigger>
          <DraggableDialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingResource ? "Editar Recurso" : "Novo Recurso"}
              </DialogTitle>
              <DialogDescription>
                {editingResource
                  ? "Edite os campos abaixo para atualizar o recurso"
                  : "Preencha os campos para adicionar um novo recurso"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Guia Completo de Vendas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value as "administrativo" | "digital" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resource_type">Tipo de Recurso</Label>
                <Select
                  value={formData.resource_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, resource_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {requiresFileUpload() ? (
                <div className="space-y-2">
                  <Label htmlFor="file">Upload de Arquivo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="file"
                      type="file"
                      accept={formData.resource_type === "pdf" ? ".pdf" : "image/*"}
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="flex-1"
                    />
                    {selectedFile && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedFile(null)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Arquivo selecionado: {selectedFile.name}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="url">URL / Link</Label>
                  <Input
                    id="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder={
                      formData.resource_type === "video"
                        ? "https://youtube.com/watch?v=..."
                        : "https://..."
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData.resource_type === "video"
                      ? "Cole o link do YouTube"
                      : "Cole o link do recurso"}
                  </p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descreva brevemente o conteúdo deste recurso..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={uploading}>
                  {uploading ? "Enviando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DraggableDialogContent>
        </Dialog>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum recurso cadastrado ainda
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {CATEGORIES.map((category) => {
            const categoryResources = getResourcesByCategory(category.id);
            if (categoryResources.length === 0) return null;
            
            return (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    ({categoryResources.length})
                  </span>
                </div>
                
                <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
                  {categoryResources.map((resource) => (
                    <Card key={resource.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="text-primary">
                          {getResourceIcon(resource.resource_type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold truncate">{resource.title}</h4>
                              {resource.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {resource.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs text-muted-foreground">
                                  Adicionado em {new Date(resource.created_at).toLocaleDateString("pt-BR")}
                                </span>
                                <div className="flex gap-3">
                                   <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary hover:underline flex items-center gap-1"
                                  >
                                    {resource.resource_type === "link" ? "Abrir" : "Visualizar"}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                  {(resource.resource_type === "pdf" || resource.resource_type === "image") && (
                                    <a
                                      href={`${resource.url}?download`}
                                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                      Baixar
                                      <Upload className="h-3 w-3 rotate-180" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditDialog(resource)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editar recurso</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleDelete(resource.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Excluir recurso</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este recurso? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
