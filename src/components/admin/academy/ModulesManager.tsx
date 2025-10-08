import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, GraduationCap, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { resizeImage, validateImageFile } from "@/lib/imageUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Module {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  display_order: number;
  published: boolean;
}

export function ModulesManager() {
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cover_url: "",
    display_order: 0,
    published: false
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('academy_modules')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: "Erro",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setCoverFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile) return formData.cover_url;

    try {
      setUploading(true);
      
      // Redimensionar imagem para 400x600px (formato Netflix)
      const resizedBlob = await resizeImage(coverFile, 400, 600);
      
      // Gerar nome único
      const fileExt = coverFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('academy-covers')
        .upload(filePath, resizedBlob, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('academy-covers')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Upload da capa se houver
      const coverUrl = await uploadCover();
      if (coverFile && !coverUrl) return; // Falhou no upload

      const dataToSave = {
        ...formData,
        cover_url: coverUrl || formData.cover_url
      };

      if (editingModule) {
        const { error } = await supabase
          .from('academy_modules')
          .update(dataToSave)
          .eq('id', editingModule.id);

        if (error) throw error;
        toast({ title: "Módulo atualizado!" });
      } else {
        const { error } = await supabase
          .from('academy_modules')
          .insert(dataToSave);

        if (error) throw error;
        toast({ title: "Módulo criado!" });
      }

      setDialogOpen(false);
      setEditingModule(null);
      setFormData({ title: "", description: "", cover_url: "", display_order: 0, published: false });
      setCoverFile(null);
      setCoverPreview(null);
      fetchModules();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (module: Module) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description || "",
      cover_url: module.cover_url || "",
      display_order: module.display_order,
      published: module.published
    });
    setCoverPreview(module.cover_url);
    setDialogOpen(true);
  };

  const togglePublished = async (module: Module) => {
    try {
      const { error } = await supabase
        .from('academy_modules')
        .update({ published: !module.published })
        .eq('id', module.id);

      if (error) throw error;
      
      toast({ 
        title: module.published ? "Módulo despublicado" : "Módulo publicado!",
        description: module.published 
          ? "Os usuários não verão mais este módulo" 
          : "Os usuários agora podem ver este módulo"
      });
      
      fetchModules();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este módulo?")) return;

    try {
      const { error } = await supabase
        .from('academy_modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Módulo excluído!" });
      fetchModules();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredModules = modules.filter(m => {
    if (filterStatus === 'published') return m.published;
    if (filterStatus === 'draft') return !m.published;
    return true;
  });

  const publishedCount = modules.filter(m => m.published).length;
  const draftCount = modules.filter(m => !m.published).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-semibold">Módulos de Treinamento</h3>
          <p className="text-sm text-muted-foreground">
            {modules.length} total • {publishedCount} publicados • {draftCount} rascunhos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingModule(null);
              setFormData({ title: "", description: "", cover_url: "", display_order: modules.length, published: false });
              setCoverFile(null);
              setCoverPreview(null);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Módulo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingModule ? "Editar Módulo" : "Novo Módulo"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="cover">Capa do Módulo (400x600px)</Label>
                <div className="space-y-3">
                  <Input
                    id="cover"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileChange}
                  />
                  {coverPreview && (
                    <div className="relative w-32 h-48 rounded-lg overflow-hidden border">
                      <img 
                        src={coverPreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG ou WEBP • Máx 2MB • Será redimensionada para 400x600px
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="display_order">Ordem</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="published">Publicado</Label>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? "Enviando..." : editingModule ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 mb-4">
        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('all')}
        >
          Todos ({modules.length})
        </Button>
        <Button
          variant={filterStatus === 'published' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('published')}
        >
          Publicados ({publishedCount})
        </Button>
        <Button
          variant={filterStatus === 'draft' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterStatus('draft')}
        >
          Rascunhos ({draftCount})
        </Button>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : filteredModules.length === 0 ? (
        <Card className="p-12 text-center">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {filterStatus === 'all' ? 'Nenhum módulo cadastrado' : `Nenhum módulo ${filterStatus === 'published' ? 'publicado' : 'rascunho'}`}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {filteredModules.map((module) => (
            <Card key={module.id} className="p-4">
              {module.cover_url && (
                <div className="mb-3 rounded-lg overflow-hidden aspect-[2/3]">
                  <img 
                    src={module.cover_url} 
                    alt={module.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-base line-clamp-2 flex-1">{module.title}</h4>
                  <Badge variant={module.published ? "default" : "secondary"} className="ml-2">
                    {module.published ? "Publicado" : "Rascunho"}
                  </Badge>
                </div>
                
                {module.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {module.description}
                  </p>
                )}
                
                <div className="flex gap-1 pt-2 border-t">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => togglePublished(module)}
                        >
                          {module.published ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{module.published ? "Despublicar" : "Publicar"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEdit(module)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar módulo</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDelete(module.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Excluir módulo</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
