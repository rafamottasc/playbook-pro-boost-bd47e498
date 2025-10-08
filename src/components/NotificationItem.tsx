import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { Bell, GraduationCap, Info, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationItemProps {
  notification: Notification;
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const navigate = useNavigate();
  const { markAsRead } = useNotifications();

  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    navigate(notification.link);
  };

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(notification.id);
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'academy_question':
        return <GraduationCap className="h-4 w-4 text-blue-600" />;
      case 'academy_answer':
        return <GraduationCap className="h-4 w-4 text-green-600" />;
      case 'academy':
        return <GraduationCap className="h-4 w-4" />;
      case 'system':
        return <Info className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'academy_question':
        return 'border-l-4 border-l-blue-500 bg-blue-50/50';
      case 'academy_answer':
        return 'border-l-4 border-l-green-500 bg-green-50/50';
      default:
        return !notification.read ? 'bg-accent/50' : '';
    }
  };

  const getHoverStyle = () => {
    if (notification.read) {
      return 'hover:bg-muted/30';
    }
    return 'hover:bg-blue-50/50';
  };

  const getIconOpacity = () => {
    return notification.read ? 'opacity-60' : 'opacity-100';
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "p-4 border-b cursor-pointer transition-all duration-200",
        getNotificationStyle(),
        getHoverStyle()
      )}
    >
      <div className="flex gap-3">
        <div className={cn("flex-shrink-0 mt-1 transition-opacity duration-200", getIconOpacity())}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              "text-sm font-medium",
              !notification.read && "font-semibold"
            )}>
              {notification.title}
            </p>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!notification.read && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleMarkAsRead}
                    title="Marcar como lida"
                  >
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </Button>
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: ptBR
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
