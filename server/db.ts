import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  gamification,
  habits,
  habitLogs,
  transactions,
  workoutSets,
  meals,
  focusSessions,
  studySessions,
  flashcardDecks,
  flashcards,
  calendarEvents,
  shopItems,
  shopRedeems,
  badges,
  dailyMissions,
  userSettings,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ---- USERS ----
export async function upsertUser(user: InsertUser): Promise<void> {
 if (!user.openId) {
  user.openId = "admin";
}
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ---- GAMIFICATION ----
export async function getOrCreateGamification(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(gamification).where(eq(gamification.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(gamification).values({ userId, xp: 0, level: 1, coins: 0, currentStreak: 0, longestStreak: 0 });
  const created = await db.select().from(gamification).where(eq(gamification.userId, userId)).limit(1);
  return created[0] ?? null;
}

export async function addXpAndCoins(userId: number, xp: number, coins: number) {
  const db = await getDb();
  if (!db) return null;
  const gam = await getOrCreateGamification(userId);
  if (!gam) return null;
  const newXp = gam.xp + xp;
  const newCoins = gam.coins + coins;
  const newLevel = Math.floor(newXp / 100) + 1;
  await db.update(gamification).set({ xp: newXp, coins: newCoins, level: newLevel }).where(eq(gamification.userId, userId));
  return { xp: newXp, coins: newCoins, level: newLevel };
}

export async function updateStreak(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const gam = await getOrCreateGamification(userId);
  if (!gam) return null;
  const today = new Date().toISOString().split("T")[0]!;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]!;
  let newStreak = gam.currentStreak;
  if (gam.lastActivityDate === today) return gam;
  if (gam.lastActivityDate === yesterday) {
    newStreak = gam.currentStreak + 1;
  } else {
    newStreak = 1;
  }
  const newLongest = Math.max(newStreak, gam.longestStreak);
  await db.update(gamification).set({ currentStreak: newStreak, longestStreak: newLongest, lastActivityDate: today }).where(eq(gamification.userId, userId));
  return { ...gam, currentStreak: newStreak, longestStreak: newLongest, lastActivityDate: today };
}

// ---- HABITS ----
export async function getHabits(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(habits).where(and(eq(habits.userId, userId), eq(habits.isActive, true))).orderBy(desc(habits.createdAt));
}

export async function createHabit(userId: number, data: { name: string; description?: string; frequency?: "daily" | "weekly"; emotion?: string; xpReward?: number; coinReward?: number }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(habits).values({ userId, name: data.name, description: data.description, frequency: data.frequency ?? "daily", emotion: data.emotion, xpReward: data.xpReward ?? 10, coinReward: data.coinReward ?? 5 });
  const result = await db.select().from(habits).where(eq(habits.userId, userId)).orderBy(desc(habits.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function updateHabit(id: number, userId: number, data: Partial<{ name: string; description: string; frequency: "daily" | "weekly"; emotion: string; xpReward: number; coinReward: number }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(habits).set(data).where(and(eq(habits.id, id), eq(habits.userId, userId)));
}

export async function deleteHabit(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(habits).set({ isActive: false }).where(and(eq(habits.id, id), eq(habits.userId, userId)));
}

export async function getHabitLogsForDate(userId: number, date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(habitLogs).where(and(eq(habitLogs.userId, userId), eq(habitLogs.date, date)));
}

export async function logHabitCompletion(habitId: number, userId: number, date: string) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db.select().from(habitLogs).where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.userId, userId), eq(habitLogs.date, date))).limit(1);
  if (existing.length > 0) return false;
  await db.insert(habitLogs).values({ habitId, userId, date });
  return true;
}

export async function unlogHabitCompletion(habitId: number, userId: number, date: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(habitLogs).where(and(eq(habitLogs.habitId, habitId), eq(habitLogs.userId, userId), eq(habitLogs.date, date)));
}

export async function getHabitLogsLast30Days(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]!;
  return db.select().from(habitLogs).where(and(eq(habitLogs.userId, userId), gte(habitLogs.date, thirtyDaysAgo))).orderBy(habitLogs.date);
}

