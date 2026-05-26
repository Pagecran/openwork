import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import type { OpenworkWorkspaceInfo } from "../src/app/lib/openwork-server";
import {
  buildWorkspaceIdAliases,
  mergeRouteWorkspaces,
  mergeWorkspaceSessionState,
  normalizeWorkspaceId,
} from "../src/react-app/shell/session-route-model";
import {
  normalizeRememberedWorkspaceSessions,
  readActiveWorkspaceId,
  readLastSessionFor,
  readWorkspaceOrderIds,
  writeActiveWorkspaceId,
  writeLastSessionFor,
  writeWorkspaceOrderIds,
} from "../src/react-app/shell/session-memory";

const originalWindow = globalThis.window;

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return Array.from(map.keys())[index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

function workspace(input: Partial<OpenworkWorkspaceInfo> & Pick<OpenworkWorkspaceInfo, "id">): OpenworkWorkspaceInfo {
  return {
    id: input.id,
    name: input.name ?? input.id,
    path: input.path ?? "",
    preset: input.preset ?? "default",
    workspaceType: input.workspaceType ?? "local",
    ...input,
  };
}

describe("session route workspace model", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: memoryStorage(),
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: originalWindow,
    });
  });

  test("merges remote desktop workspace with server runtime workspace on the same server", () => {
    const serverUrl = "http://vm158.example:8787";
    const remote = {
      ...workspace({
        id: "rem_ws_c52ddf65534b",
        workspaceType: "remote",
        remoteType: "openwork",
        baseUrl: serverUrl,
        openworkWorkspaceId: "ws_c52ddf65534b",
        displayName: "VM158 worker",
      }),
      displayNameResolved: "VM158 worker",
    };
    const merged = mergeRouteWorkspaces(
      [workspace({ id: "ws_c52ddf65534b", name: "Runtime workspace", path: "/runtime" })],
      [remote],
      serverUrl,
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]?.id).toBe("rem_ws_c52ddf65534b");
    expect(merged[0]?.workspaceType).toBe("remote");
    expect(merged[0]?.openworkWorkspaceId).toBe("ws_c52ddf65534b");
  });

  test("normalizes runtime workspace ids to the persisted remote id", () => {
    const serverUrl = "http://vm158.example:8787";
    const merged = mergeRouteWorkspaces(
      [workspace({ id: "ws_c52ddf65534b" })],
      [{
        ...workspace({
          id: "rem_ws_c52ddf65534b",
          workspaceType: "remote",
          remoteType: "openwork",
          baseUrl: serverUrl,
          openworkWorkspaceId: "ws_c52ddf65534b",
        }),
        displayNameResolved: "VM158 worker",
      }],
      serverUrl,
    );
    const aliases = buildWorkspaceIdAliases(merged, serverUrl);

    expect(normalizeWorkspaceId("ws_c52ddf65534b", aliases)).toBe("rem_ws_c52ddf65534b");
    expect(mergeWorkspaceSessionState({
      ws_c52ddf65534b: [{ id: "ses_1" }],
      rem_ws_c52ddf65534b: [{ id: "ses_1" }, { id: "ses_2" }],
    }, aliases)).toEqual({
      rem_ws_c52ddf65534b: [{ id: "ses_1" }, { id: "ses_2" }],
    });
  });

  test("normalizes remembered active workspace, session, and ordering state", () => {
    writeActiveWorkspaceId("ws_c52ddf65534b");
    writeLastSessionFor("ws_c52ddf65534b", "ses_remote");
    writeWorkspaceOrderIds(["local_ws", "ws_c52ddf65534b", "rem_ws_c52ddf65534b"]);

    normalizeRememberedWorkspaceSessions({ ws_c52ddf65534b: "rem_ws_c52ddf65534b" });

    expect(readActiveWorkspaceId()).toBe("rem_ws_c52ddf65534b");
    expect(readLastSessionFor("ws_c52ddf65534b")).toBeNull();
    expect(readLastSessionFor("rem_ws_c52ddf65534b")).toBe("ses_remote");
    expect(readWorkspaceOrderIds()).toEqual(["local_ws", "rem_ws_c52ddf65534b"]);
  });
});
