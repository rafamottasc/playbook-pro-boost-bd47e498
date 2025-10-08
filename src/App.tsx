import React from "react";
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
import Admin from "./pages/Admin";
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
import PartnersManager from "./pages/admin/PartnersManager";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/pending-approval" element={<PendingApproval />} />
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
        path="/resources/training"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <AcademyModules />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources/training/:moduleId"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <ModuleLessons />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources/training/:moduleId/:lessonId"
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
