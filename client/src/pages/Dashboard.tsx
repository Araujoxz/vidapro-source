import { useState } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  Wallet,
  Dumbbell,
  Salad,
  Flame,
  BookOpen,
  Calendar,
  ShoppingBag,
  Trophy,
  TrendingUp,
  TrendingDown,
  Star,
  Zap,
} from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading } = trpc.dashboard.summary.useQuery();

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground capitalize">{today}</h1>
          <p className="text-muted-foreground text-sm mt-1">Bem-vindo de volta! Veja seu resumo do dia.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Hábitos */}
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setLocation("/habits")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-purple-400" />
                Hábitos Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {summary?.habitsCompleted}/{summary?.habitsTotal}
                  </div>
                  <Progress
                    value={
                      summary && summary.habitsTotal > 0
                        ? (summary.habitsCompleted / summary.habitsTotal) * 100
                        : 0
                    }
                    className="mt-2 h-1.5"
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Finanças */}
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setLocation("/finances")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-green-400" />
                Saldo do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div
                    className={`text-2xl font-bold ${
                      (summary?.balance.balance ?? 0) >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    R$ {(summary?.balance.balance ?? 0).toFixed(2)}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs text-green-400 flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" />
                      R${(summary?.balance.income ?? 0).toFixed(0)}
                    </span>
                    <span className="text-xs text-red-400 flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3" />
                      R${(summary?.balance.expense ?? 0).toFixed(0)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Treinos */}
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setLocation("/workouts")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-blue-400" />
                Treinos Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {summary?.workoutsCount ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">séries registradas</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Refeições */}
          <Card
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setLocation("/diet")}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Salad className="w-3.5 h-3.5 text-emerald-400" />
                Refeições Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-foreground">
                    {summary?.mealsCount ?? 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(summary?.totalCalories ?? 0).toFixed(0)} kcal
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Gamification card */}
        {summary?.gam && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="level-badge w-12 h-12 rounded-2xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{summary.gam.level}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Nível {summary.gam.level}</p>
                    <p className="text-xs text-muted-foreground">
                      {summary.gam.xp % 100}/100 XP para o próximo nível
                    </p>
                    <Progress
                      value={(summary.gam.xp % 100)}
                      className="mt-1.5 h-1.5 w-32"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-bold text-yellow-400">{summary.gam.coins}</span>
                    <span className="text-xs text-muted-foreground">moedas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-bold text-orange-400">{summary.gam.currentStreak}</span>
                    <span className="text-xs text-muted-foreground">dias streak</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
            Acesso Rápido
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { icon: Target, label: "Hábitos", path: "/habits", color: "text-purple-400" },
              { icon: Wallet, label: "Finanças", path: "/finances", color: "text-green-400" },
              { icon: Dumbbell, label: "Treinos", path: "/workouts", color: "text-blue-400" },
              { icon: Salad, label: "Dieta", path: "/diet", color: "text-emerald-400" },
              { icon: Flame, label: "Foco", path: "/focus", color: "text-orange-400" },
              { icon: BookOpen, label: "Estudos", path: "/study", color: "text-cyan-400" },
              { icon: Calendar, label: "Calendário", path: "/calendar", color: "text-pink-400" },
              { icon: ShoppingBag, label: "Loja", path: "/shop", color: "text-yellow-400" },
              { icon: Trophy, label: "Conquistas", path: "/badges", color: "text-amber-400" },
              { icon: Star, label: "Missões", path: "/missions", color: "text-violet-400" },
            ].map(({ icon: Icon, label, path, color }) => (
              <button
                key={path}
                onClick={() => setLocation(path)}
                className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-accent transition-all"
              >
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="text-xs font-medium text-foreground">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
