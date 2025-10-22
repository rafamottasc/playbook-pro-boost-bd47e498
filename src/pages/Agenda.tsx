import { Header } from "@/components/Header";
import { PageTransition } from "@/components/PageTransition";
import { Calendar } from "lucide-react";
import { AgendaCalendar } from "@/components/agenda/AgendaCalendar";

export default function Agenda() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageTransition>
        <main className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Calendar className="h-10 w-10 text-primary" />
              Agenda de Reuniões
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              Gerencie suas reuniões e reserve salas
            </p>
          </div>

          {/* Calendário Principal */}
          <AgendaCalendar />
        </main>
      </PageTransition>
    </div>
  );
}
