import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Link as LinkIcon, Video, ExternalLink, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  resource_type: string;
  category: string;
  created_at: string;
  file_name?: string;
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      toast({
        title: "❌ Erro ao carregar recursos",
        description: "Não foi possível carregar os recursos. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getResourcesByCategory = (category: string) => {
    return resources.filter(r => r.category === category);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "pdf": return FileText;
      case "word": return FileText;
      case "link": return LinkIcon;
      case "video": return Video;
      default: return FileText;
    }
  };

  const renderResources = (category: string, title: string, description: string) => {
    const categoryResources = getResourcesByCategory(category);
    const Icon = FileText;

    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : categoryResources.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum recurso disponível ainda
            </p>
          ) : (
            <div className="space-y-4">
              {categoryResources.map((resource) => {
                const ResourceIcon = getIcon(resource.resource_type);
                return (
                  <div 
                    key={resource.id} 
                    className="group border-l-4 border-primary/50 hover:border-primary pl-4 pr-2 py-2 rounded-r transition-all hover:bg-accent/50"
                  >
                    <div className="flex items-start gap-2">
                      <ResourceIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {resource.title}
                        </h4>
                        {resource.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {resource.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(resource.created_at).toLocaleDateString("pt-BR")}
                          </span>
                          <div className="flex gap-3">
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                            >
                              {resource.resource_type === "link" ? "Abrir" : "Visualizar"}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            {(resource.resource_type === "pdf" || resource.resource_type === "image" || resource.resource_type === "word") && (
                              <a
                                href={`${resource.url}?download`}
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                              >
                                Baixar
                                <Upload className="h-3 w-3 rotate-180" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4">
        <h1 className="text-3xl font-bold mb-2">Central de Recursos</h1>
        <p className="text-muted-foreground mb-6">
          Hub de Suporte, Materiais e Treinamentos
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {renderResources("administrativo", "Materiais Administrativos", "Roteiros, guias, PDFs e materiais de apoio")}
          {renderResources("digital", "Material Digital", "Links, vídeos, imagens e recursos digitais")}
        </div>
      </main>
    </div>
  );
}
