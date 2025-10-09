import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ModuleCard } from "@/components/academy/ModuleCard";
import { AcademyOnboarding } from "@/components/academy/AcademyOnboarding";
import { Button } from "@/components/ui/button";
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
}

export default function AcademyModules() {
  const { user } = useAuth();
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
      // Usuários comuns só veem módulos publicados
      const { data, error } = await supabase
        .from('academy_modules')
        .select('*')
        .eq('published', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error) {
      console.error('Error fetching modules:', error);
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
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
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
            <h1 className="text-4xl font-bold">COMARC Academy</h1>
          </div>
          <p className="text-muted-foreground text-lg">
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
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-full w-16 rounded-none bg-gradient-to-r from-background via-background/80 to-transparent opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <ChevronLeft className="h-10 w-10" />
              </Button>
            )}
            
            <div className="overflow-hidden px-0 md:px-8" ref={emblaRef}>
              <div className="flex gap-4">
                {modules.map((module) => (
                  <div 
                    key={module.id} 
                    className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] md:flex-[0_0_33.333%] lg:flex-[0_0_25%] xl:flex-[0_0_20%]"
                  >
                    <ModuleCard module={module} />
                  </div>
                ))}
              </div>
            </div>

            {canScrollNext && (
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-full w-16 rounded-none bg-gradient-to-l from-background via-background/80 to-transparent opacity-0 md:opacity-100 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <ChevronRight className="h-10 w-10" />
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
