import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Habits from "./pages/Habits";
import Finances from "./pages/Finances";
import Workouts from "./pages/Workouts";
import Diet from "./pages/Diet";
import Focus from "./pages/Focus";
import Study from "./pages/Study";
import Shop from "./pages/Shop";
import Calendar from "./pages/Calendar";
import Badges from "./pages/Badges";
import DailyMissions from "./pages/DailyMissions";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/habits" component={Habits} />
      <Route path="/finances" component={Finances} />
      <Route path="/workouts" component={Workouts} />
      <Route path="/diet" component={Diet} />
      <Route path="/focus" component={Focus} />
      <Route path="/study" component={Study} />
      <Route path="/shop" component={Shop} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/badges" component={Badges} />
      <Route path="/missions" component={DailyMissions} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
