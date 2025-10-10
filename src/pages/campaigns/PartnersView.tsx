import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { PageTransition } from "@/components/PageTransition";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { CategorySection } from "@/components/partners/CategorySection";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

export default function PartnersView() {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
      const { data: categoriesData } = await supabase
        .from("partners_categories")
        .select("*")
        .eq("active", true)
        .order("display_order");

      const { data: partnersData } = await supabase
        .from("partners")
        .select(`
          *,
          partner_files (*),
          partner_links (*)
        `)
        .eq("active", true);

      setCategories(categoriesData || []);
      setPartners(partnersData || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPartners = partners.filter((partner) =>
    partner.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPartnersByCategory = (categoryId: string) =>
    filteredPartners.filter((p) => p.category_id === categoryId);

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

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar construtora..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
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
                if (categoryPartners.length === 0 && searchQuery) return null;
                
                return (
                  <CategorySection
                    key={category.id}
                    categoryName={category.name}
                    partners={categoryPartners}
                    isAdmin={isAdmin}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
}
