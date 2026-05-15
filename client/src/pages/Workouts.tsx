import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dumbbell, Plus, Trash2, X } from "lucide-react";

export default function Workouts() {
  const utils = trpc.useUtils();
  const [selectedDate] = useState(() => new Date().toISOString().split("T")[0]!);
  const [showForm, setShowForm] = useState(false);
  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [weight, setWeight] = useState("0");
  const [notes, setNotes] = useState("");

  const { data: workouts, isLoading } = trpc.workouts.list.useQuery({ date: selectedDate });

  const createMutation = trpc.workouts.create.useMutation({
    onSuccess: () => {
      utils.workouts.list.invalidate();
      utils.dashboard.summary.invalidate();
      setShowForm(false);
      setExercise(""); setSets("3"); setReps("10"); setWeight("0"); setNotes("");
    },
  });

  const deleteMutation = trpc.workouts.delete.useMutation({
    onSuccess: () => { utils.workouts.list.invalidate(); utils.dashboard.summary.invalidate(); },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!exercise.trim()) return;
    createMutation.mutate({
      exercise: exercise.trim(),
      sets: parseInt(sets) || 1,
      reps: parseInt(reps) || 1,
      weight: parseFloat(weight) || 0,
      date: selectedDate,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Dumbbell className="w-6 h-6 text-blue-400" />
              Treinos
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Registrar série
          </Button>
        </div>

        {showForm && (
          <Card className="border-primary/40">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Nova série</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="w-exercise">Exercício</Label>
                  <Input id="w-exercise" value={exercise} onChange={(e) => setExercise(e.target.value)} placeholder="Ex: Supino reto" className="mt-1" autoFocus />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="w-sets">Séries</Label>
                    <Input id="w-sets" type="number" min="1" value={sets} onChange={(e) => setSets(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="w-reps">Repetições</Label>
                    <Input id="w-reps" type="number" min="1" value={reps} onChange={(e) => setReps(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="w-weight">Peso (kg)</Label>
                    <Input id="w-weight" type="number" min="0" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="w-notes">Observações</Label>
                  <Input id="w-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" className="mt-1" />
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="submit" size="sm" disabled={createMutation.isPending}>Salvar</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="w-4 h-4 mr-1" />Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={`sk-${i}`} className="h-16 w-full rounded-xl" />)}</div>
        ) : workouts && workouts.length > 0 ? (
          <div className="space-y-2">
            {workouts.map((w) => (
              <div key={w.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{w.exercise}</p>
                  <p className="text-xs text-muted-foreground">{w.sets} séries × {w.reps} reps {w.weight > 0 ? `@ ${w.weight}kg` : ""}</p>
                </div>
                <button onClick={() => deleteMutation.mutate({ id: w.id })} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma série registrada hoje.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-1" />Registrar primeiro exercício
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
