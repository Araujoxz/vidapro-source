import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Target,
  Wallet,
  Dumbbell,
  Flame,
  Zap,
  BookOpen,
  ShoppingBag,
  Trophy,
  Calendar,
  Salad,
} from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="level-badge w-9 h-9 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-foreground">Vida Pro</span>
        </div>
        <Button
          onClick={() => {
            window.location.href = getLoginUrl();
          }}
          size="sm"
        >
          Entrar
        </Button>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="level-badge w-24 h-24 rounded-3xl flex items-center justify-center mb-8 shadow-2xl">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-4 leading-tight">
          Sua vida,
          <br />
          <span className="text-primary">gamificada.</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mb-10">
          Gerencie hábitos, finanças, treinos, dieta e foco em um único lugar. Ganhe XP, suba de
          nível e conquiste seus objetivos.
        </p>
        <Button
          onClick={() => {
            window.location.href = getLoginUrl();
          }}
          size="lg"
          className="px-10 py-6 text-lg shadow-xl"
        >
          <Zap className="w-5 h-5 mr-2" />
          Começar agora — é grátis
        </Button>

        {/* Features grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl w-full">
          {[
            { icon: Target, label: "Hábitos", desc: "Streak e XP" },
            { icon: Wallet, label: "Finanças", desc: "Controle total" },
            { icon: Dumbbell, label: "Treinos", desc: "Progressão" },
            { icon: Salad, label: "Dieta", desc: "Macros e calorias" },
            { icon: Flame, label: "Foco", desc: "Pomodoro" },
            { icon: BookOpen, label: "Estudos", desc: "Flashcards" },
            { icon: Calendar, label: "Calendário", desc: "Eventos" },
            { icon: ShoppingBag, label: "Loja", desc: "Recompensas" },
            { icon: Trophy, label: "Conquistas", desc: "Badges" },
            { icon: Sparkles, label: "Missões", desc: "Diárias" },
            { icon: Zap, label: "Gamificação", desc: "Níveis e moedas" },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:border-primary/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-sm text-foreground">{label}</span>
              <span className="text-xs text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
