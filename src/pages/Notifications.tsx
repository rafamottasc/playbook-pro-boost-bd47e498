import { Header } from "@/components/Header";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationItem } from "@/components/NotificationItem";
import { Button } from "@/components/ui/button";
import { CheckCheck, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Notifications() {
  const { notifications, markAllAsRead, deleteNotification } = useNotifications();

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Notificações</h1>
              <p className="text-muted-foreground mt-1">
                Acompanhe todas as suas notificações
              </p>
            </div>
            {unreadNotifications.length > 0 && (
              <Button onClick={markAllAsRead} variant="outline">
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
            )}
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">
                Todas ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Não lidas ({unreadNotifications.length})
              </TabsTrigger>
              <TabsTrigger value="read">
                Lidas ({readNotifications.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card>
                {notifications.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    Nenhuma notificação ainda
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="relative group">
                      <NotificationItem notification={notification} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </Card>
            </TabsContent>

            <TabsContent value="unread">
              <Card>
                {unreadNotifications.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    Nenhuma notificação não lida
                  </div>
                ) : (
                  unreadNotifications.map((notification) => (
                    <div key={notification.id} className="relative group">
                      <NotificationItem notification={notification} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </Card>
            </TabsContent>

            <TabsContent value="read">
              <Card>
                {readNotifications.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    Nenhuma notificação lida
                  </div>
                ) : (
                  readNotifications.map((notification) => (
                    <div key={notification.id} className="relative group">
                      <NotificationItem notification={notification} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
