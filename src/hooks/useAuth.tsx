import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initializing: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, whatsapp: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isApproved: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const navigate = useNavigate();

  const checkAdminStatus = async (userId: string) => {
    console.log("[useAuth] Checking admin status for user:", userId);

    // Execute queries in parallel
    const [profileResult, roleResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("blocked, approved, avatar_url, whatsapp, team, profile_onboarding_completed")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle(),
    ]);

    const profile = profileResult.data;
    const profileError = profileResult.error;
    const role = roleResult.data;

    console.log("[useAuth] Profile data received:", profile);

    // Se não houver profile, criar um automaticamente
    if (!profile && !profileError) {
      console.warn("Profile not found for user, creating one...");
      const { error: insertError } = await supabase.from("profiles").insert({
        id: userId,
        full_name: user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário",
        email: user?.email || "",
        whatsapp: user?.user_metadata?.whatsapp || "",
        approved: false,
      });

      if (insertError) {
        console.error("Failed to create profile:", insertError);
      }

      navigate("/pending-approval");
      return;
    }

    if (profile?.blocked) {
      console.log("[useAuth] User is blocked, logging out");
      await supabase.auth.signOut();
      setIsAdmin(false);
      setIsApproved(false);
      setUser(null);
      setSession(null);
      navigate("/auth");
      toast({
        title: "Acesso Bloqueado",
        description: "Sua conta foi bloqueada. Entre em contato com o administrador.",
        variant: "destructive",
      });
      return;
    }

    const approved = profile?.approved || false;
    console.log("[useAuth] User approval status:", approved);
    setIsApproved(approved);

    if (!approved) {
      console.log("[useAuth] User not approved, setting states");
      setIsAdmin(false);
      return;
    }

    setIsAdmin(!!role);

    // Verificar se perfil está incompleto e redirecionar para /profile
    const isProfileIncomplete = !profile?.avatar_url || !profile?.whatsapp || !profile?.team;
    const currentPath = window.location.pathname;

    // Verificar se é a PRIMEIRA VEZ que o usuário acessa o sistema
    // (profile_onboarding_completed = FALSE)
    if (isProfileIncomplete && !profile?.profile_onboarding_completed) {
      if (currentPath !== "/profile" && currentPath !== "/auth") {
        console.log("[useAuth] First access detected, redirecting to /profile");

        setTimeout(() => {
          navigate("/profile");
          toast({
            title: "Complete seu perfil",
            description: "Por favor, atualize suas informações de perfil para continuar.",
          });
        }, 500);
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    let subscription: any;

    const initAuth = async () => {
      // Set up auth state listener
      const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsApproved(false);
        }
      });

      subscription = authSubscription.subscription;

      // Check for existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await checkAdminStatus(session.user.id);
      } else {
        setIsAdmin(false);
        setIsApproved(false);
      }

      setLoading(false);
      setInitializing(false);
    };

    initAuth();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { error };

    // ✅ Verificar bloqueio ANTES de estabelecer sessão completa
    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("blocked").eq("id", data.user.id).maybeSingle();

      // Se bloqueado, fazer logout imediato
      if (profile?.blocked) {
        await supabase.auth.signOut();
        return {
          error: {
            message: "blocked_account",
            status: 403,
          } as any,
        };
      }
    }

    if (data.session) {
      // If user doesn't want to be remembered, move session to sessionStorage
      if (!rememberMe) {
        // Get all supabase auth keys from localStorage
        const keys = Object.keys(localStorage).filter(
          (key) => key.includes("supabase.auth.token") || key.startsWith("sb-"),
        );

        // Move them to sessionStorage
        keys.forEach((key) => {
          const value = localStorage.getItem(key);
          if (value) {
            sessionStorage.setItem(key, value);
            localStorage.removeItem(key);
          }
        });
      }

      // Navigation is handled by Auth.tsx after initializing completes
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, fullName: string, whatsapp: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          whatsapp: whatsapp,
        },
        emailRedirectTo: `${window.location.protocol}//${window.location.host}/`,
      },
    });

    if (!error) {
      navigate("/");
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.protocol}//${window.location.host}/`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, initializing, signIn, signUp, signInWithGoogle, signOut, isAdmin, isApproved }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
