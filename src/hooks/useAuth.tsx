import React, { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin status when user changes
        if (session?.user) {
          setTimeout(() => checkAdminStatus(session.user.id), 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAdminStatus(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    console.log('[useAuth] Checking admin status for user:', userId);
    
    // First check if user is blocked or not approved
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("blocked, approved")
      .eq("id", userId)
      .maybeSingle();
    
    console.log('[useAuth] Profile data received:', profile);

    // Se não houver profile, criar um automaticamente
    if (!profile && !profileError) {
      console.warn('Profile not found for user, creating one...');
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário',
          email: user?.email || '',
          whatsapp: user?.user_metadata?.whatsapp || '',
          approved: false,
        });
      
      if (insertError) {
        console.error('Failed to create profile:', insertError);
      }
      
      // Redirecionar para pending approval
      navigate("/pending-approval");
      return;
    }
    
    if (profile?.blocked) {
      // User is blocked - force logout
      console.log('[useAuth] User is blocked, logging out');
      await supabase.auth.signOut();
      setIsAdmin(false);
      setIsApproved(false);
      setUser(null);
      setSession(null);
      navigate("/auth");
      toast({
        title: "Acesso Bloqueado",
        description: "Sua conta foi bloqueada. Entre em contato com o administrador.",
        variant: "destructive"
      });
      return;
    }

    const approved = profile?.approved || false;
    console.log('[useAuth] User approval status:', approved);
    setIsApproved(approved);

    if (!approved) {
      // User is not approved
      console.log('[useAuth] User not approved, setting states');
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    // Check admin role
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    
    setIsAdmin(!!data);
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = true) => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (!error && data.session) {
      // If user doesn't want to be remembered, move session to sessionStorage
      if (!rememberMe) {
        // Get all supabase auth keys from localStorage
        const keys = Object.keys(localStorage).filter(key => 
          key.includes('supabase.auth.token') || key.startsWith('sb-')
        );
        
        // Move them to sessionStorage
        keys.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            sessionStorage.setItem(key, value);
            localStorage.removeItem(key);
          }
        });
      }
      
      navigate("/");
    }
    
    return { error };
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
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    
    if (!error) {
      navigate("/");
    }
    
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut, isAdmin, isApproved }}>
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
