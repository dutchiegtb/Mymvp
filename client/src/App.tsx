import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Fantasy from "@/pages/Fantasy";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Settings from "@/pages/Settings";
import Roadmap from "@/pages/Roadmap";
import Admin from "@/pages/Admin";
import AmbassadorProgram from "@/pages/AmbassadorProgram";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/fantasy" component={Fantasy} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/settings" component={Settings} />
      <Route path="/roadmap" component={Roadmap} />
      <Route path="/admin" component={Admin} />
      <Route path="/ambassador" component={AmbassadorProgram} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useTokenRefresh();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
