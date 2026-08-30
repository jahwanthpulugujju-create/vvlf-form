import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

// Admin pages (lazy pattern — split into named imports for simplicity)
import AdminLogin from "./pages/admin/AdminLogin";
import Overview from "./pages/admin/Overview";
import Applications from "./pages/admin/Applications";
import Analytics from "./pages/admin/Analytics";
import Talent from "./pages/admin/Talent";
import Acquisition from "./pages/admin/Acquisition";
import Skills from "./pages/admin/Skills";
import AuditLog from "./pages/admin/AuditLog";

function Router() {
  return (
    <Switch>
      {/* Public form */}
      <Route path="/" component={Home} />

      {/* Admin */}
      <Route path="/admin" component={() => { window.location.href = "/admin/overview"; return null; }} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/overview" component={Overview} />
      <Route path="/admin/applications" component={Applications} />
      <Route path="/admin/analytics" component={Analytics} />
      <Route path="/admin/talent" component={Talent} />
      <Route path="/admin/acquisition" component={Acquisition} />
      <Route path="/admin/skills" component={Skills} />
      <Route path="/admin/audit" component={AuditLog} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
