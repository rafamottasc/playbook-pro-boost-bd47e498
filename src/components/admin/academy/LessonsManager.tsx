import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Play, Eye, EyeOff, FileText, Link as LinkIcon, X, ExternalLink as ExternalLinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DraggableDialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  academy_modules?: {
    title: string;
    published: boolean;
  };
}

interface Attachment {
  id?: string;
  title: string;
  file_url: string;
  file_type: 'pdf' | 'link';
}

export function LessonsManager() {
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
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
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [newAttachment, setNewAttachment] = useState({ title: "", file_url: "", file_type: 'link' as 'pdf' | 'link' });
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    if (modules.length > 0) {
      fetchAllLessons();
    }
  }, [modules]);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('academy_modules')
        .select('id, title, published')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchAllLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('academy_lessons')
        .select(`
          *,
          academy_modules!inner(title, published)
        `)
        .order('module_id', { ascending: true })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setAllLessons(data || []);
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

    if (!formData.module_id) {
      toast({
        title: "Erro",
        description: "Selecione um módulo para a aula",
        variant: "destructive"
      });
      return;
    }

    const embedUrl = convertYouTubeUrl(formData.video_url);

    try {
      let lessonId = editingLesson?.id;

      if (editingLesson) {
        const { error } = await supabase
          .from('academy_lessons')
          .update({ ...formData, video_url: embedUrl })
          .eq('id', editingLesson.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('academy_lessons')
          .insert({ ...formData, video_url: embedUrl })
          .select()
          .single();

        if (error) throw error;
        lessonId = data.id;
      }

      // Save attachments
      if (lessonId && attachments.length > 0) {
        // Delete existing attachments if editing
        if (editingLesson) {
          await supabase
            .from('lesson_attachments')
            .delete()
            .eq('lesson_id', lessonId);
        }

        // Insert new attachments
        const attachmentsToInsert = attachments.map(att => ({
          lesson_id: lessonId,
          title: att.title,
          file_url: att.file_url,
          file_type: att.file_type
        }));

        const { error: attachError } = await supabase
          .from('lesson_attachments')
          .insert(attachmentsToInsert);

        if (attachError) throw attachError;
      }

      toast({ title: editingLesson ? "Aula atualizada!" : "Aula criada!" });

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
      setAttachments([]);
      fetchAllLessons();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = async (lesson: Lesson) => {
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

    // Fetch existing attachments
    const { data: attachmentsData } = await supabase
      .from('lesson_attachments')
      .select('*')
      .eq('lesson_id', lesson.id);

    setAttachments((attachmentsData || []).map(att => ({
      id: att.id,
      title: att.title,
      file_url: att.file_url,
      file_type: att.file_type as 'pdf' | 'link'
    })));
    setDialogOpen(true);
  };

  const handleAddAttachment = () => {
    if (!newAttachment.title || !newAttachment.file_url) {
      toast({
        title: "Erro",
        description: "Preencha título e URL/arquivo",
        variant: "destructive"
      });
      return;
    }

    setAttachments([...attachments, newAttachment]);
    setNewAttachment({ title: "", file_url: "", file_type: 'link' });
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError, data } = await supabase.storage
        .from('lesson-materials')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('lesson-materials')
        .getPublicUrl(fileName);

      setNewAttachment({ ...newAttachment, file_url: urlData.publicUrl });
      
      toast({
        title: "Arquivo enviado!",
        description: file.name
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
    }
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
      
      fetchAllLessons();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    setLessonToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!lessonToDelete) return;

    try {
      const { error } = await supabase
        .from('academy_lessons')
        .delete()
        .eq('id', lessonToDelete);

      if (error) throw error;
      toast({ title: "Aula excluída!" });
      fetchAllLessons();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeleteConfirmOpen(false);
      setLessonToDelete(null);
    }
  };

  const filteredLessons = allLessons.filter(l => {
    // Filtro por status
    if (filterStatus === 'published' && !l.published) return false;
    if (filterStatus === 'draft' && l.published) return false;
    
    // Filtro por módulo
    if (selectedModuleFilter !== 'all' && l.module_id !== selectedModuleFilter) return false;
    
    return true;
  });

  const publishedCount = allLessons.filter(l => l.published).length;
  const draftCount = allLessons.filter(l => !l.published).length;

  return (
    <div>
      <div className="space-y-4 mb-6">
        {/* Cabeçalho e estatísticas */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h3 className="text-xl font-semibold">Aulas</h3>
            <p className="text-sm text-muted-foreground">
              {allLessons.length} total • {publishedCount} publicadas • {draftCount} rascunhos
              {modules.length > 0 && ` • ${modules.length} módulos`}
            </p>
          </div>
          
          {/* Botão Nova Aula */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
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
                  setAttachments([]);
                }}
                disabled={modules.length === 0}
                className="w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Aula
              </Button>
            </DialogTrigger>
          <DraggableDialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingLesson ? "Editar Aula" : "Nova Aula"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="module_select">Módulo *</Label>
                <Select 
                  value={formData.module_id} 
                  onValueChange={async (value) => {
                    // Calcular display_order baseado no módulo selecionado
                    if (!editingLesson) {
                      const { data: moduleLessons } = await supabase
                        .from('academy_lessons')
                        .select('id')
                        .eq('module_id', value);
                      
                      setFormData({ 
                        ...formData, 
                        module_id: value,
                        display_order: moduleLessons?.length || 0
                      });
                    } else {
                      setFormData({ ...formData, module_id: value });
                    }
                  }}
                  required
                >
                  <SelectTrigger id="module_select">
                    <SelectValue placeholder="Selecione o módulo da aula" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.title}
                        {!module.published && (
                          <Badge variant="secondary" className="ml-2 text-xs">Não publicado</Badge>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

              {/* Materials Section */}
              <div className="space-y-4 pt-4 border-t">
                <Label>Materiais de Apoio (opcional)</Label>
                
                {/* Existing attachments */}
                {attachments.length > 0 && (
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    {attachments.map((att, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-background rounded border">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {att.file_type === 'pdf' ? (
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate">{att.title}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new attachment form */}
                <div className="space-y-3 p-3 border rounded-lg">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={newAttachment.file_type === 'link' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewAttachment({ ...newAttachment, file_type: 'link', file_url: '' })}
                    >
                      <LinkIcon className="h-3 w-3 mr-1" />
                      Link Externo
                    </Button>
                    <Button
                      type="button"
                      variant={newAttachment.file_type === 'pdf' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setNewAttachment({ ...newAttachment, file_type: 'pdf', file_url: '' })}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                  </div>

                  <Input
                    placeholder="Título do material"
                    value={newAttachment.title}
                    onChange={(e) => setNewAttachment({ ...newAttachment, title: e.target.value })}
                  />

                  {newAttachment.file_type === 'link' ? (
                    <Input
                      placeholder="https://..."
                      value={newAttachment.file_url}
                      onChange={(e) => setNewAttachment({ ...newAttachment, file_url: e.target.value })}
                    />
                  ) : (
                    <div>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                      />
                      {newAttachment.file_url && (
                        <p className="text-xs text-green-600 mt-1">✓ Arquivo carregado</p>
                      )}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddAttachment}
                    className="w-full"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar Material
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full">
                {editingLesson ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DraggableDialogContent>
        </Dialog>
      </div>

        {/* Filtros por Status e Módulo */}
        {allLessons.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filtros de Status */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
              >
                Todas ({allLessons.length})
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

            {/* Filtro por Módulo */}
            <div className="flex gap-2 items-center sm:ml-auto">
              <Label className="text-sm whitespace-nowrap">Módulo:</Label>
              <Select 
                value={selectedModuleFilter} 
                onValueChange={setSelectedModuleFilter}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">📚 Todos</SelectItem>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {modules.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Crie um módulo primeiro para adicionar aulas</p>
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
        (() => {
          // Agrupar aulas por módulo
          const lessonsByModule = filteredLessons.reduce((acc, lesson) => {
            const moduleId = lesson.module_id;
            if (!acc[moduleId]) {
              acc[moduleId] = {
                module: lesson.academy_modules,
                lessons: []
              };
            }
            acc[moduleId].lessons.push(lesson);
            return acc;
          }, {} as Record<string, { module: any; lessons: Lesson[] }>);

          return (
            <div className="space-y-6">
              {Object.entries(lessonsByModule).map(([moduleId, { module, lessons }]) => (
                <div key={moduleId} className="space-y-3">
                  {/* Subtítulo do Módulo */}
                  <div className="flex items-center gap-3 border-b pb-2">
                    <h4 className="text-lg font-semibold text-primary">
                      📚 {module?.title || 'Módulo'}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'}
                    </Badge>
                    {!module?.published && (
                      <Badge variant="secondary" className="text-xs">
                        Módulo não publicado
                      </Badge>
                    )}
                  </div>

                  {/* Cards das Aulas */}
                  <div className="space-y-3 pl-4 border-l-2 border-primary/20">
                    {lessons.map((lesson, index) => (
                      <Card key={lesson.id} className="p-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-xs font-medium bg-primary/10 px-2 py-1 rounded">
                                Aula {index + 1}
                              </span>
                              <h4 className="font-semibold truncate">{lesson.title}</h4>
                              <Badge variant={lesson.published ? "default" : "secondary"}>
                                {lesson.published ? "Publicada" : "Rascunho"}
                              </Badge>
                            </div>
                            {lesson.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
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
                          
                          {/* Botões de ação */}
                          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    asChild
                                  >
                                    <a 
                                      href={`/academy/modules/${lesson.module_id}/${lesson.id}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                    >
                                      <ExternalLinkIcon className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Visualizar aula</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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
                </div>
              ))}
            </div>
          );
        })()
      )}

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.
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
