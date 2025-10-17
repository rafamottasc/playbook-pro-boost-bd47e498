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
import { PageTransition } from "@/components/PageTransition";
import { useThemeColors } from "@/hooks/useThemeColors";
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
import Calculator from "./pages/Calculator";
import CalculatorHistory from "./pages/CalculatorHistory";

// Lazy load only admin routes
const Admin = lazy(() => import("./pages/Admin"));
const PartnersManager = lazy(() => import("./pages/admin/PartnersManager"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 15, // 15 minutes - optimized for better caching
      gcTime: 1000 * 60 * 30, // 30 minutes - keep data in cache longer
      refetchOnWindowFocus: false, // Reduce unnecessary refetches
      retry: 1,
    },
  },
});

function ThemeLoader() {
  useThemeColors();
  return null;
}

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
                <ErrorBoundary>
                  <PageTransition>
                    <Playbooks />
                  </PageTransition>
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <ErrorBoundary>
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                    <Admin />
                  </Suspense>
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <PageTransition>
                    <Resources />
                  </PageTransition>
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <PageTransition>
                    <Profile />
                  </PageTransition>
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <PageTransition>
                    <Campaigns />
                  </PageTransition>
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns/partners"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <PageTransition>
                    <PartnersView />
                  </PageTransition>
                </ErrorBoundary>
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
            path="/calculator"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <PageTransition>
                    <Calculator />
                  </PageTransition>
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
                  <Route
                    path="/calculator/history"
                    element={
                      <ProtectedRoute>
                        <CalculatorHistory />
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ThemeLoader />
              <AppRoutes />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
