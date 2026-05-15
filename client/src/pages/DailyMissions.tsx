import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Zap, Loader2, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function DailyMissions() {
  const { data: missions, isLoading, refetch } = trpc.missions.list.useQuery({});

  const completeMutation = trpc.missions.complete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Missão completada! 🎉");
    },
    onError: () => toast.error("Erro ao completar missão"),
  });

  function handleCompleteMission(missionId: number) {
    completeMutation.mutate({ id: missionId });
  }

  const completedCount = missions?.filter((m) => m.completedAt).length || 0;
  const totalCount = missions?.length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="w-6 h-6 text-purple-400" />
            Missões Diárias
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Complete missões para ganhar XP e moedas</p>
        </div>

        {/* Progresso do Dia */}
        <Card className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">Progresso Diário</p>
              <p className="text-sm font-semibold text-purple-400">
                {completedCount}/{totalCount}
              </p>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Missões */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : missions && missions.length > 0 ? (
          <div className="space-y-3">
            {missions.map((mission) => {
              const isCompleted = !!mission.completedAt;
              return (
                <Card
                  key={`mission-${mission.id}`}
                  className={`transition-all ${
                    isCompleted
                      ? "bg-green-900/10 border-green-500/30"
                      : "hover:border-primary/50"
                  }`}
                >
                  <CardContent className="pt-4 pb-4 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <Zap className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                        )}
                        <h3 className={`font-semibold ${isCompleted ? "text-muted-foreground line-through" : "text-foreground"}`}>
                          {mission.title}
                        </h3>
                      </div>
                      {mission.description && (
                        <p className="text-xs text-muted-foreground mt-1 ml-7">{mission.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 ml-7 text-xs">
                        <span className="text-yellow-400 font-medium">+{mission.rewardXp} XP</span>
                        <span className="text-amber-400 font-medium">+{mission.rewardCoins} moedas</span>
                      </div>
                    </div>
                    {!isCompleted && (
                      <Button
                        onClick={() => handleCompleteMission(mission.id)}
                        disabled={completeMutation.isPending}
                        className="flex-shrink-0"
                      >
                        {completeMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Completar"
                        )}
                      </Button>
                    )}
                    {isCompleted && (
                      <span className="text-xs font-medium text-green-400 bg-green-900/30 px-3 py-1 rounded flex-shrink-0">
                        ✓ Concluída
                      </span>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">Nenhuma missão disponível</p>
              <p className="text-muted-foreground text-xs mt-1">Volte amanhã para novas missões</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
