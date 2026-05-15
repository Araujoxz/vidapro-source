import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Salad, Plus, Trash2, X } from "lucide-react";

const MEAL_TYPES = [
  { value: "breakfast", label: "Café da manhã" },
  { value: "lunch", label: "Almoço" },
  { value: "dinner", label: "Jantar" },
  { value: "snack", label: "Lanche" },
] as const;

export default function Diet() {
  const utils = trpc.useUtils();
  const [selectedDate] = useState(() => new Date().toISOString().split("T")[0]!);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");

  const { data: meals, isLoading } = trpc.diet.list.useQuery({ date: selectedDate });

  const createMutation = trpc.diet.create.useMutation({
    onSuccess: () => {
      utils.diet.list.invalidate();
      utils.dashboard.summary.invalidate();
      setShowForm(false);
      setName(""); setCalories(""); setProtein(""); setCarbs(""); setFat("");
    },
  });

  const deleteMutation = trpc.diet.delete.useMutation({
    onSuccess: () => { utils.diet.list.invalidate(); utils.dashboard.summary.invalidate(); },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      calories: parseFloat(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      date: selectedDate,
      mealType,
    });
  }

  const totalCals = meals?.reduce((s, m) => s + m.calories, 0) ?? 0;
  const totalProtein = meals?.reduce((s, m) => s + m.protein, 0) ?? 0;
  const totalCarbs = meals?.reduce((s, m) => s + m.carbs, 0) ?? 0;
  const totalFat = meals?.reduce((s, m) => s + m.fat, 0) ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Salad className="w-6 h-6 text-emerald-400" />
              Dieta
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />Registrar refeição
          </Button>
        </div>

        {/* Macros summary */}
        {meals && meals.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Calorias", value: totalCals.toFixed(0), unit: "kcal", color: "text-orange-400" },
              { label: "Proteína", value: totalProtein.toFixed(1), unit: "g", color: "text-blue-400" },
              { label: "Carboidrato", value: totalCarbs.toFixed(1), unit: "g", color: "text-yellow-400" },
              { label: "Gordura", value: totalFat.toFixed(1), unit: "g", color: "text-red-400" },
            ].map(({ label, value, unit, color }) => (
              <Card key={label}>
                <CardContent className="pt-3 pb-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}<span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span></p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showForm && (
          <Card className="border-primary/40">
            <CardHeader className="pb-3"><CardTitle className="text-sm">Nova refeição</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  {MEAL_TYPES.map((mt) => (
                    <button key={mt.value} type="button" onClick={() => setMealType(mt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${mealType === mt.value ? "bg-primary/20 text-primary border border-primary/40" : "bg-secondary text-muted-foreground border border-border"}`}>
                      {mt.label}
                    </button>
                  ))}
                </div>
                <div>
                  <Label htmlFor="d-name">Nome</Label>
                  <Input id="d-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Frango com arroz" className="mt-1" autoFocus />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="d-cal">Calorias (kcal)</Label>
                    <Input id="d-cal" type="number" min="0" value={calories} onChange={(e) => setCalories(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="d-prot">Proteína (g)</Label>
                    <Input id="d-prot" type="number" min="0" step="0.1" value={protein} onChange={(e) => setProtein(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="d-carb">Carboidrato (g)</Label>
                    <Input id="d-carb" type="number" min="0" step="0.1" value={carbs} onChange={(e) => setCarbs(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="d-fat">Gordura (g)</Label>
                    <Input id="d-fat" type="number" min="0" step="0.1" value={fat} onChange={(e) => setFat(e.target.value)} className="mt-1" />
                  </div>
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
        ) : meals && meals.length > 0 ? (
          <div className="space-y-2">
            {meals.map((meal) => (
              <div key={meal.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Salad className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{meal.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {meal.calories.toFixed(0)} kcal · P:{meal.protein.toFixed(0)}g C:{meal.carbs.toFixed(0)}g G:{meal.fat.toFixed(0)}g
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {MEAL_TYPES.find(m => m.value === meal.mealType)?.label}
                </span>
                <button onClick={() => deleteMutation.mutate({ id: meal.id })} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Salad className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Nenhuma refeição registrada hoje.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-1" />Registrar refeição
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
