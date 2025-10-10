import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Check, Circle, Eye, EyeOff } from "lucide-react";

export function SecurityTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Observar senha em tempo real
  const password = form.watch("newPassword") || "";

  // Validações individuais para cada requisito
  const requirements = [
    { met: password.length >= 8, text: "Mínimo de 8 caracteres" },
    { met: /[A-Z]/.test(password), text: "Pelo menos uma letra maiúscula (A-Z)" },
    { met: /[a-z]/.test(password), text: "Pelo menos uma letra minúscula (a-z)" },
    { met: /[0-9]/.test(password), text: "Pelo menos um número (0-9)" },
  ];

  const onSubmit = async (data: ChangePasswordInput) => {
    console.log("onSubmit chamado com:", data);
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      form.reset();
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setIsLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.log("Erros de validação:", errors);
    const firstError = Object.values(errors)[0] as any;
    if (firstError?.message) {
      toast.error(firstError.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Segurança</CardTitle>
        <CardDescription>
          Altere sua senha para manter sua conta segura
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Digite sua nova senha"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-muted-foreground">A senha deve conter:</p>
                    {requirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 transition-all duration-200">
                        {req.met ? (
                          <Check className="h-4 w-4 text-green-600 animate-in zoom-in-50" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/50" />
                        )}
                        <span className={`text-sm transition-colors duration-200 ${
                          req.met ? "text-green-600 font-medium" : "text-muted-foreground"
                        }`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nova Senha</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirme sua nova senha"
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
