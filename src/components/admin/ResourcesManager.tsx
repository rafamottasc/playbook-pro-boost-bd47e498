import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, ExternalLink, FileText, Video, Link, Upload, FolderOpen, Image, Sheet } from "lucide-react";
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
  category?: string; // Manter para compatibilidade
  category_id: string | null;
  display_order: number;
  created_at: string;
  file_name?: string;
  file_size?: number;
}

interface ResourceCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  active: boolean;
}

const RESOURCE_TYPES = [
  { id: "pdf", name: "PDF", icon: FileText },
  { id: "word", name: "Word", icon: FileText },
  { id: "excel", name: "Excel", icon: Sheet },
  { id: "link", name: "Link", icon: Link },
  { id: "video", name: "Vídeo", icon: Video },
  { id: "image", name: "Imagem", icon: Image },
];

export function ResourcesManager() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  
  // Estados para categorias
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ResourceCategory | null>(null);
  const [deleteCategoryConfirmOpen, setDeleteCategoryConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    display_order: 0,
    active: true,
  });
  
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    resource_type: "pdf",
    category_id: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadResources();
    loadCategories();
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
      logger.error("Erro ao carregar recursos", { 
        action: "load_resources", 
        metadata: { error: error.message } 
      });
      toast({
        title: "Erro ao carregar recursos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("resource_categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      logger.error("Erro ao carregar categorias", { 
        action: "load_categories", 
        metadata: { error: error.message } 
      });
      toast({
        title: "Erro ao carregar categorias",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getResourcesByCategory = (categoryId: string) => {
    return resources.filter(r => r.category_id === categoryId);
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
            category_id: formData.category_id,
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
            category_id: formData.category_id,
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
      logger.error("Erro ao salvar recurso", { 
        action: "save_resource", 
        metadata: { error: error.message, isEditing: !!editingResource } 
      });
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
      // Buscar e deletar arquivo do storage se for PDF ou imagem
      const { data: resource } = await supabase
        .from("resources")
        .select('url, resource_type')
        .eq("id", resourceToDelete)
        .single();

      if (resource && ['pdf', 'word', 'excel', 'image'].includes(resource.resource_type)) {
        const filePath = resource.url.split('/resources/')[1];
        if (filePath) {
          await supabase.storage.from('resources').remove([filePath]);
        }
      }

      // Deletar recurso
      const { error } = await supabase.from("resources").delete().eq("id", resourceToDelete);
      if (error) throw error;

      toast({ title: "Recurso e arquivos excluídos!" });
      loadResources();
    } catch (error: any) {
      logger.error("Erro ao excluir recurso", { 
        action: "delete_resource", 
        metadata: { error: error.message, resourceId: resourceToDelete } 
      });
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
      category_id: resource.category_id || "",
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
      category_id: categories.length > 0 ? categories[0].id : "",
    });
  };

  // Funções para categorias
  const handleSaveCategory = async () => {
    try {
      if (!categoryFormData.name.trim()) {
        toast({
          title: "Erro",
          description: "O nome da categoria é obrigatório",
          variant: "destructive",
        });
        return;
      }

      if (editingCategory) {
        const { error } = await supabase
          .from("resource_categories")
          .update(categoryFormData)
          .eq("id", editingCategory.id);
        if (error) throw error;
        toast({ title: "Categoria atualizada!" });
      } else {
        const { error } = await supabase
          .from("resource_categories")
          .insert([categoryFormData]);
        if (error) throw error;
        toast({ title: "Categoria criada!" });
      }

      setCategoryDialogOpen(false);
      resetCategoryForm();
      loadCategories();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar categoria",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditCategory = (category: ResourceCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || "",
      display_order: category.display_order,
      active: category.active,
    });
    setCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    setCategoryToDelete(id);
    setDeleteCategoryConfirmOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      // Verificar se há recursos vinculados
      const { count } = await supabase
        .from("resources")
        .select("*", { count: "exact", head: true })
        .eq("category_id", categoryToDelete);

      if (count && count > 0) {
        toast({
          title: "Erro ao deletar",
          description: `Existem ${count} recursos vinculados a esta categoria.`,
          variant: "destructive",
        });
        setDeleteCategoryConfirmOpen(false);
        setCategoryToDelete(null);
        return;
      }

      const { error } = await supabase
        .from("resource_categories")
        .delete()
        .eq("id", categoryToDelete);

      if (error) throw error;
      toast({ title: "Categoria excluída!" });
      loadCategories();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir categoria",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteCategoryConfirmOpen(false);
      setCategoryToDelete(null);
    }
  };

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: "",
      description: "",
      display_order: categories.length,
      active: true,
    });
  };

  const requiresFileUpload = () => {
    return ["pdf", "word", "excel", "image"].includes(formData.resource_type);
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Recursos</h2>
        <p className="text-muted-foreground">
          Organize materiais digitais e administrativos para os corretores.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={resetCategoryForm}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DraggableDialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Edite os campos abaixo"
                  : "Preencha para adicionar uma nova categoria"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cat_name">Nome</Label>
                <Input
                  id="cat_name"
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, name: e.target.value })
                  }
                  placeholder="Ex: Documentos Jurídicos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat_description">Descrição (opcional)</Label>
                <Textarea
                  id="cat_description"
                  value={categoryFormData.description}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, description: e.target.value })
                  }
                  placeholder="Descreva o tipo de recursos..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat_order">Ordem de Exibição</Label>
                <Input
                  id="cat_order"
                  type="number"
                  value={categoryFormData.display_order}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      display_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveCategory}>Salvar</Button>
              </div>
            </div>
          </DraggableDialogContent>
        </Dialog>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
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
                  value={formData.category_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
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
                    <SelectValue>
                      {formData.resource_type && (
                        <div className="flex items-center gap-2">
                          {React.createElement(
                            RESOURCE_TYPES.find(t => t.id === formData.resource_type)?.icon || FileText,
                            { className: "h-4 w-4" }
                          )}
                          <span>
                            {RESOURCE_TYPES.find(t => t.id === formData.resource_type)?.name}
                          </span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          {React.createElement(type.icon, { className: "h-4 w-4" })}
                          <span>{type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {requiresFileUpload() ? (
                <div className="space-y-2">
                  <Label htmlFor="file">Upload de Arquivo</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <Input
                      id="file"
                      type="file"
                      accept={formData.resource_type === "pdf" ? ".pdf" : formData.resource_type === "word" ? ".doc,.docx" : formData.resource_type === "excel" ? ".xls,.xlsx,.csv" : "image/*"}
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="pl-10"
                    />
                  </div>
                  {selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-accent/50 rounded-md border">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedFile(null)}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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

      {/* Seção de Categorias */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Categorias
        </h3>
        
        {categories.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Nenhuma categoria cadastrada ainda</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-primary bg-primary/5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{category.name}</h4>
                      <Badge variant={category.active ? "default" : "secondary"}>
                        {category.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum recurso cadastrado ainda
          </p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Nenhuma categoria disponível. Crie categorias na aba "Categorias" primeiro.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryResources = getResourcesByCategory(category.id);
            if (categoryResources.length === 0) return null;
            
            return (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b mt-8">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    ({categoryResources.length} {categoryResources.length === 1 ? 'recurso' : 'recursos'})
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

      {/* AlertDialog para excluir recurso */}
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

      {/* AlertDialog para excluir categoria */}
      <AlertDialog open={deleteCategoryConfirmOpen} onOpenChange={setDeleteCategoryConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão de categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Se houver recursos vinculados, a categoria não poderá ser excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCategory}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
