import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Play, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { convertYouTubeUrl } from "@/lib/youtube";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Module {
  id: string;
  title: string;
  published: boolean;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration_minutes: number | null;
  points: number;
  display_order: number;
  published: boolean;
}

export function LessonsManager() {
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState({
    module_id: "",
    title: "",
    description: "",
    video_url: "",
    duration_minutes: 0,
    points: 10,
    display_order: 0,
    published: false
  });
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (selectedModule) {
      fetchLessons();
    }
  }, [selectedModule]);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('academy_modules')
        .select('id, title, published')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setModules(data || []);
      if (data && data.length > 0 && !selectedModule) {
        setSelectedModule(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchLessons = async () => {
    if (!selectedModule) return;

    try {
      const { data, error } = await supabase
        .from('academy_lessons')
        .select('*')
        .eq('module_id', selectedModule)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setLessons(data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const embedUrl = convertYouTubeUrl(formData.video_url);

    try {
      if (editingLesson) {
        const { error } = await supabase
          .from('academy_lessons')
          .update({ ...formData, video_url: embedUrl })
          .eq('id', editingLesson.id);

        if (error) throw error;
        toast({ title: "Aula atualizada!" });
      } else {
        const { error } = await supabase
          .from('academy_lessons')
          .insert({ ...formData, video_url: embedUrl, module_id: selectedModule });

        if (error) throw error;
        toast({ title: "Aula criada!" });
      }

      setDialogOpen(false);
      setEditingLesson(null);
      setFormData({
        module_id: "",
        title: "",
        description: "",
        video_url: "",
        duration_minutes: 0,
        points: 10,
        display_order: 0,
        published: false
      });
      fetchLessons();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      module_id: lesson.module_id,
      title: lesson.title,
      description: lesson.description || "",
      video_url: lesson.video_url,
      duration_minutes: lesson.duration_minutes || 0,
      points: lesson.points,
      display_order: lesson.display_order,
      published: lesson.published
    });
    setDialogOpen(true);
  };

  const togglePublished = async (lesson: Lesson) => {
    try {
      const { error } = await supabase
        .from('academy_lessons')
        .update({ published: !lesson.published })
        .eq('id', lesson.id);

      if (error) throw error;
      
      toast({ 
        title: lesson.published ? "Aula despublicada" : "Aula publicada!",
        description: lesson.published 
          ? "Os usuários não verão mais esta aula" 
          : "Os usuários agora podem ver esta aula"
      });
      
      fetchLessons();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta aula?")) return;

    try {
      const { error } = await supabase
        .from('academy_lessons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: "Aula excluída!" });
      fetchLessons();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const selectedModuleData = modules.find(m => m.id === selectedModule);
  const filteredLessons = lessons.filter(l => {
    if (filterStatus === 'published') return l.published;
    if (filterStatus === 'draft') return !l.published;
    return true;
  });

  const publishedCount = lessons.filter(l => l.published).length;
  const draftCount = lessons.filter(l => !l.published).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-xl font-semibold">Aulas</h3>
            {selectedModule && (
              <p className="text-sm text-muted-foreground">
                {lessons.length} total • {publishedCount} publicadas • {draftCount} rascunhos
              </p>
            )}
          </div>
          {modules.length > 0 && (
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecione um módulo" />
              </SelectTrigger>
              <SelectContent>
                {modules.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.title}
                    {!module.published && (
                      <Badge variant="secondary" className="ml-2">Não publicado</Badge>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingLesson(null);
                setFormData({
                  module_id: selectedModule,
                  title: "",
                  description: "",
                  video_url: "",
                  duration_minutes: 0,
                  points: 10,
                  display_order: lessons.length,
                  published: false
                });
              }}
              disabled={!selectedModule}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingLesson ? "Editar Aula" : "Nova Aula"}
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
                <Label htmlFor="video_url">URL do YouTube</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Será convertido automaticamente para o formato embed
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="duration_minutes">Duração (min)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="points">Pontos</Label>
                  <Input
                    id="points"
                    type="number"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                  />
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
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="published">Publicado</Label>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingLesson ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {selectedModuleData && !selectedModuleData.published && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            ⚠️ Este módulo não está publicado. As aulas não estarão visíveis para os usuários.
          </p>
        </div>
      )}

      {selectedModule && lessons.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            Todas ({lessons.length})
          </Button>
          <Button
            variant={filterStatus === 'published' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('published')}
          >
            Publicadas ({publishedCount})
          </Button>
          <Button
            variant={filterStatus === 'draft' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('draft')}
          >
            Rascunhos ({draftCount})
          </Button>
        </div>
      )}

      {!selectedModule ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Crie um módulo primeiro</p>
        </Card>
      ) : loading ? (
        <p>Carregando...</p>
      ) : filteredLessons.length === 0 ? (
        <Card className="p-12 text-center">
          <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {filterStatus === 'all' ? 'Nenhuma aula cadastrada neste módulo' : `Nenhuma aula ${filterStatus === 'published' ? 'publicada' : 'rascunho'}`}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLessons.map((lesson, index) => (
            <Card key={lesson.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium bg-primary/10 px-2 py-1 rounded">
                      Aula {index + 1}
                    </span>
                    <h4 className="font-semibold">{lesson.title}</h4>
                    <Badge variant={lesson.published ? "default" : "secondary"}>
                      {lesson.published ? "Publicada" : "Rascunho"}
                    </Badge>
                  </div>
                  {lesson.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {lesson.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    {lesson.duration_minutes && (
                      <span>{lesson.duration_minutes} min</span>
                    )}
                    <span>+{lesson.points} pts</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePublished(lesson)}
                        >
                          {lesson.published ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{lesson.published ? "Despublicar" : "Publicar"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(lesson)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar aula</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(lesson.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Excluir aula</p>
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
