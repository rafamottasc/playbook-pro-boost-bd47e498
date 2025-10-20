import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import comarcLogo from "@/assets/logo-comarc.png";
import comarcLogoDark from "@/assets/logo-comarc-dark.png";
import { signInSchema, signUpSchema, resetPasswordSchema, translateAuthError } from "@/lib/validations";
import { unformatPhone } from "@/lib/utils";
import { ZodError } from "zod";
import { useTheme } from "next-themes";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { signIn, signUp, signInWithGoogle, user, initializing } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { theme } = useTheme();

  // Determinar qual logo usar baseado no tema
  const currentLogo = theme === 'dark' ? comarcLogoDark : comarcLogo;

  // Validações individuais para cada requisito de senha
  const requirements = [
    { met: password.length >= 8, text: "Mínimo de 8 caracteres" },
    { met: /[A-Z]/.test(password), text: "Pelo menos uma letra maiúscula (A-Z)" },
    { met: /[a-z]/.test(password), text: "Pelo menos uma letra minúscula (a-z)" },
    { met: /[0-9]/.test(password), text: "Pelo menos um número (0-9)" },
  ];

  useEffect(() => {
    // Only navigate after authentication state is fully initialized
    if (user && !initializing) {
      navigate("/");
    }
  }, [user, initializing, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = signInSchema.parse({ email, password });
      
      setLoading(true);
      const { error } = await signIn(validated.email, validated.password);
      setLoading(false);

      if (error) {
        // Tratamento específico para conta bloqueada
        if (error.message === "blocked_account") {
          toast({
            title: "Acesso Bloqueado",
            description: "Sua conta foi bloqueada. Entre em contato com o administrador.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no login",
            description: translateAuthError(error.message),
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      if (error instanceof ZodError) {
        toast({
          title: "Erro de validação",
          description: error.issues[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = signUpSchema.parse({ 
        email, 
        password, 
        fullName, 
        whatsapp: unformatPhone(whatsapp) 
      });
      
      setLoading(true);
      
      // Verificar se email ou whatsapp já existem
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('email, whatsapp')
        .or(`email.eq.${validated.email},whatsapp.eq.${validated.whatsapp}`)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        setLoading(false);
        toast({
          title: "Erro ao verificar dados",
          description: "Tente novamente mais tarde",
          variant: "destructive",
        });
        return;
      }
      
      if (existingProfile) {
        setLoading(false);
        const isDuplicateEmail = existingProfile.email === validated.email;
        toast({
          title: "Usuário já cadastrado",
          description: isDuplicateEmail 
            ? "Este e-mail já está em uso" 
            : "Este WhatsApp já está cadastrado",
          variant: "destructive",
        });
        return;
      }
      
      const { error } = await signUp(
        validated.email, 
        validated.password, 
        validated.fullName, 
        validated.whatsapp
      );
      setLoading(false);

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: translateAuthError(error.message),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Bem-vindo ao sistema COMARC",
        });
      }
    } catch (error) {
      if (error instanceof ZodError) {
        toast({
          title: "Erro de validação",
          description: error.issues[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { error } = await signInWithGoogle();
      setLoading(false);

      if (error) {
        toast({
          title: "Erro no login com Google",
          description: translateAuthError(error.message),
          variant: "destructive",
        });
      }
    } catch (error) {
      setLoading(false);
      toast({
        title: "Erro",
        description: "Não foi possível conectar com o Google",
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = resetPasswordSchema.parse({ email: resetEmail });

      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      setLoading(false);

      if (error) {
        toast({
          title: "Erro",
          description: translateAuthError(error.message),
          variant: "destructive",
        });
      } else {
        toast({
          title: "E-mail enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha",
        });
        setShowResetPassword(false);
        setResetEmail("");
      }
    } catch (error) {
      if (error instanceof ZodError) {
        toast({
          title: "Erro de validação",
          description: error.issues[0].message,
          variant: "destructive",
        });
      }
    }
  };

  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img 
                src={currentLogo} 
                alt="COMARC" 
                className="h-20 w-auto object-contain"
              />
            </div>
            <CardDescription>Digite seu e-mail para receber o link de recuperação</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">E-mail</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Link"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowResetPassword(false)}
              >
                Voltar ao Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={currentLogo} 
              alt="COMARC" 
              className="h-24 w-auto object-contain"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Cadastro</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-muted-foreground">A senha deve conter:</p>
                    {requirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 transition-all duration-200">
                        {req.met ? (
                          <Check className="h-3 w-3 text-green-600 animate-in zoom-in-50" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted-foreground/50" />
                        )}
                        <span className={`text-xs transition-colors duration-200 ${
                          req.met ? "text-green-600 font-medium" : "text-muted-foreground"
                        }`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuar com Google
                </Button>

                {/* Esqueci minha senha - NOVA POSIÇÃO */}
                <div className="text-center mt-4">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto"
                    onClick={() => setShowResetPassword(true)}
                  >
                    &gt; Esqueci minha senha
                  </Button>
                </div>

                {/* Não tem conta? Cadastre-se - NOVO */}
                <div className="text-center mt-2 text-sm text-muted-foreground">
                  Não tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("signup")}
                    className="font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    Cadastre-se
                  </button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="João Silva"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-whatsapp">WhatsApp</Label>
                  <Input
                    id="signup-whatsapp"
                    type="tel"
                    placeholder="(47) 99999-9999"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-muted-foreground">A senha deve conter:</p>
                    {requirements.map((req, index) => (
                      <div key={index} className="flex items-center gap-2 transition-all duration-200">
                        {req.met ? (
                          <Check className="h-3 w-3 text-green-600 animate-in zoom-in-50" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted-foreground/50" />
                        )}
                        <span className={`text-xs transition-colors duration-200 ${
                          req.met ? "text-green-600 font-medium" : "text-muted-foreground"
                        }`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Cadastrando..." : "Cadastrar"}
                </Button>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuar com Google
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
