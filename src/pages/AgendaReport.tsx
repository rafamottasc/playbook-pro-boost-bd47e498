import { useState } from "react";
import { Header } from "@/components/Header";
import { PageTransition } from "@/components/PageTransition";
import { FileText, Calendar, User, MapPin, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useMeetingsReport } from "@/hooks/useMeetingsReport";
import { useMeetingRooms } from "@/hooks/useMeetingRooms";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function AgendaReport() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'all' | 'confirmed' | 'cancelled'>('all');
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [selectedRoomId, setSelectedRoomId] = useState('all');
  const [selectedCreatorId, setSelectedCreatorId] = useState('all');
  
  // Paginação - Reuniões
  const [currentMeetingsPage, setCurrentMeetingsPage] = useState(1);
  const [meetingsPerPage, setMeetingsPerPage] = useState(10);
  
  // Paginação - Auditoria
  const [currentAuditPage, setCurrentAuditPage] = useState(1);
  const [auditPerPage, setAuditPerPage] = useState(10);

  const { rooms } = useMeetingRooms();
  
  const startDate = period === 'week' 
    ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    : period === 'month'
    ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    : undefined;

  const { meetings, auditLogs, loading } = useMeetingsReport({
    status,
    startDate,
    roomId: selectedRoomId,
    createdBy: selectedCreatorId,
  });

  // Lógica de paginação para reuniões
  const totalMeetingsPages = Math.ceil(meetings.length / meetingsPerPage);
  const paginatedMeetings = meetings.slice(
    (currentMeetingsPage - 1) * meetingsPerPage,
    currentMeetingsPage * meetingsPerPage
  );
  
  // Lógica de paginação para auditoria
  const totalAuditPages = Math.ceil(auditLogs.length / auditPerPage);
  const paginatedAuditLogs = auditLogs.slice(
    (currentAuditPage - 1) * auditPerPage,
    currentAuditPage * auditPerPage
  );

  const getStatusBadge = (meetingStatus: string) => {
    if (meetingStatus === 'confirmed') {
      return <Badge variant="default">✅ Confirmada</Badge>;
    }
    return <Badge variant="destructive">❌ Cancelada</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageTransition>
        <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
              <FileText className="h-10 w-10 text-primary" />
              Relatório de Reuniões
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              Visualize o histórico completo de reuniões e auditoria
            </p>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="confirmed">Confirmadas</SelectItem>
                      <SelectItem value="cancelled">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Período</label>
                  <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Último mês</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Sala</label>
                  <Select value={selectedRoomId} onValueChange={setSelectedRoomId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as salas</SelectItem>
                      {rooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Por página</label>
                  <Select value={meetingsPerPage.toString()} onValueChange={(v) => {
                    setMeetingsPerPage(Number(v));
                    setCurrentMeetingsPage(1);
                    setAuditPerPage(Number(v));
                    setCurrentAuditPage(1);
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 por página</SelectItem>
                      <SelectItem value="10">10 por página</SelectItem>
                      <SelectItem value="20">20 por página</SelectItem>
                      <SelectItem value="50">50 por página</SelectItem>
                      <SelectItem value="100">100 por página</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground mt-2">
                    <div>Total: {meetings.length} reuniões</div>
                    <div>Excluídas: {auditLogs.length}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs - Reuniões e Auditoria */}
          <Tabs defaultValue="meetings" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="meetings">Reuniões ({meetings.length})</TabsTrigger>
              <TabsTrigger value="audit">Auditoria ({auditLogs.length})</TabsTrigger>
            </TabsList>

            {/* Tab: Reuniões */}
            <TabsContent value="meetings" className="space-y-4 mt-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : meetings.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhuma reunião encontrada</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {paginatedMeetings.map(meeting => (
                    <Card key={meeting.id} className={meeting.status === 'cancelled' ? 'opacity-60' : ''}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex items-start gap-3">
                              <h3 className="font-semibold text-lg">{meeting.title}</h3>
                              {getStatusBadge(meeting.status)}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {meeting.room_name}
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(meeting.start_date), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {format(new Date(meeting.start_date), "HH:mm")} - {format(new Date(meeting.end_date), "HH:mm")}
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                {meeting.creator_name}
                              </div>
                            </div>

                            {meeting.status === 'cancelled' && meeting.cancellation_reason && (
                              <div className="flex items-start gap-2 text-sm bg-destructive/10 p-3 rounded-md">
                                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                                <div>
                                  <strong className="text-destructive">Motivo do cancelamento:</strong>
                                  <p className="text-muted-foreground mt-1">{meeting.cancellation_reason}</p>
                                </div>
                              </div>
                            )}

                            {meeting.description && (
                              <p className="text-sm text-muted-foreground">{meeting.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {totalMeetingsPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentMeetingsPage(p => Math.max(1, p - 1))}
                              className={currentMeetingsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          
                          {[...Array(totalMeetingsPages)].map((_, i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                onClick={() => setCurrentMeetingsPage(i + 1)}
                                isActive={currentMeetingsPage === i + 1}
                                className="cursor-pointer"
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentMeetingsPage(p => Math.min(totalMeetingsPages, p + 1))}
                              className={currentMeetingsPage === totalMeetingsPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                      
                      <p className="text-center text-sm text-muted-foreground mt-3">
                        Página {currentMeetingsPage} de {totalMeetingsPages} - Total: {meetings.length} reuniões
                      </p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Tab: Auditoria */}
            <TabsContent value="audit" className="space-y-4 mt-4">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Nenhum registro de auditoria</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {paginatedAuditLogs.map(log => (
                    <Card key={log.id}>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                🗑️ {log.meeting_title}
                                <Badge variant="destructive">Excluída</Badge>
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Excluída por <strong>{log.performer_name}</strong> em{' '}
                                {format(new Date(log.performed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {log.room_name || 'Sala desconhecida'}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {log.start_date ? format(new Date(log.start_date), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              {log.start_date && log.end_date 
                                ? `${format(new Date(log.start_date), "HH:mm")} - ${format(new Date(log.end_date), "HH:mm")}`
                                : 'N/A'}
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Criada por {log.creator_name}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {totalAuditPages > 1 && (
                    <div className="mt-6">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentAuditPage(p => Math.max(1, p - 1))}
                              className={currentAuditPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          
                          {[...Array(totalAuditPages)].map((_, i) => (
                            <PaginationItem key={i}>
                              <PaginationLink
                                onClick={() => setCurrentAuditPage(i + 1)}
                                isActive={currentAuditPage === i + 1}
                                className="cursor-pointer"
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={() => setCurrentAuditPage(p => Math.min(totalAuditPages, p + 1))}
                              className={currentAuditPage === totalAuditPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                      
                      <p className="text-center text-sm text-muted-foreground mt-3">
                        Página {currentAuditPage} de {totalAuditPages} - Total: {auditLogs.length} registros
                      </p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </PageTransition>
    </div>
  );
}
