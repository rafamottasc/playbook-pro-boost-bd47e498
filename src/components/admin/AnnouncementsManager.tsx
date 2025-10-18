import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DraggableDialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Copy, Megaphone, Bell, AlertTriangle, CheckCircle, Info, X, MousePointerClick, ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: string;
  icon: string;
  start_date: string;
  end_date: string | null;
  cta_text: string | null;
  cta_link: string | null;
  target_audience: string;
  active: boolean;
  requires_confirmation: boolean;
  created_at: string;
  created_by: string | null;
  profiles?: {
    full_name: string;
  } | null;
}

interface AnnouncementStats {
  announcement_id: string;
  views: number;
  dismissals: number;
  cta_clicks: number;
  confirmed: number;
}

interface ConfirmationDetail {
  announcement_id: string;
  user_id: string;
  confirmed_at: string;
  profiles: {
    full_name: string;
  };
}

const quillModules = {
  toolbar: [
    [{ 'header': [3, false] }],
    ['bold', 'italic', 'underline'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'align': [] }],
    ['link'],
    ['clean']
  ],
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline',
  'list', 'bullet', 'align', 'link'
];

const sanitizeHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h3', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
  });
};

const iconOptions = [
  { value: "megaphone", label: "Megafone", Icon: Megaphone },
  { value: "bell", label: "Sino", Icon: Bell },
  { value: "alert", label: "Alerta", Icon: AlertTriangle },
  { value: "check", label: "Check", Icon: CheckCircle },
  { value: "info", label: "Info", Icon: Info },
];

const priorityStyles = {
  urgent: {
    container: "border-destructive/60 bg-gradient-to-br from-destructive/5 via-background to-destructive/10",
    icon: "text-destructive",
    button: "bg-destructive hover:bg-destructive/90 text-white",
  },
  warning: {
    container: "border-orange-500/60 bg-gradient-to-br from-orange-50/50 via-background to-orange-100/50 dark:from-orange-950/10 dark:via-background dark:to-orange-900/20",
    icon: "text-orange-600 dark:text-orange-400",
    button: "bg-orange-600 hover:bg-orange-700 text-white",
  },
  info: {
    container: "border-blue-500/60 bg-gradient-to-br from-blue-50/50 via-background to-blue-100/50 dark:from-blue-950/10 dark:via-background dark:to-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  success: {
    container: "border-green-500/60 bg-gradient-to-br from-green-50/50 via-background to-green-100/50 dark:from-green-950/10 dark:via-background dark:to-green-900/20",
    icon: "text-green-600 dark:text-green-400",
    button: "bg-green-600 hover:bg-green-700 text-white",
  },
};

const normalizeUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export function AnnouncementsManager() {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<AnnouncementStats[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmationDetails, setConfirmationDetails] = useState<ConfirmationDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Função auxiliar para obter data/hora local formatada para datetime-local input
  const getLocalDateTimeString = () => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    priority: "info",
    icon: "megaphone",
    start_date: getLocalDateTimeString(),
    end_date: "",
    cta_text: "",
    cta_link: "",
    target_audience: "all",
    active: true,
    requires_confirmation: false,
  });

  useEffect(() => {
    fetchAnnouncements();
    fetchStats();
    fetchAllConfirmationDetails();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select(`
          *,
          profiles!announcements_created_by_fkey(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast({
        title: "Erro ao carregar avisos",
        description: "Não foi possível carregar os avisos.",
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from("announcement_views")
        .select("announcement_id, dismissed, cta_clicked, confirmed");

      if (error) throw error;

      const statsMap = new Map<string, AnnouncementStats>();
      
      data?.forEach((view) => {
        const current = statsMap.get(view.announcement_id) || {
          announcement_id: view.announcement_id,
          views: 0,
          dismissals: 0,
          cta_clicks: 0,
          confirmed: 0,
        };
        
        current.views += 1;
        if (view.dismissed) current.dismissals += 1;
        if (view.cta_clicked) current.cta_clicks += 1;
        if (view.confirmed) current.confirmed += 1;
        
        statsMap.set(view.announcement_id, current);
      });

      setStats(Array.from(statsMap.values()));
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchAllConfirmationDetails = async () => {
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase
        .from("announcement_views")
        .select(`
          announcement_id,
          user_id,
          confirmed_at,
          profiles!announcement_views_user_id_fkey(full_name)
        `)
        .eq("confirmed", true)
        .order("confirmed_at", { ascending: false });

      if (error) throw error;

      console.log("✅ Fetched confirmation details:", data);
      setConfirmationDetails(data as any);
    } catch (error) {
      console.error("Error fetching confirmation details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const payload = {
        ...formData,
        end_date: formData.end_date || null,
        cta_text: formData.cta_text || null,
        cta_link: formData.cta_link ? normalizeUrl(formData.cta_link) : null,
        created_by: user.id,
      };

      if (editingId) {
        const { error } = await supabase
          .from("announcements")
          .update(payload)
          .eq("id", editingId);

        if (error) throw error;

        toast({
          title: "Aviso atualizado",
          description: "O aviso foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("announcements")
          .insert([payload]);

        if (error) throw error;

        toast({
          title: "Aviso criado",
          description: "O aviso foi criado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error("Error saving announcement:", error);
      toast({
        title: "Erro ao salvar aviso",
        description: "Não foi possível salvar o aviso.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority,
      icon: announcement.icon,
      start_date: announcement.start_date.slice(0, 16),
      end_date: announcement.end_date?.slice(0, 16) || "",
      cta_text: announcement.cta_text || "",
      cta_link: announcement.cta_link || "",
      target_audience: announcement.target_audience,
      active: announcement.active,
      requires_confirmation: announcement.requires_confirmation || false,
    });
    setIsDialogOpen(true);
  };

  const handleClone = (announcement: Announcement) => {
    setEditingId(null);
    setFormData({
      title: `${announcement.title} (Cópia)`,
      message: announcement.message,
      priority: announcement.priority,
      icon: announcement.icon,
      start_date: getLocalDateTimeString(),
      end_date: "",
      cta_text: announcement.cta_text || "",
      cta_link: announcement.cta_link || "",
      target_audience: announcement.target_audience,
      active: false,
      requires_confirmation: false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setItemToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", itemToDelete);

      if (error) throw error;

      toast({
        title: "Aviso excluído",
        description: "O aviso foi excluído com sucesso.",
      });

      fetchAnnouncements();
      fetchStats();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast({
        title: "Erro ao excluir aviso",
        description: "Não foi possível excluir o aviso.",
        variant: "destructive",
      });
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: "",
      message: "",
      priority: "info",
      icon: "megaphone",
      start_date: getLocalDateTimeString(),
      end_date: "",
      cta_text: "",
      cta_link: "",
      target_audience: "all",
      active: true,
      requires_confirmation: false,
    });
  };

  const getStatus = (announcement: Announcement) => {
    if (!announcement.active) return { label: "Inativo", variant: "secondary" as const };
    
    const now = new Date();
    const start = new Date(announcement.start_date);
    const end = announcement.end_date ? new Date(announcement.end_date) : null;

    if (start > now) return { label: "Agendado", variant: "default" as const };
    if (end && end < now) return { label: "Expirado", variant: "outline" as const };
    return { label: "Ativo", variant: "default" as const };
  };

  const SelectedIcon = iconOptions.find((opt) => opt.value === formData.icon)?.Icon || Megaphone;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Avisos</h2>
          <p className="text-muted-foreground">
            Crie avisos globais para exibir na página inicial
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Aviso
            </Button>
          </DialogTrigger>
          <DraggableDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Aviso" : "Novo Aviso"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mensagem *</Label>
                <ReactQuill
                  theme="snow"
                  value={formData.message}
                  onChange={(value) => setFormData({ ...formData, message: value })}
                  modules={quillModules}
                  formats={quillFormats}
                  className="bg-background"
                  placeholder="Digite a mensagem do aviso..."
                />
                <p className="text-xs text-muted-foreground">
                  Use a barra de ferramentas para formatar o texto
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade *</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Aviso</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Ícone *</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.Icon className="w-4 h-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data/Hora Início *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Data/Hora Fim</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cta_text">Texto do Botão</Label>
                  <Input
                    id="cta_text"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    placeholder="Ex: Saiba mais"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cta_link">Link do Botão</Label>
                  <Input
                    id="cta_link"
                    type="text"
                    value={formData.cta_link}
                    onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                    placeholder="google.com.br ou https://google.com.br"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_audience">Público-Alvo *</Label>
                <Select
                  value={formData.target_audience}
                  onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="corretor">Corretores</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label htmlFor="active">Ativo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_confirmation"
                  checked={formData.requires_confirmation}
                  onCheckedChange={(checked) => setFormData({ ...formData, requires_confirmation: checked })}
                />
                <Label htmlFor="requires_confirmation">Requer confirmação de leitura</Label>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <Card className={cn(
                  "relative shadow-comarc border-2 rounded-xl overflow-hidden",
                  priorityStyles[formData.priority as keyof typeof priorityStyles].container
                )}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* Icon Section */}
                      <div className="flex-shrink-0 pt-1">
                        <div className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-sm", priorityStyles[formData.priority as keyof typeof priorityStyles].icon)}>
                          <SelectedIcon className="h-10 w-10" />
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 min-w-0 pr-10">
                        <h3 className={cn("text-2xl font-bold mb-1", priorityStyles[formData.priority as keyof typeof priorityStyles].icon)}>
                          {formData.title || "Título do aviso"}
                        </h3>
                        <div 
                          className="text-base text-foreground/90 leading-relaxed prose prose-sm max-w-none [&>p]:m-0 [&>p]:mb-2 [&>ul]:my-2 [&>ol]:my-2"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(formData.message) || "<p>Mensagem do aviso aparecerá aqui...</p>" }}
                        />
                        <div className="flex gap-2 mt-4 flex-wrap">
                          {formData.requires_confirmation && (
                            <Button
                              size="default"
                              className="font-medium shadow-sm gap-2 px-6 text-base bg-green-600 hover:bg-green-700 text-white"
                            >
                              ✔️ Li e estou ciente
                            </Button>
                          )}
                          {formData.cta_text && formData.cta_link && (
                            <Button
                              size="default"
                              className={cn(
                                "font-medium shadow-sm gap-2 px-6 text-base",
                                priorityStyles[formData.priority as keyof typeof priorityStyles].button
                              )}
                            >
                              {formData.cta_text}
                              <MousePointerClick className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Close Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-3 right-3 h-8 w-8 rounded-full text-foreground/60 hover:text-foreground hover:bg-background/90"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? "Atualizar" : "Criar"} Aviso
                </Button>
              </div>
            </form>
          </DraggableDialogContent>
        </Dialog>
      </div>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>Avisos Criados</CardTitle>
          <CardDescription>
            Gerencie todos os avisos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Público</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((announcement) => {
                const status = getStatus(announcement);
                return (
                  <TableRow key={announcement.id}>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {announcement.profiles?.full_name || "Sistema"}
                    </TableCell>
                    <TableCell className="font-medium">{announcement.title}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          announcement.priority === "urgent" && "border-destructive text-destructive",
                          announcement.priority === "warning" && "border-orange-500 text-orange-600",
                          announcement.priority === "info" && "border-blue-500 text-blue-600",
                          announcement.priority === "success" && "border-green-500 text-green-600"
                        )}
                      >
                        {announcement.priority === "urgent" && "Urgente"}
                        {announcement.priority === "warning" && "Aviso"}
                        {announcement.priority === "info" && "Info"}
                        {announcement.priority === "success" && "Sucesso"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {announcement.target_audience === "all" && "Todos"}
                      {announcement.target_audience === "corretor" && "Corretores"}
                      {announcement.target_audience === "admin" && "Admins"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(announcement.start_date), "dd/MM/yyyy HH:mm")}</div>
                        {announcement.end_date && (
                          <div className="text-muted-foreground">
                            → {format(new Date(announcement.end_date), "dd/MM/yyyy HH:mm")}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleClone(announcement)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(announcement.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Unified Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas Gerais</CardTitle>
          <CardDescription>Estatísticas de visualização e confirmação dos avisos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 px-4 py-3 bg-muted/50 text-sm font-medium">
              <div>Aviso</div>
              <div className="text-right">Visualizações</div>
              <div className="text-right">Dispensas</div>
              <div className="text-right">Taxa Dispensa</div>
              <div className="text-right">Cliques CTA</div>
              <div className="text-right">Confirmaram</div>
            </div>

            {/* Accordion Rows */}
            <Accordion type="multiple" className="w-full">
              {announcements.map((announcement) => {
                const stat = stats.find((s) => s.announcement_id === announcement.id);
                const dismissRate = stat ? ((stat.dismissals / stat.views) * 100).toFixed(1) : "0.0";
                const confirmRate = announcement.requires_confirmation && stat?.views 
                  ? ((stat.confirmed / stat.views) * 100).toFixed(0) 
                  : "-";
                const hasConfirmations = announcement.requires_confirmation && stat && stat.confirmed > 0;
                const announcementDetails = confirmationDetails.filter(d => d.announcement_id === announcement.id);

                // Debug log
                if (announcement.requires_confirmation && stat && stat.confirmed > 0) {
                  console.log("🔍 Announcement:", announcement.title);
                  console.log("   - ID:", announcement.id);
                  console.log("   - Confirmations in state:", confirmationDetails.length);
                  console.log("   - Filtered details:", announcementDetails.length);
                  console.log("   - Details:", announcementDetails);
                }
                
                return (
                  <AccordionItem key={announcement.id} value={announcement.id} className="border-b last:border-b-0">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.5fr] gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
                      {/* Coluna 1: Título */}
                <div className="font-medium">
                  <div className="flex items-center gap-2">
                    {hasConfirmations ? (
                      <AccordionTrigger className="hover:no-underline p-0 h-auto flex items-center gap-2 w-full [&[data-state=open]>svg]:rotate-180">
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 text-primary" />
                        <span>{announcement.title}</span>
                        <Badge variant="outline" className="text-green-600 border-green-600 text-xs ml-2">
                          ✔️ {announcementDetails.length}
                        </Badge>
                      </AccordionTrigger>
                    ) : (
                      <>
                        <span>{announcement.title}</span>
                        {announcement.requires_confirmation && (
                          <Badge variant="outline" className="text-muted-foreground border-muted text-xs">
                            ✔️ 0
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
                      
                      {/* Demais colunas */}
                      <div className="text-right">{stat?.views || 0}</div>
                      <div className="text-right">{stat?.dismissals || 0}</div>
                      <div className="text-right">{dismissRate}%</div>
                      <div className="text-right">{stat?.cta_clicks || 0}</div>
                      <div className="text-right">
                        {announcement.requires_confirmation ? (
                          stat && stat.confirmed > 0 ? (
                            <div className="flex items-center justify-end gap-2">
                              <span>{stat.confirmed}</span>
                              <Badge variant={Number(confirmRate) >= 80 ? "default" : "secondary"}>
                                {confirmRate}%
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Conteúdo Expansível */}
                    {hasConfirmations && (
                      <AccordionContent>
                        <div className="px-4 pb-4 bg-muted/30">
                          <div className="text-sm font-medium mb-3 text-muted-foreground">
                            Usuários que confirmaram leitura:
                          </div>
                          <div className="space-y-2">
                            {announcementDetails.length === 0 ? (
                              <div className="text-sm text-muted-foreground italic p-3 bg-background rounded-md border border-dashed">
                                Nenhum detalhe de confirmação encontrado
                              </div>
                            ) : (
                              announcementDetails.map((detail) => (
                                <div 
                                  key={detail.user_id} 
                                  className="flex items-center justify-between bg-background rounded-md p-3 border"
                                >
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    <span className="font-medium">
                                      {detail.profiles?.full_name || "Usuário desconhecido"}
                                    </span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(detail.confirmed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    )}
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este aviso? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
