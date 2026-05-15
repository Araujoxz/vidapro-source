import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-phase2",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("FASE 2 - Focus Sessions", () => {
  it("should list focus sessions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.focus.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("FASE 2 - Study Sessions", () => {
  it("should list study sessions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.study.sessions({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("should list flashcard decks", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.study.decks();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("FASE 2 - Calendar", () => {
  it("should list calendar events", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.calendar.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("FASE 2 - Shop", () => {
  it("should list shop items", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.shop.items();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("FASE 2 - Badges", () => {
  it("should list badges", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.badges.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("FASE 2 - Daily Missions", () => {
  it("should list daily missions", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.missions.list({});
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("FASE 2 - User Settings", () => {
  it("should get or create user settings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.get();
    expect(result).toBeDefined();
  });
});

