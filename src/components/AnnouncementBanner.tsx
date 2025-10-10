import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Megaphone, Bell, AlertTriangle, CheckCircle, Info, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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
    container: "border-destructive/60 bg-gradient-to-br from-destructive/5 via-background to-destructive/10",
    icon: "text-destructive",
    button: "bg-destructive hover:bg-destructive/90 text-white",
  },
  warning: {
    container: "border-orange-500/60 bg-gradient-to-br from-orange-50/50 via-background to-orange-100/50 dark:from-orange-950/10 dark:via-background dark:to-orange-900/20",
    icon: "text-orange-600 dark:text-orange-400",
    button: "bg-orange-600 hover:bg-orange-700 text-white",
  },
  info: {
    container: "border-blue-500/60 bg-gradient-to-br from-blue-50/50 via-background to-blue-100/50 dark:from-blue-950/10 dark:via-background dark:to-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  success: {
    container: "border-green-500/60 bg-gradient-to-br from-green-50/50 via-background to-green-100/50 dark:from-green-950/10 dark:via-background dark:to-green-900/20",
    icon: "text-green-600 dark:text-green-400",
    button: "bg-green-600 hover:bg-green-700 text-white",
  },
};

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

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
    <div className="max-w-7xl mx-auto mb-8 px-4">
      <Card className={cn(
        "relative animate-fade-in shadow-comarc border-2 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
        styles.container
      )}>
        <CardContent className="p-6">
          <div className="flex gap-4">
            {/* Icon Section */}
            <div className="flex-shrink-0 pt-1">
              <div className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-sm", styles.icon)}>
                <Icon className="h-10 w-10" />
              </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0 pr-10">
              <h3 className={cn("text-xl font-bold mb-2", styles.icon)}>
                {announcement.title}
              </h3>
              <div className={cn(
                "flex gap-4",
                isMobile ? "flex-col items-start" : "flex-row items-center justify-between"
              )}>
                <p className="text-base text-foreground/90 leading-relaxed flex-1">
                  {announcement.message}
                </p>
                {announcement.cta_text && announcement.cta_link && (
                  <Button
                    onClick={handleCtaClick}
                    size={isMobile ? "sm" : "default"}
                    className={cn(
                      "font-medium shadow-sm flex-shrink-0 gap-2",
                      styles.button,
                      isMobile ? "mt-2 w-fit text-sm px-3" : "px-6 text-base"
                    )}
                  >
                    {announcement.cta_text}
                    <MousePointerClick className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 rounded-full text-foreground/60 hover:text-foreground hover:bg-background/90 hover:shadow-sm"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
