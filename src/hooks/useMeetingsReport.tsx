import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Meeting } from "./useMeetings";

export interface MeetingAuditLog {
  id: string;
  meeting_id: string | null;
  meeting_title: string;
  action: 'deleted' | 'cancelled' | 'updated';
  performed_by: string | null;
  performed_at: string;
  details: any;
  reason: string | null;
  room_name: string | null;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  performer_name?: string;
  creator_name?: string;
}

interface UseMeetingsReportOptions {
  status?: 'all' | 'confirmed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  roomId?: string;
  createdBy?: string;
}

export function useMeetingsReport(options: UseMeetingsReportOptions = {}) {
  const { status = 'all', startDate, endDate, roomId, createdBy } = options;

  const { data: meetings = [], isLoading: loadingMeetings } = useQuery({
    queryKey: ['meetings-report', status, startDate, endDate, roomId, createdBy],
    queryFn: async () => {
      let query = supabase
        .from('meetings')
        .select(`
          *,
          room_name:meeting_rooms(name),
          creator_name:profiles!meetings_created_by_fkey(full_name),
          canceller_name:profiles!meetings_cancelled_by_fkey(full_name)
        `)
        .order('start_date', { ascending: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('start_date', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('start_date', endDate.toISOString());
      }

      if (roomId && roomId !== 'all') {
        query = query.eq('room_id', roomId);
      }

      if (createdBy && createdBy !== 'all') {
        query = query.eq('created_by', createdBy);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data.map(meeting => ({
        ...meeting,
        room_name: meeting.room_name?.name || 'Sala desconhecida',
        creator_name: meeting.creator_name?.full_name || 'Desconhecido',
        canceller_name: meeting.canceller_name?.full_name || null,
      })) as Meeting[];
    },
  });

  const { data: auditLogs = [], isLoading: loadingAuditLogs } = useQuery({
    queryKey: ['meeting-audit-logs', startDate, endDate, roomId, createdBy],
    queryFn: async () => {
      let query = supabase
        .from('meeting_audit_logs')
        .select('*')
        .order('performed_at', { ascending: false });

      if (startDate) {
        query = query.gte('start_date', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('start_date', endDate.toISOString());
      }

      if (roomId && roomId !== 'all') {
        query = query.eq('room_name', roomId);
      }

      if (createdBy && createdBy !== 'all') {
        query = query.eq('created_by', createdBy);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Buscar nomes dos usuários separadamente
      const userIds = [...new Set([
        ...data.map(log => log.performed_by).filter(Boolean),
        ...data.map(log => log.created_by).filter(Boolean),
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds as string[]);

      const profilesMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      return data.map(log => ({
        ...log,
        performer_name: log.performed_by ? profilesMap.get(log.performed_by) || 'Sistema' : 'Sistema',
        creator_name: log.created_by ? profilesMap.get(log.created_by) || 'Desconhecido' : 'Desconhecido',
      })) as MeetingAuditLog[];
    },
  });

  return {
    meetings,
    auditLogs,
    loading: loadingMeetings || loadingAuditLogs,
  };
}
