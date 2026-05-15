import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Lock, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const ALL_BADGES = [
  { id: 1, name: "Primeiro Passo", description: "Complete seu primeiro hábito", icon: "👣" },
  { id: 2, name: "Semana Perfeita", description: "7 dias de streak", icon: "🔥" },
  { id: 3, name: "Mês Incrível", description: "30 dias de streak", icon: "⭐" },
  { id: 4, name: "Economista", description: "Registre 10 transações", icon: "💰" },
  { id: 5, name: "Atleta", description: "10 sessões de treino", icon: "💪" },
  { id: 6, name: "Nutricionista", description: "20 refeições registradas", icon: "🥗" },
  { id: 7, name: "Focado", description: "10 sessões Pomodoro", icon: "🎯" },
  { id: 8, name: "Estudioso", description: "20 horas de estudo", icon: "📚" },
  { id: 9, name: "Nível 5", description: "Atinja o nível 5", icon: "🏅" },
  { id: 10, name: "Milionário", description: "Acumule 1000 moedas", icon: "🪙" },
];

export default function Badges() {
  const { data: unlockedBadges, isLoading } = trpc.badges.list.useQuery();

  const unlockedIds = new Set(unlockedBadges?.map((b) => b.id) || []);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            Conquistas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Desbloqueie badges completando desafios</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ALL_BADGES.map((badge) => {
              const isUnlocked = unlockedIds.has(badge.id);
              return (
                <Card
                  key={`badge-${badge.id}`}
                  className={`transition-all ${
                    isUnlocked
                      ? "bg-gradient-to-br from-amber-900/30 to-yellow-900/20 border-amber-500/50 hover:border-amber-400"
                      : "opacity-50 border-border/50"
                  }`}
                >
                  <CardContent className="pt-6 pb-6 flex flex-col items-center text-center space-y-2">
                    <div
                      className={`text-4xl transition-transform ${
                        isUnlocked ? "scale-100" : "scale-75 opacity-50"
                      }`}
                    >
                      {isUnlocked ? badge.icon : <Lock className="w-8 h-8 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                        {badge.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                    </div>
                    {isUnlocked && (
                      <span className="text-xs font-medium text-amber-400 bg-amber-900/30 px-2 py-1 rounded mt-2">
                        ✓ Desbloqueado
                      </span>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
