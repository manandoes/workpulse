import { beforeEach, describe, expect, it, vi } from "vitest";
import { getActor } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  companyActor,
  createClient,
  createCompanyAccount,
  createEmployee,
  createProject,
  createTestCompany,
  jsonRequest,
} from "@/lib/test-helpers";
import { POST } from "./route";

/**
 * Route-handler tests (Phases.md Phase 12). Hit a real, migrated Postgres —
 * `npm run db:up` then `npm run db:migrate` first if running locally; this
 * repo's DATABASE_URL already points at one. Only `getActor` (who is signed
 * in) is mocked; the database and every permission check stay real. See
 * `lib/test-helpers.ts`.
 */
vi.mock("@/lib/auth", () => ({ getActor: vi.fn() }));

describe("POST /api/tasks", () => {
  beforeEach(() => {
    vi.mocked(getActor).mockReset();
  });

  it("lets an Owner raise a task on a project", async () => {
    const { companyId, ownerId } = await createTestCompany();
    const clientId = await createClient(companyId);
    const projectId = await createProject(companyId, clientId);
    vi.mocked(getActor).mockResolvedValue(
      companyActor(companyId, ownerId, "Owner")
    );

    const response = await POST(
      jsonRequest("http://localhost/api/tasks", "POST", {
        title: "Build the thing",
        projectId,
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.task).toMatchObject({
      title: "Build the thing",
      status: "Todo",
    });

    const stored = await db.task.findUnique({ where: { id: body.task.id } });
    expect(stored?.companyId).toBe(companyId);
  });

  it("lets a Manager raise a standalone task with no project", async () => {
    const { companyId } = await createTestCompany();
    const managerId = await createCompanyAccount(companyId, "Manager");
    vi.mocked(getActor).mockResolvedValue(
      companyActor(companyId, managerId, "Manager")
    );

    const response = await POST(
      jsonRequest("http://localhost/api/tasks", "POST", {
        title: "Quick personal to-do",
        projectId: "",
      })
    );

    expect(response.status).toBe(201);
    const body = await response.json();

    const stored = await db.task.findUnique({ where: { id: body.task.id } });
    expect(stored?.projectId).toBeNull();
    expect(stored?.createdById).toBe(managerId);
  });

  it("auto-adds an off-team employee to the project when assigned its task", async () => {
    const { companyId, ownerId } = await createTestCompany();
    const clientId = await createClient(companyId);
    const projectId = await createProject(companyId, clientId);
    const employeeId = await createEmployee(companyId);
    vi.mocked(getActor).mockResolvedValue(
      companyActor(companyId, ownerId, "Owner")
    );

    const response = await POST(
      jsonRequest("http://localhost/api/tasks", "POST", {
        title: "Hand this to someone new",
        projectId,
        assigneeId: employeeId,
      })
    );

    expect(response.status).toBe(201);

    const membership = await db.projectMember.findUnique({
      where: { projectId_employeeId: { projectId, employeeId } },
    });
    expect(membership).not.toBeNull();
  });

  it("refuses a Manager who does not lead the project", async () => {
    const { companyId } = await createTestCompany();
    const managerId = await createCompanyAccount(companyId, "Manager");
    const otherManagerId = await createCompanyAccount(companyId, "Manager");
    const clientId = await createClient(companyId);
    const projectId = await createProject(companyId, clientId, {
      leadAccountId: otherManagerId,
    });
    vi.mocked(getActor).mockResolvedValue(
      companyActor(companyId, managerId, "Manager")
    );

    const response = await POST(
      jsonRequest("http://localhost/api/tasks", "POST", {
        title: "Not my project",
        projectId,
      })
    );

    expect(response.status).toBe(403);
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(getActor).mockResolvedValue(null);

    const response = await POST(
      jsonRequest("http://localhost/api/tasks", "POST", {
        title: "No session",
        projectId: "does-not-matter",
      })
    );

    expect(response.status).toBe(401);
  });

  it("rejects a title that is too short with a field-keyed 400", async () => {
    const { companyId, ownerId } = await createTestCompany();
    vi.mocked(getActor).mockResolvedValue(
      companyActor(companyId, ownerId, "Owner")
    );

    const response = await POST(
      jsonRequest("http://localhost/api/tasks", "POST", {
        title: "ab",
        projectId: "whatever",
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe("validation_error");
    expect(body.fieldErrors).toHaveProperty("title");
  });
});
