import React, { lazy, Suspense } from "react";
import { Header } from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, Rocket, Heart, Settings,
  FolderOpen, GraduationCap,
  MessageSquare, Workflow, Building2,
  Megaphone, Vote, MessageCircle, Smile,
  Users, Calculator, Palette, DoorOpen
} from "lucide-react";

// Lazy imports para otimização de bundle
const MessagesManager = lazy(() => import("@/components/admin/MessagesManager").then(m => ({ default: m.MessagesManager })));
const ResourcesManager = lazy(() => import("@/components/admin/ResourcesManager").then(m => ({ default: m.ResourcesManager })));
const UsersManager = lazy(() => import("@/components/admin/UsersManager").then(m => ({ default: m.UsersManager })));
const AcademyManager = lazy(() => import("@/components/admin/AcademyManager").then(m => ({ default: m.AcademyManager })));
const FunnelsManager = lazy(() => import("@/components/admin/FunnelsManager").then(m => ({ default: m.FunnelsManager })));
const AnnouncementsManager = lazy(() => import("@/components/admin/AnnouncementsManager").then(m => ({ default: m.AnnouncementsManager })));
const PartnersManager = lazy(() => import("@/pages/admin/PartnersManager"));
const MoodMetricsOptimized = lazy(() => import("@/components/admin/MoodMetricsOptimized"));
const FeedbacksManager = lazy(() => import("@/components/admin/FeedbacksManager").then(m => ({ default: m.FeedbacksManager })));
const PollsManager = lazy(() => import("@/components/admin/PollsManager").then(m => ({ default: m.PollsManager })));
const CubManager = lazy(() => import("@/components/admin/CubManager").then(m => ({ default: m.CubManager })));
const ThemeManager = lazy(() => import("@/components/admin/ThemeManager").then(m => ({ default: m.ThemeManager })));
const RoomsManager = lazy(() => import("@/components/admin/RoomsManager").then(m => ({ default: m.RoomsManager })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center space-y-2">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

export default function Admin() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-6 px-4">
        <h1 className="text-3xl font-bold mb-6">Painel Administrativo</h1>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="mb-6 w-full justify-start flex-wrap gap-2">
            <TabsTrigger value="content" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Conteúdo</span>
            </TabsTrigger>
            <TabsTrigger value="playbook" className="gap-2">
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Playbook</span>
            </TabsTrigger>
            <TabsTrigger value="cultura" className="gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Cultura</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Sistema</span>
            </TabsTrigger>
          </TabsList>

          {/* CONTEÚDO */}
          <TabsContent value="content" className="space-y-4">
            <Tabs defaultValue="resources" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="resources" className="gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Recursos
                </TabsTrigger>
                <TabsTrigger value="academy" className="gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Academy
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="resources">
                <Suspense fallback={<LoadingFallback />}>
                  <ResourcesManager />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="academy">
                <Suspense fallback={<LoadingFallback />}>
                  <AcademyManager />
                </Suspense>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* PLAYBOOK */}
          <TabsContent value="playbook" className="space-y-4">
            <Tabs defaultValue="messages" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="messages" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Mensagens
                </TabsTrigger>
                <TabsTrigger value="funis" className="gap-2">
                  <Workflow className="h-4 w-4" />
                  Funis
                </TabsTrigger>
                <TabsTrigger value="construtoras" className="gap-2">
                  <Building2 className="h-4 w-4" />
                  Construtoras
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="messages">
                <Suspense fallback={<LoadingFallback />}>
                  <MessagesManager />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="funis">
                <Suspense fallback={<LoadingFallback />}>
                  <FunnelsManager />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="construtoras">
                <Suspense fallback={<LoadingFallback />}>
                  <PartnersManager />
                </Suspense>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* CULTURA */}
          <TabsContent value="cultura" className="space-y-4">
            <Tabs defaultValue="avisos" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="avisos" className="gap-2">
                  <Megaphone className="h-4 w-4" />
                  Avisos
                </TabsTrigger>
                <TabsTrigger value="enquetes" className="gap-2">
                  <Vote className="h-4 w-4" />
                  Enquetes
                </TabsTrigger>
                <TabsTrigger value="feedbacks" className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Feedbacks
                </TabsTrigger>
                <TabsTrigger value="clima" className="gap-2">
                  <Smile className="h-4 w-4" />
                  Clima
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="avisos">
                <Suspense fallback={<LoadingFallback />}>
                  <AnnouncementsManager />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="enquetes">
                <Suspense fallback={<LoadingFallback />}>
                  <PollsManager />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="feedbacks">
                <Suspense fallback={<LoadingFallback />}>
                  <FeedbacksManager />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="clima">
                <Suspense fallback={<LoadingFallback />}>
                  <MoodMetricsOptimized />
                </Suspense>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* SISTEMA */}
          <TabsContent value="system" className="space-y-4">
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="users" className="gap-2">
                  <Users className="h-4 w-4" />
                  Usuários
                </TabsTrigger>
                <TabsTrigger value="rooms" className="gap-2">
                  <DoorOpen className="h-4 w-4" />
                  Salas
                </TabsTrigger>
                <TabsTrigger value="calculator" className="gap-2">
                  <Calculator className="h-4 w-4" />
                  Calculadora
                </TabsTrigger>
                <TabsTrigger value="theme" className="gap-2">
                  <Palette className="h-4 w-4" />
                  Aparência
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="users">
                <Suspense fallback={<LoadingFallback />}>
                  <UsersManager />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="rooms">
                <Suspense fallback={<LoadingFallback />}>
                  <RoomsManager />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="calculator">
                <Suspense fallback={<LoadingFallback />}>
                  <CubManager />
                </Suspense>
              </TabsContent>
              
              <TabsContent value="theme">
                <Suspense fallback={<LoadingFallback />}>
                  <ThemeManager />
                </Suspense>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
