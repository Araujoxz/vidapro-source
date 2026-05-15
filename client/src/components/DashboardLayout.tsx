import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import {
  LayoutDashboard,
  Target,
  Wallet,
  Dumbbell,
  Salad,
  Flame,
  BookOpen,
  Calendar,
  ShoppingBag,
  Trophy,
  Zap,
  Star,
  Menu,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import DashboardLayoutSkeleton from "./DashboardLayoutSkeleton";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", color: "text-primary" },
  { icon: Target, label: "Hábitos", path: "/habits", color: "text-purple-400" },
  { icon: Wallet, label: "Finanças", path: "/finances", color: "text-green-400" },
  { icon: Dumbbell, label: "Treinos", path: "/workouts", color: "text-blue-400" },
  { icon: Salad, label: "Dieta", path: "/diet", color: "text-emerald-400" },
  { icon: Flame, label: "Foco", path: "/focus", color: "text-orange-400" },
  { icon: BookOpen, label: "Estudos", path: "/study", color: "text-cyan-400" },
  { icon: Calendar, label: "Calendário", path: "/calendar", color: "text-pink-400" },
];

const bottomNavItems = [
  { icon: ShoppingBag, label: "Loja", path: "/shop", color: "text-yellow-400" },
  { icon: Trophy, label: "Conquistas", path: "/badges", color: "text-amber-400" },
  { icon: Star, label: "Missões", path: "/missions", color: "text-violet-400" },
];

function RedirectToLogin() {
  useEffect(() => {
    window.location.href = getLoginUrl();
  }, []);
  return null;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, loading, logout } = useAuth();
  const { theme, toggleTheme, switchable } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const { data: gam } = trpc.gamification.get.useQuery(undefined, {
    enabled: !!user,
  });

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    // Redirect outside render via useEffect is not needed here since
    // this is a conditional early return (not a side effect in render).
    // We use a simple redirect as this component is only rendered when auth is resolved.
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground text-sm">Redirecionando para login...</p>
          <RedirectToLogin />
        </div>
      </div>
    );
  }

  const xpToNextLevel = 100;
  const xpProgress = gam ? gam.xp % xpToNextLevel : 0;
  const activeLabel =
    [...navItems, ...bottomNavItems].find((i) => i.path === location)?.label ?? "Vida Pro";

  function NavLink({ item }: { item: (typeof navItems)[0] }) {
    const isActive = location === item.path;
    return (
      <button
        onClick={() => {
          setLocation(item.path);
          setSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-primary/20 text-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
      >
        <item.icon className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : item.color}`} />
        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
      </button>
    );
  }

  function SidebarInner() {
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="level-badge w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-sidebar-foreground">Vida Pro</span>
            </div>
          ) : (
            <div className="level-badge w-8 h-8 rounded-xl flex items-center justify-center mx-auto">
              <Zap className="w-4 h-4 text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Gamification bar */}
        {!sidebarCollapsed && gam && (
          <div className="px-4 py-3 border-b border-sidebar-border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-primary">Nv. {gam.level}</span>
              <span className="text-xs text-sidebar-foreground/50">
                {xpProgress}/{xpToNextLevel} XP
              </span>
            </div>
            <div className="h-1.5 bg-sidebar-border rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${(xpProgress / xpToNextLevel) * 100}%` }}
              />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-yellow-400 font-medium">
                <Zap className="w-3 h-3" />
                {gam.coins} moedas
              </span>
              <span className="flex items-center gap-1 text-xs text-orange-400 font-medium">
                <Flame className="w-3 h-3" />
                {gam.currentStreak} dias
              </span>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
          <div className="my-2 border-t border-sidebar-border" />
          {bottomNavItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3 border-t border-sidebar-border space-y-1">
          {switchable && (
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 shrink-0" />
              ) : (
                <Moon className="w-4 h-4 shrink-0" />
              )}
              {!sidebarCollapsed && (
                <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
              )}
            </button>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Sair</span>}
          </button>
          {!sidebarCollapsed && (
            <div className="px-3 pt-1">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/40 truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar desktop */}
      <aside
        className={`hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 shrink-0 ${
          sidebarCollapsed ? "w-16" : "w-56"
        }`}
      >
        <SidebarInner />
      </aside>

      {/* Sidebar mobile (drawer) */}
      {sidebarOpen && (
        <aside className="fixed left-0 top-0 z-50 flex flex-col w-64 h-full bg-sidebar border-r border-sidebar-border md:hidden">
          <SidebarInner />
        </aside>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-card shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-foreground/70 hover:text-foreground hover:bg-accent transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-foreground">{activeLabel}</span>
          {gam && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Nv.{gam.level}
              </span>
              <span className="flex items-center gap-0.5 text-xs text-yellow-400 font-medium">
                <Zap className="w-3 h-3" />
                {gam.coins}
              </span>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
