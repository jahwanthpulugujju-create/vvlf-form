import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createStandardUserContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "standard-user",
      email: "user@example.com",
      name: "Standard User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("application administration", () => {
  it("rejects a signed-in non-admin user from listing applicant records", async () => {
    const caller = appRouter.createCaller(createStandardUserContext());
    await expect(caller.application.list()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
