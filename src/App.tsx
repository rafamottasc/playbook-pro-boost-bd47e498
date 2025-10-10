import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Home from "./pages/Home";
import Playbooks from "./pages/Playbooks";
import Auth from "./pages/Auth";
import Resources from "./pages/Resources";
import Profile from "./pages/Profile";
import Campaigns from "./pages/Campaigns";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import PendingApproval from "./pages/PendingApproval";
import AcademyModules from "./pages/academy/AcademyModules";
import ModuleLessons from "./pages/academy/ModuleLessons";
import LessonView from "./pages/academy/LessonView";
import PartnersView from "./pages/campaigns/PartnersView";

// Lazy load only admin routes
const Admin = lazy(() => import("./pages/Admin"));
const PartnersManager = lazy(() => import("./pages/admin/PartnersManager"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes for fresh data
      gcTime: 1000 * 60 * 10, // 10 minutes cache retention
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AppRoutes() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route 
        path="/pending-approval" 
        element={
          <ProtectedRoute requireApproved={false}>
            <PendingApproval />
          </ProtectedRoute>
        } 
      />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <Home />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/playbooks"
                    element={
                      <ProtectedRoute>
                        <Playbooks />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requireAdmin>
                        <Admin />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/resources"
                    element={
                      <ProtectedRoute>
                        <Resources />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/campaigns"
                    element={
                      <ProtectedRoute>
                        <Campaigns />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/campaigns/partners"
                    element={
                      <ProtectedRoute>
                        <PartnersView />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/campaigns/partners"
                    element={
                      <ProtectedRoute requireAdmin>
                        <PartnersManager />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/notificacoes"
                    element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    }
                  />
      <Route
        path="/academy/modules"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <AcademyModules />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/academy/modules/:moduleId"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <ModuleLessons />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/academy/modules/:moduleId/:lessonId"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <LessonView />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <AppRoutes />
              </AuthProvider>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
