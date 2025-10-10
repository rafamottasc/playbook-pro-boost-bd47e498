import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireApproved?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false, requireApproved = true }: ProtectedRouteProps) {
  const { user, loading, initializing, isAdmin, isApproved } = useAuth();

  console.log('[ProtectedRoute] Debug:', { user: user?.email, loading, initializing, isAdmin, isApproved, requireApproved });

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] Redirecting to /auth - no user');
    return <Navigate to="/auth" replace />;
  }

  // Se o usuário ESTÁ aprovado mas está na rota de pending-approval, redireciona para home
  if (!requireApproved && isApproved) {
    console.log('[ProtectedRoute] Redirecting approved user from pending-approval to home');
    return <Navigate to="/" replace />;
  }

  if (requireApproved && !isApproved) {
    console.log('[ProtectedRoute] Redirecting to /pending-approval - user not approved');
    // Add small delay to prevent flash
    setTimeout(() => {}, 50);
    return <Navigate to="/pending-approval" replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.log('[ProtectedRoute] Redirecting to / - user not admin');
    return <Navigate to="/" replace />;
  }

  console.log('[ProtectedRoute] Rendering children - all checks passed');
  return <>{children}</>;
}
