import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { CategorySection } from "@/components/partners/CategorySection";
import { CategoryManager } from "@/components/partners/CategoryManager";
import { PartnerModal } from "@/components/partners/PartnerModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function PartnersManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    setupRealtime();
  }, []);

  const setupRealtime = () => {
    const channel = supabase
      .channel("admin-partners-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partners" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partners_categories" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partner_files" },
        () => loadData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "partner_links" },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Admin pode ver todas as categorias (ativas e inativas)
      const { data: categoriesData } = await supabase
        .from("partners_categories")
        .select("*")
        .order("display_order");

      // Admin pode ver todas as construtoras (ativas e inativas)
      const { data: partnersData } = await supabase
        .from("partners")
        .select(`
          *,
          partner_files (*),
          partner_links (*)
        `)
        .order("name");

      setCategories(categoriesData || []);
      setPartners(partnersData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = partners.filter((partner) =>
    partner.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPartnersByCategory = (categoryId: string) =>
    filteredPartners.filter((p) => p.category_id === categoryId);

  const handleAddPartner = (categoryId: string | null = null) => {
    setSelectedCategory(categoryId);
    setSelectedPartner(null);
    setModalOpen(true);
  };

  const handleEditPartner = (partner: any) => {
    setSelectedCategory(null);
    setSelectedPartner(partner);
    setModalOpen(true);
  };

  const handleDeletePartner = (partnerId: string) => {
    setPartnerToDelete(partnerId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!partnerToDelete) return;
    try {
      const { error } = await supabase
        .from("partners")
        .delete()
        .eq("id", partnerToDelete);
      if (error) throw error;
      toast.success("Construtora excluída");
      setDeleteDialogOpen(false);
      // Realtime vai atualizar automaticamente
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestão de Construtoras</h1>
        <p className="text-muted-foreground">
          Gerencie construtoras parceiras, categorias e materiais
        </p>
      </div>

      <Tabs defaultValue="partners" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="partners">Construtoras</TabsTrigger>
              <TabsTrigger value="categories">Categorias</TabsTrigger>
            </TabsList>

            <TabsContent value="partners" className="space-y-6">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar construtora..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => handleAddPartner()} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Construtora
                </Button>
              </div>

              {loading ? (
                <div className="space-y-8">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="h-8 w-48" />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map((j) => (
                          <Skeleton key={j} className="h-64" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-12">
                  {categories.map((category) => {
                    const categoryPartners = getPartnersByCategory(category.id);
                    
                    return (
                      <CategorySection
                        key={category.id}
                        categoryName={`${category.name}${!category.active ? ' (Inativa)' : ''}`}
                        partners={categoryPartners}
                        isAdmin
                        onEditPartner={handleEditPartner}
                        onDeletePartner={handleDeletePartner}
                      />
                    );
                  })}

                  {categories.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        Nenhuma categoria cadastrada
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Comece criando uma categoria na aba "Categorias"
                      </p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="categories">
              <CategoryManager />
            </TabsContent>
          </Tabs>

          <PartnerModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            categoryId={selectedCategory}
            partner={selectedPartner}
            onSuccess={loadData}
          />

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta construtora? Todos os arquivos e links
                  associados também serão removidos. Esta ação não pode ser desfeita.
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
