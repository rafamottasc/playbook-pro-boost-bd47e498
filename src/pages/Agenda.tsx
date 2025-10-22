import { useState } from "react";
import { Header } from "@/components/Header";
import { PageTransition } from "@/components/PageTransition";
import { Calendar, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WeeklyMeetingsGrid } from "@/components/agenda/WeeklyMeetingsGrid";
import { RoomFilter } from "@/components/agenda/RoomFilter";
import { MeetingDialog } from "@/components/agenda/MeetingDialog";

export default function Agenda() {
  const [selectedRoomId, setSelectedRoomId] = useState("all");
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageTransition>
        <main className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <Calendar className="h-10 w-10 text-primary" />
              Agenda de Reuniões
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              Gerencie suas reuniões e reserve salas
            </p>
          </div>

          {/* Filtros + Nova Reunião */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <RoomFilter
                  value={selectedRoomId}
                  onChange={setSelectedRoomId}
                />
                <Button onClick={() => setShowMeetingDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Nova Reunião
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Grid Semanal */}
          <WeeklyMeetingsGrid selectedRoomId={selectedRoomId} />

          {/* Dialog de Nova Reunião */}
          <MeetingDialog
            open={showMeetingDialog}
            onOpenChange={setShowMeetingDialog}
          />
        </main>
      </PageTransition>
    </div>
  );
}
