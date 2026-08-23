import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMock = vi.hoisted(() => ({
  createApplication: vi.fn(),
  createOwnedStudioForm: vi.fn(),
  createStudioResponse: vi.fn(),
  getOwnedStudioForm: vi.fn(),
  getPublishedStudioForm: vi.fn(),
  listApplications: vi.fn(),
  listOwnedStudioForms: vi.fn(),
  listOwnedStudioResponses: vi.fn(),
  setStudioFormStatus: vi.fn(),
  updateOwnedStudioForm: vi.fn(),
}));

vi.mock("./db", () => dbMock);

import { appRouter } from "./routers";

function contextFor(userId: number): TrpcContext {
  return {
    user: {
      id: userId,
      openId: "owner-" + userId,
      email: "owner" + userId + "@example.com",
      name: "Owner " + userId,
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

describe("Form Studio ownership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.getOwnedStudioForm.mockImplementation(async (ownerId: number) => ownerId === 101 ? {
      form: { id: 77, ownerId: 101, title: "Private owner form", slug: "private-owner-form", description: null, status: "draft", successMessage: "Done", redirectUrl: null, createdAt: new Date(), updatedAt: new Date() },
      questions: [],
    } : undefined);
  });

  it("returns a form only when the queried owner matches the authenticated user", async () => {
    const ownerCaller = appRouter.createCaller(contextFor(101));
    const result = await ownerCaller.studio.get({ formId: 77 });

    expect(result.form.ownerId).toBe(101);
    expect(dbMock.getOwnedStudioForm).toHaveBeenCalledWith(101, 77);
  });

  it("does not expose another owner’s form", async () => {
    const otherOwnerCaller = appRouter.createCaller(contextFor(202));

    await expect(otherOwnerCaller.studio.get({ formId: 77 })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(dbMock.getOwnedStudioForm).toHaveBeenCalledWith(202, 77);
  });
});
