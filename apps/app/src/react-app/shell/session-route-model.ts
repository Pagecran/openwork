import type { OpenworkWorkspaceInfo } from "../../app/lib/openwork-server";
import { workspaceServerId } from "../../app/lib/workspace-endpoint";
import { normalizeDirectoryPath } from "../../app/utils";

export type RouteWorkspaceModel = OpenworkWorkspaceInfo & {
  displayNameResolved: string;
};

export type WorkspaceSessionState = Record<string, unknown[]>;

function workspaceLabel(workspace: OpenworkWorkspaceInfo) {
  return (
    workspace.displayName?.trim() ||
    workspace.openworkWorkspaceName?.trim() ||
    workspace.name?.trim() ||
    workspace.path?.trim() ||
    "Workspace"
  );
}

function normalizeServerUrl(input?: string | null): string {
  const value = input?.trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString().replace(/\/+$/, "").toLowerCase();
  } catch {
    return value.replace(/\/+$/, "").toLowerCase();
  }
}

function workspaceRemoteUrl(workspace: OpenworkWorkspaceInfo): string {
  return normalizeServerUrl(workspace.baseUrl ?? workspace.openworkHostUrl ?? null);
}

function workspaceRuntimeIdentity(workspace: OpenworkWorkspaceInfo, fallbackServerUrl = ""): string {
  const runtimeId = workspaceServerId(workspace).trim();
  if (!runtimeId) return "";
  const serverUrl = workspaceRemoteUrl(workspace) || normalizeServerUrl(fallbackServerUrl);
  return serverUrl ? `${serverUrl}::${runtimeId}` : runtimeId;
}

function mergeServerIntoRemoteWorkspace(
  serverWorkspace: OpenworkWorkspaceInfo,
  remoteWorkspace: RouteWorkspaceModel,
): RouteWorkspaceModel {
  const merged: OpenworkWorkspaceInfo = {
    ...serverWorkspace,
    ...remoteWorkspace,
    id: remoteWorkspace.id,
    workspaceType: "remote",
    remoteType: remoteWorkspace.remoteType ?? "openwork",
    openworkWorkspaceId: remoteWorkspace.openworkWorkspaceId?.trim() || serverWorkspace.id,
    openworkWorkspaceName: remoteWorkspace.openworkWorkspaceName ?? serverWorkspace.openworkWorkspaceName ?? serverWorkspace.name,
    displayName: remoteWorkspace.displayName?.trim()
      ? remoteWorkspace.displayName
      : serverWorkspace.displayName,
    name: remoteWorkspace.name?.trim() ? remoteWorkspace.name : serverWorkspace.name,
    path: remoteWorkspace.path?.trim() ? remoteWorkspace.path : serverWorkspace.path,
  };
  return {
    ...merged,
    displayNameResolved: workspaceLabel(merged),
  };
}

export function buildWorkspaceIdAliases(
  workspaces: RouteWorkspaceModel[],
  serverBaseUrl = "",
): Record<string, string> {
  const aliases: Record<string, string> = {};
  const canonicalByIdentity = new Map<string, string>();
  for (const workspace of workspaces) {
    const identity = workspaceRuntimeIdentity(workspace, serverBaseUrl);
    if (!identity) continue;
    const current = canonicalByIdentity.get(identity);
    if (!current || workspace.workspaceType === "remote") {
      canonicalByIdentity.set(identity, workspace.id);
    }
  }
  for (const workspace of workspaces) {
    const identity = workspaceRuntimeIdentity(workspace, serverBaseUrl);
    if (!identity) continue;
    const canonical = canonicalByIdentity.get(identity);
    if (canonical && canonical !== workspace.id) aliases[workspace.id] = canonical;
    const serverId = workspaceServerId(workspace).trim();
    if (serverId && canonical && serverId !== canonical) aliases[serverId] = canonical;
  }
  return aliases;
}

export function normalizeWorkspaceId(id: string | null | undefined, aliases: Record<string, string>): string {
  const trimmed = id?.trim() ?? "";
  if (!trimmed) return "";
  return aliases[trimmed] ?? trimmed;
}

