import {
  boolean,
  float,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ---- USERS ----
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---- GAMIFICATION ----
export const gamification = mysqlTable("gamification", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  xp: int("xp").default(0).notNull(),
  level: int("level").default(1).notNull(),
  coins: int("coins").default(0).notNull(),
  currentStreak: int("currentStreak").default(0).notNull(),
  longestStreak: int("longestStreak").default(0).notNull(),
  lastActivityDate: varchar("lastActivityDate", { length: 10 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Gamification = typeof gamification.$inferSelect;
export type InsertGamification = typeof gamification.$inferInsert;

// ---- HABITS ----
export const habits = mysqlTable("habits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  frequency: mysqlEnum("frequency", ["daily", "weekly"]).default("daily").notNull(),
  emotion: varchar("emotion", { length: 50 }),
  xpReward: int("xpReward").default(10).notNull(),
  coinReward: int("coinReward").default(5).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Habit = typeof habits.$inferSelect;
export type InsertHabit = typeof habits.$inferInsert;

// ---- HABIT LOGS ----
export const habitLogs = mysqlTable("habit_logs", {
  id: int("id").autoincrement().primaryKey(),
  habitId: int("habitId").notNull(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type HabitLog = typeof habitLogs.$inferSelect;
export type InsertHabitLog = typeof habitLogs.$inferInsert;

// ---- TRANSACTIONS (FINANCES) ----
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  amount: float("amount").notNull(),
  description: varchar("description", { length: 255 }),
  category: varchar("category", { length: 100 }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// ---- WORKOUT SETS ----
export const workoutSets = mysqlTable("workout_sets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  exercise: varchar("exercise", { length: 255 }).notNull(),
  sets: int("sets").default(1).notNull(),
  reps: int("reps").notNull(),
  weight: float("weight").default(0).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WorkoutSet = typeof workoutSets.$inferSelect;
export type InsertWorkoutSet = typeof workoutSets.$inferInsert;

// ---- MEALS (DIET) ----
export const meals = mysqlTable("meals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  calories: float("calories").default(0).notNull(),
  protein: float("protein").default(0).notNull(),
  carbs: float("carbs").default(0).notNull(),
  fat: float("fat").default(0).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  mealType: mysqlEnum("mealType", ["breakfast", "lunch", "dinner", "snack"]).default("lunch").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Meal = typeof meals.$inferSelect;
export type InsertMeal = typeof meals.$inferInsert;

// ---- FOCUS SESSIONS ----
export const focusSessions = mysqlTable("focus_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["focus", "break"]).default("focus").notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type FocusSession = typeof focusSessions.$inferSelect;
export type InsertFocusSession = typeof focusSessions.$inferInsert;

// ---- STUDY SESSIONS ----
export const studySessions = mysqlTable("study_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  notes: text("notes"),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type StudySession = typeof studySessions.$inferSelect;
export type InsertStudySession = typeof studySessions.$inferInsert;

// ---- FLASHCARD DECKS ----
export const flashcardDecks = mysqlTable("flashcard_decks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FlashcardDeck = typeof flashcardDecks.$inferSelect;
export type InsertFlashcardDeck = typeof flashcardDecks.$inferInsert;

// ---- FLASHCARDS ----
export const flashcards = mysqlTable("flashcards", {
  id: int("id").autoincrement().primaryKey(),
  deckId: int("deckId").notNull(),
  userId: int("userId").notNull(),
  front: text("front").notNull(),
  back: text("back").notNull(),
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium").notNull(),
  nextReview: varchar("nextReview", { length: 10 }).notNull(), // YYYY-MM-DD
  reviewCount: int("reviewCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = typeof flashcards.$inferInsert;

// ---- CALENDAR EVENTS ----
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  startTime: varchar("startTime", { length: 5 }), // HH:MM
  endTime: varchar("endTime", { length: 5 }), // HH:MM
  color: varchar("color", { length: 20 }).default("blue"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

// ---- SHOP ITEMS ----
export const shopItems = mysqlTable("shop_items", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  cost: int("cost").notNull(),
  icon: varchar("icon", { length: 50 }),
  category: varchar("category", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ShopItem = typeof shopItems.$inferSelect;
export type InsertShopItem = typeof shopItems.$inferInsert;

// ---- SHOP REDEEMS ----
export const shopRedeems = mysqlTable("shop_redeems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemId: int("itemId").notNull(),
  coinsCost: int("coinsCost").notNull(),
  redeemedAt: timestamp("redeemedAt").defaultNow().notNull(),
});
export type ShopRedeem = typeof shopRedeems.$inferSelect;
export type InsertShopRedeem = typeof shopRedeems.$inferInsert;

// ---- BADGES ----
export const badges = mysqlTable("badges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  type: varchar("type", { length: 50 }).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});
export type Badge = typeof badges.$inferSelect;
export type InsertBadge = typeof badges.$inferInsert;

// ---- DAILY MISSIONS ----
export const dailyMissions = mysqlTable("daily_missions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(),
  rewardXp: int("rewardXp").default(10).notNull(),
  rewardCoins: int("rewardCoins").default(5).notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DailyMission = typeof dailyMissions.$inferSelect;
export type InsertDailyMission = typeof dailyMissions.$inferInsert;

// ---- USER SETTINGS ----
export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  theme: mysqlEnum("theme", ["dark", "light"]).default("dark").notNull(),
  dietGoalCalories: float("dietGoalCalories").default(2000).notNull(),
  dietGoalProtein: float("dietGoalProtein").default(150).notNull(),
  dietGoalCarbs: float("dietGoalCarbs").default(200).notNull(),
  dietGoalFat: float("dietGoalFat").default(60).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;
