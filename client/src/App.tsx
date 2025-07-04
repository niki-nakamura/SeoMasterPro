import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppHeader } from "@/components/layout/app-header";
import { Sidebar } from "@/components/layout/sidebar";
import Dashboard from "@/pages/dashboard";
import ContentGenerator from "@/pages/content-generator";
import Articles from "@/pages/articles";
import MyArticles from "@/pages/my-articles";
import Settings from "@/pages/settings";
import Chat from "@/pages/chat";
import AuthCallback from "@/pages/auth/callback";
import TestPage from "@/pages/test-page";
import NotFound from "@/pages/not-found";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <div className="flex pt-16">
        <Sidebar />
        <main className="ml-64 flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <AppLayout><Dashboard /></AppLayout>} />
      <Route path="/content-generator" component={ContentGenerator} />
      <Route path="/content-generator/:id" component={ContentGenerator} />
      <Route path="/my-articles" component={() => <AppLayout><MyArticles /></AppLayout>} />
      <Route path="/articles" component={() => <AppLayout><Articles /></AppLayout>} />
      <Route path="/analytics" component={() => <AppLayout><div>Analytics coming soon...</div></AppLayout>} />
      <Route path="/settings" component={() => <AppLayout><Settings /></AppLayout>} />
      <Route path="/chat" component={Chat} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/test" component={TestPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProtectedRoute>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ProtectedRoute>
    </QueryClientProvider>
  );
}

export default App;
