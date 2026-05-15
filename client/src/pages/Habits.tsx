import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Plus,
  Check,
  Flame,
  Zap,
  Trash2,
  Edit2,
  X,
} from "lucide-react";

const today = new Date().toISOString().split("T")[0]!;

export default function Habits() {
  const utils = trpc.useUtils();
  const { data: habits, isLoading } = trpc.habits.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createMutation = trpc.habits.create.useMutation({
    onSuccess: () => {
      utils.habits.list.invalidate();
      utils.dashboard.summary.invalidate();
      setShowForm(false);
      setName("");
      setDescription("");
    },
  });

  const updateMutation = trpc.habits.update.useMutation({
    onSuccess: () => {
      utils.habits.list.invalidate();
      setEditId(null);
      setName("");
      setDescription("");
    },
  });

  const deleteMutation = trpc.habits.delete.useMutation({
    onSuccess: () => {
      utils.habits.list.invalidate();
      utils.dashboard.summary.invalidate();
    },
  });

  const toggleMutation = trpc.habits.toggle.useMutation({
    onSuccess: () => {
      utils.habits.list.invalidate();
      utils.dashboard.summary.invalidate();
      utils.gamification.get.invalidate();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (editId !== null) {
      updateMutation.mutate({ id: editId, name: name.trim(), description: description.trim() || undefined });
    } else {
      createMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
    }
  }

  function startEdit(habit: { id: number; name: string; description?: string | null }) {
    setEditId(habit.id);
    setName(habit.name);
    setDescription(habit.description ?? "");
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditId(null);
    setName("");
    setDescription("");
  }

  const completedCount = habits?.filter((h) => h.completedToday).length ?? 0;
  const totalCount = habits?.length ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-400" />
              Hábitos
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {completedCount}/{totalCount} concluídos hoje
            </p>
          </div>
          <Button onClick={() => { setShowForm(true); setEditId(null); setName(""); setDescription(""); }} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Novo hábito
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="border-primary/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{editId ? "Editar hábito" : "Novo hábito"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="habit-name">Nome</Label>
                  <Input
                    id="habit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Meditar 10 minutos"
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <div>
                  <Label htmlFor="habit-desc">Descrição (opcional)</Label>
                  <Input
                    id="habit-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição do hábito"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editId ? "Salvar" : "Criar"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={cancelForm}>
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Habits list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={`sk-${i}`} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : habits && habits.length > 0 ? (
          <div className="space-y-3">
            {habits.map((habit) => (
              <Card
                key={habit.id}
                className={`transition-all ${habit.completedToday ? "border-green-500/40 bg-green-500/5" : ""}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Toggle button */}
                    <button
                      onClick={() =>
                        toggleMutation.mutate({
                          habitId: habit.id,
                          date: today,
                          completed: !habit.completedToday,
                        })
                      }
                      disabled={toggleMutation.isPending}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        habit.completedToday
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {habit.completedToday && <Check className="w-4 h-4" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${habit.completedToday ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {habit.name}
                      </p>
                      {habit.description && (
                        <p className="text-xs text-muted-foreground truncate">{habit.description}</p>
                      )}
                    </div>

                    {/* Rewards */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        {habit.xpReward} XP
                      </Badge>
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Flame className="w-3 h-3 text-orange-400" />
                        {habit.coinReward}
                      </Badge>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(habit)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate({ id: habit.id })}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhum hábito cadastrado ainda.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setShowForm(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Criar primeiro hábito
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
