import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Megaphone, Bell, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: "info" | "warning" | "urgent" | "success";
  icon: string;
  cta_text: string | null;
  cta_link: string | null;
  dismissed: boolean;
}

const iconMap = {
  megaphone: Megaphone,
  bell: Bell,
  alert: AlertTriangle,
  check: CheckCircle,
  info: Info,
};

const priorityStyles = {
  urgent: {
    container: "border-destructive bg-destructive/10",
    icon: "text-destructive",
    button: "bg-destructive hover:bg-destructive/90",
  },
  warning: {
    container: "border-orange-500 bg-orange-50 dark:bg-orange-950/20",
    icon: "text-orange-600 dark:text-orange-400",
    button: "bg-orange-600 hover:bg-orange-700",
  },
  info: {
    container: "border-blue-500 bg-blue-50 dark:bg-blue-950/20",
    icon: "text-blue-600 dark:text-blue-400",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  success: {
    container: "border-green-500 bg-green-50 dark:bg-green-950/20",
    icon: "text-green-600 dark:text-green-400",
    button: "bg-green-600 hover:bg-green-700",
  },
};

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    try {
      const { data, error } = await supabase.rpc("get_active_announcements");

      if (error) throw error;

      if (data && data.length > 0) {
        setAnnouncement(data[0] as Announcement);
        setIsVisible(true);
      }
    } catch (error) {
      console.error("Error fetching announcement:", error);
    }
  };

  const handleDismiss = async () => {
    if (!announcement) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Insert or update view record with dismissed = true
      const { error } = await supabase
        .from("announcement_views")
        .upsert({
          announcement_id: announcement.id,
          user_id: user.id,
          dismissed: true,
        }, {
          onConflict: "announcement_id,user_id",
        });

      if (error) throw error;

      setIsVisible(false);
    } catch (error) {
      console.error("Error dismissing announcement:", error);
    }
  };

  const handleCtaClick = async () => {
    if (!announcement?.cta_link) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update view record with cta_clicked = true
      await supabase
        .from("announcement_views")
        .upsert({
          announcement_id: announcement.id,
          user_id: user.id,
          cta_clicked: true,
        }, {
          onConflict: "announcement_id,user_id",
        });

      window.open(announcement.cta_link, "_blank");
    } catch (error) {
      console.error("Error tracking CTA click:", error);
    }
  };

  if (!announcement || !isVisible) return null;

  const Icon = iconMap[announcement.icon as keyof typeof iconMap] || Megaphone;
  const styles = priorityStyles[announcement.priority];

  return (
    <Alert className={cn("relative animate-fade-in mb-8", styles.container)}>
      <Icon className={cn("h-5 w-5", styles.icon)} />
      <AlertTitle className="pr-8">{announcement.title}</AlertTitle>
      <AlertDescription className="mt-2">
        {announcement.message}
        {announcement.cta_text && announcement.cta_link && (
          <Button
            onClick={handleCtaClick}
            size="sm"
            className={cn("mt-3 ml-0", styles.button)}
          >
            {announcement.cta_text}
          </Button>
        )}
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleDismiss}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}
