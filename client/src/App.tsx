import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "@/pages/landing";
import UserDashboard from "@/pages/user-dashboard";
import Dashboard from "@/pages/dashboard";
import ReceiptAnalysis from "@/pages/receipt-analysis";
import ReviewManagement from "@/pages/review-management";
import Reservations from "@/pages/reservations";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={UserDashboard} />
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/receipt-analysis" component={ReceiptAnalysis} />
      <Route path="/admin/review-management" component={ReviewManagement} />
      <Route path="/admin/reservations" component={Reservations} />
      <Route path="/admin/analytics" component={Dashboard} />
      <Route path="/admin/settings" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
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
