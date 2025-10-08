import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileUpload } from "./FileUpload";
import { ExternalLink, Trash2, Plus } from "lucide-react";

const partnerSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  manager_name: z.string().optional(),
  manager_phone: z.string().optional(),
  manager_email: z.string().email("Email inválido").optional().or(z.literal("")),
  observations: z.string().optional(),
  active: z.boolean(),
  drive_link: z.string().url("URL inválida").optional().or(z.literal("")),
});

type PartnerFormData = z.infer<typeof partnerSchema>;

interface PartnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  partner?: any;
  onSuccess: () => void;
}

export function PartnerModal({
  open,
  onOpenChange,
  categoryId,
  partner,
  onSuccess,
}: PartnerModalProps) {
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<any[]>([]);
  const [newLink, setNewLink] = useState({ title: "", url: "" });

  const form = useForm<PartnerFormData>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: "",
      manager_name: "",
      manager_phone: "",
      manager_email: "",
      observations: "",
      active: true,
      drive_link: "",
    },
  });

  useEffect(() => {
    if (partner) {
      form.reset({
        name: partner.name,
        manager_name: partner.manager_name || "",
        manager_phone: partner.manager_phone || "",
        manager_email: partner.manager_email || "",
        observations: partner.observations || "",
        active: partner.active,
        drive_link: partner.drive_link || "",
      });
      loadLinks();
    } else {
      form.reset();
      setLinks([]);
    }
  }, [partner]);

  const loadLinks = async () => {
    if (!partner) return;
    const { data } = await supabase
      .from("partner_links")
      .select("*")
      .eq("partner_id", partner.id);
    setLinks(data || []);
  };

  const onSubmit = async (data: PartnerFormData) => {
    setLoading(true);
    try {
      if (partner) {
        const { error } = await supabase
          .from("partners")
          .update(data)
          .eq("id", partner.id);
        if (error) throw error;
        toast.success("Construtora atualizada");
      } else {
        const { error } = await supabase
          .from("partners")
          .insert({ ...data, category_id: categoryId });
        if (error) throw error;
        toast.success("Construtora criada");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addLink = async () => {
    if (!partner || !newLink.title || !newLink.url) return;
    const { error } = await supabase
      .from("partner_links")
      .insert({ partner_id: partner.id, ...newLink });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Link adicionado");
      setNewLink({ title: "", url: "" });
      loadLinks();
    }
  };

  const deleteLink = async (linkId: string) => {
    const { error } = await supabase
      .from("partner_links")
      .delete()
      .eq("id", linkId);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Link removido");
      loadLinks();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {partner ? "Editar Construtora" : "Nova Construtora"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="materiais" disabled={!partner}>Materiais</TabsTrigger>
            <TabsTrigger value="links" disabled={!partner}>Links</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Construtora</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manager_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Gerente</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="manager_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="manager_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="drive_link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link do Google Drive</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://drive.google.com/..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Construtora Ativa</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Salvando..." : "Salvar"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="materiais" className="mt-4">
            {partner && (
              <FileUpload partnerId={partner.id} onUploadComplete={loadLinks} />
            )}
          </TabsContent>

          <TabsContent value="links" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Input
                placeholder="Título do link"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
              />
              <Input
                placeholder="URL"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              />
              <Button onClick={addLink} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Link
              </Button>
            </div>

            <div className="space-y-2">
              {links.map((link) => (
                <div key={link.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{link.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteLink(link.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
