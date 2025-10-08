import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ModuleCard } from "@/components/academy/ModuleCard";
import { AcademyOnboarding } from "@/components/academy/AcademyOnboarding";
import { GraduationCap } from "lucide-react";

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modules.map((module) => (
              <ModuleCard key={module.id} module={module} />
            ))}
          </div>
        )}
      </main>

      {showOnboarding && <AcademyOnboarding onClose={handleCloseOnboarding} />}
    </div>
  );
}
