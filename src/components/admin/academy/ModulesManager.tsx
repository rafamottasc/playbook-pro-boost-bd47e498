import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Module {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  display_order: number;
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
    display_order: 0
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingModule) {
        const { error } = await supabase
          .from('academy_modules')
          .update(formData)
          .eq('id', editingModule.id);

        if (error) throw error;
        toast({ title: "Módulo atualizado!" });
      } else {
        const { error } = await supabase
          .from('academy_modules')
          .insert(formData);

        if (error) throw error;
        toast({ title: "Módulo criado!" });
      }

      setDialogOpen(false);
      setEditingModule(null);
      setFormData({ title: "", description: "", cover_url: "", display_order: 0 });
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
      display_order: module.display_order
    });
    setDialogOpen(true);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Módulos de Treinamento</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingModule(null);
              setFormData({ title: "", description: "", cover_url: "", display_order: modules.length });
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
                <Label htmlFor="cover_url">URL da Capa</Label>
                <Input
                  id="cover_url"
                  value={formData.cover_url}
                  onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                  placeholder="https://..."
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
              <Button type="submit" className="w-full">
                {editingModule ? "Atualizar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p>Carregando...</p>
      ) : modules.length === 0 ? (
        <Card className="p-12 text-center">
          <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Nenhum módulo cadastrado</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <Card key={module.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold">{module.title}</h4>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(module)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(module.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {module.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {module.description}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
