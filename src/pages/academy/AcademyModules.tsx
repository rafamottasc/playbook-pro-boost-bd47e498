import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { ModuleCard } from "@/components/academy/ModuleCard";
import { AcademyOnboarding } from "@/components/academy/AcademyOnboarding";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { PageTransition } from "@/components/PageTransition";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  display_order: number;
  lessonsCount?: number;
  completedCount?: number;
}

export default function AcademyModules() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: "start",
    slidesToScroll: 1,
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasSeenOnboarding = localStorage.getItem('academy_onboarding_seen');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }

    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      
      // Fetch modules with lesson counts in a single query
      const { data: modulesData, error: modulesError } = await supabase
        .from('academy_modules')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true });

      if (modulesError) throw modulesError;

      // Fetch all lesson IDs and completion data in one query
      const { data: lessonsData } = await supabase
        .from('academy_lessons')
        .select('id, module_id')
        .eq('published', true);

      const { data: userData } = await supabase.auth.getUser();
      let progressData = [];
      
      if (userData.user) {
        const { data } = await supabase
          .from('user_lesson_progress')
          .select('lesson_id')
          .eq('user_id', userData.user.id)
          .eq('watched', true);
        progressData = data || [];
      }

      // Build stats map
      const statsMap = new Map();
      modulesData?.forEach(module => {
        const moduleLessons = lessonsData?.filter(l => l.module_id === module.id) || [];
        const completedLessons = moduleLessons.filter(l => 
          progressData.some(p => p.lesson_id === l.id)
        );
        
        statsMap.set(module.id, {
          lessonsCount: moduleLessons.length,
          completedCount: completedLessons.length
        });
      });

      setModules(modulesData?.map(m => ({
        ...m,
        lessonsCount: statsMap.get(m.id)?.lessonsCount || 0,
        completedCount: statsMap.get(m.id)?.completedCount || 0
      })) || []);
    } catch (error: any) {
      console.error('Error fetching modules:', error);
      toast({
        title: "❌ Erro ao carregar módulos",
        description: "Não foi possível carregar os módulos. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseOnboarding = () => {
    localStorage.setItem('academy_onboarding_seen', 'true');
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <PageTransition>
          <main className="container mx-auto px-4 py-8">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Treinamentos Gerais</h1>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
                Cursos e capacitações para você se tornar um especialista
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[2/3] w-full" />
                  <div className="p-4">
                    <Skeleton className="h-4 w-3/4 mb-3" />
                    <Skeleton className="h-2 w-full mb-3" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </Card>
              ))}
            </div>
          </main>
        </PageTransition>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageTransition>
        <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Treinamentos Gerais</h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
            Cursos e capacitações para você se tornar um especialista
          </p>
        </div>

        {modules.length === 0 ? (
          <div className="text-center py-20">
            <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhum módulo disponível</h3>
            <p className="text-muted-foreground">
              Os módulos de treinamento estarão disponíveis em breve.
            </p>
          </div>
        ) : (
          <div className="relative group">
            {canScrollPrev && (
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollPrev}
                aria-label="Módulo anterior"
                className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-primary/90 hover:bg-primary text-white shadow-2xl opacity-0 md:opacity-90 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
            )}
            
            <div className="overflow-hidden px-0 md:px-8" ref={emblaRef}>
              <div className="flex gap-4">
                {modules.map((module) => (
                  <div 
                    key={module.id} 
                    className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] md:flex-[0_0_33.333%] lg:flex-[0_0_25%] xl:flex-[0_0_20%]"
                  >
                    <ModuleCard 
                      module={module} 
                      lessonsCount={module.lessonsCount || 0}
                      completedCount={module.completedCount || 0}
                    />
                  </div>
                ))}
              </div>
            </div>

            {canScrollNext && (
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollNext}
                aria-label="Próximo módulo"
                className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-primary/90 hover:bg-primary text-white shadow-2xl opacity-0 md:opacity-90 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            )}

            {/* Carousel indicators */}
            {modules.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {modules.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      emblaApi?.selectedScrollSnap() === index 
                        ? "w-8 bg-primary" 
                        : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                    aria-label={`Ir para módulo ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      </PageTransition>

      {showOnboarding && <AcademyOnboarding onClose={handleCloseOnboarding} />}
    </div>
  );
}
