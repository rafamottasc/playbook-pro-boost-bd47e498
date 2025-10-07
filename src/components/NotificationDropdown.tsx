import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "./NotificationItem";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NotificationDropdown() {
  const { notifications, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Notificações</h3>
        {notifications.some(n => !n.read) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            className="h-8"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas como lidas
          </Button>
        )}
      </div>
      
      <div className="max-h-[400px] overflow-y-auto">
        {recentNotifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma notificação
          </div>
        ) : (
          recentNotifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        )}
      </div>

      {notifications.length > 5 && (
        <div className="p-3 border-t">
          <Button
            variant="link"
            className="w-full"
            onClick={() => navigate('/notificacoes')}
          >
            Ver todas as notificações
          </Button>
        </div>
      )}
    </div>
  );
}
