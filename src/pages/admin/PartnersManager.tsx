import React, { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Star } from "lucide-react";
import { PartnerCard } from "@/components/partners/PartnerCard";
import { PartnerModal } from "@/components/partners/PartnerModal";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCidade, setSelectedCidade] = useState<string>("todas");
  const [showFrenteMarOnly, setShowFrenteMarOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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
      const { data: partnersData } = await supabase
        .from("partners")
        .select(`
          *,
          partner_files (*),
          partner_links (*)
        `)
        .order("prioritaria", { ascending: false })
        .order("name");

      setPartners(partnersData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  // Computar cidades únicas disponíveis
  const cidadesDisponiveis = useMemo(() => {
    const cidades = partners
      .map(p => p.cidade)
      .filter((c): c is string => !!c);
    return [...new Set(cidades)].sort();
  }, [partners]);

  // Filtro combinado
  const filteredPartners = useMemo(() => {
    return partners.filter(partner => {
      const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCidade = selectedCidade === "todas" || partner.cidade === selectedCidade;
      const matchesFrenteMar = !showFrenteMarOnly || partner.frente_mar === true;
      
      return matchesSearch && matchesCidade && matchesFrenteMar;
    });
  }, [partners, searchQuery, selectedCidade, showFrenteMarOnly]);

  // Separar prioritárias das demais
  const prioritarias = filteredPartners.filter(p => p.prioritaria);
  const outras = filteredPartners.filter(p => !p.prioritaria);

  const handleAddPartner = () => {
    setSelectedPartner(null);
    setModalOpen(true);
  };

  const handleEditPartner = (partner: any) => {
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
      // Buscar e deletar arquivos do storage
      const { data: files } = await supabase
        .from('partner_files')
        .select('file_url')
        .eq('partner_id', partnerToDelete);

      if (files && files.length > 0) {
        const filePaths = files
          .map(f => f.file_url.split('/partner-files/')[1])
          .filter(Boolean);
        
        if (filePaths.length > 0) {
          await supabase.storage.from('partner-files').remove(filePaths);
        }
      }

      // Deletar parceiro (CASCADE deleta registros relacionados)
      const { error } = await supabase
        .from("partners")
        .delete()
        .eq("id", partnerToDelete);
      
      if (error) throw error;
      toast.success("Construtora e arquivos excluídos");
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestão de Construtoras</h1>
        <p className="text-muted-foreground">
          Gerencie construtoras parceiras e materiais
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar construtora..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCidade} onValueChange={setSelectedCidade}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas as cidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as cidades</SelectItem>
            {cidadesDisponiveis.map(cidade => (
              <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="frente-mar" 
            checked={showFrenteMarOnly}
            onCheckedChange={(checked) => setShowFrenteMarOnly(!!checked)}
          />
          <label htmlFor="frente-mar" className="text-sm cursor-pointer">
            Frente Mar
          </label>
        </div>

        <Button onClick={handleAddPartner} size="lg" className="ml-auto">
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
        <div className="space-y-8">
          {/* Bloco Prioritárias */}
          {prioritarias.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 text-primary fill-primary" />
                <h2 className="text-2xl font-bold">Construtoras Prioritárias</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {prioritarias.map(partner => (
                  <PartnerCard
                    key={partner.id}
                    partner={partner}
                    isAdmin={true}
                    isPrioritaria={true}
                    onEdit={() => handleEditPartner(partner)}
                    onDelete={() => handleDeletePartner(partner.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Bloco Construtoras Parceiras */}
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Construtoras Parceiras</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {outras.length} {outras.length === 1 ? "construtora" : "construtoras"}
              </p>
            </div>
            
            {outras.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  {filteredPartners.length === 0 && partners.length > 0 
                    ? "Nenhuma construtora encontrada com os filtros aplicados" 
                    : "Nenhuma construtora cadastrada"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {outras.map(partner => (
                  <PartnerCard
                    key={partner.id}
                    partner={partner}
                    isAdmin={true}
                    isPrioritaria={false}
                    onEdit={() => handleEditPartner(partner)}
                    onDelete={() => handleDeletePartner(partner.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <PartnerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
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