export function mergeWorkspaceSessionState(
  current: WorkspaceSessionState,
  aliases: Record<string, string>,
): WorkspaceSessionState {
  let changed = false;
  const next: WorkspaceSessionState = {};
  for (const [workspaceId, sessions] of Object.entries(current)) {
    const canonicalId = normalizeWorkspaceId(workspaceId, aliases);
    if (canonicalId !== workspaceId) changed = true;
    const existing = next[canonicalId] ?? [];
    const seenIds = new Set(existing.flatMap((session) => {
      if (typeof session !== "object" || session === null || !("id" in session)) return [];
      const value = session.id;
      return typeof value === "string" && value.trim() ? [value] : [];
    }));
    const additions = sessions.filter((session) => {
      if (typeof session !== "object" || session === null || !("id" in session)) return true;
      const value = session.id;
      if (typeof value !== "string" || !value.trim()) return true;
      if (seenIds.has(value)) {
        changed = true;
        return false;
      }
      seenIds.add(value);
      return true;
    });
    next[canonicalId] = existing.length > 0 ? [...existing, ...additions] : additions;
  }
  return changed ? next : current;
}

export function mergeRouteWorkspaces(
  serverWorkspaces: OpenworkWorkspaceInfo[],
  desktopWorkspaces: RouteWorkspaceModel[],
  serverBaseUrl = "",
): RouteWorkspaceModel[] {
  const remoteDesktopByRuntime = new Map(
    desktopWorkspaces.flatMap((workspace) => {
      if (workspace.workspaceType !== "remote") return [];
      const key = workspaceRuntimeIdentity(workspace, serverBaseUrl);
      return key ? [[key, workspace] as const] : [];
    }),
  );
  const desktopById = new Map(desktopWorkspaces.map((workspace) => [workspace.id, workspace]));
  const desktopByPath = new Map(
    desktopWorkspaces.flatMap((workspace) => {
      const path = normalizeDirectoryPath(workspace.path ?? "");
      return path ? [[path, workspace] as const] : [];
    }),
  );

  const usedDesktopIds = new Set<string>();
  const mergedServer: RouteWorkspaceModel[] = [];

  for (const workspace of serverWorkspaces) {
    const remoteMatch = remoteDesktopByRuntime.get(workspaceRuntimeIdentity(workspace, serverBaseUrl));
    if (remoteMatch) {
      usedDesktopIds.add(remoteMatch.id);
      mergedServer.push(mergeServerIntoRemoteWorkspace(workspace, remoteMatch));
      continue;
    }
    const match = desktopById.get(workspace.id) ?? desktopByPath.get(normalizeDirectoryPath(workspace.path ?? ""));
    if (match) usedDesktopIds.add(match.id);
    const merged = match
      ? {
          ...workspace,
          displayName: workspace.displayName?.trim()
            ? workspace.displayName
            : match.displayName,
          name: match.name?.trim() ? match.name : workspace.name,
        }
      : workspace;
    mergedServer.push({
      ...merged,
      displayNameResolved: workspaceLabel(merged),
    });
  }

  const mergedIds = new Set(mergedServer.map((workspace) => workspace.id));
  const mergedPaths = new Set(
    mergedServer.flatMap((workspace) => {
      const path = normalizeDirectoryPath(workspace.path ?? "");
      return path ? [path] : [];
    }),
  );

  const missingDesktop = desktopWorkspaces.filter((workspace) => {
    if (usedDesktopIds.has(workspace.id)) return false;
    if (mergedIds.has(workspace.id)) return false;
    const normalizedPath = normalizeDirectoryPath(workspace.path ?? "");
    if (normalizedPath && mergedPaths.has(normalizedPath)) return false;
    return true;
  });

  return [...mergedServer, ...missingDesktop];
}

export function orderRouteWorkspaces(workspaces: RouteWorkspaceModel[], orderIds: string[]): RouteWorkspaceModel[] {
  if (orderIds.length === 0) return workspaces;

  const aliases = buildWorkspaceIdAliases(workspaces);
  const workspaceById = new Map(workspaces.map((workspace) => [workspace.id, workspace]));
  const ordered: RouteWorkspaceModel[] = [];
  const usedIds = new Set<string>();

  for (const id of orderIds) {
    const canonicalId = normalizeWorkspaceId(id, aliases);
    const workspace = workspaceById.get(canonicalId);
    if (!workspace || usedIds.has(workspace.id)) continue;
    ordered.push(workspace);
    usedIds.add(workspace.id);
  }

  for (const workspace of workspaces) {
    if (usedIds.has(workspace.id)) continue;
    ordered.push(workspace);
  }

  return ordered;
}