// ---- FINANCES ----
export async function getTransactions(userId: number, month?: string) {
  const db = await getDb();
  if (!db) return [];
  if (month) {
    const [year, monthNum] = month.split("-").map(Number);
    const lastDay = new Date(year!, monthNum!, 0).getDate();
    return db.select().from(transactions).where(and(eq(transactions.userId, userId), gte(transactions.date, `${month}-01`), lte(transactions.date, `${month}-${String(lastDay).padStart(2, "0")}`))).orderBy(desc(transactions.createdAt));
  }
  return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt)).limit(50);
}

export async function createTransaction(userId: number, data: { type: "income" | "expense"; amount: number; description?: string; category?: string; date: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(transactions).values({ userId, ...data });
  const result = await db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function deleteTransaction(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(transactions).where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
}

export async function getMonthlyBalance(userId: number, month: string) {
  const db = await getDb();
  if (!db) return { income: 0, expense: 0, balance: 0 };
  if (!/^\d{4}-\d{2}$/.test(month)) return { income: 0, expense: 0, balance: 0 };
  const [year, monthNum] = month.split("-").map(Number);
  const lastDay = new Date(year!, monthNum!, 0).getDate();
  const txs = await db.select().from(transactions).where(and(eq(transactions.userId, userId), gte(transactions.date, `${month}-01`), lte(transactions.date, `${month}-${String(lastDay).padStart(2, "0")}`)));
  let income = 0;
  let expense = 0;
  for (const tx of txs) {
    if (tx.type === "income") income += tx.amount;
    else expense += tx.amount;
  }
  return { income, expense, balance: income - expense };
}

// ---- WORKOUTS ----
export async function getWorkoutSets(userId: number, date?: string) {
  const db = await getDb();
  if (!db) return [];
  if (date) return db.select().from(workoutSets).where(and(eq(workoutSets.userId, userId), eq(workoutSets.date, date))).orderBy(desc(workoutSets.createdAt));
  return db.select().from(workoutSets).where(eq(workoutSets.userId, userId)).orderBy(desc(workoutSets.createdAt)).limit(50);
}

export async function createWorkoutSet(userId: number, data: { exercise: string; sets: number; reps: number; weight: number; date: string; notes?: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(workoutSets).values({ userId, ...data });
  const result = await db.select().from(workoutSets).where(eq(workoutSets.userId, userId)).orderBy(desc(workoutSets.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function deleteWorkoutSet(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(workoutSets).where(and(eq(workoutSets.id, id), eq(workoutSets.userId, userId)));
}

// ---- MEALS ----
export async function getMeals(userId: number, date?: string) {
  const db = await getDb();
  if (!db) return [];
  if (date) return db.select().from(meals).where(and(eq(meals.userId, userId), eq(meals.date, date))).orderBy(desc(meals.createdAt));
  return db.select().from(meals).where(eq(meals.userId, userId)).orderBy(desc(meals.createdAt)).limit(50);
}

export async function createMeal(userId: number, data: { name: string; calories: number; protein: number; carbs: number; fat: number; date: string; mealType: "breakfast" | "lunch" | "dinner" | "snack" }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(meals).values({ userId, ...data });
  const result = await db.select().from(meals).where(eq(meals.userId, userId)).orderBy(desc(meals.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function deleteMeal(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(meals).where(and(eq(meals.id, id), eq(meals.userId, userId)));
}

// ---- FOCUS SESSIONS ----
export async function getFocusSessions(userId: number, date?: string) {
  const db = await getDb();
  if (!db) return [];
  if (date) return db.select().from(focusSessions).where(and(eq(focusSessions.userId, userId), eq(focusSessions.date, date))).orderBy(desc(focusSessions.completedAt));
  return db.select().from(focusSessions).where(eq(focusSessions.userId, userId)).orderBy(desc(focusSessions.completedAt)).limit(50);
}

export async function createFocusSession(userId: number, data: { type: "focus" | "break"; durationMinutes: number; date: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(focusSessions).values({ userId, ...data });
  const result = await db.select().from(focusSessions).where(eq(focusSessions.userId, userId)).orderBy(desc(focusSessions.completedAt)).limit(1);
  return result[0] ?? null;
}

// ---- STUDY SESSIONS ----
export async function getStudySessions(userId: number, date?: string) {
  const db = await getDb();
  if (!db) return [];
  if (date) return db.select().from(studySessions).where(and(eq(studySessions.userId, userId), eq(studySessions.date, date))).orderBy(desc(studySessions.createdAt));
  return db.select().from(studySessions).where(eq(studySessions.userId, userId)).orderBy(desc(studySessions.createdAt)).limit(50);
}

export async function createStudySession(userId: number, data: { subject: string; durationMinutes: number; notes?: string; date: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(studySessions).values({ userId, ...data });
  const result = await db.select().from(studySessions).where(eq(studySessions.userId, userId)).orderBy(desc(studySessions.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function deleteStudySession(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(studySessions).where(and(eq(studySessions.id, id), eq(studySessions.userId, userId)));
}

// ---- FLASHCARD DECKS ----
export async function getFlashcardDecks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(flashcardDecks).where(eq(flashcardDecks.userId, userId)).orderBy(desc(flashcardDecks.createdAt));
}

export async function createFlashcardDeck(userId: number, data: { name: string; description?: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(flashcardDecks).values({ userId, ...data });
  const result = await db.select().from(flashcardDecks).where(eq(flashcardDecks.userId, userId)).orderBy(desc(flashcardDecks.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function deleteFlashcardDeck(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(flashcardDecks).where(and(eq(flashcardDecks.id, id), eq(flashcardDecks.userId, userId)));
}

// ---- FLASHCARDS ----
export async function getFlashcards(deckId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(flashcards).where(and(eq(flashcards.deckId, deckId), eq(flashcards.userId, userId))).orderBy(flashcards.nextReview);
}

export async function createFlashcard(userId: number, data: { deckId: number; front: string; back: string; difficulty?: "easy" | "medium" | "hard"; nextReview: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(flashcards).values({ userId, ...data });
  const result = await db.select().from(flashcards).where(eq(flashcards.userId, userId)).orderBy(desc(flashcards.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function updateFlashcard(id: number, userId: number, data: Partial<{ difficulty: "easy" | "medium" | "hard"; nextReview: string; reviewCount: number }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(flashcards).set(data).where(and(eq(flashcards.id, id), eq(flashcards.userId, userId)));
}

export async function deleteFlashcard(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(flashcards).where(and(eq(flashcards.id, id), eq(flashcards.userId, userId)));
}

// ---- CALENDAR EVENTS ----
export async function getCalendarEvents(userId: number, date?: string) {
  const db = await getDb();
  if (!db) return [];
  if (date) return db.select().from(calendarEvents).where(and(eq(calendarEvents.userId, userId), eq(calendarEvents.date, date))).orderBy(calendarEvents.startTime);
  return db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)).orderBy(desc(calendarEvents.createdAt)).limit(100);
}

export async function createCalendarEvent(userId: number, data: { title: string; description?: string; date: string; startTime?: string; endTime?: string; color?: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(calendarEvents).values({ userId, ...data });
  const result = await db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)).orderBy(desc(calendarEvents.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function updateCalendarEvent(id: number, userId: number, data: Partial<{ title: string; description: string; date: string; startTime: string; endTime: string; color: string }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(calendarEvents).set(data).where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)));
}

export async function deleteCalendarEvent(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(calendarEvents).where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, userId)));
}

// ---- SHOP ITEMS ----
export async function getShopItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shopItems).where(eq(shopItems.isActive, true)).orderBy(shopItems.cost);
}

export async function createShopItem(data: { name: string; description?: string; cost: number; icon?: string; category?: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(shopItems).values(data);
  const result = await db.select().from(shopItems).orderBy(desc(shopItems.createdAt)).limit(1);
  return result[0] ?? null;
}

// ---- SHOP REDEEMS ----
export async function getShopRedeems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shopRedeems).where(eq(shopRedeems.userId, userId)).orderBy(desc(shopRedeems.redeemedAt));
}

export async function createShopRedeem(userId: number, itemId: number, coinsCost: number) {
  const db = await getDb();
  if (!db) return null;
  const gam = await getOrCreateGamification(userId);
  if (!gam || gam.coins < coinsCost) return null;
  await db.insert(shopRedeems).values({ userId, itemId, coinsCost });
  await db.update(gamification).set({ coins: gam.coins - coinsCost }).where(eq(gamification.userId, userId));
  const result = await db.select().from(shopRedeems).where(eq(shopRedeems.userId, userId)).orderBy(desc(shopRedeems.redeemedAt)).limit(1);
  return result[0] ?? null;
}

// ---- BADGES ----
export async function getBadges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(badges).where(eq(badges.userId, userId)).orderBy(desc(badges.unlockedAt));
}

export async function createBadge(userId: number, data: { name: string; description?: string; icon?: string; type: string }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(badges).values({ userId, ...data });
  const result = await db.select().from(badges).where(eq(badges.userId, userId)).orderBy(desc(badges.unlockedAt)).limit(1);
  return result[0] ?? null;
}

// ---- DAILY MISSIONS ----
export async function getDailyMissions(userId: number, date?: string) {
  const db = await getDb();
  if (!db) return [];
  if (date) return db.select().from(dailyMissions).where(and(eq(dailyMissions.userId, userId), eq(dailyMissions.date, date))).orderBy(dailyMissions.createdAt);
  const today = new Date().toISOString().split("T")[0]!;
  return db.select().from(dailyMissions).where(and(eq(dailyMissions.userId, userId), eq(dailyMissions.date, today))).orderBy(dailyMissions.createdAt);
}

export async function createDailyMission(userId: number, data: { date: string; title: string; description?: string; type: string; rewardXp?: number; rewardCoins?: number }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(dailyMissions).values({ userId, ...data });
  const result = await db.select().from(dailyMissions).where(eq(dailyMissions.userId, userId)).orderBy(desc(dailyMissions.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function completeDailyMission(id: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  const mission = (await db.select().from(dailyMissions).where(and(eq(dailyMissions.id, id), eq(dailyMissions.userId, userId))).limit(1))[0];
  if (!mission) return false;
  await db.update(dailyMissions).set({ completed: true, completedAt: new Date() }).where(eq(dailyMissions.id, id));
  if (mission.rewardXp || mission.rewardCoins) {
    await addXpAndCoins(userId, mission.rewardXp ?? 0, mission.rewardCoins ?? 0);
  }
  return true;
}

// ---- USER SETTINGS ----
export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function getOrCreateUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const existing = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(userSettings).values({ userId });
  const created = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  return created[0] ?? null;
}

export async function updateUserSettings(userId: number, data: Partial<{ theme: "dark" | "light"; dietGoalCalories: number; dietGoalProtein: number; dietGoalCarbs: number; dietGoalFat: number }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(userSettings).set(data).where(eq(userSettings.userId, userId));
}


// ---- COACH IA ----
export async function getHabitCompletionPercentage(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const today = new Date().toISOString().split("T")[0]!;

  // Pegar todos os hábitos do usuário
  const allHabits = await db.select().from(habits).where(eq(habits.userId, userId));
  if (allHabits.length === 0) return 100; // Se não tem hábitos, retorna 100%

  // Pegar logs de hoje
  const todayLogs = await db
    .select()
    .from(habitLogs)
    .where(and(eq(habitLogs.userId, userId), eq(habitLogs.date, today)));

  const completedHabitIds = new Set(todayLogs.map((log) => log.habitId));
  const completedCount = completedHabitIds.size;

  return Math.round((completedCount / allHabits.length) * 100);
}
