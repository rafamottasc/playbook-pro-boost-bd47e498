import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Link as LinkIcon, Video, ExternalLink, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  url: string;
  resource_type: string;
  created_at: string;
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
        title: "Erro ao carregar recursos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getResourcesByType = (type: string) => {
    return resources.filter(r => r.resource_type === type);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "pdf": return FileText;
      case "link": return LinkIcon;
      case "video": return Video;
      default: return FileText;
    }
  };

  const renderResources = (type: string, title: string, description: string) => {
    const typeResources = getResourcesByType(type);
    const Icon = getIcon(type);

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
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : typeResources.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum recurso disponível ainda
            </p>
          ) : (
            <div className="space-y-4">
              {typeResources.map((resource) => (
                <div 
                  key={resource.id} 
                  className="group border-l-4 border-primary/50 hover:border-primary pl-4 pr-2 py-2 rounded-r transition-all hover:bg-accent/50"
                >
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
                        Abrir
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      {resource.resource_type === "pdf" && (
                        <a
                          href={resource.url}
                          download
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          Baixar
                          <Upload className="h-3 w-3 rotate-180" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userPoints={127} userName="João Silva" />

      <main className="container py-6 px-4">
        <h1 className="text-3xl font-bold mb-2">Central de Recursos</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Se os arquivos não abrirem, desative extensões de bloqueio de anúncios ou use o botão "Baixar"
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {renderResources("pdf", "PDFs e Guias", "Roteiros de atendimento e materiais de apoio")}
          {renderResources("link", "Links Úteis", "Drive, landing pages e ferramentas")}
          {renderResources("video", "Vídeos e Tutoriais", "Cases de sucesso e treinamentos")}
        </div>
      </main>
    </div>
  );
}
