import { useState, useEffect } from "react";
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
import { Check, Circle, Eye, EyeOff, AlertCircle, Shield } from "lucide-react";

export function SecurityTab() {
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
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

  // Validação em tempo real para verificar se as senhas coincidem
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "confirmPassword" && value.confirmPassword && value.newPassword) {
        if (value.newPassword !== value.confirmPassword) {
          form.setError("confirmPassword", {
            type: "manual",
            message: "As senhas não coincidem",
          });
        } else {
          form.clearErrors("confirmPassword");
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = async (data: ChangePasswordInput) => {
    console.log("onSubmit chamado com:", data);
    
    // Validação manual de senhas coincidentes
    if (data.newPassword !== data.confirmPassword) {
      toast.error("As senhas não coincidem");
      form.setError("confirmPassword", {
        type: "manual",
        message: "As senhas não coincidem",
      });
      return;
    }
    
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
    
    if (errors.newPassword) {
      toast.error(errors.newPassword.message);
    } else if (errors.confirmPassword) {
      toast.error(errors.confirmPassword.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Segurança
        </CardTitle>
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
                  {form.formState.errors.newPassword && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.newPassword.message}
                    </p>
                  )}
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
                  {form.formState.errors.confirmPassword && (
                    <div className="flex items-center gap-2 mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <p className="text-sm text-destructive font-medium">
                        {form.formState.errors.confirmPassword.message}
                      </p>
                    </div>
                  )}
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
