import React, { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireApproved?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireApproved = true }: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();
  const [approvalLoading, setApprovalLoading] = useState(requireApproved);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const checkApproval = async () => {
      if (!user || !requireApproved) {
        setApprovalLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("approved")
        .eq("id", user.id)
        .maybeSingle();
      
      setIsApproved(profile?.approved || false);
      setApprovalLoading(false);
    };

    checkApproval();
  }, [user, requireApproved]);

  if (loading || approvalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireApproved && !isApproved) {
    return <Navigate to="/pending-approval" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
