import React, { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { PageTransition } from "@/components/PageTransition";
import { Input } from "@/components/ui/input";
import { Search, Star } from "lucide-react";
import { PartnerCard } from "@/components/partners/PartnerCard";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function PartnersView() {
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCidade, setSelectedCidade] = useState<string>("todas");
  const [showFrenteMarOnly, setShowFrenteMarOnly] = useState(false);

  useEffect(() => {
    loadData();
    setupRealtime();
  }, []);

  const setupRealtime = () => {
    const channel = supabase
      .channel("partners-changes")
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
        .eq("active", true)
        .order("prioritaria", { ascending: false })
        .order("name");

      setPartners(partnersData || []);
    } catch (error) {
      console.error("Error loading data:", error);
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

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 space-y-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Construtoras Parceiras</h1>
            <p className="text-muted-foreground">
              Encontre materiais e informações das nossas construtoras validadas
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
                        isPrioritaria={true}
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
                        isPrioritaria={false}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}