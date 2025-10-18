import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Lightbulb,
  AlertTriangle,
  Eye,
  CheckCircle,
  Archive,
  Users,
  TrendingUp,
  Filter,
  Trash2,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useFeedbacks, Feedback, FeedbackType, FeedbackCategory, FeedbackStatus } from "@/hooks/useFeedbacks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const categoryLabels = {
  system: "Sistema",
  service: "Atendimento",
  campaigns: "Campanhas",
  leadership: "Liderança",
  resources: "Recursos",
  academy: "Academy",
  coworkers: "Colegas",
  infrastructure: "Infraestrutura",
  other: "Outros",
};

const statusLabels = {
  pending: "Pendente",
  read: "Lido",
  analyzing: "Analisando",
  resolved: "Resolvido",
  archived: "Arquivado",
};

const statusColors = {
  pending: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  read: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  analyzing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export function FeedbacksManager() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("30");

  const { fetchFeedbacks, updateFeedbackStatus, updateFeedbackNotes, deleteFeedback } = useFeedbacks();

  useEffect(() => {
    loadFeedbacks();
  }, [typeFilter, categoryFilter, statusFilter, periodFilter]);

  const loadFeedbacks = async () => {
    setLoading(true);
    const filters: any = {};

    if (typeFilter !== "all") filters.type = typeFilter as FeedbackType;
    if (categoryFilter !== "all") filters.category = categoryFilter as FeedbackCategory;
    if (statusFilter !== "all") filters.status = statusFilter as FeedbackStatus;
    if (periodFilter !== "all") filters.period = parseInt(periodFilter);

    const data = await fetchFeedbacks(filters);
    setFeedbacks(data);
    setLoading(false);
  };

  const handleStatusChange = async (id: string, status: FeedbackStatus) => {
    const result = await updateFeedbackStatus(id, status);
    if (result.success) {
      loadFeedbacks();
    }
  };

  const handleSaveNotes = async (id: string) => {
    const result = await updateFeedbackNotes(id, notesValue);
    if (result.success) {
      setEditingNotes(null);
      loadFeedbacks();
    }
  };

  const handleDelete = (id: string) => {
    setFeedbackToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!feedbackToDelete) return;
    
    const result = await deleteFeedback(feedbackToDelete);
    if (result.success) {
      loadFeedbacks();
    }
    
    setDeleteConfirmOpen(false);
    setFeedbackToDelete(null);
  };

  // Calculate summary
  const pendingCount = feedbacks.filter(f => f.status === "pending").length;
  const suggestionCount = feedbacks.filter(f => f.type === "suggestion").length;
  const complaintCount = feedbacks.filter(f => f.type === "complaint").length;

  // Most mentioned categories
  const categoryCounts = feedbacks.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  if (loading) {
    return <div className="text-center py-8">Carregando feedbacks...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Feedbacks Anônimos</h2>
        <p className="text-muted-foreground">
          Gerencie sugestões e reclamações da equipe
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Novos Feedbacks
            </CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              aguardando análise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Proporção
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suggestionCount}:{complaintCount}
            </div>
            <p className="text-xs text-muted-foreground">
              sugestões vs reclamações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Categorias Mais Citadas
            </CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {topCategories.map(([category, count]) => (
                <div key={category} className="text-xs">
                  <span className="font-medium">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </span>
                  {" "}({count})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="suggestion">Sugestões</SelectItem>
                  <SelectItem value="complaint">Reclamações</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedbacks List */}
      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum feedback encontrado com os filtros aplicados
            </CardContent>
          </Card>
        ) : (
          feedbacks.map((feedback) => (
            <Card key={feedback.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={feedback.type === "suggestion" ? "default" : "destructive"}>
                      {feedback.type === "suggestion" ? (
                        <><Lightbulb className="h-3 w-3 mr-1" /> Sugestão</>
                      ) : (
                        <><AlertTriangle className="h-3 w-3 mr-1" /> Reclamação</>
                      )}
                    </Badge>
                    <Badge variant="outline">
                      {categoryLabels[feedback.category]}
                    </Badge>
                    {feedback.team && (
                      <Badge variant="outline" className="gap-1">
                        <Users className="h-3 w-3" />
                        {feedback.team}
                      </Badge>
                    )}
                  </div>
                  <Badge className={statusColors[feedback.status]}>
                    {statusLabels[feedback.status]}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {format(new Date(feedback.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {feedback.message}
                </p>

                {/* Admin Notes */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Notas Internas</label>
                    {editingNotes === feedback.id ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingNotes(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveNotes(feedback.id)}
                        >
                          Salvar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingNotes(feedback.id);
                          setNotesValue(feedback.admin_notes || "");
                        }}
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                  {editingNotes === feedback.id ? (
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Adicione notas internas sobre este feedback..."
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {feedback.admin_notes || "Nenhuma nota adicionada"}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(feedback.id, "read")}
                    disabled={feedback.status === "read"}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Marcar como Lido
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(feedback.id, "analyzing")}
                    disabled={feedback.status === "analyzing"}
                  >
                    Analisando
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(feedback.id, "resolved")}
                    disabled={feedback.status === "resolved"}
                    className="text-green-600"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolvido
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusChange(feedback.id, "archived")}
                    disabled={feedback.status === "archived"}
                  >
                    <Archive className="h-3 w-3 mr-1" />
                    Arquivar
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(feedback.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este feedback? Esta ação não pode ser desfeita.
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
