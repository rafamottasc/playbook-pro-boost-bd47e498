import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, MapPin, Users, Calendar, Loader2, Check, X } from "lucide-react";
import { useMeetingRooms } from "@/hooks/useMeetingRooms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RoomFormData {
  name: string;
  description: string;
  capacity: string;
  display_order: string;
  active: boolean;
}

export function RoomsManager() {
  const { rooms, loading, refetch } = useMeetingRooms();
  const [showDialog, setShowDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<RoomFormData>({
    name: "",
    description: "",
    capacity: "10",
    display_order: "0",
    active: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      capacity: "10",
      display_order: "0",
      active: true,
    });
    setEditingRoom(null);
  };

  const handleOpenDialog = (room?: any) => {
    if (room) {
      setEditingRoom(room.id);
      setFormData({
        name: room.name,
        description: room.description || "",
        capacity: room.capacity.toString(),
        display_order: room.display_order.toString(),
        active: room.active,
      });
    } else {
      resetForm();
    }
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Digite um nome para a sala");
      return;
    }

    const capacity = parseInt(formData.capacity);
    if (isNaN(capacity) || capacity < 1) {
      toast.error("Capacidade deve ser um número maior que zero");
      return;
    }

    const displayOrder = parseInt(formData.display_order);
    if (isNaN(displayOrder)) {
      toast.error("Ordem de exibição deve ser um número");
      return;
    }

    setSaving(true);
    try {
      const roomData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        capacity,
        display_order: displayOrder,
        active: formData.active,
      };

      if (editingRoom) {
        // Atualizar
        const { error } = await supabase
          .from("meeting_rooms")
          .update(roomData)
          .eq("id", editingRoom);

        if (error) throw error;
        toast.success("Sala atualizada com sucesso");
      } else {
        // Criar
        const { error } = await supabase
          .from("meeting_rooms")
          .insert(roomData);

        if (error) throw error;
        toast.success("Sala criada com sucesso");
      }

      setShowDialog(false);
      resetForm();
      refetch();
    } catch (error: any) {
      console.error("Error saving room:", error);
      if (error.message?.includes("unique")) {
        toast.error("Já existe uma sala com este nome");
      } else {
        toast.error("Erro ao salvar sala");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!roomToDelete) return;

    setDeletingId(roomToDelete);
    try {
      const { error } = await supabase
        .from("meeting_rooms")
        .delete()
        .eq("id", roomToDelete);

      if (error) {
        // Se houver erro por ter reuniões vinculadas, apenas desativar
        if (error.message?.includes("violates foreign key")) {
          const { error: updateError } = await supabase
            .from("meeting_rooms")
            .update({ active: false })
            .eq("id", roomToDelete);

          if (updateError) throw updateError;
          toast.success("Sala desativada (possui reuniões vinculadas)");
        } else {
          throw error;
        }
      } else {
        toast.success("Sala excluída com sucesso");
      }

      refetch();
      setShowDeleteDialog(false);
      setRoomToDelete(null);
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Erro ao excluir sala");
    } finally {
      setDeletingId(null);
    }
  };

  const openDeleteDialog = (roomId: string) => {
    setRoomToDelete(roomId);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Carregando salas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Gerenciar Salas de Reunião
              </CardTitle>
              <CardDescription className="mt-1">
                Administre as salas disponíveis para agendamento de reuniões
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Sala
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Salas</CardDescription>
            <CardTitle className="text-3xl">{rooms.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Salas Ativas</CardDescription>
            <CardTitle className="text-3xl">
              {rooms.filter((r) => r.active).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Capacidade Total</CardDescription>
            <CardTitle className="text-3xl">
              {rooms.reduce((acc, r) => acc + r.capacity, 0)} pessoas
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tabela de Salas */}
      <Card>
        <CardContent className="pt-6">
          {rooms.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma sala cadastrada</h3>
              <p className="text-muted-foreground mb-4">
                Crie a primeira sala para começar
              </p>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Sala
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-center">
                    <Users className="h-4 w-4 inline mr-1" />
                    Capacidade
                  </TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {room.description || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {room.capacity} pessoas
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={room.active ? "default" : "secondary"}>
                        {room.active ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Ativa
                          </>
                        ) : (
                          <>
                            <X className="h-3 w-3 mr-1" />
                            Inativa
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(room)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(room.id)}
                          disabled={deletingId === room.id}
                        >
                          {deletingId === room.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Criar/Editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingRoom ? "Editar Sala" : "Nova Sala"}
            </DialogTitle>
            <DialogDescription>
              {editingRoom
                ? "Atualize as informações da sala de reunião"
                : "Crie uma nova sala de reunião"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Sala *</Label>
              <Input
                id="name"
                placeholder="Ex: Sala Oficial"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descrição opcional da sala"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                disabled={saving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData({ ...formData, capacity: e.target.value })
                  }
                  disabled={saving}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Ordem</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: e.target.value })
                  }
                  disabled={saving}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({ ...formData, active: e.target.checked })
                }
                disabled={saving}
                className="h-4 w-4"
              />
              <Label htmlFor="active" className="cursor-pointer">
                Sala ativa
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRoom ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Sala</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta sala? Se houver reuniões
              vinculadas, a sala será apenas desativada. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingId}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!deletingId}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deletingId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
