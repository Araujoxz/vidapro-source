import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ---- GAMIFICATION ----
  gamification: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrCreateGamification(ctx.user.id);
    }),
  }),

  // ---- DASHBOARD ----
  dashboard: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date().toISOString().split("T")[0]!;
      const month = today.substring(0, 7);
      const [allHabits, habitLogsToday, balance, workoutsToday, mealsToday, gam] = await Promise.all([
        db.getHabits(ctx.user.id),
        db.getHabitLogsForDate(ctx.user.id, today),
        db.getMonthlyBalance(ctx.user.id, month),
        db.getWorkoutSets(ctx.user.id, today),
        db.getMeals(ctx.user.id, today),
        db.getOrCreateGamification(ctx.user.id),
      ]);
      return {
        habitsTotal: allHabits.length,
        habitsCompleted: habitLogsToday.length,
        balance,
        workoutsCount: workoutsToday.length,
        mealsCount: mealsToday.length,
        totalCalories: mealsToday.reduce((s, m) => s + m.calories, 0),
        gam,
      };
    }),
  }),

  // ---- HABITS ----
  habits: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const today = new Date().toISOString().split("T")[0]!;
      const [allHabits, logsToday] = await Promise.all([
        db.getHabits(ctx.user.id),
        db.getHabitLogsForDate(ctx.user.id, today),
      ]);
      const completedIds = new Set(logsToday.map((l) => l.habitId));
      return allHabits.map((h) => ({ ...h, completedToday: completedIds.has(h.id) }));
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        frequency: z.enum(["daily", "weekly"]).optional(),
        emotion: z.string().optional(),
        xpReward: z.number().optional(),
        coinReward: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createHabit(ctx.user.id, input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        frequency: z.enum(["daily", "weekly"]).optional(),
        emotion: z.string().optional(),
        xpReward: z.number().optional(),
        coinReward: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateHabit(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteHabit(input.id, ctx.user.id);
        return { success: true };
      }),
    toggle: protectedProcedure
      .input(z.object({ habitId: z.number(), date: z.string(), completed: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        if (input.completed) {
          const habit = (await db.getHabits(ctx.user.id)).find((h) => h.id === input.habitId);
          const logged = await db.logHabitCompletion(input.habitId, ctx.user.id, input.date);
          if (logged && habit) {
            await db.addXpAndCoins(ctx.user.id, habit.xpReward, habit.coinReward);
            await db.updateStreak(ctx.user.id);
          }
        } else {
          await db.unlogHabitCompletion(input.habitId, ctx.user.id, input.date);
        }
        return { success: true };
      }),
  }),

  // ---- FINANCES ----
  finances: router({
    list: protectedProcedure
      .input(z.object({ month: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getTransactions(ctx.user.id, input.month);
      }),
    balance: protectedProcedure
      .input(z.object({ month: z.string() }))
      .query(async ({ ctx, input }) => {
        return db.getMonthlyBalance(ctx.user.id, input.month);
      }),
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["income", "expense"]),
        amount: z.number().positive(),
        description: z.string().optional(),
        category: z.string().optional(),
        date: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createTransaction(ctx.user.id, input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTransaction(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ---- WORKOUTS ----
  workouts: router({
    list: protectedProcedure
      .input(z.object({ date: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getWorkoutSets(ctx.user.id, input.date);
      }),
    create: protectedProcedure
      .input(z.object({
        exercise: z.string().min(1),
        sets: z.number().min(1),
        reps: z.number().min(1),
        weight: z.number().min(0),
        date: z.string(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createWorkoutSet(ctx.user.id, input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteWorkoutSet(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ---- DIET ----
  diet: router({
    list: protectedProcedure
      .input(z.object({ date: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getMeals(ctx.user.id, input.date);
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        calories: z.number().min(0),
        protein: z.number().min(0),
        carbs: z.number().min(0),
        fat: z.number().min(0),
        date: z.string(),
        mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createMeal(ctx.user.id, input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteMeal(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ---- FOCUS SESSIONS ----
  focus: router({
    list: protectedProcedure
      .input(z.object({ date: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getFocusSessions(ctx.user.id, input.date);
      }),
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["focus", "break"]),
        durationMinutes: z.number().min(1),
        date: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createFocusSession(ctx.user.id, input);
      }),
  }),

  // ---- STUDY SESSIONS ----
  study: router({
    sessions: protectedProcedure
      .input(z.object({ date: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getStudySessions(ctx.user.id, input.date);
      }),
    createSession: protectedProcedure
      .input(z.object({
        subject: z.string().min(1),
        durationMinutes: z.number().min(1),
        notes: z.string().optional(),
        date: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createStudySession(ctx.user.id, input);
      }),
    deleteSession: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteStudySession(input.id, ctx.user.id);
        return { success: true };
      }),
    decks: protectedProcedure.query(async ({ ctx }) => {
      return db.getFlashcardDecks(ctx.user.id);
    }),
    createDeck: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createFlashcardDeck(ctx.user.id, input);
      }),
    deleteDeck: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteFlashcardDeck(input.id, ctx.user.id);
        return { success: true };
      }),
    flashcards: protectedProcedure
      .input(z.object({ deckId: z.number() }))
      .query(async ({ ctx, input }) => {
        return db.getFlashcards(input.deckId, ctx.user.id);
      }),
    createFlashcard: protectedProcedure
      .input(z.object({
        deckId: z.number(),
        front: z.string().min(1),
        back: z.string().min(1),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        nextReview: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createFlashcard(ctx.user.id, input);
      }),
    updateFlashcard: protectedProcedure
      .input(z.object({
        id: z.number(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        nextReview: z.string().optional(),
        reviewCount: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateFlashcard(id, ctx.user.id, data);
        return { success: true };
      }),
    deleteFlashcard: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteFlashcard(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ---- CALENDAR ----
  calendar: router({
    list: protectedProcedure
      .input(z.object({ date: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getCalendarEvents(ctx.user.id, input.date);
      }),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        date: z.string(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createCalendarEvent(ctx.user.id, input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        date: z.string().optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await db.updateCalendarEvent(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCalendarEvent(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  // ---- SHOP ----
  shop: router({
    items: publicProcedure.query(async () => {
      return db.getShopItems();
    }),
    redeems: protectedProcedure.query(async ({ ctx }) => {
      return db.getShopRedeems(ctx.user.id);
    }),
    redeem: protectedProcedure
      .input(z.object({ itemId: z.number(), coinsCost: z.number() }))
      .mutation(async ({ ctx, input }) => {
        return db.createShopRedeem(ctx.user.id, input.itemId, input.coinsCost);
      }),
  }),

  // ---- BADGES ----
  badges: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getBadges(ctx.user.id);
    }),
  }),

  // ---- DAILY MISSIONS ----
  missions: router({
    list: protectedProcedure
      .input(z.object({ date: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getDailyMissions(ctx.user.id, input.date);
      }),
    complete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const success = await db.completeDailyMission(input.id, ctx.user.id);
        return { success };
      }),
  }),

  // ---- USER SETTINGS ----
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrCreateUserSettings(ctx.user.id);
    }),
    update: protectedProcedure
      .input(z.object({
        theme: z.enum(["dark", "light"]).optional(),
        dietGoalCalories: z.number().optional(),
        dietGoalProtein: z.number().optional(),
        dietGoalCarbs: z.number().optional(),
        dietGoalFat: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserSettings(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ---- COACH IA ----
  coach: router({
    getDica: protectedProcedure.query(async ({ ctx }) => {
      const completionPercentage = await db.getHabitCompletionPercentage(ctx.user.id);

      // Se nao tiver chave OpenAI, retorna mock
      if (!process.env.OPENAI_API_KEY) {
        if (completionPercentage < 50) {
          return {
            dica: `Coach IA: Voce completou ${completionPercentage}% dos habitos hoje. Foca nos restantes! 💪`,
            isGenerated: false,
          };
        }
        return {
          dica: "Coach IA: Otimo trabalho! Continue assim e voce vai alcancar seus objetivos! 🚀",
          isGenerated: false,
        };
      }

      // Aqui entraria a integracao com LLM (Fase 2)
      return {
        dica: "Coach IA: Complete seus habitos hoje pra liberar dicas personalizadas",
        isGenerated: false,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
