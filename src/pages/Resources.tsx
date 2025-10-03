import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Link, Video } from "lucide-react";

export default function Resources() {
  return (
    <div className="min-h-screen bg-background">
      <Header userPoints={127} userName="João Silva" />

      <main className="container py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Central de Recursos</h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                PDFs e Guias
              </CardTitle>
              <CardDescription>
                Roteiros de atendimento e materiais de apoio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nenhum recurso disponível ainda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5 text-primary" />
                Links Úteis
              </CardTitle>
              <CardDescription>
                Drive, landing pages e ferramentas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nenhum link disponível ainda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Vídeos e Tutoriais
              </CardTitle>
              <CardDescription>
                Cases de sucesso e treinamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Nenhum vídeo disponível ainda
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
