import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { useTaskCategories } from "@/hooks/useTaskCategories";
import { cn } from "@/lib/utils";
import { IconPicker } from "@/components/admin/IconPicker";
import { DynamicIcon } from "@/components/admin/DynamicIcon";

const AVAILABLE_ICONS = [
  "Phone", "Home", "FileText", "RefreshCw", "Users", "Bookmark",
  "Briefcase", "Mail", "Calendar", "DollarSign", "Package", "Car",
  "Heart", "Target", "Star", "CheckSquare", "Clock", "Bell",
  "Award", "TrendingUp", "ShoppingBag", "Coffee", "Lightbulb", "Zap"
];

const AVAILABLE_COLORS = [
  { value: 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400', label: 'Vermelho' },
  { value: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400', label: 'Azul' },
  { value: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400', label: 'Verde' },
  { value: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400', label: 'Amarelo' },
  { value: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400', label: 'Roxo' },
  { value: 'bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-400', label: 'Rosa' },
  { value: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400', label: 'Índigo' },
  { value: 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-400', label: 'Laranja' },
  { value: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400', label: 'Cinza' },
];

export function CategoryManager() {
  const { categories, createCategory, deleteCategory } = useTaskCategories();
  const [newCategory, setNewCategory] = useState({
    label: '',
    icon: 'Bookmark',
    color: AVAILABLE_COLORS[0].value,
    display_order: categories.length,
  });

  const handleCreate = () => {
    if (!newCategory.label.trim()) return;
    createCategory(newCategory);
    setNewCategory({
      label: '',
      icon: 'Bookmark',
      color: AVAILABLE_COLORS[0].value,
      display_order: categories.length + 1,
    });
  };

  const customCategories = categories.filter(c => !c.is_system);
  const systemCategories = categories.filter(c => c.is_system);

  return (
    <div className="space-y-6">
      {/* Form para criar nova categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Nova Categoria</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Nome da Categoria</Label>
            <Input
              id="cat-name"
              placeholder="Ex: Documentação"
              value={newCategory.label}
              onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cat-icon">Ícone</Label>
              <IconPicker
                value={newCategory.icon}
                onChange={(value) => setNewCategory({ ...newCategory, icon: value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-color">Cor</Label>
              <Select
                value={newCategory.color}
                onValueChange={(value) => setNewCategory({ ...newCategory, color: value })}
              >
                <SelectTrigger id="cat-color">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_COLORS.map(color => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-4 h-4 rounded", color.value)} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleCreate} className="w-full">
            Adicionar Categoria
          </Button>
        </CardContent>
      </Card>

      {/* Lista de categorias do sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias Padrão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {systemCategories.map(cat => (
            <div
              key={cat.id}
              className={cn(
                "p-3 rounded-lg flex items-center justify-between",
                cat.color
              )}
            >
              <div className="flex items-center gap-2">
                <DynamicIcon name={cat.icon} className="w-4 h-4" />
                <span className="font-medium">{cat.label}</span>
              </div>
              <span className="text-xs opacity-60">Sistema</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Lista de categorias customizadas */}
      {customCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Minhas Categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {customCategories.map(cat => (
              <div
                key={cat.id}
                className={cn(
                  "p-3 rounded-lg flex items-center justify-between",
                  cat.color
                )}
              >
                <div className="flex items-center gap-2">
                  <DynamicIcon name={cat.icon} className="w-4 h-4" />
                  <span className="font-medium">{cat.label}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteCategory(cat.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
