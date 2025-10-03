import { useState, useEffect } from "react";
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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  resource_type: string;
  display_order: number;
}

const RESOURCE_TYPES = [
  { id: "pdf", name: "PDF", icon: FileText },
  { id: "link", name: "Link", icon: Link },
  { id: "video", name: "Vídeo", icon: Video },
];

export function ResourcesManager() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    resource_type: "pdf",
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
        .order("display_order");

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

  const handleFileUpload = async (): Promise<string | null> => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('resources')
        .getPublicUrl(fileName);

      return data.publicUrl;
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

      // Se há arquivo selecionado, fazer upload
      if (selectedFile) {
        const uploadedUrl = await handleFileUpload();
        if (!uploadedUrl) return;
        finalUrl = uploadedUrl;
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
            display_order: resources.length,
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
    if (!confirm("Tem certeza que deseja excluir este recurso?")) return;

    try {
      const { error } = await supabase.from("resources").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Recurso excluído com sucesso!" });
      loadResources();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir recurso",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || "",
      url: resource.url,
      resource_type: resource.resource_type,
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
    });
  };

  const requiresFileUpload = () => {
    return formData.resource_type === "pdf";
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recursos Educativos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Recurso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
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
                      accept=".pdf,image/*"
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
          </DialogContent>
        </Dialog>
      </div>

      {resources.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Nenhum recurso cadastrado ainda
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {resources.map((resource) => (
            <Card key={resource.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="text-comarc-green">
                  {getResourceIcon(resource.resource_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {resource.description}
                      </p>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-comarc-green hover:underline flex items-center gap-1 mt-1"
                      >
                        Abrir recurso
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(resource)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(resource.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
