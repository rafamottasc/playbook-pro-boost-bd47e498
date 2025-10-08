import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { PageTransition } from "@/components/PageTransition";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { CategorySection } from "@/components/partners/CategorySection";
import { CategoryManager } from "@/components/partners/CategoryManager";
import { PartnerModal } from "@/components/partners/PartnerModal";
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
import { Separator } from "@/components/ui/separator";

export default function PartnersManager() {
  const [categories, setCategories] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
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
    const { data: categoriesData } = await supabase
      .from("partners_categories")
      .select("*")
      .order("display_order");

    const { data: partnersData } = await supabase
      .from("partners")
      .select(`
        *,
        partner_files (*),
        partner_links (*)
      `);

    setCategories(categoriesData || []);
    setPartners(partnersData || []);
  };

  const filteredPartners = partners.filter((partner) =>
    partner.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPartnersByCategory = (categoryId: string) =>
    filteredPartners.filter((p) => p.category_id === categoryId);

  const handleAddPartner = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedPartner(null);
    setModalOpen(true);
  };

  const handleEditPartner = (partner: any) => {
    setSelectedCategory(partner.category_id);
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
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gerenciar Construtoras</h1>
            <p className="text-muted-foreground">
              Gerencie categorias e construtoras parceiras
            </p>
          </div>

          <CategoryManager />

          <Separator />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar construtora..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-12">
            {categories.map((category) => (
              <CategorySection
                key={category.id}
                categoryName={category.name}
                partners={getPartnersByCategory(category.id)}
                isAdmin
                onAddPartner={() => handleAddPartner(category.id)}
                onEditPartner={handleEditPartner}
                onDeletePartner={handleDeletePartner}
              />
            ))}
          </div>

          {selectedCategory && (
            <PartnerModal
              open={modalOpen}
              onOpenChange={setModalOpen}
              categoryId={selectedCategory}
              partner={selectedPartner}
              onSuccess={loadData}
            />
          )}

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
        </main>
      </div>
    </PageTransition>
  );
}
