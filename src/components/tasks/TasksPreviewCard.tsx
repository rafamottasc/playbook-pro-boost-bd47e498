import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, ChevronRight, Coffee, Sunrise, Sun, Moon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasks } from "@/hooks/useTasks";
import { PriorityBadge } from "./PriorityBadge";
import { DynamicIcon } from "@/components/admin/DynamicIcon";

export function TasksPreviewCard() {
  const navigate = useNavigate();
  const { tasks, stats, isLoading, toggleTask } = useTasks();

  // Próximas 3 tarefas não concluídas com horário
  const upcomingTasks = tasks
    .filter(t => !t.done)
    .sort((a, b) => {
      if (a.scheduled_time && b.scheduled_time) {
        return a.scheduled_time.localeCompare(b.scheduled_time);
      }
      return 0;
    })
    .slice(0, 3);

  if (isLoading) {
    return (
      <Card className="shadow-comarc">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-comarc">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-primary" />
          Tarefas do Dia
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Progresso */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold text-primary">
              {stats.completed}/{stats.total}
            </span>
          </div>
          <Progress value={stats.completionRate} className="h-2" />
        </div>

        {/* Próximas tarefas */}
        {upcomingTasks.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Coffee className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma tarefa pendente</p>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            {upcomingTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer transition-colors group"
                onClick={() => navigate(`/tarefas?task=${task.id}`)}
              >
                <Checkbox 
                  checked={task.done}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTask(task.id, task.done);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-2 flex items-center gap-1">
                    {task.category && (
                      <DynamicIcon name={task.category.icon} className="w-3 h-3 flex-shrink-0" />
                    )}
                    <span className="line-clamp-2">{task.title}</span>
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {task.period === 'manha' ? <Sunrise className="w-3 h-3" /> : task.period === 'tarde' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                    {task.scheduled_time && ` ${task.scheduled_time}`}
                  </p>
                </div>
                <PriorityBadge priority={task.priority} size="sm" />
              </div>
            ))}
          </div>
        )}

        {/* Botão "Ver Todas" */}
        <Button
          variant="outline"
          className="w-full group"
          onClick={() => navigate('/tarefas')}
        >
          Ver Todas as Tarefas
          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}
