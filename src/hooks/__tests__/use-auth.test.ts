import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useAuth } from "@/hooks/use-auth";

// --- Mocks ---

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

// Typed imports after mocking
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockSignInAction = vi.mocked(signInAction);
const mockSignUpAction = vi.mocked(signUpAction);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

// --- Helpers ---

const anonWork = {
  messages: [{ role: "user", content: "hello" }],
  fileSystemData: { "/": { type: "directory" } },
};

const existingProjects = [
  { id: "proj-1", name: "My Project", createdAt: new Date(), updatedAt: new Date() },
  { id: "proj-2", name: "Older Project", createdAt: new Date(), updatedAt: new Date() },
];

const createdProject = {
  id: "new-proj-123",
  name: "New Design #42",
  userId: "user-1",
  messages: "[]",
  data: "{}",
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue(createdProject);
});

// ─────────────────────────────────────────────────────────────
// signIn
// ─────────────────────────────────────────────────────────────

describe("useAuth — signIn", () => {
  describe("happy path: successful sign-in", () => {
    it("returns the success result from the action", async () => {
      mockSignInAction.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());
      let returnValue;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "password123");
      });

      expect(returnValue).toEqual({ success: true });
    });

    it("calls the signIn server action with the correct credentials", async () => {
      mockSignInAction.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "s3cr3t!");
      });

      expect(mockSignInAction).toHaveBeenCalledOnce();
      expect(mockSignInAction).toHaveBeenCalledWith("user@example.com", "s3cr3t!");
    });

    it("sets isLoading to true while pending and false when done", async () => {
      let resolveSignIn!: (v: any) => void;
      mockSignInAction.mockReturnValue(new Promise((r) => (resolveSignIn = r)));

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.signIn("user@example.com", "password123");
      });
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn({ success: true });
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("post-sign-in routing: anon work exists", () => {
    it("creates a project from anon work, clears storage, and redirects", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ ...createdProject, id: "anon-proj-1" });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^Design from /),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
      expect(mockClearAnonWork).toHaveBeenCalledOnce();
      expect(mockPush).toHaveBeenCalledWith("/anon-proj-1");
    });

    it("does NOT call getProjects when anon work is present", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockGetProjects).not.toHaveBeenCalled();
    });
  });

  describe("post-sign-in routing: no anon work, existing projects", () => {
    it("redirects to the most recent (first) project", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue(existingProjects);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/proj-1");
      expect(mockCreateProject).not.toHaveBeenCalled();
    });
  });

  describe("post-sign-in routing: no anon work, no existing projects", () => {
    it("creates a blank project and redirects to it", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ ...createdProject, id: "blank-proj-99" });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/blank-proj-99");
    });
  });

  describe("error states", () => {
    it("returns the failure result and does NOT redirect", async () => {
      mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" });

      const { result } = renderHook(() => useAuth());
      let returnValue;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "wrongpassword");
      });

      expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("always resets isLoading to false even when the action fails", async () => {
      mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "wrongpassword");
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("always resets isLoading to false when the action throws", async () => {
      mockSignInAction.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password123").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("ignores anon work when messages array is empty", async () => {
      mockSignInAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue({ messages: [], fileSystemData: {} });
      mockGetProjects.mockResolvedValue(existingProjects);

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      // Should fall through to getProjects path
      expect(mockGetProjects).toHaveBeenCalledOnce();
      expect(mockPush).toHaveBeenCalledWith("/proj-1");
    });

    it("does not call handlePostSignIn when sign-in fails", async () => {
      mockSignInAction.mockResolvedValue({ success: false, error: "Bad creds" });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockGetProjects).not.toHaveBeenCalled();
      expect(mockCreateProject).not.toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────
// signUp
// ─────────────────────────────────────────────────────────────

describe("useAuth — signUp", () => {
  describe("happy path: successful sign-up", () => {
    it("returns the success result from the action", async () => {
      mockSignUpAction.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());
      let returnValue;
      await act(async () => {
        returnValue = await result.current.signUp("new@example.com", "StrongPass1");
      });

      expect(returnValue).toEqual({ success: true });
    });

    it("calls the signUp server action with the correct credentials", async () => {
      mockSignUpAction.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("new@example.com", "StrongPass1");
      });

      expect(mockSignUpAction).toHaveBeenCalledOnce();
      expect(mockSignUpAction).toHaveBeenCalledWith("new@example.com", "StrongPass1");
    });

    it("sets isLoading to true while pending and false when done", async () => {
      let resolveSignUp!: (v: any) => void;
      mockSignUpAction.mockReturnValue(new Promise((r) => (resolveSignUp = r)));

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.signUp("new@example.com", "StrongPass1");
      });
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp({ success: true });
      });
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("post-sign-up routing: anon work exists", () => {
    it("creates a project from anon work, clears storage, and redirects", async () => {
      mockSignUpAction.mockResolvedValue({ success: true });
      mockGetAnonWorkData.mockReturnValue(anonWork);
      mockCreateProject.mockResolvedValue({ ...createdProject, id: "anon-proj-2" });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("new@example.com", "StrongPass1");
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^Design from /),
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      });
      expect(mockClearAnonWork).toHaveBeenCalledOnce();
      expect(mockPush).toHaveBeenCalledWith("/anon-proj-2");
    });
  });

  describe("post-sign-up routing: no anon work, no projects (new user)", () => {
    it("creates a blank project and redirects to it", async () => {
      mockSignUpAction.mockResolvedValue({ success: true });
      mockGetProjects.mockResolvedValue([]);
      mockCreateProject.mockResolvedValue({ ...createdProject, id: "fresh-proj-1" });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("new@example.com", "StrongPass1");
      });

      expect(mockCreateProject).toHaveBeenCalledWith({
        name: expect.stringMatching(/^New Design #/),
        messages: [],
        data: {},
      });
      expect(mockPush).toHaveBeenCalledWith("/fresh-proj-1");
    });
  });

  describe("error states", () => {
    it("returns the failure result and does NOT redirect", async () => {
      mockSignUpAction.mockResolvedValue({
        success: false,
        error: "Email already registered",
      });

      const { result } = renderHook(() => useAuth());
      let returnValue;
      await act(async () => {
        returnValue = await result.current.signUp("existing@example.com", "StrongPass1");
      });

      expect(returnValue).toEqual({ success: false, error: "Email already registered" });
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("always resets isLoading to false even when the action fails", async () => {
      mockSignUpAction.mockResolvedValue({ success: false, error: "Email already registered" });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("existing@example.com", "StrongPass1");
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("always resets isLoading to false when the action throws", async () => {
      mockSignUpAction.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("new@example.com", "StrongPass1").catch(() => {});
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("does not call handlePostSignIn when sign-up fails", async () => {
      mockSignUpAction.mockResolvedValue({ success: false, error: "Something went wrong" });

      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.signUp("new@example.com", "StrongPass1");
      });

      expect(mockGetAnonWorkData).not.toHaveBeenCalled();
      expect(mockGetProjects).not.toHaveBeenCalled();
      expect(mockCreateProject).not.toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────
// isLoading initial state
// ─────────────────────────────────────────────────────────────

describe("useAuth — initial state", () => {
  it("starts with isLoading set to false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  it("exposes signIn and signUp as functions", () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
  });
});
