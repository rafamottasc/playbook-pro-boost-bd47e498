import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Megaphone, Bell, AlertTriangle, CheckCircle, Info, MousePointerClick } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import DOMPurify from 'dompurify';

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: "info" | "warning" | "urgent" | "success";
  icon: string;
  cta_text: string | null;
  cta_link: string | null;
  dismissed: boolean;
  requires_confirmation: boolean;
}

const sanitizeHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h3', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
  });
};

const iconMap = {
  megaphone: Megaphone,
  bell: Bell,
  alert: AlertTriangle,
  check: CheckCircle,
  info: Info,
};

const priorityStyles = {
  urgent: {
    container: "bg-gradient-to-br from-white/95 to-[#FFF5F5]/90 dark:from-[#1E1E23]/95 dark:to-[#281919]/90 backdrop-blur-[12px] saturate-150",
    borderColor: "border-l-[#E74C3C]",
    icon: "text-[#E74C3C]",
    button: "bg-[#E74C3C] hover:bg-[#E74C3C]/90 text-white",
  },
  warning: {
    container: "bg-gradient-to-br from-white/95 to-[#FFFCF5]/90 dark:from-[#1E1E23]/95 dark:to-[#282619]/90 backdrop-blur-[12px] saturate-150",
    borderColor: "border-l-[#F1C40F]",
    icon: "text-[#F1C40F]",
    button: "bg-[#F1C40F] hover:bg-[#F1C40F]/90 text-white",
  },
  info: {
    container: "bg-gradient-to-br from-white/95 to-[#F5FAFF]/90 dark:from-[#1E1E23]/95 dark:to-[#192328]/90 backdrop-blur-[12px] saturate-150",
    borderColor: "border-l-[#2E86DE]",
    icon: "text-[#2E86DE]",
    button: "bg-[#2E86DE] hover:bg-[#2E86DE]/90 text-white",
  },
  success: {
    container: "bg-gradient-to-br from-white/95 to-[#F5FFFA]/90 dark:from-[#1E1E23]/95 dark:to-[#192822]/90 backdrop-blur-[12px] saturate-150",
    borderColor: "border-l-[#00A884]",
    icon: "text-[#00A884]",
    button: "bg-[#00A884] hover:bg-[#00A884]/90 text-white",
  },
};

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
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

  const handleConfirm = async () => {
    if (!announcement) return;
    setIsConfirming(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("announcement_views")
        .upsert({
          announcement_id: announcement.id,
          user_id: user.id,
          confirmed: true,
          confirmed_at: new Date().toISOString(),
          dismissed: true,
        }, {
          onConflict: "announcement_id,user_id",
        });

      setIsVisible(false);
    } catch (error) {
      console.error("Error confirming announcement:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!announcement || !isVisible) return null;

  const Icon = iconMap[announcement.icon as keyof typeof iconMap] || Megaphone;
  const styles = priorityStyles[announcement.priority];

  return (
    <div className="max-w-7xl mx-auto mb-8 px-4">
      <Card className={cn(
        "relative animate-fade-in rounded-xl overflow-hidden transition-all duration-300",
        styles.container,
        "border border-border/50 border-l-4",
        styles.borderColor,
        "shadow-[0_2px_12px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:translate-y-[-2px]"
      )}>
        <CardContent className="p-5 sm:p-6">
          <div className={cn(
            "flex gap-4",
            isMobile ? "flex-col" : "flex-row items-start"
          )}>
            {/* Icon Section */}
            <div className="flex-shrink-0 pt-1">
              <Icon className={cn("h-12 w-12", styles.icon)} />
            </div>

            {/* Content Section */}
            <div className="flex-1 min-w-0">
              <h3 className={cn(
                "font-semibold mb-1",
                isMobile ? "text-lg" : "text-[1.125rem]",
                "text-[#222] dark:text-foreground"
              )}>
                {announcement.title}
              </h3>
              <div 
                className={cn(
                  "leading-relaxed prose prose-sm max-w-none",
                  "text-[0.95rem]",
                  "text-[#666] dark:text-muted-foreground",
                  "[&>p]:m-0 [&>p]:mb-2 [&>p:last-child]:mb-0",
                  "[&>ul]:my-2 [&>ul]:pl-0 [&>ol]:my-2 [&>ol]:pl-0",
                  "[&>strong]:font-semibold [&>strong]:text-[#222] dark:[&>strong]:text-foreground",
                  "[&>a]:text-primary [&>a]:underline hover:[&>a]:text-primary/80"
                )}
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(announcement.message) }}
              />
            </div>

            {/* Actions Section - À direita no desktop */}
            {(announcement.requires_confirmation || (announcement.cta_text && announcement.cta_link)) && (
              <div className={cn(
                "flex gap-2 flex-shrink-0",
                isMobile ? "flex-row flex-wrap w-full mt-3" : "flex-col items-end pr-8"
              )}>
                {announcement.requires_confirmation && (
                  <Button
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    size={isMobile ? "sm" : "default"}
                    className={cn(
                      "bg-transparent border-2 border-[#222] dark:border-white text-[#222] dark:text-white hover:bg-[#222] hover:text-white dark:hover:bg-white dark:hover:text-[#222] transition-all duration-300 font-medium shadow-sm gap-2",
                      isMobile ? "flex-1 text-sm px-3" : "px-6 text-base min-w-[180px]"
                    )}
                  >
                    <CheckCircle className="h-4 w-4" />
                    {isConfirming ? "Confirmando..." : "Li e estou ciente"}
                  </Button>
                )}
                {announcement.cta_text && announcement.cta_link && (
                  <Button
                    onClick={handleCtaClick}
                    size={isMobile ? "sm" : "default"}
                    className={cn(
                      "font-medium shadow-sm gap-2",
                      styles.button,
                      isMobile ? "flex-1 text-sm px-3" : "px-6 text-base min-w-[180px]"
                    )}
                  >
                    {announcement.cta_text}
                    <MousePointerClick className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}

            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-transparent text-[#999] hover:text-[#333] dark:text-muted-foreground dark:hover:text-foreground transition-colors duration-200"
              onClick={announcement.requires_confirmation ? undefined : handleDismiss}
              disabled={announcement.requires_confirmation}
              title={announcement.requires_confirmation ? "Confirme a leitura para fechar" : "Fechar"}
            >
              <X className={cn("h-4 w-4", announcement.requires_confirmation && "opacity-30")} />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
