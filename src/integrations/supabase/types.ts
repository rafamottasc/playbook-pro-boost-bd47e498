export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      academy_lessons: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          duration_minutes: number | null
          id: string
          module_id: string
          points: number | null
          published: boolean | null
          title: string
          updated_at: string | null
          video_url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          module_id: string
          points?: number | null
          published?: boolean | null
          title: string
          updated_at?: string | null
          video_url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          duration_minutes?: number | null
          id?: string
          module_id?: string
          points?: number | null
          published?: boolean | null
          title?: string
          updated_at?: string | null
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_modules: {
        Row: {
          cover_url: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          published: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          published?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          published?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      academy_onboarding_views: {
        Row: {
          id: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: []
      }
      announcement_views: {
        Row: {
          announcement_id: string | null
          confirmed: boolean | null
          confirmed_at: string | null
          cta_clicked: boolean | null
          dismissed: boolean | null
          id: string
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          announcement_id?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          cta_clicked?: boolean | null
          dismissed?: boolean | null
          id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          announcement_id?: string | null
          confirmed?: boolean | null
          confirmed_at?: string | null
          cta_clicked?: boolean | null
          dismissed?: boolean | null
          id?: string
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcement_views_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcement_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          cta_link: string | null
          cta_text: string | null
          end_date: string | null
          icon: string | null
          id: string
          message: string
          priority: string
          requires_confirmation: boolean | null
          start_date: string
          target_audience: string
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          cta_link?: string | null
          cta_text?: string | null
          end_date?: string | null
          icon?: string | null
          id?: string
          message: string
          priority: string
          requires_confirmation?: boolean | null
          start_date?: string
          target_audience?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          cta_link?: string | null
          cta_text?: string | null
          end_date?: string | null
          icon?: string | null
          id?: string
          message?: string
          priority?: string
          requires_confirmation?: boolean | null
          start_date?: string
          target_audience?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_feedbacks: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string
          id: string
          message: string
          status: string
          team: string | null
          type: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string
          id?: string
          message: string
          status?: string
          team?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          status?: string
          team?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      application_logs: {
        Row: {
          action: string | null
          created_at: string
          id: string
          level: string
          message: string
          metadata: Json | null
          timestamp: string
          url: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          id?: string
          level: string
          message: string
          metadata?: Json | null
          timestamp?: string
          url?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          timestamp?: string
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_participants: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          construtora: string
          countries: string[] | null
          created_at: string
          empreendimento: string
          id: string
          link_anuncio: string | null
          states: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          construtora: string
          countries?: string[] | null
          created_at?: string
          empreendimento: string
          id?: string
          link_anuncio?: string | null
          states?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          construtora?: string
          countries?: string[] | null
          created_at?: string
          empreendimento?: string
          id?: string
          link_anuncio?: string | null
          states?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      cub_values: {
        Row: {
          created_at: string | null
          id: string
          month: number
          updated_by: string | null
          value: number
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          month: number
          updated_by?: string | null
          value: number
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          month?: number
          updated_by?: string | null
          value?: number
          year?: number
        }
        Relationships: []
      }
      daily_mood: {
        Row: {
          created_at: string
          date: string
          id: string
          mood: string
          team: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          mood: string
          team?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          mood?: string
          team?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          category_id: string | null
          completed_at: string | null
          created_at: string
          display_order: number
          done: boolean
          id: string
          notes: string | null
          period: string
          priority: string
          recurrence: string | null
          scheduled_time: string | null
          task_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          display_order?: number
          done?: boolean
          id?: string
          notes?: string | null
          period: string
          priority?: string
          recurrence?: string | null
          scheduled_time?: string | null
          task_date?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          display_order?: number
          done?: boolean
          id?: string
          notes?: string | null
          period?: string
          priority?: string
          recurrence?: string | null
          scheduled_time?: string | null
          task_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "task_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_attachments: {
        Row: {
          created_at: string | null
          file_type: string
          file_url: string
          id: string
          lesson_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          file_type: string
          file_url: string
          id?: string
          lesson_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          file_type?: string
          file_url?: string
          id?: string
          lesson_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_attachments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          lesson_id: string
          user_id: string
          was_useful: boolean
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
          was_useful: boolean
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
          was_useful?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lesson_feedback_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          created_at: string | null
          id: string
          lesson_id: string
          likes: number | null
          question: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string | null
          id?: string
          lesson_id: string
          likes?: number | null
          question: string
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string | null
          id?: string
          lesson_id?: string
          likes?: number | null
          question?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_questions_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_questions_answered_by_fkey"
            columns: ["answered_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_audit_logs: {
        Row: {
          action: string
          created_by: string | null
          details: Json | null
          end_date: string | null
          id: string
          meeting_id: string | null
          meeting_title: string
          performed_at: string | null
          performed_by: string | null
          reason: string | null
          room_name: string | null
          start_date: string | null
        }
        Insert: {
          action: string
          created_by?: string | null
          details?: Json | null
          end_date?: string | null
          id?: string
          meeting_id?: string | null
          meeting_title: string
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
          room_name?: string | null
          start_date?: string | null
        }
        Update: {
          action?: string
          created_by?: string | null
          details?: Json | null
          end_date?: string | null
          id?: string
          meeting_id?: string | null
          meeting_title?: string
          performed_at?: string | null
          performed_by?: string | null
          reason?: string | null
          room_name?: string | null
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_audit_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_audit_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_rooms: {
        Row: {
          active: boolean | null
          capacity: number | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          created_by: string
          description: string | null
          end_date: string
          id: string
          participants_count: number | null
          room_id: string
          start_date: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          participants_count?: number | null
          room_id: string
          start_date: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          participants_count?: number | null
          room_id?: string
          start_date?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "meeting_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          delivery_type: string | null
          dislikes: number | null
          display_order: number | null
          funnel_slug: string | null
          id: string
          likes: number | null
          stage_name: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          delivery_type?: string | null
          dislikes?: number | null
          display_order?: number | null
          funnel_slug?: string | null
          id?: string
          likes?: number | null
          stage_name?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          delivery_type?: string | null
          dislikes?: number | null
          display_order?: number | null
          funnel_slug?: string | null
          id?: string
          likes?: number | null
          stage_name?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          link: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_files: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          partner_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          partner_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          partner_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_files_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_links: {
        Row: {
          created_at: string | null
          id: string
          link_type: string | null
          partner_id: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          link_type?: string | null
          partner_id: string
          title: string
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          link_type?: string | null
          partner_id?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_links_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          active: boolean | null
          category_id: string | null
          cidade: string | null
          created_at: string | null
          drive_link: string | null
          frente_mar: boolean | null
          id: string
          last_updated_at: string | null
          manager_email: string | null
          manager_name: string | null
          manager_phone: string | null
          name: string
          observations: string | null
          prioritaria: boolean | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category_id?: string | null
          cidade?: string | null
          created_at?: string | null
          drive_link?: string | null
          frente_mar?: boolean | null
          id?: string
          last_updated_at?: string | null
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          name: string
          observations?: string | null
          prioritaria?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category_id?: string | null
          cidade?: string | null
          created_at?: string | null
          drive_link?: string | null
          frente_mar?: boolean | null
          id?: string
          last_updated_at?: string | null
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          name?: string
          observations?: string | null
          prioritaria?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "partners_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      partners_categories: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_flows: {
        Row: {
          calculation_data: Json
          client_name: string
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          calculation_data: Json
          client_name: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          calculation_data?: Json
          client_name?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_flows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_flows_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_funnels: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          display_order: number
          emoji: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          emoji?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          emoji?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      playbook_stages: {
        Row: {
          active: boolean | null
          created_at: string | null
          display_order: number
          funnel_id: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          display_order?: number
          funnel_id: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          display_order?: number
          funnel_id?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "playbook_stages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "playbook_funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_options: {
        Row: {
          created_at: string | null
          display_order: number
          id: string
          option_text: string
          poll_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number
          id?: string
          option_text: string
          poll_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number
          id?: string
          option_text?: string
          poll_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_responses: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_responses_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      poll_views: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          poll_id: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "poll_views_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          active: boolean | null
          allow_multiple: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          results_cache: Json | null
          start_date: string
          target_audience: string
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          allow_multiple?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          results_cache?: Json | null
          start_date: string
          target_audience?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          allow_multiple?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          results_cache?: Json | null
          start_date?: string
          target_audience?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean | null
          avatar_url: string | null
          blocked: boolean | null
          created_at: string | null
          creci: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          last_sign_in_at: string | null
          points: number
          profile_onboarding_completed: boolean | null
          team: string | null
          updated_at: string | null
          whatsapp: string
        }
        Insert: {
          approved?: boolean | null
          avatar_url?: string | null
          blocked?: boolean | null
          created_at?: string | null
          creci?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          id: string
          last_sign_in_at?: string | null
          points?: number
          profile_onboarding_completed?: boolean | null
          team?: string | null
          updated_at?: string | null
          whatsapp: string
        }
        Update: {
          approved?: boolean | null
          avatar_url?: string | null
          blocked?: boolean | null
          created_at?: string | null
          creci?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          last_sign_in_at?: string | null
          points?: number
          profile_onboarding_completed?: boolean | null
          team?: string | null
          updated_at?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      question_likes: {
        Row: {
          created_at: string | null
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_likes_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "lesson_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_attempts: {
        Row: {
          action: string
          created_at: string
          id: string
          identifier: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          identifier: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      resource_categories: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: Database["public"]["Enums"]["resource_category"] | null
          category_id: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          file_name: string | null
          file_size: number | null
          id: string
          resource_type: string
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["resource_category"] | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          resource_type: string
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          category?: Database["public"]["Enums"]["resource_category"] | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          resource_type?: string
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "resource_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_cleanup_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          executed_by: string | null
          files_deleted: number
          id: string
          space_freed_bytes: number
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          executed_by?: string | null
          files_deleted?: number
          id?: string
          space_freed_bytes?: number
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          executed_by?: string | null
          files_deleted?: number
          id?: string
          space_freed_bytes?: number
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          status: string | null
          suggestion_text: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          status?: string | null
          suggestion_text: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          status?: string | null
          suggestion_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      task_attachments: {
        Row: {
          attachment_type: string
          created_at: string
          file_size: number | null
          file_type: string | null
          file_url: string | null
          id: string
          task_id: string
          title: string
          url: string | null
        }
        Insert: {
          attachment_type: string
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          task_id: string
          title: string
          url?: string | null
        }
        Update: {
          attachment_type?: string
          created_at?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          task_id?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          color: string
          created_at: string
          display_order: number
          icon: string
          id: string
          is_system: boolean
          label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_system?: boolean
          label: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number
          icon?: string
          id?: string
          is_system?: boolean
          label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_checklist_items: {
        Row: {
          created_at: string
          display_order: number
          done: boolean
          id: string
          task_id: string
          text: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          done?: boolean
          id?: string
          task_id: string
          text: string
        }
        Update: {
          created_at?: string
          display_order?: number
          done?: boolean
          id?: string
          task_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_contacts: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          phone: string | null
          task_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          task_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_contacts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "daily_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          active: boolean | null
          created_at: string | null
          display_order: number | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          created_at: string
          id: string
          primary_hue: number
          primary_lightness: number
          primary_saturation: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          primary_hue?: number
          primary_lightness?: number
          primary_saturation?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          primary_hue?: number
          primary_lightness?: number
          primary_saturation?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          completed_percentage: number | null
          id: string
          lesson_id: string
          user_id: string
          video_progress: number | null
          watched: boolean | null
          watched_at: string | null
        }
        Insert: {
          completed_percentage?: number | null
          id?: string
          lesson_id: string
          user_id: string
          video_progress?: number | null
          watched?: boolean | null
          watched_at?: string | null
        }
        Update: {
          completed_percentage?: number | null
          id?: string
          lesson_id?: string
          user_id?: string
          video_progress?: number | null
          watched?: boolean | null
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "academy_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_message_copies: {
        Row: {
          created_at: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_message_copies_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_message_copies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_message_copies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_message_feedback: {
        Row: {
          created_at: string | null
          feedback_type: string | null
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_type?: string | null
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_message_feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_message_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_message_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      users_with_roles: {
        Row: {
          approved: boolean | null
          avatar_url: string | null
          blocked: boolean | null
          created_at: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string | null
          is_admin: boolean | null
          last_sign_in_at: string | null
          points: number | null
          roles: Json | null
          team: string | null
          whatsapp: string | null
        }
        Insert: {
          approved?: boolean | null
          avatar_url?: string | null
          blocked?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          is_admin?: never
          last_sign_in_at?: string | null
          points?: number | null
          roles?: never
          team?: string | null
          whatsapp?: string | null
        }
        Update: {
          approved?: boolean | null
          avatar_url?: string | null
          blocked?: boolean | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string | null
          is_admin?: never
          last_sign_in_at?: string | null
          points?: number | null
          roles?: never
          team?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      decrement_question_likes: {
        Args: { question_id: string }
        Returns: undefined
      }
      delete_old_logs: { Args: never; Returns: undefined }
      extract_storage_path: { Args: { file_url: string }; Returns: string }
      get_active_announcements: {
        Args: never
        Returns: {
          cta_link: string
          cta_text: string
          dismissed: boolean
          icon: string
          id: string
          message: string
          priority: string
          requires_confirmation: boolean
          title: string
        }[]
      }
      get_mood_metrics:
        | {
            Args: {
              days_period?: number
              limit_records?: number
              offset_records?: number
            }
            Returns: Json
          }
        | {
            Args: {
              days_period?: number
              filter_team?: string
              filter_user_id?: string
              limit_records?: number
              offset_records?: number
            }
            Returns: Json
          }
      get_public_profiles: {
        Args: never
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          points: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_question_likes: {
        Args: { question_id: string }
        Returns: undefined
      }
      is_first_admin: { Args: { target_user_id: string }; Returns: boolean }
      is_user_blocked: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "corretor"
      resource_category: "administrativo" | "digital"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "corretor"],
      resource_category: ["administrativo", "digital"],
    },
  },
} as const
